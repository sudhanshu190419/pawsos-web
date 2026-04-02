"use client";

import Link from "next/link";
import Reveal from "../components/Reveal";
import GradientText from "../components/GradientText";

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-32 overflow-hidden selection:bg-orange-200">
      
      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-orange-300/20 rounded-full blur-[80px] sm:blur-[120px] -z-10 pointer-events-none"></div>

        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-black tracking-widest uppercase mb-6 sm:mb-8 shadow-xl border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Available Now on Android
          </div>
        </Reveal>

        <Reveal>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 text-slate-900 leading-[1.1]">
            Save Lives with <br className="hidden sm:block" />
            <GradientText>AnimalSathi</GradientText>
          </h1>
        </Reveal>

        <Reveal>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium mb-10 px-2">
            The power to report emergencies, coordinate rescues, and track animal recovery is now in your pocket. 
          </p>
        </Reveal>

        <Reveal>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <a
              href="https://play.google.com/store/apps/details?id=com.pawsos"
              target="_blank"
              className="w-full sm:w-auto bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/25 hover:-translate-y-1 flex items-center justify-center gap-3 group"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L18.65,14.07C20.41,13.03 20.41,10.97 18.65,9.93L16.81,8.88L14.75,10.94L16.81,15.12M4.6,22.25L15.39,16.12L13.33,14.06L4.6,22.25M13.33,9.94L15.39,7.88L4.6,1.75L13.33,9.94Z" /></svg>
              Get it on Google Play
            </a>
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              Learn More
            </Link>
          </div>
        </Reveal>
      </section>

      {/* FEATURE GRID & PHONE MOCKUP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 sm:mb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Features Column */}
          <div className="order-2 lg:order-1 space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              One app for the entire <br/> rescue ecosystem.
            </h2>
            
            <div className="space-y-4 sm:space-y-5">
              <FeatureItem title="One-Tap SOS" desc="Report injured animals with instant GPS and live photos." icon="🚨" />
              <FeatureItem title="10km Alert Radius" desc="Automatically ping verified rescuers nearest to the location." icon="📍" />
              <FeatureItem title="Real-Time Tracking" desc="Monitor the status of your reported case from rescue to rehab." icon="🤝" />
              <FeatureItem title="Community Feed" desc="Stay updated with rescue stories happening in your city." icon="📸" />
            </div>
          </div>

          {/* Phone Mockup Column */}
          <div className="order-1 lg:order-2 relative flex justify-center">
            {/* Background Decorative Circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 bg-orange-100 rounded-full blur-2xl -z-10"></div>
            
            <div className="relative w-[240px] h-[480px] sm:w-[280px] sm:h-[560px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-[6px] border-slate-800 flex flex-col items-center justify-center group overflow-hidden">
               {/* Internal "Screen" */}
               <div className="w-full h-full bg-slate-100 rounded-[1.8rem] flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-orange-100">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                  </div>
                  <h4 className="text-slate-900 font-black text-xl mb-2">AnimalSathi</h4>
                  <div className="w-full h-1 bg-slate-200 rounded-full mb-4"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-8 bg-orange-500 rounded-lg animate-pulse"></div>
                    <div className="h-16 bg-white rounded-lg border border-slate-200"></div>
                  </div>
                  <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">v1.2.0 Live</p>
               </div>
               
               {/* Notch */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <Reveal>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 sm:mb-32">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">How It Works</h2>
            <div className="w-16 h-1 bg-orange-500 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <StepCard step="01" title="Spot" text="See an animal in distress" />
            <StepCard step="02" title="Report" text="Tap SOS in the app" />
            <StepCard step="03" title="Rescue" text="Volunteers get notified" />
            <StepCard step="04" title="Update" text="Track the recovery" />
          </div>
        </section>
      </Reveal>

      {/* FINAL CALL TO ACTION */}
      <Reveal>
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-16 text-center relative overflow-hidden border border-slate-700 shadow-2xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">Ready to save lives?</h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10 font-medium leading-relaxed">
                Join India's fastest growing community of animal rescuers. Download the app today and make a real difference.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <a
                  href="https://play.google.com/store/apps/details?id=com.pawsos"
                  target="_blank"
                  className="w-full sm:w-auto bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition shadow-lg"
                >
                  Download App
                </a>
                <Link
                  href="/"
                  className="w-full sm:w-auto bg-slate-800 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 transition"
                >
                  Return Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

    </main>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function FeatureItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="w-12 h-12 shrink-0 bg-orange-50 rounded-xl flex items-center justify-center text-2xl border border-orange-100">
        {icon}
      </div>
      <div>
        <h3 className="font-black text-slate-800 text-lg">{title}</h3>
        <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StepCard({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:border-orange-200 transition-colors flex flex-col items-center text-center group">
      <div className="text-xs font-black text-orange-500 mb-3 tracking-widest uppercase">Step {step}</div>
      <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">{text}</p>
    </div>
  );
}