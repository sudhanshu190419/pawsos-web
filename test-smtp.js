/**
 * Standalone SMTP Test Script
 * ----------------------------
 * Tests Titan Email SMTP connectivity for info@animalsathi.com
 *
 * Usage:
 *   node test-smtp.js                     # prompts for password
 *   node test-smtp.js --to you@example.com # prompts + sends test email
 *   SMTP_PASS=yourpass node test-smtp.js  # skip prompt (env var)
 *
 * No credentials are hardcoded in the script.
 */

const nodemailer = require("nodemailer");
const readline = require("readline");

const HOST = "smtpout.secureserver.net";
const PORT = 587;
const SECURE = false;
const USER = "info@animalsathi.com";

// Parse CLI args
const args = process.argv.slice(2);
const toIndex = args.indexOf("--to");
const TO_EMAIL = toIndex !== -1 && args[toIndex + 1] ? args[toIndex + 1] : null;

/**
 * Prompt for password via stdin (no masking — this is a local dev script).
 */
function askPassword(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Resolve the SMTP password, checking env var first, then prompting.
 */
async function resolvePassword() {
  if (process.env.SMTP_PASS) {
    console.log("📦 Using SMTP_PASS from environment variable.\n");
    return process.env.SMTP_PASS;
  }
  return askPassword("Enter SMTP password: ");
}

async function main() {
  console.log("==============================================");
  console.log("  Titan SMTP Connectivity Test");
  console.log(`  Host: ${HOST}:${PORT} (secure: ${SECURE})`);
  console.log(`  User: ${USER}`);
  console.log("==============================================\n");

  const pass = await resolvePassword();

  if (!pass) {
    console.error("❌ No password provided. Exiting.");
    process.exit(1);
  }

  console.log("\n🔍 Creating transporter and verifying connection...\n");

  const transporter = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: SECURE,
    auth: {
      user: USER,
      pass: pass,
    },
    // Increase timeouts for slower SMTP servers
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  try {
    const success = await transporter.verify();
    console.log("✅ SUCCESS — SMTP connection verified!");
    console.log(`   Titan Email is accepting credentials for ${USER}\n`);

    // Send a test email if --to was provided
    if (TO_EMAIL) {
      console.log(`📧 Sending test email to ${TO_EMAIL}...\n`);

      const info = await transporter.sendMail({
        from: `"AnimalSathi Test" <${USER}>`,
        to: TO_EMAIL,
        subject: "SMTP Test — AnimalSathi Titan Email",
        text: [
          "This is a test email sent from the AnimalSathi SMTP test script.",
          "",
          `Host: ${HOST}:${PORT}`,
          `User: ${USER}`,
          `Time: ${new Date().toISOString()}`,
          "",
          "If you received this, the SMTP configuration is working correctly.",
        ].join("\n"),
        html: `
          <div style="font-family: sans-serif; max-width: 480px; padding: 24px;">
            <h2 style="color: #ea580c;">✅ SMTP Test Successful</h2>
            <p>This is a test email from the AnimalSathi Titan Email configuration.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <pre style="background: #f9fafb; padding: 12px; border-radius: 6px; font-size: 13px;">
Host: ${HOST}:${PORT}
User: ${USER}
Time: ${new Date().toISOString()}
            </pre>
            <p style="color: #6b7280; font-size: 13px;">Titan SMTP is properly configured for AnimalSathi.</p>
          </div>
        `,
      });

      console.log(`✅ Test email sent successfully!`);
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Accepted:   ${info.accepted?.join(", ")}`);
      console.log(`   Response:   ${info.response}`);
    } else {
      console.log("ℹ️  To also send a test email, re-run with:");
      console.log("   node test-smtp.js --to recipient@example.com\n");
    }
  } catch (err) {
    console.error("❌ FAILED — SMTP connection could not be established.\n");

    // Print detailed error info
    if (err.code) console.error(`   Error code:    ${err.code}`);
    if (err.errno) console.error(`   Error number:  ${err.errno}`);
    if (err.syscall) console.error(`   Syscall:       ${err.syscall}`);
    if (err.command) console.error(`   Command:       ${err.command}`);

    console.error(`\n   Full message:  ${err.message}`);

    // Nodemailer-specific SMTP response
    if (err.response) {
      console.error(`   SMTP response: ${err.response}`);
    }

    // Common troubleshooting hints
    console.error("\n📋 Troubleshooting tips:");
    if (err.code === "EAUTH") {
      console.error("   • Check that the password is correct.");
      console.error("   • Verify the email address is exactly info@animalsathi.com.");
      console.error("   • Ensure Titan Email login credentials are not expired.");
    } else if (err.code === "ETIMEDOUT" || err.code === "ESOCKET") {
      console.error("   • Check your internet connection / firewall.");
      console.error("   • Verify smtp.titan.email:465 is reachable.");
      console.error("   • Some networks block SMTP ports — try a different network.");
      console.error("   • Run: telnet smtp.titan.email 465");
    } else if (err.code === "EENVELOPE") {
      console.error("   • The FROM address may not be accepted by Titan.");
    } else {
      console.error("   • Verify Titan Email SMTP credentials in your control panel.");
      console.error("   • Ensure SMTP access is enabled for your Titan Email account.");
    }

    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
