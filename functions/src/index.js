/**
 * Cloud Functions for PawSOS OTP Verification
 *
 * Functions:
 * - sendOtp: Generate 6-digit OTP, store in Firestore, send via email
 * - verifyOtp: Verify OTP, create Firebase user + Firestore document
 * - cleanupExpiredOtps: Scheduled cleanup of expired OTP documents
 */

const { setGlobalOptions } = require("firebase-functions");
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
        subject: "🐾 Your PawSOS Verification Code",
        text: `Hello ${nameStr},\n\nYour PawSOS verification code is:\n\n  ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, you can safely ignore this email.\n\n– Team PawSOS`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #fcf2dc; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #FF5722; font-size: 22px; margin: 0;">🐾 PawSOS</h1>
              <p style="color: #777; font-size: 14px; margin: 4px 0 0;">Verify your email address</p>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 24px; text-align: center;">
              <p style="color: #333; font-size: 15px; margin: 0 0 16px;">Hello <strong>${nameStr}</strong>,</p>
              <p style="color: #555; font-size: 14px; margin: 0 0 12px;">Your verification code is:</p>
              <div style="background: #fcf2dc; border-radius: 12px; padding: 16px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #FF5722; margin: 0 0 16px;">
                ${otp}
              </div>
              <p style="color: #999; font-size: 12px; margin: 0;">This code expires in <strong>5 minutes</strong>.</p>
            </div>
            <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 20px;">
              If you did not request this code, you can safely ignore this email.<br/>
              – Team PawSOS
            </p>
          </div>
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
