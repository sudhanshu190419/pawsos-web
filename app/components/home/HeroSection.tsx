"use client";

import Link from "next/link";
import ParallaxHero from "../ParallaxHero";
import Image from "next/image";
import { AlertCircle, Users } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="relative z-10">
      <ParallaxHero>
        <section className="w-full px-2 sm:px-4 md:px-8 lg:px-16 mt-4 md:mt-6 md:bg-[#FAFAFA] bg-[#FEF4E8]">
          <div className="relative w-full h-auto">
            <Image
              src="/banner.png"
              alt="AnimalSathi Banner"
              width={1200}
              height={600}
              className="hidden md:block w-full h-auto object-contain scale-110"
              priority
            />
            <img
              src="/banner-mobile.png"
              alt="AnimalSathi Mobile Banner"
              className="block md:hidden w-full h-auto object-contain scale-100 origin-center"
            />
            {/* Hero CTA Buttons — overlaid on image, bottom-center */}
            <div className="absolute bottom-1.5 sm:bottom-8 left-0 right-0 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 px-3 sm:px-6 md:pl-16 lg:pl-32 z-10">
              {/* Primary Button: Report SOS */}
              <Link
                href="/report"
                className="w-[95%] sm:w-auto mx-auto sm:mx-0 py-2.5 sm:py-3.5 px-4 sm:px-6 bg-primary text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-primary/20 min-h-[44px]"
              >
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Report a SOS
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              {/* Secondary Button: Become Volunteer */}
              <Link
                href="/volunteer-form"
                className="w-[95%] sm:w-auto mx-auto sm:mx-0 py-2.5 sm:py-3.5 px-4 sm:px-6 border-2 border-slate-100 bg-white/95 backdrop-blur-md text-slate-700 font-bold text-xs sm:text-sm rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-slate-200/50 hover:-translate-y-0.5 min-h-[44px]"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                Become a Volunteer
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </ParallaxHero>
    </div>
  );
}
