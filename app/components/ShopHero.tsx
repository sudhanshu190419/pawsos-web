"use client";

import React, { memo, useRef, useEffect } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  RotateCcw,
  Star,
  CheckCircle2,
} from "lucide-react";
import { TRUST_PROMISES } from "@/app/shop/shopConstants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ShopHeroProps {
  onShopNow?: () => void;
}

const ShopHero = memo(function ShopHero({ onShopNow }: ShopHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for ambient luxury lighting orbs
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const orbs = el.querySelectorAll<HTMLElement>(".ambient-orb");
      orbs.forEach((orb, i) => {
        const factor = (i + 1) * 18;
        orb.style.transform = `translate3d(${x * factor}px, ${y * factor}px, 0)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // GSAP Animations (Entrance + Parallax) - strict budget <=350ms per step, <600ms total
  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-headline", {
        y: 24,
        opacity: 0,
        duration: 0.35,
      })
        .from(
          ".hero-sub",
          {
            y: 20,
            opacity: 0,
            duration: 0.35,
          },
          "-=0.2"
        )
        .from(
          ".hero-actions",
          {
            y: 16,
            opacity: 0,
            duration: 0.3,
          },
          "-=0.2"
        )
        .from(
          ".hero-visual",
          {
            scale: 0.96,
            opacity: 0,
            duration: 0.35,
          },
          "-=0.25"
        )
        .from(
          ".hero-trust",
          {
            y: 12,
            opacity: 0,
            duration: 0.3,
            stagger: 0.04,
          },
          "-=0.2"
        );

      // ScrollTrigger Parallax for depth
      if (containerRef.current) {
        gsap.to(".hero-image-wrap", {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });

        gsap.to(".float-badge-1", {
          yPercent: -18,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.6,
          },
        });

        gsap.to(".float-badge-2", {
          yPercent: 16,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.4,
          },
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-gradient-to-b from-[#F3E9DD] via-[#F8F2EA] to-[#FDFCFB] pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-10 border-b border-stone-200/80"
    >
      {/* ── Ambient Warm Lighting ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-0">
        <div className="ambient-orb absolute -top-12 -left-12 w-96 h-96 rounded-full bg-primary/15 blur-[100px] transition-transform duration-700 ease-out" />
        <div className="ambient-orb absolute top-1/4 -right-12 w-96 h-96 rounded-full bg-amber-500/15 blur-[110px] transition-transform duration-700 ease-out" />
        <div className="ambient-orb absolute -bottom-12 left-1/3 w-80 h-80 rounded-full bg-secondary/15 blur-[90px] transition-transform duration-700 ease-out" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* ── LEFT COLUMN: Editorial Text & 1 Primary CTA ── */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col space-y-4 sm:space-y-5 text-left">
            {/* Editorial Headline */}
            <h1 className="hero-headline text-3xl sm:text-4xl md:text-5xl lg:text-[3.15rem] font-bold text-neutral-900 leading-[1.12] tracking-tight font-sans">
              <span className="font-serif italic font-normal text-stone-800 tracking-normal block sm:inline">
                &ldquo;Pure Love, Clinical Precision.&rdquo;
              </span>{" "}
              <span className="text-primary font-black block sm:inline mt-1 sm:mt-0">
                Elevate Your Pet&apos;s Wellbeing.
              </span>
            </h1>

            {/* Editorial Subtitle */}
            <p className="hero-sub text-sm sm:text-base md:text-lg text-neutral-700 leading-relaxed max-w-xl font-medium">
              Curated prescription diets, certified pharmaceutical wellness, and
              veterinary-approved essentials formulated for Indian climates and
              pure vitality.
            </p>

            {/* Primary Action Button */}
            <div className="hero-actions flex items-center gap-4 pt-1">
              <button
                type="button"
                onClick={onShopNow}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-primary hover:bg-primary-container active:scale-95 text-white text-sm sm:text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group"
              >
                <span>Explore Store</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN: High-End Lifestyle Photo Showcase ── */}
          <div className="lg:col-span-6 xl:col-span-5 relative flex items-center justify-center hero-visual select-none">
            <div className="relative w-full max-w-md lg:max-w-none">
              {/* Warm glow backing */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/25 via-amber-400/20 to-secondary/25 rounded-3xl blur-xl -z-10 transform scale-95" />

              {/* Main composition image card */}
              <div className="hero-image-wrap relative rounded-3xl overflow-hidden shadow-xl border-2 border-white bg-stone-100 aspect-[16/11]">
                <Image
                  src="/shop-hero-lifestyle.jpg"
                  alt="AnimalSathi Premium Pet Wellness and Nutrition Products"
                  fill
                  sizes="(max-width: 1024px) 100vw, 460px"
                  priority
                  className="object-cover rounded-3xl transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* ── Floating Badge 1: Clinical Standards (Top Left) ── */}
              <div className="float-badge-1 absolute -top-3.5 -left-2.5 sm:-top-4 sm:-left-4 bg-white/95 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl shadow-lg flex items-center gap-2 border border-white/90 animate-float z-20">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                      Vet Verified
                    </span>
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-extrabold text-neutral-900 leading-tight">
                    Clinical Standards
                  </p>
                </div>
              </div>

              {/* ── Floating Badge 2: Express Delivery (Bottom Right) ── */}
              <div className="float-badge-2 absolute -bottom-3.5 -right-2.5 sm:-bottom-4 sm:-right-4 bg-white/95 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl shadow-lg flex items-center gap-2 border border-white/90 animate-float-slow z-20">
                <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shadow-inner shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
                    Express Logistics
                  </span>
                  <p className="text-[11px] sm:text-xs font-extrabold text-neutral-900 leading-tight">
                    Pan-India Delivery
                  </p>
                </div>
              </div>

              {/* ── Floating Badge 3: Rating Badge (Bottom Left) ── */}
              <div className="hidden sm:flex absolute bottom-4 -left-3 bg-white/95 backdrop-blur-xl px-2.5 py-1 rounded-xl shadow-md items-center gap-1.5 border border-white/90 z-20">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-2.5 h-2.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-neutral-900">
                  4.9 / 5.0 Rating
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4-Item Luxury Reassurance Strip ── */}
        <div className="hero-trust-bar mt-6 sm:mt-7 pt-4 sm:pt-5 border-t border-stone-200/80 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {TRUST_PROMISES.map((promise) => {
            let IconComponent = ShieldCheck;
            if (promise.iconName === "Truck") IconComponent = Truck;
            if (promise.iconName === "Sparkles") IconComponent = Sparkles;
            if (promise.iconName === "RotateCcw") IconComponent = RotateCcw;

            return (
              <div
                key={promise.title}
                className="hero-trust flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/70 shadow-xs"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${promise.accentBg} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 leading-tight truncate">
                    {promise.title}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                    {promise.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default ShopHero;
