"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Ambulance,
  Building2,
  Stethoscope,
  Hospital,
  Heart
} from "lucide-react";

// 1. NGO Live Map Mockup
function NgoDashboardMockup() {
  return (
    <div className="w-full bg-[#151d19] text-white rounded-2xl p-5 font-sans overflow-hidden border border-white/5 relative h-[300px] flex flex-col justify-between">
      {/* Simulation Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E07A5F] animate-ping" />
          <span className="text-[10px] uppercase tracking-wider text-white/80 font-bold font-mono">Live Dispatch Feed</span>
        </div>
        <span className="text-[9px] text-white/40 font-mono">ID: #NGO-402</span>
      </div>
      
      {/* Simulation Grid */}
      <div className="grid grid-cols-12 gap-3 flex-grow my-3 items-stretch z-10">
        {/* Map Area */}
        <div className="col-span-8 bg-[#1f2824] rounded-xl relative overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_14px]" />
          
          {/* Rescue Sighting Beacon */}
          <div className="absolute top-[35%] left-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="relative flex h-7 w-7 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E07A5F] opacity-75" />
              <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-[#E07A5F] border border-white flex items-center justify-center shadow">
                <Heart className="w-2.5 h-2.5 text-white" fill="currentColor" />
              </span>
            </span>
            <span className="text-[8px] bg-black/75 px-1.5 py-0.5 rounded-md text-white/95 mt-1 border border-white/5 font-mono">Injured Cat</span>
          </div>

          {/* Rescuer Van Moving Pin */}
          <div className="absolute bottom-[25%] left-[20%] flex items-center gap-1">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="w-5.5 h-5.5 bg-[#F4A261] rounded-lg border border-white flex items-center justify-center shadow"
            >
              <Ambulance className="w-3.5 h-3.5 text-white" />
            </motion.div>
            <span className="text-[7.5px] bg-black/75 px-1.5 py-0.5 rounded-md text-white/70 font-mono">Van #1</span>
          </div>
        </div>

        {/* Info Column */}
        <div className="col-span-4 flex flex-col gap-2 justify-center">
          <div className="bg-[#1a2320] p-2.5 rounded-lg border border-white/5">
            <div className="text-[8px] text-white/45 uppercase font-mono">Active Incidents</div>
            <div className="text-xl font-black text-[#E07A5F] mt-0.5 font-mono">03</div>
          </div>
          <div className="bg-[#1a2320] p-2.5 rounded-lg border border-white/5 flex-grow flex flex-col justify-between">
            <div>
              <div className="text-[8px] text-white/40 uppercase font-mono">Active Driver</div>
              <div className="text-[10px] font-bold mt-1 text-slate-200">Arjun Singh</div>
            </div>
            <div className="text-[8px] text-[#81B29A] bg-[#81B29A]/10 border border-[#81B29A]/20 px-2 py-0.5 rounded-md text-center font-bold font-mono mt-1">
              CONNECTED
            </div>
          </div>
        </div>
      </div>

      {/* Bottom coordination update */}
      <div className="text-[8.5px] text-[#81B29A]/95 font-mono flex items-center gap-1.5 bg-[#1a2320] px-2.5 py-1.5 rounded-lg border border-[#81B29A]/10 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-[#81B29A] animate-pulse" />
        <span>Incident dispatch matching successfully routed to Sector 7.</span>
      </div>
    </div>
  );
}

// 2. Vet Appointment Calendar Mockup
function VetCalendarMockup() {
  return (
    <div className="w-full bg-[#fffbf7] text-[#151d19] rounded-2xl p-5 font-sans overflow-hidden border border-[#ffd8c8] relative h-[300px] flex flex-col justify-between">
      {/* Calendar header */}
      <div className="flex justify-between items-center border-b border-[#ffd8c8] pb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#81B29A]" />
          <span className="text-[10px] uppercase tracking-wider text-slate-700 font-bold font-mono">Dr. Ananya&apos;s Calendar</span>
        </div>
        <span className="text-[9px] text-slate-400 font-mono">Today, 14:02</span>
      </div>

      {/* Calendar Slots */}
      <div className="grid grid-cols-12 gap-3 flex-grow my-3 items-stretch z-10">
        {/* Hours Column */}
        <div className="col-span-3 text-[9px] text-slate-400 flex flex-col justify-between py-1 font-mono">
          <div>14:00</div>
          <div>14:30</div>
          <div>15:00</div>
          <div>15:30</div>
        </div>

        {/* Appointment details cards */}
        <div className="col-span-9 flex flex-col gap-2.5 justify-center">
          <div className="bg-[#edf9f4] border-l-4 border-[#81B29A] p-2.5 rounded-r-xl shadow-sm border border-emerald-100/50">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-black text-[#151d19]">Leo (Checkup)</span>
              <span className="text-[7.5px] bg-[#81B29A] text-white px-1.5 py-0.5 rounded-md font-mono font-bold">Video Consult</span>
            </div>
            <p className="text-[8.5px] text-[#58655f] mt-1 font-medium">14:00 - 14:30 • Active Now</p>
          </div>

          <div className="bg-[#fff0ea] border-l-4 border-[#E07A5F] p-2.5 rounded-r-xl shadow-sm border border-orange-100/50 opacity-90">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-black text-[#151d19]">Sheru (Post-Op Check)</span>
              <span className="text-[7.5px] bg-[#E07A5F] text-white px-1.5 py-0.5 rounded-md font-mono font-bold">Clinic Visit</span>
            </div>
            <p className="text-[8.5px] text-[#58655f] mt-1 font-medium">15:00 - 15:30 • Confirmed</p>
          </div>
        </div>
      </div>

      {/* Status Bar info */}
      <div className="text-[8.5px] text-[#E07A5F] font-mono flex items-center justify-between border-t border-[#ffd8c8] pt-2.5 z-10">
        <span>Available Consult Hours: 4 hrs</span>
        <span className="font-bold">2 Appointments Prepped</span>
      </div>
    </div>
  );
}

// 3. Hospital Ward Admissions Mockup
function HospitalWardMockup() {
  return (
    <div className="w-full bg-[#fffbf7] text-[#151d19] rounded-2xl p-5 font-sans overflow-hidden border border-[#ffd8c8] relative h-[300px] flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#ffd8c8] pb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E9C46A]" />
          <span className="text-[10px] uppercase tracking-wider text-slate-700 font-bold font-mono">Ward Manager Dashboard</span>
        </div>
        <span className="text-[9px] text-slate-400 font-mono">ICU Occupancy: 65%</span>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-2.5 flex-grow my-3 items-stretch z-10">
        {/* Column 1: Triage */}
        <div className="bg-[#fff8f0] rounded-xl p-2 border border-slate-200/50 flex flex-col gap-1.5">
          <span className="text-[8px] font-extrabold uppercase text-[#58655f]/60 font-mono">Triage (01)</span>
          <div className="bg-white p-2 rounded-lg border border-[#ffd8c8]/40 shadow-[0_4px_12px_rgba(53,38,28,0.02)]">
            <span className="text-[10px] font-bold text-slate-800">Bruno</span>
            <span className="block text-[7.5px] text-red-500 font-bold mt-0.5 uppercase font-mono">Critical</span>
          </div>
        </div>

        {/* Column 2: ICU Treatment */}
        <div className="bg-[#fff5ea] rounded-xl p-2 border border-[#E9C46A]/25 flex flex-col gap-1.5">
          <span className="text-[8px] font-extrabold uppercase text-[#D69F27] font-mono">ICU Wards (01)</span>
          <div className="bg-white p-2 rounded-lg border border-[#ffd8c8]/30 shadow-[0_4px_12px_rgba(53,38,28,0.02)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#E9C46A]" />
            <span className="text-[10px] font-bold block text-slate-800">Lucy</span>
            <span className="text-[7.5px] text-[#16a37a] font-bold block mt-0.5 uppercase font-mono">Stable</span>
          </div>
        </div>

        {/* Column 3: Recovery Ward */}
        <div className="bg-[#fff8f0] rounded-xl p-2 border border-slate-200/50 flex flex-col gap-1.5">
          <span className="text-[8px] font-extrabold uppercase text-[#58655f]/60 font-mono">Recovery (02)</span>
          <div className="bg-white p-2 rounded-lg border border-slate-200/40 shadow-[0_4px_12px_rgba(53,38,28,0.01)] opacity-70">
            <span className="text-[10px] font-bold block text-slate-700">Milo</span>
            <span className="text-[7.5px] text-slate-400 font-bold block mt-0.5 uppercase font-mono">Released</span>
          </div>
        </div>
      </div>

      {/* Ward footer data */}
      <div className="text-[8.5px] text-[#D69F27] font-mono flex items-center justify-between border-t border-[#ffd8c8] pt-2.5 z-10">
        <span>Ward Capacity: 12 Beds</span>
        <span className="font-bold">Bed #4 Ready</span>
      </div>
    </div>
  );
}

const TAB_DATA = {
  ngo: {
    icon: Building2,
    badge: "NGO partners",
    title: "NGO Command Center",
    tagline: "Coordinate Rescues at Scale",
    desc: "Gain access to our volunteer dispatcher dashboard. Track live cases within your region, deploy response teams via GPS routing, and sync emergency treatments directly with partner clinics.",
    cta: "Apply as NGO Partner",
    href: "/onboarding",
    color: "#E07A5F", // Warm Ochre
    accentBg: "bg-[#fff0ea] border-[#ffd8c8] text-[#E07A5F]",
    mockup: <NgoDashboardMockup />
  },
  vet: {
    icon: Stethoscope,
    badge: "Veterinarians",
    title: "Veterinary Workspace",
    tagline: "Manage Consults & Appointments",
    desc: "Join India's premier veterinary network. Setup clinic consulting hours, customize remote video consult pricing, digitize patient medical charts, and receive emergency triage support cases.",
    cta: "Register as Veterinarian",
    href: "/vets",
    color: "#81B29A", // Healing Sage Green
    accentBg: "bg-emerald-50 border-emerald-100 text-[#81B29A]",
    mockup: <VetCalendarMockup />
  },
  hospital: {
    icon: Hospital,
    badge: "Animal Hospitals",
    title: "Hospital Admissions",
    tagline: "Ward Management & Referrals",
    desc: "Streamline animal admissions. Track treatment statuses across triage and recovery wards, manage referrals between local NGOs, and list ICU bed availability to rescuers in real time.",
    cta: "Onboard Hospital",
    href: "/onboarding/organization",
    color: "#D69F27", // Golden Amber
    accentBg: "bg-amber-50 border-amber-100 text-[#D69F27]",
    mockup: <HospitalWardMockup />
  }
};

type TabKey = "ngo" | "vet" | "hospital";

export default function JoinMovement() {
  const [activeTab, setActiveTab] = useState<TabKey>("ngo");
  const active = TAB_DATA[activeTab];

  return (
    <section className="relative bg-[#fff8f0] py-20 md:py-28 lg:py-36 overflow-hidden">
      {/* Decorative organic background shape */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#ff5a24]/3 via-[#16a37a]/3 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        
        {/* Full-width section header */}
        <div className="max-w-3xl mb-16 lg:mb-20 text-left">
          {/* Sparkles Trust Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff5a24]/10 border border-[#ff5a24]/20 text-[#ff5a24] text-[10px] font-extrabold tracking-wider mb-4 uppercase font-mono shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Ecosystem Partners</span>
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff5a24] font-bold mb-3 block">
            For organizations
          </span>
          <h2 className="font-display italic text-4xl sm:text-5xl lg:text-6xl text-[#151d19] leading-[1.1] max-w-[20ch]">
            Partner with us
          </h2>
          <p className="text-[#58655f] text-sm sm:text-base font-semibold mt-4 max-w-[55ch] leading-relaxed">
            Whether you are a local shelter, an established NGO, a veterinary clinic, or an animal hospital, PawSOS supplies the technology stack you need to operate at scale.
          </p>
        </div>

        {/* Split-screen layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Tab Controls & Description (Col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Custom Tab Pills Container */}
            <div className="flex gap-2 p-1.5 bg-[#f4ede4] rounded-2xl border border-[#ffd8c8]/50 shadow-inner">
              {(Object.keys(TAB_DATA) as TabKey[]).map((tabKey) => {
                const tabItem = TAB_DATA[tabKey];
                const isActive = activeTab === tabKey;
                
                return (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className="relative flex-1 py-3 text-xs font-bold rounded-xl transition-colors duration-300 z-10 uppercase tracking-wider font-mono outline-none"
                    style={{ color: isActive ? "#ffffff" : "#58655f" }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-xl -z-10 shadow"
                        style={{ backgroundColor: active.color }}
                        transition={{ type: "spring", stiffness: 260, damping: 25 }}
                      />
                    )}
                    {tabItem.badge.split(" ")[0]} {/* Shorten name for pills */}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Card Info Panel */}
            <div className="min-h-[260px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col items-start gap-4"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg border text-xs shrink-0 ${active.accentBg}`}>
                      <active.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400">
                      {active.tagline}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold font-sans text-[#151d19] tracking-tight">
                    {active.title}
                  </h3>

                  <p className="text-[#58655f] text-sm sm:text-base font-semibold leading-relaxed mt-1">
                    {active.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Dynamic CTA button */}
              <div className="mt-8">
                <Link
                  href={active.href}
                  className="group inline-flex items-center justify-center gap-2.5 text-white px-7 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] outline-none"
                  style={{
                    backgroundColor: active.color,
                    boxShadow: `0 8px 25px -6px ${active.color}44`
                  }}
                >
                  <span>{active.cta}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Simulator Display Card (Col-span-7) */}
          <div className="lg:col-span-7 bg-[#fffbf7]/90 backdrop-blur-md rounded-3xl p-6 border border-[#ffd8c8]/40 shadow-[0_20px_50px_-16px_rgba(156,62,35,0.08)] relative flex items-center justify-center overflow-hidden min-h-[340px]">
            {/* Simulated browser dots header */}
            <div className="absolute top-3 left-4 flex gap-1.5 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-red-400/50" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
              <span className="w-2 h-2 rounded-full bg-green-400/50" />
            </div>

            <div className="w-full pt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.97, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -10 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="w-full"
                >
                  {active.mockup}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
