"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Reveal from "../components/Reveal";
import GradientText from "../components/GradientText";
import { auth, db, storage } from "../lib/firebase";
import { doc, setDoc, serverTimestamp, GeoPoint, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function VetsPage() {
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-slate-900 pb-16 sm:pb-24 overflow-hidden selection:bg-orange-200 selection:text-orange-900">

        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20 md:pt-40 md:pb-28 text-center max-w-5xl mx-auto flex flex-col items-center">
          
          {/* Ambient Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] md:w-[700px] h-[300px] sm:h-[500px] md:h-[700px] bg-orange-300/15 rounded-full blur-[80px] sm:blur-[120px] -z-10 pointer-events-none"></div>

          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-6 sm:mb-8 shadow-md border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Verified Veterinarians
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-5 sm:mb-8 text-slate-900 leading-[1.1]">
            Be Part of India's <br className="hidden sm:block" />
            <span className="text-orange-600">Emergency Network</span>
          </h1>

          <p className="text-base sm:text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium mb-8 sm:mb-10 px-2 sm:px-0">
            Join verified veterinarians providing critical care, remote consultations, and life-saving treatment coordination across India.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto bg-orange-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 transition-all duration-300 shadow-xl hover:-translate-y-1 hover:shadow-orange-500/30 flex items-center justify-center gap-2 group"
            >
              Register as Veterinarian
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            <a href="#benefits" className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center">
              Learn More
            </a>
          </div>
        </section>

        {/* WHY JOIN SECTION */}
        <Reveal>
          <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 mb-20 md:mb-32 relative z-10">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Why Join AnimalSathi?</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <BenefitCard icon="🚑" title="Save Lives" description="Provide emergency care and consultations for animals in critical condition across India." />
              <BenefitCard icon="🤝" title="Collaboration" description="Work with NGOs, volunteers, and rescue teams in a coordinated emergency response ecosystem." />
              <BenefitCard icon="📊" title="Impact Tracking" description="Monitor your impact with transparent data dashboards showing lives saved and treatments provided." />
              <BenefitCard icon="💼" title="Professional Network" description="Connect with verified veterinarians and build a professional network in animal welfare." />
              <BenefitCard icon="📱" title="Telemedicine" description="Provide remote consultations to areas lacking immediate veterinary care." />
              <BenefitCard icon="🎓" title="Continuing Education" description="Access resources and learning materials for wildlife and emergency animal care." />
            </div>
          </section>
        </Reveal>

        {/* WHAT WE NEED SECTION */}
        <Reveal>
          <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 md:mb-32">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-24 items-center">

              <div className="order-2 lg:order-1">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 tracking-tight">
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

              <div className="order-1 lg:order-2 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-50/0 to-orange-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6">Verification Process</h3>
                  <div className="space-y-6">
                    <VerificationStep number="1" title="Application" desc="Submit your credentials and experience details. We review all submissions carefully." />
                    <VerificationStep number="2" title="Verification" desc="We validate your license through official veterinary boards and government registries." />
                    <VerificationStep number="3" title="Approval" desc="Upon verification, you'll receive a verified badge and full access to the platform." />
                    <VerificationStep number="4" title="Training" desc="Onboarding training on platform tools, emergency protocols, and coordination systems." />
                  </div>
                </div>
              </div>

            </div>
          </section>
        </Reveal>

        {/* REGISTRATION CTA */}
        <Reveal>
          <section id="registration" className="max-w-5xl mx-auto px-4 sm:px-6 mb-10 md:mb-20">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-slate-700">
              <div className="absolute -top-24 -right-24 w-64 h-64 sm:w-96 sm:h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight">
                  Ready to Make an Impact?
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 sm:mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                  Join hundreds of veterinarians already helping save animal lives through AnimalSathi's emergency response network.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5">
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full sm:w-auto bg-orange-500 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 transition shadow-lg hover:-translate-y-1"
                  >
                    Apply Now
                  </button>
                  <Link
                    href="/"
                    className="w-full sm:w-auto bg-slate-800 border border-slate-600 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-slate-700 transition hover:-translate-y-1 block text-center"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

      </main>

      {/* REGISTRATION MODAL (Using Portal for better mobile stacking) */}
      {mounted && showForm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)}></div>

          <div className="relative bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto z-[1000000] animate-in fade-in zoom-in duration-300">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-5 sm:px-8 md:px-12 py-4 sm:py-6 border-b border-slate-100 z-20 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">Veterinarian Application</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></span>
                  Secure & Encrypted
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex shrink-0 items-center justify-center transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-8 md:p-12 pt-6 sm:pt-8">
              <VetRegistrationForm onClose={() => setShowForm(false)} />
            </div>
            
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function BenefitCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 transition-all duration-300 group">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-5 sm:mb-6 border border-orange-200 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 sm:mb-4">{title}</h3>
      <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">{description}</p>
    </div>
  );
}

function RequirementItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 font-bold text-sm mt-0.5">✓</span>
      <span className="text-slate-700 font-medium text-sm sm:text-base">{text}</span>
    </li>
  );
}

function VerificationStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-lg sm:text-xl flex-shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-slate-900 mb-1 text-base sm:text-lg">{title}</h4>
        <p className="text-slate-600 text-sm font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ---------- THE FORM COMPONENT ---------- */

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      console.log("Logged in UID:", currentUser?.uid);
      if (currentUser) {
        try {
          const vetDocRef = doc(db, "vets_web", currentUser.uid);
          const vetDoc = await getDoc(vetDocRef);

          if (vetDoc.exists()) {
            setHasApplied(true);
            setExistingApplication(vetDoc.data());
          } else {
            setFormData((prev) => ({ ...prev, email: currentUser.email || "" }));
          }
        } catch (error) {
          console.error("Error checking existing application:", error);
        } finally {
          setIsLoading(false); 
        }
      } else {
        setIsLoading(false);
      }
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        (error) => console.warn("Geolocation error:", error)
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone || !formData.clinicAddress) {
          alert("Please fill all required fields in this section."); return false;
        }
        return true;
      case 2:
        if (!formData.profilePhoto) {
          alert("Please upload a profile photo."); return false;
        }
        return true;
      case 3:
        if (!formData.document) {
          alert("Please upload a document."); return false;
        }
        return true;
      case 4:
        if (!formData.serviceArea || formData.availability.length === 0) {
          alert("Please fill all required fields in this section."); return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep((prev) => prev + 1); };
  const handleBack = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    if (!user) { alert("Please login first to apply."); return; }
    if (!location) { alert("Please enable location services to continue."); return; }

    setSubmitStatus("📸 Uploading documents securely...");
    try {
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

      setSubmitStatus("🔐 Saving your profile...");
      const geohash = encodeGeohash(location.latitude, location.longitude);

      await setDoc(doc(db, "vets_web", user.uid), {
  uid: user.uid,
  fullName: formData.fullName,
  email: formData.email,
  phone: formData.phone,
  city: formData.city,
  clinicAddress: formData.clinicAddress,
  serviceArea: formData.serviceArea,
  availability: formData.availability,
  willingToTravel: formData.willingToTravel,

  profilePhotoURL,
  documentURL,

  location: new GeoPoint(location.latitude, location.longitude),
  geohash,
  latitude: location.latitude,
  longitude: location.longitude,

  status: "pending",
  verificationStatus: "pending_review",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

      setSubmitStatus("✅ Application submitted successfully!");
      setTimeout(() => {
        setHasApplied(true);
        setExistingApplication({ verificationStatus: "pending_review", fullName: formData.fullName, email: formData.email });
        setSubmitStatus(null);
      }, 1500);
    } catch (error) {
      console.error("Error submitting form:", error); alert("Error submitting form. Please try again."); setSubmitStatus(null);
    }
  };

  if (isLoading) return (
    <div className="py-20 text-center">
      <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-sm sm:text-base text-slate-500 font-medium animate-pulse">Checking credentials...</p>
    </div>
  );

  // 🔥 Authentication Required Screen
  if (!user) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-red-50 rounded-full mb-6 sm:mb-8">
          <span className="text-4xl sm:text-5xl">⚠️</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 sm:mb-4">Authentication Required</h3>
        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-sm mx-auto mb-8 sm:mb-10 px-4">
          You must be logged into an account to submit an application. Please sign in to continue.
        </p>
        <Link 
          href="/auth" 
          className="inline-block bg-slate-900 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base hover:bg-slate-800 transition shadow-lg w-full sm:w-auto"
        >
          Sign In / Register
        </Link>
      </div>
    );
  }

  // Already Applied Screen
  if (hasApplied && existingApplication) {
    return (
      <div className="rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 md:p-12 text-center border bg-slate-50 shadow-inner">
        {existingApplication.verificationStatus === "pending_review" && (
          <>
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">⏳</div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 sm:mb-3">Application Under Review</h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium mb-6 sm:mb-8">Our medical review board is currently verifying your credentials. This usually takes 24-48 hours.</p>
          </>
        )}
        {existingApplication.verificationStatus === "approved" && (
          <>
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">✅</div>
            <h3 className="text-2xl sm:text-3xl font-black text-green-700 mb-2 sm:mb-3">Partnership Approved!</h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium mb-6 sm:mb-8">Congratulations! Your profile has been verified. You can now access your Veterinarian Dashboard.</p>
          </>
        )}
        {existingApplication.verificationStatus === "rejected" && (
          <>
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">❌</div>
            <h3 className="text-2xl sm:text-3xl font-black text-red-600 mb-2 sm:mb-3">Application Rejected</h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium mb-6 sm:mb-8">Unfortunately, we could not verify your license. Please contact support to appeal this decision.</p>
          </>
        )}

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left space-y-2 sm:space-y-3 border border-slate-200 shadow-sm max-w-md mx-auto">
          <p className="text-xs sm:text-sm font-bold text-slate-800 flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-slate-500">Name:</span> <span>{existingApplication.fullName}</span>
          </p>
          <p className="text-xs sm:text-sm font-bold text-slate-800 flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-slate-500">Contact Email:</span> <span className="break-all">{existingApplication.email}</span>
          </p>
        </div>

        <button onClick={onClose} className="mt-8 sm:mt-10 w-full sm:w-auto px-8 sm:px-10 bg-slate-900 text-white py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base hover:bg-slate-800 transition shadow-lg">
          Close Window
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Modern Progress Bar */}
      <div className="mb-8 sm:mb-12">
        <div className="flex justify-between items-end mb-2 sm:mb-3">
          <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">Step {currentStep} of {totalSteps}</span>
          <span className="text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-50 px-2 sm:px-3 py-1 rounded-full">
            {currentStep === 1 ? "Basic Info" : currentStep === 2 ? "Photo" : currentStep === 3 ? "Documents" : "Location"}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 sm:h-3 overflow-hidden shadow-inner">
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
        </div>
      </div>

      {currentStep === 1 && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4">
          <FormInput label="Veterinarian Name *" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Dr. John Doe" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <FormInput label="Email Address *" name="email" type="email" value={formData.email} onChange={handleInputChange} readOnly={!!user?.email} />
            <FormInput label="Phone Number *" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <FormInput label="City / State *" name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g. Delhi" />
            <FormInput label="Clinic Address *" name="clinicAddress" value={formData.clinicAddress} onChange={handleInputChange} placeholder="Full address" />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
            <p className="text-amber-800 text-xs sm:text-sm font-medium">This photo will be displayed to users in need of emergency consultations.</p>
          </div>
          <FileUpload label="Upload Profile Photo *" accept="image/*" onChange={(e:any) => handleFileChange(e, "profilePhoto")} fileName={formData.profilePhoto?.name} />
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
            <p className="text-amber-800 text-xs sm:text-sm font-medium">Upload your Veterinary License or Degree Certificate to verify your medical credentials.</p>
          </div>
          <FileUpload label="Upload License/Degree *" accept=".pdf,.jpg,.jpeg,.png" onChange={(e:any) => handleFileChange(e, "document")} fileName={formData.document?.name} />
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4">
          {/* Location Status */}
          {location ? (
            <div className="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold">✓</span>
              <div>
                <p className="text-sm font-bold text-green-800">Location Locked</p>
                <p className="text-xs text-green-700 font-medium">Coordinates saved securely.</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center font-bold">⚠</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Location Required</p>
                <p className="text-xs text-amber-700 font-medium">Please allow location access to continue.</p>
              </div>
            </div>
          )}

          <FormInput label="Service Area (City/District) *" name="serviceArea" value={formData.serviceArea} onChange={handleInputChange} placeholder="e.g. South Delhi" />

          <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100">
            <label className="block text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider mb-3 sm:mb-4">Standard Availability *</label>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
              {['Weekdays', 'Weekends', '24/7 Emergency'].map(type => (
                <TogglePill key={type} label={type} active={formData.availability.includes(type)} onClick={() => handleAvailabilityChange(type)} />
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100">
            <label className="block text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider mb-3 sm:mb-4">Field Work</label>
            <TogglePill 
              label={formData.willingToTravel ? "🚗 Yes, willing to travel for emergencies" : "🏥 No, clinic/remote only"} 
              active={formData.willingToTravel} 
              onClick={() => setFormData(prev => ({...prev, willingToTravel: !prev.willingToTravel}))} 
            />
          </div>
        </div>
      )}

      {/* Form Navigation */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-slate-100 mt-8 sm:mt-10">
        <button 
          type="button" 
          onClick={handleBack} 
          className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all ${currentStep === 1 || submitStatus ? "opacity-0 pointer-events-none hidden" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Back
        </button>
        
        {currentStep < totalSteps ? (
          <button 
            type="button" 
            onClick={handleNext} 
            disabled={!user} 
            className="w-full sm:flex-1 bg-slate-900 text-white py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:hover:bg-slate-900"
          >
            Continue to Next Step
          </button>
        ) : (
          <button 
            type="submit" 
            disabled={!!submitStatus || !user || !location} 
            className="w-full sm:flex-1 bg-orange-600 text-white py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:bg-orange-700 transition-all shadow-xl hover:shadow-orange-500/30 disabled:opacity-50"
          >
            {submitStatus ? (
              <><span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span><span className="truncate">{submitStatus}</span></>
            ) : "Submit Application"}
          </button>
        )}
      </div>
    </form>
  );
}

/* ---------- SLEEK UI INPUT COMPONENTS ---------- */

function FormInput({ label, name, type = "text", value, onChange, readOnly = false, required = true, placeholder }: any) {
  return (
    <div className="relative">
      <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2 ml-1 flex items-center gap-2">
        {label} 
        {readOnly && <span className="text-[9px] sm:text-[10px] bg-slate-200 text-slate-600 px-1.5 sm:px-2 py-0.5 rounded-full">LOCKED</span>}
      </label>
      <input 
        type={type} 
        name={name} 
        value={value} 
        onChange={onChange} 
        readOnly={readOnly} 
        required={required} 
        placeholder={placeholder}
        className={`w-full rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-base font-medium outline-none transition-all duration-300 border ${
          readOnly 
            ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed" 
            : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 placeholder:text-slate-400"
        }`} 
      />
    </div>
  );
}

function FileUpload({ label, accept, onChange, fileName }: any) {
  return (
    <div>
      <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2 ml-1">{label}</label>
      <label className={`relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer transition-all duration-300 group ${
        fileName 
          ? "border-green-400 bg-green-50" 
          : "border-slate-300 bg-slate-50 hover:bg-orange-50 hover:border-orange-300"
      }`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className={`text-3xl sm:text-4xl mb-2 sm:mb-3 transition-transform duration-300 group-hover:-translate-y-1 ${fileName ? "text-green-500" : "text-slate-400"}`}>
          {fileName ? "✅" : "📄"}
        </div>
        <p className={`font-bold text-sm sm:text-base text-center z-10 truncate w-full px-2 ${fileName ? "text-green-800" : "text-slate-600 group-hover:text-orange-600"}`}>
          {fileName || "Tap to upload file"}
        </p>
        {!fileName && <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 sm:mt-2 z-10">Supports {accept}</p>}
        <input type="file" accept={accept} onChange={onChange} className="hidden" />
      </label>
    </div>
  );
}

function TogglePill({ label, active, onClick }: any) {
  return (
    <div 
      onClick={onClick} 
      className={`cursor-pointer rounded-xl sm:rounded-full px-4 py-3 sm:px-5 sm:py-3 font-bold text-xs sm:text-sm transition-all duration-200 select-none flex-1 text-center border-2 ${
        active 
          ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/20" 
          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </div>
  );
}

function encodeGeohash(lat: number, lon: number, precision = 6) {
  const chars = "0123456789bcdefghjkmnpqrstuvwxyz";
  let idx = 0, bit = 0, evenBit = true, geohash = "";
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180;
  while (geohash.length < precision) {
    if (evenBit) {
      const lonMid = (lonMin + lonMax) / 2;
      if (lon >= lonMid) { idx = (idx << 1) + 1; lonMin = lonMid; } else { idx = idx << 1; lonMax = lonMid; }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) { idx = (idx << 1) + 1; latMin = latMid; } else { idx = idx << 1; latMax = latMid; }
    }
    evenBit = !evenBit; if (bit < 4) bit++; else { geohash += chars[idx]; bit = 0; idx = 0; }
  }
  return geohash;
}