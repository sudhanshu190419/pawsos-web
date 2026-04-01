"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-200 selection:text-orange-900 pb-16 sm:pb-24">
      
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white pt-20 pb-24 sm:pt-24 sm:pb-32 px-4 sm:px-6 overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[400px] bg-orange-500/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-md text-orange-200 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4 sm:mb-6 border border-white/10">
            <span>Our Mission</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight">
            Building India's fastest <br className="hidden sm:block" />
            <span className="text-orange-500">animal rescue network.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed px-2 sm:px-0">
            AnimalSathi (PawSOS) is a technology-driven initiative bridging the gap between distressed animals, compassionate citizens, and verified rescuers.
          </p>
        </div>
      </section>

      {/* QUICK STATS (Overlapping the hero) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-20 mb-16 sm:mb-20">
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl border border-slate-100 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center md:divide-x md:divide-slate-100">
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1">0</p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Seconds to Report</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1">10<span className="text-orange-500">km</span></p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Alert Radius</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1">24/7</p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Active Network</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1">100%</p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Free to Use</p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT STORY */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24">
        
        {/* The Problem */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-4 sm:mb-6 leading-tight">The invisible crisis on our streets.</h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
              Every day, thousands of animals suffer in silence due to accidents, disease, or abandonment. Even when compassionate citizens want to help, they face massive hurdles.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 mt-0.5 sm:mt-1">✕</span>
                <span className="text-sm sm:text-base text-slate-700">No centralized emergency number for animals.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 mt-0.5 sm:mt-1">✕</span>
                <span className="text-sm sm:text-base text-slate-700">Rescuers struggle to find exact locations of injured animals.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 mt-0.5 sm:mt-1">✕</span>
                <span className="text-sm sm:text-base text-slate-700">NGOs are overwhelmed with unorganized WhatsApp messages and calls.</span>
              </li>
            </ul>
          </div>
          <div className="order-1 md:order-2 bg-slate-200 rounded-[1.5rem] sm:rounded-3xl h-64 sm:h-80 w-full overflow-hidden shadow-lg border-4 border-white relative">
             <img src="/animal_suffer.png" alt="Stray dog looking sad" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-slate-900/20 mix-blend-multiply"></div>
          </div>
        </div>

        {/* The Solution */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="bg-orange-100 rounded-[1.5rem] sm:rounded-3xl h-64 sm:h-80 w-full overflow-hidden shadow-lg border-4 border-white relative">
             <img src="/solution.png" alt="Person petting a dog" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4">
              <span>The Solution</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-4 sm:mb-6 leading-tight">Tech-enabled compassion.</h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
              AnimalSathi replaces chaos with coordination. We provide a single, powerful platform where a citizen can report an SOS in seconds with live GPS data.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 mt-0.5 sm:mt-1">✓</span>
                <span className="text-sm sm:text-base text-slate-700"><strong className="text-slate-900">One-Tap SOS:</strong> Instant routing of GPS coordinates and live photos.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 mt-0.5 sm:mt-1">✓</span>
                <span className="text-sm sm:text-base text-slate-700"><strong className="text-slate-900">Proximity Alerts:</strong> Pings volunteers and vets strictly within a 10km radius.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 mt-0.5 sm:mt-1">✓</span>
                <span className="text-sm sm:text-base text-slate-700"><strong className="text-slate-900">Total Transparency:</strong> Track the rescue from reporting to recovery.</span>
              </li>
            </ul>
          </div>
        </div>

      </section>

      {/* FINAL CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-20 sm:mt-32 text-center">
        <div className="bg-orange-50 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-20 border border-orange-100 shadow-sm relative overflow-hidden">
          <div className="absolute -top-16 -right-16 sm:-top-24 sm:-right-24 w-48 h-48 sm:w-64 sm:h-64 bg-orange-200 rounded-full blur-2xl sm:blur-3xl opacity-50"></div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-4 sm:mb-6 relative z-10 leading-tight">
            Be the voice for those <br className="hidden md:block"/> who cannot speak.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-8 sm:mb-10 max-w-xl mx-auto relative z-10 px-2 sm:px-0">
            Whether you want to report emergencies, volunteer your time, or offer veterinary services, your action can save a life today.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 relative z-10 w-full">
            <Link
              href="/download"
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 transition-all duration-300 shadow-lg hover:-translate-y-1 block text-center"
            >
              Get the App
            </Link>
            <Link
              href="/volunteer-form"
              className="w-full sm:w-auto bg-white text-slate-800 border-2 border-slate-200 px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:border-orange-500 hover:text-orange-600 transition-all duration-300 shadow-sm hover:-translate-y-1 block text-center"
            >
              Become a Volunteer
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}