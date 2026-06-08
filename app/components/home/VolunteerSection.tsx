"use client";

import Link from "next/link";
import { 
  Award, 
  IdCard, 
  Activity, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CircleDot,
  CheckCircle2,
  Radio,
  MapPin,
  Wifi
} from "lucide-react";
import Reveal from "../Reveal";

const BENEFITS = [
  {
    icon: Award,
    title: "Volunteer Certificate",
    desc: "Earn recognized certificates for rescue participation.",
    color: "text-[#ff5a24] bg-[#fff2ec] border-[#ffd8c8]",
  },
  {
    icon: IdCard,
    title: "Digital ID Card",
    desc: "Get a verified digital volunteer ID with dynamic telemetry.",
    color: "text-[#d48600] bg-[#fff8e8] border-[#f8dfaa]",
  },
  {
    icon: Activity,
    title: "Track Your Impact",
    desc: "Real-time updates on lives saved with a personal dashboard.",
    color: "text-[#12976e] bg-[#edf9f4] border-[#c9efe2]",
  },
  {
    icon: Users,
    title: "Active Community",
    desc: "Coordinate immediately with regional NGOs and veterinary staff.",
    color: "text-[#1d4ed8] bg-[#eff6ff] border-[#bfdbfe]",
  },
];

export default function VolunteerSection() {
  return (
    <section className="relative isolate py-20 md:py-28 lg:py-32 overflow-hidden bg-[#fff8f0] text-[#151d19] border-b border-[#1C1614]/5">
      {/* Background grids matching HeroSection */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#9fb7aa_1px,transparent_1px),linear-gradient(to_bottom,#9fb7aa_1px,transparent_1px)] bg-[size:58px_58px]" />
        <div className="absolute inset-0 opacity-[0.2] bg-[radial-gradient(circle_at_70%_30%,rgba(255,90,36,0.15),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(18,151,110,0.1),transparent_30%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Benefits & Actions */}
          <div className="flex flex-col items-start space-y-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd8c8] bg-white/78 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#ff5a24] shadow-sm backdrop-blur">
                <CircleDot className="h-3.5 w-3.5 animate-pulse" />
                Join the Movement
              </div>
            </Reveal>
            
            <Reveal>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-[-0.03em] text-[#151d19]">
                Become a rescue <br className="hidden sm:inline" />
                <span className="text-[#ff5a24]">volunteer hero.</span>
              </h2>
            </Reveal>

            <Reveal>
              <p className="text-base text-[#58655f] font-semibold leading-relaxed max-w-xl">
                Receive immediate, location-verified alerts within approximately 7 km of your coordinates. No experience is required—simply connect, coordinate, and save animal lives.
              </p>
            </Reveal>

            {/* Grid of benefit modules */}
            <Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
                {BENEFITS.map((b, idx) => {
                  const Icon = b.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-5 rounded-2xl border border-[#eadfd5] bg-white/78 backdrop-blur-sm shadow-sm hover:border-[#ff5a24]/30 hover:bg-white transition-all duration-300 group"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${b.color}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-[#151d19]">{b.title}</h4>
                        <p className="text-xs font-semibold text-[#58655f] leading-normal">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            {/* Premium CTA Button */}
            <Reveal>
              <div className="pt-4 w-full sm:w-auto">
                <Link
                  href="/volunteer-form"
                  className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-[#ff5a24] px-8 text-sm font-extrabold text-white shadow-[0_20px_38px_-20px_rgba(255,90,36,0.82)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff6b35] active:scale-[0.98]"
                >
                  Apply as Volunteer
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Console Structure containing Larger ID Card */}
          <div className="w-full flex justify-center">
            <Reveal>
              <div className="relative w-full max-w-[580px] p-2">
                {/* Backlight glowing circle behind console */}
                <div className="absolute -inset-4 rounded-[2.5rem] bg-[#fdbba3]/25 blur-3xl -z-10" />

                {/* Main Console Box (Matches Hero style) */}
                <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/82 shadow-[0_34px_90px_-46px_rgba(53,38,28,0.62)] backdrop-blur-xl">
                  <div className="grid min-h-[480px] md:grid-cols-[190px_1fr]">
                    
                    {/* Console Sidebar (aside) */}
                    <aside className="border-b border-[#eadfd5] bg-white/88 p-5 md:border-b-0 md:border-r flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-black text-[#151d19]">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff5a24] text-white">
                            🐾
                          </span>
                          Rescuer Hub
                        </div>

                        {/* Status bar */}
                        <div className="mt-6 rounded-2xl border border-[#d8eee5] bg-[#f7fffb] p-3">
                          <div className="flex items-center gap-2.5">
                            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dcf7ed] text-[#12976e]">
                              <span className="absolute h-2 w-2 animate-ping rounded-full bg-[#39c894]/45" />
                              <Radio className="relative h-3.5 w-3.5" />
                            </span>
                            <div>
                              <p className="text-[10px] font-black text-[#17211c] leading-tight">Live Status</p>
                              <p className="text-[8px] font-bold text-[#12976e] uppercase tracking-wider mt-0.5">Active</p>
                            </div>
                          </div>
                        </div>

                        {/* Console Info parameters */}
                        <div className="mt-6 space-y-4">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#7b8b83]">System Node</p>
                            <p className="text-[10px] font-bold text-[#151d19] mt-1 flex items-center gap-1.5">
                              <Wifi className="w-3.5 h-3.5 text-[#ff5a24]" />
                              Delhi NCR Node
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#7b8b83]">Scan Range</p>
                            <p className="text-[10px] font-bold text-[#151d19] mt-1 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#ff5a24]" />
                              7.0 KM radius
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Barcode details */}
                      <div className="mt-8 pt-4 border-t border-[#eadfd5] text-[9px] font-mono text-slate-400">
                        SYS: PawSOS-v2.1
                      </div>
                    </aside>

                    {/* Console Main Content Area (Larger ID Card display) */}
                    <div className="relative bg-[#fffdfa] p-6 flex flex-col justify-between">
                      {/* Grid background overlay */}
                      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#9fb7aa_1px,transparent_1px),linear-gradient(to_bottom,#9fb7aa_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                      {/* Header row */}
                      <div className="relative z-10 flex justify-between items-center pb-4 border-b border-[#eadfd5]">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7b8b83]">Volunteer Profile Record</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#edf9f4] border border-[#c9efe2] text-[8px] font-bold text-[#12976e]">
                          Rescuer Verified
                        </span>
                      </div>

                      {/* Large profile details section */}
                      <div className="relative z-10 my-6 flex flex-col items-center text-center space-y-4">
                        {/* Enlarged photo placeholder */}
                        <div className="relative shrink-0">
                          <div className="w-24 h-24 rounded-3xl bg-[#ff5a24]/10 border-2 border-[#ffd8c8] flex items-center justify-center text-3xl font-black text-[#ff5a24] shadow-md shadow-orange-100/50">
                            AS
                          </div>
                          <div className="absolute -bottom-1.5 -right-1.5 bg-white rounded-full p-1.5 shadow-sm border border-[#eadfd5]">
                            <ShieldCheck className="w-5 h-5 text-[#12976e] fill-[#12976e]/10" />
                          </div>
                        </div>

                        {/* Name and titles */}
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-[#151d19] tracking-tight">Arjun Singh</h4>
                          <p className="text-xs font-bold text-[#ff5a24] uppercase tracking-wider">Level 3 Gold Responder</p>
                          <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            Greater Noida, Uttar Pradesh
                          </p>
                        </div>
                      </div>

                      {/* Larger telemetry stats layout */}
                      <div className="relative z-10 grid grid-cols-3 gap-3 pt-4 border-t border-[#eadfd5]">
                        {[
                          { label: "Rescues", value: "47 Cases", desc: "Life saving missions" },
                          { label: "Hours", value: "312 Hrs", desc: "Duty time logged" },
                          { label: "Rating", value: "4.9 ★", desc: "Community score" },
                        ].map((stat, idx) => (
                          <div key={idx} className="bg-white border border-[#eadfd5] rounded-2xl p-3 text-center shadow-sm">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                            <p className="text-sm font-black text-[#151d19] mt-1.5 leading-none">{stat.value}</p>
                            <p className="text-[7px] text-slate-400 mt-1 leading-none">{stat.desc}</p>
                          </div>
                        ))}
                      </div>

                      {/* Holographic scanner tag */}
                      <div className="relative z-10 mt-6 pt-4 border-t border-[#eadfd5] flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>SYS ID: AS-2026-DEL-047</span>
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#ff5a24]" />
                          <span className="font-bold text-[#ff5a24] uppercase tracking-wider">Priority Node</span>
                        </div>
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
