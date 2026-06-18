"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  createBrandApplication,
  INDIAN_STATES,
  uploadBrandFile,
  validateBrandForm,
  type BrandFormData,
  type BrandProfile,
} from "../lib/seller";
import {
  Store, TrendingUp, Package, ShieldCheck, Truck, BarChart3, Lock,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

type Step = "form" | "uploading" | "success";

interface ExistingApplication {
  verificationStatus: "pending" | "approved" | "rejected";
  brandName: string;
  email: string;
  rejectionReason?: string;
}

/* ─────────────────────── Constants ─────────────────────────── */

const INITIAL_FORM: BrandFormData = {
  brandName: "",
  ownerName: "",
  email: "",
  phone: "",
  gstNumber: "",
  pickupAddress: "",
  city: "",
  state: "",
  pincode: "",
  website: "",
  instagram: "",
  description: "",
};

const BENEFITS: { icon: React.ElementType; title: string; desc: string }[] = [
  {
    icon: Store,
    title: "Pet-Loving Audience",
    desc: "Reach thousands of passionate pet parents actively looking for quality products for their companions.",
  },
  {
    icon: TrendingUp,
    title: "Zero Commission Launch",
    desc: "Start with zero listing fees and zero commission for the first 3 months. Keep 100% of your earnings.",
  },
  {
    icon: Package,
    title: "Pan-India Shipping",
    desc: "Integrated with Shiprocket for automated label generation, pickup scheduling, and real-time tracking.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Seller Badge",
    desc: "Build customer confidence with a verified badge, transparent ratings, and secure payment processing.",
  },
  {
    icon: Truck,
    title: "Easy Pickup & Return",
    desc: "Shiprocket picks up orders directly from your address. Hassle-free return management included.",
  },
  {
    icon: BarChart3,
    title: "Seller Dashboard",
    desc: "Track orders, revenue, and customer insights through a comprehensive real-time analytics dashboard.",
  },
];

const REQUIREMENTS = [
  { text: "Registered business entity (proprietorship, partnership, or Pvt Ltd)", highlight: true },
  { text: "Valid GST registration (optional for small sellers, required for brands)", highlight: false },
  { text: "Quality pet products — new, authentic, and safe for animals", highlight: true },
  { text: "Ability to ship within 2–3 business days of order placement", highlight: false },
  { text: "Clear product images and detailed descriptions", highlight: true },
  { text: "Commitment to customer satisfaction and timely support", highlight: false },
];

const VERIFICATION_STEPS = [
  { n: "01", title: "Submit Application", desc: "Fill out your business details, upload your logo and verification documents." },
  { n: "02", title: "Document Review", desc: "Our team verifies your business credentials and GST information within 48 hours." },
  { n: "03", title: "Approval & Setup", desc: "Your seller profile is activated. Shiprocket pickup location is configured for you." },
  { n: "04", title: "Start Selling", desc: "List your products on the marketplace and start reaching pet parents across India." },
];

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */

export default function BecomeSellerPage() {
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
      {/* Animation keyframes */}
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
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#64748b" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        {/* Eyebrow */}
        <div className="flex justify-center lg:justify-start mb-3 md:mb-4 animate-fadeUp">
          <span className="inline-flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm tracking-wide">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Seller Marketplace · India
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_520px] gap-14 lg:gap-16 items-center">

          {/* Left: Copy */}
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            <h1 className="sora text-[2.4rem] sm:text-5xl md:text-6xl lg:text-[4rem] font-bold leading-[1.15] tracking-tight text-slate-800 mb-6 animate-fadeUp delay-100">
              Your brand.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 font-extrabold drop-shadow-sm">
                Their happy tails.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-[1.7] max-w-xl mx-auto lg:mx-0 mb-9 animate-fadeUp delay-200">
              Join India&apos;s fastest-growing pet care marketplace. Sell to thousands of pet parents, ship pan-India with Shiprocket, and grow your brand with zero commission for the first 3 months.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 animate-fadeUp delay-300">
              <button
                onClick={onApply}
                className="shimmer-btn w-full sm:w-auto text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                Register as Seller
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
              100% free to apply · Verified within 48 hours
            </p>
          </div>

          {/* Right: Stacked card visual */}
          <div className="hidden lg:block relative animate-fadeUp delay-200">
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/15 border border-white/60 aspect-[4/5]">
              <img
                src="/seller-hero.jpg"
                alt="Pet products marketplace"
                onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; t.parentElement?.classList.add('bg-gradient-to-br', 'from-orange-100', 'to-amber-50'); }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent" />
            </div>

            {/* Floating stat chips */}
            <div className="absolute -top-4 -left-4 glass rounded-xl px-4 py-3 border border-white/50 shadow-lg animate-float">
              <p className="text-xs font-bold text-slate-900">🏪 128 Sellers</p>
              <p className="text-[10px] text-slate-500">Across 18 states</p>
            </div>

            <div className="absolute -bottom-6 -right-6 w-44 h-44 bg-orange-200/40 rounded-full blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Benefits Section (Premium) ── */

function BenefitsSection() {
  return (
    <section className="py-24 md:py-32 max-w-6xl mx-auto px-5 sm:px-8">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="inline-block text-[11px] font-semibold text-orange-500 tracking-[0.2em] uppercase mb-4">
          Why sell
        </span>
        <h2 className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-light text-slate-900 tracking-tight leading-[1.15]">
          Everything you need to
        </h2>
        <h2 className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-semibold text-slate-900 tracking-tight leading-[1.15] -mt-1">
          grow your pet brand
        </h2>
      </div>

      {/* Divider line */}
      <div className="w-12 h-px bg-orange-300 mx-auto mb-16" />

      {/* Benefits grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 max-w-4xl mx-auto">
        {BENEFITS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="group flex items-start gap-5">
            <div className="shrink-0 mt-1">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors duration-300">
                <Icon className="w-[18px] h-[18px] text-orange-500" />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Requirements + Verification Section (Premium) ── */

function RequirementsSection() {
  return (
    <section id="requirements" className="py-24 md:py-32 bg-slate-50/60">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-block text-[11px] font-semibold text-orange-500 tracking-[0.2em] uppercase mb-4">
            Eligibility
          </span>
          <h2 className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-light text-slate-900 tracking-tight leading-[1.15]">
            What we look for
          </h2>
          <h2 className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-semibold text-slate-900 tracking-tight leading-[1.15] -mt-1">
            in our sellers
          </h2>
        </div>

        <div className="w-12 h-px bg-orange-300 mx-auto mb-16" />

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">

          {/* Requirements — clean minimal list */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em] mb-8">
              Eligibility Requirements
            </p>
            <div className="space-y-5">
              {REQUIREMENTS.map(({ text, highlight }) => (
                <div key={text} className="flex items-start gap-4">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    highlight ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300'
                  }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8l3 3 5-6" />
                    </svg>
                  </span>
                  <span className="text-sm text-slate-600 leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Process — clean timeline */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em] mb-8">
              Verification Process
            </p>
            <div className="space-y-0">
              {VERIFICATION_STEPS.map(({ n, title, desc }, i) => (
                <div key={n} className="relative flex gap-5 pb-8 last:pb-0">
                  {/* Connector line */}
                  {i < VERIFICATION_STEPS.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200" />
                  )}
                  {/* Step dot */}
                  <div className="relative shrink-0 mt-1">
                    <div className="w-[22px] h-[22px] rounded-full border-2 border-orange-300 bg-white flex items-center justify-center">
                      <span className="text-[10px] font-bold text-orange-500">{n}</span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 mb-1">{title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
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

/* ── Bottom CTA (Premium) ── */

function BottomCTA({ onApply }: { onApply: () => void }) {
  return (
    <section className="py-24 md:py-32 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <span className="inline-block text-[11px] font-semibold text-orange-500 tracking-[0.2em] uppercase mb-4">
          Ready to start?
        </span>
        <h2 className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-semibold text-slate-900 tracking-tight leading-[1.15] mb-5">
          India&apos;s pet parents are waiting
        </h2>
        <p className="text-base text-slate-500 leading-relaxed max-w-lg mx-auto mb-10">
          Join AnimalSathi Marketplace and connect with thousands of loving pet parents across the country.
        </p>

        {/* Premium gradient card */}
        <div className="relative max-w-lg mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-8 shadow-xl shadow-orange-500/20">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)] pointer-events-none" />
          <div className="relative">
            <p className="text-white/90 text-sm font-medium mb-3">
              No listing fees. No commission for 3 months.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onApply}
                className="bg-white text-orange-600 px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-orange-50 hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
              >
                Apply Now — It&apos;s Free
              </button>
              <Link
                href="/"
                className="bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400 font-medium">
          <span className="text-emerald-500 mr-1">✓</span>
          No payment info required · Verified within 48 hours
        </p>
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
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-[2rem] sm:rounded-2xl shadow-2xl max-h-[96vh] sm:max-h-[88vh] flex flex-col animate-scaleIn z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="sora text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              Seller Application
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
          <SellerRegistrationForm onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM
══════════════════════════════════════════════════════════════ */

function SellerRegistrationForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [isReapplying, setIsReapplying] = useState(false);

  // Auto-populate email from auth
  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user?.email]);

  const [form, setForm] = useState<BrandFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [submitError, setSubmitError] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  /* ── Setup ── */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        import("firebase/firestore").then(({ doc, getDoc }) => {
          import("../lib/firebase").then(({ db }) => {
            getDoc(doc(db, "brands", currentUser.uid)).then((snap) => {
              if (snap.exists()) {
                setHasApplied(true);
                const data = snap.data() as BrandProfile & { rejectionReason?: string };
                setExistingApp({
                  verificationStatus: data.verificationStatus,
                  brandName: data.brandName,
                  email: data.email,
                  rejectionReason: data.rejectionReason,
                });
              }
            }).catch(console.error);
          });
        });
      }
    });
    return () => unsub();
  }, []);

  const handleChange = (field: keyof BrandFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleLogo = (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: "Logo must be under 2MB" }));
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((prev) => { const n = { ...prev }; delete n.logo; return n; });
  };

  const handleDocument = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, document: "Document must be under 10MB" }));
      return;
    }
    setDocFile(file);
    setDocName(file.name);
    setErrors((prev) => { const n = { ...prev }; delete n.document; return n; });
  };

  /* ── Reapply ── */

  const handleReapply = async () => {
    if (!user?.uid) return;
    setIsReapplying(true);
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await deleteDoc(doc(db, "brands", user.uid));
      setHasApplied(false);
      setExistingApp(null);
      setForm({ ...INITIAL_FORM, email: user.email ?? "" });
      setErrors({});
      setStep("form");
      alert("Application cleared. You can now reapply with updated information.");
    } catch (err) {
      console.error("Failed to clear application:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsReapplying(false);
    }
  };

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const validationErrors = validateBrandForm(form);
    if (!logoFile) validationErrors.logo = "Brand logo is required";
    if (!docFile) validationErrors.document = "Business verification document is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!user?.uid) {
      router.push("/auth?redirect=/become-seller");
      return;
    }

    setIsSubmitting(true);
    setStep("uploading");

    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const existingSnap = await getDoc(doc(db, "brands", user.uid));
      if (existingSnap.exists()) {
        setSubmitError("You already have a seller application under review. Please wait for approval.");
        setStep("form");
        setIsSubmitting(false);
        return;
      }

      setUploadProgress(15);

      const [logoURL, businessDocumentURL] = await Promise.all([
        uploadBrandFile(user.uid, logoFile!, "logo"),
        uploadBrandFile(user.uid, docFile!, "document"),
      ]);

      setUploadProgress(60);

      await createBrandApplication(user.uid, {
        ...form,
        logoURL,
        businessDocumentURL,
      });

      setUploadProgress(100);
      setStep("success");
    } catch (err: any) {
      console.error("Seller application failed:", err);
      setSubmitError(err?.message || "Something went wrong. Please try again.");
      setStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── States ── */

  if (authLoading) {
    return (
      <div className="py-16 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-slate-100 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Verifying your session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-10 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-4xl mx-auto mb-6">🔐</div>
        <h3 className="sora text-2xl font-extrabold text-slate-950 mb-3">Sign in Required</h3>
        <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
          You need to be signed in to submit your seller application.
        </p>
        <Link
          href={`/auth?redirect=${encodeURIComponent("/become-seller?openForm=true")}`}
          className="inline-block bg-slate-950 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors shadow-lg"
        >
          Sign In / Create Account
        </Link>
      </div>
    );
  }

  if (hasApplied && existingApp) {
    const cfg = {
      pending: { emoji: "⏳", title: "Application Under Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-100", msg: "Our team is reviewing your credentials. This typically takes 24–48 hours." },
      approved: { emoji: "✅", title: "Application Approved!", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", msg: "Your seller profile is verified. Access your Seller Dashboard to start listing products." },
      rejected: { emoji: "❌", title: "Application Rejected", color: "text-red-700", bg: "bg-red-50 border-red-100", msg: "Your application could not be approved at this time. Review the feedback below and reapply with updated information." },
    }[existingApp.verificationStatus];

    return (
      <div className={`rounded-2xl border p-8 text-center ${cfg.bg}`}>
        <div className="text-5xl mb-4">{cfg.emoji}</div>
        <h3 className={`sora text-2xl font-extrabold mb-2 ${cfg.color}`}>{cfg.title}</h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto mb-8 leading-relaxed">{cfg.msg}</p>
        <div className="bg-white/70 rounded-xl p-4 text-left space-y-2 border border-white/60 max-w-xs mx-auto mb-8">
          <Detail label="Brand" value={existingApp.brandName} />
          <Detail label="Email" value={existingApp.email} />
        </div>

        {existingApp.verificationStatus === "rejected" && existingApp.rejectionReason && (
          <div className="mb-6 max-w-sm mx-auto bg-red-50 border border-red-200 rounded-xl p-5 text-left">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">
              Feedback from reviewers
            </p>
            <p className="text-sm text-red-700 leading-relaxed">{existingApp.rejectionReason}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {existingApp.verificationStatus === "approved" ? (
            <>
              <Link
                href="/seller-dashboard"
                className="inline-block bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Go to Seller Dashboard →
              </Link>
              <button onClick={onClose} className="bg-slate-950 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors">
                Close
              </button>
            </>
          ) : existingApp.verificationStatus === "rejected" ? (
            <>
              <button
                onClick={handleReapply}
                disabled={isReapplying}
                className="shimmer-btn text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isReapplying ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Clearing…
                  </span>
                ) : (
                  "Reapply"
                )}
              </button>
              <button onClick={onClose} className="bg-slate-950 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors">
                Close
              </button>
            </>
          ) : (
            <button onClick={onClose} className="bg-slate-950 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div className="py-16 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h3 className="mt-6 text-lg font-extrabold text-slate-900">Submitting your application</h3>
          <p className="text-sm text-slate-500 mt-2">Uploading files and creating your seller profile…</p>
          <div className="mt-6 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{Math.round(uploadProgress)}%</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="py-10 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-6 text-xl font-extrabold text-slate-900">Application Submitted!</h3>
          <p className="text-sm text-slate-500 mt-2">
            Thank you for applying to become a seller on AnimalSathi Marketplace. Our team will review your application and get back to you.
          </p>
          <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-slate-700 text-left">
            <p className="font-semibold">What happens next?</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-500">
              <li>✅ Our admin team reviews your documents</li>
              <li>✅ Shiprocket pickup location is configured</li>
              <li>✅ You get access to the Seller Dashboard</li>
            </ul>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onClose} className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
              Close
            </button>
            <Link
              href="/shop"
              className="px-5 py-3 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25 transition-all"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Multi-section form ── */

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Business Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold">1</span>
          <div>
            <p className="text-sm font-bold text-slate-900">Business Information</p>
            <p className="text-xs text-slate-400">Your brand and contact details</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <FormField
            label="Brand Name *"
            value={form.brandName}
            onChange={(v) => handleChange("brandName", v)}
            placeholder="My Pet Brand"
            error={errors.brandName}
          />
          <FormField
            label="Owner Name *"
            value={form.ownerName}
            onChange={(v) => handleChange("ownerName", v)}
            placeholder="John Doe"
            error={errors.ownerName}
          />
          <FormField
            label="Business Email *"
            type="email"
            value={form.email}
            onChange={(v) => handleChange("email", v)}
            placeholder="hello@mybrand.com"
            error={errors.email}
            disabled={true}
          />
          <FormField
            label="Phone Number *"
            type="tel"
            value={form.phone}
            onChange={(v) => handleChange("phone", v.replace(/[^\d]/g, ""))}
            placeholder="9876543210"
            inputMode="numeric"
            error={errors.phone}
          />
          <FormField
            label="GST Number (optional)"
            value={form.gstNumber}
            onChange={(v) => handleChange("gstNumber", v)}
            placeholder="27ABCDE1234F1Z5"
            error={errors.gstNumber}
          />
        </div>
      </div>

      {/* Pickup / Shipping */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold">2</span>
          <div>
            <p className="text-sm font-bold text-slate-900">Pickup / Shipping Address</p>
            <p className="text-xs text-slate-400">Where Shiprocket will pick up your orders</p>
          </div>
        </div>
        <div className="space-y-5">
          <FormField
            label="Pickup Address *"
            value={form.pickupAddress}
            onChange={(v) => handleChange("pickupAddress", v)}
            placeholder="Shop No. 42, Main Road, Andheri East"
            error={errors.pickupAddress}
            helper="Must include a house or shop number for Shiprocket"
          />
          <div className="grid sm:grid-cols-3 gap-5">
            <FormField
              label="City *"
              value={form.city}
              onChange={(v) => handleChange("city", v)}
              placeholder="Mumbai"
              error={errors.city}
            />
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                State *
              </label>
              <select
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all ${
                  errors.state ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
              >
                <option value="">Select state…</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p className="mt-1 text-xs text-red-500 font-medium">{errors.state}</p>}
            </div>
            <FormField
              label="Pincode *"
              value={form.pincode}
              onChange={(v) => handleChange("pincode", v)}
              placeholder="400001"
              inputMode="numeric"
              maxLength={6}
              error={errors.pincode}
            />
          </div>
        </div>
      </div>

      {/* Brand Media */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold">3</span>
          <div>
            <p className="text-sm font-bold text-slate-900">Brand Media</p>
            <p className="text-xs text-slate-400">Upload your logo and verification documents</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Logo Upload */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Brand Logo * <span className="text-slate-300 normal-case">(under 2MB)</span>
            </label>
            <div
              onClick={() => logoInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                logoPreview
                  ? "border-emerald-200 bg-emerald-50/30"
                  : errors.logo
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/30"
              }`}
            >
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-contain mx-auto rounded-lg" />
              ) : (
                <div className="text-slate-400">
                  <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs font-medium">Click to upload logo</p>
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
              />
            </div>
            {errors.logo && <p className="mt-1 text-xs text-red-500 font-medium">{errors.logo}</p>}
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Business Document * <span className="text-slate-300 normal-case">(under 10MB)</span>
            </label>
            <div
              onClick={() => docInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                docFile
                  ? "border-emerald-200 bg-emerald-50/30"
                  : errors.document
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/30"
              }`}
            >
              {docFile ? (
                <div className="text-slate-700">
                  <svg className="w-10 h-10 mx-auto mb-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xs font-medium truncate max-w-full">{docName}</p>
                </div>
              ) : (
                <div className="text-slate-400">
                  <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs font-medium">Upload GST / business proof</p>
                </div>
              )}
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => handleDocument(e.target.files?.[0] ?? null)}
              />
            </div>
            {errors.document && <p className="mt-1 text-xs text-red-500 font-medium">{errors.document}</p>}
          </div>
        </div>
      </div>

      {/* Optional Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Optional Details</p>
            <p className="text-xs text-slate-400">Help customers learn more about your brand</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <FormField
            label="Website"
            value={form.website}
            onChange={(v) => handleChange("website", v)}
            placeholder="https://mybrand.com"
          />
          <FormField
            label="Instagram"
            value={form.instagram}
            onChange={(v) => handleChange("instagram", v)}
            placeholder="@mybrand"
          />
        </div>
        <div className="mt-5">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
            Brand Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Tell us about your brand and what makes your products special…"
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium border border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>
      </div>

      {/* Error */}
      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 font-medium">
          {submitError}
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
        >
          {isSubmitting ? "Submitting…" : "Submit Application"}
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
  error,
  helper,
  disabled = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  error?: string;
  helper?: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-70" : ""}>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
        {label}
        {disabled && <Lock className="w-3 h-3 text-slate-300" />}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => !disabled && onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={disabled}
        className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
            : error
              ? "border-red-300 bg-red-50 text-slate-900"
              : "bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
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
