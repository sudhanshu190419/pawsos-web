const fs = require('fs');
const content = `"use client";

import { memo, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   HERO STYLES
───────────────────────────────────────────────────────────── */
export const HeroStyles = () => (
  <style>{\`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

    .hs-serif { font-family: 'Playfair Display', Georgia, serif; }
    .hs-sans  { font-family: 'DM Sans', system-ui, sans-serif; }

    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
      display: inline-block;
      vertical-align: middle;
    }
    .material-symbols-outlined.fill {
      font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24;
    }

    /* Glass panel */
    .hs-glass {
      background: rgba(252, 249, 248, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(137, 115, 101, 0.1);
    }

    /* Floating animations */
    @keyframes hs-float {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-15px); }
    }
    @keyframes hs-float-delayed {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-15px); }
    }

    /* Entrance animations — staggered fade-in-up */
    @keyframes hs-up {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hs-a1 { animation: hs-up 1s cubic-bezier(.16,1,.3,1) 0.2s both; }
    .hs-a2 { animation: hs-up 1s cubic-bezier(.16,1,.3,1) 0.4s both; }
    .hs-a3 { animation: hs-up 1s cubic-bezier(.16,1,.3,1) 0.6s both; }
    .hs-a4 { animation: hs-up 1s cubic-bezier(.16,1,.3,1) 0.8s both; }
    .hs-a5 { animation: hs-up 1s cubic-bezier(.16,1,.3,1) 1s both; }

    /* CTA hover */
    .hs-btn-primary {
      background: #e67e22;
      color: #fff;
      font-weight: 600;
      transition: transform .2s cubic-bezier(.16,1,.3,1), box-shadow .25s cubic-bezier(.16,1,.3,1);
    }
    .hs-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px -8px rgba(0,0,0,.24);
    }
    .hs-btn-secondary {
      background: transparent;
      color: #1b1c1c;
      border: 1px solid #897365;
      font-weight: 600;
      transition: border-color .2s, background .2s, transform .2s cubic-bezier(.16,1,.3,1);
    }
    .hs-btn-secondary:hover {
      background: #e4e2e1;
      transform: translateY(-2px);
    }

    /* reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .hs-a1, .hs-a2, .hs-a3, .hs-a4, .hs-a5 { animation: none; opacity: 1; }
      .hs-motion-safe { animation: none !important; }
    }

    @media (max-width: 640px) {
      .hs-a3 { animation-delay: 0.30s !important; }
      .hs-a4 { animation-delay: 0.36s !important; }
    }
  \`}</style>
);

/* ─────────────────────────────────────────────────────────────
   RIGHT SIDE — Premium product visual composition
───────────────────────────────────────────────────────────── */
const Visual3D = () => (
  <div className="relative w-full h-[500px] sm:h-[560px] md:h-[600px] flex items-center justify-center md:justify-end select-none">
    {/* ── Decorative gradient blobs ── */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full blur-3xl -z-10" />
    <div className="absolute bottom-10 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-2xl -z-10" />
    <div className="absolute top-12 left-4 w-48 h-48 bg-amber-200/15 rounded-full blur-2xl -z-10" />

    {/* ── Main product image ── */}
    <div className="relative z-10 hs-motion-safe" style={{ animation: "hs-float 6s ease-in-out infinite" }}>
      <img
        src="/pet-shop.png"
        alt="AnimalSathi Premium Pet Wellness Products Composition"
        className="rounded-xl shadow-2xl w-full max-w-sm md:max-w-md lg:max-w-lg object-cover"
      />

      {/* ── Floating card 1: Fast Delivery (top-left) ── */}
      <div
        className="absolute -top-8 -left-6 md:-top-10 md:-left-10 hs-glass p-4 md:p-6 rounded-xl shadow-lg flex items-center space-x-3 md:space-x-4 hs-motion-safe"
        style={{ animation: "hs-float-delayed 6s ease-in-out 2s infinite", zIndex: 20 }}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-100 flex items-center justify-center text-[#944a00]">
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">local_shipping</span>
        </div>
        <div>
          <p className="hs-sans text-[11px] md:text-[12px] font-bold text-[#944a00] uppercase tracking-wider">Fast Delivery</p>
          <p className="hs-sans text-[12px] md:text-[14px] text-[#564337]">Across India</p>
        </div>
      </div>

      {/* ── Floating card 2: Expert Approved (bottom-right) ── */}
      <div
        className="absolute -bottom-6 -right-4 md:-bottom-8 md:-right-8 hs-glass p-4 md:p-6 rounded-xl shadow-lg flex items-center space-x-3 md:space-x-4 hs-motion-safe"
        style={{ animation: "hs-float 6s ease-in-out infinite", zIndex: 20 }}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-100 flex items-center justify-center text-[#3b6934]">
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">health_and_safety</span>
        </div>
        <div>
          <p className="hs-sans text-[11px] md:text-[12px] font-bold text-[#3b6934] uppercase tracking-wider">Expert Approved</p>
          <p className="hs-sans text-[12px] md:text-[14px] text-[#564337]">Clinical Formulation</p>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
const ShopHero = memo(({ onShopNow, onExplore }: { onShopNow?: () => void; onExplore?: () => void }) => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const blobs = el.querySelectorAll<HTMLElement>('.blur-3xl, .blur-2xl');
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      blobs.forEach((blob, index) => {
        const speed = (index + 1) * 20;
        blob.style.transform = \`translate(\${x * speed}px, \${y * speed}px)\`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section ref={heroRef} className="hs-sans relative overflow-hidden" style={{ background: "#fcf9f8" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
          {/* ── LEFT ── */}
          <div className="flex flex-col space-y-8 md:space-y-10">
            {/* Eyebrow */}
            <div className="hs-a1">
              <span className="hs-sans inline-flex items-center px-4 py-1.5 rounded-full bg-[#e1e1c9] text-[#474836] text-[11px] font-semibold uppercase tracking-[0.05em]">
                Premium Wellness For Pets
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4 md:space-y-6">
              <h1 className="hs-serif text-[2rem] sm:text-[2.5rem] md:text-[2.75rem] lg:text-[3rem] leading-[1.2] tracking-[-0.02em] font-bold text-[#1b1c1c] hs-a2">
                Wellness that speaks<br className="hidden sm:block" /> the language of love.
              </h1>
              <p className="hs-sans text-[15px] sm:text-[16px] md:text-[18px] text-[#564337] leading-[1.6] max-w-md hs-a3">
                India's most trusted pet-care ecosystem, delivering vet-verified essentials and premium wellness products for your best friend.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 hs-a4">
              <button
                onClick={onShopNow}
                className="hs-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-lg text-[15px] md:text-[16px] active:scale-95"
              >
                Shop Collection
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onExplore}
                className="hs-btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-lg text-[15px] md:text-[16px] active:scale-95"
              >
                Talk to a Vet
              </button>
            </div>

            {/* Trust signals */}
            <div className="space-y-6 pt-4 hs-a5">
              {/* Avatar circles + stars */}
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-[#fcf9f8] bg-[#eae7e7]" />
                  <div className="w-8 h-8 rounded-full border-2 border-[#fcf9f8] bg-[#f0eded]" />
                  <div className="w-8 h-8 rounded-full border-2 border-[#fcf9f8] bg-[#dcd9d9]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex text-[#FFD700]">
                    <span className="material-symbols-outlined fill text-[16px]">star</span>
                    <span className="material-symbols-outlined fill text-[16px]">star</span>
                    <span className="material-symbols-outlined fill text-[16px]">star</span>
                    <span className="material-symbols-outlined fill text-[16px]">star</span>
                    <span className="material-symbols-outlined fill text-[16px]">star</span>
                  </div>
                  <p className="hs-sans text-[12px] md:text-[14px] text-[#564337]">Trusted by 50,000+ happy pet parents</p>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-5 md:gap-6 border-t border-[#dcc1b1]/30 pt-6">
                <div className="flex items-center space-x-2 text-[#564337]">
                  <span className="material-symbols-outlined text-[#3b6934] text-[18px]">verified</span>
                  <span className="hs-sans text-[10px] md:text-[12px] font-semibold uppercase tracking-[0.05em]">Vet-Verified</span>
                </div>
                <div className="flex items-center space-x-2 text-[#564337]">
                  <span className="material-symbols-outlined text-[#3b6934] text-[18px]">eco</span>
                  <span className="hs-sans text-[10px] md:text-[12px] font-semibold uppercase tracking-[0.05em]">Ethically Sourced</span>
                </div>
                <div className="flex items-center space-x-2 text-[#564337]">
                  <span className="material-symbols-outlined text-[#3b6934] text-[18px]">workspace_premium</span>
                  <span className="hs-sans text-[10px] md:text-[12px] font-semibold uppercase tracking-[0.05em]">Premium Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Product visual ── */}
          <div className="relative">
            <Visual3D />
          </div>
        </div>
      </div>
    </section>
  );
});

ShopHero.displayName = "ShopHero";
export default ShopHero;
`;

fs.writeFileSync('app/components/ShopHero.tsx', content, 'utf8');
console.log('File written successfully');
console.log('Size:', content.length, 'bytes');
