"use client";

import Link from "next/link";
import Reveal from "../components/Reveal";
import GradientText from "../components/GradientText";

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16 sm:pb-32 overflow-hidden selection:bg-orange-200">
      
      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-6 pt-20 sm:pt-32 pb-16 sm:pb-24 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[600px] h-[250px] sm:h-[600px] bg-orange-300/20 rounded-full blur-[80px] sm:blur-[120px] -z-10 pointer-events-none"></div>

        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-black tracking-widest uppercase mb-6 sm:mb-8 shadow-xl border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Available Now on Android
          </div>
        </Reveal>

        <Reveal>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 text-slate-900 leading-[1.15]">
            Save Lives with <br className="hidden sm:block" />
            <GradientText>AnimalSathi</GradientText>
          </h1>
        </Reveal>

        <Reveal>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium mb-10 px-2 sm:px-0">
            The power to report emergencies, coordinate rescues, and track animal recovery is now in your pocket. 
          </p>
        </Reveal>

        <Reveal>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <a
              href="https://play.google.com/store/apps/details?id=com.pawsos"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-orange-500 text-white px-6 sm:px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/25 hover:-translate-y-1 flex items-center justify-center gap-3 group"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L18.65,14.07C20.41,13.03 20.41,10.97 18.65,9.93L16.81,8.88L14.75,10.94L16.81,15.12M4.6,22.25L15.39,16.12L13.33,14.06L4.6,22.25M13.33,9.94L15.39,7.88L4.6,1.75L13.33,9.94Z" /></svg>
              Get it on Google Play
            </a>
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-6 sm:px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              Learn More
            </Link>
          </div>
        </Reveal>
      </section>

      {/* FEATURE GRID & PHONE MOCKUP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Features Column */}
          <div className="order-2 lg:order-1 space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight text-center lg:text-left">
              One app for the entire <br className="hidden sm:block" /> rescue ecosystem.
            </h2>
            
            <div className="space-y-4 sm:space-y-5">
              <FeatureItem title="One-Tap SOS" desc="Report injured animals with instant GPS and live photos." icon="🚨" />
              <FeatureItem title="10km Alert Radius" desc="Automatically ping verified rescuers nearest to the location." icon="📍" />
              <FeatureItem title="Real-Time Tracking" desc="Monitor the status of your reported case from rescue to rehab." icon="🤝" />
              <FeatureItem title="Community Feed" desc="Stay updated with rescue stories happening in your city." icon="📸" />
            </div>
          </div>

          {/* Phone Mockup Column */}
          <div className="order-1 lg:order-2 relative flex justify-center mt-8 lg:mt-0">
            {/* Background Decorative Circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 bg-orange-100 rounded-full blur-2xl -z-10"></div>
            
            <div className="relative flex justify-center">
              {/* Glow rings */}
              <div className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] rounded-full border border-orange-200"></div>
              <div className="absolute w-[300px] h-[300px] sm:w-[440px] sm:h-[440px] rounded-full border border-orange-100 hidden sm:block"></div>
              <div className="absolute w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] rounded-full bg-orange-300/30 blur-3xl"></div>

              {/* Premium Phone */}
              <div className="relative w-[220px] h-[440px] sm:w-[250px] sm:h-[500px] md:w-[270px] md:h-[540px] rounded-[36px] sm:rounded-[40px] md:rounded-[44px] p-[8px] sm:p-[9px] md:p-[10px] bg-gradient-to-br from-stone-800 to-stone-950 shadow-[0_30px_60px_rgba(0,0,0,0.25)] sm:shadow-[0_40px_80px_rgba(0,0,0,0.35)] animate-[float_5s_ease-in-out_infinite] rotate-[-2deg]">
                
                {/* Screen */}
                <div className="w-full h-full rounded-[30px] sm:rounded-[36px] overflow-hidden bg-black relative">
                  <img
                    src="/app-preview.png"
                    alt="AnimalSathi App"
                    className="w-full h-full object-cover object-top"
                  />

                  {/* Glass reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                </div>

                {/* Notch */}
                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[90px] sm:w-[110px] h-[20px] sm:h-[22px] bg-stone-950 rounded-b-2xl z-20"></div>

                {/* Side Buttons */}
                <div className="absolute right-[-3px] top-[90px] sm:top-[100px] w-[3px] h-[46px] sm:h-[56px] bg-stone-800 rounded-r-md"></div>
                <div className="absolute left-[-3px] top-[80px] sm:top-[88px] w-[3px] h-[30px] sm:h-[36px] bg-stone-800 rounded-l-md"></div>
                <div className="absolute left-[-3px] top-[120px] sm:top-[136px] w-[3px] h-[30px] sm:h-[36px] bg-stone-800 rounded-l-md"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR DOWNLOAD SECTION */}
      <Reveal>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-32">
          <div className="bg-white border border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center">
              
              {/* Left Side Content */}
              <div className="p-6 sm:p-8 md:p-12 text-center md:text-left">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider mb-6">
                  Quick Download
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">
                  Get AnimalSathi <br className="hidden md:block" />
                  in Seconds
                </h2>

                <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed mb-6 max-w-md mx-auto md:mx-0">
                  Scan the QR code and instantly install AnimalSathi on your phone. 
                  Faster access means faster rescues.
                </p>

                <div className="space-y-2 sm:space-y-3 text-sm sm:text-base font-medium text-slate-600 inline-block text-left">
                  <p>✓ Report emergencies instantly</p>
                  <p>✓ Connect with nearby rescuers</p>
                  <p>✓ Track rescue progress live</p>
                </div>
              </div>

              {/* Right Side QR */}
              <div className="bg-slate-50 h-full flex items-center justify-center p-8 sm:p-12 border-t md:border-t-0 md:border-l border-slate-100">
                <div className="bg-slate-900 border border-orange-100 rounded-[24px] sm:rounded-[28px] p-5 sm:p-8 text-center shadow-2xl w-full max-w-[280px] sm:max-w-none">
                  <div className="bg-white rounded-2xl p-4 mb-5 flex justify-center">
                    <img
                      src="/qr-code.png"
                      alt="QR Code"
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
                    />
                  </div>

                  <p className="font-black text-white text-base sm:text-lg">
                    Scan to Download
                  </p>

                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Android · Free · Instant
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </Reveal>

      {/* HOW IT WORKS SECTION */}
      <Reveal>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-32">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">How It Works</h2>
            <div className="w-16 h-1 bg-orange-500 mx-auto mt-4 rounded-full"></div>
          </div>

          {/* Changed grid to 1 col on mobile, 2 on sm, 4 on md to prevent text squishing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
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
          <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 md:p-16 text-center relative overflow-hidden border border-slate-700 shadow-2xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 sm:mb-6">Ready to save lives?</h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-xl mx-auto mb-8 sm:mb-10 font-medium leading-relaxed">
                Join India's fastest growing community of animal rescuers. Download the app today and make a real difference.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto">
                <a
                  href="https://play.google.com/store/apps/details?id=com.pawsos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-orange-600 transition shadow-lg flex justify-center"
                >
                  Download App
                </a>
                <Link
                  href="/"
                  className="w-full sm:w-auto bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-slate-700 transition flex justify-center"
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
      <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-orange-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl border border-orange-100">
        {icon}
      </div>
      <div>
        <h3 className="font-black text-slate-800 text-base sm:text-lg">{title}</h3>
        <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed mt-1 sm:mt-0">{desc}</p>
      </div>
    </div>
  );
}

function StepCard({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm hover:border-orange-200 transition-colors flex flex-col items-center text-center group">
      <div className="text-[10px] sm:text-xs font-black text-orange-500 mb-2 sm:mb-3 tracking-widest uppercase">Step {step}</div>
      <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-1 sm:mb-2">{title}</h3>
      <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">{text}</p>
    </div>
  );
}