"use client";

// Prevent prerendering - Firebase must initialize at runtime
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { validateFile, uploadFileWithTimeout, ALLOWED_IMAGE_TYPES, FORMATTED_MAX_SIZE } from "../lib/uploadUtils";
import { logError, filePayload, setupGlobalErrorHandling, type FormType } from "../lib/errorLogger";

const FORM_TYPE: FormType = "volunteer";

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
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  
  const router = useRouter(); // 🔥 Initialize the router

  useEffect(() => {
    setupGlobalErrorHandling(FORM_TYPE);

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

          if (data.rejectionReason) {
            setRejectionReason(data.rejectionReason);
          }
        }

        setForm((prev) => ({
          ...prev,
          name: currentUser.displayName || "",
          email: currentUser.email || ""
        }));
        
        setChecking(false); // Only stop checking if they are logged in
      } else {
        router.push(
  `/auth?redirect=${encodeURIComponent("/volunteer-form")}`
);
      }
    });

    return () => unsub();
  }, [router]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    // Strip non-numeric chars from phone input
    if (name === "phone") {
      const filtered = value.replace(/[^\d+\s-]/g, "");
      setForm((prev) => ({ ...prev, phone: filtered }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
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

    // Phone validation: at least 10 digits
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!photo) {
      alert("Please upload a profile photo for your Volunteer ID Card.");
      return;
    }

    // ── File validation ──
    const photoValidateMsg = validateFile(photo, ALLOWED_IMAGE_TYPES);
    if (photoValidateMsg) {
      logError({ formType: FORM_TYPE, step: "validation", errorMessage: photoValidateMsg, ...filePayload(photo), isError: true });
      alert(`Photo: ${photoValidateMsg}`);
      return;
    }

    try {
      let photoURL = "";

      /* 1. Upload photo to Firebase Storage */
      if (photo) {
        setSubmitStatus("📸 Uploading your photo...");
        logError({ formType: FORM_TYPE, step: "upload", errorMessage: "Photo upload started", ...filePayload(photo) });
        console.log("[VolSubmit] Uploading photo");
        try {
          photoURL = await uploadFileWithTimeout(
            storage,
            photo,
            `volunteerPhotos/${user.uid}_${Date.now()}_${photo.name}`,
            "Profile photo"
          );
          logError({ formType: FORM_TYPE, step: "upload", errorMessage: "Photo upload completed", ...filePayload(photo) });
        } catch (photoErr: any) {
          console.error("[VolSubmit] Photo upload failed:", photoErr);
          logError({ formType: FORM_TYPE, step: "upload", errorMessage: photoErr?.message || "Photo upload failed", stackTrace: photoErr?.stack, ...filePayload(photo), isError: true });
          alert(photoErr?.message || "Photo upload failed. Please check your file and connection.");
          setSubmitStatus(null);
          return;
        }
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
      logError({ formType: FORM_TYPE, step: "firestore", errorMessage: "Firestore save started" });
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
      logError({ formType: FORM_TYPE, step: "firestore", errorMessage: "Firestore save completed" });

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

    } catch (error: any) {
      console.error("Error submitting form:", error);
      logError({ formType: FORM_TYPE, step: "firestore", errorMessage: error?.message || "Submission error", stackTrace: error?.stack, isError: true });
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
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 py-10 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-orange-400/10 rounded-full blur-[80px] -z-10"></div>

        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 p-6 sm:p-10 w-full max-w-md text-center relative overflow-hidden group">
          
          {/* Top decorative gradient bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-amber-500"></div>

          {/* Icon Badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 border-8 border-white shadow-lg relative animate-pulse">
            <span className="text-3xl sm:text-4xl">⏳</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold mb-2 sm:mb-3 text-slate-800 tracking-tight">
            Application Under Review
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 leading-relaxed">
            Thank you for stepping up! We are verifying your details and preparing your official volunteer credentials. This typically takes up to 24 hours.
          </p>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 hover:-translate-y-1"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  if (status === "rejected") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 py-10 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-red-400/10 rounded-full blur-[80px] -z-10"></div>

        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 p-6 sm:p-10 w-full max-w-md text-center relative overflow-hidden group">
          
          {/* Top decorative gradient bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-rose-600"></div>

          {/* Icon Badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 border-8 border-white shadow-lg relative">
            <span className="text-3xl sm:text-4xl">❌</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold mb-2 sm:mb-3 text-slate-800 tracking-tight">
            Application Rejected
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 leading-relaxed">
            Unfortunately, your request to become a verified volunteer was not approved by our moderation team.
          </p>

          {rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-left max-w-sm mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1.5">Feedback from reviewers:</p>
              <p className="text-sm text-slate-700">{rejectionReason}</p>
            </div>
          )}

          <button
            onClick={() => setStatus(null)}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 text-white py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-500/20 hover:-translate-y-1"
          >
            Apply Again
          </button>
          
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
              inputMode="tel"
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
              <span>📷 Upload Photo — Max {FORMATTED_MAX_SIZE}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    const err = validateFile(file, ALLOWED_IMAGE_TYPES);
                    if (err) {
                      logError({ formType: FORM_TYPE, step: "validation", errorMessage: err, ...filePayload(file), isError: true });
                      alert(`Photo: ${err}`);
                      return;
                    }
                  }
                  setPhoto(file);
                }}
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
  readOnly = false,
  inputMode
}: any) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
        {icon}
      </span>
      <input
        type={inputMode === "tel" ? "tel" : "text"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required
        inputMode={inputMode}
        className={`w-full border border-gray-300 rounded-xl py-3.5 sm:py-4 pr-4 pl-12 sm:pl-12 text-sm sm:text-base transition focus:outline-none focus:ring-2 focus:ring-orange-400 ${
          readOnly
            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
            : "bg-white text-gray-800 placeholder:text-gray-400"
        }`}
      />
    </div>
  );
}