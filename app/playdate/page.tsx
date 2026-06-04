"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";
import { useLocation } from "../lib/LocationContext";
import {
  usePlaydates,
  useUserPets,
  PetType,
  Pet,
  fetchPetsByIds,
} from "./hooks/usePlaydates";
import PlayDateCard from "./components/PlayDateCard";

const FILTERS: { value: PetType | "all"; label: string; emoji: string }[] = [
  { value: "dog", label: "Dogs", emoji: "🐕" },
  { value: "cat", label: "Cats", emoji: "🐱" },
  { value: "bird", label: "Birds", emoji: "🐦" },
  { value: "all", label: "All Pets", emoji: "🐾" },
];

export default function PlayDatePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { location } = useLocation();
  const { pets, loading: petsLoading, hasPets } = useUserPets(currentUser);
  
  const [filter, setFilter] = useState<PetType | "all">("all");
  const [radiusKm, setRadiusKm] = useState(25);
  
  const { playdates, loading: playdatesLoading } = usePlaydates({
    petType: filter,
    radiusKm,
    userLocation: location || undefined,
  });

  // Derived state maps
  const [hostPets, setHostPets] = useState<Record<string, Pet>>({});
  const [attendeePetsMap, setAttendeePetsMap] = useState<Record<string, Pet[]>>({});

  useEffect(() => {
    let isMounted = true;

    const fetchPetData = async () => {
      if (!playdates.length) return;

      // 1. Gather ALL unique pet IDs (Hosts + Attendees) to batch network requests
      const uniquePetIds = new Set<string>();
      
      playdates.forEach((pd) => {
        if (pd.hostPetId) uniquePetIds.add(pd.hostPetId);
        if (pd.attendees) {
          pd.attendees.forEach((a) => {
            if (a.petId) uniquePetIds.add(a.petId);
          });
        }
      });

      const idsToFetch = Array.from(uniquePetIds);
      if (idsToFetch.length === 0) return;

      try {
        // 2. Fetch all required pets in a single API call
        const fetchedPets = await fetchPetsByIds(idsToFetch);
        if (!isMounted) return;

        // 3. Create a master dictionary for O(1) lookups
        const masterPetMap: Record<string, Pet> = {};
        fetchedPets.forEach((p) => {
          masterPetMap[p.id] = p;
        });

        // 4. Distribute into Host and Attendee maps locally before setting state
        const newHostPets: Record<string, Pet> = {};
        const newAttendeeMap: Record<string, Pet[]> = {};

        playdates.forEach((pd) => {
          if (pd.hostPetId && masterPetMap[pd.hostPetId]) {
            newHostPets[pd.hostPetId] = masterPetMap[pd.hostPetId];
          }
          newAttendeeMap[pd.id] = (pd.attendees || [])
            .map((a) => masterPetMap[a.petId])
            .filter(Boolean);
        });

        // 5. Batch state updates
        setHostPets(newHostPets);
        setAttendeePetsMap(newAttendeeMap);
      } catch (error) {
        console.error("Failed to fetch pet details for playdates:", error);
      }
    };

    fetchPetData();

    return () => {
      isMounted = false; // Cleanup to prevent state updates on unmounted component
    };
  }, [playdates]);

  const needsRegistration = !authLoading && !petsLoading && currentUser && !hasPets;
  const isLoading = authLoading || petsLoading || playdatesLoading;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative min-h-[420px] md:h-[600px] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffdcc5] to-[#faf9f8] z-0"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#944a00] to-transparent opacity-30"></div>
        </div>

        <div className="relative z-10 px-4 md:px-10 max-w-[1280px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="space-y-6 fade-in-up">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Find the perfect match for your pet&apos;s{" "}
              <span className="bg-gradient-to-r from-[#944a00] to-[#e67e22] bg-clip-text text-transparent">
                next adventure
              </span>
            </h1>
            <p className="text-sm md:text-lg text-slate-600 max-w-lg leading-relaxed">
              Connect with reliable pet owners in your neighborhood. Discover tailored playdates that match your pet&apos;s energy, personality, and breed.
            </p>
            <div className="flex gap-3 md:gap-4 flex-wrap">
              {currentUser ? (
                hasPets ? (
                  <Link
                    href="/playdate/create"
                    className="bg-[#944a00] text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-xs md:text-sm hover:scale-105 shimmer-btn active:scale-95 transition-all duration-300 shadow-lg inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Browse Nearby
                  </Link>
                ) : (
                  <Link
                    href="/pets/register"
                    className="bg-[#944a00] text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-xs md:text-sm hover:scale-105 shimmer-btn active:scale-95 transition-all duration-300 shadow-lg"
                  >
                    Register Your Pet
                  </Link>
                )
              ) : (
                <Link
                  href="/auth"
                  className="bg-[#944a00] text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-xs md:text-sm hover:scale-105 shimmer-btn active:scale-95 transition-all duration-300 shadow-lg"
                >
                  Sign In to Get Started
                </Link>
              )}
              <Link
                href="/how-it-works"
                className="border border-slate-300 text-[#944a00] px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-xs md:text-sm hover:bg-[#944a00]/5 active:bg-[#944a00]/10 transition-all duration-300"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right: Image (Desktop only) */}
          <div className="hidden md:block fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <div className="absolute -inset-4 bg-[#944a00]/10 rounded-full blur-3xl animate-pulse"></div>
              <Image
                className="rounded-3xl shadow-2xl w-full h-full object-cover transform rotate-3 hover:rotate-0 transition-all duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQUf6lgUnaVbIyiqWhlskfVMUcTcaEDAWofbPrzdWSSOp2KdEddMnpqlhAymMUPJE2XAN-cnGTepz6F_ZjCCA1YrAhmucfrXMT8ZyyEMXRXtfst8_py9kN5_GAcDgcuz-hC59hOPLymT0f6sFXie7PwZpUdtKCdqsLUSaGv33FKfRPYCf0MwTZhzCIdr_9FdyIQuHdfJ3RXpMDNUiR_qUSzHldf5atv46th6KwSx2V5NJ0whqkWnBcvnxkO8e9rKJokyx553jlyL4S"
                alt="Two happy dogs playing together"
                width={500}
                height={500}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Search & Filter Bar ──────────────────────────────────── */}
      <section className="relative -mt-16 md:-mt-20 z-20 px-4 md:px-10 max-w-[1280px] mx-auto">
        <div className="glass-panel p-5 md:p-8 rounded-3xl shadow-xl flex flex-col lg:flex-row items-center gap-6 md:gap-8 fade-in-up" style={{ animationDelay: "0.4s" }}>
          
          {/* Pet Type Selection */}
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pet Type</span>
            <div className="flex p-1 bg-surface-container rounded-xl overflow-x-auto no-scrollbar">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 md:px-5 py-2 rounded-lg text-[11px] md:text-sm font-semibold border border-transparent transition-all duration-300 whitespace-nowrap active:scale-95 ${
                    filter === f.value
                      ? "bg-white text-[#944a00] shadow-sm border-slate-200"
                      : "text-slate-500 hover:text-[#944a00] hover:bg-white/50"
                  }`}
                >
                  {f.emoji} {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Slider */}
          {location && (
            <div className="flex flex-col gap-3 w-full lg:w-[260px]">
              <div className="flex justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Search Radius</span>
                <span className="text-sm font-bold text-[#944a00]">{radiusKm}km</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-[#944a00]"
              />
            </div>
          )}

          {/* Availability Toggle */}
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Availability</span>
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#944a00]"></div>
                <span className="ms-3 text-sm font-semibold text-slate-700 whitespace-nowrap">This Weekend</span>
              </label>
            </div>
          </div>

          {currentUser && hasPets ? (
            <Link
              href="/playdate/create"
              className="w-full lg:w-auto bg-[#944a00] text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm shimmer-btn hover:bg-[#713700] active:bg-[#502600] transition-all duration-300 shadow-lg whitespace-nowrap inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Create a Play Date
            </Link>
          ) : (
            <Link
              href={currentUser ? "/pets/register" : "/auth"}
              className="w-full lg:w-auto bg-[#944a00] text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm shimmer-btn hover:bg-[#713700] active:bg-[#502600] transition-all duration-300 shadow-lg whitespace-nowrap inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              {currentUser ? "Register Your Pet" : "Sign In to Create"}
            </Link>
          )}
        </div>
      </section>

      {/* ─── Main Grid ────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 px-4 md:px-10 max-w-[1280px] mx-auto">
        <div className="flex justify-between items-end mb-8 md:mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Available Playdates Nearby</h2>
            <p className="text-sm md:text-base text-slate-500 mt-1">Recommended based on your pet&apos;s profile</p>
          </div>
          <Link
            href="/playdate"
            className="hidden md:flex items-center gap-2 text-[#944a00] font-bold text-sm group"
          >
            View all
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-[#944a00] rounded-full animate-spin" />
          </div>
        ) : playdates.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 md:py-20 px-4">
            <div className="text-6xl md:text-7xl mb-4 inline-block floating-element">🐾</div>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-2">
              No play dates yet
            </h3>
            <p className="text-sm md:text-base text-slate-500 mb-6 max-w-md mx-auto">
              Be the first to create a play date in your area! Your pet is waiting for their next adventure.
            </p>
            {currentUser && hasPets && (
              <Link
                href="/playdate/create"
                className="bg-[#944a00] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:scale-105 shimmer-btn transition-all duration-300 shadow-lg inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Create the First Play Date
              </Link>
            )}
          </div>
        ) : (
          /* Playdates Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8 pb-24 md:pb-0">
            {playdates.map((pd) => (
              <PlayDateCard
                key={pd.id}
                playdate={pd}
                hostPet={pd.hostPetId ? hostPets[pd.hostPetId] || null : null}
                attendeePets={attendeePetsMap[pd.id] || []}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Registration Banner ──────────────────────────────────── */}
      {needsRegistration && (
        <section className="py-8 md:py-12 px-4 md:px-10 max-w-[1280px] mx-auto">
          <div className="bg-[#ffdcc5] rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 p-8 opacity-10 floating-element pointer-events-none">
              <svg className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C12 2 6 6 6 10C6 12.2 8.8 15 12 18C15.2 15 18 12.2 18 10C18 6 12 2 12 2Z"/>
              </svg>
            </div>
            
            <div className="relative z-10 space-y-4 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/40 rounded-full text-[#502600] font-bold text-[11px] uppercase tracking-widest pulse-badge">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                New Member Special
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#301400] leading-tight">
                Register your pet to unlock community features
              </h2>
              <p className="text-base md:text-lg text-[#663e00]">
                Create a profile to start hosting playdates, saving favorites, and connecting with local pet parents.
              </p>
            </div>
            
            <Link
              href="/pets/register"
              className="relative z-10 bg-[#944a00] text-white px-10 py-5 rounded-2xl font-bold text-sm hover:scale-105 shimmer-btn transition-all duration-300 shadow-xl whitespace-nowrap shrink-0"
            >
              Start Your Journey
            </Link>
          </div>
        </section>
      )}

      {/* ─── Floating Create Button (Mobile Only) ─────────────────── */}
      {currentUser && hasPets && (
        <Link
          href="/playdate/create"
          className="fixed bottom-6 right-6 md:hidden z-40 w-14 h-14 bg-[#944a00] text-white rounded-full shadow-xl shadow-[#944a00]/40 flex items-center justify-center text-3xl pb-1 hover:bg-[#713700] active:scale-90 transition-all border-2 border-white"
          aria-label="Create Play Date"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </Link>
      )}
    </div>
  );
}