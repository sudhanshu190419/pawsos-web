"use client";

import { Logo } from "../components/Logo";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup
} from "firebase/auth";

import { auth, googleProvider, db } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [checking, setChecking] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  const showToast = (msg: string, type: "error" | "success" = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const handleEmailAuth = async (e: any) => {
    e.preventDefault();
    setLoadingText("Wait a moment...");

    try {
      if (isSignup) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCred.user);

        await setDoc(doc(db, "users", userCred.user.uid), {
          uid: userCred.user.uid,
          name: name,
          email: email,
          photoURL: userCred.user.photoURL || null,
          role: "user",
          volunteerApproved: false,
          volunteerStatus: null,
          ngoApproved: false,
          emailVerified: false,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
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

        await setDoc(doc(db, "users", userCred.user.uid), {
          lastLoginAt: serverTimestamp()
        }, { merge: true });

        router.push(redirectTo);
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoadingText("");
    }
  };

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
          lastLoginAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp()
        }, { merge: true });
      }

      router.push(redirectTo);
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoadingText("");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCF2DC]">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FCF2DC] relative overflow-hidden font-sans">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl text-sm font-medium backdrop-blur-md animate-fadeUp ${
          toast.type === "success" ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Left: Brand/Logo Section */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-10 lg:p-20 relative z-10 bg-[#FCF2DC]">
        <div className="max-w-md w-full text-center lg:text-left">
          <div className="mb-10 flex justify-center lg:justify-start">
            <Logo className="animate-float" width={240} height={80} />
          </div>
          <h2 className="text-5xl lg:text-7xl font-display font-medium text-[#1a1c1c] mb-6 leading-[1.1]">
            Saving lives, <br />
            <span className="italic text-primary">one tap</span> at a time.
          </h2>
          <p className="text-xl text-[#56423d] font-normal leading-relaxed opacity-80">
            India's most trusted emergency network for animals in distress.
          </p>
        </div>
      </div>

      {/* Right: Auth Form Section */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
        {/* Figma-style Glass Card */}
        <div className="w-full max-w-[460px] bg-white/20 backdrop-blur-[32px] border border-white/40 rounded-[3rem] p-10 lg:p-14 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden">
          
          {/* Internal Glow */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <header className="mb-10">
              <h1 className="text-3xl lg:text-4xl font-display font-medium text-[#1a1c1c] mb-2">
                {isSignup ? "Create Account" : "Sign In"}
              </h1>
              <p className="text-[#56423d] opacity-60 text-sm lg:text-base">
                {isSignup ? "Join the community today" : "Welcome back to the rescue team"}
              </p>
            </header>

            <form onSubmit={handleEmailAuth} className="space-y-6">
              {isSignup && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] ml-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    required
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/40 border border-white/60 p-4 rounded-2xl outline-none focus:bg-white/60 focus:border-primary/40 transition-all text-[#1a1c1c] placeholder:text-[#1a1c1c]/20"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/40 border border-white/60 p-4 rounded-2xl outline-none focus:bg-white/60 focus:border-primary/40 transition-all text-[#1a1c1c] placeholder:text-[#1a1c1c]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] ml-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/40 border border-white/60 p-4 rounded-2xl outline-none focus:bg-white/60 focus:border-primary/40 transition-all text-[#1a1c1c] placeholder:text-[#1a1c1c]/20"
                />
              </div>

              <button
                type="submit"
                disabled={!!loadingText}
                className="w-full bg-[#9c3e23] text-white py-5 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#9c3e23]/20 disabled:opacity-50 mt-4"
              >
                {loadingText || (isSignup ? "Create Account" : "Sign In")}
              </button>
            </form>

            <div className="relative flex items-center gap-4 my-10">
              <div className="flex-1 h-px bg-[#1a1c1c]/5"></div>
              <span className="text-[10px] font-bold text-[#1a1c1c]/20 uppercase tracking-[0.3em]">Or continue with</span>
              <div className="flex-1 h-px bg-[#1a1c1c]/5"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={!!loadingText}
              className="w-full bg-white/60 border border-white/80 text-[#1a1c1c] py-4 rounded-2xl font-bold text-sm hover:bg-white/80 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google Account
            </button>

            <p className="text-center mt-10 text-sm text-[#1a1c1c]/60 font-medium">
              {isSignup ? "Already have an account?" : "New to the platform?"}
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="text-primary ml-2 font-bold hover:underline transition-all"
              >
                {isSignup ? "Log In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}