"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Reveal from "../components/Reveal";
import GradientText from "../components/GradientText";
import { auth, db, storage } from "../lib/firebase";
import { doc, setDoc, serverTimestamp, GeoPoint, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function VetsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 overflow-hidden">

      {/* HERO SECTION */}
      <section className="relative px-6 pt-32 pb-20 md:pt-40 md:pb-28 text-center max-w-5xl mx-auto flex flex-col items-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-300/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900 text-white text-xs font-bold tracking-widest uppercase mb-8 shadow-md">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          Verified Veterinarians
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8">
          Be Part of India's <GradientText>Animal Emergency Network</GradientText>
        </h1>

        <p className="text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
          Join verified veterinarians providing critical care, remote consultations, and life-saving treatment coordination across India.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg hover:-translate-y-1"
          >
            Register as Veterinarian
          </button>
          <a href="#benefits" className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-full font-semibold hover:border-slate-300 hover:bg-slate-50 transition shadow-sm">
            Learn More
          </a>
        </div>
      </section>

      {/* WHY JOIN SECTION */}
      <Reveal>
        <section id="benefits" className="max-w-6xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Why Join AnimalSathi?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              icon="🚑"
              title="Save Lives"
              description="Provide emergency care and consultations for animals in critical condition across India."
            />
            <BenefitCard
              icon="🤝"
              title="Collaboration"
              description="Work with NGOs, volunteers, and rescue teams in a coordinated emergency response ecosystem."
            />
            <BenefitCard
              icon="📊"
              title="Impact Tracking"
              description="Monitor your impact with transparent data dashboards showing lives saved and treatments provided."
            />
            <BenefitCard
              icon="💼"
              title="Professional Network"
              description="Connect with verified veterinarians and build a professional network in animal welfare."
            />
            <BenefitCard
              icon="📱"
              title="Telemedicine"
              description="Provide remote consultations to areas lacking immediate veterinary care."
            />
            <BenefitCard
              icon="🎓"
              title="Continuing Education"
              description="Access resources and learning materials for wildlife and emergency animal care."
            />
          </div>
        </section>
      </Reveal>

      {/* WHAT WE NEED SECTION */}
      <Reveal>
        <section className="max-w-6xl mx-auto px-6 mb-32">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">

            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                What We're Looking For
              </h2>
              <ul className="space-y-4">
                <RequirementItem text="Licensed veterinarian (BVSc or equivalent qualification)" />
                <RequirementItem text="Valid practice license (RCVS, PCI, or national equivalent)" />
                <RequirementItem text="Experience in emergency care or wildlife rescue (preferred)" />
                <RequirementItem text="Commitment to pro-bono consultations for critical cases" />
                <RequirementItem text="Willingness to mentor and train rescue volunteers" />
                <RequirementItem text="Access to basic medical equipment for remote consultations" />
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8 md:p-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Verification Process</h3>
              <div className="space-y-6">
                <VerificationStep number="1" title="Application" desc="Submit your credentials and experience details. We review all submissions carefully." />
                <VerificationStep number="2" title="Verification" desc="We validate your license through official veterinary boards and government registries." />
                <VerificationStep number="3" title="Approval" desc="Upon verification, you'll receive a verified badge and full access to the platform." />
                <VerificationStep number="4" title="Training" desc="Onboarding training on platform tools, emergency protocols, and coordination systems." />
              </div>
            </div>

          </div>
        </section>
      </Reveal>

      {/* REGISTRATION CTA */}
      <Reveal>
        <section id="registration" className="max-w-5xl mx-auto px-6 mb-32">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-slate-900 to-slate-900 pointer-events-none"></div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Ready to Make an Impact?
              </h2>
              <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                Join hundreds of veterinarians already helping save animal lives through AnimalSathi's emergency response network.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full sm:w-auto bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition shadow-lg"
                >
                  📧 Apply Now
                </button>
                <a
                  href="/"
                  className="w-full sm:w-auto bg-slate-800 border border-slate-700 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-slate-700 transition"
                >
                  Return Home
                </a>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

    </main>

    {/* REGISTRATION MODAL */}
    {showForm && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/20 z-[60] backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        ></div>

        {/* Modal */}
        <div className="fixed top-20 bottom-0 left-0 right-0 z-[70] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 mt-8 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="p-10 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Register as Veterinarian
              </h2>
              <p className="text-slate-600 mb-8">
                Fill out the form below to apply and join our verified veterinarian network.
              </p>

              {/* Form will go here */}
              <VetRegistrationForm onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function BenefitCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function RequirementItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="text-blue-500 mt-1 flex-shrink-0 font-bold">✓</span>
      <span className="text-slate-700 text-lg">{text}</span>
    </li>
  );
}

function VerificationStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-slate-600 text-sm">{desc}</p>
      </div>
    </div>
  );
}

function VetRegistrationForm({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [user, setUser] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    clinicAddress: "",
    profilePhoto: null as File | null,
    document: null as File | null,
    serviceArea: "",
    availability: [] as string[],
    willingToTravel: false,
  });

  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  // Get user location on component mount
  useEffect(() => {
    // Check auth and existing application
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const vetDocRef = doc(db, "vets_web", currentUser.uid);
          const vetDoc = await getDoc(vetDocRef);

          if (vetDoc.exists()) {
            setHasApplied(true);
            setExistingApplication(vetDoc.data());
          }
        } catch (error) {
          console.error("Error checking existing application:", error);
        } finally {
          // 🔥 NEW: Turn off loading once Firebase is done checking
          setIsLoading(false); 
        }
      } else {
        // 🔥 NEW: Turn off loading if they aren't logged in at all
        setIsLoading(false);
      }
    });

    // Get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
        }
      );
    }
    
    return () => unsub();

  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleAvailabilityChange = (option: string) => {
    setFormData((prev) => {
      const updated = prev.availability.includes(option)
        ? prev.availability.filter((item) => item !== option)
        : [...prev.availability, option];
      return { ...prev, availability: updated };
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, willingToTravel: e.target.checked }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone || !formData.clinicAddress) {
          alert("Please fill all required fields in this section.");
          return false;
        }
        return true;
      case 2:
        if (!formData.profilePhoto) {
          alert("Please upload a profile photo.");
          return false;
        }
        return true;
      case 3:
        if (!formData.document) {
          alert("Please upload a document.");
          return false;
        }
        return true;
      case 4:
        if (!formData.serviceArea || formData.availability.length === 0) {
          alert("Please fill all required fields in this section.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    if (!user) {
      alert("Please login first to apply.");
      return;
    }

    if (!location) {
      alert("Please enable location services to continue.");
      return;
    }

    setSubmitStatus("📤 Submitting your application...");

    try {
      // Step 1: Upload files to Firebase Storage
      setSubmitStatus("📸 Uploading your documents...");
      let profilePhotoURL = "";
      let documentURL = "";

      if (formData.profilePhoto) {
        const photoRef = ref(storage, `vets/profilePhotos/${user.uid}_${Date.now()}_${formData.profilePhoto.name}`);
        await uploadBytes(photoRef, formData.profilePhoto);
        profilePhotoURL = await getDownloadURL(photoRef);
      }

      if (formData.document) {
        const docRef = ref(storage, `vets/documents/${user.uid}_${Date.now()}_${formData.document.name}`);
        await uploadBytes(docRef, formData.document);
        documentURL = await getDownloadURL(docRef);
      }

      // Step 2: Generate geohash from coordinates
      const geohash = encodeGeohash(location.latitude, location.longitude);

      // Step 3: Save to Firestore vets_web collection
      setSubmitStatus("🔐 Saving your profile...");
      await setDoc(doc(db, "vets_web", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        clinicAddress: formData.clinicAddress,
        profilePhotoURL: profilePhotoURL,
        documentURL: documentURL,
        serviceArea: formData.serviceArea,
        availability: formData.availability,
        willingToTravel: formData.willingToTravel,
        location: new GeoPoint(location.latitude, location.longitude),
        geohash: geohash,
        latitude: location.latitude,
        longitude: location.longitude,
        status: "pending",
        verificationStatus: "pending_review",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmitStatus("✅ Application submitted successfully!");
      setTimeout(() => {
        alert("Thank you for applying! We'll review your application and get back to you soon.");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          city: "",
          clinicAddress: "",
          profilePhoto: null,
          document: null,
          serviceArea: "",
          availability: [],
          willingToTravel: false,
        });
        setSubmitStatus(null);
        setCurrentStep(1);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please try again.");
      setSubmitStatus(null);
    }
  };
if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-slate-500 font-medium animate-pulse">Checking your profile securely...</p>
      </div>
    );
  }
  return (
    <>
      {hasApplied && existingApplication && (
  <div className="rounded-2xl p-8 mb-6 text-center border">

    {/* ✅ STATUS BASED UI */}
    {existingApplication.verificationStatus === "pending_review" && (
      <>
        <div className="text-4xl mb-3">⏳</div>
        <h3 className="text-2xl font-bold text-amber-700 mb-2">
          Application Under Review
        </h3>
        <p className="text-slate-600 mb-4">
          Your application has been submitted successfully and is currently under review.
        </p>
      </>
    )}

    {existingApplication.verificationStatus === "approved" && (
      <>
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-2xl font-bold text-green-700 mb-2">
          You’re Approved 🎉
        </h3>
        <p className="text-slate-600 mb-4">
          Congratulations! Your profile has been verified. You can now start helping animals and accessing all platform features.
        </p>
      </>
    )}

    {existingApplication.verificationStatus === "rejected" && (
      <>
        <div className="text-4xl mb-3">❌</div>
        <h3 className="text-2xl font-bold text-red-600 mb-2">
          Application Rejected
        </h3>
        <p className="text-slate-600 mb-4">
          Unfortunately, your application could not be approved. Please review your details and apply again.
        </p>
      </>
    )}

    {/* COMMON DETAILS */}
    <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2 mt-4">
      <p><b>Name:</b> {existingApplication.fullName}</p>
      <p><b>Email:</b> {existingApplication.email}</p>
      <p>
        <b>Status:</b>{" "}
        {existingApplication.verificationStatus === "pending_review" && "Pending Review"}
        {existingApplication.verificationStatus === "approved" && "Approved"}
        {existingApplication.verificationStatus === "rejected" && "Rejected"}
      </p>
    </div>

    <button
      onClick={onClose}
      className="mt-6 bg-slate-800 text-white px-6 py-2 rounded-xl"
    >
      Close
    </button>
  </div>
)}
      {/* REGISTRATION FORM */}
      {!hasApplied && (
        <form onSubmit={handleSubmit} className="space-y-8">
      {/* AUTH STATUS */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ℹ️ You need to be logged in to submit an application.{" "}
            <Link href="/auth" className="font-semibold underline hover:text-blue-900">
              Sign in here
            </Link>
          </p>
        </div>
      )}

      {/* PROGRESS INDICATOR */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-slate-600">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-slate-500">
            {currentStep === 1 && "Personal Information"}
            {currentStep === 2 && "Profile Photo"}
            {currentStep === 3 && "Documents"}
            {currentStep === 4 && "Availability & Location"}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* STEP 1: PERSONAL INFORMATION */}
      {currentStep === 1 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            👤 Personal Information
          </h3>
          <div className="space-y-4">
            <FormInput
              label="Veterinarian Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
            />
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <FormInput
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput
                label="City / State"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
              <FormInput
                label="Full Clinic Address"
                name="clinicAddress"
                value={formData.clinicAddress}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PROFILE PHOTO */}
      {currentStep === 2 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            📸 Profile Photo
          </h3>
          <FileUpload
            label="Upload your profile photo"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "profilePhoto")}
            fileName={formData.profilePhoto?.name}
          />
        </div>
      )}

      {/* STEP 3: DOCUMENT UPLOAD */}
      {currentStep === 3 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            📋 Document Upload
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Upload your Veterinary License Certificate or Degree Certificate (PDF, JPG, PNG)
          </p>
          <FileUpload
            label="Upload Document (License or Degree Certificate)"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange(e, "document")}
            fileName={formData.document?.name}
          />
        </div>
      )}

      {/* STEP 4: AVAILABILITY & LOCATION */}
      {currentStep === 4 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            📍 Availability & Location
          </h3>
          <div className="space-y-6">
            {/* Location Status */}
            {location ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-green-700">
                  Location captured: {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                </span>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                <span className="text-yellow-600">⚠</span>
                <span className="text-sm text-yellow-700">
                  Location not captured. Please enable location services.
                </span>
              </div>
            )}

            <FormInput
              label="Service Area (City / District)"
              name="serviceArea"
              value={formData.serviceArea}
              onChange={handleInputChange}
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Availability
              </label>
              <div className="space-y-3">
                <CheckboxField
                  label="Weekdays"
                  checked={formData.availability.includes("Weekdays")}
                  onChange={() => handleAvailabilityChange("Weekdays")}
                />
                <CheckboxField
                  label="Weekends"
                  checked={formData.availability.includes("Weekends")}
                  onChange={() => handleAvailabilityChange("Weekends")}
                />
                <CheckboxField
                  label="24/7 Emergency"
                  checked={formData.availability.includes("24/7 Emergency")}
                  onChange={() => handleAvailabilityChange("24/7 Emergency")}
                />
              </div>
            </div>

            <CheckboxField
              label="Willing to travel for rescue cases?"
              checked={formData.willingToTravel}
              onChange={handleCheckboxChange}
            />
          </div>
        </div>
      )}

      {/* NAVIGATION BUTTONS */}
      <div className="flex gap-4 mt-10">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            currentStep === 1
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          ← Back
        </button>

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!user}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              !user
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
            }`}
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={!!submitStatus || !user}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-3 ${
              submitStatus || !user
                ? "bg-slate-100 text-slate-600 cursor-wait border border-slate-200"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
            }`}
          >
            {submitStatus ? (
              <>
                {submitStatus !== "✅ Application submitted successfully!" && (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-blue-500 rounded-full animate-spin"></div>
                )}
                <span className="font-bold">{submitStatus}</span>
              </>
            ) : !user ? (
              "Please log in to submit"
            ) : (
              "Submit Application"
            )}
          </button>
        )}
      </div>
    </form>
      )}
    </>
  );
}

/* FORM FIELD COMPONENTS */

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  );
}

function FileUpload({
  label,
  accept,
  onChange,
  fileName,
}: {
  label: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>
      <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition">
        <div className="text-center">
          <span className="text-2xl">📁</span>
          <p className="text-blue-600 font-semibold text-sm mt-1">
            {fileName ? `✓ ${fileName}` : "Click to upload"}
          </p>
          <p className="text-slate-500 text-xs mt-1">PDF, JPG, or PNG</p>
        </div>
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
      </label>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (e?: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
      />
      <span className="text-slate-700 font-medium">{label}</span>
    </label>
  );
}

/* GEOHASH ENCODING FUNCTION */

/**
 * Simple geohash encoder for latitude and longitude
 * Encodes coordinates into a string geohash with 6-character precision
 */
function encodeGeohash(latitude: number, longitude: number, precision: number = 6): string {
  const chars = "0123456789bcdefghjkmnpqrstuvwxyz";
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";

  let latMin = -90,
    latMax = 90;
  let lonMin = -180,
    lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lonMid = (lonMin + lonMax) / 2;
      if (longitude >= lonMid) {
        idx = (idx << 1) + 1;
        lonMin = lonMid;
      } else {
        idx = idx << 1;
        lonMax = lonMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (latitude >= latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }

    evenBit = !evenBit;

    if (bit < 4) {
      bit++;
    } else {
      geohash += chars[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}
