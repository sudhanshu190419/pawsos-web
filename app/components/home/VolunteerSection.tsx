"use client";

import Link from "next/link";
import {
  Award,
  CreditCard,
  TrendingUp,
  Users,
  ArrowRight,
  BadgeCheck,
  Heart,
} from "lucide-react";
import Reveal from "../Reveal";

const BENEFITS = [
  {
    icon: Award,
    title: "Volunteer Certificate",
    desc: "Earn recognized certificates for every rescue mission you participate in.",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: CreditCard,
    title: "Digital ID Card",
    desc: "Get a verified digital volunteer ID with your credentials and mission history.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: TrendingUp,
    title: "Track Your Impact",
    desc: "See exactly how many lives you've saved with your personal impact dashboard.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Users,
    title: "Join a Community",
    desc: "Connect with 2,800+ like-minded animal lovers and rescue heroes across India.",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
];

export default function VolunteerSection() {
  return (
    <section className="relative py-14 sm:py-20 md:py-28 overflow-hidden border-y border-slate-100 bg-gradient-to-b from-orange-50/40 via-white to-white">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <Reveal>
            <div className="space-y-8">
              <div>
                <span className="inline-block text-orange-600 font-bold tracking-widest uppercase text-xs bg-orange-100 px-3 py-1 rounded-full mb-4">
                  Join the Movement
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                  Become a Rescue{" "}
                  <span className="text-orange-500">Volunteer</span>
                </h2>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
                  Join India&apos;s largest network of animal rescue volunteers.
                  No experience needed — just compassion and a smartphone.
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {BENEFITS.map((b) => (
                  <div
                    key={b.title}
                    className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${b.bg} flex items-center justify-center shrink-0`}
                    >
                      <b.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${b.color}`} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        {b.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/volunteer-form"
                  className="group inline-flex items-center justify-center gap-2 sm:gap-3 bg-orange-500 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 hover:bg-orange-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 min-h-[48px]"
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Apply as Volunteer
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex -space-x-1.5 sm:-space-x-2">
                  {["R", "S", "P", "A", "M"].map((l, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-orange-600"
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-700">
                    2,800+ Active Volunteers
                  </p>
                  <div className="flex items-center gap-1">
                    <BadgeCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
                    <span className="text-[9px] sm:text-[10px] text-slate-400">
                      All verified & ID-carded
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: Visual — Volunteer Card Preview */}
          <Reveal>
            <div className="relative flex justify-center">
              {/* Stacked depth cards - now responsive height */}
              <div className="absolute w-[85%] h-[280px] sm:h-[300px] bg-orange-100/50 rounded-[24px] sm:rounded-[28px] rotate-3 translate-y-4" />
              <div className="absolute w-[92%] h-[290px] sm:h-[310px] bg-orange-50/80 rounded-[26px] sm:rounded-[30px] -rotate-1 translate-y-2 shadow-sm" />

              {/* Main volunteer ID card */}
              <div className="relative z-20 w-full max-w-[420px] bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden mx-2 sm:mx-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 sm:px-8 py-4 sm:py-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                        AnimalSathi
                      </p>
                      <p className="text-base sm:text-lg font-extrabold mt-1">
                        Volunteer ID
                      </p>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <span className="text-xl sm:text-2xl">🐾</span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
                  {/* Volunteer info */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-orange-100 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-orange-600">
                      AS
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-800">
                        Arjun Singh
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        Volunteer • Delhi NCR
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                        <BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: "Rescues", value: "47" },
                      { label: "Hours", value: "312" },
                      { label: "Rating", value: "4.9" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-slate-50 rounded-xl p-2 sm:p-3 text-center"
                      >
                        <p className="text-base sm:text-lg font-extrabold text-slate-800">
                          {s.value}
                        </p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100">
                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-400">
                      ID: AS-2024-DEL-047
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
