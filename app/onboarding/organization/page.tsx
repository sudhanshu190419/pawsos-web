"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { auth, db, storage } from "../../lib/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  GeoPoint,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Building2, 
  ShieldCheck, 
  MapPin, 
  ChevronRight, 
  Check, 
  X, 
  Ambulance, 
  Activity,
  Upload,
  ArrowRight,
  Zap,
  Lock,
  ChevronLeft,
  ArrowLeft,
  Handshake,
  CheckCircle2, 
  Phone, 
  Mail, 
  UserRound,
  FileText,
  Clock,
  XCircle
} from "lucide-react";

import { Toast, useToast } from "../../components/ui/Toast";
import { useRouter } from "next/navigation";
import { useLocation } from "../../lib/LocationContext";
import Link from "next/link";

import { useProfile } from "../../dashboard/hooks/useProfile";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface OrgFormData {
  orgName: string;
  type: "hospital" | "ngo" | "vet";
  contactPerson: string;
  email: string;
  phone: string;
  regNumber: string;
  bedCount: number;
  hasAmbulance: boolean;
  specialties: string[];
  city: string;
  address: string;
  logo: File | null;
  licenseFile: File | null;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ UI Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function OrganizationOnboardingPage() {
  const [showForm, setShowForm] = useState(false);
  const { toast, showToast, dismissToast } = useToast();
  const { userData, pendingOrg, loading } = useProfile();
  const router = useRouter();

  const openForm = useCallback(() => setShowForm(true), []);
  const closeForm = useCallback(() => setShowForm(false), []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-[3px] border-warm-line border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Approved State
  if (userData?.orgApproved) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-surface px-4 sm:px-6 py-10 relative overflow-hidden selection:bg-primary/10 selection:text-primary">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="bg-warm-surface rounded-[2.5rem] shadow-2xl border border-warm-line p-8 sm:p-12 w-full max-w-md text-center relative overflow-hidden group animate-scaleIn">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          <div className="w-24 h-24 bg-field-green/5 rounded-[2.2rem] flex items-center justify-center mx-auto mb-6 border-8 border-warm-surface shadow-md relative group-hover:scale-105 transition-transform duration-500">
            <ShieldCheck className="w-10 h-10 text-field-green" />
            <div className="absolute -bottom-1 -right-1 bg-field-green text-on-primary w-8 h-8 rounded-full border-2 border-warm-surface flex items-center justify-center text-sm font-black shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 text-on-surface tracking-tight leading-tight">Verified Partner</h1>
          <p className="text-on-surface-variant mb-10 font-medium leading-relaxed">
            Your organization is now part of the AnimalSathi mission network. Your command terminal is active and ready for coordination.
          </p>
          <Link href="/organization/dashboard" className="flex items-center justify-center gap-2 w-full bg-on-surface text-on-primary py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-primary transition-all shadow-lg hover:-translate-y-1 group">
            Enter Dashboard <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>
    );
  }

  // Pending State
  if (pendingOrg?.status === "pending_review") {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-surface px-4 sm:px-6 py-10 relative overflow-hidden">
        <div className="bg-warm-surface rounded-[2.5rem] shadow-2xl border border-warm-line p-8 sm:p-12 w-full max-w-md text-center animate-scaleIn">
          <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 text-on-surface tracking-tight">Review in Progress</h1>
          <p className="text-on-surface-variant mb-10 font-medium leading-relaxed">
            Our network command is currently verifying your organizational registry and license documents. This typically takes 24â€“48 hours.
          </p>
          <Link href="/" className="inline-block bg-on-surface text-on-primary px-8 py-4 rounded-xl font-bold text-sm hover:bg-primary transition-all shadow-lg">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  // Rejected State
  if (pendingOrg?.status === "rejected") {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-surface px-4 sm:px-6 py-10 relative overflow-hidden">
        <div className="bg-warm-surface rounded-[2.5rem] shadow-2xl border border-warm-line p-8 sm:p-12 w-full max-w-md text-center animate-scaleIn">
          <div className="w-20 h-20 bg-rescue-red/5 border border-rescue-red/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <XCircle className="w-10 h-10 text-rescue-red" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-on-surface tracking-tight">Application Rejected</h2>
          <p className="text-on-surface-variant mb-10 font-medium leading-relaxed">
            Unfortunately, your organizational registry was not approved. This could be due to incomplete documentation or verification failure.
          </p>
          <button
            onClick={() => router.refresh()}
            className="w-full shimmer-btn bg-primary text-on-primary py-4 rounded-2xl font-bold hover:bg-primary-container transition-all shadow-lg hover:-translate-y-1"
          >
            Refresh Status
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface overflow-hidden selection:bg-primary/10 selection:text-primary">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      <HeroSection onApply={openForm} />
      
      {showForm && typeof document !== "undefined" &&
        createPortal(<RegistrationModal onClose={closeForm} showToast={showToast} />, document.body)}
      
      <Toast toast={toast} onDismiss={dismissToast} />
    </main>
  );
}

function HeroSection({ onApply }: { onApply: () => void }) {
  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2.5 bg-warm-surface border border-warm-line rounded-full px-4 py-2 text-xs font-semibold text-on-surface-variant shadow-sm tracking-wide mb-8 animate-fadeUp">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Organization Partner Portal Â· India
      </div>

      <h1 className="text-[2.4rem] sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-on-surface mb-8 animate-fadeUp delay-100 font-display italic">
        Scale your impact.<br />
        <span className="text-primary">Empower the rescue.</span>
      </h1>

      <p className="max-w-2xl text-base sm:text-lg text-on-surface-variant font-medium leading-relaxed mb-12 animate-fadeUp delay-200">
        Onboard your hospital or NGO to the AnimalSathi mission network. 
        Synchronize ambulances, manage facility capacity, and lead local rescue operations with verified coordination.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 animate-fadeUp delay-300">
        <button
          onClick={onApply}
          className="w-full sm:w-auto shimmer-btn bg-primary text-on-primary px-10 py-5 rounded-2xl font-bold text-base shadow-xl shadow-primary/25 hover:bg-primary-container hover:-translate-y-1 transition-all active:scale-95 group"
        >
          Begin Verification
          <ChevronRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <Link
          href="/how-it-works"
          className="w-full sm:w-auto px-10 py-5 bg-warm-surface border border-warm-line text-on-surface font-bold rounded-2xl text-base hover:bg-warm-raised transition-all text-center shadow-sm"
        >
          How it works
        </Link>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-fadeUp delay-400">
        <CapabilityCard icon={Zap} title="Live Feed" desc="Structured emergency alerts with GPS coordinates and priority scoring." />
        <CapabilityCard icon={Activity} title="Capacity Management" desc="Route rescues based on your real-time bed and medical availability." />
        <CapabilityCard icon={ShieldCheck} title="Verified Network" desc="Securely manage documentation and compliance in one centralized hub." />
      </div>
    </section>
  );
}

function CapabilityCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="group relative bg-warm-surface rounded-2xl p-8 border border-warm-line shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute top-0 left-8 h-0.5 w-12 bg-primary rounded-full" />
      <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-on-surface mb-3 tracking-tight">{title}</h3>
      <p className="text-on-surface-variant text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function RegistrationModal({ onClose, showToast }: { onClose: () => void; showToast: any }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-on-surface/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl h-full max-h-[850px] bg-warm-surface rounded-[2rem] sm:rounded-[3rem] border border-warm-line shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-warm-line flex items-center justify-between shrink-0 bg-warm-raised/30">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
              <Building2 className="w-6 h-6 text-primary" /> Partner Registry
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-field-green" /> Secure Onboarding
            </p>
          </div>
          <button onClick={onClose} className="p-3 rounded-full bg-surface border border-warm-line hover:bg-warm-raised transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 sm:p-12">
          <RegistrationForm onClose={onClose} showToast={showToast} />
        </div>
      </div>
    </div>
  );
}

const STEPS = ["Identity", "Resources", "Logistics", "Review"];

function RegistrationForm({ onClose, showToast }: { onClose: () => void; showToast: any }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { location } = useLocation();
  const router = useRouter();

  const [formData, setFormData] = useState<OrgFormData>({
    orgName: "",
    type: "hospital",
    contactPerson: "",
    email: "",
    phone: "",
    regNumber: "",
    bedCount: 5,
    hasAmbulance: false,
    specialties: [],
    city: "",
    address: "",
    logo: null,
    licenseFile: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!user) {
      showToast("Please sign in first", "error");
      return;
    }
    setLoading(true);
    try {
      // 1. Upload Files
      let logoUrl = "";
      let licenseUrl = "";
      
      if (formData.logo) {
        const logoRef = ref(storage, `orgs/logos/${user.uid}_${Date.now()}`);
        await uploadBytes(logoRef, formData.logo);
        logoUrl = await getDownloadURL(logoRef);
      }
      
      if (formData.licenseFile) {
        const licRef = ref(storage, `orgs/licenses/${user.uid}_${Date.now()}`);
        await uploadBytes(licRef, formData.licenseFile);
        licenseUrl = await getDownloadURL(licRef);
      }

      // 2. Create Application
      await setDoc(doc(db, "pending_organizations", user.uid), {
        ...formData,
        logo: logoUrl,
        licenseFile: licenseUrl,
        ownerId: user.uid,
        status: "pending_review",
        location: location ? new GeoPoint(location.latitude, location.longitude) : null,
        createdAt: serverTimestamp(),
      });

      showToast("Application submitted successfully!", "success");
      onClose();
      router.push("/dashboard");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-16 relative">
        <div className="absolute top-1/2 left-0 w-full h-px bg-warm-line -z-10" />
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-col items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black border-2 transition-all ${step > i + 1 ? 'bg-field-green border-field-green text-white shadow-sm' : step === i + 1 ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-surface border-warm-line text-on-surface-variant'}`}>
              {step > i + 1 ? <Check className="w-5 h-5" /> : i + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${step === i + 1 ? 'text-primary' : 'text-on-surface-variant'}`}>{s}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-fadeUp">
          <div className="grid grid-cols-1 gap-6">
            <InputField icon={Building2} label="Organization Name" value={formData.orgName} onChange={v => setFormData({...formData, orgName: v})} placeholder="e.g. City Life Animal Hospital" />
            
            <div className="relative group">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-1">Entity Type</label>
              <div className="grid grid-cols-3 gap-3">
                {["hospital", "ngo", "vet"].map(t => (
                  <button 
                    key={t}
                    onClick={() => setFormData({...formData, type: t as any})}
                    className={`py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${formData.type === t ? 'bg-primary/5 border-primary text-primary' : 'bg-surface border-warm-line text-on-surface-variant hover:border-on-surface-variant/30'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <InputField icon={UserRound} label="Primary Admin / Manager" value={formData.contactPerson} onChange={v => setFormData({...formData, contactPerson: v})} placeholder="Full name of authority" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField icon={Mail} label="Official Email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="admin@org.org" />
              <InputField icon={Phone} label="Contact Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+91" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-10 animate-fadeUp">
          <div className="p-10 rounded-[2.5rem] border-2 border-warm-line bg-surface shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Capacity HUD</label>
              <span className="text-4xl font-black text-primary font-mono">{formData.bedCount} <span className="text-[10px] uppercase ml-1 tracking-widest">Units</span></span>
            </div>
            <input 
              type="range" min="1" max="100" 
              value={formData.bedCount} 
              onChange={e => setFormData({...formData, bedCount: parseInt(e.target.value)})}
              className="w-full h-2 bg-warm-line rounded-full appearance-none cursor-pointer accent-primary"
            />
            <p className="mt-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-relaxed">Adjust your facility&apos;s active bed/shelter capacity for incoming rescues.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button 
              onClick={() => setFormData({...formData, hasAmbulance: !formData.hasAmbulance})}
              className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-4 ${formData.hasAmbulance ? 'bg-primary/5 border-primary text-primary' : 'bg-surface border-warm-line text-on-surface-variant'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${formData.hasAmbulance ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' : 'bg-warm-surface border-warm-line'}`}>
                <Ambulance className="w-7 h-7" />
              </div>
              <span className="font-black text-xs uppercase tracking-widest">Ambulance Unit</span>
            </button>
            <div className="p-10 rounded-[2.5rem] border-2 border-warm-line bg-surface flex flex-col items-center text-center gap-4 opacity-50 grayscale cursor-not-allowed">
              <div className="w-14 h-14 rounded-2xl bg-warm-surface border-2 border-warm-line flex items-center justify-center">
                <Activity className="w-7 h-7 text-on-surface-variant" />
              </div>
              <span className="font-black text-xs uppercase tracking-widest">ICU Support</span>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-fadeUp">
          <div className="grid grid-cols-1 gap-6">
            <InputField icon={MapPin} label="Physical Address" value={formData.address} onChange={v => setFormData({...formData, address: v})} placeholder="Plot no, building, street" />
            <InputField icon={MapPin} label="City" value={formData.city} onChange={v => setFormData({...formData, city: v})} placeholder="e.g. New Delhi" />
            
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-1">Registration Document (PDF/JPG)</label>
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-warm-line rounded-[2rem] cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group bg-surface">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all mb-4 ${formData.licenseFile ? 'bg-field-green/10 text-field-green border-field-green' : 'bg-warm-surface border-warm-line text-on-surface-variant group-hover:text-primary'}`}>
                    {formData.licenseFile ? <CheckCircle2 className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <p className={`font-bold text-sm ${formData.licenseFile ? "text-field-green" : "text-on-surface group-hover:text-primary"}`}>
                    {formData.licenseFile ? formData.licenseFile.name : "Select License File"}
                  </p>
                  {!formData.licenseFile && <p className="text-xs text-on-surface-variant mt-1.5 font-medium italic tracking-tight">Required for organization verification</p>}
                </div>
                <input type="file" className="hidden" onChange={e => setFormData({...formData, licenseFile: e.target.files?.[0] || null})} />
              </label>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-8 animate-fadeUp">
          <div className="p-10 rounded-[2.5rem] border-2 border-primary/20 bg-primary/5 text-center shadow-sm">
            <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
            <h3 className="text-2xl font-black text-on-surface mb-3 tracking-tight">Operational Review</h3>
            <p className="text-on-surface-variant text-sm font-medium leading-relaxed max-w-sm mx-auto">Please confirm your organizational capabilities before transmitting your registry to our command network.</p>
          </div>
          
          <div className="bg-surface rounded-[2rem] border-2 border-warm-line p-8 space-y-5">
            <SummaryItem label="Partner" value={formData.orgName} />
            <SummaryItem label="Category" value={formData.type.toUpperCase()} isPrimary />
            <SummaryItem label="Logistics" value={`${formData.bedCount} Bed Units ${formData.hasAmbulance ? "Â· 1 Ambulance" : ""}`} />
            <SummaryItem label="Location" value={`${formData.city}, India`} />
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex gap-4 mt-16 pt-12 border-t border-warm-line">
        {step > 1 && (
          <button 
            onClick={handleBack} 
            className="flex-1 py-5 rounded-2xl border-2 border-warm-line bg-surface text-on-surface font-bold text-sm uppercase tracking-widest hover:bg-warm-raised transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
        )}
        <button 
          onClick={step === 4 ? handleSubmit : handleNext} 
          disabled={loading}
          className={`flex-[2] py-5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${
            loading ? "bg-warm-raised text-on-surface-variant/50 cursor-wait" : "shimmer-btn bg-primary text-on-primary hover:bg-primary-container hover:shadow-primary/30"
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Transmitting...</span>
            </>
          ) : (
            <>
              <span>{step === 4 ? "Submit Registry" : "Next Phase"}</span>
              {step < 4 && <ChevronRight className="w-5 h-5" />}
            </>
          )} 
        </button>
      </div>
    </div>
  );
}

function InputField({ icon: Icon, label, value, onChange, placeholder }: { icon: any, label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div className="relative group">
      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface border-2 border-warm-line rounded-2xl px-6 py-4 text-sm sm:text-base font-bold text-on-surface placeholder:text-on-surface-variant/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
      />
    </div>
  );
}

function SummaryItem({ label, value, isPrimary = false }: { label: string, value: string, isPrimary?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
      <span className="text-on-surface-variant">{label}</span>
      <span className={isPrimary ? "text-primary" : "text-on-surface"}>{value}</span>
    </div>
  );
}
