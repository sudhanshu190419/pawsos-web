# Cloud Functions Setup Guide - PawSOS OTP Verification

## Overview
This directory contains Cloud Functions for PawSOS OTP email verification.

### Functions Deployed:
1. **sendOtp** - Generate 6-digit OTP, store in Firestore, send via email
2. **verifyOtp** - Verify OTP, create Firebase Auth user + Firestore profile
3. **cleanupExpiredOtps** - Scheduled function (every 15 min) to clean expired OTPs

---

## Prerequisites

1. **Node.js 20+** installed
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Firebase Project** created with:
   - Firestore enabled
   - Authentication enabled
   - Cloud Functions enabled
   - Cloud Scheduler enabled (for scheduled cleanup)

4. **Gmail App Password** (if using Gmail SMTP):
   - Go to https://myaccount.google.com/apppasswords
   - Generate an app password for "Mail"
   - Use this as `SMTP_PASS`

---

## Installation

```bash
# Install dependencies
cd functions
npm install

# Go back to project root
cd ..
```

---

## Firebase Secrets Configuration

**These secrets store your SMTP credentials securely.**

Run the following commands **once**:

```bash
# Set SMTP configuration
firebase functions:secrets:set SMTP_HOST
# Paste: smtp.gmail.com

firebase functions:secrets:set SMTP_PORT
# Paste: 587

firebase functions:secrets:set SMTP_USER
# Paste: your-email@gmail.com

firebase functions:secrets:set SMTP_PASS
# Paste: your-app-password (NOT your Gmail password!)

firebase functions:secrets:set SMTP_FROM
# Paste: your-email@gmail.com (or noreply@yourdomain.com)
```

### Verify Secrets:
```bash
firebase functions:secrets:list
```

You should see all 5 secrets listed.

---

## Firestore Setup

### 1. Create Collections & Documents

#### Collection: `otps`
Structure:
```javascript
{
  email: string,              // user@example.com
  name: string,               // Full Name
  password: string,           // hashed password (temporary)
  otpHash: string,            // SHA-256 hash of OTP
  createdAt: timestamp,       // server timestamp
  expiresAt: timestamp,       // Date.now() + 5 minutes
  attempts: number,           // increment on wrong OTP
  verified: boolean           // false until verified
}
```

#### Collection: `users`
Structure:
```javascript
{
  uid: string,                // Firebase Auth UID
  email: string,
  name: string,
  photoURL: string|null,
  role: string,               // "user", "volunteer", "ngo"
  emailVerified: boolean,     // true after OTP verification
  volunteerApproved: boolean,
  ngoApproved: boolean,
  provider: string,           // "email", "google"
  createdAt: timestamp,
  lastLoginAt: timestamp
}
```

### 2. Firestore Security Rules

Add these rules in Firebase Console → Firestore → Rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // OTPs collection - only backend can write/read
    match /otps/{document=**} {
      allow read, write: if request.auth == null && request.auth.token.firebase.sign_in_provider == 'custom';
      allow read, write: if false;
    }
    
    // Users collection
    match /users/{userId} {
      // User can read own document
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Only backend can write (via Cloud Functions)
      allow create, update, delete: if false;
    }
    
    // Catch-all deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Deployment

### Option 1: Deploy Only Functions
```bash
firebase deploy --only functions
```

### Option 2: Deploy Everything (Functions + Hosting)
```bash
npm run build  # Build Next.js
firebase deploy
```

### View Live Logs
```bash
firebase functions:log --lines 50
```

---

## Local Development / Testing

### Test with Emulator
```bash
# Install emulator suite if not already installed
firebase setup:emulators:firestore
firebase setup:emulators:functions

# Start emulator
npm run serve
```

Then use the emulator URL in your frontend code:
```javascript
const functions = firebase.functions('http://localhost:5001');
```

### Manual Testing

```bash
# Enter Firebase CLI shell
npm run shell

# Call function (example)
sendOtp({ email: 'test@example.com', name: 'John Doe', password: 'password123' })
```

---

## Troubleshooting

### SMTP Errors
**Problem**: "SMTP connection failed"
- Verify Gmail app password: https://myaccount.google.com/apppasswords
- Check secrets are set: `firebase functions:secrets:list`
- Ensure 2FA is enabled on Gmail account

### Function Not Deploying
**Problem**: "Function failed to deploy"
```bash
# Check dependencies
npm install

# Clean install
rm -rf node_modules package-lock.json
npm install

# Deploy with verbose output
firebase deploy --only functions --debug
```

### OTP Not Received
**Problem**: Email not arriving
- Check spam/junk folder
- Verify recipient email in Firestore `otps` collection
- Check Firebase logs: `firebase functions:log`

### Firestore Rules Error
**Problem**: "Missing or insufficient permissions"
- Ensure rules allow Cloud Functions to write to `otps`
- Functions use `admin` context (bypasses rules)
- User context is used for `users` collection reads

---

## Environment Variables

### Runtime Config (Optional)
If you need runtime configuration values, use `.runtimeconfig.json`:

```json
{
  "email": {
    "from_name": "PawSOS Team",
    "support_email": "support@pawsos.app"
  },
  "otp": {
    "expiry_minutes": 5,
    "max_attempts": 5,
    "rate_limit_minutes": 5,
    "rate_limit_max": 3
  }
}
```

Deploy with:
```bash
firebase functions:config:set email.from_name="PawSOS Team"
```

---

## Monitoring & Logs

### View Function Logs
```bash
firebase functions:log
firebase functions:log --lines 100
firebase functions:log --limit 50 --follow
```

### Check Function Execution Times
- Go to Firebase Console → Functions
- View "Execution Count" and "Execution Time" metrics

### Monitor Errors
- Logs prefixed with `[PAWSOS-OTP]` for easy filtering
- Check `error` level logs for issues

---

## Next Steps

After deploying Cloud Functions:

1. **Create Frontend Components** (Phase 2)
   - SignupWithOTP.tsx
   - OTPVerificationScreen.tsx
   - API route wrappers

2. **Test End-to-End**
   - User signs up → Receives OTP email
   - User verifies OTP → Account created
   - User auto-signs in

3. **Configure Email Templates**
   - Edit HTML in `verifyOtp` function
   - Add branding/logo
   - Customize text

---

## Security Best Practices

✅ **DO:**
- Store OTP hashes only (never raw OTP)
- Use HTTPS for all API calls
- Implement rate limiting (already done)
- Clean up expired OTPs (scheduled job)
- Use strong passwords (min 6 chars enforced)

❌ **DON'T:**
- Store SMTP password in code (use secrets)
- Expose verificationId to logged console
- Allow unlimited OTP requests
- Log sensitive user data

---

## Support

For issues, check:
1. Cloud Functions logs: `firebase functions:log`
2. Firestore console for data
3. Firebase authentication settings
4. SMTP configuration

---

## References
- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firebase Admin SDK](https://firebase.google.com/docs/reference/admin)
- [Nodemailer Docs](https://nodemailer.com)
- [Cloud Scheduler](https://cloud.google.com/scheduler/docs)
