"use client";

import Link from "next/link";
import ParallaxHero from "./components/ParallaxHero";
import Reveal from "./components/Reveal";
import Counter from "./components/Counter";
import GradientText from "./components/GradientText";
import { useState, useEffect } from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fcf1db] text-slate-900 selection:bg-orange-200 selection:text-orange-900 overflow-hidden">
      
      {/* HERO SECTION - Forced to the back (z-0) */}
      <div className="relative z-0">
        <ParallaxHero>
          <section className="w-full px-2 sm:px-4 md:px-8 lg:px-16 mt-4 md:mt-6 lg:mt-6">
            <div className="relative w-full h-auto">
              <img
                src="/banner.png"
                alt="AnimalSathi Banner"
                className="hidden md:block w-full h-auto object-contain scale-110"
              />

              <img
                src="/banner-mobile.png" 
                alt="AnimalSathi Mobile Banner"
                className="block md:hidden w-full h-auto object-contain scale-105 origin-center"
              />
            </div>
          </section>
        </ParallaxHero>
      </div>

      {/* CORE FEATURES & BANNER BUTTONS - Forced to the front (z-20) */}
      <div className="relative z-20">
        <Reveal>
          {/* 🔥 FIX: Changed -mt-24 to -mt-12 on mobile to prevent buttons from covering the banner image */}
          <section className="relative -mt-28 sm:-mt-24 md:-mt-32 px-4 sm:px-6">
            
            {/* 🔥 NEW BUTTONS SITTING ON THE BANNER */}
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 sm:gap-4 mb-6 sm:mb-8 md:pl-4">
              <Link
                href="/volunteer-form"
                // 🔥 FIX: Added 'w-full sm:w-auto' for better mobile tapping
                className="w-full sm:w-auto bg-orange-500 text-white px-6 sm:px-8 py-3.5 rounded-full font-bold text-base md:text-lg hover:bg-orange-600 transition-all duration-300 shadow-xl shadow-orange-500/30 hover:-translate-y-1 flex items-center justify-center gap-2 group"
              >
                <span className="group-hover:scale-110 transition-transform">🦸‍♂️</span> Become a Volunteer
              </Link>

              <Link
                href="/shop"
                // 🔥 FIX: Added 'w-full sm:w-auto'
                className="w-full sm:w-auto bg-slate-900 text-white px-6 sm:px-8 py-3.5 rounded-full font-bold text-base md:text-lg hover:bg-slate-800 transition-all duration-300 shadow-xl hover:shadow-slate-900/30 hover:-translate-y-1 flex items-center justify-center gap-2 group"
              >
                <span className="group-hover:scale-110 transition-transform">🛒</span> Visit Pet Shop
              </Link>
            </div>

            {/* THE 4 MINI CARDS */}
            {/* 🔥 FIX: Changed gap-4 to gap-3 on mobile to prevent squishing */}
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <FeatureMini icon="🚨" title="SOS Alerts" text="Instant emergency reporting" />
              <FeatureMini icon="📍" title="Nearby Vets" text="Find clinics within 10km" />
              <FeatureMini icon="🤝" title="Volunteers" text="Connect with rescuer networks" />
              <FeatureMini icon="🛒" title="Pet Shop" text="Quality food & medicines" />
            </div>
            
          </section>
        </Reveal>
      </div>

      {/* PET SHOP (SPLIT LAYOUT) */}
      <Reveal>
        <section className="px-4 sm:px-6 py-20 md:py-32">
          {/* 🔥 FIX: Reduced mobile padding inside the box (p-6 instead of p-8) */}
          <div className="max-w-6xl mx-auto bg-orange-100/50 rounded-3xl p-6 sm:p-8 md:p-16 flex flex-col md:flex-row items-center gap-10 md:gap-12 border border-orange-100">
            <div className="flex-1 text-center md:text-left">
              <span className="text-orange-600 font-bold tracking-wider uppercase text-xs sm:text-sm mb-3 sm:mb-4 block">Marketplace</span>
              {/* 🔥 FIX: Scaled text down for mobile (text-3xl) */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4 sm:mb-6">Pet Care, Delivered.</h2>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed">
                Support our mission while spoiling your furry friends. Discover nearby pet shops offering high-quality food, medicines, and essential accessories.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-slate-900 text-white px-8 py-3.5 sm:py-4 rounded-full font-semibold hover:bg-slate-800 transition-colors shadow-md"
              >
                🛒 Explore the Shop
              </Link>
            </div>
            <div className="flex-1 w-full relative mt-6 md:mt-0">
              {/* Auto-playing Image Carousel */}
              <AutoCarousel />
              
              {/* Decorative element */}
              <div className="absolute -bottom-4 sm:-bottom-6 -left-2 sm:-left-6 bg-white p-3 sm:p-4 rounded-xl shadow-xl border border-slate-100 z-20">
                <p className="font-bold text-slate-800 text-sm sm:text-base">⭐ 4.9/5</p>
                <p className="text-xs sm:text-sm text-slate-500">From 1k+ Pet Parents</p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Small Heading */}
            <p className="text-orange-500 font-semibold tracking-wide uppercase mb-3 text-xs sm:text-sm">
              About #AnimalSathi
            </p>

            {/* Main Title */}
            {/* 🔥 FIX: Scaled down mobile header text */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight mb-5 sm:mb-6">
              A Better Way to Help <br className="hidden sm:block" />
              <span className="text-orange-500">Animals in Need</span>
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto px-2 sm:px-0">
              AnimalSathi is a real-time animal rescue platform that connects citizens,
              volunteers, and verified NGOs. From reporting emergencies to finding
              nearby veterinary care, we ensure every animal receives timely help,
              proper treatment, and a second chance at life.
            </p>
          </div>
        </section>
      </Reveal>

      {/* HOW IT WORKS */}
      <Reveal>
        <section className="px-4 sm:px-6 py-20 md:py-32 bg-gradient-to-b from-white via-orange-50/40 to-white relative overflow-hidden border-y border-slate-50">
          
          {/* Subtle Background Glows for Depth */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/4 -left-40 w-[20rem] sm:w-[30rem] h-[20rem] sm:h-[30rem] bg-orange-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -right-40 w-[20rem] sm:w-[30rem] h-[20rem] sm:h-[30rem] bg-orange-300/20 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            
            <div className="text-center mb-16 md:mb-20">
              <SectionTitle title="How It Works" center />
              <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mt-2 sm:-mt-10 leading-relaxed font-light px-2 sm:px-0">
                Three simple steps to save a life. Our platform ensures a rapid, coordinated response when every second counts.
              </p>
            </div>

            <div className="relative">
              {/* Desktop Connecting Line */}
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-1 bg-gradient-to-r from-orange-100 via-orange-400 to-orange-100 rounded-full z-0 opacity-50"></div>

              {/* 🔥 FIX: Added 'mt-6 md:mt-0' to fix the overlapping step numbers on mobile */}
              <div className="grid md:grid-cols-3 gap-16 md:gap-8 lg:gap-12 relative z-10 pt-4 md:pt-0 mt-6 md:mt-0">
                <StepCard
                  step={1}
                  image="/my-rescue-dog.jpg"
                  title="Report SOS"
                  text="Spot an injured or distressed animal? Quickly report it with exact GPS location and live photos."
                  icon="📸"
                />
                <StepCard
                  step={2}
                  image="/alert-broadcast.jpg"
                  title="Alert Broadcast"
                  text="Nearby verified volunteers and NGOs receive instant push notifications with your report details."
                  icon="🔔"
                />
                <StepCard
                  step={3}
                  image="/rescue.jpg"
                  title="Rescue & Care"
                  text="Help arrives. The animal is secured, taken to a vet if needed, and updated on the app."
                  icon="❤️"
                />
              </div>
            </div>

          </div>
        </section>
      </Reveal>

      {/* BOTTOM CTA */}
      <Reveal>
        <section className="px-4 sm:px-6 pb-16 sm:pb-24 pt-10 sm:pt-12">
          {/* 🔥 FIX: Reduced extreme paddings for mobile (p-8 sm:p-12 md:p-20) */}
          <div className="relative max-w-5xl mx-auto rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden bg-slate-900 border border-slate-800 p-8 sm:p-12 md:p-20 text-center">
            
            {/* Sophisticated Ambient Glow - Pushed to the background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center">
              <div className="absolute -top-32 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-orange-500/10 rounded-full blur-[80px] sm:blur-[100px]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              
              {/* Social Proof Badge */}
              <div className="inline-flex items-center gap-2 sm:gap-3 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8 shadow-sm">
                <div className="flex -space-x-2">
                  <img className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-slate-800 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Volunteer" />
                  <img className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-slate-800 object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="Volunteer" />
                  <img className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-slate-800 object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="Volunteer" />
                </div>
                <span className="text-slate-300 text-xs sm:text-sm font-medium pr-1 sm:pr-2">Join 10,000+ Lovers</span>
              </div>

              {/* Main Content */}
              {/* 🔥 FIX: Text size scaled for mobile */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight">
                Ready to make an <span className="text-orange-500">impact?</span>
              </h2>

              <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 sm:mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                Compassion becomes powerful when communities work together. Help us build India's strongest animal rescue network today.
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-5 w-full">
                
                {/* Primary Button */}
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-orange-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-3 group"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download App
                </a>

                {/* Secondary Button */}
                <Link
                  href="/volunteer-form"
                  className="w-full sm:w-auto bg-slate-800 border border-slate-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-slate-700 hover:border-slate-600 transition-all duration-300 shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-3 group"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
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

/* ---------- HELPER COMPONENTS ---------- */

function SectionTitle({ title, center = true }: { title: string; center?: boolean }) {
  return (
    <div className={`mb-10 sm:mb-16 ${center ? "text-center flex flex-col items-center" : "text-left"}`}>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
        {title}
      </h2>
      <div className={`w-16 sm:w-24 h-1.5 bg-orange-400 mt-4 sm:mt-6 rounded-full ${center ? "" : "mr-auto"}`}></div>
    </div>
  );
}

function FeatureMini({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center justify-center">
      <div className="text-2xl sm:text-3xl mb-2 sm:mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-bold text-slate-800 mb-1 sm:mb-2 text-sm sm:text-lg">{title}</h3>
      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{text}</p>
    </div>
  );
}

/* ---------- STEP CARD ---------- */

function StepCard({ 
  step, 
  image, 
  title, 
  text, 
  icon 
}: { 
  step: number; 
  image: string; 
  title: string; 
  text: string;
  icon: string;
}) {
  return (
    <div className="relative group mt-10 md:mt-0">
      
      {/* Floating Step Indicator */}
      {/* 🔥 FIX: Shrunk slightly for mobile so it fits the screen better */}
      <div className="absolute -top-6 sm:-top-8 md:-top-10 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white border-[4px] sm:border-[6px] border-orange-50 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl md:text-3xl text-orange-500 shadow-xl z-20 group-hover:scale-110 group-hover:border-orange-100 transition-all duration-300">
        {step}
      </div>
      
      {/* Card Content */}
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden pt-10 sm:pt-12 md:pt-16 pb-6 sm:pb-8 px-5 sm:px-6 md:px-8 text-center h-full flex flex-col">
        
        <div className="overflow-hidden rounded-2xl mb-6 sm:mb-8 relative shadow-sm">
          <img
            src={image}
            alt={title}
            className="w-full h-40 sm:h-48 lg:h-56 object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
          {/* Floating Icon Badge inside the image */}
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-white/90 backdrop-blur-sm w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg border border-white/50 group-hover:-translate-y-1 transition-transform duration-300">
            {icon}
          </div>
        </div>
        
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 sm:mb-4">{title}</h3>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed flex-grow">{text}</p>
        
      </div>
    </div>
  );
}

/* ---------- AUTO CAROUSEL FOR SHOP ---------- */

function AutoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    "https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=800" 
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3500); // Fixed the comment mismatch in your code - intervals are in ms!

    return () => clearInterval(timer);
  }, []);

  return (
    // 🔥 FIX: Adjusted height sizes for mobile displays (h-56 sm:h-72)
    <div className="relative w-full h-56 sm:h-72 md:h-96 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border-2 sm:border-4 border-white bg-slate-100">
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={`Shop item ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out ${
            index === currentIndex 
              ? "opacity-100 scale-100 z-10" 
              : "opacity-0 scale-105 z-0"
          }`}
        />
      ))}
    </div>
  );
}

/* ---------- IMPACT CARD ---------- */

function ImpactCard({ 
  icon, 
  number, 
  label 
}: { 
  icon: string; 
  number: number; 
  label: string; 
}) {
  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-center border border-slate-100 shadow-xl shadow-orange-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
      
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/0 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-orange-50 rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl mb-6 sm:mb-8 shadow-sm border border-orange-100 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
          {icon}
        </div>
        
        <h3 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 mb-2 sm:mb-3 tracking-tighter">
          <Counter value={number} />+
        </h3>
        
        <p className="text-orange-600 font-bold tracking-wider uppercase text-xs sm:text-sm">
          {label}
        </p>
      </div>
      
    </div>
  );
}