"use client";

import Link from "next/link";
import {
  Building2,
  Stethoscope,
  Hospital,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Reveal from "../Reveal";

const PARTNERS = [
  {
    icon: Building2,
    title: "Join as an NGO",
    description:
      "Register your animal welfare organization and access our rescue coordination tools, volunteer network, and funding resources.",
    features: [
      "Rescue coordination dashboard",
      "Access to volunteer network",
      "Fundraising support",
      "Impact analytics & reporting",
    ],
    cta: "Apply as NGO",
    href: "/onboarding",
    btnGradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    glowColor: "rgba(59,130,246,0.12)",
    glowIntense: "rgba(59,130,246,0.4)",
    lightBg: "bg-blue-50/40",
    iconBg: "bg-blue-100/60",
    iconColor: "text-blue-600",
    borderAccent: "border-blue-200/50",
  },
  {
    icon: Stethoscope,
    title: "Register as a Vet",
    description:
      "Join our veterinary network and provide consultations, emergency triage, and ongoing care for rescued animals.",
    features: [
      "Teleconsultation tools",
      "Emergency case alerts",
      "Professional networking",
      "Verified vet badge",
    ],
    cta: "Register as Vet",
    href: "/vets",
    btnGradient: "linear-gradient(135deg, #10b981, #14b8a6)",
    glowColor: "rgba(16,185,129,0.12)",
    glowIntense: "rgba(16,185,129,0.4)",
    lightBg: "bg-emerald-50/40",
    iconBg: "bg-emerald-100/60",
    iconColor: "text-emerald-600",
    borderAccent: "border-emerald-200/50",
  },
  {
    icon: Hospital,
    title: "Hospital Onboarding",
    description:
      "Partner your veterinary hospital with AnimalSathi for referral management, patient tracking, and community visibility.",
    features: [
      "Patient referral pipeline",
      "Online appointment booking",
      "Hospital visibility profile",
      "Analytics & insights",
    ],
    cta: "Onboard Hospital",
    href: "/onboarding/organization",
    btnGradient: "linear-gradient(135deg, #8b5cf6, #d946ef)",
    glowColor: "rgba(139,92,246,0.12)",
    glowIntense: "rgba(139,92,246,0.4)",
    lightBg: "bg-violet-50/40",
    iconBg: "bg-violet-100/60",
    iconColor: "text-violet-600",
    borderAccent: "border-violet-200/50",
  },
];

function FloatingOrb({
  className,
  color,
  size,
  delay,
  duration,
}: {
  className?: string;
  color: string;
  size: number;
  delay: number;
  duration: number;
}) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        animation: `floatOrb ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export default function PartnershipSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const updateCards = () => {
      const cards = section.querySelectorAll<HTMLDivElement>(".premium-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = lastX - rect.left;
        const y = lastY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const normX = Math.max(-1, Math.min(1, (x - centerX) / centerX));
        const normY = Math.max(-1, Math.min(1, (y - centerY) / centerY));
        card.style.setProperty("--rotate-x", `${normY * 6}deg`);
        card.style.setProperty("--rotate-y", `${normX * 6}deg`);
      });
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (rafId === null) {
        rafId = requestAnimationFrame(updateCards);
      }
    };

    section.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      section.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 md:py-36 overflow-hidden bg-gradient-to-b from-white via-orange-50/30 to-white"
    >
      {/* Ambient floating orbs — soft warm tones */}
      <FloatingOrb
        color="radial-gradient(circle, rgba(251,146,60,0.12), transparent 70%)"
        size={500}
        delay={0}
        duration={8}
        className="top-[-10%] left-[-5%]"
      />
      <FloatingOrb
        color="radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)"
        size={400}
        delay={2}
        duration={10}
        className="top-[20%] right-[-10%]"
      />
      <FloatingOrb
        color="radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)"
        size={350}
        delay={4}
        duration={9}
        className="bottom-[10%] left-[20%]"
      />
      <FloatingOrb
        color="radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%)"
        size={300}
        delay={6}
        duration={11}
        className="bottom-[-5%] right-[10%]"
      />

      {/* Subtle dot-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-14 sm:mb-20">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-orange-200/60 shadow-sm px-5 py-2 rounded-full mb-6 hover:shadow-md transition-all duration-300">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600 font-semibold tracking-widest uppercase text-xs">
                Partner With Us
              </span>
            </div>

            {/* Title with gradient */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              <span className="text-slate-900">
                Grow Your Impact{" "}
              </span>
              <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                With Us
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Whether you&apos;re an NGO, a veterinarian, or a hospital —
              there&apos;s a place for you in the{" "}
              <span className="text-orange-500 font-semibold">AnimalSathi</span>{" "}
              ecosystem.
            </p>

            {/* Decorative line */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
              <div className="w-2 h-2 rounded-full bg-orange-400/50" />
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
            </div>
          </div>
        </Reveal>

        {/* Partner cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PARTNERS.map((p, index) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div
                className="premium-card group relative bg-white/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-200/60 hover:border-orange-200/80 transition-all duration-500 h-full flex flex-col"
                style={{
                  transform: "perspective(1000px) rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg))",
                  transition: "transform 0.1s ease-out, border-color 0.4s, box-shadow 0.4s",
                  willChange: "transform",
                  boxShadow: `
                    0 4px 24px -4px rgba(0,0,0,0.06),
                    0 1px 4px -1px rgba(0,0,0,0.04),
                    0 0 0 1px rgba(255,255,255,0.6) inset
                  `,
                }}
                onMouseEnter={(e) => {
                  const card = e.currentTarget;
                  card.style.boxShadow = `
                    0 20px 60px -12px rgba(0,0,0,0.12),
                    0 8px 24px -6px rgba(0,0,0,0.06),
                    0 0 0 1px rgba(255,255,255,0.8) inset,
                    0 0 40px -12px ${p.glowColor}
                  `;
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget;
                  card.style.boxShadow = `
                    0 4px 24px -4px rgba(0,0,0,0.06),
                    0 1px 4px -1px rgba(0,0,0,0.04),
                    0 0 0 1px rgba(255,255,255,0.6) inset
                  `;
                }}
              >
                {/* Gradient border top accent */}
                <div
                  className="absolute top-0 left-6 right-6 h-[1.5px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${p.glowIntense}, transparent)`,
                  }}
                />

                {/* Subtle card-top colored wash */}
                <div
                  className={`absolute top-0 left-0 right-0 h-32 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${p.lightBg}`}
                />

                {/* Icon with glow */}
                <div className="relative mb-7 z-10">
                  <div
                    className={`w-16 h-16 rounded-2xl ${p.iconBg} border ${p.borderAccent} flex items-center justify-center group-hover:scale-110 transition-all duration-500`}
                    style={{
                      boxShadow: `0 0 30px -8px ${p.glowColor}`,
                    }}
                  >
                    <p.icon className={`w-7 h-7 ${p.iconColor}`} />
                  </div>
                  {/* Ambient icon glow on hover */}
                  <div
                    className="absolute -inset-3 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
                    style={{ background: p.glowColor }}
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors duration-300 z-10">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 group-hover:text-slate-600 transition-colors duration-300 z-10">
                  {p.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-grow z-10">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 group/feature">
                      <div className="relative shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-orange-400 group-hover/feature:text-orange-500 transition-colors duration-200" />
                      </div>
                      <span className="text-sm text-slate-500 group-hover/feature:text-slate-700 transition-colors duration-200">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button with shimmer */}
                <Link
                  href={p.href}
                  className="group/btn relative inline-flex items-center justify-center gap-2 w-full text-white px-6 py-3.5 rounded-xl font-bold text-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white z-10"
                  style={{
                    background: p.btnGradient,
                    boxShadow: `0 4px 20px -4px ${p.glowColor.replace("0.12", "0.3")}`,
                  }}
                >
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  {/* Button content */}
                  <span className="relative z-10">{p.cta}</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
