"use client";

// Prevent prerendering - Firebase must initialize at runtime
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation"; // 🔥 Make sure this is imported!

export default function VolunteerFormPage() {
  const [user, setUser] = useState<any>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    reason: ""
  });

  const [isVolunteer, setIsVolunteer] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  
  const router = useRouter(); // 🔥 Initialize the router

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();

          if (data.volunteerStatus) {
            setStatus(data.volunteerStatus);
          }

          if (data.volunteerStatus === "approved") {
            setIsVolunteer(true);
          }
        }

        setForm((prev) => ({
          ...prev,
          name: currentUser.displayName || "",
          email: currentUser.email || ""
        }));
        
        setChecking(false); // Only stop checking if they are logged in
      } else {
        // 🔥 NEW: If no user is found, instantly redirect to the auth page
        router.push("/auth"); 
      }
    });

    return () => unsub();
  }, [router]);

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!user) {
      alert("Please login first.");
      return;
    }

    if (!form.name || !form.phone || !form.email || !form.address || !form.reason) {
      alert("Please fill all fields before submitting.");
      return;
    }
    if (!photo) {
      alert("Please upload a profile photo for your Volunteer ID Card.");
      return;
    }

    try {
      let photoURL = "";

      /* 1. Upload photo to Firebase Storage */
      if (photo) {
        setSubmitStatus("📸 Uploading your photo...");
        const storageRef = ref(storage, `volunteerPhotos/${user.uid}_${Date.now()}_${photo.name}`);
        await uploadBytes(storageRef, photo);
        photoURL = await getDownloadURL(storageRef);
      }

      /* 2. Call backend to generate ID card and certificate */
      setSubmitStatus("🎓 Generating official documents...");
      const BASE_URL = 'https://pawsos-certificates-production.up.railway.app';

      /* 3. Get User's GPS Location */
      setSubmitStatus("📍 Verifying your location...");
      let locationData = {};
      try {
        const position: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true, timeout: 10000
          });
        });

        locationData = {
          volunteerLocation: new GeoPoint(position.coords.latitude, position.coords.longitude),
          locationUpdatedAt: serverTimestamp()
        };
      } catch (locError) {
        console.warn("Could not fetch location (User may have denied permission):", locError);
      }

      /* 4. Update existing user document in Firestore */
      setSubmitStatus("🔐 Securing your profile...");
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: form.name,
          email: form.email,
          contact: form.phone,
          phone: form.phone,
          address: form.address,
          city: form.address,
          reason: form.reason,
          photoURL: photoURL || user?.photoURL || "",
          volunteerStatus: "pending",
          volunteerApproved: false,
          volunteerRequestedAt: serverTimestamp(),
          ...locationData
        },
        { merge: true }
      );

      setSubmitStatus("✅ Done!");

      setTimeout(() => {
        setStatus("pending");
        alert("Your request has been submitted and is under review.");
        setForm({
          name: "",
          phone: "",
          email: "",
          address: "",
          reason: ""
        });
        setPhoto(null);
        setSubmitStatus(null);
      }, 800);

    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Something went wrong while generating documents or updating profile.");
      setSubmitStatus(null);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // 🔥 NEW: Secondary safeguard to ensure the form NEVER renders without a user
  if (!user) {
    return null; 
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <h2 className="text-xl font-semibold text-center">
          Your application is under review ⏳
        </h2>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center w-full max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Application Rejected ❌
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Unfortunately, your volunteer request was not approved.
          </p>
          <button
            onClick={() => setStatus(null)}
            className="w-full bg-orange-500 hover:bg-orange-600 transition text-white px-4 py-3 rounded-xl font-semibold shadow-md"
          >
            Apply Again
          </button>
        </div>
      </div>
    );
  }

  if (isVolunteer) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 py-10 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-green-400/10 rounded-full blur-[80px] -z-10"></div>

        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 p-6 sm:p-10 w-full max-w-md text-center relative overflow-hidden group">
          
          {/* Top decorative gradient bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

          {/* Icon Badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 border-8 border-white shadow-lg relative group-hover:scale-110 transition-transform duration-500">
            <span className="text-3xl sm:text-4xl">🦸‍♂️</span>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm">
              ✓
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold mb-2 sm:mb-3 text-slate-800 tracking-tight">
            Active Volunteer Status
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 leading-relaxed">
            Thank you for stepping up to save lives. You already have full access to the emergency rescue ecosystem.
          </p>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 hover:-translate-y-1"
          >
            Open Dashboard <span>→</span>
          </Link>

          <Link
            href="/"
            className="block mt-5 sm:mt-6 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-20">
      
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-10">
        <Link
          href="/onboarding"
          className="inline-block text-gray-600 hover:text-orange-600 transition mb-4 font-medium"
        >
          ← Back
        </Link>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center mt-2 sm:mt-4 mb-4 sm:mb-6">
          Become a Volunteer
        </h1>

        <p className="text-sm sm:text-base text-gray-600 text-center max-w-xl mx-auto mb-8 sm:mb-10 px-2 sm:px-0">
          Volunteers are the backbone of PawSOS. Join us to rescue, protect,
          and give a voice to animals in need.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <InputField
              icon="👤"
              placeholder="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              readOnly={true}
            />
            <InputField
              icon="📞"
              placeholder="Contact Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
            <InputField
              icon="✉️"
              placeholder="Email Address"
              name="email"
              value={form.email}
              onChange={handleChange}
              readOnly={true}
            />
            <InputField
              icon="📍"
              placeholder="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <span className="absolute left-4 top-4 text-gray-400">💬</span>
            <textarea
              name="reason"
              placeholder="Why do you want to volunteer?"
              rows={4}
              value={form.reason}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl py-3.5 sm:py-4 pr-4 pl-12 sm:pl-12 text-sm sm:text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
          </div>

          {/* PHOTO UPLOAD */}
          <div className="border border-orange-300 rounded-xl p-4 sm:p-6 text-center bg-orange-50 hover:bg-orange-100 transition">
            <label className="cursor-pointer text-orange-600 font-semibold text-base sm:text-lg flex flex-col items-center gap-2">
              <span>📷 Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
            {photo && (
              <p className="text-xs sm:text-sm mt-3 text-gray-600 break-all px-2">
                {photo.name}
              </p>
            )}
          </div>

          <div className="bg-green-100 text-green-700 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-center">
            Your information is secure and used only for rescue coordination.
          </div>

          <button
            type="submit"
            disabled={!!submitStatus}
            className={`w-full py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all shadow-md flex items-center justify-center gap-3 ${
              submitStatus
                ? "bg-slate-100 text-slate-600 cursor-wait border border-slate-200"
                : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5"
            }`}
          >
            {submitStatus ? (
              <>
                {submitStatus !== "✅ Done!" && (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-orange-500 rounded-full animate-spin"></div>
                )}
                <span className="font-bold text-sm sm:text-base">{submitStatus}</span>
              </>
            ) : (
              "Submit Form"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

function InputField({
  icon,
  placeholder,
  name,
  value,
  onChange,
  readOnly = false
}: any) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
        {icon}
      </span>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required
        className={`w-full border border-gray-300 rounded-xl py-3.5 sm:py-4 pr-4 pl-12 sm:pl-12 text-sm sm:text-base transition focus:outline-none focus:ring-2 focus:ring-orange-400 ${
          readOnly
            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
            : "bg-white text-gray-800 placeholder:text-gray-400"
        }`}
      />
    </div>
  );
}