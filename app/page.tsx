"use client";

import Link from "next/link";
import ParallaxHero from "./components/ParallaxHero";
import Reveal from "./components/Reveal";
import Counter from "./components/Counter";
import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  AlertCircle, 
  HeartPulse, 
  Users, 
  ShoppingBag,
  Camera,
  Bell,
  Heart
} from "lucide-react";

// ─── Design Tokens ──────────────────────────────────────────────────────────
const ACCENT = {
  red:   { dot: "#f87171", shadow: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.25)", bg: "bg-red-50", text: "text-red-600", borderClass: "border-red-100" },
  blue:  { dot: "#60a5fa", shadow: "rgba(96,165,250,0.15)",  border: "rgba(96,165,250,0.25)",  bg: "bg-blue-50", text: "text-blue-600", borderClass: "border-blue-100" },
  green: { dot: "#4ade80", shadow: "rgba(74,222,128,0.15)",  border: "rgba(74,222,128,0.25)",  bg: "bg-green-50", text: "text-green-600", borderClass: "border-green-100" },
  amber: { dot: "#fb923c", shadow: "rgba(251,146,60,0.15)",  border: "rgba(251,146,60,0.25)",  bg: "bg-orange-50", text: "text-orange-600", borderClass: "border-orange-100" },
} as const;

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  useEffect(() => {
    // Request user location on page load
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      const storedLocation = localStorage.getItem("userLocation");
      if (!storedLocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Try to get address from coordinates using reverse geocoding
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();
              
              const location = {
                latitude,
                longitude,
                address: data.address?.city || data.address?.county || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
              };
              
              localStorage.setItem("userLocation", JSON.stringify(location));
            } catch (error) {
              // If reverse geocoding fails, just store coordinates
              const location = { latitude, longitude, address: undefined };
              localStorage.setItem("userLocation", JSON.stringify(location));
            }
          },
          (error) => {
            console.warn("Location permission denied or unavailable:", error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-orange-100 overflow-hidden">

      {/* ── Hero ─────────────────────────────────────────────── */}
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
              <div className="absolute bottom-8 sm:bottom-6 md:bottom-8 left-0 right-0 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-6 z-10">
                <Link
                  href="/download"
                  className="inline-flex items-center justify-center gap-2.5 bg-primary text-on-primary px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-base hover:bg-primary-container active:scale-[0.97] transition-all duration-300 shadow-[0_20px_50px_rgba(156,62,35,0.3)] hover:shadow-[0_25px_60px_rgba(156,62,35,0.4)] hover:-translate-y-1 w-full sm:w-auto md:backdrop-blur-md"
                >
                  <AlertCircle className="w-4 h-4" />
                  Report a SOS
                </Link>
                <Link
                  href="/volunteer-form"
                  className="inline-flex items-center justify-center gap-2.5 bg-white/95 text-slate-800 border border-white/50 px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-base hover:bg-white active:scale-[0.97] transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)] hover:-translate-y-1 w-full sm:w-auto md:backdrop-blur-md"
                >
                  <Users className="w-4 h-4" />
                  Become a Volunteer
                </Link>
              </div>
            </div>
          </section>
        </ParallaxHero>
      </div>

      {/* ── Category Cards ───────────────────────────────────── */}
      <div className="relative z-20">
        <Reveal>
          <section className="relative mt-8 sm:mt-12 md:mt-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              <CategoryCard
                title="SOS Alerts"
                subtitle="Report instantly"
                stat="Real-time"
                icon={<AlertCircle className="w-5 h-5" />}
                link="/report"
                tag="Live"
                accent="red"
                image="/sos-dog.png"
              />
              <CategoryCard
                title="Nearby Vets"
                subtitle="Find clinics"
                stat="Within 10km"
                icon={<HeartPulse className="w-5 h-5" />}
                link="/vets"
                tag="Fast"
                accent="blue"
                image="/vet-hospital.png"
              />
              <CategoryCard
                title="Volunteers"
                subtitle="Join network"
                stat="10k+ members"
                icon={<Users className="w-5 h-5" />}
                link="/volunteer-form"
                tag="Join"
                accent="green"
                image="/volunteer.png"
              />
              <CategoryCard
                title="Pet Shop"
                subtitle="Meds & Food"
                stat="Delivered"
                icon={<ShoppingBag className="w-5 h-5" />}
                link="/shop"
                tag="Deals"
                accent="amber"
                image="/pet-shop.png"
              />
            </div>
          </section>
        </Reveal>
      </div>

      {/* ── Pet Shop ─────────────────────────────────────────── */}
      <Reveal>
        <section className="px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-6xl mx-auto bg-gradient-to-br from-orange-50 to-amber-50/60 rounded-3xl p-6 sm:p-10 md:p-16
                          flex flex-col md:flex-row items-center gap-10 md:gap-14
                          border border-orange-100/80 shadow-xl shadow-orange-100/40">

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block text-orange-600 font-bold tracking-widest uppercase text-xs mb-4
                               bg-orange-100 px-3 py-1 rounded-full">
                Marketplace
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 leading-tight tracking-tight">
                Pet Care,{" "}
                <span className="relative inline-block">
                  Delivered.
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-orange-400 rounded-full" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-md mx-auto md:mx-0">
                Support our mission while spoiling your furry friends. Discover
                nearby pet shops offering high-quality food, medicines, and
                essential accessories.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2.5
                           bg-primary text-on-primary px-8 py-3.5 rounded-xl font-semibold text-sm sm:text-base
                           hover:bg-primary-container active:scale-[0.97]
                           transition-all duration-200 shadow-lg shadow-primary/20
                           hover:shadow-xl hover:-translate-y-0.5"
              >
                <ShoppingBag className="w-5 h-5" /> Explore the Shop
              </Link>
            </div>

            {/* Carousel */}
            <div className="flex-1 w-full relative mt-2 md:mt-0">
              <AutoCarousel />
              <div className="absolute -bottom-5 -left-3 sm:-bottom-6 sm:-left-6
                              bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 z-20
                              flex items-center gap-3">
                <div className="flex gap-0.5">
                  <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-tight">4.9 / 5</p>
                  <p className="text-[11px] text-slate-400 leading-tight">1,000+ Pet Parents</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── About ────────────────────────────────────────────── */}
      <Reveal>
        <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-orange-500 font-bold tracking-widest uppercase text-xs sm:text-sm mb-4">
              About #AnimalSathi
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight mb-6 tracking-tight">
              A Better Way to Help{" "}
              <br className="hidden sm:block" />
              <span className="text-orange-500">Animals in Need</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-500 leading-relaxed max-w-3xl mx-auto">
              AnimalSathi is a real-time animal rescue platform that connects citizens,
              volunteers, and verified NGOs. From reporting emergencies to finding
              nearby veterinary care, we ensure every animal receives timely help,
              proper treatment, and a second chance at life.
            </p>
          </div>
        </section>
      </Reveal>

      {/* ── How It Works ─────────────────────────────────────── */}
      <Reveal>
        <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20 relative overflow-hidden border-y border-slate-100
                            bg-gradient-to-b from-white via-orange-50/50 to-white">

          {/* Ambient glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-48 w-96 h-96 bg-orange-200/25 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16 md:mb-20">
              <SectionBadge label="Simple Process" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
                How It Works
              </h2>
              <div className="w-16 h-1.5 bg-orange-400 rounded-full mx-auto mb-5" />
              <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Three simple steps to save a life. Our platform ensures a rapid,
                coordinated response when every second counts.
              </p>
            </div>

            <div className="relative">
              {/* Desktop connector line */}
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px
                              bg-gradient-to-r from-transparent via-orange-300 to-transparent z-0" />

              <div className="grid md:grid-cols-3 gap-14 md:gap-8 lg:gap-12 relative z-10 pt-4 md:pt-0">
                <StepCard step={1} image="/my-rescue-dog.jpg"    title="Report SOS"        icon={<Camera className="w-6 h-6" />}
                  text="Spot an injured animal? Report it instantly with GPS location and live photos." />
                <StepCard step={2} image="/alert-broadcast.jpg"  title="Alert Broadcast"   icon={<Bell className="w-6 h-6" />}
                  text="Nearby verified volunteers and NGOs receive instant push notifications with your report." />
                <StepCard step={3} image="/rescue.jpg"           title="Rescue & Care"     icon={<Heart className="w-6 h-6" />}
                  text="Help arrives. The animal is secured, taken to a vet if needed, and tracked on the app." />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <Reveal>
        <section className="px-4 sm:px-6 pb-16 sm:pb-24 pt-10 sm:pt-12">
          <div className="relative max-w-5xl mx-auto rounded-[2rem] sm:rounded-[3rem]
                          overflow-hidden bg-slate-900 border border-slate-800
                          shadow-2xl shadow-slate-900/30 p-8 sm:p-12 md:p-20 text-center">

            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <div className="w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center">

              {/* Social proof */}
              <div className="inline-flex items-center gap-3
                              bg-slate-800/60 backdrop-blur-md border border-slate-700/60
                              rounded-2xl px-4 py-2 mb-8 shadow-sm">
                <div className="flex -space-x-2.5">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
                    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Volunteer"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-slate-800 object-cover"
                    />
                  ))}
                </div>
                <span className="text-slate-300 text-xs sm:text-sm font-medium">
                  Join 10,000+ Animal Lovers
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white
                             mb-5 tracking-tight leading-tight">
                Ready to make an {" "}
                <span className="text-orange-500">impact?</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                Compassion becomes powerful when communities work together. Help
                us build India's strongest animal rescue network today.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5
                             bg-orange-500 text-white px-8 py-3.5 rounded-xl font-bold text-base
                             hover:bg-orange-400 active:scale-[0.97]
                             transition-all duration-200 shadow-lg shadow-orange-500/25
                             hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download the App
                </a>

                <Link
                  href="/volunteer-form"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5
                             bg-slate-800 border border-slate-700 text-white
                             px-8 py-3.5 rounded-xl font-semibold text-base
                             hover:bg-slate-700 hover:border-slate-600 active:scale-[0.97]
                             transition-all duration-200 shadow-lg hover:-translate-y-0.5 group"
                >
                  <Users className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-colors duration-200" />
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

// ─── SectionBadge ────────────────────────────────────────────────────────────
function SectionBadge({ label }: { label: string }) {
  return (
    <span className="inline-block text-orange-600 font-bold tracking-widest uppercase text-xs
                     bg-orange-100 px-3 py-1 rounded-full mb-4">
      {label}
    </span>
  );
}

// ─── CategoryCard ────────────────────────────────────────────────────────────
function CategoryCard({
  title, subtitle, stat, icon, link, tag, accent, image,
}: {
  title: string; subtitle: string; stat: string; icon: React.ReactNode;
  link: string; tag: string; accent: keyof typeof ACCENT; image: string;
}) {
  const a = ACCENT[accent];

  return (
    <Link href={link} className="group block h-full cursor-pointer">
      <div
        className="relative h-full rounded-2xl sm:rounded-[1.75rem] overflow-hidden bg-white/90
                   transition-all duration-300 ease-out
                   hover:-translate-y-2 hover:shadow-2xl active:scale-[0.97]
                   border backdrop-blur-sm border border-orange-100"
        style={{ boxShadow: `0 2px 20px ${a.shadow}` }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl sm:rounded-[1.75rem]"
          style={{ background: `radial-gradient(circle at bottom right, ${a.shadow} 0%, transparent 70%)` }}
        />
        <div
          className="absolute inset-0 rounded-2xl sm:rounded-[1.75rem] pointer-events-none
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: `inset -2px -2px 0 0 ${a.border}` }}
        />

        <div className="absolute bottom-0 right-0 w-[55%] h-[75%] z-0 pointer-events-none overflow-hidden flex items-end justify-end">
          <img
            src={image}
            alt=""
            className="w-full h-full object-contain object-right-bottom
                       transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1 will-change-transform"
            style={{
              maskImage: "linear-gradient(to top left, black 70%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to top left, black 70%, transparent 100%)",
            }}
          />
        </div>

        <div className="relative z-10 p-4 sm:p-5 md:p-6 flex flex-col h-full min-h-[180px] sm:min-h-[200px] md:min-h-[220px]">
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ backgroundColor: a.dot }}
                />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: a.dot }} />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400 font-bold">
                Active
              </span>
            </span>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full
                             bg-slate-50 text-slate-500 border border-slate-100 tracking-wide">
              {tag}
            </span>
          </div>

          {/* Icon container */}
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center
                          mb-3 shadow-sm transition-all duration-300
                          group-hover:shadow-md group-hover:-translate-y-0.5
                          ${a.bg} ${a.text} ${a.borderClass} border`}>
            {icon}
          </div>

          {/* Text */}
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 leading-tight mb-0.5 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-[65%] leading-relaxed">
            {subtitle}
          </p>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-slate-50/80 flex items-center justify-between">
            <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {stat}
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         bg-slate-900 text-white shadow-md
                         opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0
                         transition-all duration-300"
            >
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── StepCard ────────────────────────────────────────────────────────────────
function StepCard({
  step, image, title, text, icon,
}: {
  step: number; image: string; title: string; text: string; icon: React.ReactNode;
}) {
  return (
    <div className="relative group mt-10 md:mt-0">

      {/* Floating step number */}
      <div className="absolute -top-7 sm:-top-8 md:-top-10 left-1/2 -translate-x-1/2 z-20
                      w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18
                      bg-white border-[5px] border-orange-50
                      rounded-2xl flex items-center justify-center
                      font-extrabold text-xl sm:text-2xl text-orange-500
                      shadow-xl group-hover:border-orange-100
                      group-hover:scale-110 group-hover:-rotate-3
                      transition-all duration-300">
        {step}
      </div>

      {/* Card */}
      <div className="bg-white rounded-[1.75rem] border border-slate-100
                      shadow-md hover:shadow-2xl hover:shadow-slate-200/60
                      hover:-translate-y-2 active:scale-[0.98]
                      transition-all duration-400 ease-out
                      overflow-hidden pt-12 sm:pt-14 pb-7 px-5 sm:px-7 text-center
                      flex flex-col h-full will-change-transform">

        {/* Image */}
        <div className="overflow-hidden rounded-2xl mb-6 relative shadow-sm bg-slate-50">
          <img
            src={image}
            alt={title}
            className="w-full h-40 sm:h-48 lg:h-52 object-cover
                       group-hover:scale-110 transition-transform duration-700 ease-out will-change-transform"
          />
          {/* Icon badge */}
          <div className="absolute bottom-2.5 right-2.5
                          bg-white/95 backdrop-blur-sm w-10 h-10 sm:w-11 sm:h-11 rounded-xl
                          flex items-center justify-center text-xl shadow-md border border-white/60
                          group-hover:-translate-y-1 group-hover:shadow-lg transition-all duration-300">
            {icon}
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 tracking-tight">{title}</h3>
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed flex-grow">{text}</p>
      </div>
    </div>
  );
}

// ─── AutoCarousel ────────────────────────────────────────────────────────────
const CAROUSEL_IMAGES = [
  "https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=800",
];

function AutoCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((p) => (p + 1) % CAROUSEL_IMAGES.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-56 sm:h-72 md:h-96 rounded-2xl sm:rounded-3xl overflow-hidden
                    shadow-xl border-4 border-white bg-slate-100">
      {CAROUSEL_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Pet product ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
            i === current ? "opacity-100 scale-100 z-10" : "opacity-0 scale-[1.04] z-0"
          }`}
        />
      ))}
      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {CAROUSEL_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── ImpactCard (unchanged, kept for external usage) ─────────────────────────
export function ImpactCard({
  icon, number, label,
}: {
  icon: string; number: number; label: string;
}) {
  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-center
                    border border-slate-100 shadow-xl shadow-orange-100/40
                    hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98]
                    transition-all duration-400 group relative overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/0 to-orange-50/60
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto
                        bg-orange-50 rounded-2xl sm:rounded-3xl
                        flex items-center justify-center text-3xl sm:text-4xl mb-6 sm:mb-8
                        shadow-sm border border-orange-100
                        group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 mb-2 tracking-tighter">
          <Counter value={number} />+
        </h3>
        <p className="text-orange-600 font-bold tracking-widest uppercase text-xs sm:text-sm">
          {label}
        </p>
      </div>
    </div>
  );
}