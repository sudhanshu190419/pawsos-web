"use client";

import {
  Heart,
  Users,
  Building2,
  Stethoscope,
  HandHeart,
  Store,
} from "lucide-react";
import Reveal from "../Reveal";

const NODES = [
  { icon: Users, label: "Citizens", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200", ring: "ring-orange-200", x: "left-1/2 -translate-x-1/2 top-0" },
  { icon: Heart, label: "Volunteers", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200", ring: "ring-rose-200", x: "left-0 top-1/2 -translate-y-1/2" },
  { icon: Building2, label: "NGOs", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200", ring: "ring-blue-200", x: "right-0 top-1/2 -translate-y-1/2" },
  { icon: Stethoscope, label: "Veterinarians", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-200", x: "left-[15%] bottom-0" },
  { icon: HandHeart, label: "Donors", color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-200", ring: "ring-violet-200", x: "right-[15%] bottom-0" },
  { icon: Store, label: "Brands", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-200", x: "left-1/2 -translate-x-1/2 bottom-0" },
];

const FEATURES = [
  { title: "Emergency SOS", desc: "Instant rescue reporting with GPS", icon: "🚨" },
  { title: "Volunteer Network", desc: "Verified volunteers ready to help", icon: "🤝" },
  { title: "NGO Coordination", desc: "Seamless rescue team dispatch", icon: "🏢" },
  { title: "Vet Consultations", desc: "Expert veterinary teleconsultation", icon: "🩺" },
  { title: "Donations", desc: "Transparent fundraising campaigns", icon: "💛" },
  { title: "Marketplace", desc: "Pet care products delivered", icon: "🛒" },
];

export default function Ecosystem() {
  return (
    <section className="relative py-14 sm:py-20 md:py-28 overflow-hidden bg-white">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-10 sm:mb-14 md:mb-20">
            <span className="inline-block text-orange-600 font-bold tracking-widest uppercase text-xs bg-orange-100 px-3 py-1 rounded-full mb-4">
              Our Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              A Connected{" "}
              <span className="text-orange-500">Network</span> of Care
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              AnimalSathi isn&apos;t just an app — it&apos;s an entire ecosystem
              where every stakeholder plays a vital role in animal welfare.
            </p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Network visualization (desktop) / Cards (mobile) */}
          <Reveal>
            {/* Mobile: Simple card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:hidden">
              {NODES.map((node) => (
                <div
                  key={node.label}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${node.bg} border ${node.border} text-center`}
                >
                  <div className={`w-10 h-10 rounded-xl ${node.bg} flex items-center justify-center`}>
                    <node.icon className={`w-5 h-5 ${node.color}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {node.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop: Network hexagonal layout */}
            <div className="hidden lg:block relative h-[400px]">
              {/* SVG connections */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 400">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#f97316" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                {/* Citizens → Volunteers */}
                <line x1="250" y1="55" x2="80" y2="200" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="6 4" />
                {/* Citizens → NGOs */}
                <line x1="250" y1="55" x2="420" y2="200" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="6 4" />
                {/* Volunteers → Vets */}
                <line x1="80" y1="200" x2="140" y2="370" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="6 4" />
                {/* NGOs → Donors */}
                <line x1="420" y1="200" x2="360" y2="370" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="6 4" />
                {/* Volunteers → Donors */}
                <line x1="80" y1="200" x2="360" y2="370" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4" />
                {/* NGOs → Vets */}
                <line x1="420" y1="200" x2="140" y2="370" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4" />
                {/* Center → all */}
                <line x1="250" y1="200" x2="250" y2="55" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="250" y1="200" x2="80" y2="200" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="250" y1="200" x2="420" y2="200" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="250" y1="200" x2="140" y2="370" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="250" y1="200" x2="360" y2="370" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="4 4" />
              </svg>

              {/* Center hub */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/30 z-10">
                <div className="text-center text-white">
                  <span className="text-lg">🐾</span>
                  <p className="text-[8px] font-bold leading-tight mt-0.5">AnimalSathi</p>
                </div>
              </div>

              {/* Node positions: top, left, right, bottom-left, bottom-right */}
              {[
                { ...NODES[0], pos: "left-1/2 -translate-x-1/2 top-4" },
                { ...NODES[1], pos: "left-4 top-1/2 -translate-y-1/2" },
                { ...NODES[2], pos: "right-4 top-1/2 -translate-y-1/2" },
                { ...NODES[3], pos: "left-[8%] bottom-4" },
                { ...NODES[4], pos: "right-[8%] bottom-4" },
              ].map((node) => (
                <div
                  key={node.label}
                  className={`absolute ${node.pos} z-10`}
                >
                  <div className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white shadow-lg border ${node.border} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-default`}>
                    <div className={`w-10 h-10 rounded-xl ${node.bg} flex items-center justify-center ring-4 ${node.ring} ring-opacity-30`}>
                      <node.icon className={`w-5 h-5 ${node.color}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">
                      {node.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Right: Feature list */}
          <Reveal>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">
                Everything Connected. Everyone Empowered.
              </h3>
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-200 group"
                >
                  <span className="text-2xl mt-0.5 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {f.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                  <span className="ml-auto text-xs font-mono font-bold text-slate-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
