"use client";

import Link from "next/link";
import Reveal from "../Reveal";

const BENEFITS = [
  {
    icon: "workspace_premium",
    title: "Volunteer Certificate",
    desc: "Earn recognized certificates for every rescue mission you participate in.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: "badge",
    title: "Digital ID Card",
    desc: "Get a verified digital volunteer ID with your credentials and mission history.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: "query_stats",
    title: "Track Your Impact",
    desc: "See exactly how many lives you've saved with your personal impact dashboard.",
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  {
    icon: "group",
    title: "Join a Community",
    desc: "Connect with a growing network of like-minded animal lovers and rescue heroes.",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
];

export default function VolunteerSection() {
  return (
    <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden bg-[#FDF8F3] border-b border-[#1C1614]/5">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-dot-pattern opacity-5 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Content */}
          <div className="flex flex-col items-start text-left">
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#9c3e23] font-semibold mb-4 block">
                Join the Movement
              </span>
            </Reveal>

            <Reveal>
              <h2 className="font-display italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1C1614] leading-[1.1]">
                Become a rescue volunteer
              </h2>
            </Reveal>

            <Reveal>
              <p className="text-slate-500 text-base md:text-lg font-sans leading-relaxed mt-6 max-w-lg">
                Join India's community-driven network of animal rescue volunteers. 
                No previous experience is needed — just empathy, dedication, and a smartphone.
              </p>
            </Reveal>

            {/* Benefits Cards Grid */}
            <Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 w-full">
                {BENEFITS.map((b) => (
                  <div
                    key={b.title}
                    className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#1C1614]/5 shadow-sm hover:shadow-[0_8px_30px_rgba(156,62,35,0.04)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined text-xl font-bold ${b.color}`}>
                        {b.icon}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1C1614] font-sans">
                        {b.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* CTA Button */}
            <Reveal>
              <div className="mt-8 w-full sm:w-auto">
                <Link
                  href="/volunteer-form"
                  className="bg-primary text-on-primary font-bold text-sm sm:text-base rounded-2xl py-4 px-8 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-primary/25 inline-flex items-center justify-center gap-2.5 group"
                >
                  <span className="material-symbols-outlined text-lg font-bold">
                    volunteer_activism
                  </span>
                  <span>Apply as volunteer</span>
                  <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Visual ID Card Mockup */}
          <div className="w-full flex justify-center">
            <Reveal>
              <div className="relative flex justify-center items-center py-8 px-4 w-full max-w-[460px]">
                
                {/* Background decorative depth cards */}
                <div className="absolute w-[82%] h-[290px] bg-primary/5 rounded-[2.5rem] rotate-3 translate-y-6 -z-10" />
                <div className="absolute w-[90%] h-[300px] bg-secondary/5 rounded-[2.5rem] -rotate-2 translate-y-3 -z-10 shadow-sm" />

                {/* Main Volunteer ID Card */}
                <div className="relative z-20 w-full bg-white rounded-[2.5rem] shadow-2xl border border-[#1C1614]/5 overflow-hidden">
                  
                  {/* Header gradient banner */}
                  <div className="bg-gradient-to-r from-[#9c3e23] to-[#bc5639] px-6 sm:px-8 py-5 sm:py-6 text-white flex justify-between items-center">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.2em] opacity-80">
                        ANIMAL SATHI
                      </p>
                      <p className="text-base sm:text-lg font-extrabold mt-1 font-sans">
                        Volunteer ID Card
                      </p>
                    </div>
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-white">
                        pets
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="px-6 sm:px-8 py-6 sm:py-8 space-y-6">
                    
                    {/* User profile details */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-lg sm:text-xl font-bold text-primary shrink-0">
                        AS
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-[#1C1614] font-sans">
                          Arjun Singh
                        </h4>
                        <p className="text-xs text-slate-400 font-sans">
                          Verified Volunteer • Delhi NCR
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-outlined text-sm text-emerald-600 font-bold">
                            verified
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide font-sans">
                            Rescuer verified
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Rescues", value: "47" },
                        { label: "Hours", value: "312" },
                        { label: "Rating", value: "4.9" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="bg-[#1C1614]/5 rounded-2xl p-3 text-center border border-[#1C1614]/5"
                        >
                          <p className="text-base sm:text-lg font-extrabold text-[#1C1614] font-sans">
                            {s.value}
                          </p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-sans">
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Footer barcode/ID */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#1C1614]/10">
                      <span className="text-[9px] sm:text-[10px] font-mono text-slate-400">
                        ID: AS-2026-DEL-047
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase font-sans">
                          Active Status
                        </span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}
