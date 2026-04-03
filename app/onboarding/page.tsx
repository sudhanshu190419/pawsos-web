"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { auth, db, storage } from "../lib/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  GeoPoint,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";

/* ─────────────────────────── Types ─────────────────────────── */

interface FormData {
  ngoName: string;
  contactPerson: string;
  email: string;
  phone: string;
  regNumber: string;
  darpanId: string;
  city: string;
  fullAddress: string;
  serviceArea: string;
  hasAmbulance: boolean;
  hasShelter: boolean;
  animalTypes: string[];
  logo: File | null;
  regCert: File | null;
  eightyGCert: File | null;
}

interface ExistingApplication {
  verificationStatus: "pending_review" | "approved" | "rejected";
  ngoName: string;
  email: string;
}

interface Coords {
  latitude: number;
  longitude: number;
}

/* ─────────────────────── Geohash utility ─────────────────────── */

function encodeGeohash(lat: number, lon: number, precision = 6): string {
  const CHARS = "0123456789bcdefghjkmnpqrstuvwxyz";
  let idx = 0,
    bit = 0,
    evenBit = true,
    geohash = "";
  let latMin = -90,
    latMax = 90,
    lonMin = -180,
    lonMax = 180;
  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) {
        idx = (idx << 1) + 1;
        lonMin = mid;
      } else {
        idx <<= 1;
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        idx = (idx << 1) + 1;
        latMin = mid;
      } else {
        idx <<= 1;
        latMax = mid;
      }
    }
    evenBit = !evenBit;
    if (bit < 4) bit++;
    else {
      geohash += CHARS[idx];
      bit = 0;
      idx = 0;
    }
  }
  return geohash;
}

/* ─────────────────────── Font Injection ─────────────────────── */

function FontLoader() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  return null;
}

/* ══════════════════════════════════════════════════════════════
   PAGE COMPONENT
══════════════════════════════════════════════════════════════ */

export default function NGOOnboardingPage() {
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openForm = useCallback(() => setShowForm(true), []);
  const closeForm = useCallback(() => setShowForm(false), []);

  return (
    <>
      <FontLoader />

      <style>{`
        .sora { font-family: 'Sora', sans-serif; }
        .dm-sans { font-family: 'DM Sans', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-fadeUp  { animation: fadeUp  0.6s cubic-bezier(.22,.68,0,1.2) both; }
        .animate-scaleIn { animation: scaleIn 0.35s cubic-bezier(.22,.68,0,1.2) both; }
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
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .input-field:focus { outline: none; box-shadow: 0 0 0 3px rgba(234,88,12,0.15); border-color: #ea580c; }
        .step-line::after {
          content: '';
          position: absolute;
          top: 20px; left: calc(50% + 20px);
          width: calc(100% - 40px);
          height: 1px;
          background: #e2e8f0;
        }
      `}</style>

      <main
        className="min-h-screen bg-[#FAFAF8] text-slate-900 overflow-hidden selection:bg-orange-100 selection:text-orange-900 dm-sans"
      >
        {/* ── HERO ── */}
        <HeroSection onApply={openForm} />

        {/* ── STATS STRIP ── */}
        <StatsStrip />

        {/* ── BENEFITS ── */}
        <BenefitsSection />

        {/* ── PROCESS ── */}
        <ProcessSection onApply={openForm} />

        {/* ── BOTTOM CTA ── */}
        <BottomCTA onApply={openForm} />
      </main>

      {/* ── MODAL ── */}
      {mounted &&
        showForm &&
        typeof document !== "undefined" &&
        createPortal(
          <RegistrationModal onClose={closeForm} />,
          document.body
        )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTIONS
══════════════════════════════════════════════════════════════ */

function HeroSection({ onApply }: { onApply: () => void }) {
  return (
    // 1. Reduced top padding (pt-10 to pt-4, md:pt-16 to md:pt-8) to remove extra top space
    <section className="relative pt-12 pb-20 md:pt-8 md:pb-28 overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-50/80 rounded-full blur-[100px]" />
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#64748b" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Eyebrow - 2. Reduced mb-8 to mb-3 md:mb-4 to pull it closer to the heading */}
        <div className="flex justify-center lg:justify-start mb-3 md:mb-4 animate-fadeUp">
          <span className="inline-flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm tracking-wide">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            NGO Partner Portal · India
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_500px] gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            {/* 3. Softened font-extrabold to font-bold, added gradient to the second line */}
            <h1
              className="sora text-[2.4rem] sm:text-5xl lg:text-[4rem] xl:text-[4.5rem] font-bold leading-[1.15] tracking-tight text-slate-800 mb-6 animate-fadeUp delay-100"
            >
              Rescue smarter.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 font-extrabold drop-shadow-sm">
                Save more lives.
              </span>
            </h1>

            {/* 4. Changed paragraph from font-light to font-normal and improved line-height */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-[1.7] max-w-xl mx-auto lg:mx-0 mb-8 sm:mb-10 animate-fadeUp delay-200">
              India's first structured emergency feed for animal welfare NGOs.
              Real-time GPS alerts, verified volunteers, and zero WhatsApp chaos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 animate-fadeUp delay-300">
              <button
                onClick={onApply}
                className="shimmer-btn w-full sm:w-auto text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                Apply for Partnership
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <a
                href="#process"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 text-center shadow-sm"
              >
                How it works
              </a>
            </div>

            <p className="mt-5 text-sm text-slate-400 font-medium animate-fadeUp delay-400">
              <span className="text-emerald-500 mr-1.5">✓</span>
              Free for verified 80G / 12A registered NGOs
            </p>
          </div>

          {/* Right: Visual card */}
          <div className="relative animate-fadeUp delay-200 hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/15 border border-white/60 aspect-[4/5]">
              <img
                src="/ngo-hero.jpg"
                alt="Veterinarian caring for dog"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

             
            </div>

            {/* Decorative blob */}
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-orange-200/40 rounded-full blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Stats Strip ── */

const STATS = [
  { value: "12,000+", label: "SOS Alerts Processed" },
  { value: "340+", label: "Verified Volunteers" },
  { value: "87", label: "NGO Partners" },
  { value: "94%", label: "Rescue Success Rate" },
];

function StatsStrip() {
  return (
    <div className="border-y border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center sm:text-left">
              <p className="sora text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {value}
              </p>
              <p className="text-sm text-slate-500 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Benefits Section ── */

const BENEFITS = [
  {
    emoji: "📡",
    tag: "Real-time Feed",
    title: "Centralized SOS Dashboard",
    desc: "Structured emergency alerts with GPS coordinates, photos, and AI-powered urgency scoring — replacing chaotic group chats forever.",
  },
  {
    emoji: "🦸",
    tag: "Dispatch",
    title: "Instant Volunteer Routing",
    desc: "Assign verified local scouts, first-responders, and transport volunteers to cases with one tap. See live ETA on your map.",
  },
  {
    emoji: "📊",
    tag: "Compliance",
    title: "Automated Impact Reports",
    desc: "Before-and-after photo evidence, case timelines, and donor-ready PDF reports generated automatically for every rescue.",
  },
];

function BenefitsSection() {
  return (
    <section className="py-20 md:py-28 max-w-7xl mx-auto px-5 sm:px-8">
      <div className="text-center mb-14">
        <p className="text-sm font-semibold text-orange-600 tracking-widest uppercase mb-3">
          Why Partner With Us
        </p>
        <h2 className="sora text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight max-w-2xl mx-auto leading-tight">
          The infrastructure your mission deserves
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {BENEFITS.map(({ emoji, tag, title, desc }, i) => (
          <div
            key={title}
            className="group relative bg-white rounded-2xl p-7 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-900/8 hover:-translate-y-1.5 transition-all duration-300"
          >
            {/* Top accent */}
            <div className="absolute top-0 left-7 h-0.5 w-12 bg-orange-500 rounded-full" />

            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                {emoji}
              </div>
              <span className="mt-3 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                {tag}
              </span>
            </div>

            <h3 className="sora text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Process Section ── */

const STEPS = [
  {
    n: "01",
    title: "Apply Online",
    desc: "Submit your organization details through our encrypted partner form.",
  },
  {
    n: "02",
    title: "Document Verification",
    desc: "Our team reviews your 80G/12A certificate and operational track record.",
  },
  {
    n: "03",
    title: "Platform Onboarding",
    desc: "Receive dedicated admin accounts and a live product walkthrough.",
  },
  {
    n: "04",
    title: "Go Live",
    desc: "Access the SOS feed and coordinate volunteers from day one.",
  },
];

function ProcessSection({ onApply }: { onApply: () => void }) {
  return (
    <section id="process" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-orange-600 tracking-widest uppercase mb-3">
            The Process
          </p>
          <h2 className="sora text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight">
            Verified in 24–48 hours
          </h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto text-lg font-light">
            Every partner NGO passes a strict vetting process to ensure a safe, trustworthy ecosystem.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {STEPS.map(({ n, title, desc }, i) => (
            <div key={n} className="relative group">
              {/* Connector line on desktop */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-5 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-slate-100" />
              )}
              <div className="bg-[#FAFAF8] border border-slate-100 rounded-2xl p-6 sm:p-7 hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center sora group-hover:bg-orange-600 transition-colors duration-300">
                    {n}
                  </div>
                </div>
                <h3 className="sora text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA within section */}
        <div className="text-center">
          <button
            onClick={onApply}
            className="inline-flex items-center gap-2 bg-slate-950 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-orange-600 transition-colors duration-200 shadow-lg shadow-slate-900/15 group"
          >
            Start Your Application
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
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
        <div className="relative bg-slate-950 rounded-3xl px-8 sm:px-12 md:px-20 py-14 md:py-20 text-center overflow-hidden">
          {/* Glows */}
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <p className="text-orange-400 text-sm font-semibold tracking-widest uppercase mb-4">
              Ready to Scale?
            </p>
            <h2 className="sora text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
              Join India's fastest-growing<br className="hidden sm:block" /> animal welfare network.
            </h2>
            <p className="text-slate-400 text-lg font-light max-w-xl mx-auto mb-10 leading-relaxed">
              Together, we eliminate chaos, amplify impact, and give every animal the rescue they deserve.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={onApply}
                className="shimmer-btn text-white px-9 py-4 rounded-xl font-semibold text-base shadow-xl shadow-orange-600/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Begin NGO Application
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
  // Trap scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center dm-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-[2rem] sm:rounded-2xl shadow-2xl max-h-[96vh] sm:max-h-[88vh] flex flex-col animate-scaleIn z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="sora text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              NGO Application
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
          <NGORegistrationForm onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM
══════════════════════════════════════════════════════════════ */

const TOTAL_STEPS = 4;
const ANIMAL_TYPES = ["Dogs & Cats", "Large Animals", "Wildlife & Birds"];
const INITIAL_FORM: FormData = {
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
  animalTypes: [],
  logo: null,
  regCert: null,
  eightyGCert: null,
};

function NGORegistrationForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<Coords | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  /* ── Side effects ── */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "ngos_web", u.uid));
          if (snap.exists()) {
            setHasApplied(true);
            setExistingApp(snap.data() as ExistingApplication);
          } else {
            setForm((prev) => ({ ...prev, email: u.email ?? "" }));
          }
        } catch (err) {
          console.error("NGO status check failed:", err);
        }
      }
      setIsLoading(false);
    });

    navigator.geolocation?.getCurrentPosition(
      ({ coords }) =>
        setLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      (err) => console.warn("Geolocation denied:", err)
    );

    return unsub;
  }, []);

  /* ── Handlers ── */

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      set(e.target.name as keyof FormData, e.target.value as never),
    [set]
  );

  const handleFile = useCallback(
    (key: "logo" | "regCert" | "eightyGCert") =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        set(key, (e.target.files?.[0] ?? null) as never),
    [set]
  );

  const toggleAnimal = useCallback(
    (type: string) =>
      setForm((prev) => ({
        ...prev,
        animalTypes: prev.animalTypes.includes(type)
          ? prev.animalTypes.filter((t) => t !== type)
          : [...prev.animalTypes, type],
      })),
    []
  );

  /* ── Validation ── */

  const validate = (s: number): boolean => {
    const errs: typeof errors = {};
    if (s === 1) {
      if (!form.ngoName.trim()) errs.ngoName = "Required";
      if (!form.contactPerson.trim()) errs.contactPerson = "Required";
      if (!form.email.trim()) errs.email = "Required";
      if (!form.phone.trim()) errs.phone = "Required";
      if (!form.regNumber.trim()) errs.regNumber = "Required";
    }
    if (s === 2) {
      if (!form.city.trim()) errs.city = "Required";
      if (!form.fullAddress.trim()) errs.fullAddress = "Required";
      if (form.animalTypes.length === 0) errs.animalTypes = "Select at least one";
    }
    if (s === 3) {
      if (!form.logo) errs.logo = "Required";
      if (!form.regCert) errs.regCert = "Required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => validate(step) && setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(3) || !user || !location) {
      if (!user) alert("Please sign in to apply.");
      if (!location) alert("Location access is required. Please enable it and retry.");
      return;
    }

    const uploadFile = async (file: File, path: string) => {
      const r = ref(storage, path);
      await uploadBytes(r, file);
      return getDownloadURL(r);
    };

    try {
      setSubmitStatus("Uploading documents…");
      const ts = Date.now();
      const [logoURL, regCertURL, eightyGCertURL] = await Promise.all([
        form.logo ? uploadFile(form.logo, `ngos/logos/${user.uid}_${ts}`) : Promise.resolve(""),
        form.regCert ? uploadFile(form.regCert, `ngos/certs/${user.uid}_${ts}`) : Promise.resolve(""),
        form.eightyGCert ? uploadFile(form.eightyGCert, `ngos/80G/${user.uid}_${ts}`) : Promise.resolve(""),
      ]);

      setSubmitStatus("Saving your profile…");
      await setDoc(
        doc(db, "ngos_web", user.uid),
        {
          uid: user.uid,
          ...form,
          logo: logoURL,
          regCert: regCertURL,
          eightyGCert: eightyGCertURL,
          location: new GeoPoint(location.latitude, location.longitude),
          geohash: encodeGeohash(location.latitude, location.longitude),
          latitude: location.latitude,
          longitude: location.longitude,
          status: "pending",
          verificationStatus: "pending_review",
          role: "ngo",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSubmitStatus("Done!");
      setTimeout(() => {
        setHasApplied(true);
        setExistingApp({
          verificationStatus: "pending_review",
          ngoName: form.ngoName,
          email: form.email,
        });
        setSubmitStatus(null);
      }, 800);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed. Please check your connection and try again.");
      setSubmitStatus(null);
    }
  };

  /* ── Loading state ── */

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-10 h-10 border-[3px] border-slate-100 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Verifying your session…</p>
      </div>
    );
  }

  /* ── Not logged in ── */

  if (!user) {
    return (
      <div className="py-10 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-4xl mx-auto mb-6">
          🔐
        </div>
        <h3 className="sora text-2xl font-extrabold text-slate-950 mb-3">Sign in Required</h3>
        <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
          You need to be signed in to submit a partnership application. Your progress will be saved.
        </p>
        <Link
          href="/auth"
          className="inline-block bg-slate-950 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors shadow-lg"
        >
          Sign In / Create Account
        </Link>
      </div>
    );
  }

  /* ── Already applied ── */

  if (hasApplied && existingApp) {
    const configs = {
      pending_review: {
        emoji: "⏳",
        title: "Under Review",
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-100",
        msg: "Our trust & safety team is verifying your documents. This typically takes 24–48 hours.",
      },
      approved: {
        emoji: "✅",
        title: "Partnership Approved!",
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-100",
        msg: "Your NGO is verified. Access your Admin Dashboard to start coordinating rescues.",
      },
      rejected: {
        emoji: "❌",
        title: "Application Rejected",
        color: "text-red-700",
        bg: "bg-red-50 border-red-100",
        msg: "We couldn't verify your documents. Please contact support@rescuenet.in to appeal.",
      },
    };
    const cfg = configs[existingApp.verificationStatus];

    return (
      <div className={`rounded-2xl border p-8 text-center ${cfg.bg}`}>
        <div className="text-5xl mb-4">{cfg.emoji}</div>
        <h3 className={`sora text-2xl font-extrabold mb-2 ${cfg.color}`}>{cfg.title}</h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto mb-8 leading-relaxed">{cfg.msg}</p>
        <div className="bg-white/70 rounded-xl p-4 text-left space-y-2 border border-white max-w-xs mx-auto mb-8">
          <Detail label="Organization" value={existingApp.ngoName} />
          <Detail label="Contact Email" value={existingApp.email} />
        </div>
        <button
          onClick={onClose}
          className="bg-slate-950 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  /* ── Multi-step form ── */

  const progress = (step / TOTAL_STEPS) * 100;
  const stepLabels = ["Basic Info", "Operations", "Documents", "Confirm"];

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300 ${
                    i + 1 < step
                      ? "bg-emerald-500 text-white"
                      : i + 1 === step
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-6 h-px ${i + 1 < step ? "bg-emerald-300" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
            {stepLabels[step - 1]}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step panels */}
      {step === 1 && (
        <div className="space-y-4 sm:space-y-5">
          <FormField
            label="Official NGO / Trust Name *"
            name="ngoName"
            value={form.ngoName}
            onChange={handleInput}
            placeholder="e.g. Hope Animal Rescue Trust"
            error={errors.ngoName}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Primary Contact Person *"
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleInput}
              placeholder="Full name"
              error={errors.contactPerson}
            />
            <FormField
              label="Official Phone *"
              name="phone"
              value={form.phone}
              onChange={handleInput}
              placeholder="+91 98765 43210"
              error={errors.phone}
            />
          </div>
          <FormField
            label="Official Email Address *"
            name="email"
            type="email"
            value={form.email}
            onChange={handleInput}
            readOnly={!!user?.email}
            error={errors.email}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Registration Number *"
              name="regNumber"
              value={form.regNumber}
              onChange={handleInput}
              placeholder="Trust/Society Reg No."
              error={errors.regNumber}
            />
            <FormField
              label="NITI Aayog Darpan ID"
              name="darpanId"
              value={form.darpanId}
              onChange={handleInput}
              placeholder="Optional"
              required={false}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="City of Operation *"
              name="city"
              value={form.city}
              onChange={handleInput}
              placeholder="e.g. New Delhi"
              error={errors.city}
            />
            <FormField
              label="Primary Service Zone *"
              name="serviceArea"
              value={form.serviceArea}
              onChange={handleInput}
              placeholder="e.g. South Delhi"
            />
          </div>
          <FormField
            label="Full Registered Address *"
            name="fullAddress"
            value={form.fullAddress}
            onChange={handleInput}
            placeholder="Complete physical address"
            error={errors.fullAddress}
          />

          <div>
            <FieldLabel>Operational Capacity</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <ToggleCard
                emoji="🚑"
                label="We operate an Ambulance"
                active={form.hasAmbulance}
                onClick={() => set("hasAmbulance", !form.hasAmbulance)}
              />
              <ToggleCard
                emoji="🏡"
                label="We operate a Shelter"
                active={form.hasShelter}
                onClick={() => set("hasShelter", !form.hasShelter)}
              />
            </div>
          </div>

          <div>
            <FieldLabel error={errors.animalTypes}>
              Animals Handled *
            </FieldLabel>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
              {ANIMAL_TYPES.map((type) => (
                <ToggleChip
                  key={type}
                  label={type}
                  active={form.animalTypes.includes(type)}
                  onClick={() => toggleAnimal(type)}
                />
              ))}
            </div>
            {errors.animalTypes && (
              <p className="mt-1.5 text-xs text-red-500">{errors.animalTypes}</p>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠</span>
            <p className="text-amber-800 text-xs sm:text-sm font-medium leading-relaxed">
              Upload clear, legible scans or photos. Maximum 5 MB per file.
              Accepted formats: PDF, JPG, PNG.
            </p>
          </div>
          <FileDropzone
            label="NGO Logo *"
            accept="image/*"
            onChange={handleFile("logo")}
            file={form.logo}
            error={errors.logo}
          />
          <FileDropzone
            label="Registration Certificate *"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFile("regCert")}
            file={form.regCert}
            error={errors.regCert}
          />
          <FileDropzone
            label="80G Tax Certificate (Optional)"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFile("eightyGCert")}
            file={form.eightyGCert}
          />
        </div>
      )}

      {step === 4 && (
        <div className="py-8 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-40" />
            <div className="relative w-full h-full rounded-full bg-emerald-50 border-4 border-white shadow-xl flex items-center justify-center text-4xl z-10">
              📍
            </div>
          </div>
          <h3 className="sora text-2xl font-extrabold text-slate-950 mb-2">
            Location Confirmed
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto text-sm sm:text-base leading-relaxed mb-6">
            Your GPS coordinates are locked. SOS alerts within your service radius will be routed directly to your admin dashboard.
          </p>
          {location ? (
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Coordinates captured
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-red-400 rounded-full" />
              Location access required — please enable in browser
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
        {step > 1 && !submitStatus && (
          <button
            type="button"
            onClick={back}
            className="px-5 py-3 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Back
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={next}
            className="flex-1 bg-slate-950 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors duration-200 shadow-sm"
          >
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
            ) : (
              "Submit Application"
            )}
          </button>
        )}
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

function FieldLabel({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label
      className={`block text-[11px] font-bold uppercase tracking-widest mb-0 ${
        error ? "text-red-500" : "text-slate-400"
      }`}
    >
      {children}
    </label>
  );
}

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
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-2">
        {label}
        {readOnly && (
          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full tracking-normal normal-case font-semibold">
            locked
          </span>
        )}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        placeholder={placeholder}
        className={`input-field w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all duration-200 ${
          error
            ? "bg-red-50 border-red-300 text-slate-900 focus:ring-red-500/10 focus:border-red-400"
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
}

function FileDropzone({ label, accept, onChange, file, error }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center gap-4 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 group ${
          file
            ? "border-emerald-300 bg-emerald-50"
            : error
            ? "border-red-300 bg-red-50"
            : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/40"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${
            file ? "bg-emerald-100" : "bg-white border border-slate-200 group-hover:border-orange-200"
          }`}
        >
          {file ? "✅" : "📄"}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold truncate ${
              file ? "text-emerald-700" : "text-slate-500 group-hover:text-orange-600"
            }`}
          >
            {file ? file.name : "Click to upload file"}
          </p>
          {!file && (
            <p className="text-xs text-slate-400 mt-0.5">
              {accept.replace(/\./g, "").toUpperCase().split(",").join(", ")}
            </p>
          )}
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ target: { files: null } } as never);
            }}
            className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors shrink-0"
            aria-label="Remove file"
          >
            ×
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

function ToggleCard({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
        active
          ? "bg-slate-950 border-slate-950 text-white"
          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
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

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 text-center ${
        active
          ? "bg-slate-950 border-slate-950 text-white"
          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm gap-2">
      <span className="text-slate-400 font-medium shrink-0">{label}</span>
      <span className="font-semibold text-slate-800 text-right break-all">{value}</span>
    </div>
  );
}