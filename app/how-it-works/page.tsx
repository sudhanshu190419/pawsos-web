"use client";

import Link from "next/link";
import Reveal from "../components/Reveal";
import GradientText from "../components/GradientText";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden pb-16 sm:pb-24 selection:bg-orange-200 selection:text-orange-900">
      
      {/* PAGE HERO */}
      <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 md:pt-32 md:pb-32 text-center max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Ambient Background Glows */}
        <div className="absolute top-0 w-full h-[400px] sm:h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-300/20 via-slate-50/0 to-transparent -z-10 pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-orange-400/10 rounded-full blur-[80px] sm:blur-[120px] -z-10 pointer-events-none"></div>

        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white border border-orange-200 text-orange-600 text-[10px] sm:text-xs font-black tracking-widest uppercase mb-6 sm:mb-8 shadow-sm">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-orange-500"></span>
            </span>
            The Process
          </div>
        </Reveal>

        <Reveal>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-4 sm:mb-8 text-slate-900 leading-tight sm:leading-[1.1]">
            How <GradientText>AnimalSathi</GradientText> Works
          </h1>
          
          <p className="text-base sm:text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium mb-8 sm:mb-12 px-2 sm:px-0">
            We seamlessly connect compassionate citizens, dedicated volunteers, and verified NGOs to ensure distressed animals receive help instantly.
          </p>
        </Reveal>
      </section>

      {/* TIMELINE SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 py-8 sm:py-12 md:py-20">
        
        <div className="relative">
          {/* The Continuous Vertical Glowing Line */}
          {/* 🔥 FIX: Adjusted left alignment for mobile (left-6 instead of left-8) */}
          <div className="absolute left-6 sm:left-8 md:left-1/2 top-0 bottom-0 w-1 md:w-1.5 bg-gradient-to-b from-orange-100 via-orange-400 to-orange-100 -translate-x-1/2 rounded-full z-0 opacity-60"></div>

          <div className="space-y-10 sm:space-y-12 md:space-y-24 relative z-10">
            
            <TimelineStep 
              step="01" 
              title="Report an Emergency" 
              text="Any citizen can instantly report an injured or distressed animal using the AnimalSathi mobile app. The report securely captures live GPS coordinates, photos, and vital emergency details."
              align="left"
              svgIcon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" strokeWidth={2.5}/></svg>}
            />
            
            <TimelineStep 
              step="02" 
              title="Nearby Volunteers Alerted" 
              text="Verified volunteers strictly within a 10km radius receive real-time push notifications. They view exact details on the map and quickly accept the request to provide immediate first aid or transport."
              align="right"
              svgIcon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            />

            <TimelineStep 
              step="03" 
              title="NGOs & Rescuers Respond" 
              text="Partner NGOs and specialized rescue teams receive structured, verified information directly to their dashboards. This reduces confusion, improves dispatch times, and drastically speeds up rescues."
              align="left"
              svgIcon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />

            <TimelineStep 
              step="04" 
              title="Updates & Transparency" 
              text="Once the situation is resolved, volunteers or NGOs upload rescue updates with before-and-after images. The original reporter is notified, ensuring complete transparency and building trust."
              align="right"
              svgIcon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />

            <TimelineStep 
              step="05" 
              title="Impact Tracking & Growth" 
              text="AnimalSathi tracks all rescues, response times, and volunteer participation. This vital data helps optimize city-wide operations and demonstrate real-world impact to supporters and donors."
              align="left"
              svgIcon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
            />

          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <Reveal>
        <section className="px-4 sm:px-6 mt-20 sm:mt-32 max-w-5xl mx-auto">
          <div className="bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-8 sm:p-12 md:p-20 text-center border border-slate-800 relative overflow-hidden">
            
            {/* Dark Mode Glows */}
            <div className="absolute top-0 right-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-orange-500/15 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[150px] sm:w-[300px] h-[150px] sm:h-[300px] bg-orange-600/15 rounded-full blur-[60px] sm:blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <p className="inline-block bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] sm:text-xs mb-4 sm:mb-6">
                Every Second Counts
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 sm:mb-8 tracking-tight leading-tight">
                A single report can <br className="hidden sm:block" /> <span className="text-orange-500">save a life.</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 sm:mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                Join AnimalSathi today. Be the voice for the voiceless and help us build a safer world for animals across India.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-orange-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 transition-all duration-300 shadow-xl hover:shadow-orange-500/25 hover:-translate-y-1 flex justify-center items-center gap-2 sm:gap-3 group"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download App
                </a>
                <Link
                  href="/volunteer-form"
                  className="w-full sm:w-auto bg-slate-800 border-2 border-slate-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-slate-700 hover:border-slate-600 transition-all duration-300 shadow-lg hover:-translate-y-1 flex justify-center items-center gap-2 sm:gap-3 group"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Become a Volunteer
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

    </main>
  );
}

/* ---------- INTELLIGENT TIMELINE STEP COMPONENT ---------- */

function TimelineStep({ 
  step, 
  title, 
  text, 
  align,
  svgIcon 
}: { 
  step: string; 
  title: string; 
  text: string; 
  align: "left" | "right";
  svgIcon: React.ReactNode;
}) {
  const isLeft = align === "left";

  return (
    <Reveal>
      <div className={`relative flex flex-col md:flex-row items-center w-full group ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}>
        
        {/* THE NODE (Center on Desktop, Left on Mobile) */}
        {/* 🔥 FIX: Changed mobile left positioning to left-6 to match the line */}
        <div className="absolute left-6 sm:left-8 md:left-1/2 top-10 sm:top-12 md:top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-white border-[3px] sm:border-[4px] md:border-[6px] border-orange-100 rounded-full flex items-center justify-center font-black text-sm sm:text-lg md:text-2xl text-slate-300 group-hover:border-orange-500 group-hover:text-orange-500 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-500 z-10 bg-clip-padding">
            {step}
          </div>
        </div>

        {/* CONTENT CARD */}
        {/* 🔥 FIX: Changed pl-24 to pl-16 on mobile so text has more room */}
        <div className={`w-full md:w-1/2 relative z-10 pl-16 sm:pl-24 md:pl-0 ${isLeft ? "md:pr-16" : "md:pl-16"}`}>
          
          <div className="bg-white p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 group-hover:shadow-2xl group-hover:shadow-orange-500/5 group-hover:border-orange-200 transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 relative overflow-hidden">
            
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 items-start">
              {/* Icon Container */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 text-orange-500 flex items-center justify-center border border-orange-200 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-sm">
                {svgIcon}
              </div>
              
              {/* Text Content */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 sm:mb-3 tracking-tight">
                  {title}
                </h2>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
                  {text}
                </p>
              </div>
            </div>
            
          </div>
        </div>

        {/* EMPTY SPACE (To push the card to the correct side on desktop) */}
        <div className="hidden md:block w-1/2"></div>

      </div>
    </Reveal>
  );
}