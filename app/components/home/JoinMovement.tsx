"use client";

import Link from "next/link";
import Reveal from "../Reveal";

const PARTNERS = [
  {
    icon: "corporate_fare",
    title: "NGO partnerships",
    description: "Register your rescue organization, onboard your response teams, and coordinate street rescues through a shared operational dashboard.",
  },
  {
    icon: "medical_services",
    title: "Veterinary clinics",
    description: "List your clinic, accept digital booking schedules, and provide professional medical consultations for pet parents and rescuers.",
  },
  {
    icon: "local_hospital",
    title: "Animal hospitals",
    description: "Manage medical admissions, track patient recovery cases, and connect directly with the emergency rescue networks in your region.",
  },
];

export default function JoinMovement() {
  return (
    <section className="relative bg-secondary py-20 md:py-28 lg:py-36 overflow-hidden">
      {/* Decorative organic background shape */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] height-[600px] rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading & Info */}
          <div className="flex flex-col items-start">
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/50 font-semibold mb-4 block">
                For organizations
              </span>
            </Reveal>
            
            <Reveal>
              <h2 className="font-display italic text-3xl md:text-4xl lg:text-5xl text-white leading-[1.1]">
                Partner with us
              </h2>
            </Reveal>
            
            <Reveal>
              <p className="text-white/70 text-base md:text-lg font-sans leading-relaxed mt-6 max-w-[50ch]">
                Whether you are a local animal shelter, an established NGO, a veterinary clinic, 
                or a multi-specialty animal hospital, AnimalSathi supplies the technology you need 
                to track cases, handle bookings, and reach volunteers.
              </p>
            </Reveal>
            
            <Reveal>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 mt-8 bg-white text-secondary hover:bg-white/95 px-7 py-3.5 rounded-xl text-sm font-bold hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 shadow-md group"
              >
                <span>Get started</span>
                <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </Reveal>
          </div>

          {/* Right Column: Stacked Cards */}
          <div className="flex flex-col gap-4 md:gap-5 w-full">
            {PARTNERS.map((partner, index) => (
              <div key={index}>
                <Reveal>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 flex gap-4 md:gap-5 items-start">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">
                        {partner.icon}
                      </span>
                    </div>

                    {/* Text */}
                    <div>
                      <h3 className="text-lg font-bold text-white font-sans">
                        {partner.title}
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed mt-1.5 font-sans">
                        {partner.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
