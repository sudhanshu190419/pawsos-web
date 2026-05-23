"use client";

import { memo } from "react";
import { ArrowRight, ShieldCheck, Zap, Star } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   HERO STYLES
───────────────────────────────────────────────────────────── */
export const HeroStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300;1,9..144,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

    .hs-serif { font-family: 'Fraunces', Georgia, serif; }
    .hs-sans  { font-family: 'DM Sans', system-ui, sans-serif; }

    /* ── Entrance animations ── */
    @keyframes hs-up {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hs-a1 { animation: hs-up .6s cubic-bezier(.16,1,.3,1) .05s both; }
    .hs-a2 { animation: hs-up .6s cubic-bezier(.16,1,.3,1) .18s both; }
    .hs-a3 { animation: hs-up .6s cubic-bezier(.16,1,.3,1) .30s both; }
    .hs-a4 { animation: hs-up .6s cubic-bezier(.16,1,.3,1) .42s both; }

    /* ── 3-D scene ── */
    .hs-scene {
      perspective: 900px;
      perspective-origin: 50% 40%;
    }

    @keyframes hs-orbit {
      from { transform: rotateY(0deg) rotateX(6deg); }
      to   { transform: rotateY(360deg) rotateX(6deg); }
    }
    .hs-orbit {
      transform-style: preserve-3d;
      animation: hs-orbit 22s linear infinite;
    }
    .hs-orbit:hover { animation-play-state: paused; }

    /* faces of the 3-D hexagonal prism stand-in (flat card faces) */
    .hs-face {
      position: absolute;
      inset: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }

    /* floating bob for the central sphere */
    @keyframes hs-bob {
      0%,100% { transform: translateY(0) rotateX(4deg); }
      50%      { transform: translateY(-10px) rotateX(4deg); }
    }
    .hs-bob {
      transform-style: preserve-3d;
      animation: hs-bob 6s ease-in-out infinite;
    }

    /* ring spin */
    @keyframes hs-ring {
      from { transform: rotateX(70deg) rotateZ(0deg); }
      to   { transform: rotateX(70deg) rotateZ(360deg); }
    }
    .hs-ring {
      animation: hs-ring 18s linear infinite;
    }
    .hs-ring-r {
      animation: hs-ring 26s linear infinite reverse;
    }

    /* orbiting dot */
    @keyframes hs-dot-orbit {
      from { transform: rotateX(70deg) rotateZ(0deg) translateX(82px) rotateX(-70deg); }
      to   { transform: rotateX(70deg) rotateZ(360deg) translateX(82px) rotateX(-70deg); }
    }
    .hs-dot {
      animation: hs-dot-orbit 18s linear infinite;
    }

    /* card pill float */
    @keyframes hs-pill {
      0%,100% { transform: translateY(0px) translateZ(0px); }
      50%      { transform: translateY(-6px) translateZ(0px); }
    }

    /* CTA hover */
    .hs-btn-primary {
      background: #111;
      color: #fff;
      transition: background .15s, transform .15s, box-shadow .18s;
    }
    .hs-btn-primary:hover {
      background: #000;
      transform: translateY(-1px);
      box-shadow: 0 10px 28px rgba(0,0,0,.22);
    }
    .hs-btn-secondary {
      background: transparent;
      color: #111;
      border: 1.5px solid #d4d4d4;
      transition: border-color .15s, background .15s, transform .15s;
    }
    .hs-btn-secondary:hover {
      border-color: #aaa;
      background: #fafafa;
      transform: translateY(-1px);
    }

    /* marquee */
    @keyframes hs-marquee {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    .hs-marquee { animation: hs-marquee 24s linear infinite; }
    .hs-marquee:hover { animation-play-state: paused; }

    /* trust pill hover */
    .hs-trust {
      transition: transform .18s, box-shadow .18s;
    }
    .hs-trust:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(0,0,0,.07);
    }
  `}</style>
);

/* ─────────────────────────────────────────────────────────────
   MARQUEE
───────────────────────────────────────────────────────────── */
const ITEMS = [
  "🐾  Vet-Approved Products",
  "🚀  Same-Day Delivery",
  "💊  Clinical-Grade Medicines",
  "🏥  500+ Partner Clinics",
  "⭐  4.9 / 5 Rating",
  "🐕  10,000+ Pet Parents",
  "🔬  Lab-Tested Nutrition",
  "📦  50,000+ Orders Delivered",
];

const Marquee = () => (
  <div className="overflow-hidden border-t border-neutral-100 py-2.5 bg-neutral-50/70">
    <div className="hs-marquee flex whitespace-nowrap">
      {[...ITEMS, ...ITEMS].map((item, i) => (
        <span key={i} className="hs-sans inline-flex items-center text-[11px] font-medium text-neutral-400 px-7">
          {item}
          <span className="ml-7 w-[3px] h-[3px] rounded-full bg-neutral-300 inline-block" />
        </span>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   3-D VISUAL — CSS-only, no canvas
   A bobbing sphere + two tilted rings + floating mini-cards
───────────────────────────────────────────────────────────── */
const Visual3D = () => (
  <div className="hs-scene w-full h-[340px] relative select-none">

    {/* ── Ambient glow behind sphere ── */}
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full pointer-events-none"
      style={{
        background: "radial-gradient(circle, rgba(251,146,60,.18) 0%, transparent 70%)",
        filter: "blur(24px)",
      }}
    />

    {/* ── Central sphere (CSS 3-D feel via layered shadows) ── */}
    <div
      className="hs-bob absolute left-1/2 top-1/2"
      style={{ marginLeft: -52, marginTop: -52 }}
    >
      <div
        className="w-[104px] h-[104px] rounded-full"
        style={{
          background: "radial-gradient(circle at 36% 34%, #fff 0%, #f5ece0 45%, #e8d4b8 100%)",
          boxShadow:
            "inset -10px -10px 24px rgba(0,0,0,.12), inset 4px 4px 14px rgba(255,255,255,.9), 0 24px 48px rgba(0,0,0,.16), 0 4px 12px rgba(0,0,0,.1)",
        }}
      >
        {/* paw emblem */}
        <div className="absolute inset-0 flex items-center justify-center text-[40px] leading-none" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,.1))" }}>
          🐾
        </div>
      </div>
    </div>

    {/* ── Ring 1 (tilted) ── */}
    <div
      className="hs-ring absolute left-1/2 top-1/2"
      style={{
        marginLeft: -82, marginTop: -82,
        width: 164, height: 164,
        borderRadius: "50%",
        border: "1.5px solid rgba(251,146,60,.3)",
        transformStyle: "preserve-3d",
      }}
    />

    {/* ── Ring 2 (reverse, slightly bigger) ── */}
    <div
      className="hs-ring-r absolute left-1/2 top-1/2"
      style={{
        marginLeft: -110, marginTop: -110,
        width: 220, height: 220,
        borderRadius: "50%",
        border: "1px dashed rgba(180,180,180,.35)",
        transformStyle: "preserve-3d",
      }}
    />

    {/* ── Orbiting dot on ring 1 ── */}
    <div
      className="hs-dot absolute left-1/2 top-1/2"
      style={{
        marginLeft: -5, marginTop: -5,
        width: 10, height: 10,
        borderRadius: "50%",
        background: "#f97316",
        boxShadow: "0 0 10px rgba(249,115,22,.6)",
        transformStyle: "preserve-3d",
      }}
    />

    {/* ── Floating mini product card — top-left ── */}
    <div
      className="absolute"
      style={{
        top: 36, left: 16,
        animation: "hs-pill 5.5s ease-in-out infinite",
        animationDelay: "0s",
      }}
    >
      <div
        className="hs-sans flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-2.5 w-[172px]"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,.10), 0 1px 3px rgba(0,0,0,.06)", border: "1px solid rgba(0,0,0,.06)" }}
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[18px] flex-shrink-0">
          💊
        </div>
        <div>
          <p className="text-[12px] font-semibold text-neutral-800 leading-tight">Drontal Puppy</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded-md">Vet Pick</span>
            <span className="text-[11px] font-bold text-neutral-900">₹349</span>
          </div>
        </div>
      </div>
    </div>

    {/* ── Floating mini product card — bottom-right ── */}
    <div
      className="absolute"
      style={{
        bottom: 44, right: 12,
        animation: "hs-pill 7s ease-in-out infinite",
        animationDelay: "1.5s",
      }}
    >
      <div
        className="hs-sans flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-2.5 w-[172px]"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,.10), 0 1px 3px rgba(0,0,0,.06)", border: "1px solid rgba(0,0,0,.06)" }}
      >
        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[18px] flex-shrink-0">
          🦴
        </div>
        <div>
          <p className="text-[12px] font-semibold text-neutral-800 leading-tight">Royal Canin</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-bold text-white bg-orange-500 px-1.5 py-0.5 rounded-md">Bestseller</span>
            <span className="text-[11px] font-bold text-neutral-900">₹2,199</span>
          </div>
        </div>
      </div>
    </div>

    {/* ── Vet verified pill — top-right ── */}
    <div
      className="absolute"
      style={{
        top: 20, right: 8,
        animation: "hs-pill 6s ease-in-out infinite",
        animationDelay: "3s",
      }}
    >
      <div
        className="hs-sans inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,.09)", border: "1px solid rgba(16,185,129,.2)" }}
      >
        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700">Vet Verified</span>
      </div>
    </div>

    {/* ── Rating pill — bottom-left ── */}
    <div
      className="absolute"
      style={{
        bottom: 30, left: 8,
        animation: "hs-pill 8s ease-in-out infinite",
        animationDelay: "2s",
      }}
    >
      <div
        className="hs-sans inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,.09)", border: "1px solid rgba(0,0,0,.06)" }}
      >
        <span className="text-amber-400 text-[12px]">★</span>
        <span className="text-[11px] font-semibold text-neutral-700">4.9 · 10k+ parents</span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   TRUST BADGES
───────────────────────────────────────────────────────────── */
const TRUST = [
  { icon: ShieldCheck, label: "Vet Verified",  color: "text-emerald-600", bg: "bg-emerald-50/80",  border: "border-emerald-100" },
  { icon: Zap,         label: "Fast Delivery", color: "text-blue-600",    bg: "bg-blue-50/80",     border: "border-blue-100"    },
  { icon: Star,        label: "Safe & Tested", color: "text-orange-500",  bg: "bg-orange-50/80",   border: "border-orange-100"  },
];

/* ─────────────────────────────────────────────────────────────
   STATS
───────────────────────────────────────────────────────────── */
const STATS = [
  { value: "10k+", label: "Pet parents" },
  { value: "500+", label: "Verified vets" },
  { value: "50k+", label: "Deliveries" },
];

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
const ShopHero = memo(({ onShopNow, onExplore }: { onShopNow?: () => void; onExplore?: () => void }) => (
  <section className="hs-sans relative overflow-hidden mb-6 sm:mb-8 bg-white">

    {/* very subtle warm tint */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 55% 90% at 80% 50%, rgba(251,146,60,.04) 0%, transparent 65%)",
      }}
    />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-12 lg:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

        {/* ── LEFT ── */}
        <div className="space-y-6">

          {/* eyebrow */}
          <div className="hs-a1">
            <span
              className="hs-sans inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-orange-600"
              style={{ background: "linear-gradient(135deg,#fff7f0,#fff3e8)", border: "1px solid #fbd9b8" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              India's Premier Pet Wellness Marketplace
            </span>
          </div>

          {/* headline — Fraunces optical serif, lightweight + italic accent */}
          <div className="hs-a2">
            <h1 className="hs-serif text-[2.1rem] sm:text-[2.75rem] lg:text-[3.1rem] font-[300] leading-[1.1] tracking-[-0.025em] text-neutral-900">
              Trusted care for
              <br />
              <em className="not-italic font-[500] text-orange-500">every paw.</em>
            </h1>
          </div>

          {/* supporting text */}
          <div className="hs-a3">
            <p className="text-[14.5px] text-neutral-500 leading-[1.7] max-w-[400px]">
              Vet-verified essentials — clinical medicines, premium nutrition, and trusted accessories for healthier, happier pets.
            </p>
          </div>

          {/* stats */}
          <div className="hs-a3 flex gap-7">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-[19px] font-[600] text-neutral-900 leading-none tracking-tight">{value}</p>
                <p className="text-[10.5px] text-neutral-400 mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="hs-a4 flex flex-wrap gap-2.5">
            <button onClick={onShopNow} className="hs-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-[500]">
              Shop Now
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={onExplore} className="hs-btn-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-[500]">
              Explore Categories
            </button>
          </div>

          {/* trust pills */}
          <div className="hs-a4 flex flex-wrap gap-2">
            {TRUST.map(({ icon: Icon, label, color, bg, border }) => (
              <span
                key={label}
                className={`hs-trust inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-[500] border ${bg} ${border} ${color}`}
              >
                <Icon className="w-3 h-3" strokeWidth={2.5} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: 3-D scene ── */}
        <div className="relative">
          <Visual3D />
        </div>
      </div>
    </div>

    {/* marquee divider */}
    <Marquee />
  </section>
));

ShopHero.displayName = "ShopHero";
export default ShopHero;