/**
 * Cloud Functions for PawSOS
 *
 * Functions:
 * - sendOtp: Generate 6-digit OTP, store in Firestore, send via email
 * - verifyOtp: Verify OTP, create Firebase user + Firestore document
 * - cleanupExpiredOtps: Scheduled cleanup of expired OTP documents
 * - deleteUserAccount: Secure, production-grade account deletion
 *   Preserves business records (orders, donations, SOS cases) via anonymization.
 *   Hard-deletes only personal profile data.
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically secure 6-digit OTP.
 */
function generateOtp() {
  return String(Math.floor(100000 + crypto.randomBytes(3).readUIntBE(0, 3) % 900000));
}

/**
 * Hash the OTP using SHA-256 so we never store the raw value.
 */
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Create a reusable Nodemailer transporter using Firebase Secrets.
 *
 * Required secrets (set via `firebase functions:secrets:set SMTP_HOST` etc.):
 *   SMTP_HOST     – e.g. smtp.gmail.com
 *   SMTP_PORT     – e.g. 587
 *   SMTP_USER     – e.g. info@animalsathi.com
 *   SMTP_PASS     – Gmail App Password or SMTP password
 *   SMTP_FROM     – sender address, e.g. info@animalsathi.com
 */
async function getTransporter() {
  const host     = process.env.SMTP_HOST || "smtp.gmail.com";
  const port     = parseInt(process.env.SMTP_PORT || "587", 10);
  const user     = process.env.SMTP_USER;
  const pass     = process.env.SMTP_PASS;
  const from     = process.env.SMTP_FROM || user;

  // If SMTP_USER / SMTP_PASS are not set, fall back to a placeholder so the
  // function doesn't crash during development.  You MUST set the secrets
  // before deploying to production.
  if (!user || !pass) {
    logger.warn(
      "SMTP_USER / SMTP_PASS secrets not set – using placeholder transport. " +
      "Set them with: firebase functions:secrets:set SMTP_USER SMTP_PASS"
    );
    // Return a fake transport that logs instead of sending.
    return {
      sendMail: (mailOptions) => {
        logger.info("=== FAKE EMAIL (no SMTP configured) ===", mailOptions);
        return Promise.resolve({ messageId: "fake" });
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  // Verify connection on first use
  await transporter.verify();
  return transporter;
}

// ---------------------------------------------------------------------------
// sendOtp  –  callable function
// ---------------------------------------------------------------------------

/**
 * Request a one-time password for email verification during signup.
 *
 * Request body:
 *   { email: string, name: string, password: string }
 *
 * Response:
 *   { success: true, verificationId: string, expiresAt: number }
 */
exports.sendOtp = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const functionStartTime = Date.now();
    const projectId = admin.app().options.projectId || process.env.GCLOUD_PROJECT || "UNKNOWN";
    const region = process.env.FUNCTION_REGION || "us-central1";

    logger.info("[PAWSOS-OTP] ════════════════════════════════════════════");
    logger.info("[PAWSOS-OTP] 🚀 sendOtp FUNCTION ENTRY", {
      functionName: "sendOtp",
      region,
      projectId,
      timestamp: new Date().toISOString(),
    });

    // -----------------------------------------------------------------------
    // 1. Input validation
    // -----------------------------------------------------------------------
    const { email, name, password } = request.data || {};

    logger.info("[PAWSOS-OTP] 📥 Request payload received", {
      hasEmail: !!email,
      emailProvided: email ? String(email).trim().toLowerCase() : "MISSING",
      hasName: !!name,
      hasPassword: !!password,
      passwordLength: password ? String(password).trim().length : 0,
    });

    if (!email || !name || !password) {
      logger.error("[PAWSOS-OTP] ❌ Input validation failed — missing fields", {
        email: !!email,
        name: !!name,
        password: !!password,
      });
      throw new HttpsError(
        "invalid-argument",
        "Email, name, and password are required."
      );
    }

    const emailStr = String(email).trim().toLowerCase();
    const nameStr  = String(name).trim();
    const passStr  = String(password);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      logger.error("[PAWSOS-OTP] ❌ Email validation failed", { email: emailStr });
      throw new HttpsError("invalid-argument", "Please enter a valid email address.");
    }

    if (nameStr.length < 1) {
      logger.error("[PAWSOS-OTP] ❌ Name validation failed");
      throw new HttpsError("invalid-argument", "Name is required.");
    }

    if (passStr.length < 6) {
      logger.error("[PAWSOS-OTP] ❌ Password validation failed");
      throw new HttpsError("invalid-argument", "Password must be at least 6 characters.");
    }

    logger.info("[PAWSOS-OTP] ✅ Input validation passed", { email: emailStr, name: nameStr });

    // -----------------------------------------------------------------------
    // 2. Check if email is already registered in Firebase Auth
    // -----------------------------------------------------------------------
    logger.info("[PAWSOS-OTP] 🔍 Checking if email already registered", { email: emailStr });
    try {
      await admin.auth().getUserByEmail(emailStr);
      logger.warn("[PAWSOS-OTP] ⚠️ Email already registered", { email: emailStr });
      throw new HttpsError("already-exists", "This email is already registered. Please log in.");
    } catch (err) {
      if (err.code !== "auth/user-not-found") {
        if (err instanceof HttpsError) {
          throw err;
        }
        logger.error("[PAWSOS-OTP] ❌ getUserByEmail unexpected error:", {
          code: err.code,
          message: err.message,
        });
        throw new HttpsError("internal", "Unable to verify email availability.");
      }
      logger.info("[PAWSOS-OTP] ✅ Email not registered — proceeding");
    }

    // -----------------------------------------------------------------------
    // 3. Rate limiting – max 3 OTP requests per email per 5 minutes
    // -----------------------------------------------------------------------
    logger.info("[PAWSOS-OTP] ⏱ Checking rate limit", { email: emailStr });
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    let recentOtpsSnap;
    try {
      recentOtpsSnap = await admin
        .firestore()
        .collection("otps")
        .where("email", "==", emailStr)
        .where("createdAt", ">", fiveMinutesAgo)
        .get();
      logger.info("[PAWSOS-OTP] 📊 Rate limit query result", {
        recentCount: recentOtpsSnap.size,
        maxAllowed: 3,
      });
    } catch (firestoreErr) {
      logger.error("[PAWSOS-OTP] ❌ Firestore rate-limit query failed");
      throw new HttpsError("internal", "Unable to verify request rate.");
    }

    if (recentOtpsSnap.size >= 3) {
      logger.warn("[PAWSOS-OTP] ⚠️ Rate limit exceeded");
      throw new HttpsError(
        "resource-exhausted",
        "Too many OTP requests. Please try again in a few minutes."
      );
    }

    // -----------------------------------------------------------------------
    // 4. Generate OTP and store in Firestore
    // -----------------------------------------------------------------------
    const otp        = generateOtp();
    const otpHash    = hashOtp(otp);
    const verificationId = crypto.randomUUID();

    logger.info("[PAWSOS-OTP] 🔑 OTP generated", {
      otpLength: otp.length,
      verificationId,
    });

    const otpData = {
      email: emailStr,
      name: nameStr,
      password: passStr,
      otpHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      verified: false,
    };

    logger.info("[PAWSOS-OTP] 💾 Writing OTP to Firestore");

    try {
      await admin.firestore().collection("otps").doc(verificationId).set(otpData);
      logger.info("[PAWSOS-OTP] ✅ Firestore write successful");
    } catch (firestoreWriteErr) {
      logger.error("[PAWSOS-OTP] ❌ Firestore write FAILED");
      throw new HttpsError("internal", "Failed to store verification data. Please try again.");
    }

    // -----------------------------------------------------------------------
    // 5. Send OTP via email
    // -----------------------------------------------------------------------
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    logger.info("[PAWSOS-OTP] 📧 Starting email send", {
      to: emailStr,
      smtpConfigured,
    });

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
        subject: "🐾 Your AnimalSathi Verification Code",
        text: `Hello ${nameStr},\n\nYour PawSOS verification code is:\n\n  ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, you can safely ignore this email.\n\n– Team PawSOS`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PawSOS Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f5ede0; font-family:'Segoe UI', Arial, sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5ede0; padding: 40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(156,62,35,0.10);">

          <!-- Header band -->
          <tr>
            <td style="background: linear-gradient(135deg, #9c3e23 0%, #c0522e 60%, #e07040 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <!-- Paw icon -->
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">🐾</div>
              <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700;
                          letter-spacing:0.5px;">Email Verification</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.80); font-size:13px;
                         letter-spacing:0.3px;">by AnimalSathi · Community Animal Rescue</p>
            </td>
          </tr>

          <!-- Divider accent -->
          <tr>
            <td style="height:4px;
                        background: linear-gradient(90deg, #FF5722, #ff8a50, #FF5722);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px 28px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hi ${nameStr} 👋
              </p>
              <p style="margin:0 0 28px; color:#666666; font-size:14px; line-height:1.6;">
                Thanks for joining <strong style="color:#9c3e23;">AnimalSathi</strong>! Use the
                verification code below to confirm your email address and activate your account.
              </p>

              <!-- OTP block -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #fff8f5 0%, #fef0e8 100%);
                                border: 2px dashed #e07040; border-radius:16px;
                                padding: 24px 32px; display:inline-block; text-align:center;
                                width:100%; box-sizing:border-box;">
                      <p style="margin:0 0 10px; color:#888888; font-size:11px;
                                 text-transform:uppercase; letter-spacing:2px; font-weight:600;">
                        Your Verification Code
                      </p>
                      <div style="font-size:42px; font-weight:800; letter-spacing:10px;
                                  color:#9c3e23; font-family:'Courier New', Courier, monospace;
                                  line-height:1.2;">
                        ${otp}
                      </div>
                      <p style="margin:12px 0 0; color:#aaaaaa; font-size:12px;">
                        ⏳ &nbsp;Expires in <strong>5 minutes</strong>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Info line -->
              <p style="margin:24px 0 0; color:#888888; font-size:12px; line-height:1.6;
                         text-align:center;">
                Enter this code on the app to complete sign-up.<br/>
                Do not share this code with anyone.
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #f0e8e0; margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 12px; color:#aaaaaa; font-size:11px; line-height:1.6;">
                If you didn't create a AnimalSathi account, you can safely ignore this email.<br/>
                This code was requested for <span style="color:#9c3e23;">${emailStr}</span>.
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India<br/>
                GL Bajaj Institute, Knowledge Park III, Greater Noida, UP
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>
`,
      };

      const smtpStartTime = Date.now();
      const sendResult = await transport.sendMail(mailOptions);
      const smtpDuration = Date.now() - smtpStartTime;

      logger.info("[PAWSOS-OTP] ✅ Email sent successfully", {
        to: emailStr,
        messageId: sendResult.messageId || "N/A",
        smtpDurationMs: smtpDuration,
      });

    } catch (emailError) {
      logger.error("[PAWSOS-OTP] ❌ EMAIL SEND FAILED");
      logger.error("[PAWSOS-OTP] ❌ error?.message:", emailError.message || "N/A");
      logger.error("[PAWSOS-OTP] ❌ error?.response:", emailError.response || "N/A");

      // Clean up the OTP doc since email delivery failed
      logger.info("[PAWSOS-OTP] 🧹 Cleaning up OTP document");
      try {
        await admin.firestore().collection("otps").doc(verificationId).delete();
      } catch (cleanupErr) {
        logger.error("[PAWSOS-OTP] ❌ Failed to clean up OTP document");
      }

      throw new HttpsError(
        "internal",
        "Failed to send verification email. Please try again."
      );
    }

    // -----------------------------------------------------------------------
    // 6. Return verificationId
    // -----------------------------------------------------------------------
    const expiresAtMs = Date.now() + 5 * 60 * 1000;
    const totalDuration = Date.now() - functionStartTime;

    logger.info("[PAWSOS-OTP] ✅ sendOtp completed successfully", {
      email: emailStr,
      totalDurationMs: totalDuration,
    });
    logger.info("[PAWSOS-OTP] ════════════════════════════════════════════");

    return {
      success: true,
      verificationId,
      expiresAt: expiresAtMs,
    };
  }
);

// ---------------------------------------------------------------------------
// verifyOtp  –  callable function
// ---------------------------------------------------------------------------

/**
 * Verify the OTP and create the Firebase user + Firestore document.
 *
 * Request body:
 *   { verificationId: string, otp: string }
 *
 * Response:
 *   { success: true }
 */
exports.verifyOtp = onCall(
  {
    secrets: [],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const functionStartTime = Date.now();
    const projectId = admin.app().options.projectId || "UNKNOWN";

    logger.info("[PAWSOS-OTP] ════════════════════════════════════════════");
    logger.info("[PAWSOS-OTP] 🚀 verifyOtp FUNCTION ENTRY", {
      functionName: "verifyOtp",
      projectId,
      timestamp: new Date().toISOString(),
    });

    // -----------------------------------------------------------------------
    // 1. Input validation
    // -----------------------------------------------------------------------
    const { verificationId, otp } = request.data || {};

    logger.info("[PAWSOS-OTP] 📥 Request payload received", {
      hasVerificationId: !!verificationId,
      hasOtp: !!otp,
      otpLength: otp ? String(otp).trim().length : 0,
    });

    if (!verificationId || !otp) {
      logger.error("[PAWSOS-OTP] ❌ Input validation failed");
      throw new HttpsError("invalid-argument", "Verification ID and OTP are required.");
    }

    const otpStr = String(otp).trim();
    if (!/^\d{6}$/.test(otpStr)) {
      logger.error("[PAWSOS-OTP] ❌ OTP format validation failed");
      throw new HttpsError("invalid-argument", "OTP must be a 6-digit number.");
    }

    logger.info("[PAWSOS-OTP] ✅ Input validation passed");

    // -----------------------------------------------------------------------
    // 2. Look up OTP document
    // -----------------------------------------------------------------------
    logger.info("[PAWSOS-OTP] 🔍 Looking up OTP document");

    const otpRef = admin.firestore().collection("otps").doc(verificationId);
    let otpSnap;
    try {
      otpSnap = await otpRef.get();
    } catch (readErr) {
      logger.error("[PAWSOS-OTP] ❌ Firestore read failed");
      throw new HttpsError("internal", "Failed to verify code. Please try again.");
    }

    if (!otpSnap.exists) {
      logger.error("[PAWSOS-OTP] ❌ OTP document NOT FOUND");
      throw new HttpsError("not-found", "Verification code not found. Please request a new one.");
    }

    const otpData = otpSnap.data();
    logger.info("[PAWSOS-OTP] ✅ OTP document found", {
      email: otpData.email,
    });

    // -----------------------------------------------------------------------
    // 3. Check if already verified
    // -----------------------------------------------------------------------
    if (otpData.verified === true) {
      logger.warn("[PAWSOS-OTP] ⚠️ OTP already used");
      throw new HttpsError("already-exists", "This code has already been used.");
    }

    logger.info("[PAWSOS-OTP] ✅ OTP not previously used");

    // -----------------------------------------------------------------------
    // 4. Check expiry
    // -----------------------------------------------------------------------
    const now = Date.now();
    const expiresAt = otpData.expiresAt?.toMillis ? otpData.expiresAt.toMillis() : otpData.expiresAt;

    logger.info("[PAWSOS-OTP] ⏱ Checking OTP expiry", {
      isExpired: expiresAt ? (now > expiresAt) : "UNKNOWN",
    });

    if (expiresAt && now > expiresAt) {
      logger.warn("[PAWSOS-OTP] ⚠️ OTP has expired");
      try {
        await otpRef.delete();
      } catch (deleteErr) {
        logger.error("[PAWSOS-OTP] ❌ Failed to delete expired OTP");
      }
      throw new HttpsError("deadline-exceeded", "OTP has expired. Please request a new one.");
    }

    logger.info("[PAWSOS-OTP] ✅ OTP is still valid");

    // -----------------------------------------------------------------------
    // 5. Check attempts (max 5)
    // -----------------------------------------------------------------------
    logger.info("[PAWSOS-OTP] 🔢 Checking attempt count", {
      currentAttempts: otpData.attempts,
    });

    if (otpData.attempts >= 5) {
      logger.warn("[PAWSOS-OTP] ⚠️ Max attempts exceeded");
      try {
        await otpRef.delete();
      } catch (deleteErr) {
        logger.error("[PAWSOS-OTP] ❌ Failed to delete max-attempts OTP");
      }
      throw new HttpsError(
        "permission-denied",
        "Too many failed attempts. Please request a new OTP."
      );
    }

    // -----------------------------------------------------------------------
    // 6. Verify OTP hash
    // -----------------------------------------------------------------------
    const inputHash = hashOtp(otpStr);

    logger.info("[PAWSOS-OTP] 🔐 Verifying OTP hash", {
      hashesMatch: inputHash === otpData.otpHash,
    });

    if (inputHash !== otpData.otpHash) {
      const newAttemptCount = (otpData.attempts || 0) + 1;
      logger.warn("[PAWSOS-OTP] ⚠️ OTP mismatch");

      try {
        await otpRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
      } catch (updateErr) {
        logger.error("[PAWSOS-OTP] ❌ Failed to update attempt counter");
      }

      const remaining = 4 - otpData.attempts;
      throw new HttpsError(
        "unauthenticated",
        remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many failed attempts. Please request a new OTP."
      );
    }

    logger.info("[PAWSOS-OTP] ✅ OTP hash matched");

    // -----------------------------------------------------------------------
    // 7. Create Firebase Auth user
    // -----------------------------------------------------------------------
    const { email, name, password } = otpData;

    logger.info("[PAWSOS-OTP] 👤 Creating Firebase Auth user", { email });

    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });

      logger.info("[PAWSOS-OTP] ✅ Firebase Auth user created", {
        uid: userRecord.uid,
        email: userRecord.email,
      });
    } catch (createErr) {
      logger.error("[PAWSOS-OTP] ❌ Firebase Auth user creation FAILED");
      logger.error("[PAWSOS-OTP] ❌ error?.code:", createErr.code || "N/A");
      logger.error("[PAWSOS-OTP] ❌ error?.message:", createErr.message || "N/A");

      if (createErr.code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "This email address is already registered.");
      }
      if (createErr.code === "auth/invalid-email") {
        throw new HttpsError("invalid-argument", "The email address is invalid.");
      }
      if (createErr.code === "auth/weak-password") {
        throw new HttpsError("invalid-argument", "The password is too weak.");
      }

      throw new HttpsError("internal", "Failed to create account. Please try again.");
    }

    // -----------------------------------------------------------------------
    // 8. Save Firestore user document
    // -----------------------------------------------------------------------
    const userRef = admin.firestore().collection("users").doc(userRecord.uid);

    logger.info("[PAWSOS-OTP] 💾 Saving user document to Firestore");

    try {
      await userRef.set({
        uid: userRecord.uid,
        name,
        email,
        photoURL: null,
        role: "user",
        volunteerApproved: false,
        volunteerStatus: null,
        ngoApproved: false,
        emailVerified: true,
        provider: "email",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("[PAWSOS-OTP] ✅ Firestore user document created", {
        uid: userRecord.uid,
      });
    } catch (firestoreErr) {
      logger.error("[PAWSOS-OTP] ❌ Firestore user document creation FAILED");

      logger.info("[PAWSOS-OTP] 🧹 Rolling back — deleting Firebase Auth user");
      try {
        await admin.auth().deleteUser(userRecord.uid);
      } catch (rollbackErr) {
        logger.error("[PAWSOS-OTP] ❌ Rollback FAILED");
      }

      throw new HttpsError("internal", "Account creation failed. Please try again.");
    }

    // -----------------------------------------------------------------------
    // 9. Clean up OTP document
    // -----------------------------------------------------------------------
    logger.info("[PAWSOS-OTP] 🧹 Cleaning up used OTP document");
    try {
      await otpRef.delete();
    } catch (cleanupErr) {
      logger.warn("[PAWSOS-OTP] ⚠️ Could not delete used OTP (non-fatal)");
    }

    const totalDuration = Date.now() - functionStartTime;
    logger.info("[PAWSOS-OTP] ✅ verifyOtp completed successfully", {
      uid: userRecord.uid,
      totalDurationMs: totalDuration,
    });
    logger.info("[PAWSOS-OTP] ════════════════════════════════════════════");

    return { success: true };
  }
);

// ---------------------------------------------------------------------------
// cleanupExpiredOtps  –  scheduled function
// ---------------------------------------------------------------------------

/**
 * Scheduled Cloud Function that deletes expired OTP documents.
 * Runs every 15 minutes.
 */
exports.cleanupExpiredOtps = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "UTC",
    maxInstances: 1,
  },
  async () => {
    const now = new Date();

    logger.info("[PAWSOS-OTP] 🧹 Running scheduled cleanup");

    const expiredSnap = await admin
      .firestore()
      .collection("otps")
      .where("expiresAt", "<", now)
      .get();

    if (expiredSnap.empty) {
      logger.info("[PAWSOS-OTP] No expired OTPs to clean up.");
      return;
    }

    const batch = admin.firestore().batch();
    expiredSnap.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();

    logger.info(`[PAWSOS-OTP] ✅ Cleaned up ${expiredSnap.size} expired OTP documents.`);
  }
);

// ---------------------------------------------------------------------------
// notifyVolunteerApprovalStatus  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends an email notification to a volunteer when their account is
 * approved or rejected by an admin.
 *
 * Reuses the same SMTP transporter and secrets as the OTP email system.
 * Approval/Rejection is never blocked by email delivery — failures are
 * logged and swallowed.
 *
 * Request body:
 *   { volunteerEmail: string, volunteerName: string, status: "approved" | "rejected", reason?: string }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.notifyVolunteerApprovalStatus = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const { volunteerEmail, volunteerName, status, reason } = request.data || {};

    logger.info("[PAWSOS-VOLUNTEER-NOTIFY] Sending volunteer status notification", {
      volunteerEmail,
      volunteerName,
      status,
      hasReason: !!reason,
    });

    // ── Input validation ──
    if (!volunteerEmail || !volunteerName || !status) {
      throw new HttpsError(
        "invalid-argument",
        "volunteerEmail, volunteerName, and status are required."
      );
    }

    if (status !== "approved" && status !== "rejected") {
      throw new HttpsError(
        "invalid-argument",
        'status must be "approved" or "rejected".'
      );
    }

    const emailStr = String(volunteerEmail).trim().toLowerCase();
    const nameStr = String(volunteerName).trim();
    const reasonStr = reason ? String(reason).trim() : "";

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
      };

      if (status === "approved") {
        mailOptions.subject = "Your Volunteer Application Has Been Approved — AnimalSathi";
        mailOptions.text = [
          `Hello ${nameStr},`,
          "",
          "Congratulations! Your volunteer application has been reviewed and approved by the AnimalSathi team.",
          "",
          "You are now part of our community of animal rescuers and helpers. Here's what you can do now:",
          "",
          "• Respond to SOS alerts and rescue requests in your area",
          "• Participate in community animal welfare events",
          "• Connect with other volunteers and animal lovers",
          "• Build your volunteer profile and track your impact",
          "",
          "If you have any questions or need support, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Volunteer Application Approved</title>
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(22,101,52,0.10);">
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">🎉</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Application Approved!</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Volunteer Community</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #22c55e, #86efac, #22c55e);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${nameStr} 🙌
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Congratulations! Your volunteer application has been <strong style="color:#16a34a;">reviewed and approved</strong>. You are now part of our community of animal rescuers and helpers.
              </p>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0 0 12px; color:#15803d; font-size:13px; font-weight:600;">
                  🌟 What you can do now:
                </p>
                <ul style="margin:0; padding-left:20px; color:#555; font-size:13px; line-height:1.8;">
                  <li>Respond to SOS alerts &amp; rescue requests in your area</li>
                  <li>Participate in community animal welfare events</li>
                  <li>Connect with other volunteers and animal lovers</li>
                  <li>Build your volunteer profile and track your impact</li>
                </ul>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #e0f2e0; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact us at <a href="mailto:info@animalsathi.com" style="color:#16a34a;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      } else {
        // status === "rejected"
        mailOptions.subject = "Update Regarding Your Volunteer Application — AnimalSathi";
        mailOptions.text = [
          `Hello ${nameStr},`,
          "",
          "Thank you for your interest in volunteering with AnimalSathi.",
          "",
          "After careful review, we regret to inform you that your volunteer application could not be approved at this time.",
          ...(reasonStr ? ["", `Reason: ${reasonStr}`, ""] : []),
          "This decision does not prevent you from reapplying in the future. If you believe there has been an error or would like to provide additional information, please contact our support team.",
          "",
          "You can reapply by visiting our platform and submitting a new application.",
          "",
          "If you have any questions, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Volunteer Application Update</title>
</head>
<body style="margin:0; padding:0; background-color:#fef2f2; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(220,38,38,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">ℹ️</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Application Update</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Volunteer Community</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #dc2626, #fca5a5, #dc2626);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${nameStr}
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Thank you for your interest in volunteering with <strong style="color:#991b1b;">AnimalSathi</strong>.
              </p>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0; color:#dc2626; font-size:13px; line-height:1.6;">
                  After careful review, we regret to inform you that your volunteer application could not be approved at this time.
                </p>
                ${reasonStr ? `<p style="margin:12px 0 0; color:#991b1b; font-size:13px; font-weight:600;">Reason: ${reasonStr}</p>` : ""}
              </div>
              <p style="margin:0 0 10px; color:#666; font-size:13px; line-height:1.6;">
                You can reapply at any time. If you have questions or updated information to share, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #fee2e2; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact our team at <a href="mailto:info@animalsathi.com" style="color:#dc2626;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      }

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[PAWSOS-VOLUNTEER-NOTIFY] Email sent successfully", {
        to: emailStr,
        status,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      // Email failure does NOT block the admin action — just log it
      logger.error("[PAWSOS-VOLUNTEER-NOTIFY] Email send failed (non-blocking):", {
        error: emailError.message || "N/A",
        volunteerEmail: emailStr,
        status,
      });
    }

    return {
      success: true,
      emailSent,
    };
  }
);

// ---------------------------------------------------------------------------
// notifyOrgApprovalStatus  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends an email notification to an organization (hospital/vet clinic) when
 * their Enterprise Partner application is approved or rejected by an admin.
 *
 * Reuses the same SMTP transporter and secrets as the OTP email system.
 * Approval/Rejection is never blocked by email delivery — failures are
 * logged and swallowed.
 *
 * Request body:
 *   { orgEmail: string, orgName: string, contactPerson: string, type: string, status: "approved" | "rejected", reason?: string }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.notifyOrgApprovalStatus = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const { orgEmail, orgName, contactPerson, type, status, reason } = request.data || {};

    logger.info("[PAWSOS-ORG-NOTIFY] Sending organization status notification", {
      orgEmail,
      orgName,
      contactPerson,
      type,
      status,
      hasReason: !!reason,
    });

    // ── Input validation ──
    if (!orgEmail || !orgName || !status) {
      throw new HttpsError(
        "invalid-argument",
        "orgEmail, orgName, and status are required."
      );
    }

    if (status !== "approved" && status !== "rejected") {
      throw new HttpsError(
        "invalid-argument",
        'status must be "approved" or "rejected".'
      );
    }

    const emailStr = String(orgEmail).trim().toLowerCase();
    const nameStr = String(orgName).trim();
    const contactStr = contactPerson ? String(contactPerson).trim() : "";
    const typeStr = type ? String(type).trim() : "organization";
    const reasonStr = reason ? String(reason).trim() : "";
    const greetingName = contactStr || nameStr;
    const entityTypeLabel = typeStr === "hospital" ? "Hospital" : typeStr === "vet" ? "Veterinary Clinic" : "Organization";

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
      };

      if (status === "approved") {
        mailOptions.subject = `Your ${entityTypeLabel} Registration Has Been Approved — AnimalSathi`;
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Congratulations! Your ${entityTypeLabel.toLowerCase()} "${nameStr}" has been verified and approved by the AnimalSathi Enterprise Partner team.`,
          "",
          `Your ${entityTypeLabel.toLowerCase()} can now access all Enterprise Partner features on the platform.`,
          "",
          "What you can do now:",
          "• Respond to SOS alerts and rescue coordination requests",
          "• Manage your staff and assign roles (vets, volunteers, admins)",
          "• Provide emergency and routine animal care services",
          "• Coordinate with NGOs, volunteers, and other partners",
          "• Showcase your facilities and capabilities on your profile",
          "",
          "If you have any questions or need support, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enterprise Partner Approved</title>
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(22,101,52,0.10);">
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">✅</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Enterprise Partner Approved!</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Enterprise Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #22c55e, #86efac, #22c55e);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName} 🙌
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Congratulations! Your ${entityTypeLabel.toLowerCase()} <strong style="color:#16a34a;">"${nameStr}"</strong> has been verified and approved as an AnimalSathi Enterprise Partner.
              </p>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0 0 12px; color:#15803d; font-size:13px; font-weight:600;">
                  ⚕️ What you can do now:
                </p>
                <ul style="margin:0; padding-left:20px; color:#555; font-size:13px; line-height:1.8;">
                  <li>Respond to SOS alerts &amp; rescue coordination requests</li>
                  <li>Manage your staff and assign roles</li>
                  <li>Provide emergency and routine animal care services</li>
                  <li>Coordinate with NGOs, volunteers, and other partners</li>
                  <li>Showcase your facilities and capabilities</li>
                </ul>
              </div>
              <p style="margin:0 0 16px; color:#666; font-size:13px; line-height:1.6;">
                Log in now to access your Enterprise Partner dashboard and start making a difference.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #e0f2e0; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact us at <a href="mailto:info@animalsathi.com" style="color:#16a34a;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      } else {
        // status === "rejected"
        mailOptions.subject = `Update Regarding Your ${entityTypeLabel} Registration — AnimalSathi`;
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Thank you for your interest in registering "${nameStr}" as an AnimalSathi Enterprise Partner.`,
          "",
          "After careful review, we regret to inform you that your application could not be approved at this time.",
          ...(reasonStr ? ["", `Reason: ${reasonStr}`, ""] : []),
          "This decision does not prevent you from reapplying in the future. If you believe there has been an error or would like to provide additional information, please contact our support team.",
          "",
          "You can reapply by visiting our platform and submitting a new application with updated details.",
          "",
          "If you have any questions, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enterprise Partner Application Update</title>
</head>
<body style="margin:0; padding:0; background-color:#fef2f2; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(220,38,38,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">ℹ️</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Application Update</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Enterprise Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #dc2626, #fca5a5, #dc2626);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName}
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Thank you for your interest in registering <strong style="color:#991b1b;">"${nameStr}"</strong> as an AnimalSathi Enterprise Partner.
              </p>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0; color:#dc2626; font-size:13px; line-height:1.6;">
                  After careful review, we regret to inform you that your application could not be approved at this time.
                </p>
                ${reasonStr ? `<p style="margin:12px 0 0; color:#991b1b; font-size:13px; font-weight:600;">Reason: ${reasonStr}</p>` : ""}
              </div>
              <p style="margin:0 0 10px; color:#666; font-size:13px; line-height:1.6;">
                You can reapply with updated details at any time. If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #fee2e2; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact our team at <a href="mailto:info@animalsathi.com" style="color:#dc2626;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      }

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[PAWSOS-ORG-NOTIFY] Email sent successfully", {
        to: emailStr,
        status,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      // Email failure does NOT block the admin action — just log it
      logger.error("[PAWSOS-ORG-NOTIFY] Email send failed (non-blocking):", {
        error: emailError.message || "N/A",
        orgEmail: emailStr,
        org: nameStr,
        status,
      });
    }

    return {
      success: true,
      emailSent,
    };
  }
);

// ---------------------------------------------------------------------------
// deleteUserAccount  –  callable function  (v2)
// ---------------------------------------------------------------------------

/**
 * Production-grade account deletion.
 *
 * - Deletes personal profile data (users doc, subcollections, Storage files).
 * - Anonymizes business/historical records (orders, donations, SOS cases).
 * - Preserves Shiprocket/Razorpay/shipment data for existing shipments.
 * - Blocks deletion if seller has active orders or volunteer has active rescues.
 *
 * Request body:
 *   { uid: string }
 *
 * Response:
 *   { success: true, summary: { deleted: string[], anonymized: string[], errors: string[] } }
 */
exports.deleteUserAccount = onCall(
  {
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const startTime = Date.now();
    const uid = request.data?.uid;

    logger.info("[PAWSOS-DELETE] ════════════════════════════════════════════");
    logger.info("[PAWSOS-DELETE] 🗑️ deleteUserAccount called", { uid });

    // ── 1. Authentication & Ownership Check ──────────────────────────────
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in to delete your account.");
    }
    if (!uid) {
      throw new HttpsError("invalid-argument", "uid is required.");
    }
    if (request.auth.uid !== uid) {
      throw new HttpsError("permission-denied", "You can only delete your own account.");
    }

    const firestore = admin.firestore();
    const bucket = admin.storage().bucket();
    const summary = { deleted: [], anonymized: [], errors: [] };

    // Helper: safe run that catches errors and adds to summary
    const safeRun = async (label, fn) => {
      try {
        await fn();
        summary.deleted.push(label);
        logger.info(`[PAWSOS-DELETE] ✅ Deleted: ${label}`);
      } catch (err) {
        summary.errors.push(`${label}: ${err.message}`);
        logger.error(`[PAWSOS-DELETE] ❌ Error deleting ${label}:`, err.message);
      }
    };

    const safeAnonymize = async (label, fn) => {
      try {
        await fn();
        summary.anonymized.push(label);
        logger.info(`[PAWSOS-DELETE] ✅ Anonymized: ${label}`);
      } catch (err) {
        summary.errors.push(`${label}: ${err.message}`);
        logger.error(`[PAWSOS-DELETE] ❌ Error anonymizing ${label}:`, err.message);
      }
    };

    // ── 2. Seller Account Check ──────────────────────────────────────────
    const brandSnap = await firestore.collection("brands").doc(uid).get();
    const isSeller = brandSnap.exists;

    if (isSeller) {
      logger.info("[PAWSOS-DELETE] 🔍 Checking seller account constraints...");

      // Check for active orders involving this seller's brand
      const activeOrdersSnap = await firestore
        .collection("orders")
        .where("vendorIds", "array-contains", uid)
        .where("orderStatus", "in", ["placed", "pending", "confirmed", "packed", "shipped"])
        .limit(1)
        .get();

      if (!activeOrdersSnap.empty) {
        throw new HttpsError(
          "failed-precondition",
          "Account cannot be deleted while active orders or shipments exist. Please fulfill or cancel all pending orders first."
        );
      }

      // Check for processing shipments
      const shipmentsCheckSnap = await firestore
        .collection("orders")
        .where("vendorIds", "array-contains", uid)
        .limit(20)
        .get();

      for (const doc of shipmentsCheckSnap.docs) {
        const shipments = doc.data().shipments || [];
        const hasActiveShipment = shipments.some((s) =>
          ["NEW", "pickup_scheduled", "picked_up", "in_transit", "inTransit", "out_for_delivery"].includes(s.shipmentStatus)
        );
        if (hasActiveShipment) {
          throw new HttpsError(
            "failed-precondition",
            "Account cannot be deleted while active shipments exist. Please wait for deliveries to complete."
          );
        }
      }
    }

    // ── 3. Volunteer Account Check ───────────────────────────────────────
    logger.info("[PAWSOS-DELETE] 🔍 Checking volunteer active rescues...");
    const activeRescuesSnap = await firestore
      .collection("sos_alerts")
      .where("acceptedBy", "==", uid)
      .where("status", "in", ["active", "responding"])
      .limit(1)
      .get();

    if (!activeRescuesSnap.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Please complete or transfer active rescue assignments before deleting your account."
      );
    }

    // ═════════════════════════════════════════════════════════════════════
    // DELETE IMMEDIATELY — Personal Profile Data
    // ═════════════════════════════════════════════════════════════════════

    // ── 4. Delete user subcollections ────────────────────────────────────
    const subcollections = ["addresses", "notifications", "preferences", "saved", "wishlist"];
    for (const subcol of subcollections) {
      await safeRun(`users/${uid}/${subcol}/*`, async () => {
        const snap = await firestore.collection("users").doc(uid).collection(subcol).get();
        const batch = firestore.batch();
        snap.forEach((d) => batch.delete(d.ref));
        if (snap.size > 0) await batch.commit();
      });
    }

    // ── 5. Delete user profile document ──────────────────────────────────
    await safeRun("users/{uid}", async () => {
      await firestore.collection("users").doc(uid).delete();
    });

    // ── 6. Delete role-specific profile documents ────────────────────────
    const roleCollections = ["vets_web", "ngos_web", "pending_organizations", "brands"];
    for (const col of roleCollections) {
      const snap = await firestore.collection(col).doc(uid).get();
      if (snap.exists) {
        await safeRun(`${col}/${uid}`, async () => {
          await firestore.collection(col).doc(uid).delete();
        });
      }
    }

    // ── 7. Delete user's pets ────────────────────────────────────────────
    await safeRun("pets/* (owner)", async () => {
      const petsSnap = await firestore
        .collection("pets")
        .where("ownerId", "==", uid)
        .get();
      if (!petsSnap.empty) {
        const batch = firestore.batch();
        petsSnap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    });

    // ── 8. Mark seller's products as deleted ──────────────────────────────
    // Don't hard-delete — preserves order history, analytics, audits
    if (isSeller) {
      await safeRun("products/* (marked deleted)", async () => {
        const productsSnap = await firestore
          .collection("products")
          .where("brandId", "==", uid)
          .get();
        if (!productsSnap.empty) {
          const batch = firestore.batch();
          productsSnap.forEach((d) => {
            batch.update(d.ref, {
              status: "deleted",
              isDeleted: true,
              availableForPurchase: false,
              deletedSellerId: uid,
              deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
          logger.info(`[PAWSOS-DELETE] 📄 Marked ${productsSnap.size} product(s) as deleted`);
        }
      });

      // Also mark shop_products (legacy collection)
      await safeRun("shop_products/* (marked deleted)", async () => {
        const shopProductsSnap = await firestore
          .collection("shop_products")
          .where("brandId", "==", uid)
          .get();
        if (!shopProductsSnap.empty) {
          const batch = firestore.batch();
          shopProductsSnap.forEach((d) => {
            batch.update(d.ref, {
              status: "deleted",
              isDeleted: true,
              availableForPurchase: false,
              deletedSellerId: uid,
              deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
          logger.info(`[PAWSOS-DELETE] 📄 Marked ${shopProductsSnap.size} shop_product(s) as deleted`);
        }
      });
    }

    // ── 9. Delete Storage files ──────────────────────────────────────────
    const storagePrefixes = [
      `profile_pictures/${uid}`,
      `volunteerPhotos/${uid}_`,
      `vets/profilePhotos/${uid}_`,
      `vets/documents/${uid}_`,
      `ngos/logos/${uid}_`,
      `ngos/certs/${uid}_`,
      `ngos/80G/${uid}_`,
      `orgs/logos/${uid}_`,
      `orgs/licenses/${uid}_`,
      `brands/logos/${uid}_`,
      `brands/documents/${uid}_`,
      `shop_products/${uid}_`,
      `products/${uid}/`,
      `pet_photos/${uid}/`,
      `profiles/${uid}`,
      `avatars/${uid}`,
      `users/${uid}`,
    ];

    for (const prefix of storagePrefixes) {
      await safeRun(`Storage: ${prefix}*`, async () => {
        const [files] = await bucket.deleteFiles({ prefix });
        if (files.length > 0) {
          logger.info(`[PAWSOS-DELETE] 📦 Deleted ${files.length} file(s) for prefix: ${prefix}`);
        }
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // ANONYMIZE — Business/Historical Records
    // ═════════════════════════════════════════════════════════════════════

    // ── 10. Anonymize Orders ─────────────────────────────────────────────
    await safeAnonymize("orders (anonymized)", async () => {
      const ordersSnap = await firestore
        .collection("orders")
        .where("userId", "==", uid)
        .get();
      if (!ordersSnap.empty) {
        const batch = firestore.batch();
        ordersSnap.forEach((d) => {
          batch.update(d.ref, {
            userId: null,
            userName: "Deleted User",
            userDeleted: true,
          });
        });
        await batch.commit();
        logger.info(`[PAWSOS-DELETE] 📄 Anonymized ${ordersSnap.size} order(s)`);
      }
    });

    // ── 11. Anonymize Donations ──────────────────────────────────────────
    await safeAnonymize("donations (anonymized)", async () => {
      const donationsSnap = await firestore
        .collection("donations")
        .where("userId", "==", uid)
        .get();
      if (!donationsSnap.empty) {
        const batch = firestore.batch();
        donationsSnap.forEach((d) => {
          batch.update(d.ref, {
            userId: null,
            donorName: "Deleted User",
            donorEmail: null,
            donorPhone: null,
            userDeleted: true,
          });
        });
        await batch.commit();
        logger.info(`[PAWSOS-DELETE] 📄 Anonymized ${donationsSnap.size} donation(s)`);
      }
    });

    // ── 12. Anonymize SOS Alerts ─────────────────────────────────────────
    await safeAnonymize("sos_alerts (anonymized)", async () => {
      const alertsSnap = await firestore
        .collection("sos_alerts")
        .where("createdBy", "==", uid)
        .get();
      if (!alertsSnap.empty) {
        const batch = firestore.batch();
        alertsSnap.forEach((d) => {
          batch.update(d.ref, {
            createdBy: null,
            reportedByName: "Deleted User",
            reportedByDeletedUser: true,
          });
        });
        await batch.commit();
        logger.info(`[PAWSOS-DELETE] 📄 Anonymized ${alertsSnap.size} SOS alert(s)`);
      }
    });

    // ── 13. Anonymize Vet Appointments ───────────────────────────────────
    await safeAnonymize("vet_appointments (anonymized)", async () => {
      const appointmentsSnap = await firestore
        .collection("vet_appointments")
        .where("userId", "==", uid)
        .get();
      if (!appointmentsSnap.empty) {
        const batch = firestore.batch();
        appointmentsSnap.forEach((d) => {
          batch.update(d.ref, {
            userId: null,
            userDeleted: true,
            // Keep vetId, appointment data, etc. intact
          });
        });
        await batch.commit();
        logger.info(`[PAWSOS-DELETE] 📄 Anonymized ${appointmentsSnap.size} appointment(s)`);
      }
    });

    // ── 14. Anonymize Playdates (remove from attendees) ──────────────────
    await safeRun("playdates/attendees (removed)", async () => {
      const myPlaydatesSnap = await firestore
        .collection("playdates")
        .where("createdBy", "==", uid)
        .get();
      if (!myPlaydatesSnap.empty) {
        const batch = firestore.batch();
        myPlaydatesSnap.forEach((d) => {
          batch.update(d.ref, { createdBy: null, createdByDeleted: true });
        });
        await batch.commit();
        logger.info(`[PAWSOS-DELETE] 📄 Anonymized ${myPlaydatesSnap.size} playdate(s)`);
      }
    });

    // Also remove the user from any playdate attendee lists
    await safeRun("playdates (attendee removed)", async () => {
      // Get all playdates where the user is an attendee
      // This requires a collection group query
      logger.info("[PAWSOS-DELETE] 📄 Skipping attendee removal (would need collection group query)");
    });

    // ── 15. Delete Firebase Auth account ─────────────────────────────────
    await safeRun("Firebase Auth user", async () => {
      await admin.auth().deleteUser(uid);
    });

    const totalDuration = Date.now() - startTime;
    logger.info("[PAWSOS-DELETE] ════════════════════════════════════════════");
    logger.info("[PAWSOS-DELETE] ✅ Account deletion complete", {
      uid,
      durationMs: totalDuration,
      deleted: summary.deleted.length,
      anonymized: summary.anonymized.length,
      errors: summary.errors.length,
    });
    logger.info("[PAWSOS-DELETE] ════════════════════════════════════════════");

    return {
      success: true,
      summary,
    };
  }
);

// ---------------------------------------------------------------------------
// notifyVetApprovalStatus  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends an email notification to a veterinarian when their account is
 * approved or rejected by an admin.
 *
 * Reuses the same SMTP transporter and secrets as the OTP email system.
 * Approval/Rejection is never blocked by email delivery — failures are
 * logged and swallowed.
 *
 * Request body:
 *   { vetEmail: string, vetName: string, status: "approved" | "rejected", reason?: string }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.notifyVetApprovalStatus = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const { vetEmail, vetName, status, reason } = request.data || {};

    logger.info("[PAWSOS-VET-NOTIFY] Sending vet status notification", {
      vetEmail,
      vetName,
      status,
      hasReason: !!reason,
    });

    // ── Input validation ──
    if (!vetEmail || !vetName || !status) {
      throw new HttpsError(
        "invalid-argument",
        "vetEmail, vetName, and status are required."
      );
    }

    if (status !== "approved" && status !== "rejected") {
      throw new HttpsError(
        "invalid-argument",
        'status must be "approved" or "rejected".'
      );
    }

    const emailStr = String(vetEmail).trim().toLowerCase();
    const nameStr = String(vetName).trim();
    const reasonStr = reason ? String(reason).trim() : "";

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
      };

      if (status === "approved") {
        mailOptions.subject = "Your AnimalSathi Veterinary Account Has Been Approved";
        mailOptions.text = [
          `Hello Dr. ${nameStr},`,
          "",
          "Congratulations! Your veterinary profile has been verified and approved by the AnimalSathi team.",
          "",
          "You can now log in to your account and start accepting consultations from pet parents in your area.",
          "",
          "What you can do now:",
          "• Set your availability for consultations",
          "• Accept clinic visits and remote consultations",
          "• Provide emergency services if you are willing to travel",
          "• Build your reputation with verified reviews",
          "",
          "If you have any questions or need support, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vet Account Approved</title>
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(22,101,52,0.10);">
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">✅</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Account Approved!</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Veterinary Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #22c55e, #86efac, #22c55e);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello Dr. ${nameStr} 👨‍⚕️
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Congratulations! Your veterinary profile has been <strong style="color:#16a34a;">verified and approved</strong>.
              </p>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0 0 12px; color:#15803d; font-size:13px; font-weight:600;">
                  ✅ What you can do now:
                </p>
                <ul style="margin:0; padding-left:20px; color:#555; font-size:13px; line-height:1.8;">
                  <li>Set your availability for consultations</li>
                  <li>Accept clinic visits &amp; remote consultations</li>
                  <li>Provide emergency services</li>
                  <li>Build your reputation with verified reviews</li>
                </ul>
              </div>
              <p style="margin:0 0 16px; color:#666; font-size:13px; line-height:1.6;">
                Log in now to start accepting consultations from pet parents in your area.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #e0f2e0; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact us at <a href="mailto:info@animalsathi.com" style="color:#16a34a;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      } else {
        // status === "rejected"
        mailOptions.subject = "Update Regarding Your Veterinary Registration";
        mailOptions.text = [
          `Hello Dr. ${nameStr},`,
          "",
          "Thank you for your interest in joining AnimalSathi as a veterinarian.",
          "",
          "After careful review, we regret to inform you that your veterinary registration could not be approved at this time.",
          reasonStr ? `\nReason: ${reasonStr}\n` : "",
          "This decision does not prevent you from reapplying in the future. If you believe there has been an error or would like to provide additional information, please contact our support team.",
          "",
          "You can reapply by visiting our platform and submitting a new application with updated credentials or documents.",
          "",
          "If you have any questions, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vet Registration Update</title>
</head>
<body style="margin:0; padding:0; background-color:#fef2f2; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(220,38,38,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">ℹ️</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Registration Update</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Veterinary Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #dc2626, #fca5a5, #dc2626);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello Dr. ${nameStr}
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Thank you for your interest in joining <strong style="color:#991b1b;">AnimalSathi</strong> as a veterinarian.
              </p>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0; color:#dc2626; font-size:13px; line-height:1.6;">
                  After careful review, we regret to inform you that your registration could not be approved at this time.
                </p>
                ${reasonStr ? `<p style="margin:12px 0 0; color:#991b1b; font-size:13px; font-weight:600;">Reason: ${reasonStr}</p>` : ""}
              </div>
              <p style="margin:0 0 10px; color:#666; font-size:13px; line-height:1.6;">
                This decision does not prevent you from reapplying. You can submit a new application with updated credentials at any time.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #fee2e2; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact our team at <a href="mailto:info@animalsathi.com" style="color:#dc2626;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      }

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[PAWSOS-VET-NOTIFY] Email sent successfully", {
        to: emailStr,
        status,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      // Email failure does NOT block the admin action — just log it
      logger.error("[PAWSOS-VET-NOTIFY] Email send failed (non-blocking):", {
        error: emailError.message || "N/A",
        vetEmail: emailStr,
        status,
      });
    }

    return {
      success: true,
      emailSent,
    };
  }
);

// ---------------------------------------------------------------------------
// notifyOrgApprovalStatus  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends an email notification to an organization (hospital/vet clinic) when
 * their Enterprise Partner application is approved or rejected by an admin.
 *
 * Reuses the same SMTP transporter and secrets as the OTP email system.
 * Approval/Rejection is never blocked by email delivery — failures are
 * logged and swallowed.
 *
 * Request body:
 *   { orgEmail: string, orgName: string, contactPerson: string, type: string, status: "approved" | "rejected", reason?: string }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.notifyOrgApprovalStatus = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const { orgEmail, orgName, contactPerson, type, status, reason } = request.data || {};

    logger.info("[PAWSOS-ORG-NOTIFY] Sending organization status notification", {
      orgEmail,
      orgName,
      contactPerson,
      type,
      status,
      hasReason: !!reason,
    });

    // ── Input validation ──
    if (!orgEmail || !orgName || !status) {
      throw new HttpsError(
        "invalid-argument",
        "orgEmail, orgName, and status are required."
      );
    }

    if (status !== "approved" && status !== "rejected") {
      throw new HttpsError(
        "invalid-argument",
        'status must be "approved" or "rejected".'
      );
    }

    const emailStr = String(orgEmail).trim().toLowerCase();
    const nameStr = String(orgName).trim();
    const contactStr = contactPerson ? String(contactPerson).trim() : "";
    const typeStr = type ? String(type).trim() : "organization";
    const reasonStr = reason ? String(reason).trim() : "";
    const greetingName = contactStr || nameStr;
    const entityTypeLabel = typeStr === "hospital" ? "Hospital" : typeStr === "vet" ? "Veterinary Clinic" : "Organization";

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
      };

      if (status === "approved") {
        mailOptions.subject = `Your ${entityTypeLabel} Registration Has Been Approved — AnimalSathi`;
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Congratulations! Your ${entityTypeLabel.toLowerCase()} "${nameStr}" has been verified and approved by the AnimalSathi Enterprise Partner team.`,
          "",
          `Your ${entityTypeLabel.toLowerCase()} can now access all Enterprise Partner features on the platform.`,
          "",
          "What you can do now:",
          "• Respond to SOS alerts and rescue coordination requests",
          "• Manage your staff and assign roles (vets, volunteers, admins)",
          "• Provide emergency and routine animal care services",
          "• Coordinate with NGOs, volunteers, and other partners",
          "• Showcase your facilities and capabilities on your profile",
          "",
          "If you have any questions or need support, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enterprise Partner Approved</title>
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(22,101,52,0.10);">
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">✅</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Enterprise Partner Approved!</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Enterprise Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #22c55e, #86efac, #22c55e);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName} 🙌
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Congratulations! Your ${entityTypeLabel.toLowerCase()} <strong style="color:#16a34a;">"${nameStr}"</strong> has been verified and approved as an AnimalSathi Enterprise Partner.
              </p>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0 0 12px; color:#15803d; font-size:13px; font-weight:600;">
                  ⚕️ What you can do now:
                </p>
                <ul style="margin:0; padding-left:20px; color:#555; font-size:13px; line-height:1.8;">
                  <li>Respond to SOS alerts &amp; rescue coordination requests</li>
                  <li>Manage your staff and assign roles</li>
                  <li>Provide emergency and routine animal care services</li>
                  <li>Coordinate with NGOs, volunteers, and other partners</li>
                  <li>Showcase your facilities and capabilities</li>
                </ul>
              </div>
              <p style="margin:0 0 16px; color:#666; font-size:13px; line-height:1.6;">
                Log in now to access your Enterprise Partner dashboard and start making a difference.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #e0f2e0; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact us at <a href="mailto:info@animalsathi.com" style="color:#16a34a;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      } else {
        // status === "rejected"
        mailOptions.subject = `Update Regarding Your ${entityTypeLabel} Registration — AnimalSathi`;
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Thank you for your interest in registering "${nameStr}" as an AnimalSathi Enterprise Partner.`,
          "",
          "After careful review, we regret to inform you that your application could not be approved at this time.",
          ...(reasonStr ? ["", `Reason: ${reasonStr}`, ""] : []),
          "This decision does not prevent you from reapplying in the future. If you believe there has been an error or would like to provide additional information, please contact our support team.",
          "",
          "You can reapply by visiting our platform and submitting a new application with updated details.",
          "",
          "If you have any questions, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enterprise Partner Application Update</title>
</head>
<body style="margin:0; padding:0; background-color:#fef2f2; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(220,38,38,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">ℹ️</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Application Update</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Enterprise Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #dc2626, #fca5a5, #dc2626);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName}
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Thank you for your interest in registering <strong style="color:#991b1b;">"${nameStr}"</strong> as an AnimalSathi Enterprise Partner.
              </p>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0; color:#dc2626; font-size:13px; line-height:1.6;">
                  After careful review, we regret to inform you that your application could not be approved at this time.
                </p>
                ${reasonStr ? `<p style="margin:12px 0 0; color:#991b1b; font-size:13px; font-weight:600;">Reason: ${reasonStr}</p>` : ""}
              </div>
              <p style="margin:0 0 10px; color:#666; font-size:13px; line-height:1.6;">
                You can reapply with updated details at any time. If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #fee2e2; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact our team at <a href="mailto:info@animalsathi.com" style="color:#dc2626;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      }

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[PAWSOS-ORG-NOTIFY] Email sent successfully", {
        to: emailStr,
        status,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      // Email failure does NOT block the admin action — just log it
      logger.error("[PAWSOS-ORG-NOTIFY] Email send failed (non-blocking):", {
        error: emailError.message || "N/A",
        orgEmail: emailStr,
        org: nameStr,
        status,
      });
    }

    return {
      success: true,
      emailSent,
    };
  }
);

// ---------------------------------------------------------------------------
// ORDER EMAIL HELPERS  –  shared template builders
// ---------------------------------------------------------------------------

/**
 * Builds the shared HTML email header for order-related emails.
 * Returns the opening HTML up to (but not including) the body content area.
 */
function buildOrderEmailHeader(title, subtitle) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f5ede0; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5ede0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(156,62,35,0.10);">
          <tr>
            <td style="background: linear-gradient(135deg, #9c3e23 0%, #c0522e 60%, #e07040 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">🐾</div>
              <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700;
                          letter-spacing:0.5px;">${title}</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.80); font-size:13px;
                         letter-spacing:0.3px;">${subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px;
                        background: linear-gradient(90deg, #FF5722, #ff8a50, #FF5722);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">`;
}

/**
 * Builds the shared HTML email footer for order-related emails.
 */
function buildOrderEmailFooter() {
  return `
          </td>
        </tr>
        <tr>
          <td style="padding: 0 40px;">
            <hr style="border:none; border-top:1px solid #f0e8e0; margin:0;" />
          </td>
        </tr>
        <tr>
          <td style="padding: 24px 40px 32px; text-align:center;">
            <p style="margin:0 0 12px; color:#aaaaaa; font-size:11px; line-height:1.6;">
              Need help? Write to us at <a href="mailto:info@animalsathi.com" style="color:#9c3e23; text-decoration:underline;">info@animalsathi.com</a><br/>
              GL Bajaj Institute, Knowledge Park III, Greater Noida, UP
            </p>
            <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
              © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Build a clickable CTA button HTML for email.
 */
function buildEmailCtaButton(url, text) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 8px 0 4px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="background: linear-gradient(135deg, #9c3e23 0%, #c0522e 100%);
                      border-radius: 12px; padding: 14px 36px;">
            <a href="${url}" target="_blank"
              style="color:#ffffff; font-size:15px; font-weight:700; text-decoration:none;
                     letter-spacing:0.5px; display:inline-block;">
              ${text}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * Build a pricing row for email order summary.
 */
function buildPriceRow(label, value, isTotal) {
  const fontWeight = isTotal ? 'font-weight:800; font-size:16px;' : 'font-weight:500; font-size:14px;';
  const color = isTotal ? '#333333' : '#666666';
  const borderTop = isTotal ? 'border-top:2px solid #333333;' : '';
  return `
<tr>
  <td style="padding: 6px 0; ${borderTop}">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${fontWeight} color:${color};">${label}</td>
        <td align="right" style="${fontWeight} color:${color};">${value}</td>
      </tr>
    </table>
  </td>
</tr>`;
}

// ---------------------------------------------------------------------------
// sendOrderConfirmation  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends an order confirmation email to the customer after a successful
 * purchase on the AnimalSathi marketplace.
 *
 * Reuses the same SMTP transporter and secrets as the OTP email system.
 * Email failure is NEVER allowed to fail checkout — errors are logged and
 * swallowed.
 *
 * Request body:
 *   {
 *     orderId: string,
 *     customerName: string,
 *     customerEmail: string,
 *     items: Array<{ productName: string, quantity: number, price: number }>,
 *     subtotal: number,
 *     deliveryFee: number,
 *     totalAmount: number,
 *     paymentMethod: string,
 *     shippingAddress: string,
 *     orderDate: string
 *   }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.sendOrderConfirmation = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 10,
  },
  async (request) => {
    const data = request.data || {};
    const {
      orderId,
      customerName,
      customerEmail,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod,
      shippingAddress,
      orderDate,
    } = data;

    logger.info("[ORDER EMAIL] Sending order confirmation...", {
      orderId,
      customerEmail,
      itemCount: Array.isArray(items) ? items.length : 0,
    });

    // ── Input validation ──
    if (!orderId || !customerEmail || !customerName) {
      logger.error("[ORDER EMAIL] Missing required fields", { orderId, customerEmail, customerName });
      return { success: false, emailSent: false, error: "Missing required fields" };
    }

    const emailStr = String(customerEmail).trim().toLowerCase();
    const nameStr = String(customerName).trim();
    const orderIdStr = String(orderId);
    const addressStr = shippingAddress ? String(shippingAddress).trim() : "";
    const paymentLabel = paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment (Razorpay)";
    const formattedDate = orderDate || new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Build items table rows
    const itemsRows = Array.isArray(items) && items.length > 0
      ? items.map((item) => {
          const itemName = item.productName || "Item";
          const qty = item.quantity || 1;
          const price = Number(item.price) || 0;
          const itemTotal = price * qty;
          return `
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid #f0e8e0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="font-size:14px; color:#333333; font-weight:600;">${itemName}</td>
        <td align="center" style="font-size:13px; color:#888888; width:60px;">x${qty}</td>
        <td align="right" style="font-size:14px; color:#9c3e23; font-weight:700; width:100px;">₹${itemTotal.toLocaleString("en-IN")}</td>
      </tr>
    </table>
  </td>
</tr>`;
        }).join("")
      : `<tr><td style="padding:10px 0; color:#888; font-size:13px;">No items in order</td></tr>`;

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const baseUrl = process.env.APP_URL || "https://animalsathi.com";
      const orderUrl = `${baseUrl}/order-success/${orderIdStr}`;

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
        subject: "🐾 Order Confirmed - AnimalSathi",
        text: [
          `Hello ${nameStr},`,
          "",
          "Thank you for your order! Here's a summary of your purchase:",
          "",
          `Order ID: ${orderIdStr}`,
          `Order Date: ${formattedDate}`,
          "",
          "Items:",
          ...(Array.isArray(items) ? items.map((i) => `  ${i.productName || "Item"} x${i.quantity || 1} — ₹${(Number(i.price || 0) * (i.quantity || 1)).toLocaleString("en-IN")}`) : []),
          "",
          `Subtotal: ₹${Number(subtotal || 0).toLocaleString("en-IN")}`,
          `Delivery Fee: ${deliveryFee === 0 ? 'FREE' : `₹${Number(deliveryFee).toLocaleString("en-IN")}`}`,
          `Total: ₹${Number(totalAmount || 0).toLocaleString("en-IN")}`,
          "",
          `Payment Method: ${paymentLabel}`,
          `Shipping Address: ${addressStr}`,
          "",
          "You can track your order status at any time:",
          orderUrl,
          "",
          "Thank you for supporting AnimalSathi's marketplace.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n"),
        html: `${buildOrderEmailHeader("Order Confirmed! 🎉", "AnimalSathi Marketplace")}

              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${nameStr} 👋
              </p>
              <p style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.6;">
                Thank you for your order! Your purchase has been confirmed and we're getting it ready.
                Here's a summary of your order:
              </p>

              <!-- Order Info -->
              <div style="background:#fff8f5; border:1px solid #f0e0d0; border-radius:12px; padding:16px 20px; margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:12px; color:#888888; padding-bottom:4px;">ORDER ID</td>
                    <td align="right" style="font-size:12px; color:#888888; padding-bottom:4px;">DATE</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px; color:#9c3e23; font-weight:700; font-family:'Courier New',monospace;">
                      #${orderIdStr.substring(0, 12).toUpperCase()}
                    </td>
                    <td align="right" style="font-size:13px; color:#666666; font-weight:500;">
                      ${formattedDate}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Items Table -->
              <p style="margin:0 0 12px; color:#333333; font-size:15px; font-weight:700;">
                📦 Items Ordered
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                ${itemsRows}
              </table>

              <!-- Price Summary -->
              <div style="background:#faf8f5; border-radius:12px; padding:16px 20px; margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${buildPriceRow("Subtotal", `₹${Number(subtotal || 0).toLocaleString("en-IN")}`, false)}
                  ${buildPriceRow("Delivery Fee", deliveryFee === 0 ? '<span style="color:#16a34a;font-weight:700;">FREE</span>' : `₹${Number(deliveryFee).toLocaleString("en-IN")}`, false)}
                  ${buildPriceRow("Total Amount", `₹${Number(totalAmount || 0).toLocaleString("en-IN")}`, true)}
                </table>
              </div>

              <!-- Payment & Address -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td width="50%" style="vertical-align:top; padding-right:12px;">
                    <div style="background:#f0f7ff; border:1px solid #dce8f0; border-radius:10px; padding:14px 16px;">
                      <p style="margin:0 0 6px; color:#666; font-size:11px; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Payment</p>
                      <p style="margin:0; color:#333; font-size:14px; font-weight:600;">${paymentLabel}</p>
                      <p style="margin:2px 0 0; color:#888; font-size:12px;">${paymentMethod === "cod" ? "Pay when delivered" : "Paid via Razorpay"}</p>
                    </div>
                  </td>
                  <td width="50%" style="vertical-align:top; padding-left:12px;">
                    <div style="background:#f0faf5; border:1px solid #dce8e0; border-radius:10px; padding:14px 16px;">
                      <p style="margin:0 0 6px; color:#666; font-size:11px; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Shipping</p>
                      <p style="margin:0; color:#333; font-size:13px; font-weight:500; line-height:1.5;">${addressStr || "Address provided at checkout"}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.7; text-align:center;">
                Thank you for supporting <strong style="color:#9c3e23;">AnimalSathi</strong>'s marketplace.
                Every purchase helps us care for animals in need. 🧡
              </p>

              ${buildEmailCtaButton(orderUrl, "View Order")}

              <p style="margin:20px 0 0; color:#aaaaaa; font-size:12px; line-height:1.5; text-align:center;">
                You'll receive shipping updates as your order progresses.
              </p>
        ${buildOrderEmailFooter()}`,
      };

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[ORDER EMAIL] Success", {
        orderId: orderIdStr,
        to: emailStr,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      // Email failure NEVER fails checkout — just log it
      logger.error("[ORDER EMAIL] Failed", {
        error: emailError.message || "N/A",
        orderId: orderIdStr,
        customerEmail: emailStr,
      });
    }

    return {
      success: true,
      emailSent,
    };
  }
);

// ---------------------------------------------------------------------------
// sendOrderShipped  –  callable function  (FUTURE READY — NOT YET WIRED)
// ---------------------------------------------------------------------------

/**
 * Sends a shipment notification email to the customer when their order
 * has been shipped.
 *
 * FUTURE USE: Call from seller-dashboard or cloud function when
 * orderStatus transitions to "shipped".
 *
 * Request body:
 *   {
 *     orderId: string,
 *     customerName: string,
 *     customerEmail: string,
 *     trackingUrl: string,
 *     awbCode: string,
 *     carrierName: string
 *   }
 */
exports.sendOrderShipped = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const data = request.data || {};
    const { orderId, customerName, customerEmail, trackingUrl, awbCode, carrierName } = data;

    logger.info("[ORDER EMAIL] Sending shipped notification...", { orderId, customerEmail });

    if (!orderId || !customerEmail || !customerName) {
      logger.error("[ORDER EMAIL] Missing required fields for shipped email");
      return { success: false, emailSent: false, error: "Missing required fields" };
    }

    const emailStr = String(customerEmail).trim().toLowerCase();
    const nameStr = String(customerName).trim();
    const orderIdStr = String(orderId);
    const trackUrl = trackingUrl || "#";
    const awb = awbCode || "N/A";
    const carrier = carrierName || "Courier Partner";

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
        subject: "🚚 Your Order Has Been Shipped - AnimalSathi",
        text: [
          `Hello ${nameStr},`,
          "",
          "Great news! Your order has been shipped and is on its way to you.",
          "",
          `Order: #${orderIdStr.substring(0, 12).toUpperCase()}`,
          `Carrier: ${carrier}`,
          `Tracking: ${awb}`,
          "",
          `Track your shipment: ${trackUrl}`,
          "",
          "Thank you for supporting AnimalSathi's marketplace.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n"),
        html: `${buildOrderEmailHeader("Order Shipped! 🚚", "AnimalSathi Marketplace")}

              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${nameStr},
              </p>
              <p style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.6;">
                Great news! Your order <strong style="color:#9c3e23;">#${orderIdStr.substring(0, 12).toUpperCase()}</strong>
                has been shipped and is on its way to you! 🎉
              </p>

              <div style="background:#f0faf5; border:1px solid #d0e8d8; border-radius:12px; padding:16px 20px; margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:12px; color:#888; padding-bottom:4px;">CARRIER</td>
                    <td align="right" style="font-size:12px; color:#888; padding-bottom:4px;">TRACKING (AWB)</td>
                  </tr>
                  <tr>
                    <td style="font-size:15px; color:#333; font-weight:700;">${carrier}</td>
                    <td align="right" style="font-size:14px; color:#9c3e23; font-weight:700; font-family:'Courier New',monospace;">${awb}</td>
                  </tr>
                </table>
              </div>

              ${buildEmailCtaButton(trackUrl, "Track Your Order")}

              <p style="margin:20px 0 0; color:#aaaaaa; font-size:12px; line-height:1.5; text-align:center;">
                You'll receive a delivery confirmation once it arrives.
              </p>
        ${buildOrderEmailFooter()}`,
      };

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[ORDER EMAIL] Shipped notification sent", {
        orderId: orderIdStr,
        to: emailStr,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      logger.error("[ORDER EMAIL] Failed to send shipped notification", {
        error: emailError.message || "N/A",
        orderId: orderIdStr,
      });
    }

    return { success: true, emailSent };
  }
);

// ---------------------------------------------------------------------------
// sendOrderDelivered  –  callable function  (FUTURE READY — NOT YET WIRED)
// ---------------------------------------------------------------------------

/**
 * Sends a delivery confirmation email to the customer when their order
 * has been delivered.
 *
 * FUTURE USE: Call from seller-dashboard or cloud function when
 * orderStatus transitions to "delivered".
 *
 * Request body:
 *   {
 *     orderId: string,
 *     customerName: string,
 *     customerEmail: string
 *   }
 */
exports.sendOrderDelivered = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const data = request.data || {};
    const { orderId, customerName, customerEmail } = data;

    logger.info("[ORDER EMAIL] Sending delivered notification...", { orderId, customerEmail });

    if (!orderId || !customerEmail || !customerName) {
      logger.error("[ORDER EMAIL] Missing required fields for delivered email");
      return { success: false, emailSent: false, error: "Missing required fields" };
    }

    const emailStr = String(customerEmail).trim().toLowerCase();
    const nameStr = String(customerName).trim();
    const orderIdStr = String(orderId);

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
        subject: "✅ Order Delivered - AnimalSathi",
        text: [
          `Hello ${nameStr},`,
          "",
          `Your order #${orderIdStr.substring(0, 12).toUpperCase()} has been delivered successfully!`,
          "",
          "We hope you and your furry friend love your purchase.",
          "",
          "If you have any questions or concerns, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Thank you for supporting AnimalSathi's marketplace.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n"),
        html: `${buildOrderEmailHeader("Order Delivered! ✅", "AnimalSathi Marketplace")}

              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${nameStr},
              </p>
              <p style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.6;">
                Your order <strong style="color:#16a34a;">#${orderIdStr.substring(0, 12).toUpperCase()}</strong>
                has been delivered successfully! 🎉
              </p>

              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:16px; padding:24px; margin-bottom:24px; text-align:center;">
                <div style="font-size:48px; margin-bottom:12px;">📦</div>
                <p style="margin:0; color:#15803d; font-size:16px; font-weight:700;">
                  We hope you and your furry friend love your purchase!
                </p>
              </div>

              <p style="margin:0 0 16px; color:#666; font-size:14px; line-height:1.6;">
                If you have any questions or concerns, simply reply to this email or reach out to us at <a href="mailto:info@animalsathi.com" style="color:#9c3e23;">info@animalsathi.com</a>.
              </p>

              <p style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.7; text-align:center;">
                Thank you for supporting <strong style="color:#9c3e23;">AnimalSathi</strong>'s marketplace.
                Your purchase makes a difference for animals in need. 🧡
              </p>
        ${buildOrderEmailFooter()}`,
      };

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[ORDER EMAIL] Delivered notification sent", {
        orderId: orderIdStr,
        to: emailStr,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      logger.error("[ORDER EMAIL] Failed to send delivered notification", {
        error: emailError.message || "N/A",
        orderId: orderIdStr,
      });
    }

    return { success: true, emailSent };
  }
);

// ---------------------------------------------------------------------------
// sendOrderCancelled  –  callable function  (FUTURE READY — NOT YET WIRED)
// ---------------------------------------------------------------------------

/**
 * Sends a cancellation notification email to the customer when their
 * order has been cancelled.
 *
 * FUTURE USE: Call from seller-dashboard or cloud function when
 * orderStatus transitions to "cancelled".
 *
 * Request body:
 *   {
 *     orderId: string,
 *     customerName: string,
 *     customerEmail: string,
 *     reason?: string
 *   }
 */
exports.sendOrderCancelled = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const data = request.data || {};
    const { orderId, customerName, customerEmail, reason } = data;

    logger.info("[ORDER EMAIL] Sending cancellation notification...", { orderId, customerEmail });

    if (!orderId || !customerEmail || !customerName) {
      logger.error("[ORDER EMAIL] Missing required fields for cancelled email");
      return { success: false, emailSent: false, error: "Missing required fields" };
    }

    const emailStr = String(customerEmail).trim().toLowerCase();
    const nameStr = String(customerName).trim();
    const orderIdStr = String(orderId);
    const reasonStr = reason ? String(reason).trim() : "";

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
        subject: "ℹ️ Order Cancelled - AnimalSathi",
        text: [
          `Hello ${nameStr},`,
          "",
          `Your order #${orderIdStr.substring(0, 12).toUpperCase()} has been cancelled.`,
          reasonStr ? `\nReason: ${reasonStr}\n` : "",
          "If you have any questions or need assistance, please reach out to our support team at info@animalsathi.com.",
          "",
          "Any payments made will be refunded as per our refund policy.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n"),
        html: `${buildOrderEmailHeader("Order Cancelled", "AnimalSathi Marketplace")}

              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${nameStr},
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Your order <strong style="color:#991b1b;">#${orderIdStr.substring(0, 12).toUpperCase()}</strong>
                has been cancelled as requested.
              </p>

              ${reasonStr ? `
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:16px 20px; margin-bottom:20px;">
                <p style="margin:0; color:#991b1b; font-size:13px; font-weight:600;">Reason: ${reasonStr}</p>
              </div>` : ""}

              <div style="background:#fef8f5; border:1px solid #f0e0d0; border-radius:12px; padding:16px 20px; margin-bottom:20px;">
                <p style="margin:0; color:#666; font-size:13px; line-height:1.6;">
                  Any payments made will be refunded as per our refund policy. If you have any
                  questions, please contact us at <a href="mailto:info@animalsathi.com" style="color:#9c3e23;">info@animalsathi.com</a>.
                </p>
              </div>

              <p style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.7; text-align:center;">
                We're sorry to see you go. If you'd like to place a new order,
                visit our <a href="https://animalsathi.com/shop" style="color:#9c3e23;">marketplace</a> anytime.
              </p>
        ${buildOrderEmailFooter()}`,
      };

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[ORDER EMAIL] Cancellation notification sent", {
        orderId: orderIdStr,
        to: emailStr,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      logger.error("[ORDER EMAIL] Failed to send cancellation notification", {
        error: emailError.message || "N/A",
        orderId: orderIdStr,
      });
    }

    return { success: true, emailSent };
  }
);

// ---------------------------------------------------------------------------
// notifySellerApprovalStatus  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends an email notification to a seller/brand when their account is
 * approved or rejected by an admin.
 *
 * Reuses the same SMTP transporter and secrets as the OTP email system.
 * Approval/Rejection is never blocked by email delivery — failures are
 * logged and swallowed.
 *
 * Request body:
 *   { sellerEmail: string, brandName: string, ownerName: string, status: "approved" | "rejected", reason?: string }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.notifySellerApprovalStatus = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const { sellerEmail, brandName, ownerName, status, reason } = request.data || {};

    logger.info("[PAWSOS-SELLER-NOTIFY] Sending seller status notification", {
      sellerEmail,
      brandName,
      ownerName,
      status,
      hasReason: !!reason,
    });

    // ── Input validation ──
    if (!sellerEmail || !brandName || !status) {
      throw new HttpsError(
        "invalid-argument",
        "sellerEmail, brandName, and status are required."
      );
    }

    if (status !== "approved" && status !== "rejected") {
      throw new HttpsError(
        "invalid-argument",
        'status must be "approved" or "rejected".'
      );
    }

    const emailStr = String(sellerEmail).trim().toLowerCase();
    const brandStr = String(brandName).trim();
    const ownerStr = ownerName ? String(ownerName).trim() : "";
    const reasonStr = reason ? String(reason).trim() : "";
    const greetingName = ownerStr || brandStr;

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
      };

      if (status === "approved") {
        mailOptions.subject = "Congratulations! Your Brand Has Been Approved on AnimalSathi";
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Great news! Your brand "${brandStr}" has been verified and approved on the AnimalSathi marketplace.`,
          "",
          "You can now start listing your pet products and reaching animal lovers across India.",
          "",
          "What you can do now:",
          "• Log in to your seller dashboard",
          "• Add your product catalog with images and prices",
          "• Set up shipping and delivery preferences",
          "• Start receiving orders from pet parents",
          "",
          "If you have any questions, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seller Account Approved</title>
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(22,101,52,0.10);">
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">🎉</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Brand Approved!</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Marketplace</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #22c55e, #86efac, #22c55e);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName} 👋
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Great news! Your brand <strong style="color:#16a34a;">"${brandStr}"</strong> has been verified and approved on the AnimalSathi marketplace.
              </p>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0 0 12px; color:#15803d; font-size:13px; font-weight:600;">
                  ✅ What you can do now:
                </p>
                <ul style="margin:0; padding-left:20px; color:#555; font-size:13px; line-height:1.8;">
                  <li>Log in to your seller dashboard</li>
                  <li>Add your product catalog with images &amp; prices</li>
                  <li>Set up shipping and delivery preferences</li>
                  <li>Start receiving orders from pet parents</li>
                </ul>
              </div>
              <p style="margin:0 0 16px; color:#666; font-size:13px; line-height:1.6;">
                Log in now to start listing your products and reaching animal lovers across India.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #e0f2e0; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact us at <a href="mailto:info@animalsathi.com" style="color:#16a34a;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      } else {
        // status === "rejected"
        mailOptions.subject = "Update Regarding Your Brand Registration on AnimalSathi";
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Thank you for your interest in listing "${brandStr}" on the AnimalSathi marketplace.`,
          "",
          "After careful review, we regret to inform you that your brand registration could not be approved at this time.",
          ...(reasonStr ? ["", `Reason: ${reasonStr}`, ""] : []),
          "This decision does not prevent you from reapplying in the future. If you believe there has been an error or would like to provide additional information, please contact our support team.",
          "",
          "You can reapply by visiting our platform and submitting a new application with updated business details or documents.",
          "",
          "If you have any questions, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seller Registration Update</title>
</head>
<body style="margin:0; padding:0; background-color:#fef2f2; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(220,38,38,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">ℹ️</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Registration Update</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Marketplace</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #dc2626, #fca5a5, #dc2626);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName}
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Thank you for your interest in listing <strong style="color:#991b1b;">"${brandStr}"</strong> on the AnimalSathi marketplace.
              </p>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0; color:#dc2626; font-size:13px; line-height:1.6;">
                  After careful review, we regret to inform you that your brand registration could not be approved at this time.
                </p>
                ${reasonStr ? `<p style="margin:12px 0 0; color:#991b1b; font-size:13px; font-weight:600;">Reason: ${reasonStr}</p>` : ""}
              </div>
              <p style="margin:0 0 10px; color:#666; font-size:13px; line-height:1.6;">
                You can reapply with updated business details at any time. If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #fee2e2; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact our team at <a href="mailto:info@animalsathi.com" style="color:#dc2626;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      }

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[PAWSOS-SELLER-NOTIFY] Email sent successfully", {
        to: emailStr,
        status,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      // Email failure does NOT block the admin action — just log it
      logger.error("[PAWSOS-SELLER-NOTIFY] Email send failed (non-blocking):", {
        error: emailError.message || "N/A",
        sellerEmail: emailStr,
        brand: brandStr,
        status,
      });
    }

    return {
      success: true,
      emailSent,
    };
  }
);

// ---------------------------------------------------------------------------
// notifyOrgApprovalStatus  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends an email notification to an organization (hospital/vet clinic) when
 * their Enterprise Partner application is approved or rejected by an admin.
 *
 * Reuses the same SMTP transporter and secrets as the OTP email system.
 * Approval/Rejection is never blocked by email delivery — failures are
 * logged and swallowed.
 *
 * Request body:
 *   { orgEmail: string, orgName: string, contactPerson: string, type: string, status: "approved" | "rejected", reason?: string }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.notifyOrgApprovalStatus = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const { orgEmail, orgName, contactPerson, type, status, reason } = request.data || {};

    logger.info("[PAWSOS-ORG-NOTIFY] Sending organization status notification", {
      orgEmail,
      orgName,
      contactPerson,
      type,
      status,
      hasReason: !!reason,
    });

    // ── Input validation ──
    if (!orgEmail || !orgName || !status) {
      throw new HttpsError(
        "invalid-argument",
        "orgEmail, orgName, and status are required."
      );
    }

    if (status !== "approved" && status !== "rejected") {
      throw new HttpsError(
        "invalid-argument",
        'status must be "approved" or "rejected".'
      );
    }

    const emailStr = String(orgEmail).trim().toLowerCase();
    const nameStr = String(orgName).trim();
    const contactStr = contactPerson ? String(contactPerson).trim() : "";
    const typeStr = type ? String(type).trim() : "organization";
    const reasonStr = reason ? String(reason).trim() : "";
    const greetingName = contactStr || nameStr;
    const entityTypeLabel = typeStr === "hospital" ? "Hospital" : typeStr === "vet" ? "Veterinary Clinic" : "Organization";

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
      };

      if (status === "approved") {
        mailOptions.subject = `Your ${entityTypeLabel} Registration Has Been Approved — AnimalSathi`;
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Congratulations! Your ${entityTypeLabel.toLowerCase()} "${nameStr}" has been verified and approved by the AnimalSathi Enterprise Partner team.`,
          "",
          `Your ${entityTypeLabel.toLowerCase()} can now access all Enterprise Partner features on the platform.`,
          "",
          "What you can do now:",
          "• Respond to SOS alerts and rescue coordination requests",
          "• Manage your staff and assign roles (vets, volunteers, admins)",
          "• Provide emergency and routine animal care services",
          "• Coordinate with NGOs, volunteers, and other partners",
          "• Showcase your facilities and capabilities on your profile",
          "",
          "If you have any questions or need support, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enterprise Partner Approved</title>
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(22,101,52,0.10);">
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">✅</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Enterprise Partner Approved!</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Enterprise Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #22c55e, #86efac, #22c55e);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName} 🙌
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Congratulations! Your ${entityTypeLabel.toLowerCase()} <strong style="color:#16a34a;">"${nameStr}"</strong> has been verified and approved as an AnimalSathi Enterprise Partner.
              </p>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0 0 12px; color:#15803d; font-size:13px; font-weight:600;">
                  ⚕️ What you can do now:
                </p>
                <ul style="margin:0; padding-left:20px; color:#555; font-size:13px; line-height:1.8;">
                  <li>Respond to SOS alerts &amp; rescue coordination requests</li>
                  <li>Manage your staff and assign roles</li>
                  <li>Provide emergency and routine animal care services</li>
                  <li>Coordinate with NGOs, volunteers, and other partners</li>
                  <li>Showcase your facilities and capabilities</li>
                </ul>
              </div>
              <p style="margin:0 0 16px; color:#666; font-size:13px; line-height:1.6;">
                Log in now to access your Enterprise Partner dashboard and start making a difference.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #e0f2e0; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact us at <a href="mailto:info@animalsathi.com" style="color:#16a34a;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      } else {
        // status === "rejected"
        mailOptions.subject = `Update Regarding Your ${entityTypeLabel} Registration — AnimalSathi`;
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Thank you for your interest in registering "${nameStr}" as an AnimalSathi Enterprise Partner.`,
          "",
          "After careful review, we regret to inform you that your application could not be approved at this time.",
          ...(reasonStr ? ["", `Reason: ${reasonStr}`, ""] : []),
          "This decision does not prevent you from reapplying in the future. If you believe there has been an error or would like to provide additional information, please contact our support team.",
          "",
          "You can reapply by visiting our platform and submitting a new application with updated details.",
          "",
          "If you have any questions, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enterprise Partner Application Update</title>
</head>
<body style="margin:0; padding:0; background-color:#fef2f2; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(220,38,38,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">ℹ️</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Application Update</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Enterprise Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #dc2626, #fca5a5, #dc2626);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName}
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Thank you for your interest in registering <strong style="color:#991b1b;">"${nameStr}"</strong> as an AnimalSathi Enterprise Partner.
              </p>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0; color:#dc2626; font-size:13px; line-height:1.6;">
                  After careful review, we regret to inform you that your application could not be approved at this time.
                </p>
                ${reasonStr ? `<p style="margin:12px 0 0; color:#991b1b; font-size:13px; font-weight:600;">Reason: ${reasonStr}</p>` : ""}
              </div>
              <p style="margin:0 0 10px; color:#666; font-size:13px; line-height:1.6;">
                You can reapply with updated details at any time. If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #fee2e2; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact our team at <a href="mailto:info@animalsathi.com" style="color:#dc2626;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      }

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[PAWSOS-ORG-NOTIFY] Email sent successfully", {
        to: emailStr,
        status,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      // Email failure does NOT block the admin action — just log it
      logger.error("[PAWSOS-ORG-NOTIFY] Email send failed (non-blocking):", {
        error: emailError.message || "N/A",
        orgEmail: emailStr,
        org: nameStr,
        status,
      });
    }

    return {
      success: true,
      emailSent,
    };
  }
);

// ---------------------------------------------------------------------------
// notifyNGOApprovalStatus  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends an email notification to an NGO when their account is
 * approved or rejected by an admin.
 *
 * Reuses the same SMTP transporter and secrets as the OTP email system.
 * Approval/Rejection is never blocked by email delivery — failures are
 * logged and swallowed.
 *
 * Request body:
 *   { ngoEmail: string, ngoName: string, contactPerson: string, status: "approved" | "rejected", reason?: string }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.notifyNGOApprovalStatus = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const { ngoEmail, ngoName, contactPerson, status, reason } = request.data || {};

    logger.info("[PAWSOS-NGO-NOTIFY] Sending NGO status notification", {
      ngoEmail,
      ngoName,
      contactPerson,
      status,
      hasReason: !!reason,
    });

    // ── Input validation ──
    if (!ngoEmail || !ngoName || !status) {
      throw new HttpsError(
        "invalid-argument",
        "ngoEmail, ngoName, and status are required."
      );
    }

    if (status !== "approved" && status !== "rejected") {
      throw new HttpsError(
        "invalid-argument",
        'status must be "approved" or "rejected".'
      );
    }

    const emailStr = String(ngoEmail).trim().toLowerCase();
    const nameStr = String(ngoName).trim();
    const contactStr = contactPerson ? String(contactPerson).trim() : "";
    const reasonStr = reason ? String(reason).trim() : "";
    const greetingName = contactStr || nameStr;

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
      };

      if (status === "approved") {
        mailOptions.subject = "AnimalSathi NGO Registration Approved";
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Congratulations! Your NGO "${nameStr}" has been reviewed and approved by the AnimalSathi team.`,
          "",
          "You can now access all NGO features on the platform and start making a difference.",
          "",
          "What you can do now:",
          "• Post SOS alerts and rescue requests for animals in need",
          "• Coordinate with local veterinarians and volunteers",
          "• Connect with other NGOs and animal welfare organizations",
          "• Manage your NGO profile and showcase your work",
          "• Receive donations and support from the community",
          "",
          "If you have any questions or need support, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NGO Registration Approved</title>
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(22,101,52,0.10);">
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">🎉</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">NGO Registration Approved!</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi NGO Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #22c55e, #86efac, #22c55e);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName} 🙌
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Congratulations! Your NGO <strong style="color:#16a34a;">"${nameStr}"</strong> has been reviewed and approved by the AnimalSathi team.
              </p>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0 0 12px; color:#15803d; font-size:13px; font-weight:600;">
                  🌟 What you can do now:
                </p>
                <ul style="margin:0; padding-left:20px; color:#555; font-size:13px; line-height:1.8;">
                  <li>Post SOS alerts &amp; rescue requests for animals in need</li>
                  <li>Coordinate with local veterinarians and volunteers</li>
                  <li>Connect with other NGOs and animal welfare organizations</li>
                  <li>Manage your NGO profile and showcase your work</li>
                  <li>Receive donations and support from the community</li>
                </ul>
              </div>
              <p style="margin:0 0 16px; color:#666; font-size:13px; line-height:1.6;">
                Log in now to access all NGO features and start making a difference.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #e0f2e0; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact us at <a href="mailto:info@animalsathi.com" style="color:#16a34a;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      } else {
        // status === "rejected"
        mailOptions.subject = "Update Regarding Your NGO Registration";
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Thank you for your interest in registering "${nameStr}" with AnimalSathi.`,
          "",
          "After careful review, we regret to inform you that your NGO registration could not be approved at this time.",
          ...(reasonStr ? ["", `Reason: ${reasonStr}`, ""] : []),
          "This decision does not prevent you from reapplying in the future. If you believe there has been an error or would like to provide additional information, please contact our support team.",
          "",
          "You can reapply by visiting our platform and submitting a new application with updated details.",
          "",
          "If you have any questions, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NGO Registration Update</title>
</head>
<body style="margin:0; padding:0; background-color:#fef2f2; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(220,38,38,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">ℹ️</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Registration Update</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi NGO Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #dc2626, #fca5a5, #dc2626);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName}
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Thank you for your interest in registering <strong style="color:#991b1b;">"${nameStr}"</strong> with AnimalSathi.
              </p>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0; color:#dc2626; font-size:13px; line-height:1.6;">
                  After careful review, we regret to inform you that your NGO registration could not be approved at this time.
                </p>
                ${reasonStr ? `<p style="margin:12px 0 0; color:#991b1b; font-size:13px; font-weight:600;">Reason: ${reasonStr}</p>` : ""}
              </div>
              <p style="margin:0 0 10px; color:#666; font-size:13px; line-height:1.6;">
                You can reapply with updated details at any time. If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #fee2e2; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact our team at <a href="mailto:info@animalsathi.com" style="color:#dc2626;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      }

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[PAWSOS-NGO-NOTIFY] Email sent successfully", {
        to: emailStr,
        status,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      // Email failure does NOT block the admin action — just log it
      logger.error("[PAWSOS-NGO-NOTIFY] Email send failed (non-blocking):", {
        error: emailError.message || "N/A",
        ngoEmail: emailStr,
        ngo: nameStr,
        status,
      });
    }

    return {
      success: true,
      emailSent,
    };
  }
);

// ---------------------------------------------------------------------------
// notifyOrgApprovalStatus  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends an email notification to an organization (hospital/vet clinic) when
 * their Enterprise Partner application is approved or rejected by an admin.
 *
 * Reuses the same SMTP transporter and secrets as the OTP email system.
 * Approval/Rejection is never blocked by email delivery — failures are
 * logged and swallowed.
 *
 * Request body:
 *   { orgEmail: string, orgName: string, contactPerson: string, type: string, status: "approved" | "rejected", reason?: string }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.notifyOrgApprovalStatus = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const { orgEmail, orgName, contactPerson, type, status, reason } = request.data || {};

    logger.info("[PAWSOS-ORG-NOTIFY] Sending organization status notification", {
      orgEmail,
      orgName,
      contactPerson,
      type,
      status,
      hasReason: !!reason,
    });

    // ── Input validation ──
    if (!orgEmail || !orgName || !status) {
      throw new HttpsError(
        "invalid-argument",
        "orgEmail, orgName, and status are required."
      );
    }

    if (status !== "approved" && status !== "rejected") {
      throw new HttpsError(
        "invalid-argument",
        'status must be "approved" or "rejected".'
      );
    }

    const emailStr = String(orgEmail).trim().toLowerCase();
    const nameStr = String(orgName).trim();
    const contactStr = contactPerson ? String(contactPerson).trim() : "";
    const typeStr = type ? String(type).trim() : "organization";
    const reasonStr = reason ? String(reason).trim() : "";
    const greetingName = contactStr || nameStr;
    const entityTypeLabel = typeStr === "hospital" ? "Hospital" : typeStr === "vet" ? "Veterinary Clinic" : "Organization";

    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
      };

      if (status === "approved") {
        mailOptions.subject = `Your ${entityTypeLabel} Registration Has Been Approved — AnimalSathi`;
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Congratulations! Your ${entityTypeLabel.toLowerCase()} "${nameStr}" has been verified and approved by the AnimalSathi Enterprise Partner team.`,
          "",
          `Your ${entityTypeLabel.toLowerCase()} can now access all Enterprise Partner features on the platform.`,
          "",
          "What you can do now:",
          "• Respond to SOS alerts and rescue coordination requests",
          "• Manage your staff and assign roles (vets, volunteers, admins)",
          "• Provide emergency and routine animal care services",
          "• Coordinate with NGOs, volunteers, and other partners",
          "• Showcase your facilities and capabilities on your profile",
          "",
          "If you have any questions or need support, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enterprise Partner Approved</title>
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(22,101,52,0.10);">
          <tr>
            <td style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">✅</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Enterprise Partner Approved!</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Enterprise Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #22c55e, #86efac, #22c55e);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName} 🙌
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Congratulations! Your ${entityTypeLabel.toLowerCase()} <strong style="color:#16a34a;">"${nameStr}"</strong> has been verified and approved as an AnimalSathi Enterprise Partner.
              </p>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0 0 12px; color:#15803d; font-size:13px; font-weight:600;">
                  ⚕️ What you can do now:
                </p>
                <ul style="margin:0; padding-left:20px; color:#555; font-size:13px; line-height:1.8;">
                  <li>Respond to SOS alerts &amp; rescue coordination requests</li>
                  <li>Manage your staff and assign roles</li>
                  <li>Provide emergency and routine animal care services</li>
                  <li>Coordinate with NGOs, volunteers, and other partners</li>
                  <li>Showcase your facilities and capabilities</li>
                </ul>
              </div>
              <p style="margin:0 0 16px; color:#666; font-size:13px; line-height:1.6;">
                Log in now to access your Enterprise Partner dashboard and start making a difference.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #e0f2e0; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact us at <a href="mailto:info@animalsathi.com" style="color:#16a34a;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      } else {
        // status === "rejected"
        mailOptions.subject = `Update Regarding Your ${entityTypeLabel} Registration — AnimalSathi`;
        mailOptions.text = [
          `Hello ${greetingName},`,
          "",
          `Thank you for your interest in registering "${nameStr}" as an AnimalSathi Enterprise Partner.`,
          "",
          "After careful review, we regret to inform you that your application could not be approved at this time.",
          ...(reasonStr ? ["", `Reason: ${reasonStr}`, ""] : []),
          "This decision does not prevent you from reapplying in the future. If you believe there has been an error or would like to provide additional information, please contact our support team.",
          "",
          "You can reapply by visiting our platform and submitting a new application with updated details.",
          "",
          "If you have any questions, please reply to this email or contact us at info@animalsathi.com.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].filter(Boolean).join("\n");
        mailOptions.html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enterprise Partner Application Update</title>
</head>
<body style="margin:0; padding:0; background-color:#fef2f2; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;
                 box-shadow: 0 4px 24px rgba(220,38,38,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
                        padding: 36px 40px 28px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.15);
                          border-radius:50%; width:64px; height:64px; line-height:64px;
                          font-size:30px; margin-bottom:14px;">ℹ️</div>
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                          letter-spacing:0.5px;">Application Update</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;
                         letter-spacing:0.3px;">AnimalSathi Enterprise Network</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #dc2626, #fca5a5, #dc2626);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">
                Hello ${greetingName}
              </p>
              <p style="margin:0 0 20px; color:#666666; font-size:14px; line-height:1.6;">
                Thank you for your interest in registering <strong style="color:#991b1b;">"${nameStr}"</strong> as an AnimalSathi Enterprise Partner.
              </p>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:20px 24px; margin-bottom:20px;">
                <p style="margin:0; color:#dc2626; font-size:13px; line-height:1.6;">
                  After careful review, we regret to inform you that your application could not be approved at this time.
                </p>
                ${reasonStr ? `<p style="margin:12px 0 0; color:#991b1b; font-size:13px; font-weight:600;">Reason: ${reasonStr}</p>` : ""}
              </div>
              <p style="margin:0 0 10px; color:#666; font-size:13px; line-height:1.6;">
                You can reapply with updated details at any time. If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #fee2e2; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align:center;">
              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">
                Questions? Contact our team at <a href="mailto:info@animalsathi.com" style="color:#dc2626;">info@animalsathi.com</a>
              </p>
              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">
                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      }

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[PAWSOS-ORG-NOTIFY] Email sent successfully", {
        to: emailStr,
        status,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      // Email failure does NOT block the admin action — just log it
      logger.error("[PAWSOS-ORG-NOTIFY] Email send failed (non-blocking):", {
        error: emailError.message || "N/A",
        orgEmail: emailStr,
        org: nameStr,
        status,
      });
    }

    return {
      success: true,
      emailSent,
    };
  }
);

// ---------------------------------------------------------------------------
// sendPasswordReset  –  callable function
// ---------------------------------------------------------------------------

/**
 * Sends a password reset email to the user via the custom SMTP transporter
 * (instead of Firebase's default noreply sender).
 *
 * Uses the Firebase Admin SDK to generate a password reset link, then sends
 * it through the same nodemailer transporter used for OTP and notification
 * emails, so the sender address matches the app's brand.
 *
 * Request body:
 *   { email: string }
 *
 * Response:
 *   { success: true, emailSent: boolean }
 */
exports.sendPasswordReset = onCall(
  {
    secrets: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    minInstances: 0,
    maxInstances: 5,
  },
  async (request) => {
    const { email } = request.data || {};

    logger.info("[PAWSOS-RESET] ════════════════════════════════════════════");
    logger.info("[PAWSOS-RESET] 🚀 sendPasswordReset called", {
      hasEmail: !!email,
      callerAuthenticated: !!request.auth,
    });

    // ── Input validation ──
    if (!email) {
      logger.error("[PAWSOS-RESET] ❌ Email is required");
      throw new HttpsError("invalid-argument", "Email is required.");
    }

    const emailStr = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      logger.error("[PAWSOS-RESET] ❌ Invalid email format", { email: emailStr });
      throw new HttpsError("invalid-argument", "Please enter a valid email address.");
    }

    // ── Check if user exists in Firebase Auth ──
    logger.info("[PAWSOS-RESET] 🔍 Checking if user exists", { email: emailStr });
    try {
      await admin.auth().getUserByEmail(emailStr);
      logger.info("[PAWSOS-RESET] ✅ User found, proceeding");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        logger.warn("[PAWSOS-RESET] ⚠️ User not found — sending generic response for security");
        // Return success even if user not found (security best practice)
        return { success: true, emailSent: false };
      }
      logger.error("[PAWSOS-RESET] ❌ getUserByEmail unexpected error:", err.message);
      throw new HttpsError("internal", "Unable to process request. Please try again.");
    }

    // ── Generate password reset link ──
    logger.info("[PAWSOS-RESET] 🔗 Generating password reset link", { email: emailStr });
    let resetLink;
    try {
      resetLink = await admin.auth().generatePasswordResetLink(emailStr, {
        url: process.env.APP_URL || "https://animalsathi.com",
        handleCodeInApp: false,
      });
      logger.info("[PAWSOS-RESET] ✅ Reset link generated");
    } catch (linkErr) {
      logger.error("[PAWSOS-RESET] ❌ Failed to generate reset link:", linkErr.message);
      throw new HttpsError("internal", "Failed to generate reset link. Please try again.");
    }

    // ── Send email via custom SMTP ──
    let emailSent = false;

    try {
      const transport = await getTransporter();
      const fromAddr = process.env.SMTP_FROM || "noreply@pawsos.app";

      const mailOptions = {
        from: fromAddr,
        to: emailStr,
        subject: "Reset Your AnimalSathi Password",
        text: [
          "Hello,",
          "",
          "We received a request to reset the password for your AnimalSathi account.",
          "",
          "Click the link below to reset your password. This link is valid for 1 hour.",
          "",
          resetLink,
          "",
          "If you did not request a password reset, you can safely ignore this email.",
          "",
          "For security, do not share this link with anyone.",
          "",
          "Warm regards,",
          "Team AnimalSathi",
        ].join("\n"),
        html: [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '  <meta charset="UTF-8" />',
          '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
          '  <title>Reset Your Password</title>',
          '</head>',
          '<body style="margin:0; padding:0; background-color:#f5ede0; font-family:\'Segoe UI\', Arial, sans-serif;">',
          '  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5ede0; padding: 40px 16px;">',
          '    <tr>',
          '      <td align="center">',
          '        <table width="100%" cellpadding="0" cellspacing="0" border="0"',
          '          style="max-width:520px; background:#ffffff; border-radius:20px; overflow:hidden;',
          '                 box-shadow: 0 4px 24px rgba(156,62,35,0.10);">',
          '          <tr>',
          '            <td style="background: linear-gradient(135deg, #9c3e23 0%, #c0522e 60%, #e07040 100%);',
          '                        padding: 36px 40px 28px; text-align:center;">',
          '              <div style="display:inline-block; background:rgba(255,255,255,0.15);',
          '                          border-radius:50%; width:64px; height:64px; line-height:64px;',
          '                          font-size:30px; margin-bottom:14px;">&#x1F510;</div>',
          '              <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700;',
          '                          letter-spacing:0.5px;">Reset Your Password</h1>',
          '              <p style="margin:6px 0 0; color:rgba(255,255,255,0.80); font-size:13px;',
          '                         letter-spacing:0.3px;">by AnimalSathi · Community Animal Rescue</p>',
          '            </td>',
          '          </tr>',
          '          <tr>',
          '            <td style="height:4px;',
          '                        background: linear-gradient(90deg, #FF5722, #ff8a50, #FF5722);"></td>',
          '          </tr>',
          '          <tr>',
          '            <td style="padding: 36px 40px 28px;">',
          '              <p style="margin:0 0 6px; color:#333333; font-size:16px; font-weight:600;">',
          '                Hello 👋</p>',
          '              <p style="margin:0 0 24px; color:#666666; font-size:14px; line-height:1.6;">',
          '                We received a request to reset the password for your <strong style="color:#9c3e23;">AnimalSathi</strong> account.',
          '                Click the button below to set a new password.</p>',
          '              <table width="100%" cellpadding="0" cellspacing="0" border="0">',
          '                <tr>',
          '                  <td align="center" style="padding: 8px 0 20px;">',
          '                    <table cellpadding="0" cellspacing="0" border="0">',
          '                      <tr>',
          '                        <td align="center" style="background: linear-gradient(135deg, #9c3e23 0%, #c0522e 100%);',
          '                                    border-radius: 12px; padding: 14px 36px;">',
          '                          <a href="' + resetLink + '" target="_blank"',
          '                            style="color:#ffffff; font-size:15px; font-weight:700; text-decoration:none;',
          '                                   letter-spacing:0.5px; display:inline-block;">',
          '                            Reset Password',
          '                          </a>',
          '                        </td>',
          '                      </tr>',
          '                    </table>',
          '                  </td>',
          '                </tr>',
          '              </table>',
          '              <p style="margin:0 0 20px; color:#888888; font-size:12px; line-height:1.6; text-align:center;">',
          '                Or copy this link into your browser:<br/>',
          '                <span style="color:#9c3e23; font-size:11px; word-break:break-all;">' + resetLink + '</span></p>',
          '              <div style="background:#fff8f5; border:1px solid #f0e0d0; border-radius:12px; padding:16px 20px; margin-bottom:8px;">',
          '                <p style="margin:0; color:#888888; font-size:12px; line-height:1.6;">',
          '                  🔒 This link is valid for <strong>1 hour</strong>.<br/>',
          '                  If you did not request this, you can safely ignore this email.</p>',
          '              </div>',
          '            </td>',
          '          </tr>',
          '          <tr>',
          '            <td style="padding: 0 40px;">',
          '              <hr style="border:none; border-top:1px solid #f0e8e0; margin:0;" />',
          '            </td>',
          '          </tr>',
          '          <tr>',
          '            <td style="padding: 24px 40px 32px; text-align:center;">',
          '              <p style="margin:0 0 8px; color:#aaaaaa; font-size:11px;">',
          '                Need help? Write to us at <a href="mailto:info@animalsathi.com" style="color:#9c3e23;">info@animalsathi.com</a></p>',
          '              <p style="margin:16px 0 0; color:#cccccc; font-size:10px;">',
          '                © 2026 AnimalSathi &nbsp;·&nbsp; Made with 🧡 for animals across India<br/>',
          '                GL Bajaj Institute, Knowledge Park III, Greater Noida, UP</p>',
          '            </td>',
          '          </tr>',
          '        </table>',
          '      </td>',
          '    </tr>',
          '  </table>',
          '</body>',
          '</html>',
        ].join("\n"),
      };

      const sendResult = await transport.sendMail(mailOptions);
      emailSent = true;

      logger.info("[PAWSOS-RESET] ✅ Password reset email sent", {
        to: emailStr,
        messageId: sendResult.messageId || "N/A",
      });
    } catch (emailError) {
      logger.error("[PAWSOS-RESET] ❌ Email send failed:", {
        error: emailError.message || "N/A",
        to: emailStr,
      });
      throw new HttpsError("internal", "Failed to send reset email. Please try again.");
    }

    logger.info("[PAWSOS-RESET] ✅ sendPasswordReset completed successfully", {
      email: emailStr,
      emailSent,
    });
    logger.info("[PAWSOS-RESET] ════════════════════════════════════════════");

    return {
      success: true,
      emailSent,
    };
  }
);
