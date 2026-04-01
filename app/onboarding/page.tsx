"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import ParallaxHero from "../components/ParallaxHero";
import Reveal from "../components/Reveal";
import GradientText from "../components/GradientText";
import { auth, db, storage } from "../lib/firebase";
import { doc, setDoc, serverTimestamp, GeoPoint, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function NGOOnboardingPage() {
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-slate-900 pb-16 sm:pb-24 overflow-hidden selection:bg-orange-200 selection:text-orange-900">
        
        {/* HERO SECTION - PROFESSIONAL SAAS LAYOUT */}
        <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Ambient Background Glows */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-20 -left-32 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-orange-300/10 rounded-full blur-[80px] sm:blur-[100px]"></div>
            <div className="absolute bottom-0 -right-32 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-slate-300/20 rounded-full blur-[80px] sm:blur-[100px]"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
            
            {/* LEFT COLUMN: Copy & CTA */}
            <div className="text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-5 sm:mb-6 shadow-sm border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                NGO Partner Portal
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 sm:mb-6 text-slate-900 leading-[1.1]">
                Empower your <br className="hidden md:block"/>
                rescue with <span className="text-orange-600">data.</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium mb-8 sm:mb-10 px-2 sm:px-0">
                Gain access to India's first structured, location-based emergency feed. Route volunteers instantly, track your impact, and eliminate WhatsApp chaos.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 sm:gap-4">
                <button 
                  onClick={() => setShowForm(true)}
                  className="w-full sm:w-auto bg-slate-900 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 transition-all duration-300 shadow-xl hover:-translate-y-1 hover:shadow-orange-600/30 flex items-center justify-center gap-2 group"
                >
                  Apply for NGO Partnership
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
                <a href="#benefits" className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center">
                  Explore Tools
                </a>
              </div>
              
              {/* Trust Indicator */}
              <p className="text-xs sm:text-sm font-bold text-slate-400 mt-5 sm:mt-6 flex items-center justify-center lg:justify-start gap-2">
                <span className="text-green-500">✓</span> 100% Free for verified 80G/12A NGOs
              </p>
            </div>

            {/* RIGHT COLUMN: Visual / UI Mockup */}
            <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 lg:ml-auto max-w-xl group z-10">
              
              <img 
                src="https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&q=80&w=1000" 
                alt="Veterinarian with dog" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
              
            </div>
            
          </div>
        </section>

        {/* CORE BENEFITS FOR NGOS */}
        <Reveal>
          <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 mb-20 md:mb-32 relative z-10">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 sm:mb-6">Why Partner With Us?</h2>
              <p className="text-slate-500 text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-medium px-2">We provide the digital infrastructure so you can focus on what matters most: saving lives.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <BenefitCard icon="📡" title="Centralized SOS Feed" desc="No more chaotic WhatsApp groups. Get structured emergency alerts with exact GPS locations, photos, and urgency algorithms." />
              <BenefitCard icon="🦸‍♀️" title="Volunteer Dispatch" desc="Instantly assign verified local volunteers to scout locations, provide first aid, or assist your team with transport." />
              <BenefitCard icon="📊" title="Verified Impact Data" desc="Generate automated reports with before-and-after photo evidence. Perfect for CSR compliance and donor transparency." />
            </div>
          </section>
        </Reveal>

        {/* THE ONBOARDING PROCESS */}
        <Reveal>
          <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 md:mb-32">
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-16 border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="text-center mb-10 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 sm:mb-6">The Verification Process</h2>
                <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto font-medium">To ensure trust and safety within our ecosystem, every NGO undergoes a strict vetting process.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <StepCard step="01" title="Apply Online" text="Submit your organization's details through our secure partner form." />
                <StepCard step="02" title="Document Check" text="Our team verifies your registration, 80G/12A, and past track record." />
                <StepCard step="03" title="Admin Setup" text="Receive your dedicated admin accounts and platform training." />
                <StepCard step="04" title="Start Rescuing" text="Access the live SOS feed and coordinate with volunteers instantly." />
              </div>
            </div>
          </section>
        </Reveal>

        {/* BOTTOM CTA */}
        <Reveal>
          <section className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-slate-700">
              <div className="absolute -top-24 -right-24 w-64 h-64 sm:w-96 sm:h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tight">
                  Ready to scale your impact?
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 sm:mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                  Join the fastest-growing network of animal welfare organizations in India. Together, we are stronger.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5 w-full">
                  <button 
                    onClick={() => setShowForm(true)}
                    className="w-full sm:w-auto bg-orange-500 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 transition shadow-lg hover:-translate-y-1"
                  >
                    Begin NGO Application
                  </button>
                  <Link href="/" className="w-full sm:w-auto bg-slate-800 border border-slate-600 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-slate-700 transition hover:-translate-y-1 block text-center">
                    Return Home
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </main>

      {/* REGISTRATION MODAL */}
      {mounted && showForm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)}></div>

          {/* 🔥 FIX: Mobile padding and sizing improvements */}
          <div className="relative bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto z-[1000000] animate-in fade-in zoom-in duration-300">
            
            {/* Modal Header (Sticky & Glass) */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-5 sm:px-8 md:px-12 py-4 sm:py-6 border-b border-slate-100 z-20 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">NGO Application</h2>
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
              <NGORegistrationForm onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function BenefitCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 transition-all duration-300 group">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-5 sm:mb-6 border border-orange-200 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 sm:mb-4">{title}</h3>
      <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function StepCard({ step, title, text }: any) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-sm hover:border-orange-200 transition-colors relative group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/0 to-orange-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="text-4xl sm:text-5xl font-black text-slate-200 mb-3 sm:mb-4 group-hover:text-orange-500 transition-colors duration-300 tracking-tighter">{step}</div>
        <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">{text}</p>
      </div>
    </div>
  );
}

/* ---------- THE NGO FORM COMPONENT ---------- */

/* ---------- THE NGO FORM COMPONENT ---------- */

function NGORegistrationForm({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [user, setUser] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    ngoName: "",
    contactPerson: "",
    email: "",
    phone: "",
    regNumber: "",
    darpanId: "",
    city: "",
    fullAddress: "",
    serviceArea: "",
    hasAmbulance: false,
    hasShelter: false,
    animalTypes: [] as string[],
    logo: null as File | null,
    regCert: null as File | null,
    eightyGCert: null as File | null,
  });

  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const ngoDoc = await getDoc(doc(db, "ngos_web", currentUser.uid));
          if (ngoDoc.exists()) {
            setHasApplied(true);
            setExistingApplication(ngoDoc.data());
          } else {
            setFormData(prev => ({ ...prev, email: currentUser.email || "" }));
          }
        } catch (error) {
          console.error("Error checking NGO status:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.warn("Location disabled", err)
      );
    }
    return () => unsub();
  }, []);

  const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e: any, field: string) => setFormData({ ...formData, [field]: e.target.files?.[0] || null });
  const handleCheckboxChange = (field: string, value: boolean) => setFormData({ ...formData, [field]: value });
  
  const handleAnimalType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      animalTypes: prev.animalTypes.includes(type) ? prev.animalTypes.filter(t => t !== type) : [...prev.animalTypes, type]
    }));
  };

  const validateStep = (step: number) => {
    if (step === 1 && (!formData.ngoName || !formData.contactPerson || !formData.email || !formData.phone || !formData.regNumber)) {
      alert("Please fill all required NGO details."); return false;
    }
    if (step === 2 && (!formData.city || !formData.fullAddress || formData.animalTypes.length === 0)) {
      alert("Please provide location and at least one animal capability."); return false;
    }
    if (step === 3 && (!formData.logo || !formData.regCert)) {
      alert("Logo and Official Registration Certificate are required."); return false;
    }
    return true;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => prev + 1); };
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    if (!user) { alert("Please login to apply."); return; }
    if (!location) { alert("Please enable location services to complete your registration."); return; }

    setSubmitStatus("📸 Uploading documents securely...");
    try {
      let logoURL = "", regCertURL = "", eightyGCertURL = "";
      const upload = async (file: File, path: string) => {
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
      };

      if (formData.logo) logoURL = await upload(formData.logo, `ngos/logos/${user.uid}_${Date.now()}`);
      if (formData.regCert) regCertURL = await upload(formData.regCert, `ngos/certs/${user.uid}_${Date.now()}`);
      if (formData.eightyGCert) eightyGCertURL = await upload(formData.eightyGCert, `ngos/80G/${user.uid}_${Date.now()}`);

      setSubmitStatus("🔐 Encrypting and saving profile...");
      const geohash = encodeGeohash(location.latitude, location.longitude);

      await setDoc(doc(db, "ngos_web", user.uid), {
        uid: user.uid,
        ...formData,
        logo: logoURL,
        regCert: regCertURL,
        eightyGCert: eightyGCertURL,
        location: new GeoPoint(location.latitude, location.longitude),
        geohash, latitude: location.latitude, longitude: location.longitude,
        status: "pending", verificationStatus: "pending_review", role: "ngo",
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      }, { merge: true });

      setSubmitStatus("✅ Application submitted successfully!");
      setTimeout(() => {
        setHasApplied(true);
        setExistingApplication({ verificationStatus: "pending_review", ngoName: formData.ngoName, email: formData.email });
        setSubmitStatus(null);
      }, 1500);
    } catch (error) {
      console.error(error); alert("Submission failed. Please try again."); setSubmitStatus(null);
    }
  };

  if (isLoading) return (
    <div className="py-20 text-center">
      <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-sm sm:text-base text-slate-500 font-medium animate-pulse">Checking credentials...</p>
    </div>
  );

  // 🔥 FIX: If the user is NOT logged in, show ONLY this screen and stop rendering the form
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

  if (hasApplied && existingApplication) {
    return (
      <div className="rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 md:p-12 text-center border bg-slate-50 shadow-inner">
        {existingApplication.verificationStatus === "pending_review" && (
          <>
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">⏳</div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 sm:mb-3">Application Under Review</h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium mb-6 sm:mb-8">Our trust & safety team is currently verifying your NGO's credentials. This usually takes 24-48 hours.</p>
          </>
        )}
        {existingApplication.verificationStatus === "approved" && (
          <>
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">✅</div>
            <h3 className="text-2xl sm:text-3xl font-black text-green-700 mb-2 sm:mb-3">Partnership Approved!</h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium mb-6 sm:mb-8">Congratulations! Your NGO has been verified. You can now access your Admin Dashboard.</p>
          </>
        )}
        {existingApplication.verificationStatus === "rejected" && (
          <>
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">❌</div>
            <h3 className="text-2xl sm:text-3xl font-black text-red-600 mb-2 sm:mb-3">Application Rejected</h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium mb-6 sm:mb-8">Unfortunately, we could not verify your documents. Please contact support to appeal this decision.</p>
          </>
        )}

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left space-y-2 sm:space-y-3 border border-slate-200 shadow-sm max-w-md mx-auto">
          <p className="text-xs sm:text-sm font-bold text-slate-800 flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-slate-500">Organization:</span> <span>{existingApplication.ngoName}</span>
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
            {currentStep === 1 ? "Basic Info" : currentStep === 2 ? "Operations" : currentStep === 3 ? "Documents" : "Finalize"}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 sm:h-3 overflow-hidden shadow-inner">
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
        </div>
      </div>

      {currentStep === 1 && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4">
          <FormInput label="Official NGO/Trust Name *" name="ngoName" value={formData.ngoName} onChange={handleInputChange} placeholder="e.g. Hope Animal Rescue" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <FormInput label="Primary Contact Person *" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Full Name" />
            <FormInput label="Official Phone Number *" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 XXXXX XXXXX" />
          </div>
          <FormInput label="Official Email Address *" name="email" type="email" value={formData.email} onChange={handleInputChange} readOnly={!!user?.email} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <FormInput label="Trust/Society Reg No. *" name="regNumber" value={formData.regNumber} onChange={handleInputChange} placeholder="Required" />
            <FormInput label="NITI Aayog Darpan ID" name="darpanId" value={formData.darpanId} onChange={handleInputChange} required={false} placeholder="Optional" />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <FormInput label="City of Operation *" name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g. Delhi" />
            <FormInput label="Primary Service Zone *" name="serviceArea" value={formData.serviceArea} onChange={handleInputChange} placeholder="e.g. South Delhi" />
          </div>
          <FormInput label="Full Registered Address *" name="fullAddress" value={formData.fullAddress} onChange={handleInputChange} placeholder="Complete physical address" />
          
          <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100">
            <label className="block text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider mb-3 sm:mb-4">Operational Capacity *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <TogglePill label="🚑 We operate an Ambulance" active={formData.hasAmbulance} onClick={() => handleCheckboxChange('hasAmbulance', !formData.hasAmbulance)} />
              <TogglePill label="🏡 We operate a Shelter" active={formData.hasShelter} onClick={() => handleCheckboxChange('hasShelter', !formData.hasShelter)} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100">
            <label className="block text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider mb-3 sm:mb-4">Animals Handled *</label>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
              {['Dogs & Cats', 'Large Animals', 'Wildlife & Birds'].map(type => (
                <TogglePill key={type} label={type} active={formData.animalTypes.includes(type)} onClick={() => handleAnimalType(type)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
            <p className="text-amber-800 text-xs sm:text-sm font-medium">Please upload clear, legible copies. Max file size: 5MB per document.</p>
          </div>
          <FileUpload label="Upload NGO Logo *" accept="image/*" onChange={(e:any) => handleFileChange(e, "logo")} fileName={formData.logo?.name} />
          <FileUpload label="Registration Certificate *" accept=".pdf,.jpg,.jpeg,.png" onChange={(e:any) => handleFileChange(e, "regCert")} fileName={formData.regCert?.name} />
          <FileUpload label="80G Tax Certificate (Optional)" accept=".pdf,.jpg,.jpeg,.png" onChange={(e:any) => handleFileChange(e, "eightyGCert")} fileName={formData.eightyGCert?.name} />
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 text-center py-8 sm:py-12">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-50"></div>
            <div className="relative w-full h-full bg-green-100 border-4 border-white shadow-xl rounded-full flex items-center justify-center text-4xl sm:text-5xl z-10">
              📍
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">GPS Locked & Ready</h3>
          <p className="text-slate-500 max-w-md mx-auto font-medium text-sm sm:text-lg px-2">We have securely mapped your coordinates. SOS alerts inside your radius will be routed to your dashboard.</p>
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