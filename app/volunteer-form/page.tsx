"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { auth, db, storage } from "../lib/firebase";


import { doc, getDoc, setDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function VolunteerFormPage() {

  const [user,setUser] = useState<any>(null);

  const [photo,setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [form,setForm] = useState({
    name:"",
    phone:"",
    email:"",
    address:"",
    reason:""
  });

  const [isVolunteer, setIsVolunteer] = useState(false);
const [checking, setChecking] = useState(true);
const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  useEffect(()=>{

  const unsub = onAuthStateChanged(auth, async (currentUser)=>{

      
    if(currentUser){

      setUser(currentUser);

      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
  const data = snap.data();

  // 🔥 ADD THIS
  if (data.volunteerStatus) {
    setStatus(data.volunteerStatus);
  }

  // existing logic
  if (data.volunteerStatus === "approved") {
    setIsVolunteer(true);
  }
}

      setForm((prev)=>({
        ...prev,
        name: currentUser.displayName || "",
        email: currentUser.email || ""
      }));

    }

    setChecking(false);

  });

  

  return ()=>unsub();

},[]);


  const handleChange = (e:any)=>{

    setForm({
      ...form,
      [e.target.name]:e.target.value
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
        setSubmitStatus("📸 Uploading your photo..."); // <--- UI UPDATE
        const storageRef = ref(storage, `volunteerPhotos/${user.uid}_${Date.now()}_${photo.name}`);
        await uploadBytes(storageRef, photo);
        photoURL = await getDownloadURL(storageRef);
      }

      /* 2. Call backend to generate ID card and certificate */
      setSubmitStatus("🎓 Generating official documents..."); // <--- UI UPDATE
      const BASE_URL = 'https://pawsos-certificates-production.up.railway.app';
      

      

    

      /* 3. Get User's GPS Location */
      setSubmitStatus("📍 Verifying your location..."); // <--- UI UPDATE
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
      setSubmitStatus("🔐 Securing your profile..."); // <--- UI UPDATE
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

    volunteerStatus: "pending",   // 🔥 KEY
    volunteerApproved: false,     // 🔥 KEY

    volunteerRequestedAt: serverTimestamp(),

    ...locationData
  },
  { merge: true }
);

      setSubmitStatus("✅ Done!"); // <--- UI UPDATE

      setTimeout(() => {
  setStatus("pending");   // 🔥 ADD THIS

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
      setSubmitStatus(null); // <--- Reset button on error
    }
  };
if (checking) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  );
}
if (status === "pending") {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h2 className="text-xl font-semibold">
        Your application is under review ⏳
      </h2>
    </div>
  );
}
if (status === "rejected") {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">
          Application Rejected ❌
        </h2>
        <p className="text-gray-600 mb-4">
          Unfortunately, your volunteer request was not approved.
        </p>

        <button
          onClick={() => setStatus(null)}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Apply Again
        </button>
      </div>
    </div>
  );
}
if (isVolunteer) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6 relative overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-400/10 rounded-full blur-[80px] -z-10"></div>

        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-10 w-full max-w-md text-center relative overflow-hidden group">
          
          {/* Top decorative gradient bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

          {/* Icon Badge */}
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-white shadow-lg relative group-hover:scale-110 transition-transform duration-500">
            <span className="text-4xl">🦸‍♂️</span>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold shadow-sm">
              ✓
            </div>
          </div>

          <h1 className="text-2xl font-extrabold mb-3 text-slate-800 tracking-tight">
            Active Volunteer Status
          </h1>

          <p className="text-slate-600 mb-8 leading-relaxed">
            Thank you for stepping up to save lives. You already have full access to the emergency rescue ecosystem.
          </p>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 hover:-translate-y-1"
          >
            Open Dashboard <span>→</span>
          </Link>

          <Link
            href="/"
            className="block mt-6 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Return to Homepage
          </Link>

        </div>
      </main>
    );
  }
  return (

    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center px-6 py-20">

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-10">

        <Link
          href="/onboarding"
          className="text-gray-600 hover:text-orange-600 transition"
        >
          ← Back
        </Link>


        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mt-4 mb-6">
          Become a Volunteer
        </h1>

        <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
          Volunteers are the backbone of PawSOS. Join us to rescue, protect,
          and give a voice to animals in need.
        </p>


        <form onSubmit={handleSubmit} className="space-y-6">


          <div className="grid md:grid-cols-2 gap-6">

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

            <span className="absolute left-4 top-4 text-gray-400">
              💬
            </span>

            <textarea
              name="reason"
              placeholder="Why do you want to volunteer?"
              rows={4}
              value={form.reason}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl p-4 pl-12 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />

          </div>


          {/* PHOTO UPLOAD */}

          <div className="border border-orange-300 rounded-xl p-4 text-center bg-orange-50 hover:bg-orange-100 transition">

            <label className="cursor-pointer text-orange-600 font-semibold text-lg">

              📷 Upload Photo

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e)=>setPhoto(e.target.files?.[0] || null)}
              />

            </label>

            {photo && (

              <p className="text-sm mt-2 text-gray-500">
                {photo.name}
              </p>

            )}

          </div>


          <div className="bg-green-100 text-green-700 rounded-xl p-4 text-sm">
            Your information is secure and used only for rescue coordination.
          </div>


          <button
  type="submit"
  disabled={!!submitStatus}
  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all shadow-md flex items-center justify-center gap-3 ${
    submitStatus 
      ? "bg-slate-100 text-slate-600 cursor-wait border border-slate-200" 
      : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5"
  }`}
>
  {submitStatus ? (
    <>
      {/* Animated Spinner (Hides when it hits 'Done!') */}
      {submitStatus !== "✅ Done!" && (
        <div className="w-5 h-5 border-2 border-slate-400 border-t-orange-500 rounded-full animate-spin"></div>
      )}
      <span className="font-bold">{submitStatus}</span>
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
  readOnly = false // NEW: Defaults to false, but locks the field if true
}: any) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </span>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly} // NEW: Prevents typing
        required // NEW: Browser forces them to fill this out
        className={`w-full border border-gray-300 rounded-xl p-4 pl-12 transition focus:outline-none focus:ring-2 focus:ring-orange-400 ${
          readOnly 
            ? "bg-slate-100 text-slate-500 cursor-not-allowed" // Gray out if locked
            : "bg-white text-gray-800 placeholder:text-gray-500" // Normal look
        }`}
      />
    </div>
  );
}