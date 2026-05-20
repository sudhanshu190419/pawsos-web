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
  fetchPetById,
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
  const router = useRouter();

  // Fetch host pet data for each playdate
  const [hostPets, setHostPets] = useState<Record<string, Pet>>({});
  const [attendeePetsMap, setAttendeePetsMap] = useState<
    Record<string, Pet[]>
  >({});

  useEffect(() => {
    const fetchPetData = async () => {
      // Collect unique host pet IDs
      const hostPetIds = [
        ...new Set(playdates.map((p) => p.hostPetId).filter(Boolean) as string[]),
      ];

      // Fetch host pets
      if (hostPetIds.length > 0) {
        const pets = await fetchPetsByIds(hostPetIds);
        const map: Record<string, Pet> = {};
        pets.forEach((p) => (map[p.id] = p));
        setHostPets(map);
      }

      // Collect unique attendee pet IDs
      const allAttendeePetIds = [
        ...new Set(
          playdates.flatMap((p) =>
            (p.attendees || []).map((a) => a.petId)
          )
        ),
      ];

      if (allAttendeePetIds.length > 0) {
        const aPets = await fetchPetsByIds(allAttendeePetIds);
        const petMap: Record<string, Pet> = {};
        aPets.forEach((p) => (petMap[p.id] = p));

        const aMap: Record<string, Pet[]> = {};
        playdates.forEach((pd) => {
          aMap[pd.id] = (pd.attendees || [])
            .map((a) => petMap[a.petId])
            .filter(Boolean);
        });
        setAttendeePetsMap(aMap);
      }
    };

    if (playdates.length > 0) {
      fetchPetData();
    }
  }, [playdates]);

  // Redirect to pet registration if user is logged in but has no pets
  const needsRegistration =
    !authLoading && !petsLoading && currentUser && !hasPets;

  const isLoading = authLoading || petsLoading || playdatesLoading;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50/50 to-white pt-8 pb-12 md:pt-14 md:pb-20 px-4 border-b border-slate-100">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-200/30 rounded-full blur-[80px] -mr-40 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/30 rounded-full blur-[60px] -ml-32 -mb-20" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-100 px-4 py-1.5 rounded-full mb-4 shadow-sm">
              <span className="animate-paw-bounce inline-block text-lg">
                🐾
              </span>
              <span className="text-orange-600 font-bold text-xs uppercase tracking-wider">
                Play Dates
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">
              Find a <span className="text-orange-500">Play Date</span> for your pet
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Connect with nearby pets for fun meetups. All interactions are pet-focused — choose your pet&apos;s next best friend based on their personality, not the owner.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col items-center gap-6 mb-10">
            {/* Pet Type Filters */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all duration-300 flex items-center gap-2 ${
                    filter === f.value
                      ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                      : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 shadow-sm hover:shadow-md"
                  }`}
                >
                  <span className="text-base">{f.emoji}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>

            {/* Radius Filter */}
            {location && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <span className="text-sm font-semibold text-slate-700">
                  📍 Within <span className="text-orange-600 font-black">{radiusKm}km</span>
                </span>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-40 h-2 accent-orange-500 rounded-lg appearance-none bg-slate-200"
                />
              </div>
            )}
          </div>

          {/* Create CTA */}
          <div className="flex justify-center">
            {currentUser ? (
              hasPets ? (
                <Link
                  href="/playdate/create"
                  className="inline-flex items-center gap-2.5 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-slate-800 active:scale-95 transition-all duration-300 shadow-lg shadow-slate-900/30 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span className="text-xl">+</span>
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
        <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20">
          <div className="bg-white rounded-2xl border-2 border-orange-200 p-5 flex flex-col sm:flex-row items-center gap-4 shadow-lg">
            <div className="text-4xl animate-paw-bounce">🐾</div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-slate-800 mb-1">
                Register your pet to join Play Dates!
              </h3>
              <p className="text-sm text-slate-500">
                You need at least one registered pet to create or join
                play dates.
              </p>
            </div>
            <Link
              href="/pets/register"
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 whitespace-nowrap"
            >
              Register Now
            </Link>
          </div>
        </div>
      )}

      {/* Playdates Grid */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : playdates.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-paw-bounce inline-block">
              🐾
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 mb-2">
              No play dates yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Be the first to create a play date in your area! Your pet
              is waiting for their next adventure.
            </p>
            {currentUser && hasPets && (
              <Link
                href="/playdate/create"
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
              >
                + Create the First Play Date
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {playdates.map((pd) => (
              <PlayDateCard
                key={pd.id}
                playdate={pd}
                hostPet={pd.hostPetId ? (hostPets[pd.hostPetId] || null) : null}
                attendeePets={attendeePetsMap[pd.id] || []}
              />
            ))}
          </div>
        )}
      </section>

      {/* Floating Create Button (mobile) */}
      {currentUser && hasPets && (
        <Link
          href="/playdate/create"
          className="fixed bottom-20 right-4 md:hidden z-40 w-14 h-14 bg-orange-500 text-white rounded-full shadow-2xl shadow-orange-300 flex items-center justify-center text-2xl hover:bg-orange-600 active:scale-95 transition-all"
          aria-label="Create Play Date"
        >
          +
        </Link>
      )}
    </div>
  );
}
