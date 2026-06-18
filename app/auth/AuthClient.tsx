"use client";

import { Logo } from "../components/Logo";
import { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";

import { auth, googleProvider, db, functions } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

/* --- Types */

/* --- Constants */

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
const RESEND_COOLDOWN = 60;

type ToastData = { msg: string; type: "error" | "success" } | null;

/* PAGE */

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [checking, setChecking] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [toast, setToast] = useState<ToastData>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const [step, setStep] = useState<"form" | "otp">("form");
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpAttemptsRef = useRef(0);

  /* ── Toast helper ── */

  const showToast = useCallback((msg: string, type: "error" | "success" = "error") => {
    console.log(`[AUTH] 🍞 Toast: [${type}] ${msg}`);
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  /* ── Auth state check ── */

  useEffect(() => {
    console.log("[AUTH] 🔍 Checking auth state...");
    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log("[AUTH] 👤 Auth state changed:", user ? `uid=${user.uid}` : "no user");
      setChecking(false);
    });
    return () => unsub();
  }, []);

  /* ── Resend cooldown timer ── */

  useEffect(() => {
    if (resendCooldown <= 0) return;
    console.log(`[AUTH] ⏱ Resend cooldown started: ${resendCooldown}s`);
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  /* ── OTP expiry timer ── */

  useEffect(() => {
    if (step !== "otp" || otpExpiryTimer <= 0) return;
    console.log(`[AUTH] ⏱ OTP expiry timer started: ${otpExpiryTimer}s`);

    const timer = setInterval(() => {
      setOtpExpiryTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          console.log("[AUTH] ⏱ OTP EXPIRED");
          showToast("OTP has expired. Please request a new one.", "error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, otpExpiryTimer, showToast]);

  /* ── Auto-submit OTP when 6 digits entered ── */

  useEffect(() => {
    if (otp.length === OTP_LENGTH && step === "otp" && !loadingText) {
      console.log("[AUTH] 🔢 6 digits entered — auto-submitting OTP");
      handleOtpVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  /* ── Form validation ── */

  const validateForm = useCallback((): boolean => {
    console.log("[AUTH] 🔍 Validating signup form...");

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      console.warn("[AUTH] ❌ Validation failed: missing fields", {
        name: !!name.trim(),
        email: !!email.trim(),
        password: !!password.trim(),
        confirmPassword: !!confirmPassword.trim(),
      });
      showToast("Please fill in all fields.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.warn("[AUTH] ❌ Validation failed: invalid email", { email: email.trim() });
      showToast("Please enter a valid email address.");
      return false;
    }

    if (password !== confirmPassword) {
      console.warn("[AUTH] ❌ Validation failed: passwords do not match");
      showToast("Passwords do not match.");
      return false;
    }

    if (password.length < 6) {
      console.warn("[AUTH] ❌ Validation failed: password too short", { length: password.length });
      showToast("Password must be at least 6 characters.");
      return false;
    }

    console.log("[AUTH] ✅ Form validation passed");
    return true;
  }, [name, email, password, confirmPassword, showToast]);

  /* ── Email auth (signup sends OTP, login signs in) ── */

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AUTH] ════════════════════════════════════════");
    console.log(`[AUTH] 🚀 handleEmailAuth called — mode: ${isSignup ? "signup" : "login"}`);

    if (isSignup && !validateForm()) {
      console.log("[AUTH] 🛑 Signup aborted — validation failed");
      return;
    }

    setLoadingText("Wait a moment...");

    try {
      if (isSignup) {
        setLoadingText("Sending code...");
        console.log("[AUTH] 📤 Calling cloud function: sendOtp", {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          passwordLength: password.length,
        });

        const sendOtp = httpsCallable(functions, "sendOtp");
        const startTime = Date.now();
        const res = await sendOtp({ email, name, password });
        const duration = Date.now() - startTime;
        const resData = res.data as { success: boolean; verificationId: string; expiresAt: number };

        console.log(`[AUTH] ✅ sendOtp response received in ${duration}ms`, {
          success: resData.success,
          verificationId: resData.verificationId ? resData.verificationId.substring(0, 8) + "..." : "N/A",
          hasExpiresAt: !!resData.expiresAt,
          expiresAt: resData.expiresAt ? new Date(resData.expiresAt).toISOString() : "N/A",
        });

        if (resData.success) {
          setVerificationId(resData.verificationId);
          setOtp("");
          setOtpError("");
          otpAttemptsRef.current = 0;
          setStep("otp");
          setResendCooldown(RESEND_COOLDOWN);

          // Sync expiry timer with server timestamp
          if (resData.expiresAt) {
            const remaining = Math.max(Math.floor((resData.expiresAt - Date.now()) / 1000), 0);
            console.log(`[AUTH] ⏱ Setting OTP expiry timer: ${remaining}s (from server)`);
            setOtpExpiryTimer(remaining);
          } else {
            console.log(`[AUTH] ⏱ Setting OTP expiry timer: ${OTP_EXPIRY_SECONDS}s (default)`);
            setOtpExpiryTimer(OTP_EXPIRY_SECONDS);
          }

          showToast("Verification code sent to your email.", "success");
          console.log("[AUTH] ✅ OTP sent — switched to OTP verification step");
        } else {
          console.error("[AUTH] ❌ sendOtp returned success=false", { data: resData });
          showToast("Failed to send verification code.");
        }
      } else {
        console.log("[AUTH] 🔐 Attempting email/password login...", { email });
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        console.log("[AUTH] ✅ Login successful", { uid: userCred.user.uid, emailVerified: userCred.user.emailVerified });

        if (!userCred.user.emailVerified) {
          console.warn("[AUTH] ⚠️ User email not verified");
          showToast("Please verify your email first.");
          setLoadingText("");
          return;
        }

        await setDoc(
          doc(db, "users", userCred.user.uid),
          { lastLoginAt: serverTimestamp() },
          { merge: true },
        );
        console.log("[AUTH] ✅ Firestore lastLoginAt updated, redirecting to:", redirectTo);
        router.push(redirectTo);
      }
    } catch (err: any) {
      console.error("[AUTH] ❌❌❌ handleEmailAuth failed");
      console.error("[AUTH] ❌ error?.code:", err?.code || "N/A");
      console.error("[AUTH] ❌ error?.message:", err?.message || "N/A");
      console.error("[AUTH] ❌ error?.details:", err?.details || "N/A");
      if (err?.stack) console.error("[AUTH] ❌ error?.stack:", err.stack);

      const message = err?.details?.message || err?.message || "Authentication failed.";
      showToast(message);
    } finally {
      setLoadingText("");
    }
  };

  /* ── Verify OTP ── */

  const handleOtpVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const otpStr = otp.trim();

    if (!otpStr || otpStr.length !== OTP_LENGTH || !/^\d{6}$/.test(otpStr)) {
      console.warn("[AUTH] ⚠️ OTP validation failed: invalid format", {
        length: otpStr.length,
        matchesRegex: /^\d{6}$/.test(otpStr),
      });
      setOtpError("Please enter a valid 6-digit verification code.");
      return;
    }

    if (otpExpiryTimer <= 0) {
      console.warn("[AUTH] ⚠️ OTP already expired — cannot verify");
      setOtpError("This code has expired. Please request a new one.");
      showToast("OTP has expired. Please request a new one.");
      return;
    }

    setOtpError("");
    setLoadingText("Verifying code...");

    console.log("[AUTH] ════════════════════════════════════════");
    console.log("[AUTH] 🔐 Calling cloud function: verifyOtp", {
      verificationId: verificationId ? verificationId.substring(0, 8) + "..." : "N/A",
      verificationIdFull: verificationId,
      otpLength: otpStr.length,
      expiryTimer: otpExpiryTimer,
    });

    try {
      const verifyOtp = httpsCallable(functions, "verifyOtp");
      const startTime = Date.now();
      const res = await verifyOtp({ verificationId, otp: otpStr });
      const duration = Date.now() - startTime;
      const resData = res.data as { success: boolean };

      console.log(`[AUTH] ✅ verifyOtp response received in ${duration}ms`, {
        success: resData.success,
        fullData: JSON.stringify(resData),
      });

      if (resData.success) {
        console.log("[AUTH] ✅ OTP verified — signing in with email+password", { email });

        setLoadingText("Signing in...");
        const signInStartTime = Date.now();
        await signInWithEmailAndPassword(auth, email, password);
        console.log(`[AUTH] ✅ Sign-in successful in ${Date.now() - signInStartTime}ms`);

        showToast("Account verified and created successfully!", "success");
        console.log("[AUTH] ✅ Redirecting to:", redirectTo);
        router.push(redirectTo);
      } else {
        console.error("[AUTH] ❌ verifyOtp returned success=false", { data: resData });
        showToast("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("[AUTH] ❌❌❌ verifyOtp failed");
      console.error("[AUTH] ❌ error?.code:", err?.code || "N/A");
      console.error("[AUTH] ❌ error?.message:", err?.message || "N/A");
      console.error("[AUTH] ❌ error?.details:", err?.details || "N/A");
      console.error("[AUTH] ❌ error?.details?.message:", err?.details?.message || "N/A");
      if (err?.stack) console.error("[AUTH] ❌ error?.stack:", err.stack);

      const errorMsg = err?.details?.message || err?.message || "Failed to verify verification code.";
      setOtpError(errorMsg);

      // Track attempts and show remaining count
      otpAttemptsRef.current += 1;
      const attemptsUsed = otpAttemptsRef.current;
      console.log(`[AUTH] 🔢 OTP attempt #${attemptsUsed} failed`);

      const remainingAttempts = Math.max(0, 5 - attemptsUsed);
      if (remainingAttempts > 0 && !errorMsg.toLowerCase().includes("attempt")) {
        setOtpError(`${errorMsg} (${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining)`);
      } else {
        setOtpError(errorMsg);
      }

      showToast(errorMsg);
    } finally {
      setLoadingText("");
    }
  };

  /* ── Resend OTP ── */

  const handleResendOtp = async () => {
    if (resendCooldown > 0) {
      console.log(`[AUTH] ⏳ Resend blocked — cooldown: ${resendCooldown}s`);
      return;
    }

    console.log("[AUTH] ════════════════════════════════════════");
    console.log("[AUTH] 🔄 Resending OTP...", { email, name });
    setLoadingText("Resending code...");

    try {
      const sendOtp = httpsCallable(functions, "sendOtp");
      const startTime = Date.now();
      const res = await sendOtp({ email, name, password });
      const duration = Date.now() - startTime;
      const resData = res.data as { success: boolean; verificationId: string; expiresAt: number };

      console.log(`[AUTH] ✅ Resend response received in ${duration}ms`, {
        success: resData.success,
        newVerificationId: resData.verificationId ? resData.verificationId.substring(0, 8) + "..." : "N/A",
        hasExpiresAt: !!resData.expiresAt,
      });

      if (resData.success) {
        setVerificationId(resData.verificationId);
        setOtp("");
        setOtpError("");
        otpAttemptsRef.current = 0;
        setResendCooldown(RESEND_COOLDOWN);

        if (resData.expiresAt) {
          const remaining = Math.max(Math.floor((resData.expiresAt - Date.now()) / 1000), 0);
          console.log(`[AUTH] ⏱ Reset OTP expiry timer: ${remaining}s`);
          setOtpExpiryTimer(remaining);
        } else {
          setOtpExpiryTimer(OTP_EXPIRY_SECONDS);
        }

        showToast("A new verification code has been sent.", "success");
        console.log("[AUTH] ✅ OTP resent successfully");
      } else {
        console.error("[AUTH] ❌ Resend returned success=false", { data: resData });
        showToast("Failed to resend verification code.");
      }
    } catch (err: any) {
      console.error("[AUTH] ❌❌❌ Resend OTP failed");
      console.error("[AUTH] ❌ error?.code:", err?.code || "N/A");
      console.error("[AUTH] ❌ error?.message:", err?.message || "N/A");

      const message = err?.details?.message || err?.message || "Failed to resend verification code.";
      showToast(message);
    } finally {
      setLoadingText("");
    }
  };

  /* ── Forgot password ── */

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail.trim()) {
      showToast("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      showToast("Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);
    try {
      const sendPasswordReset = httpsCallable(functions, "sendPasswordReset");
      const res = await sendPasswordReset({ email: forgotEmail.trim() });
      const resData = res.data as { success: boolean; emailSent: boolean };

      if (resData.success) {
        showToast("Password reset email sent! Check your inbox.", "success");
        setShowForgotPassword(false);
        setForgotEmail("");
      } else {
        showToast("Unable to send reset email at this time.");
      }
    } catch (err: any) {
      console.error("[AUTH] ❌ Password reset error:", err.code, err.message);
      const message = err?.details?.message || err?.message || "Failed to send reset email. Please try again.";
      showToast(message);
    } finally {
      setForgotLoading(false);
    }
  };

  /* ── Google auth ── */

  const handleGoogleLogin = async () => {
    console.log("[AUTH] 🚀 Google sign-in initiated");
    setLoadingText("Connecting...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("[AUTH] ✅ Google sign-in successful", { uid: user.uid, email: user.email });

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        console.log("[AUTH] 📝 Creating new Firestore user document for Google user");
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email,
          photoURL: user.photoURL || null,
          role: "user",
          volunteerApproved: false,
          volunteerStatus: null,
          ngoApproved: false,
          emailVerified: true,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
        console.log("[AUTH] ✅ Firestore user document created");
      } else {
        console.log("[AUTH] 📝 Updating lastLoginAt for existing user");
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      }
      console.log("[AUTH] ✅ Redirecting to:", redirectTo);
      router.push(redirectTo);
    } catch (err: any) {
      console.error("[AUTH] ❌ Google sign-in error:", err.message);
      showToast(err.message);
    } finally {
      setLoadingText("");
    }
  };

  /* ── Format timer ── */

  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isOtpExpired = step === "otp" && otpExpiryTimer <= 0;

  /* Loading state */

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fcf2dc" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] rounded-full animate-spin" style={{ borderColor: "#e5e3d4", borderTopColor: "#325b38" }} />
          <p className="text-sm font-medium" style={{ color: "#727970" }}>Loading&hellip;</p>
        </div>
      </div>
    );
  }

  /* MAIN UI */

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <main
        className={`min-h-screen flex items-start justify-center pt-16 ${isSignup ? "md:pt-20" : "md:pt-36"}`}
        style={{ backgroundColor: "#fcf2dc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-40">
          <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] rounded-full blur-[120px]" style={{ backgroundColor: "rgba(50, 91, 56, 0.1)" }} />
          <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full blur-[150px]" style={{ backgroundColor: "rgba(131, 85, 0, 0.1)" }} />
        </div>

        {toast && (
          <div            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-lg text-sm font-medium backdrop-blur-md" style={{ backgroundColor: toast.type === "success" ? "rgba(16, 185, 129, 0.9)" : "rgba(186, 26, 26, 0.9)", color: "#ffffff" }}>
            {toast.msg}
          </div>
        )}

        <div className="w-full max-w-[1100px] flex flex-col md:flex-row md:rounded-[32px] md:overflow-hidden md:shadow-lg md:border md:border-[rgba(193,201,190,0.35)]" style={{ backgroundColor: "#ffffff" }}>

          {/* Left: Brand Identity */}
          <section className="hidden md:flex flex-1 flex-col items-center justify-center relative overflow-hidden px-12" style={{ backgroundColor: "#fcf2dc" }}>
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: "rgba(50, 91, 56, 0.05)" }} />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: "rgba(131, 85, 0, 0.05)" }} />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-12"><Logo width={256} height={80} /></div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "32px", lineHeight: "40px", fontWeight: 600, color: "#325b38" }}>{isSignup ? "Join Us" : "Welcome Back"}</h2>
              <p className="max-w-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "18px", lineHeight: "28px", fontWeight: 400, color: "#424941" }}>{isSignup ? "Create your account and become part of India's pet rescue network." : "Connecting clinical veterinary excellence with the compassionate bond of pet care."}</p>
              <div className="mt-16 flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: "rgba(50, 91, 56, 0.1)", border: "1px solid rgba(50, 91, 56, 0.2)" }}>
                  <svg className="w-5 h-5" style={{ color: "#325b38" }} viewBox="0 0 24 24" fill="none"><path d="M4.5 6.5C4.5 5.12 5.62 4 7 4s2.5 1.12 2.5 2.5S8.38 9 7 9s-2.5-1.12-2.5-2.5zM14.5 6.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5S18.38 9 17 9s-2.5-1.12-2.5-2.5zM2 15c0-1.38 1.12-2.5 2.5-2.5S7 13.62 7 15s-1.12 2.5-2.5 2.5S2 16.38 2 15z" fill="currentColor"/><path d="M15 15c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5S15 16.38 15 15z" fill="currentColor"/><path d="M12 19c3.87 0 7 1.57 7 3.5V23H5v-.5c0-1.93 3.13-3.5 7-3.5z" fill="currentColor"/></svg>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 500, color: "#325b38" }}>Pet Portal</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: "rgba(131, 85, 0, 0.1)", border: "1px solid rgba(131, 85, 0, 0.2)" }}>
                  <svg className="w-5 h-5" style={{ color: "#835500" }} viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" fill="currentColor"/></svg>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 500, color: "#835500" }}>Secure</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Auth Form */}
          <section className="flex-1 flex flex-col justify-center px-5 md:px-16 py-8 md:py-10" style={{ backgroundColor: "#ffffff" }}>
            <div className="w-full max-w-md mx-auto">

              <div className="mb-6 md:mb-8">
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: step === "otp" ? "32px" : (isSignup ? "clamp(28px, 3.5vw, 32px)" : "clamp(32px, 4.5vw, 48px)"), lineHeight: step === "otp" ? "40px" : (isSignup ? "clamp(36px, 1.2em, 40px)" : "clamp(40px, 1.2em, 56px)"), letterSpacing: "-0.02em", fontWeight: 700, color: "#1c1c13" }}>
                  {step === "otp" ? "Verify Email" : (isSignup ? "Create Account" : "Login")}
                </h1>
                <p className="mt-1 md:mt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", fontWeight: 400, color: "#424941" }}>
                  {step === "otp" ? "Enter the verification code sent to your email." : (isSignup ? "Join the community today." : "Please enter your credentials to access your account.")}
                </p>
              </div>

              {step === "otp" ? (
                <form onSubmit={handleOtpVerify} className="space-y-6">
                  <div className="mb-2">
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", color: "#424941" }}>
                      We've sent a 6-digit verification code to <strong className="text-slate-800">{email}</strong>. Please enter it below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 500, color: "#424941" }}>Verification Code</label>
                    <div className="relative group">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#727970" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={otp}
                        required
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ""));
                          if (otpError) setOtpError("");
                        }}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all text-center tracking-[0.5em] font-bold placeholder:opacity-50 placeholder:tracking-normal placeholder:font-normal"
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: "20px",
                          lineHeight: "28px",
                          color: "#1c1c13",
                          backgroundColor: isOtpExpired ? "#fef2f2" : "#f6f4e5",
                          border: otpError ? "1px solid #dc2626" : isOtpExpired ? "1px solid #fca5a5" : "1px solid rgba(193, 201, 190, 0.4)",
                        }}
                        onFocus={(e) => {
                          if (!isOtpExpired) {
                            e.target.style.borderColor = "#325b38";
                            e.target.style.boxShadow = "0 0 0 2px rgba(50, 91, 56, 0.1)";
                            e.target.style.backgroundColor = "#ffffff";
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = otpError ? "#dc2626" : isOtpExpired ? "#fca5a5" : "rgba(193, 201, 190, 0.4)";
                          e.target.style.boxShadow = "none";
                          e.target.style.backgroundColor = isOtpExpired ? "#fef2f2" : "#f6f4e5";
                        }}
                      />
                    </div>

                    {/* OTP Error message */}
                    {otpError && (
                      <p className="ml-1 mt-2 text-sm font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#dc2626" }}>
                        {otpError}
                      </p>
                    )}
                  </div>

                  {/* Expiry timer / Expired state */}
                  <div className="flex items-center justify-center gap-2">
                    {isOtpExpired ? (
                      <>
                        <svg className="w-4 h-4" style={{ color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                          Code expired — please request a new one
                        </span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" style={{ color: "#835500" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium" style={{ color: "#835500" }}>
                          Code expires in {formatTimer(otpExpiryTimer)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={!!loadingText || isOtpExpired}
                      className="w-full py-3.5 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "16px",
                        lineHeight: "24px",
                        fontWeight: 600,
                        backgroundColor: "#325b38",
                        color: "#ffffff",
                        boxShadow: "0 8px 16px rgba(50, 91, 56, 0.1)",
                      }}
                      onMouseEnter={(e) => { if (!loadingText && !isOtpExpired) e.currentTarget.style.backgroundColor = "#264f2e"; }}
                      onMouseLeave={(e) => { if (!loadingText && !isOtpExpired) e.currentTarget.style.backgroundColor = "#325b38"; }}
                    >
                      {loadingText || "Verify Code"}
                      {!loadingText && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        console.log("[AUTH] 🔙 Going back to signup form");
                        setStep("form");
                        setOtp("");
                        setOtpError("");
                        setOtpExpiryTimer(0);
                      }}
                      className="w-full py-3.5 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "15px",
                        color: "#424941",
                        borderColor: "rgba(193, 201, 190, 0.6)",
                        backgroundColor: "transparent",
                      }}
                    >
                      Back to Sign Up
                    </button>
                  </div>

                  {/* Resend section */}
                  <div className="text-center pt-2">
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", color: "#727970" }}>
                      Didn't receive the code?{" "}
                      {resendCooldown > 0 ? (
                        <span className="font-semibold" style={{ color: "#835500" }}>Resend in {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="font-bold hover:underline"
                          style={{ color: isOtpExpired ? "#9ca3af" : "#325b38" }}
                          disabled={!!loadingText}
                        >
                          Resend Code
                        </button>
                      )}
                    </p>
                  </div>

                  {/* Spam folder hint */}
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    <svg className="w-3.5 h-3.5" style={{ color: "#9ca3af" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#9ca3af" }}>
                      Please check your spam folder if you don't see the email.
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-6">

                  {isSignup && (
                    <div className="space-y-2">
                      <label className="ml-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 500, color: "#424941" }}>Full Name</label>
                      <div className="relative group">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#727970" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                        <input type="text" placeholder="Enter your name" value={name} required onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all placeholder:opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 400, color: "#1c1c13", backgroundColor: "#f6f4e5", border: "1px solid rgba(193, 201, 190, 0.4)" }} onFocus={(e) => { e.target.style.borderColor = "#325b38"; e.target.style.boxShadow = "0 0 0 2px rgba(50, 91, 56, 0.1)"; e.target.style.backgroundColor = "#ffffff"; }} onBlur={(e) => { e.target.style.borderColor = "rgba(193, 201, 190, 0.4)"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f6f4e5"; }} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="ml-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 500, color: "#424941" }}>Email Address</label>
                    <div className="relative group">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#727970" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                      <input id="email" type="email" placeholder="name@example.com" value={email} required onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all placeholder:opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 400, color: "#1c1c13", backgroundColor: "#f6f4e5", border: "1px solid rgba(193, 201, 190, 0.4)" }} onFocus={(e) => { e.target.style.borderColor = "#325b38"; e.target.style.boxShadow = "0 0 0 2px rgba(50, 91, 56, 0.1)"; e.target.style.backgroundColor = "#ffffff"; }} onBlur={(e) => { e.target.style.borderColor = "rgba(193, 201, 190, 0.4)"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f6f4e5"; }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 500, color: "#424941" }}>Password</label>
                    <div className="relative group">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#727970" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                      <input id="password" type={showPassword ? "text" : "password"} placeholder={String.fromCharCode(8226,8226,8226,8226,8226,8226,8226,8226)} value={password} required onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-3.5 rounded-xl outline-none transition-all placeholder:opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 400, color: "#1c1c13", backgroundColor: "#f6f4e5", border: "1px solid rgba(193, 201, 190, 0.4)" }} onFocus={(e) => { e.target.style.borderColor = "#325b38"; e.target.style.boxShadow = "0 0 0 2px rgba(50, 91, 56, 0.1)"; e.target.style.backgroundColor = "#ffffff"; }} onBlur={(e) => { e.target.style.borderColor = "rgba(193, 201, 190, 0.4)"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f6f4e5"; }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#727970" }}>
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password — only on signup */}
                  {isSignup && (
                    <div className="space-y-2">
                      <label className="ml-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 500, color: "#424941" }}>Confirm Password</label>
                      <div className="relative group">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#727970" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder={String.fromCharCode(8226,8226,8226,8226,8226,8226,8226,8226)}
                          value={confirmPassword}
                          required
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3.5 rounded-xl outline-none transition-all placeholder:opacity-50"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 400, color: "#1c1c13", backgroundColor: "#f6f4e5", border: "1px solid rgba(193, 201, 190, 0.4)" }}
                          onFocus={(e) => { e.target.style.borderColor = "#325b38"; e.target.style.boxShadow = "0 0 0 2px rgba(50, 91, 56, 0.1)"; e.target.style.backgroundColor = "#ffffff"; }}
                          onBlur={(e) => { e.target.style.borderColor = "rgba(193, 201, 190, 0.4)"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f6f4e5"; }}
                        />
                      </div>
                    </div>
                  )}

                  {!isSignup && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer select-none group">
                        <div className="relative">
                          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="sr-only peer" />
                          <div className="w-5 h-5 border-2 rounded-md transition-all flex items-center justify-center" style={{ borderColor: remember ? "#325b38" : "#c1c9be", backgroundColor: remember ? "#325b38" : "transparent" }}>
                            {remember && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                          </div>
                        </div>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 400, color: "#424941" }}>Remember Me</span>
                      </label>
                      <button type="button" onClick={() => { setShowForgotPassword(true); setForgotEmail(email); }} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 500, color: "#835500" }}>Forgot Password?</button>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-3">
                    <button type="submit" disabled={!!loadingText} className="w-full md:flex-1 py-3.5 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 600, backgroundColor: "#325b38", color: "#ffffff", boxShadow: "0 8px 16px rgba(50, 91, 56, 0.1)" }} onMouseEnter={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "#264f2e"; }} onMouseLeave={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "#325b38"; }}>
                      {loadingText || (isSignup ? "Create Account" : "Sign In")}
                      {!loadingText && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>}
                    </button>
                    <div className="flex items-center gap-3 md:hidden">
                      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(193, 201, 190, 0.4)" }} />
                      <span className="text-sm font-medium" style={{ color: "#727970" }}>or</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(193, 201, 190, 0.4)" }} />
                    </div>
                    <span className="hidden shrink-0 text-sm font-medium md:inline" style={{ color: "#727970" }}>or</span>
                    <button type="button" onClick={handleGoogleLogin} disabled={!!loadingText} className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3.5 md:py-3 rounded-xl transition-colors disabled:opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 500, color: "#1c1c13", border: "1px solid rgba(193, 201, 190, 0.4)", backgroundColor: "transparent" }} onMouseEnter={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "#f6f4e5"; }} onMouseLeave={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Google
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 md:mt-8 pb-4 md:pb-0 text-center">
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "15px", lineHeight: "22px", fontWeight: 400, color: "#424941" }}>
                  {step === "otp" ? "" : (isSignup ? "Already have an account?" : "Don't have an account?")}
                  {step !== "otp" && (
                    <button onClick={() => { setIsSignup(!isSignup); setName(""); setConfirmPassword(""); }} className="font-bold ml-1 hover:underline" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", lineHeight: "20px", letterSpacing: "0.05em", fontWeight: 700, color: "#325b38" }}>
                      {isSignup ? "Sign In" : "Sign Up"}
                    </button>
                  )}
                </p>
              </div>
          </div>

          
        </section>
      </div>
      {/* ── Forgot Password Modal ── */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForgotPassword(false)}>
          <div
            className="relative w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl border"
            style={{ backgroundColor: "#ffffff", borderColor: "rgba(193, 201, 190, 0.4)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setForgotEmail(""); }}
              className="absolute top-4 right-4 p-1.5 rounded-full transition-colors hover:bg-slate-100"
              style={{ color: "#727970" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#fcf2dc" }}>
                <svg className="w-7 h-7" style={{ color: "#835500" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1c1c13" }}>Reset Password</h2>
              <p className="mt-1 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#424941" }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#424941" }}>Email Address</label>
                <div className="relative group">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#727970" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoFocus
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all placeholder:opacity-50"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 400, color: "#1c1c13", backgroundColor: "#f6f4e5", border: "1px solid rgba(193, 201, 190, 0.4)" }}
                    onFocus={(e) => { e.target.style.borderColor = "#325b38"; e.target.style.boxShadow = "0 0 0 2px rgba(50, 91, 56, 0.1)"; e.target.style.backgroundColor = "#ffffff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(193, 201, 190, 0.4)"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f6f4e5"; }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 600, backgroundColor: "#325b38", color: "#ffffff", boxShadow: "0 8px 16px rgba(50, 91, 56, 0.1)" }}
                  onMouseEnter={(e) => { if (!forgotLoading) e.currentTarget.style.backgroundColor = "#264f2e"; }}
                  onMouseLeave={(e) => { if (!forgotLoading) e.currentTarget.style.backgroundColor = "#325b38"; }}
                >
                  {forgotLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setForgotEmail(""); }}
                  className="w-full py-3.5 rounded-xl font-semibold transition-colors border"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "15px", color: "#424941", borderColor: "rgba(193, 201, 190, 0.6)", backgroundColor: "transparent" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  </>
  );
}