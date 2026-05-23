"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  { value: "all", label: "All Pets", emoji: "🐾" },
  { value: "dog", label: "Dogs", emoji: "🐕" },
  { value: "cat", label: "Cats", emoji: "🐱" },
  { value: "bird", label: "Birds", emoji: "🐦" },
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
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50/50 to-white pt-8 pb-10 md:pt-14 md:pb-16 px-4 border-b border-slate-100">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-orange-200/30 rounded-full blur-[80px] -mr-32 -mt-20 md:-mr-40" />
          <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-amber-200/30 rounded-full blur-[60px] -ml-24 -mb-20 md:-ml-32" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-100 px-4 py-1.5 rounded-full mb-4 shadow-sm">
              <span className="animate-paw-bounce inline-block text-lg">🐾</span>
              <span className="text-orange-600 font-bold text-xs uppercase tracking-wider">
                Play Dates
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">
              Find a <span className="text-orange-500">Play Date</span> for your pet
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium px-2">
              Connect with nearby pets for fun meetups. All interactions are pet-focused — choose your pet&apos;s next best friend based on their personality, not the owner.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col items-center gap-5 md:gap-6 mb-8 md:mb-10">
            {/* Pet Type Filters */}
            <div className="flex items-center justify-center gap-2 flex-wrap px-2 w-full">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm border-2 transition-all duration-300 flex items-center gap-2 active:scale-95 ${
                    filter === f.value
                      ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                      : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 shadow-sm hover:shadow-md"
                  }`}
                >
                  <span className="text-base">{f.emoji}</span>
                  <span className="hidden sm:inline">{f.label}</span>
                  <span className="sm:hidden">{f.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Radius Filter */}
            {location && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm px-4">
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  📍 Within <span className="text-orange-600 font-black">{radiusKm}km</span>
                </span>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full sm:w-48 h-2 accent-orange-500 rounded-lg appearance-none bg-slate-200 outline-none focus:ring-2 focus:ring-orange-500/50"
                  aria-label="Filter by distance"
                />
              </div>
            )}
          </div>

          {/* Primary Action Button (Desktop) */}
          <div className="hidden md:flex justify-center">
            {currentUser ? (
              hasPets ? (
                <Link
                  href="/playdate/create"
                  className="inline-flex items-center gap-2.5 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-slate-800 active:scale-95 transition-all duration-300 shadow-lg shadow-slate-900/30 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span className="text-xl leading-none">+</span>
                  <span>Create a Play Date</span>
                </Link>
              ) : (
                <Link
                  href="/pets/register"
                  className="inline-flex items-center gap-2.5 bg-orange-500 text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 active:scale-95 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span>🐾</span>
                  <span>Register Your Pet First</span>
                </Link>
              )
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center gap-2.5 bg-orange-500 text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 active:scale-95 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>🔓</span>
                <span>Sign In to Get Started</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Registration Banner */}
      {needsRegistration && (
        <div className="max-w-6xl mx-auto px-4 -mt-6 md:-mt-8 relative z-20">
          <div className="bg-white rounded-2xl border-2 border-orange-200 p-4 md:p-5 flex flex-col sm:flex-row items-center gap-4 shadow-lg text-center sm:text-left">
            <div className="text-3xl md:text-4xl animate-paw-bounce">🐾</div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 mb-1 text-base md:text-lg">
                Register your pet to join Play Dates!
              </h3>
              <p className="text-xs md:text-sm text-slate-500">
                You need at least one registered pet to create or join play dates.
              </p>
            </div>
            <Link
              href="/pets/register"
              className="w-full sm:w-auto bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 whitespace-nowrap active:scale-95 text-center"
            >
              Register Now
            </Link>
          </div>
        </div>
      )}

      {/* Playdates Grid */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-14">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : playdates.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 md:py-20 px-4">
            <div className="text-5xl md:text-6xl mb-4 animate-paw-bounce inline-block">🐾</div>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-2">
              No play dates yet
            </h3>
            <p className="text-sm md:text-base text-slate-500 mb-6 max-w-md mx-auto">
              Be the first to create a play date in your area! Your pet is waiting for their next adventure.
            </p>
            {currentUser && hasPets && (
              <Link
                href="/playdate/create"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 md:px-8 md:py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-95 w-full sm:w-auto"
              >
                + Create the First Play Date
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 pb-24 md:pb-0">
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

      {/* Floating Create Button (Mobile Only) */}
      {currentUser && hasPets && (
        <Link
          href="/playdate/create"
          className="fixed bottom-6 right-6 md:hidden z-40 w-14 h-14 bg-orange-500 text-white rounded-full shadow-xl shadow-orange-500/40 flex items-center justify-center text-3xl pb-1 hover:bg-orange-600 active:scale-90 transition-all border-2 border-white"
          aria-label="Create Play Date"
        >
          +
        </Link>
      )}
    </div>
  );
}