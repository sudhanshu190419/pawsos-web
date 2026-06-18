"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { auth, db, storage } from "../../lib/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  GeoPoint,
} from "firebase/firestore";
import dynamic from "next/dynamic";

const HQMapClient = dynamic(() => import("./HQMapClient"), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[240px] bg-slate-100 animate-pulse rounded-2xl"></div>
});

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
  Zap,
  Lock,
  ChevronLeft,
  CheckCircle2,
  Phone,
  Mail,
  UserRound,
  FileText,
  Clock,
  XCircle,
  Users,
  BarChart3,
} from "lucide-react";

import { Toast, useToast } from "../../components/ui/Toast";
import { useRouter } from "next/navigation";
import { useLocation } from "../../lib/LocationContext";
import Link from "next/link";

import { useProfile } from "../../dashboard/hooks/useProfile";

/* ─────────────────────────── Types ─────────────────────────── */

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
  hqAddress: string;
  logo: File | null;
  licenseFile: File | null;
}

/* ─────────────────────── Constants ─────────────────────────── */

const BENEFITS: { icon: React.ElementType; title: string; desc: string }[] = [
  {
    icon: Zap,
    title: "Live Emergency Feed",
    desc: "Receive structured SOS alerts with GPS coordinates, priority scoring, and real-time updates for animals in your region.",
  },
  {
    icon: Activity,
    title: "Capacity Management",
    desc: "Route rescues based on your real-time bed availability, medical resources, and operational readiness.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Network",
    desc: "Securely manage documentation, compliance, and org credentials in one centralized hub.",
  },
  {
    icon: Ambulance,
    title: "Ambulance Sync",
    desc: "Track and deploy ambulance units seamlessly. Coordinate pickups, transfers, and emergency dispatches.",
  },
  {
    icon: Users,
    title: "Volunteer Coordination",
    desc: "Mobilize verified volunteers, assign roles, and manage field operations from a single command view.",
  },
  {
    icon: BarChart3,
    title: "Impact Analytics",
    desc: "Track rescue outcomes, response times, and community impact with comprehensive real-time dashboards.",
  },
];

const REQUIREMENTS = [
  "Registered NGO, trust, or veterinary hospital under applicable Indian law",
  "Valid registration certificate (Society Act, Trust Act, or Companies Act)",
  "Minimum 5-bed facility or shelter capacity",
  "Active contact person available for 24/7 coordination",
  "Operating location within India with verifiable headquarters",
  "Commitment to ethical animal welfare and rescue best practices",
];

const VERIFICATION_STEPS = [
  { n: "01", title: "Submit Application", desc: "Fill out your organizational details, upload documents, and set your headquarters location." },
  { n: "02", title: "Document Review", desc: "Our command team verifies your registration and compliance credentials within 48 hours." },
  { n: "03", title: "Approval & Setup", desc: "Your org profile is activated. Dispatch tools, maps, and coordination dashboard are configured." },
  { n: "04", title: "Start Operations", desc: "Go live on the network — receive SOS alerts, coordinate rescues, and sync with responders." },
];

const STEPS = ["Identity", "Resources", "Logistics", "Review"];

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */

export default function OrganizationOnboardingPage() {
  const [showForm, setShowForm] = useState(false);
  const { toast, showToast, dismissToast } = useToast();
  const { userData, pendingOrg, loading } = useProfile();
  const router = useRouter();

  const openForm = useCallback(() => setShowForm(true), []);
  const closeForm = useCallback(() => setShowForm(false), []);
  const [isReapplying, setIsReapplying] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="w-10 h-10 border-[3px] border-slate-100 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Approved State
  if (userData?.orgApproved) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-[#FAFAF8] px-4 sm:px-6 py-10 relative overflow-hidden selection:bg-orange-100 selection:text-orange-900">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/50 rounded-full blur-[100px] -z-10" />
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 sm:p-12 w-full max-w-md text-center relative overflow-hidden group animate-scaleIn">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500" />
          <div className="w-24 h-24 bg-emerald-50 rounded-[2.2rem] flex items-center justify-center mx-auto mb-6 border-8 border-slate-50 shadow-md relative group-hover:scale-105 transition-transform duration-500">
            <ShieldCheck className="w-10 h-10 text-emerald-600" />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm font-black shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 text-slate-800 tracking-tight leading-tight">Verified Partner</h1>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">
            Your organization is now part of the AnimalSathi mission network. Your command terminal is active and ready for coordination.
          </p>
          <Link href="/organization/dashboard" className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-orange-600 transition-all shadow-lg hover:-translate-y-1 group">
            Enter Dashboard <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>
    );
  }

  // Pending State
  if (pendingOrg?.status === "pending_review") {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-[#FAFAF8] px-4 sm:px-6 py-10 relative overflow-hidden">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 sm:p-12 w-full max-w-md text-center animate-scaleIn">
          <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 text-slate-800 tracking-tight">Review in Progress</h1>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">
            Our network command is currently verifying your organizational registry and license documents. This typically takes 24–48 hours.
          </p>
          <Link href="/" className="inline-block bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-lg">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  // Rejected State
  if (pendingOrg?.status === "rejected") {
    const handleReApply = async () => {
      setIsReapplying(true);
      try {
        const id = (pendingOrg as any)?.id || "";
        if (!id) {
          showToast("No application id found.", "error");
          return;
        }
        await deleteDoc(doc(db, "pending_organizations", id));
        router.refresh();
        showToast("Application cleared. You can now apply again.", "success");
      } catch (error) {
        console.error("Error clearing rejected application:", error);
        showToast("Failed to clear application. Please try again.", "error");
      } finally {
        setIsReapplying(false);
      }
    };

    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-[#FAFAF8] px-4 sm:px-6 py-10 relative overflow-hidden">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 sm:p-12 w-full max-w-md text-center animate-scaleIn">
          <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-slate-800 tracking-tight">Application Rejected</h2>
          <p className="text-slate-500 mb-6 font-medium leading-relaxed">
            Unfortunately, your organizational registry was not approved. This could be due to incomplete documentation or verification failure.
          </p>
          {(pendingOrg as any).rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">Feedback from reviewers:</p>
              <p className="text-sm text-slate-600">{(pendingOrg as any).rejectionReason}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleReApply}
              disabled={isReapplying}
              className="w-full shimmer-btn text-white py-4 rounded-2xl font-bold transition-all shadow-lg hover:-translate-y-1 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isReapplying ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Clearing…
                </>
              ) : (
                "Edit & Re-submit Application"
              )}
            </button>
            <Link href="/" className="w-full px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all">
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
        /* Override global 104px navbar offset — set to match navbar height */
        main#main-content > main > section:first-of-type {
          padding-top: 68px !important;
        }
        @media (min-width: 768px) {
          main#main-content > main > section:first-of-type {
            padding-top: 80px !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[#FAFAF8] text-slate-900 overflow-hidden selection:bg-orange-100 selection:text-orange-900">
        <HeroSection onApply={openForm} />
        <BenefitsSection />
        <RequirementsSection />
        <BottomCTA onApply={openForm} />
      </main>

      {showForm && typeof document !== "undefined" &&
        createPortal(<RegistrationModal onClose={closeForm} showToast={showToast} />, document.body)}

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════ */

function HeroSection({ onApply }: { onApply: () => void }) {
  return (
    <section className="relative pt-4 pb-20 md:pt-2 md:pb-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-orange-100/50 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-50/80 rounded-full blur-[120px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="orgdots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#64748b" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#orgdots)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        {/* Eyebrow */}
        <div className="flex justify-center lg:justify-start mb-3 md:mb-4 animate-fadeUp">
          <span className="inline-flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm tracking-wide">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Organization Partner Portal · India
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_520px] gap-14 lg:gap-16 items-center">

          {/* Left: Copy */}
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            <h1 className="sora text-[2.4rem] sm:text-5xl md:text-6xl lg:text-[4rem] font-bold leading-[1.15] tracking-tight text-slate-800 mb-6 animate-fadeUp delay-100">
              Scale your impact.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 font-extrabold drop-shadow-sm">
                Empower the rescue.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-[1.7] max-w-xl mx-auto lg:mx-0 mb-9 animate-fadeUp delay-200">
              Onboard your hospital, NGO, or veterinary facility to the AnimalSathi mission network. Synchronize ambulances, manage facility capacity, and lead local rescue operations with verified coordination.
            </p>

            <div className="flex flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 animate-fadeUp delay-300">
              <button
                onClick={onApply}
                className="shimmer-btn text-white flex-1 sm:flex-none px-3 sm:px-8 py-2.5 sm:py-4 rounded-xl font-semibold text-[10px] sm:text-base shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 group"
              >
                Register Your Organization
                <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <a
                href="#org-requirements"
                className="flex-1 sm:flex-none px-3 sm:px-8 py-2.5 sm:py-4 rounded-xl font-semibold text-[10px] sm:text-base text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 text-center shadow-sm"
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
                src="/organization.jpg"
                alt="Animal rescue organization"
                onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; t.parentElement?.classList.add('bg-gradient-to-br', 'from-orange-100', 'to-amber-50'); }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent" />
            </div>

            {/* Floating stat chips */}
            <div className="absolute -top-4 -left-4 glass rounded-xl px-4 py-3 border border-white/50 shadow-lg animate-float">
              <p className="text-xs font-bold text-slate-900">🏥 80+ Partners</p>
              <p className="text-[10px] text-slate-500">Across 15 states</p>
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
    <section className="py-24 md:py-32 max-w-6xl mx-auto px-5 sm:px-8">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="inline-block text-[11px] font-semibold text-orange-500 tracking-[0.2em] uppercase mb-4">
          Why partner
        </span>
        <h2 className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-light text-slate-900 tracking-tight leading-[1.15]">
          Everything you need to
        </h2>
        <h2 className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-semibold text-slate-900 tracking-tight leading-[1.15] -mt-1">
          grow your rescue network
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

/* ── Requirements + Verification Section ── */

function RequirementsSection() {
  return (
    <section id="org-requirements" className="py-24 md:py-32 bg-slate-50/60">
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
            in our partners
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
              {REQUIREMENTS.map((text) => (
                <div key={text} className="flex items-start gap-4">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
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
              Every rescue needs a command.<br className="hidden sm:block" /> Be the one.
            </h2>
            <p className="text-slate-400 text-lg font-light max-w-xl mx-auto mb-10 leading-relaxed">
              Onboard your organization and become a verified partner in India's fastest-growing animal rescue coordination network.
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
   MODAL (unchanged)
══════════════════════════════════════════════════════════════ */

function RegistrationModal({ onClose, showToast }: { onClose: () => void; showToast: any }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-12 p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-scaleIn border border-slate-100">
        {/* Modal Header */}
        <div className="px-5 sm:px-8 py-5 sm:py-7 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <Building2 className="w-6 h-6 text-orange-500" /> Partner Registry
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Onboarding
            </p>
          </div>
          <button onClick={onClose} className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 bg-white">
          <RegistrationForm onClose={onClose} showToast={showToast} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM (unchanged)
══════════════════════════════════════════════════════════════ */

function RegistrationForm({ onClose, showToast }: { onClose: () => void; showToast: any }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { location } = useLocation();
  const router = useRouter();
  const [hqCoords, setHqCoords] = useState<{ latitude: number; longitude: number } | null>(null);

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
    hqAddress: "",
    logo: null,
    licenseFile: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u?.email) {
        setFormData(prev => ({ ...prev, email: u.email || "" }));
      }
    });
    return () => unsub();
  }, []);

    const validateStep1 = () => {
    // Phone: at least 10 digits
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      showToast("Please enter a valid 10-digit phone number.", "error");
      return false;
    }
    // Email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      showToast("Please enter a valid email address.", "error");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(s => Math.min(s + 1, 4));
  };
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const ensureHqReady = () => {
    if (!formData.hqAddress.trim()) {
      showToast("Headquarters address is required.", "error");
      return false;
    }
    if (!hqCoords || typeof hqCoords.latitude !== "number" || typeof hqCoords.longitude !== "number") {
      showToast("Headquarters coordinates are required.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast("Please sign in first", "error");
      return;
    }

    // Phone validation
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      showToast("Please enter a valid 10-digit phone number.", "error");
      return;
    }

    // Email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      showToast("Please enter a valid email address.", "error");
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
        hqLocation: hqCoords ? new GeoPoint(hqCoords.latitude, hqCoords.longitude) : null,
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
    <div className="max-w-3xl mx-auto">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-8 sm:mb-16 relative px-1 sm:px-4">
        <div className="absolute top-[17px] left-[16px] right-[16px] sm:top-5 sm:left-8 sm:right-8 h-[2px] bg-slate-100 -z-10" />
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-col items-center gap-1.5 sm:gap-3">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-[10px] sm:text-xs font-black border-2 transition-all duration-300 ${step > i + 1 ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : step === i + 1 ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white border-slate-200 text-slate-400'}`}>
              {step > i + 1 ? <Check className="w-4 h-4 sm:w-6 sm:h-6" /> : i + 1}
            </div>
            <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.15em] ${step === i + 1 ? 'text-orange-500' : 'text-slate-400'}`}>{s}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-fadeUp">
          <div className="grid grid-cols-1 gap-6">
            <InputField icon={Building2} label="Organization Name" value={formData.orgName} onChange={v => setFormData({...formData, orgName: v})} placeholder="e.g. City Life Animal Hospital" />

            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Entity Type</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {["hospital", "ngo", "vet"].map(t => (
                  <button
                    key={t}
                    onClick={() => setFormData({...formData, type: t as any})}
                    className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${formData.type === t ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <InputField icon={UserRound} label="Primary Admin / Manager" value={formData.contactPerson} onChange={v => setFormData({...formData, contactPerson: v})} placeholder="Full name of authority" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField icon={Mail} label="Official Email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="admin@org.org" disabled={true} type="email" />
              <InputField icon={Phone} label="Contact Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v.replace(/[^\d+\s-]/g, "")})} placeholder="+91" inputMode="tel" type="tel" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 sm:space-y-10 animate-fadeUp">
          <div className="p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 bg-slate-50 shadow-inner">
            <div className="flex justify-between items-center mb-8">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Capacity HUD</label>
              <span className="text-4xl font-black text-orange-500 font-mono">{formData.bedCount} <span className="text-[10px] uppercase ml-1 tracking-widest text-slate-400">Units</span></span>
            </div>
            <input
              type="range" min="1" max="100"
              value={formData.bedCount}
              onChange={e => setFormData({...formData, bedCount: parseInt(e.target.value)})}
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
            <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed text-center">Adjust your facility&apos;s active bed/shelter capacity for incoming rescues.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <button
              onClick={() => setFormData({...formData, hasAmbulance: !formData.hasAmbulance})}
              className={`p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-2 sm:gap-4 ${formData.hasAmbulance ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-lg shadow-orange-500/5' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 transition-all ${formData.hasAmbulance ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-50 border-slate-100'}`}>
                <Ambulance className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </div>
              <span className="font-black text-[9px] sm:text-xs uppercase tracking-widest">Ambulance Unit</span>
            </button>
            <div className="p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center gap-2 sm:gap-4 opacity-40 grayscale cursor-not-allowed">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-white border border-slate-100 flex items-center justify-center">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-slate-300" />
              </div>
              <span className="font-black text-[9px] sm:text-xs uppercase tracking-widest">ICU Support</span>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-fadeUp">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-sm">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Headquarters Location</label>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Required</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Use current location, enter coordinates, or set a pin on the map.</p>
                </div>

                <InputField icon={MapPin} label="Headquarters Address" value={formData.hqAddress} onChange={v => setFormData({...formData, hqAddress: v})} placeholder="HQ address for dispatch center" />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!location) {
                        showToast("Current location not available.", "error");
                        return;
                      }
                      setHqCoords({ latitude: location.latitude, longitude: location.longitude });
                      if (!formData.hqAddress.trim() && location.address) {
                        setFormData((prev) => ({ ...prev, hqAddress: location.address || prev.hqAddress }));
                      }
                    }}
                    className="px-5 py-3 rounded-2xl bg-orange-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
                  >
                    Use Current Location
                  </button>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.000001"
                      value={hqCoords?.latitude ?? ""}
                      onChange={(e) => {
                        const nextLat = Number(e.target.value);
                        setHqCoords((prev) => ({ latitude: nextLat, longitude: prev?.longitude ?? 0 }));
                      }}
                      placeholder="Latitude"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-300"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      value={hqCoords?.longitude ?? ""}
                      onChange={(e) => {
                        const nextLng = Number(e.target.value);
                        setHqCoords((prev) => ({ latitude: prev?.latitude ?? 0, longitude: nextLng }));
                      }}
                      placeholder="Longitude"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 h-[240px]">
                  <HQMapClient hqCoords={hqCoords} setHqCoords={setHqCoords} />
                </div>
                <p className="text-[10px] text-slate-400">Tap the map to place your headquarters pin.</p>
              </div>
            </div>

            <InputField icon={MapPin} label="Physical Address" value={formData.address} onChange={v => setFormData({...formData, address: v})} placeholder="Plot no, building, street" />
            <InputField icon={MapPin} label="City" value={formData.city} onChange={v => setFormData({...formData, city: v})} placeholder="e.g. New Delhi" />

            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Registration Document (PDF/JPG)</label>
              <label className="flex flex-col items-center justify-center w-full h-36 sm:h-52 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-[2.5rem] cursor-pointer hover:border-orange-400/40 hover:bg-orange-50/30 transition-all group bg-white shadow-sm">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all mb-4 ${formData.licenseFile ? 'bg-emerald-50 text-emerald-500 border-emerald-300' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:text-orange-500'}`}>
                    {formData.licenseFile ? <CheckCircle2 className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <p className={`font-bold text-sm ${formData.licenseFile ? "text-emerald-600" : "text-slate-600 group-hover:text-orange-600"}`}>
                    {formData.licenseFile ? formData.licenseFile.name : "Select License File"}
                  </p>
                  {!formData.licenseFile && <p className="text-xs text-slate-400 mt-1.5 font-medium italic tracking-tight">Required for organization verification</p>}
                </div>
                <input type="file" className="hidden" onChange={e => setFormData({...formData, licenseFile: e.target.files?.[0] || null})} />
              </label>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-8 animate-fadeUp">
          <div className="p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border border-orange-200 bg-orange-50/50 text-center shadow-sm">
            <ShieldCheck className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-orange-500 mx-auto mb-3 sm:mb-6" />
            <h3 className="text-base sm:text-xl md:text-2xl font-black text-slate-800 mb-2 sm:mb-3 tracking-tight">Operational Review</h3>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-sm mx-auto">Please confirm your organizational capabilities before transmitting your registry to our command network.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 p-4 sm:p-8 md:p-10 space-y-3 sm:space-y-6">
            <SummaryItem label="Partner" value={formData.orgName} />
            <SummaryItem label="Category" value={formData.type.toUpperCase()} isPrimary />
            <SummaryItem label="Logistics" value={`${formData.bedCount} Bed Units ${formData.hasAmbulance ? "· 1 Ambulance" : ""}`} />
            <SummaryItem label="Location" value={`${formData.city}, India`} />
            <SummaryItem label="HQ" value={formData.hqAddress || "Not provided"} />
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex gap-3 sm:gap-4 mt-8 sm:mt-16 pt-5 sm:pt-10 border-t border-slate-100">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-slate-600 font-bold text-[10px] sm:text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> Back
          </button>
        )}
        <button
          onClick={() => {
            if (step === 3 && !ensureHqReady()) return;
            if (step === 4) {
              if (!ensureHqReady()) return;
              handleSubmit();
              return;
            }
            handleNext();
          }}
          disabled={loading}
          className={`flex-[2] py-3.5 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 sm:gap-3 active:scale-95 ${
            loading ? "bg-slate-100 text-slate-400 cursor-wait" : "shimmer-btn text-white hover:shadow-orange-500/30"
          }`}
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Transmitting...</span>
            </>
          ) : (
            <>
              <span>{step === 4 ? "Submit Registry" : "Next Phase"}</span>
              {step < 4 && <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM SUB-COMPONENTS (unchanged)
══════════════════════════════════════════════════════════════ */

function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  inputMode,
  type
}: {
  icon: any,
  label: string,
  value: string,
  onChange: (v: string) => void,
  placeholder: string,
  disabled?: boolean,
  inputMode?: "text" | "tel" | "email" | "url" | "numeric" | "decimal" | "search",
  type?: string
}) {
  return (
    <div className={`relative group ${disabled ? 'opacity-80' : ''}`}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
        {disabled && <Lock className="w-2.5 h-2.5 text-slate-400" />}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={e => !disabled && onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={disabled}
        inputMode={inputMode}
        className={`w-full border rounded-2xl px-6 py-4 text-sm sm:text-base font-bold transition-all outline-none shadow-sm ${
          disabled
            ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed'
            : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5'
        }`}
      />
    </div>
  );
}

function SummaryItem({ label, value, isPrimary = false }: { label: string, value: string, isPrimary?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
      <span className="text-slate-400">{label}</span>
      <span className={isPrimary ? "text-orange-500" : "text-slate-700"}>{value}</span>
    </div>
  );
}