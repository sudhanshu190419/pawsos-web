"use client";

import { useState, useEffect, useRef, ComponentType } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Camera,
  MapPin,
  Bell,
  CheckCircle2,
  Heart,
  Ambulance,
  Check,
  AlertOctagon,
  ShieldCheck,
  Radio,
  Wifi,
  Battery,
  Signal,
  Award,
  Navigation,
  Sparkles,
  Activity
} from "lucide-react";

interface Step {
  step: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  accentBg: string;
  tags: string[];
  technicalLabel: string;
  technicalHighlight: string;
  bullets: string[];
}

const STEPS: Step[] = [
  {
    step: "01",
    title: "Spot an animal in need",
    description: "See a stray animal that's injured, stuck, or in danger? Open AnimalSathi and take a photo.",
    icon: Camera,
    color: "#ff5a24",
    accentBg: "bg-[#fff0ea] border-[#ffd8c8] text-[#ff5a24]",
    tags: ["10s Capture", "AI Vision Assist"],
    technicalLabel: "AI SIGHTING ASSIST",
    technicalHighlight: "Silhouettes detected via Edge AI models under low light.",
    bullets: ["98.4% silhouette lock", "10-sec offline buffer"],
  },
  {
    step: "02",
    title: "File an SOS report",
    description: "Share the location, animal category, and severity details. It takes less than 30 seconds to alert the grid.",
    icon: AlertOctagon,
    color: "#ef4444",
    accentBg: "bg-red-50 border-red-100 text-red-500",
    tags: ["Geo-Indexed", "Priority Routing"],
    technicalLabel: "GEO-COMPRESSION",
    technicalHighlight: "Coordinates encoded into compact geohash spatial indexes.",
    bullets: ["<120B telemetry packets", "Client WebP compress"],
  },
  {
    step: "03",
    title: "Nearby volunteers paged",
    description: "Verified rescuers, volunteers, and emergency drivers within a 7km radius are paged instantly.",
    icon: Bell,
    color: "#3b82f6",
    accentBg: "bg-blue-50 border-blue-150 text-blue-500",
    tags: ["7km Radial Paging", "SMS Pings"],
    technicalLabel: "PRIORITY DISPATCH",
    technicalHighlight: "Spatial radial queries locate active responders in under 2.4s.",
    bullets: ["7km radial geocall", "Encrypted location coords"],
  },
  {
    step: "04",
    title: "NGOs and vets coordinate",
    description: "Partner organizations step in, ambulance routes are optimized, and vet clinics prepare emergency rooms.",
    icon: Ambulance,
    color: "#d99418",
    accentBg: "bg-amber-50 border-amber-150 text-[#d99418]",
    tags: ["Route Optimization", "Vet Desk Alert"],
    technicalLabel: "LOGISTICS DESK OVERLAY",
    technicalHighlight: "Dispatch engine calculates traffic-optimized routes automatically.",
    bullets: ["4 min ambulance ETA", "Direct websocket chat"],
  },
  {
    step: "05",
    title: "Animal rescued & safe",
    description: "The animal receives treatment, gets transferred to a safe shelter, and you can track their recovery live.",
    icon: CheckCircle2,
    color: "#16a37a",
    accentBg: "bg-[#edf9f4] border-[#c9efe2] text-[#16a37a]",
    tags: ["Live Recovery Feed", "Zero-Cost Rescue"],
    technicalLabel: "LEDGER & LIVESTREAM",
    technicalHighlight: "Intake registration automatically connects to recovery updates.",
    bullets: ["Unified tracking case ID", "Sponsor-funded microgrants"],
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Refs for Scroll Pinning / Page Scroll Trigger (Desktop Only)
  const targetRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position of the section
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  // Map scroll value to active index (0 to 4)
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Map latest [0, 0.85] to indices 0 to 4
    // And latest [0.85, 1.0] remains on index 4 (Step 5 stays active)
    let index = 0;
    if (latest <= 0.85) {
      index = Math.min(Math.floor((latest / 0.85) * 5), 4);
    } else {
      index = 4;
    }
    setActiveStep(index);
  });

  // Animate mock file upload for Step 2
  useEffect(() => {
    if (activeStep === 1) {
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 100 ? 0 : prev + 25));
      }, 550);
      return () => {
        clearInterval(interval);
        setUploadProgress(0);
      };
    }
  }, [activeStep]);

  const STEP_GLOWS = [
    "from-[#ff5a24]/20 via-[#ff5a24]/5 to-transparent", // orange
    "from-red-500/20 via-red-500/5 to-transparent",    // red
    "from-blue-500/20 via-blue-500/5 to-transparent",  // blue
    "from-[#d99418]/20 via-[#d99418]/5 to-transparent",// amber
    "from-[#16a37a]/20 via-[#16a37a]/5 to-transparent",// green
  ];

  // Status bar renderer to simulate native OS feel
  const renderStatusBar = () => (
    <div className="absolute top-0 inset-x-0 h-7 px-4 flex justify-between items-center text-[8px] font-sans font-extrabold text-[#151d19]/60 pointer-events-none z-30 select-none">
      <span className="font-mono">14:02</span>
      {/* Simulated Notch / Dynamic Island */}
      <div className="w-14 h-3.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1 flex items-center justify-end pr-2 pointer-events-none">
        <div className="w-1 h-1 bg-[#1a2333] rounded-full border border-slate-900" />
      </div>
      <div className="flex items-center gap-1.5">
        <Signal className="w-2.5 h-2.5 text-[#151d19]/60" />
        <span className="text-[6.5px] font-black tracking-tighter">5G</span>
        <Wifi className="w-2.5 h-2.5 text-[#151d19]/60" />
        <Battery className="w-3 h-2 text-[#151d19]/60" />
      </div>
    </div>
  );

  // Phone screen renderer with warm platform colors
  const renderPhoneScreen = (index: number) => {
    switch (index) {
      case 0: // Spotting (Warm Theme)
        return (
          <div className="w-full h-full bg-[#fffbf7] text-[#151d19] flex flex-col justify-between pt-8 p-5 relative overflow-hidden font-sans select-none">
            {renderStatusBar()}
            {/* Viewfinder Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-[0.07] pointer-events-none mt-7">
              <div className="border-r border-b border-[#151d19]" />
              <div className="border-r border-b border-[#151d19]" />
              <div className="border-b border-[#151d19]" />
              <div className="border-r border-b border-[#151d19]" />
              <div className="border-r border-b border-[#151d19]" />
              <div className="border-b border-[#151d19]" />
              <div className="border-r border-[#151d19]" />
              <div className="border-r border-[#151d19]" />
              <div />
            </div>

            {/* Viewfinder Corners */}
            <div className="absolute inset-5 top-10 border border-[#151d19]/5 rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ff5a24]" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#ff5a24]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#ff5a24]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#ff5a24]" />
            </div>

            {/* Scanning Line */}
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-[#ff5a24] opacity-70 shadow-[0_0_8px_#ff5a24]"
              animate={{ top: ["15%", "85%", "15%"] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />

            {/* Top Info Bar */}
            <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-[#58655f] mt-1 z-10">
              <span>LAT: 28.6139° N</span>
              <span className="text-[#ff5a24] animate-pulse font-bold">● SCANNING</span>
            </div>

            {/* Center target asset */}
            <div className="flex flex-col items-center justify-center my-auto z-10">
              <motion.div
                animate={{ scale: [0.97, 1.03, 0.97] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-16 h-16 flex items-center justify-center text-[#ff5a24] relative"
              >
                {/* Dog snout SVG */}
                <svg className="w-14 h-14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z" />
                  <circle cx="9" cy="10" r="1" fill="currentColor" />
                  <circle cx="15" cy="10" r="1" fill="currentColor" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5c1 1.2 2 1.2 3 0M12 14.5v2" />
                </svg>
                <div className="absolute inset-0 bg-[#ff5a24]/5 rounded-full blur-xl animate-pulse" />
              </motion.div>
              <span className="text-[8px] text-[#ff5a24] font-mono tracking-widest uppercase mt-3 bg-[#fff0ea] border border-[#ff5a24]/20 px-2 py-0.5 rounded font-bold">
                Locking target...
              </span>
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-center border-t border-[#151d19]/5 pt-3 z-10">
              <div className="w-10 h-10 rounded-full border-2 border-[#ff5a24]/60 bg-[#fff0ea] flex items-center justify-center cursor-pointer transition active:scale-95">
                <div className="w-6 h-6 rounded-full bg-[#ff5a24] border border-[#ff5a24]/10 shadow-md" />
              </div>
            </div>
          </div>
        );

      case 1: // Form Report (Red theme)
        return (
          <div className="w-full h-full bg-[#fffbf7] text-[#151d19] flex flex-col justify-between pt-8 p-5 font-sans select-none">
            {renderStatusBar()}
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-red-500/10 pb-2 mt-1 z-10">
              <MapPin className="text-red-500 w-3.5 h-3.5" />
              <span className="text-[9px] text-[#151d19] font-bold tracking-wider font-mono">PawSOS Sighting Form</span>
            </div>

            {/* Form Fields Stack */}
            <div className="flex-1 flex flex-col justify-center gap-2.5 my-2 z-10">
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-2.5">
                <p className="text-[7.5px] font-mono text-red-500/80 font-bold">INCIDENT LOCATION</p>
                <p className="text-[10px] font-semibold text-red-600 font-mono mt-0.5">28.6139° N, 77.2090° E</p>
              </div>

              <div className="bg-red-50/50 border border-red-100 rounded-xl p-2.5">
                <div className="flex justify-between items-center">
                  <p className="text-[7.5px] font-mono text-red-500/80 font-bold">UPLOADING IMAGE</p>
                  <p className="text-[8.5px] font-mono text-red-600 font-extrabold">{uploadProgress}%</p>
                </div>
                <div className="w-full bg-red-100 rounded-full h-1 overflow-hidden mt-1">
                  <motion.div
                    className="bg-red-500 h-full rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
              </div>

              <div className="bg-red-50/50 border border-red-100 rounded-xl p-2.5 flex justify-between items-center">
                <div>
                  <p className="text-[7.5px] font-mono text-red-500/80 font-bold">URGENCY SEVERITY</p>
                  <p className="text-[10px] font-bold text-red-600 mt-0.5">Critical (Injured Dog)</p>
                </div>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                </span>
              </div>
            </div>

            {/* CTA button */}
            <div className="space-y-1 z-10">
              <motion.div
                whileTap={{ scale: 0.96 }}
                className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-extrabold text-center cursor-pointer shadow-md shadow-red-500/10 border border-red-500/10"
              >
                SEND EMERGENCY SOS
              </motion.div>
              <p className="text-[7.5px] text-center text-[#58655f] font-medium">Volunteers nearby will be notified instantly.</p>
            </div>
          </div>
        );

      case 2: // Radar / Notifications (Blue sonar theme)
        return (
          <div className="w-full h-full bg-[#fffbf7] text-[#151d19] flex flex-col justify-between pt-8 p-5 relative overflow-hidden font-sans select-none">
            {renderStatusBar()}
            {/* Sonar rings */}
            <div className="absolute inset-0 flex items-center justify-center mt-7">
              {[0, 1, 2].map((idx) => (
                <motion.div
                  key={idx}
                  className="absolute border border-blue-500/15 rounded-full"
                  initial={{ width: 40, height: 40, opacity: 0.95 }}
                  animate={{ width: 220, height: 220, opacity: 0 }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.2,
                    delay: idx * 1.05,
                    ease: "linear",
                  }}
                />
              ))}
            </div>

            {/* Sweep overlay */}
            <motion.div
              style={{ transformOrigin: "center" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-blue-500/5 to-transparent rounded-full mt-3"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            />

            {/* Top Bar */}
            <div className="z-10 flex justify-between items-center text-[8px] font-mono text-blue-600 font-bold mt-1">
              <span>RADAR SCAN // ACTIVE</span>
              <span className="flex items-center gap-1 bg-blue-50 border border-blue-200/50 px-1 py-0.5 rounded">
                <Radio className="w-2.5 h-2.5 text-blue-500 animate-pulse" />
                7.0 KM
              </span>
            </div>

            {/* Map Markers Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 mt-7">
              {/* Center SOS Point */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="w-2.5 h-2.5 bg-red-600 rounded-full border border-white shadow-md animate-bounce" />
              </div>

              {/* Rescuer Pins */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="absolute top-[30%] left-[20%] flex flex-col items-center"
              >
                <div className="bg-[#16a37a] text-white text-[7px] font-extrabold px-1 py-0.5 rounded border border-white shadow-md">
                  V1 (0.8km)
                </div>
                <div className="w-1.5 h-1.5 bg-[#16a37a] rounded-full border border-white shadow-sm" />
              </motion.div>

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.0, type: "spring" }}
                className="absolute bottom-[35%] right-[15%] flex flex-col items-center"
              >
                <div className="bg-[#16a37a] text-white text-[7px] font-extrabold px-1 py-0.5 rounded border border-white shadow-md">
                  Ambulance (2.1km)
                </div>
                <div className="w-1.5 h-1.5 bg-[#16a37a] rounded-full border border-white shadow-sm" />
              </motion.div>
            </div>

            {/* Bottom Status Panel */}
            <div className="z-10 bg-blue-50/80 border border-blue-150 rounded-xl p-2.5 text-center">
              <h4 className="text-[10px] font-bold text-blue-600">Broadcasting Alert...</h4>
              <p className="text-[8px] text-[#58655f] font-mono mt-0.5">14 volunteers paged nearby</p>
            </div>
          </div>
        );

      case 3: // Chat Coordination (Amber theme)
        return (
          <div className="w-full h-full bg-[#fffbf7] text-[#151d19] flex flex-col justify-between pt-8 p-4 font-sans select-none">
            {renderStatusBar()}
            {/* Header chat room */}
            <div className="flex items-center justify-between border-b border-amber-500/10 pb-2 mt-1 z-10">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-500/30 flex items-center justify-center text-[9px] text-[#d99418] font-black">R</div>
                <div>
                  <h4 className="text-[9px] font-extrabold text-[#151d19]">Incident Desk #402</h4>
                  <p className="text-[6.5px] text-[#16a37a] font-black tracking-wider">● 3 RESPONDERS ACTIVE</p>
                </div>
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-[#16a37a]" />
            </div>

            {/* Chat Bubble List */}
            <div className="flex-1 flex flex-col justify-end gap-2 my-2 overflow-y-auto max-h-[200px] z-10">
              <div className="flex gap-1.5 items-start max-w-[85%]">
                <div className="bg-amber-50/60 border border-amber-100 rounded-r-xl rounded-bl-xl p-2 text-[9px] text-[#33413b] leading-relaxed shadow-sm">
                  <p className="font-extrabold text-[7.5px] text-[#d99418]">Rajesh (Volunteer)</p>
                  <p className="mt-0.5">Secured the pup. Wrapping in blanket, loading in carrier.</p>
                </div>
              </div>

              <div className="flex gap-1.5 items-start max-w-[85%] ml-auto flex-row-reverse">
                <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-l-xl rounded-br-xl p-2 text-[9px] text-[#33413b] leading-relaxed text-right shadow-sm">
                  <p className="font-extrabold text-[7.5px] text-[#16a37a]">City Vet Clinic</p>
                  <p className="mt-0.5">Vitals assessment table prepped. Standby for triage.</p>
                </div>
              </div>
            </div>

            {/* Active route map overlay */}
            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2 flex flex-col gap-1 z-10">
              <div className="flex justify-between items-center text-[7.5px] text-[#d99418] font-extrabold font-mono">
                <span>AMBULANCE ROUTING</span>
                <span>ETA: 4 MINS</span>
              </div>
              <div className="relative w-full h-0.5 bg-amber-100 rounded-full overflow-hidden mt-1">
                <motion.div
                  className="h-full bg-[#d99418] rounded-full"
                  animate={{ width: ["15%", "85%", "15%"] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2"
                  animate={{ left: ["15%", "85%", "15%"] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                >
                  <Ambulance className="w-2.5 h-2.5 text-white bg-[#d99418] rounded-full p-0.5 -mt-1.25 shadow" />
                </motion.div>
              </div>
            </div>
          </div>
        );

      case 4: // Success / Recovery (Warm Green Theme)
        return (
          <div className="w-full h-full bg-[#fffbf7] text-[#151d19] flex flex-col justify-between pt-8 p-5 relative overflow-hidden font-sans select-none">
            {renderStatusBar()}
            {/* Hearts floating loop */}
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-red-500/20 text-base pointer-events-none"
                initial={{ bottom: -20, left: `${15 + i * 18}%`, scale: 0.5, opacity: 0 }}
                animate={{ bottom: "85%", scale: [0.5, 1.2, 0.8], opacity: [0, 0.95, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.8 + i * 0.4,
                  delay: i * 0.35,
                  ease: "easeOut"
                }}
              >
                <Heart fill="currentColor" className="w-3 h-3" />
              </motion.div>
            ))}

            <div className="text-[8px] font-mono tracking-widest text-[#16a37a] text-center font-bold mt-1 z-10">
              RESCUE SEQUENCE SUMMARY
            </div>

            {/* Center Checkmark */}
            <div className="flex flex-col items-center justify-center my-auto z-10">
              <motion.div
                initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 9 }}
                className="w-10 h-10 rounded-full bg-[#edf9f4] border-2 border-[#16a37a] flex items-center justify-center text-[#16a37a] mb-2 animate-pulse"
              >
                <Check className="w-5 h-5" strokeWidth={3} />
              </motion.div>
              <h4 className="text-[10px] font-black text-[#16a37a]">SUCCESS! RESCUE COMPLETE</h4>
              <p className="text-[9px] text-[#58655f] max-w-[20ch] mt-1 leading-relaxed text-center font-semibold">
                Distressed animal admitted, treated, and recovering safely.
              </p>
            </div>

            {/* Summary card details */}
            <div className="bg-[#edf9f4] border border-[#c9efe2] rounded-xl p-2 z-10 flex justify-between items-center text-left">
              <div>
                <p className="text-[7.5px] uppercase tracking-wider text-[#16a37a] font-mono font-bold">Case Status</p>
                <p className="text-[9px] font-extrabold text-[#151d19] mt-0.5">Recovered & Stable</p>
              </div>
              <div className="bg-[#16a37a] text-white rounded-full p-0.5 shadow">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    /* Parent track height h-[3000px] pins the section for natural vertical scroll sequence on desktop */
    <section ref={targetRef} className="relative bg-[#fff8f0] h-auto lg:h-[2000px] overflow-visible">
      {/* Decorative ambient background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,90,36,0.03),transparent_40%)] pointer-events-none" />

      {/* Sticky Full screen container - desktop only sticky, auto layout on mobile */}
      <div className="relative lg:sticky lg:top-0 h-auto lg:h-[100dvh] w-full flex flex-col justify-start lg:justify-between py-8 lg:py-10 overflow-visible lg:overflow-hidden">
        
        {/* Full-width Section Header */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10 w-full mb-6 lg:mb-0">
          <div className="max-w-3xl text-left">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff5a24]/10 border border-[#ff5a24]/20 text-[#ff5a24] text-[10px] font-extrabold tracking-wider mb-3 uppercase font-mono shadow-sm">
              <Award className="w-3.5 h-3.5" />
              <span>99.8% Grid Dispatch Response</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff5a24] font-bold mb-1.5 block">
              Simple & transparent
            </span>
            <h2 className="font-display italic text-3xl sm:text-4xl lg:text-5xl text-[#151d19] leading-[1.1]">
              How rescue works
            </h2>
          </div>
        </div>

        {/* Content columns vertically centered on desktop */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10 w-full flex-1 flex items-center">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center w-full">
            
            {/* LEFT COLUMN: Pinned Phone Mockup, positioned symmetrically in the middle of its half section */}
            <div className="hidden lg:flex lg:col-span-6 h-[420px] flex-col justify-center items-center">
              {/* Dynamic Smartphone Frame Wrapper to contain dynamic glow & floating badges */}
              <div className="relative w-[210px] h-[420px]">
                {/* Glowing radial backdrop */}
                <div className="absolute -inset-10 -z-10 pointer-events-none flex items-center justify-center">
                  <div className={`w-[240px] h-[240px] rounded-full bg-gradient-to-tr ${STEP_GLOWS[activeStep]} blur-3xl transition-all duration-700`} />
                </div>

                {/* Floating Badge A: Top-left */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -top-6 -left-10 z-20 backdrop-blur-md bg-white/75 border border-[#ff5a24]/15 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-2 flex items-center gap-2 select-none min-w-[105px]"
                >
                  <div className="w-5 h-5 rounded-lg bg-[#fff0ea] flex items-center justify-center p-1">
                    <Navigation className="w-2.5 h-2.5 text-[#ff5a24]" />
                  </div>
                  <div>
                    <p className="text-[7.5px] font-extrabold text-[#151d19] leading-none">Live GPS Lock</p>
                    <p className="text-[6px] text-[#58655f] font-mono mt-0.5 leading-none">Precision 1.8m</p>
                  </div>
                </motion.div>

                {/* Floating Badge B: Middle-right */}
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                  className="absolute top-[28%] -right-14 z-20 backdrop-blur-md bg-white/75 border border-blue-200/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-2 flex items-center gap-2 select-none min-w-[110px]"
                >
                  <div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center p-1">
                    <Activity className="w-2.5 h-2.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[7.5px] font-extrabold text-[#151d19] leading-none">Grid Broadcast</p>
                    <p className="text-[6px] text-[#58655f] font-mono mt-0.5 leading-none">14 Rescuers</p>
                  </div>
                </motion.div>

                {/* Floating Badge C: Bottom-left */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }}
                  className="absolute -bottom-6 -left-6 z-20 backdrop-blur-md bg-white/75 border border-[#16a37a]/15 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-2 flex items-center gap-2 select-none min-w-[110px]"
                >
                  <div className="w-5 h-5 rounded-lg bg-[#edf9f4] flex items-center justify-center p-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#16a37a]" />
                  </div>
                  <div>
                    <p className="text-[7.5px] font-extrabold text-[#151d19] leading-none">Zero-Cost</p>
                    <p className="text-[6px] text-[#58655f] font-mono mt-0.5 leading-none">100% Sponsored</p>
                  </div>
                </motion.div>

                {/* Dynamic Smartphone Frame */}
                <div className="w-full h-full border-[6px] border-[#151d19] rounded-[24px] bg-[#fffbf7] shadow-[0_20px_50px_-15px_rgba(156,62,35,0.22)] overflow-hidden relative">
                  {/* Screen Content */}
                  <div className="w-full h-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                      >
                        {renderPhoneScreen(activeStep)}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Scroll-driven step cards translating based on active index */}
            <div className="hidden lg:flex lg:col-span-6 relative items-center h-[420px]">
              
              {/* Interactive Step Dots Timeline Indicator with connecting railway track (Desktop Only) */}
              <div className="flex flex-col items-center justify-between mr-8 shrink-0 z-15 relative py-8 h-[420px]">
                {/* Railway background track */}
                <div className="absolute top-3 bottom-3 w-[2px] bg-[#151d19]/10 rounded-full" />
                {/* Railway dynamic active track */}
                <div className="absolute top-3 bottom-3 w-[2px] overflow-hidden pointer-events-none">
                  <motion.div
                    className="w-full bg-gradient-to-b from-[#ff5a24] to-[#16a37a] rounded-full"
                    initial={{ height: "0%" }}
                    animate={{
                      height: `${(activeStep / (STEPS.length - 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    style={{
                      originY: 0,
                    }}
                  />
                </div>
                {STEPS.map((step, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <button
                      key={idx}
                      className="group relative flex items-center justify-center w-6 h-6 outline-none z-10 cursor-default"
                      title={`Step ${step.step}`}
                    >
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-[#151d19]/20 transition-colors"
                        animate={{
                          scale: isActive ? 2.0 : 1,
                          backgroundColor: isActive ? step.color : "rgba(21, 29, 25, 0.2)",
                          boxShadow: isActive ? `0 0 10px ${step.color}` : "none",
                        }}
                        transition={{ duration: 0.25 }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Steps Container Wrapper (Desktop Only) */}
              <div className="relative overflow-hidden h-[420px] w-full">
                {/* Top/Bottom Fade Gradients to blend list edges with #fff8f0 background */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#fff8f0] to-transparent pointer-events-none z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#fff8f0] to-transparent pointer-events-none z-10" />
                
                {/* Desktop Translated Steps Container */}
                <motion.div
                  animate={{ y: -activeStep * 420 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="h-full flex flex-col"
                >
                  {STEPS.map((step, index) => {
                    const isActive = activeStep === index;
                    const IconComponent = step.icon;

                    return (
                      <div
                        key={index}
                        className="h-[420px] flex flex-col justify-center px-2 shrink-0"
                      >
                        <motion.div
                          className={`transition-all duration-500 select-none text-left p-6 rounded-[2rem] border ${
                            isActive
                              ? "bg-white border-[#ff5a24]/10 shadow-[0_20px_40px_-15px_rgba(156,62,35,0.06)]"
                              : "bg-transparent border-transparent"
                          }`}
                          animate={{
                            opacity: isActive ? 1 : 0.15,
                            scale: isActive ? 1.02 : 0.98,
                          }}
                          transition={{ duration: 0.4 }}
                        >
                          <div className="space-y-4">
                            {/* Step & Icon */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span
                                  className="font-mono text-xs font-black uppercase tracking-wider"
                                  style={{ color: isActive ? step.color : "#58655f" }}
                                >
                                  Step {step.step}
                                </span>
                                <div className={`p-1.5 rounded-xl border text-xs bg-[#fff8f0] shrink-0 transition-all duration-500 ${step.accentBg} ${!isActive && "opacity-40"}`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                              </div>
                              
                              {/* Clean tag badge */}
                              <div className="flex items-center gap-1.5">
                                {step.tags.slice(0, 2).map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className={`text-[8.5px] font-mono font-extrabold tracking-wider px-2 py-0.5 rounded-full border transition-all duration-500 ${
                                      isActive
                                        ? step.accentBg
                                        : "bg-slate-100/30 border-slate-200/50 text-[#58655f]/40"
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-2">
                              <h3 className="text-xl lg:text-2xl font-extrabold text-[#151d19] font-sans tracking-tight leading-tight">
                                {step.title}
                              </h3>
                              <p className="text-[#58655f] text-xs lg:text-sm font-semibold leading-relaxed max-w-[48ch]">
                                {step.description}
                              </p>
                            </div>

                            {/* Double-Bezel Tech Specs Container */}
                            <div className="mt-4 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 ring-1 ring-black/5">
                              <div className="bg-[#fffcf9] dark:bg-[#1a2333] rounded-[calc(1rem-0.25rem)] p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] border border-[#ff5a24]/10">
                                <div className="flex items-center justify-between border-b border-[#ff5a24]/5 pb-1.5 mb-2">
                                  <span className="text-[8px] font-mono font-black tracking-widest text-[#ff5a24] uppercase">
                                    {step.technicalLabel}
                                  </span>
                                  <span className="text-[8.5px] font-mono text-[#58655f] font-semibold">
                                    {step.bullets[0]}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-[#58655f] leading-relaxed font-sans font-semibold italic">
                                  {step.technicalHighlight}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>

          </div>

          {/* Mobile Only: Normal Linear Stack Flow (Sticky viewport disabled on small screens for scroll safety) */}
          <div className="lg:hidden flex flex-col space-y-12 py-4 mt-4 w-full">
            {STEPS.map((step, index) => {
              const IconComponent = step.icon;

              return (
                <div key={index} className="flex flex-col items-center text-center px-4 py-8 rounded-[2rem] bg-white border border-[#ff5a24]/10 shadow-[0_15px_45px_-12px_rgba(156,62,35,0.05)] w-full">
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#ff5a24]">
                        Step {step.step}
                      </span>
                      <div className={`p-1.5 rounded-xl border text-xs shrink-0 ${step.accentBg}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {step.tags.slice(0, 2).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className={`text-[8px] font-mono font-extrabold tracking-wide px-2 py-0.5 rounded-full border ${step.accentBg}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[#151d19] font-sans w-full text-left">
                    {step.title}
                  </h3>
                  
                  <p className="text-[#58655f] text-xs sm:text-sm font-semibold mt-2 max-w-full leading-relaxed text-left w-full">
                    {step.description}
                  </p>

                  {/* Double-Bezel Tech Specs Container (Mobile) */}
                  <div className="mt-4 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 ring-1 ring-black/5 w-full">
                    <div className="bg-[#fffcf9] dark:bg-[#1a2333] rounded-[calc(1rem-0.25rem)] p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] border border-[#ff5a24]/10 text-left">
                      <div className="flex items-center justify-between border-b border-[#ff5a24]/5 pb-1.5 mb-2">
                        <span className="text-[8px] font-mono font-black tracking-widest text-[#ff5a24] uppercase">
                          {step.technicalLabel}
                        </span>
                        <span className="text-[8.5px] font-mono text-[#58655f] font-semibold">
                          {step.bullets[0]}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-[#58655f] leading-relaxed font-sans font-semibold italic">
                        {step.technicalHighlight}
                      </p>
                    </div>
                  </div>

                  {/* Inline phone mockup demo */}
                  <div className="w-full mt-6 rounded-[24px] border-[5px] border-[#151d19] bg-[#fffbf7] aspect-[1/2] max-w-[190px] overflow-hidden shadow-lg mx-auto relative">
                    <div className="w-full h-full">
                      {renderPhoneScreen(index)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}