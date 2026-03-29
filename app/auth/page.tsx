"use client";

import { useState, useEffect  } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup
} from "firebase/auth";

import { auth, googleProvider, db } from "../lib/firebase";
import { doc, setDoc,getDoc, serverTimestamp } from "firebase/firestore";

export default function AuthPage() {

  const [isSignup,setIsSignup] = useState(false);
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [isVolunteer, setIsVolunteer] = useState(false);
const [checking, setChecking] = useState(true);

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

  const handleEmailAuth = async (e:any) => {

    e.preventDefault();

    try {

      if(isSignup){

        const userCred = await createUserWithEmailAndPassword(auth,email,password);

        await sendEmailVerification(userCred.user);

        await setDoc(doc(db,"users",userCred.user.uid),{
          uid:userCred.user.uid,
          name:name,
          email:email,
          photoURL: userCred.user.photoURL || null,
          role:"user",
          volunteerApproved:false,
          volunteerStatus:null, 
          ngoApproved: false,
          emailVerified:false,
          createdAt:serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });

        alert("Verification email sent. Please verify before login.");

      } else {

        const userCred = await signInWithEmailAndPassword(auth,email,password);

        if(!userCred.user.emailVerified){
          alert("Please verify your email before logging in.");
          return;
        }

        await setDoc(doc(db, "users", userCred.user.uid), {
          lastLoginAt: serverTimestamp()
        }, { merge: true });

        window.location.href = "/";

      }

    } catch(err:any){
      alert(err.message);
    }

  };

  const handleGoogleLogin = async () => {
  try {

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // 🔥 ONLY CREATE IF NOT EXISTS
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

    window.location.href = "/";

  } catch (err:any) {
    alert(err.message);
  }
};
if (checking) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  );
}

if (isVolunteer) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-orange-50 px-6">

      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">

        <h1 className="text-2xl font-bold mb-4 text-slate-800">
          🎉 You are already a Volunteer!
        </h1>

        <p className="text-gray-600 mb-6">
          You can manage everything from your dashboard.
        </p>

        <button
          onClick={() => router.push("/profile")}
          className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition"
        >
          Go to Dashboard
        </button>

      </div>

    </main>
  );
}

  return (

    <main className="min-h-screen flex items-center justify-center bg-orange-50 px-6">

      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-6">

          {isSignup ? "Create Account" : "Sign In"}

        </h1>

        <form onSubmit={handleEmailAuth} className="space-y-4">

          {isSignup && (

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              className="w-full border p-3 rounded-lg"
            />

          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition"
          >
            {isSignup ? "Sign Up" : "Sign In"}
          </button>

        </form>

        <div className="my-6 text-center text-gray-500">
          OR
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full border py-3 rounded-lg hover:bg-gray-100 transition"
        >
          Sign In with Google
        </button>

        <p className="text-center mt-6 text-gray-600">

          {isSignup ? "Already have an account?" : "New here?"}

          <button
            onClick={()=>setIsSignup(!isSignup)}
            className="text-orange-600 ml-2 font-semibold"
          >
            {isSignup ? "Sign In" : "Create Account"}
          </button>

        </p>

      </div>

    </main>
  );
}