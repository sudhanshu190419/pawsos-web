"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { auth, db, storage } from "../lib/firebase";
import {
  AlertCircle, Users, BarChart2, Briefcase, Smartphone, GraduationCap
} from "lucide-react";
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  GeoPoint,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";

/* ─────────────────────────── Types ─────────────────────────── */

interface VetFormData {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  clinicAddress: string;
  serviceArea: string;
  availability: string[];
  willingToTravel: boolean;
  profilePhoto: File | null;
  document: File | null;
  clinicName: string;
state: string;
pincode: string;
}

interface ExistingApplication {
  verificationStatus: "pending_review" | "approved" | "rejected";
  fullName: string;
  email: string;
  rejectionReason?: string;
}

interface Coords {
  latitude: number;
  longitude: number;
}

/* ─────────────────────── Geohash utility ─────────────────────── */

function encodeGeohash(lat: number, lon: number, precision = 6): string {
  const CHARS = "0123456789bcdefghjkmnpqrstuvwxyz";
  let idx = 0, bit = 0, evenBit = true, geohash = "";
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180;
  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) { idx = (idx << 1) + 1; lonMin = mid; } else { idx <<= 1; lonMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { idx = (idx << 1) + 1; latMin = mid; } else { idx <<= 1; latMax = mid; }
    }
    evenBit = !evenBit;
    if (bit < 4) bit++;
    else { geohash += CHARS[idx]; bit = 0; idx = 0; }
  }
  return geohash;
}


/* ══════════════════════════════════════════════════════════════

   CONSTANTS
══════════════════════════════════════════════════════════════ */

const INITIAL_FORM: VetFormData = {
  fullName: "", email: "", phone: "", city: "",
  clinicAddress: "", serviceArea: "",
  availability: [], willingToTravel: false,
  profilePhoto: null, document: null,
  clinicName: "",
state: "",
pincode: "",
};

const BENEFITS: { icon: React.ElementType; tag: string; title: string; desc: string }[] = [
  {
    icon: AlertCircle,
    tag: "Emergency",
    title: "Save Critical Lives",
    desc: "Receive geo-targeted SOS alerts for animals in your area. Provide on-site care or remote triage instantly.",
  },
  {
    icon: Users,
    tag: "Ecosystem",
    title: "Unified Coordination",
    desc: "Work seamlessly with verified NGOs, first-responders, and rescue volunteers in one structured platform.",
  },
  {
    icon: BarChart2,
    tag: "Insights",
    title: "Transparent Impact",
    desc: "Track every consultation and rescue with verified outcome data — perfect for professional portfolios.",
  },
  {
    icon: Briefcase,
    tag: "Network",
    title: "Peer Community",
    desc: "Join India's fastest-growing veterinary professional network focused on animal welfare.",
  },
  {
    icon: Smartphone,
    tag: "Telemedicine",
    title: "Remote Consultations",
    desc: "Extend your reach beyond your clinic. Guide rescuers in real-time from anywhere in India.",
  },
  {
    icon: GraduationCap,
    tag: "Learning",
    title: "CME Resources",
    desc: "Access curated wildlife, emergency care, and disaster response training materials.",
  },
];

const REQUIREMENTS = [
  "Licensed veterinarian — BVSc or equivalent qualification",
  "Valid practice license (RCVS, PCI, or national equivalent)",
  "Emergency or wildlife rescue experience (preferred)",
  "Commitment to pro-bono triage for critical cases",
  "Willingness to mentor and guide rescue volunteers",
  "Reliable internet access for remote consultations",
];

const VERIFICATION_STEPS = [
  { n: "01", title: "Apply Online", desc: "Submit your credentials and experience via our encrypted partner form." },
  { n: "02", title: "License Check", desc: "We validate your registration through official veterinary boards and government registries." },
  { n: "03", title: "Profile Approval", desc: "You receive a verified badge and full access to the emergency coordination dashboard." },
  { n: "04", title: "Onboarding", desc: "Platform training on emergency protocols, SOS routing, and volunteer coordination tools." },
];

const AVAILABILITY_OPTIONS = ["Weekdays", "Weekends", "24/7 Emergency"];
const TOTAL_STEPS = 4;
const STEP_LABELS = ["Basic Info", "Photo", "Documents", "Availability"];
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];
const INDIAN_STATES_SET = new Set(INDIAN_STATES);

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */

export default function VetsPage() {
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
  setMounted(true);

  const params = new URLSearchParams(window.location.search);

  if (params.get("openForm") === "true") {
    setShowForm(true);
  }
}, []);

  const openForm = useCallback(() => setShowForm(true), []);
  const closeForm = useCallback(() => setShowForm(false), []);

  return (
    <>
      {/* Animation keyframes only */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .animate-fadeUp  { animation: fadeUp  0.65s cubic-bezier(.22,.68,0,1.2) both; }
        .animate-scaleIn { animation: scaleIn 0.4s  cubic-bezier(.22,.68,0,1.2) both; }
        .animate-float   { animation: float   4s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.10s; }
        .delay-200 { animation-delay: 0.20s; }
        .delay-300 { animation-delay: 0.30s; }
        .delay-400 { animation-delay: 0.40s; }
        .shimmer-btn {
          background: linear-gradient(90deg, #ea580c 0%, #f97316 40%, #fb923c 50%, #f97316 60%, #ea580c 100%);
          background-size: 200%;
          animation: shimmer 2.8s infinite linear;
        }
        .glass {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .input-field:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(234,88,12,0.15);
          border-color: #ea580c;
        }
        .card-hover {
          transition: transform 0.3s cubic-bezier(.22,.68,0,1.2), box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.10);
        }
      `}</style>


      <main className="min-h-screen bg-[#FAFAF8] text-slate-900 overflow-hidden selection:bg-orange-100 selection:text-orange-900">
        <HeroSection onApply={openForm} />
        <BenefitsSection />
        <RequirementsSection />
        <BottomCTA onApply={openForm} />
      </main>

      {mounted && showForm && typeof document !== "undefined" &&
        createPortal(<RegistrationModal onClose={closeForm} />, document.body)}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════ */

function HeroSection({ onApply }: { onApply: () => void }) {
  return (
    <section className="relative pt-12 pb-20 md:pt-8 md:pb-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-orange-100/50 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-50/80 rounded-full blur-[120px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="vdots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#64748b" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#vdots)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        {/* Eyebrow */}
        <div className="flex justify-center lg:justify-start mb-3 md:mb-4 animate-fadeUp">
          <span className="inline-flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm tracking-wide">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Verified Veterinarian Portal · India
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_520px] gap-14 lg:gap-16 items-center">

         {/* Left: Copy */}
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            <h1 className="sora text-[2.4rem] sm:text-5xl md:text-6xl lg:text-[4rem] font-bold leading-[1.15] tracking-tight text-slate-800 mb-6 animate-fadeUp delay-100">
              Your expertise.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 font-extrabold drop-shadow-sm">
                Their second chance.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-[1.7] max-w-xl mx-auto lg:mx-0 mb-9 animate-fadeUp delay-200">
              Join India's first structured emergency veterinary network. Receive geo-targeted SOS alerts, coordinate with NGOs, and provide life-saving care remotely or on-site.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 animate-fadeUp delay-300">
              <button
                onClick={onApply}
                className="shimmer-btn w-full sm:w-auto text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                Register as Veterinarian
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <a
                href="#requirements"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 text-center shadow-sm"
              >
                View Requirements
              </a>
            </div>

            <p className="mt-5 text-sm text-slate-400 font-medium animate-fadeUp delay-400">
              <span className="text-emerald-500 mr-1.5">✓</span>
              100% free · Verified within 48 hours
            </p>
          </div>

          {/* Right: Stacked card visual */}
          <div className="hidden lg:block relative animate-fadeUp delay-200">
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/15 border border-white/60 aspect-[4/5]">
              <img
  src="/vet-hero.jpg"
  alt="Veterinarian treating a dog"
  className="absolute inset-0 w-full h-full object-cover"
/>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent" />

              
            </div>

            {/* Floating stat chips */}
            <div className="absolute -top-4 -left-4 glass rounded-xl px-4 py-3 border border-white/50 shadow-lg animate-float">
              <p className="text-xs font-bold text-slate-900">🏥 340 Vets</p>
              <p className="text-[10px] text-slate-500">Across 22 states</p>
            </div>
            

            <div className="absolute -bottom-6 -right-6 w-44 h-44 bg-orange-200/40 rounded-full blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}



/* ── Benefits Section ── */

function BenefitsSection() {
  return (
    <section className="py-20 md:py-28 max-w-6xl mx-auto px-5 sm:px-8">
      <div className="text-center mb-14">
        <p className="text-sm font-semibold text-orange-600 tracking-widest uppercase mb-3">Why Join</p>
        <h2 className="sora text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight max-w-2xl mx-auto leading-tight">
          Built for veterinarians who care deeply
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {BENEFITS.map(({ icon: Icon, tag, title, desc }) => (
          <div
            key={title}
            className="card-hover group relative bg-white rounded-2xl p-7 border border-slate-100 shadow-sm"
          >
            <div className="absolute top-0 left-7 h-0.5 w-10 bg-orange-500 rounded-full" />
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                <Icon className="w-5 h-5 text-orange-600" />
              </div>
              <span className="mt-3 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                {tag}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2.5">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Requirements + Verification Section ── */

function RequirementsSection() {
  return (
    <section id="requirements" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-orange-600 tracking-widest uppercase mb-3">Eligibility</p>
          <h2 className="sora text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight">
            What we look for
          </h2>
        </div>

        {/* Two-column: Requirements + Process */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Requirements */}
          <div>
            <h3 className="sora text-xl font-bold text-slate-900 mb-6">Eligibility Requirements</h3>
            <ul className="space-y-3">
              {REQUIREMENTS.map((text) => (
                <li
                  key={text}
                  className="flex items-start gap-3.5 bg-[#FAFAF8] border border-slate-100 rounded-xl p-4 hover:border-orange-200 transition-colors duration-200"
                >
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span className="text-slate-700 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Verification Process */}
          <div className="bg-[#FAFAF8] border border-slate-100 rounded-2xl p-7 sm:p-9">
            <h3 className="sora text-xl font-bold text-slate-900 mb-7">Verification Process</h3>
            <div className="space-y-6">
              {VERIFICATION_STEPS.map(({ n, title, desc }, i) => (
                <div key={n} className="flex gap-4 group">
                  {/* Step number + vertical connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-700 flex items-center justify-center sora font-extrabold text-sm shrink-0 group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:text-white transition-all duration-300">
                      {n}
                    </div>
                    {i < VERIFICATION_STEPS.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 mt-2 mb-0 min-h-[20px]" />
                    )}
                  </div>
                  <div className="pb-2">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Bottom CTA ── */

function BottomCTA({ onApply }: { onApply: () => void }) {
  return (
    <section className="py-16 md:py-24 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-slate-950 rounded-3xl px-8 sm:px-14 md:px-20 py-14 md:py-20 text-center overflow-hidden">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-orange-400 text-sm font-semibold tracking-widest uppercase mb-4">Ready to Join?</p>
            <h2 className="sora text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
              Hundreds of lives are waiting<br className="hidden sm:block" /> for your expertise.
            </h2>
            <p className="text-slate-400 text-lg font-light max-w-xl mx-auto mb-10 leading-relaxed">
              Join India's growing network of verified veterinarians saving animal lives through coordinated emergency response.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={onApply}
                className="shimmer-btn text-white px-9 py-4 rounded-xl font-semibold text-base shadow-xl shadow-orange-600/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Apply Now — It's Free
              </button>
              <Link
                href="/"
                className="bg-white/5 border border-white/10 text-white/80 px-9 py-4 rounded-xl font-semibold text-base hover:bg-white/10 transition-all duration-200 text-center"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════════════ */

function RegistrationModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center dm-sans">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-[2rem] sm:rounded-2xl shadow-2xl max-h-[96vh] sm:max-h-[88vh] flex flex-col animate-scaleIn z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="sora text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              Veterinarian Application
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              256-bit encrypted · Secure submission
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8">
          <VetRegistrationForm onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM
══════════════════════════════════════════════════════════════ */

function VetRegistrationForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<Coords | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<VetFormData>(INITIAL_FORM);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof VetFormData, string>>>({});
  const [isReapplying, setIsReapplying] = useState(false);

  /* ── Setup ── */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "vets_web", u.uid));
          if (snap.exists()) {
            setHasApplied(true);
            const data = snap.data() as ExistingApplication;
            setExistingApp({
              verificationStatus: data.verificationStatus,
              fullName: data.fullName,
              email: data.email,
              rejectionReason: data.rejectionReason,
            });
          } else {
            setForm((prev) => ({ ...prev, email: u.email ?? "" }));
          }
        } catch (err) {
          console.error("Vet status check failed:", err);
        }
      }
      setIsLoading(false);
    });

    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      (err) => console.warn("Geolocation denied:", err)
    );

    return unsub;
  }, []);

  /* ── Handlers ── */

  const handleReapply = async () => {
    if (!user) return;
    setIsReapplying(true);
    try {
      await deleteDoc(doc(db, "vets_web", user.uid));
      setHasApplied(false);
      setExistingApp(null);
      setForm({ ...INITIAL_FORM, email: user.email ?? "" });
      setStep(1);
      setErrors({});
      setTimeout(() => {
        alert("Application cleared. You can now submit a new application.");
      }, 100);
    } catch (error) {
      console.error("Error clearing rejected application:", error);
      alert("Failed to clear application. Please try again.");
    } finally {
      setIsReapplying(false);
    }
  };

  /* ── Typed setters ── */

  const set = useCallback(
    <K extends keyof VetFormData>(key: K, value: VetFormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleInput = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {

    const name = e.target.name;

    let value = e.target.value;

    // Phone: allow only 10 digits
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    // Pincode: allow only 6 digits
    if (name === "pincode") {
      value = value.replace(/\D/g, "").slice(0, 6);
    }

    set(name as keyof VetFormData, value as never);
  },
  [set]
);

  const handleFile = useCallback(
    (key: "profilePhoto" | "document") =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        set(key, (e.target.files?.[0] ?? null) as never),
    [set]
  );

  const toggleAvailability = useCallback(
    (opt: string) =>
      setForm((prev) => ({
        ...prev,
        availability: prev.availability.includes(opt)
          ? prev.availability.filter((o) => o !== opt)
          : [...prev.availability, opt],
      })),
    []
  );

  /* ── Validation ── */

  const validate = (s: number): boolean => {
    const errs: typeof errors = {};
    if (s === 1) {
      if (!/^\d{10}$/.test(form.phone.trim())) {
  errs.phone = "Enter valid 10-digit phone number";
}
      if (
  form.clinicAddress.trim().length < 15 ||
  !/\d/.test(form.clinicAddress)
) {
  errs.clinicAddress =
    "Enter full address with house/flat/shop number";
}
      if (!form.fullName.trim()) errs.fullName = "Required";
      if (!form.email.trim()) errs.email = "Required";
      if (!form.phone.trim()) errs.phone = "Required";
      
      if (!form.city.trim()) errs.city = "Required";
      if (!form.clinicAddress.trim()) errs.clinicAddress = "Required";
      if (!form.clinicName.trim()) errs.clinicName = "Required";
if (!form.state.trim()) {
  errs.state = "Required";
} else if (!INDIAN_STATES_SET.has(form.state.trim())) {
  errs.state = "Select a valid state";
}
if (!form.pincode.trim()) errs.pincode = "Required";
if (!/^\d{6}$/.test(form.pincode.trim())) {
  errs.pincode = "Enter valid 6-digit pincode";
}
    }
    if (s === 2 && !form.profilePhoto) errs.profilePhoto = "Profile photo is required";
    if (s === 3 && !form.document) errs.document = "License / degree certificate is required";
    if (s === 4) {
      if (!form.serviceArea.trim()) errs.serviceArea = "Required";
      if (form.availability.length === 0) errs.availability = "Select at least one option";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => validate(step) && setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(4)) return;
    if (!user) { alert("Please sign in to apply."); return; }
    if (!location) { alert("Location access is required. Please enable it and retry."); return; }

    const uploadFile = async (file: File, path: string) => {
      const r = ref(storage, path);
      await uploadBytes(r, file);
      return getDownloadURL(r);
    };

    try {
      setSubmitStatus("Uploading documents…");
      const ts = Date.now();
      const [profilePhotoURL, documentURL] = await Promise.all([
        form.profilePhoto ? uploadFile(form.profilePhoto, `vets/profilePhotos/${user.uid}_${ts}`) : Promise.resolve(""),
        form.document ? uploadFile(form.document, `vets/documents/${user.uid}_${ts}`) : Promise.resolve(""),
      ]);

      setSubmitStatus("Saving your profile…");
      await setDoc(doc(db, "vets_web", user.uid), {
        uid: user.uid,
        fullName: form.fullName,
        clinicName: form.clinicName,
        email: form.email,
        phone: form.phone,
        city: form.city,
        state: form.state,
  pincode: form.pincode,
        clinicAddress: form.clinicAddress,
        serviceArea: form.serviceArea,
        availability: form.availability,
        willingToTravel: form.willingToTravel,
        profilePhotoURL,
        documentURL,
        location: new GeoPoint(location.latitude, location.longitude),
        geohash: encodeGeohash(location.latitude, location.longitude),
        latitude: location.latitude,
        longitude: location.longitude,
        status: "pending",
        verificationStatus: "pending_review",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setSubmitStatus("Done!");
      setTimeout(() => {
        setHasApplied(true);
        setExistingApp({ verificationStatus: "pending_review", fullName: form.fullName, email: form.email });
        setSubmitStatus(null);
      }, 800);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed. Please check your connection and try again.");
      setSubmitStatus(null);
    }
  };

  /* ── States ── */

  if (isLoading) return (
    <div className="py-16 flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-[3px] border-slate-100 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Verifying your session…</p>
    </div>
  );

  if (!user) return (
    <div className="py-10 text-center">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-4xl mx-auto mb-6">🔐</div>
      <h3 className="sora text-2xl font-extrabold text-slate-950 mb-3">Sign in Required</h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
        You need to be signed in to submit your veterinarian application.
      </p>
      <Link
       href={`/auth?redirect=${encodeURIComponent("/vets?openForm=true")}`} 
       className="inline-block bg-slate-950 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors shadow-lg">
        Sign In / Create Account
      </Link>
    </div>
  );

  if (hasApplied && existingApp) {
    const cfg = {
      pending_review: { emoji: "⏳", title: "Application Under Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-100", msg: "Our medical review board is verifying your credentials. This typically takes 24–48 hours." },
      approved: { emoji: "✅", title: "Application Approved!", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", msg: "Your profile is verified. Access your Veterinarian Dashboard to start coordinating cases." },
      rejected: { emoji: "❌", title: "Application Rejected", color: "text-red-700", bg: "bg-red-50 border-red-100", msg: "We couldn't verify your documents at this time. Review the feedback below and reapply with updated information." },
    }[existingApp.verificationStatus];

    return (        <div className={`rounded-2xl border p-8 text-center ${cfg.bg}`}>
        <div className="text-5xl mb-4">{cfg.emoji}</div>
        <h3 className={`sora text-2xl font-extrabold mb-2 ${cfg.color}`}>{cfg.title}</h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6 leading-relaxed">{cfg.msg}</p>

        {/* Rejection reason */}
        {existingApp.verificationStatus === "rejected" && existingApp.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-6 max-w-sm mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1.5">Feedback from reviewers:</p>
            <p className="text-sm text-slate-700">{existingApp.rejectionReason}</p>
          </div>
        )}

        <div className="bg-white/70 rounded-xl p-4 text-left space-y-2 border border-white/60 max-w-xs mx-auto mb-8">
          <Detail label="Name" value={existingApp.fullName} />
          <Detail label="Email" value={existingApp.email} />
        </div>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          {existingApp.verificationStatus === "rejected" && (
            <button
              onClick={handleReapply}
              disabled={isReapplying}
              className="w-full shimmer-btn text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isReapplying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Clearing…
                </>
              ) : (
                "Reapply"
              )}
            </button>
          )}
          <button onClick={onClose} className="bg-slate-950 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  /* ── Multi-step form ── */

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                  i + 1 < step ? "bg-emerald-500 text-white" :
                  i + 1 === step ? "bg-orange-500 text-white" :
                  "bg-slate-100 text-slate-400"
                }`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`w-4 sm:w-6 h-px ${i + 1 < step ? "bg-emerald-300" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full shrink-0 ml-2">
            {STEP_LABELS[step - 1]}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Step 1: Basic Info ── */}
      {step === 1 && (
        <div className="space-y-4 sm:space-y-5">
          <FormField label="Full Name *" name="fullName" value={form.fullName} onChange={handleInput} placeholder="Dr. Priya Sharma" error={errors.fullName} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email Address *" name="email" type="email" value={form.email} onChange={handleInput} readOnly={!!user?.email} error={errors.email} />
            <FormField label="Phone Number *" name="phone" value={form.phone} onChange={handleInput} placeholder="+91 98765 43210" error={errors.phone} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormField
    label="Clinic Name *"
    name="clinicName"
    value={form.clinicName}
    onChange={handleInput}
    placeholder="Happy Pets Clinic"
    error={errors.clinicName}
  />

  <FormField
    label="City *"
    name="city"
    value={form.city}
    onChange={handleInput}
    placeholder="New Delhi"
  />
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <StateSelect
    label="State *"
    value={form.state}
    onChange={(value) => set("state", value)}
    placeholder="Select State"
    error={errors.state}
  />

  <FormField
    label="Pincode *"
    name="pincode"
     type="text"
     inputMode="numeric"
     pattern="[0-9]*"
    value={form.pincode}
    onChange={handleInput}
    placeholder="110001"
  />
</div>

<FormField
  label="Clinic Address *"
  
  name="clinicAddress"
  value={form.clinicAddress}
  onChange={handleInput}
  placeholder="Full clinic address"
  error={errors.clinicAddress}
/>
<p className="mt-1 text-xs text-slate-400">
  Example: C-319 Street No 11, Ganga Vihar, Delhi
</p>
        </div>
      )}

      {/* ── Step 2: Profile Photo ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-blue-400 text-lg shrink-0 mt-0.5">ℹ</span>
            <p className="text-blue-800 text-xs sm:text-sm font-medium leading-relaxed">
              This photo will appear to users requesting emergency consultations. Use a clear, professional headshot.
            </p>
          </div>
          <FileDropzone
            label="Profile Photo *"
            accept="image/*"
            onChange={handleFile("profilePhoto")}
            file={form.profilePhoto}
            error={errors.profilePhoto}
            hint="JPG, PNG · Max 5 MB"
          />
        </div>
      )}

      {/* ── Step 3: Documents ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠</span>
            <p className="text-amber-800 text-xs sm:text-sm font-medium leading-relaxed">
              Upload a clear scan of your Veterinary License or Degree Certificate. This is mandatory for verification.
            </p>
          </div>
          <FileDropzone
            label="Veterinary License / Degree *"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFile("document")}
            file={form.document}
            error={errors.document}
            hint="PDF, JPG, PNG · Max 5 MB"
          />
        </div>
      )}

      {/* ── Step 4: Availability ── */}
      {step === 4 && (
        <div className="space-y-5">
          {/* Location status */}
          <div className={`rounded-xl p-4 flex items-center gap-3 border ${location
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${location
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
            }`}>
              {location ? "✓" : "⚠"}
            </div>
            <div>
              <p className={`text-sm font-bold ${location ? "text-emerald-800" : "text-amber-800"}`}>
                {location ? "Location Confirmed" : "Location Required"}
              </p>
              <p className={`text-xs font-medium ${location ? "text-emerald-600" : "text-amber-600"}`}>
                {location ? "GPS coordinates locked securely." : "Please allow location access in your browser."}
              </p>
            </div>
          </div>

          <FormField
            label="Service Area (City / District) *"
            name="serviceArea"
            value={form.serviceArea}
            onChange={handleInput}
            placeholder="e.g. South Delhi, Gurgaon"
            error={errors.serviceArea}
          />

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Availability *
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <ToggleChip
                  key={opt}
                  label={opt}
                  active={form.availability.includes(opt)}
                  onClick={() => toggleAvailability(opt)}
                />
              ))}
            </div>
            {errors.availability && (
              <p className="mt-1.5 text-xs text-red-500">{errors.availability}</p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Field Work
            </p>
            <ToggleCard
              emoji={form.willingToTravel ? "🚗" : "🏥"}
              label={form.willingToTravel ? "Yes, I can travel for emergencies" : "No — clinic or remote only"}
              active={form.willingToTravel}
              onClick={() => set("willingToTravel", !form.willingToTravel)}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
        {step > 1 && !submitStatus && (
          <button type="button" onClick={back} className="px-5 py-3 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Back
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button type="button" onClick={next} className="flex-1 bg-slate-950 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors duration-200 shadow-sm">
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={!!submitStatus || !location}
            className="flex-1 shimmer-btn text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitStatus ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {submitStatus}
              </>
            ) : "Submit Application"}
          </button>
        )}
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
pattern?: string;
}

interface StateSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

function StateSelect({ label, value, onChange, placeholder = "Select State", error }: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filtered = INDIAN_STATES.filter((state) =>
    state.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const selectedIndex = INDIAN_STATES.findIndex((s) => s === value);
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, value]);

  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const target = optionRefs.current[activeIndex];
    if (target) {
      target.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  const selectState = (state: string) => {
    onChange(state);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filtered[activeIndex];
      if (selected) selectState(selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`input-field w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all duration-200 text-left flex items-center justify-between gap-3 ${
          error
            ? "bg-red-50 border-red-300 text-slate-900"
            : "bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300 focus:bg-white"
        }`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="p-2">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search state"
              className="input-field w-full rounded-lg px-3 py-2 text-sm font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white"
              aria-label="Search state"
            />
          </div>
          <div
            role="listbox"
            aria-label="Indian states"
            className="max-h-60 overflow-y-auto py-1"
          >
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">No matches found</div>
            )}
            {filtered.map((state, index) => (
              <button
                type="button"
                key={state}
                role="option"
                aria-selected={state === value}
                ref={(el) => { optionRefs.current[index] = el; }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectState(state)}
                onKeyDown={handleKeyDown}
                className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                  index === activeIndex
                    ? "bg-orange-50 text-orange-700"
                    : state === value
                    ? "bg-slate-50 text-slate-900"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      )}
      {error ? (
        <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">Type to search</p>
      )}
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  readOnly = false,
  required = true,
  error,
  inputMode,
  pattern,
}: FormFieldProps){
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-2">
        {label}
        {readOnly && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full tracking-normal normal-case font-semibold">locked</span>}
      </label>
      <input
  type={type}
  name={name}
  value={value}
  inputMode={inputMode}
  pattern={pattern}
  onChange={onChange}
        readOnly={readOnly} required={required} placeholder={placeholder}
        className={`input-field w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all duration-200 ${
          error
            ? "bg-red-50 border-red-300 text-slate-900"
            : readOnly
            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300 focus:bg-white placeholder:text-slate-300"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

interface FileDropzoneProps {
  label: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
  error?: string;
  hint?: string;
}

function FileDropzone({ label, accept, onChange, file, error, hint }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`flex items-center gap-4 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 group ${
          file ? "border-emerald-300 bg-emerald-50" :
          error ? "border-red-300 bg-red-50" :
          "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/40"
        }`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${
          file ? "bg-emerald-100" : "bg-white border border-slate-200 group-hover:border-orange-200"
        }`}>
          {file ? "✅" : "📄"}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold truncate ${file ? "text-emerald-700" : "text-slate-500 group-hover:text-orange-600"}`}>
            {file ? file.name : "Click to upload"}
          </p>
          {!file && hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange({ target: { files: null } } as never); }}
            className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors shrink-0 text-lg leading-none"
          >
            ×
          </button>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="hidden" />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

function ToggleCard({ emoji, label, active, onClick }: { emoji: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
        active ? "bg-slate-950 border-slate-950 text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-sm font-semibold">{label}</span>
      <span className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "bg-white border-white" : "border-slate-300"}`}>
        {active && (
          <svg className="w-3 h-3 text-slate-950" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </button>
  );
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 text-center ${
        active ? "bg-slate-950 border-slate-950 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-slate-400 font-medium shrink-0">{label}</span>
      <span className="font-semibold text-slate-800 text-right break-all">{value}</span>
    </div>
  );
}