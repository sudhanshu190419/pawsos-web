const fs = require("fs");

const content = `"use client";

import { Logo } from "../components/Logo";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";

import { auth, googleProvider, db } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

/* ─── Types ──────────────────────────────────────────────── */

type ToastData = { msg: string; type: "error" | "success" } | null;

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [checking, setChecking] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [toast, setToast] = useState<ToastData>(null);

  const showToast = (msg: string, type: "error" | "success" = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async () => {
      setChecking(false);
    });
    return () => unsub();
  }, []);

  /* ─── Email auth ─────────────────────────────────────── */

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingText("Wait a moment...");

    try {
      if (isSignup) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCred.user);

        await setDoc(doc(db, "users", userCred.user.uid), {
          uid: userCred.user.uid,
          name,
          email,
          photoURL: userCred.user.photoURL || null,
          role: "user",
          volunteerApproved: false,
          volunteerStatus: null,
          ngoApproved: false,
          emailVerified: false,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });

        showToast("Verify your email to continue.", "success");
        setIsSignup(false);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        if (!userCred.user.emailVerified) {
          showToast("Please verify your email first.");
          setLoadingText("");
          return;
        }
        await setDoc(
          doc(db, "users", userCred.user.uid),
          { lastLoginAt: serverTimestamp() },
          { merge: true },
        );
        router.push(redirectTo);
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoadingText("");
    }
  };

  /* ─── Google auth ────────────────────────────────────── */

  const handleGoogleLogin = async () => {
    setLoadingText("Connecting...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
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
      } else {
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      }
      router.push(redirectTo);
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoadingText("");
    }
  };

  /* ─── Loading state ──────────────────────────────────── */

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fcfaeb" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px" style={{ borderColor: "#e5e3d4", borderTopColor: "#325b38", borderRadius: "9999px" }}>
          </div>
          <div className="w-10 h-10 border-[3px] rounded-full animate-spin" style={{ borderColor: "#e5e3d4", borderTopColor: "#325b38" }} />
          <p className="text-sm font-medium" style={{ color: "#727970" }}>Loading&hellip;</p>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     MAIN UI
  ════════════════════════════════════════════════════════ */

  return (
    <>
      {/* Font import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <main
        className="min-h-screen flex items-center justify-center p-4 md:p-0"
        style={{ backgroundColor: "#fcfaeb", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Background glow blobs */}
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-40">
          <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] rounded-full blur-[120px]" style={{ backgroundColor: "rgba(50, 91, 56, 0.1)" }} />
          <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full blur-[150px]" style={{ backgroundColor: "rgba(131, 85, 0, 0.1)" }} />
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium backdrop-blur-md"
            style={{
              backgroundColor: toast.type === "success" ? "rgba(16, 185, 129, 0.9)" : "rgba(186, 26, 26, 0.9)",
              color: "#ffffff",
            }}
          >
            {toast.msg}
          </div>
        )}

        {/* Main Card */}
        <div
          className="w-full max-w-[1100px] min-h-[700px] flex flex-col md:flex-row rounded-[32px] overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(193, 201, 190, 0.2)",
          }}
        >
          {/* ─── Left: Brand Identity (desktop only) ─── */}
          <section
            className="hidden md:flex flex-1 flex-col items-center justify-center relative overflow-hidden px-12"
            style={{ backgroundColor: "#fcfaeb" }}
          >
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: "rgba(50, 91, 56, 0.05)" }} />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: "rgba(131, 85, 0, 0.05)" }} />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-12">
                <Logo width={256} height={80} />
              </div>

              <h2
                className="mb-4"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "32px",
                  lineHeight: "40px",
                  fontWeight: 600,
                  color: "#325b38",
                }}
              >
                {isSignup ? "Join Us" : "Welcome Back"}
              </h2>

              <p
                className="max-w-sm"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "18px",
                  lineHeight: "28px",
                  fontWeight: 400,
                  color: "#424941",
                }}
              >
                {isSignup
                  ? "Create your account and become part of India's pet rescue network."
                  : "Connecting clinical veterinary excellence with the compassionate bond of pet care."}
              </p>

              <div className="mt-16 flex gap-4">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ backgroundColor: "rgba(50, 91, 56, 0.1)", border: "1px solid rgba(50, 91, 56, 0.2)" }}
                >
                  {/* Pet icon */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" style={{ color: "#325b38" }}>
                    <path d="M12 2C13.38 2 14.5 3.12 14.5 4.5C14.5 5.88 13.38 7 12 7C10.62 7 9.5 5.88 9.5 4.5C9.5 3.12 10.62 2 12 2Z" fill="currentColor"/>
                    <path d="M7 7C8.38 7 9.5 8.12 9.5 9.5C9.5 10.88 8.38 12 7 12C5.62 12 4.5 10.88 4.5 9.5C4.5 8.12 5.62 7 7 7Z" fill="currentColor"/>
                    <path d="M17 7C18.38 7 19.5 8.12 19.5 9.5C19.5 10.88 18.38 12 17 12C15.62 12 14.5 10.88 14.5 9.5C14.5 8.12 15.62 7 17 7Z" fill="currentColor"/>
                    <path d="M12 12C13.38 12 14.5 13.12 14.5 14.5C14.5 15.88 13.38 17 12 17C10.62 17 9.5 15.88 9.5 14.5C9.5 13.12 10.62 12 12 12Z" fill="currentColor"/>
                    <path d="M12 17C16.42 17 20 18.79 20 21V22H4V21C4 18.79 7.58 17 12 17Z" fill="currentColor"/>
                  </svg>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.05em",
                      fontWeight: 500,
                      color: "#325b38",
                    }}
                  >
                    Pet Portal
                  </span>
                </div>
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ backgroundColor: "rgba(131, 85, 0, 0.1)", border: "1px solid rgba(131, 85, 0, 0.2)" }}
                >
                  {/* Verified icon */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" style={{ color: "#835500" }}>
                    <path d="M12 1L14.09 4.16L18 5.18L15.5 8.5L16 12.5L12 14L8 12.5L8.5 8.5L6 5.18L9.91 4.16L12 1Z" fill="currentColor"/>
                    <path d="M5 15C5 15 7 17 12 17C17 17 19 15 19 15V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V15Z" fill="currentColor"/>
                  </svg>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.05em",
                      fontWeight: 500,
                      color: "#835500",
                    }}
                  >
                    Secure
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Right: Auth Form ─── */}
          <section
            className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="w-full max-w-md mx-auto">
              {/* Mobile logo */}
              <div className="md:hidden mb-6">
                <Logo width={128} height={40} />
              </div>

              {/* Header */}
              <div className="mb-10">
                <h1
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: isSignup ? "32px" : "48px",
                    lineHeight: isSignup ? "40px" : "56px",
                    letterSpacing: "-0.02em",
                    fontWeight: 700,
                    color: "#1c1c13",
                  }}
                  className={isSignup ? "text-[32px] leading-[40px]" : "text-[48px] leading-[56px]"}
                >
                  {isSignup ? "Create Account" : "Login"}
                </h1>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "16px",
                    lineHeight: "24px",
                    fontWeight: 400,
                    color: "#424941",
                  }}
                >
                  {isSignup
                    ? "Join the community today."
                    : "Please enter your credentials to access your account."}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-6">
                {/* Name field (signup only) */}
                {isSignup && (
                  <div className="space-y-2">
                    <label
                      className="ml-1"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "14px",
                        lineHeight: "20px",
                        letterSpacing: "0.05em",
                        fontWeight: 500,
                        color: "#424941",
                      }}
                    >
                      Full Name
                    </label>
                    <div className="relative group">
                      <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
                        style={{ color: "#727970" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        required
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all placeholder:opacity-50"
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: "16px",
                          lineHeight: "24px",
                          fontWeight: 400,
                          color: "#1c1c13",
                          backgroundColor: "#f6f4e5",
                          border: "1px solid rgba(193, 201, 190, 0.4)",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#325b38";
                          e.target.style.boxShadow = "0 0 0 2px rgba(50, 91, 56, 0.1)";
                          e.target.style.backgroundColor = "#ffffff";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "rgba(193, 201, 190, 0.4)";
                          e.target.style.boxShadow = "none";
                          e.target.style.backgroundColor = "#f6f4e5";
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <label
                    className="ml-1"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.05em",
                      fontWeight: 500,
                      color: "#424941",
                    }}
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors group-focus-within"
                      style={{ color: "#727970" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all placeholder:opacity-50"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "16px",
                        lineHeight: "24px",
                        fontWeight: 400,
                        color: "#1c1c13",
                        backgroundColor: "#f6f4e5",
                        border: "1px solid rgba(193, 201, 190, 0.4)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#325b38";
                        e.target.style.boxShadow = "0 0 0 2px rgba(50, 91, 56, 0.1)";
                        e.target.style.backgroundColor = "#ffffff";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(193, 201, 190, 0.4)";
                        e.target.style.boxShadow = "none";
                        e.target.style.backgroundColor = "#f6f4e5";
                      }}
                    />
                    {/* Focus icon color update via CSS */}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    className="ml-1"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.05em",
                      fontWeight: 500,
                      color: "#424941",
                    }}
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
                      style={{ color: "#727970" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl outline-none transition-all placeholder:opacity-50"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "16px",
                        lineHeight: "24px",
                        fontWeight: 400,
                        color: "#1c1c13",
                        backgroundColor: "#f6f4e5",
                        border: "1px solid rgba(193, 201, 190, 0.4)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#325b38";
                        e.target.style.boxShadow = "0 0 0 2px rgba(50, 91, 56, 0.1)";
                        e.target.style.backgroundColor = "#ffffff";
                        e.target.parentElement.querySelector("svg").style.color = "#325b38";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(193, 201, 190, 0.4)";
                        e.target.style.boxShadow = "none";
                        e.target.style.backgroundColor = "#f6f4e5";
                        e.target.parentElement.querySelector("svg").style.color = "#727970";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "#727970" }}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me + Forgot Password (login only) */}
                {!isSignup && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 border-2 rounded-md transition-all"
                          style={{
                            borderColor: remember ? "#325b38" : "#c1c9be",
                            backgroundColor: remember ? "#325b38" : "transparent",
                          }}
                        >
                          {remember && (
                            <svg className="w-full h-full text-white p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: "16px",
                          lineHeight: "24px",
                          fontWeight: 400,
                          color: "#424941",
                        }}
                      >
                        Remember Me
                      </span>
                    </label>
                    <button
                      type="button"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "14px",
                        lineHeight: "20px",
                        letterSpacing: "0.05em",
                        fontWeight: 500,
                        color: "#835500",
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!!loadingText}
                  className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "24px",
                    lineHeight: "32px",
                    fontWeight: 600,
                    backgroundColor: "#325b38",
                    color: "#ffffff",
                    boxShadow: "0 8px 16px rgba(50, 91, 56, 0.1)",
                  }}
                  onMouseEnter={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "#264f2e"; }}
                  onMouseLeave={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "#325b38"; }}
                >
                  {loadingText || (isSignup ? "Create Account" : "Sign In")}
                  {!loadingText && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>

                {/* Divider */}
                <div className="relative py-4 flex items-center gap-4">
                  <div className="flex-grow" style={{ borderTop: "1px solid rgba(193, 201, 190, 0.3)" }} />
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.05em",
                      fontWeight: 500,
                      color: "rgba(114, 121, 112, 0.6)",
                      textTransform: "uppercase",
                    }}
                  >
                    or continue with
                  </span>
                  <div className="flex-grow" style={{ borderTop: "1px solid rgba(193, 201, 190, 0.3)" }} />
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={!!loadingText}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl transition-colors disabled:opacity-50"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.05em",
                      fontWeight: 500,
                      color: "#1c1c13",
                      border: "1px solid rgba(193, 201, 190, 0.4)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "#f6f4e5"; }}
                    onMouseLeave={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    disabled={!!loadingText}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl transition-colors disabled:opacity-50"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.05em",
                      fontWeight: 500,
                      color: "#1c1c13",
                      border: "1px solid rgba(193, 201, 190, 0.4)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "#f6f4e5"; }}
                    onMouseLeave={(e) => { if (!loadingText) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </form>

              {/* Toggle sign in / sign up */}
              <div className="mt-10 text-center">
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "16px",
                    lineHeight: "24px",
                    fontWeight: 400,
                    color: "#424941",
                  }}
                >
                  {isSignup ? "Already have an account?" : "Don't have an account?"}
                  <button
                    onClick={() => {
                      setIsSignup(!isSignup);
                      setName("");
                    }}
                    className="font-bold ml-1 hover:underline"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.05em",
                      fontWeight: 700,
                      color: "#325b38",
                    }}
                  >
                    {isSignup ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </div>
            </div>

            {/* Footer links */}
            <footer className="mt-auto pt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 opacity-60">
              <a
                href="#"
                className="transition-colors"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                  color: "#424941",
                }}
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="transition-colors"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                  color: "#424941",
                }}
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="transition-colors"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                  color: "#424941",
                }}
              >
                Support
              </a>
            </footer>
          </section>
        </div>
      </main>
    </>
  );
}
`;

fs.writeFileSync("app/auth/AuthClient.tsx", content, "utf8");
console.log("Written successfully. Length:", content.length);
