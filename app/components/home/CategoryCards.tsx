"use client";

import Link from "next/link";
import Reveal from "../Reveal";
import { AlertCircle, HeartPulse, Users, ShoppingBag } from "lucide-react";

// ─── Design Tokens ──────────────────────────────────────────────────────────
const ACCENT = {
  red:   { dot: "#f87171", shadow: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.25)", bg: "bg-red-50", text: "text-red-600", borderClass: "border-red-100" },
  blue:  { dot: "#60a5fa", shadow: "rgba(96,165,250,0.15)",  border: "rgba(96,165,250,0.25)",  bg: "bg-blue-50", text: "text-blue-600", borderClass: "border-blue-100" },
  green: { dot: "#4ade80", shadow: "rgba(74,222,128,0.15)",  border: "rgba(74,222,128,0.25)",  bg: "bg-green-50", text: "text-green-600", borderClass: "border-green-100" },
  amber: { dot: "#fb923c", shadow: "rgba(251,146,60,0.15)",  border: "rgba(251,146,60,0.25)",  bg: "bg-orange-50", text: "text-orange-600", borderClass: "border-orange-100" },
} as const;

export default function CategoryCards() {
  return (
    <div className="relative z-20">
      <Reveal>
        <section className="relative mt-8 sm:mt-12 md:mt-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            <CategoryCard
              title="SOS Alerts"
              subtitle="Report instantly"
              stat="Real-time"
              icon={<AlertCircle className="w-5 h-5" />}
              link="/report"
              tag="Live"
              accent="red"
              image="/sos-dog.png"
            />
            <CategoryCard
              title="Nearby Vets"
              subtitle="Find clinics"
              stat="Within 10km"
              icon={<HeartPulse className="w-5 h-5" />}
              link="/vets_detail"
              tag="Fast"
              accent="blue"
              image="/vet-hospital.png"
            />
            <CategoryCard
              title="Volunteers"
              subtitle="Join network"
              stat="10k+ members"
              icon={<Users className="w-5 h-5" />}
              link="/volunteer-form"
              tag="Join"
              accent="green"
              image="/volunteer.png"
            />
            <CategoryCard
              title="Pet Shop"
              subtitle="Meds & Food"
              stat="Delivered"
              icon={<ShoppingBag className="w-5 h-5" />}
              link="/shop"
              tag="Deals"
              accent="amber"
              image="/pet-shop.png"
            />
          </div>
        </section>
      </Reveal>
    </div>
  );
}

// ─── CategoryCard ────────────────────────────────────────────────────────────
function CategoryCard({
  title, subtitle, stat, icon, link, tag, accent, image,
}: {
  title: string; subtitle: string; stat: string; icon: React.ReactNode;
  link: string; tag: string; accent: keyof typeof ACCENT; image: string;
}) {
  const a = ACCENT[accent];

  return (
    <Link href={link} className="group block h-full cursor-pointer">
      <div
        className="relative h-full rounded-2xl sm:rounded-[1.75rem] overflow-hidden bg-white/90
                   transition-all duration-300 ease-out
                   hover:-translate-y-2 hover:shadow-2xl active:scale-[0.97]
                   border backdrop-blur-sm border border-orange-100"
        style={{ boxShadow: `0 2px 20px ${a.shadow}` }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl sm:rounded-[1.75rem]"
          style={{ background: `radial-gradient(circle at bottom right, ${a.shadow} 0%, transparent 70%)` }}
        />
        <div
          className="absolute inset-0 rounded-2xl sm:rounded-[1.75rem] pointer-events-none
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: `inset -2px -2px 0 0 ${a.border}` }}
        />

        {/* Image Container */}
        <div className="absolute bottom-0 right-0 w-[60%] h-[80%] z-0 pointer-events-none rounded-br-2xl sm:rounded-br-[1.75rem] overflow-hidden">
          <div className="absolute inset-0 flex items-end justify-end transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1 will-change-transform origin-bottom-right">
            <img
              src={image}
              alt=""
              className="w-full h-full object-contain object-right-bottom"
              style={{
                maskImage: "linear-gradient(to top left, black 65%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to top left, black 65%, transparent 100%)",
              }}
            />
          </div>
        </div>

        <div className="relative z-10 p-3 sm:p-5 md:p-6 flex flex-col h-full min-h-[160px] sm:min-h-[200px] md:min-h-[220px]">
          {/* Top row */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ backgroundColor: a.dot }}
                />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: a.dot }} />
              </span>
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.18em] text-slate-400 font-bold">
                Active
              </span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full
                             bg-slate-50 text-slate-500 border border-slate-100 tracking-wide">
              {tag}
            </span>
          </div>

          {/* Icon container */}
          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center
                          mb-2 sm:mb-3 shadow-sm transition-all duration-300
                          group-hover:shadow-md group-hover:-translate-y-0.5
                          ${a.bg} ${a.text} ${a.borderClass} border`}>
            {icon}
          </div>

          {/* Text */}
          <h3 className="font-bold text-base sm:text-xl text-slate-900 leading-tight mb-0.5 tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] sm:text-sm text-slate-500 max-w-none sm:max-w-[65%] leading-relaxed">
            {subtitle}
          </p>

          {/* Footer */}
          <div className="mt-auto pt-2 sm:pt-3 border-t border-slate-50/80 flex items-center justify-between">
            <span className="font-mono text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {stat}
            </span>
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center
                         bg-slate-900 text-white shadow-md
                         opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0
                         transition-all duration-300"
            >
              <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
