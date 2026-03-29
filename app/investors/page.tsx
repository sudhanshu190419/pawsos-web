"use client";

import Link from "next/link";
import Reveal from "../components/Reveal";
import GradientText from "../components/GradientText";

export default function InvestorsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 overflow-hidden selection:bg-orange-200 selection:text-orange-900">
      
      {/* PITCH HERO */}
      <section className="relative px-6 pt-12 pb-20 md:pt-20 md:pb-32 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-300/20 via-slate-50/0 to-transparent -z-10 pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold tracking-widest uppercase mb-8 shadow-xl shadow-slate-900/10 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Seed Round Now Open
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-slate-900 leading-[1.1]">
          Investing in <GradientText>Infrastructure</GradientText> <br className="hidden md:block"/> for Compassion.
        </h1>
        
        <p className="text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium mb-12">
          AnimalSathi is building India’s first structured, tech-enabled animal emergency response ecosystem. Scalable, transparent, and driven by data.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <a href="mailto:investors@animalsathi.com" className="w-full sm:w-auto bg-orange-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-orange-700 transition-all duration-300 shadow-xl hover:-translate-y-1 hover:shadow-orange-600/30 flex items-center justify-center gap-2">
            Request Pitch Deck
          </a>
          <a href="#roadmap" className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-800 px-10 py-4 rounded-full font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2">
            View Roadmap
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </a>
        </div>
      </section>

      {/* PROBLEM VS SOLUTION (SIDE-BY-SIDE) */}
      <Reveal>
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* The Problem */}
            <div className="bg-red-50/50 backdrop-blur-xl border border-red-100 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group hover:border-red-200 transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-100/50 rounded-full blur-3xl -z-10 group-hover:bg-red-200/50 transition-colors"></div>
              
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100 mb-8">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8">The Problem</h2>
              <ul className="space-y-5">
                <ProblemItem text="No centralized, tech-driven platform for emergency reporting." />
                <ProblemItem text="NGOs rely on fragmented WhatsApp chats and incomplete data." />
                <ProblemItem text="High mortality due to delayed rescues and poor coordination." />
                <ProblemItem text="Zero data accountability or measurable impact for donors/CSR." />
              </ul>
            </div>

            {/* The Solution */}
            <div className="bg-emerald-50/50 backdrop-blur-xl border border-emerald-100 rounded-[3rem] p-8 md:p-12 shadow-xl shadow-emerald-900/5 relative overflow-hidden group hover:border-emerald-200 transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -z-10 group-hover:bg-emerald-200/50 transition-colors"></div>

              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100 mb-8">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Our Solution</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-8 text-lg">
                A unified platform seamlessly connecting citizens, volunteers, and verified NGOs. 
              </p>
              <ul className="space-y-5">
                <SolutionItem text="SOS alerts with live GPS, media, and algorithmic urgency." />
                <SolutionItem text="Automated dispatch to the nearest verified responders." />
                <SolutionItem text="End-to-end transparent workflows with photo verification." />
                <SolutionItem text="Real-time data dashboards for NGOs and Government bodies." />
              </ul>
            </div>

          </div>
        </section>
      </Reveal>

      {/* MARKET OPPORTUNITY & BUSINESS MODEL */}
      <Reveal>
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* Left: Market Data */}
            <div>
              <SectionBadge text="The Market Opportunity" />
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                A Massive, <br/> Underserved Sector.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium">
                India has over <strong className="text-orange-600 font-bold">30+ million stray animals</strong> and thousands of NGOs operating entirely offline. Government bodies, CSR initiatives, and institutional donors are actively seeking transparent, data-driven platforms to deploy capital effectively.
              </p>
              
              {/* Premium Data Widget */}
              <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shrink-0">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Total Addressable Market (India)</div>
                    <div className="text-4xl md:text-5xl font-black text-white">$1.2B+</div>
                    <div className="text-sm text-slate-400 mt-1 font-medium">Pet & Animal Welfare Ecosystem</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Revenue Model */}
            <div>
              <SectionBadge text="Revenue Model" />
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">
                Sustainable Unit Economics.
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <RevenueCard icon="🏢" title="B2B SaaS" desc="Subscriptions for NGOs to access advanced rescue management tools." />
                <RevenueCard icon="🤝" title="CSR Partnerships" desc="Platform fees for executing sponsored rescue campaigns." />
                <RevenueCard icon="📊" title="Data Licensing" desc="City-level dashboard licensing for municipal corporations." />
                <RevenueCard icon="💳" title="Fintech / Tips" desc="Transaction fees on transparent, milestone-based donations." />
              </div>
            </div>

          </div>
        </section>
      </Reveal>

      {/* PRODUCT ROADMAP */}
      <Reveal>
        <section id="roadmap" className="max-w-7xl mx-auto px-6 mb-32 pt-10">
          <div className="text-center mb-20">
            <SectionBadge text="Execution" />
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Product Roadmap</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 relative">
            {/* Desktop connecting line */}
            <div className="hidden lg:block absolute top-[2.2rem] left-10 right-10 h-1 bg-slate-200 z-0 rounded-full"></div>

            <RoadmapCard
              phase="Phase 1"
              status="Live"
              title="Foundation"
              points={["Public SOS reporting app", "Volunteer onboarding", "Basic NGO workflows", "Live rescue tracking"]}
            />
            <RoadmapCard
              phase="Phase 2"
              status="In Progress"
              title="Ecosystem Tools"
              points={["Advanced NGO SaaS dashboards", "City-wise data analytics", "Donor transparency portals", "Admin moderation system"]}
            />
            <RoadmapCard
              phase="Phase 3"
              status="Upcoming"
              title="Scale & Tech"
              points={["AI-based urgency detection", "Municipal govt. partnerships", "Pan-India expansion", "Veterinary telehealth integration"]}
            />
          </div>
        </section>
      </Reveal>

      {/* IMPACT VISION CTA */}
      <Reveal>
        <section className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl border border-slate-800">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/20 via-slate-900 to-slate-900 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                Let's create impact at scale.
              </h2>
              <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                AnimalSathi aims to save thousands of lives annually while creating the largest verified animal welfare dataset in India.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-5 w-full sm:w-auto">
                <a
                  href="mailto:investors@animalsathi.com"
                  className="w-full sm:w-auto bg-orange-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-all duration-300 shadow-xl hover:-translate-y-1 hover:shadow-orange-500/30 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Contact Founders
                </a>
                <a
                  href="/deck.pdf" 
                  target="_blank"
                  className="w-full sm:w-auto bg-slate-800 border-2 border-slate-700 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-700 hover:border-slate-600 transition-all duration-300 shadow-sm hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download Deck
                </a>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

    </main>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function SectionBadge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-700 text-xs font-black tracking-widest uppercase rounded-full mb-6 border border-orange-200 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
      {text}
    </div>
  );
}

function ProblemItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-4">
      <div className="mt-1 flex-shrink-0 bg-red-100 p-1 rounded-full text-red-500">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
      <span className="text-slate-700 font-medium">{text}</span>
    </li>
  );
}

function SolutionItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-4">
      <div className="mt-1 flex-shrink-0 bg-emerald-100 p-1 rounded-full text-emerald-600">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </div>
      <span className="text-slate-800 font-bold">{text}</span>
    </li>
  );
}

function RevenueCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-orange-500/5 hover:border-orange-200 hover:-translate-y-1 transition-all duration-300 group">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mb-4 border border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
        {icon}
      </div>
      <h3 className="font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-sm font-medium text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function RoadmapCard({ phase, status, title, points }: { phase: string; status: string; title: string; points: string[] }) {
  const isLive = status === "Live";
  const isInProgress = status === "In Progress";
  
  return (
    <div className="relative z-10 pt-4 lg:pt-0">
      {/* Node on the timeline */}
      <div className={`hidden lg:flex w-10 h-10 rounded-full border-4 border-slate-50 absolute -top-5 left-8 items-center justify-center shadow-lg transition-colors duration-500 ${isLive ? 'bg-green-500' : isInProgress ? 'bg-orange-500' : 'bg-slate-300'}`}>
        {isLive && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        {isInProgress && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
      </div>

      <div className={`bg-white border ${isLive || isInProgress ? 'border-orange-200 shadow-xl' : 'border-slate-200 shadow-sm'} rounded-[2.5rem] p-8 md:p-10 h-full hover:-translate-y-1 transition-transform duration-300`}>
        <div className="flex justify-between items-center mb-6">
          <span className="text-slate-400 font-black text-sm tracking-widest uppercase">{phase}</span>
          <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${isLive ? 'bg-green-100 text-green-700' : isInProgress ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
            {status}
          </span>
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-6">{title}</h3>
        
        <ul className="space-y-4">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-600 font-medium text-sm">
              <span className={`mt-0.5 flex-shrink-0 ${isLive || isInProgress ? 'text-orange-500' : 'text-slate-300'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}