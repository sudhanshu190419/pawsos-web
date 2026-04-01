"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

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
  
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loadingText, setLoadingText] = useState(""); // For UI feedback during Google Auth

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.role === "volunteer" && data.volunteerApproved === true) {
            setIsVolunteer(true);
          }
        }
      }
      setChecking(false);
    });

    return () => unsub();
  }, []);

  const handleEmailAuth = async (e: any) => {
    e.preventDefault();
    setLoadingText("Authenticating...");

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

        alert("Verification email sent. Please check your inbox before logging in.");
        setIsSignup(false); // Switch to login view
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);

        if (!userCred.user.emailVerified) {
          alert("Please verify your email before logging in.");
          setLoadingText("");
          return;
        }

        await setDoc(doc(db, "users", userCred.user.uid), {
          lastLoginAt: serverTimestamp()
        }, { merge: true });

        router.push("/"); // 🔥 FIX: Next.js routing prevents hard browser reloads
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingText("");
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingText("Opening Google...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      setLoadingText("Securing profile...");
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // ONLY CREATE IF NOT EXISTS
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
        // Update last login time if they already exist
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp()
        }, { merge: true });
      }

      router.push("/"); // 🔥 FIX: Use Next.js router instead of window.location
    } catch (err: any) {
      console.error(err);
      alert("Google Sign-In Failed: " + err.message);
    } finally {
      setLoadingText("");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isVolunteer) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 sm:p-10 w-full max-w-md text-center border border-slate-100">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-black mb-3 text-slate-800 tracking-tight">
            You're a Volunteer!
          </h1>
          <p className="text-slate-500 mb-8 font-medium">
            You are already logged in. Manage your rescue operations from your dashboard.
          </p>
          <button
            onClick={() => router.push("/profile")}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-1"
          >
            Go to Dashboard →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 py-12 relative overflow-hidden selection:bg-orange-200">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-orange-300/20 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-slate-400/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

      <div className="bg-white rounded-[2rem] shadow-2xl p-6 sm:p-10 w-full max-w-md border border-slate-100 relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 border border-orange-200 shadow-sm">
            🐾
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {isSignup ? "Join the rescue network today." : "Sign in to continue saving lives."}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          
          {isSignup && (
            <div>
              <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-sm sm:text-base text-slate-800"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-sm sm:text-base text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-sm sm:text-base text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={!!loadingText}
            className="w-full bg-orange-500 text-white py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-orange-600 shadow-lg hover:shadow-orange-200 transition-all duration-300 mt-2 disabled:opacity-50"
          >
            {loadingText || (isSignup ? "Create Account" : "Sign In via Email")}
          </button>

        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-100"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={!!loadingText}
          className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-8 text-sm sm:text-base text-slate-500 font-medium">
          {isSignup ? "Already have an account?" : "New to AnimalSathi?"}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-orange-600 ml-2 font-bold hover:underline"
          >
            {isSignup ? "Sign In" : "Create Account"}
          </button>
        </p>

      </div>
    </main>
  );
}