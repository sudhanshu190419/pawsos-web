"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Play, ShieldCheck } from "lucide-react";

const stats = [
  { label: "Animals Rescued", value: "10,000+" },
  { label: "Active Volunteers", value: "2,500+" },
];

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-start justify-between overflow-hidden bg-[#1a1410]">
      {/* ─── BACKGROUND IMAGE ─── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/new-banner.png"
          alt="AnimalSathi volunteers rescuing an injured animal on a city street — community rescue in action"
          fill
          priority
          className="object-cover object-[center_30%] md:object-center"
          sizes="100vw"
        />

        {/* Deep warm gradient overlays — inspired by the Flock hero */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410] via-[#1a1410]/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-amber-600/5 to-amber-900/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1410]/90 via-[#1a1410]/50 via-[30%] md:via-[#1a1410]/40 md:via-30% to-transparent" />
      </div>

      {/* ─── GLASSMORPHISM STAT BADGE (desktop) ─── */}
      <div className="absolute top-28 right-6 md:right-12 z-20 hidden md:block animate-fadeInUp">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-4 shadow-2xl">
          <div className="flex flex-col gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-right">
                <p className="text-white text-lg font-black tracking-tight">
                  {stat.value}
                </p>
                <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative z-10 w-full px-5 sm:px-8 md:px-12 pt-10 sm:pt-10 pb-10 sm:pb-16 flex flex-col md:flex-row md:items-start justify-between gap-6 sm:gap-8">
        {/* ── TEXT COLUMN ── */}
        <div className="max-w-xl -mt-6 sm:-mt-4 md:mt-0 md:ml-[8vw] lg:ml-[10vw] animate-fadeInUp">
          {/* Category tag */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>              <span className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              <span className="sm:hidden">INDIA'S ANIMAL RESCUE NETWORK</span><span className="hidden sm:inline">TRUSTED BY ANIMAL LOVERS{" "}<br className="sm:hidden" />
              ACROSS INDIA</span>
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-[36px] sm:text-[48px] md:text-[56px] lg:text-[72px] font-bold leading-[0.95] tracking-[-0.03em] text-white max-w-[16ch]">
            Help animals{" "}
            <br className="hidden sm:block" />
            near you in{" "}
            <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-300">
              real time.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/70 font-medium leading-relaxed max-w-[56ch]">
            Receive emergency animal rescue alerts within ~7 km of your
            location. Accept a case, coordinate with NGOs and veterinarians,
            and help save lives in your community.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/volunteer-form"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-[15px] font-extrabold text-white shadow-[0_8px_32px_rgba(234,88,12,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(234,88,12,0.45)] active:scale-[0.98]"
            >
              Become a Volunteer
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/how-it-works"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-6 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-[15px] font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 hover:border-white/30 active:scale-[0.98]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
              </span>
              See How It Works
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-white/50 text-xs font-semibold">
                Completely free
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-white/50 text-xs font-semibold">
                SOS alerts within 7 KM
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-white/50 text-xs font-semibold">
                No experience needed
              </span>
            </div>
          </div>
        </div>

        {/* ── DESKTOP SCROLL INDICATOR ── */}
        <div className="hidden md:flex flex-col items-center gap-3 pb-2 animate-fadeInUp">
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.25em] [writing-mode:vertical-lr] rotate-180">
            Scroll
          </span>
          <div className="h-16 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </div>



      {/* ─── MOBILE SCROLL INDICATOR ─── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 md:hidden">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em]">
            Scroll
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
            <ArrowDown className="h-4 w-4 text-white/60" />
          </div>
        </div>
      </div>
    </section>
  );
}
