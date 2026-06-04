"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import {
  usePlaydate,
  useUserPets,
  fetchPetById,
  fetchPetsByIds,
  joinPlaydate,
  leavePlaydate,
  Pet,
} from "../hooks/usePlaydates";
import { PET_TYPE_CONFIG, formatPlaydateDate } from "../components/PlayDateCard";

export default function PlayDateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentUser, loading: authLoading } = useAuth();
  const { pets: userPets, hasPets } = useUserPets(currentUser);
  const { playdate, loading } = usePlaydate(id);

  const [hostPet, setHostPet] = useState<Pet | null>(null);
  const [attendeePets, setAttendeePets] = useState<Pet[]>([]);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch host pet
  useEffect(() => {
    if (playdate?.hostPetId) {
      fetchPetById(playdate.hostPetId).then(setHostPet);
    }
  }, [playdate?.hostPetId]);

  // Fetch attendee pets
  useEffect(() => {
    if (playdate?.attendees?.length) {
      const petIds = playdate.attendees.map((a) => a.petId);
      fetchPetsByIds(petIds).then(setAttendeePets);
    } else {
      setAttendeePets([]);
    }
  }, [playdate?.attendees]);

  // Check if current user already joined
  const myAttendee = playdate?.attendees?.find(
    (a) => a.uid === currentUser?.uid
  );
  const hasJoined = !!myAttendee;
  const isFull =
    playdate && playdate.attendeeCount >= playdate.maxPets;
  const isHost = playdate?.createdBy === currentUser?.uid;

  const handleJoin = async () => {
    if (!currentUser || !selectedPetId || !playdate) return;
    setJoining(true);
    try {
      await joinPlaydate(playdate.id, currentUser.uid, selectedPetId);
      setShowJoinModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUser || !myAttendee || !playdate) return;
    setLeaving(true);
    try {
      await leavePlaydate(playdate.id, currentUser.uid, myAttendee.petId);
    } catch (err) {
      console.error(err);
    } finally {
      setLeaving(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/playdate/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!playdate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😿</div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
            Play Date Not Found
          </h2>
          <p className="text-slate-500 mb-6">
            This play date may have been removed or doesn&apos;t exist.
          </p>
          <Link
            href="/playdate"
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all"
          >
            Browse Play Dates
          </Link>
        </div>
      </div>
    );
  }

  const config =
    PET_TYPE_CONFIG[playdate.petType] || PET_TYPE_CONFIG["all"];

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] pb-32">
      {/* Main Content Container */}
      <main className="pt-4 md:pt-6 max-w-[900px] mx-auto px-4 md:px-0">
        
        {/* ─── Mobile Back Button ─────────────────────────── */}
        <Link
          href="/playdate"
          className="md:hidden inline-flex items-center gap-1.5 text-[#584237] text-sm font-semibold mb-3 hover:text-[#9d4300] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to Play Dates
        </Link>

        {/* ─── Hero Section ───────────────────────────────── */}
        <section className="mb-6 md:mb-8">
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Tag pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                  playdate.petType === "all"
                    ? "bg-[#f97316]/10 text-[#582200]"
                    : config.bg + " " + config.color
                }`}
              >
                <span>{config.emoji}</span>
                {playdate.petType === "all"
                  ? "All Pets Welcome"
                  : playdate.petType.charAt(0).toUpperCase() +
                    playdate.petType.slice(1) +
                    "s Only"}
              </span>
              {hostPet?.temperament && (
                <span className="px-3 py-1 bg-[#eceef0] text-[#584237] rounded-full text-[11px] font-semibold">
                  Socialization Level: {hostPet.temperament}
                </span>
              )}
            </div>

            {/* Title + Share */}
            <div className="flex justify-between items-start gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight max-w-2xl leading-tight">
                {playdate.title}
              </h1>
              <button
                onClick={handleShare}
                className="shrink-0 flex items-center justify-center p-2.5 md:p-3 bg-white border border-[#e0c0b1] rounded-full shadow-sm hover:bg-[#eceef0] active:scale-95 transition-all"
                aria-label={copied ? "Copied!" : "Share"}
              >
                {copied ? (
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-[#584237]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative mt-4 md:mt-5 rounded-2xl md:rounded-3xl overflow-hidden aspect-[16/9] shadow-sm md:shadow-md border border-[#e0c0b1] bg-[#e0e3e5]">
            {playdate.photoURL ? (
              <Image className="object-cover" src={playdate.photoURL} alt={playdate.title} fill sizes="(max-width: 900px) 100vw, 900px" priority />
            ) : hostPet?.photoURL ? (
              <Image className="object-cover" src={hostPet.photoURL} alt={hostPet.name} fill sizes="(max-width: 900px) 100vw, 900px" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl">{config.emoji}</span>
              </div>
            )}
          </div>
        </section>

        {/* ─── Event Info Grid ─────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-12">
          <div className="p-3 md:p-5 bg-white rounded-xl md:rounded-2xl shadow-sm border border-[#e0c0b1] flex flex-col gap-1 md:gap-1.5 active:scale-[0.98] transition-transform">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-[#9d4300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[9px] md:text-[10px] font-semibold text-[#584237] uppercase tracking-wider">Date &amp; Time</span>
            <span className="text-xs md:text-sm font-bold text-[#191c1e] leading-tight">{formatPlaydateDate(playdate.date)}</span>
          </div>
          <div className="p-3 md:p-5 bg-white rounded-xl md:rounded-2xl shadow-sm border border-[#e0c0b1] flex flex-col gap-1 md:gap-1.5 active:scale-[0.98] transition-transform">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-[#9d4300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-[9px] md:text-[10px] font-semibold text-[#584237] uppercase tracking-wider">Location</span>
            <span className="text-xs md:text-sm font-bold text-[#191c1e] leading-tight truncate">{playdate.locationName}</span>
          </div>
          <div className="p-3 md:p-5 bg-white rounded-xl md:rounded-2xl shadow-sm border border-[#e0c0b1] flex flex-col gap-1 md:gap-1.5 active:scale-[0.98] transition-transform">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-[#9d4300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-[9px] md:text-[10px] font-semibold text-[#584237] uppercase tracking-wider">Capacity</span>
            <span className="text-xs md:text-sm font-bold text-[#191c1e] leading-tight">{playdate.attendeeCount}/{playdate.maxPets}</span>
          </div>
          <div className="p-3 md:p-5 bg-white rounded-xl md:rounded-2xl shadow-sm border border-[#e0c0b1] flex flex-col gap-1 md:gap-1.5 active:scale-[0.98] transition-transform">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-[#9d4300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-[9px] md:text-[10px] font-semibold text-[#584237] uppercase tracking-wider">Status</span>
            <span className="text-xs md:text-sm font-bold text-[#191c1e] capitalize leading-tight">{playdate.status}</span>
          </div>
        </section>

        {/* ─── About Section ───────────────────────────────── */}
        {playdate.description && (
          <section className="mb-6 md:mb-12 flex flex-col gap-3 md:gap-4">
            <h2 className="text-lg md:text-2xl font-bold text-[#191c1e]">About this Playdate</h2>
            <p className="text-sm md:text-lg text-[#584237] leading-relaxed">
              {playdate.description}
            </p>
          </section>
        )}

        {/* ─── Host Section ────────────────────────────────── */}
        <section className="mb-6 md:mb-12">
          <h2 className="text-lg md:text-2xl font-bold text-[#191c1e] mb-3 md:mb-5">Your Host</h2>
          {hostPet ? (
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-[#e0c0b1] flex flex-col md:flex-row gap-4 md:gap-6 items-center">
              <div className="relative w-20 h-20 md:w-32 md:h-32 rounded-xl md:rounded-2xl overflow-hidden shrink-0 border-2 border-[#f97316]">
                {hostPet.photoURL ? (
                  <Image className="object-cover" src={hostPet.photoURL} alt={hostPet.name} fill sizes="128px" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl md:text-4xl bg-orange-100">
                    {config.emoji}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#191c1e]">{hostPet.name}</h3>
                  <span className="px-2 py-0.5 bg-[#9d4300] text-white text-[9px] md:text-[10px] font-bold rounded uppercase tracking-tight">Host Pet</span>
                </div>
                <p className="text-xs md:text-base text-[#584237] mb-2 md:mb-3">
                  {hostPet.breed} · {hostPet.age} {hostPet.age === "1" ? "Year" : "Years"} Old
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                  {hostPet.temperament && (
                    <span className="px-2.5 md:px-3 py-1 bg-[#f2f4f6] text-[#586377] rounded-full text-[10px] md:text-[11px] font-semibold">
                      {hostPet.temperament}
                    </span>
                  )}
                  {hostPet.vaccinated && (
                    <span className="px-2.5 md:px-3 py-1 bg-[#f2f4f6] text-[#586377] rounded-full text-[10px] md:text-[11px] font-semibold">
                      Vaccinated
                    </span>
                  )}
                  <span className="px-2.5 md:px-3 py-1 bg-[#f2f4f6] text-[#586377] rounded-full text-[10px] md:text-[11px] font-semibold capitalize">
                    {hostPet.gender === "male" ? "♂ Male" : "♀ Female"}
                  </span>
                </div>
              </div>
              
            </div>
          ) : (
            <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-[#e0c0b1] text-center">
              <p className="text-sm md:text-base text-[#584237]">Host pet information is being loaded...</p>
            </div>
          )}
        </section>

        {/* ─── Attendees Section ───────────────────────────── */}
        <section className="mb-6 md:mb-12 pb-4">
          <div className="flex justify-between items-center mb-3 md:mb-5">
            <h2 className="text-lg md:text-2xl font-bold text-[#191c1e]">Attending ({attendeePets.length})</h2>
          </div>

          {attendeePets.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {attendeePets.map((pet) => {
                const typeCfg = PET_TYPE_CONFIG[pet.type] || PET_TYPE_CONFIG["other"];
                return (
                  <div key={pet.id} className="bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-[#e0c0b1] hover:shadow-md transition-shadow group active:scale-[0.98]">
                    <div className="relative mb-2 md:mb-3">
                      <div className="relative aspect-square rounded-lg md:rounded-xl overflow-hidden bg-[#eceef0]">
                        {pet.photoURL ? (
                          <Image className="object-cover group-hover:scale-110 transition-transform duration-500" src={pet.photoURL} alt={pet.name} fill sizes="(max-width: 640px) 50vw, 25vw" loading="lazy" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl">
                            {typeCfg.emoji}
                          </div>
                        )}
                      </div>
                      {pet.vaccinated && (
                        <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-4 h-4 md:w-5 md:h-5 bg-green-500/80 text-white rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 md:w-3 md:h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs md:text-sm font-bold text-[#191c1e]">{pet.name}</h4>
                    <p className="text-[10px] md:text-[11px] text-[#584237] truncate">{pet.breed}</p>
                  </div>
                );
              })}

              {/* Empty slot for user's pet */}
              {currentUser && hasPets && !hasJoined && !isFull && !isHost && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="border-2 border-dashed border-[#e0c0b1] rounded-xl md:rounded-2xl flex flex-col items-center justify-center p-3 md:p-4 bg-[#f2f4f6]/50 hover:border-[#9d4300] hover:bg-[#ffdbca]/20 active:scale-[0.97] transition-all min-h-[140px] md:min-h-0"
                >
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-[#8c7164] mb-1 md:mb-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8" />
                    <path d="M8 12h8" />
                  </svg>
                  <span className="text-[10px] md:text-[11px] font-semibold text-[#584237] text-center">Your Pet Here?</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 md:py-10 bg-white rounded-xl md:rounded-2xl border border-[#e0c0b1]">
              <span className="text-3xl md:text-4xl block mb-2 md:mb-3">🐾</span>
              <p className="text-xs md:text-sm text-[#584237] font-medium">No pets have joined yet. Be the first!</p>
              {currentUser && hasPets && !isFull && !isHost && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="mt-3 md:mt-4 inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-[#9d4300] text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all text-sm"
                >
                  Join with Your Pet
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ─── Sticky Footer Action Bar ──────────────────────── */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#e0c0b1] py-3 md:py-4 px-4 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-[900px] mx-auto flex items-center justify-between gap-3">
          <Link
            href="/playdate"
            className="hidden md:flex items-center gap-2 px-4 py-2.5 text-[#584237] font-semibold text-sm hover:bg-[#eceef0] rounded-xl transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back
          </Link>

          <div className="flex gap-2 md:gap-3 w-full md:w-auto">
            {currentUser ? (
              hasJoined ? (
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="flex-1 md:flex-none px-5 md:px-6 py-2.5 md:py-3 bg-white border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 active:bg-red-100 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {leaving && <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />}
                  {leaving ? "Leaving..." : "Leave"}
                </button>
              ) : isHost ? (
                <div className="flex-1 md:flex-none px-5 md:px-6 py-2.5 md:py-3 bg-[#eceef0] text-[#584237] font-bold rounded-xl text-sm text-center">
                  You&apos;re hosting
                </div>
              ) : !hasPets ? (
                <Link
                  href="/pets/register"
                  className="flex-1 md:flex-none px-5 md:px-6 py-2.5 md:py-3 bg-[#9d4300] text-white font-bold rounded-xl hover:brightness-110 active:brightness-90 transition-all text-sm text-center shadow-md block"
                >
                  Register a Pet to Join
                </Link>
              ) : isFull ? (
                <div className="flex-1 md:flex-none px-5 md:px-6 py-2.5 md:py-3 bg-[#eceef0] text-[#584237] font-bold rounded-xl text-sm text-center">
                  Play date is full
                </div>
              ) : (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="flex-1 md:flex-none px-5 md:px-6 py-2.5 md:py-3 bg-[#9d4300] text-white font-bold rounded-xl hover:brightness-110 active:brightness-90 transition-all text-sm shadow-md flex items-center justify-center gap-2"
                >
                  Join with Your Pet
                </button>
              )
            ) : (
              <Link
                href="/auth"
                className="flex-1 md:flex-none px-5 md:px-6 py-2.5 md:py-3 bg-[#9d4300] text-white font-bold rounded-xl hover:brightness-110 active:brightness-90 transition-all text-sm shadow-md text-center block"
              >
                Sign In to Join
              </Link>
            )}
            
          </div>
        </div>
      </div>

      {/* ─── Join Modal / Bottom Sheet ─────────────────────── */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[99999]">
          <div
            className="absolute inset-0 bg-[#191c1e]/60 backdrop-blur-sm"
            onClick={() => setShowJoinModal(false)}
          />
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 sm:p-8 pt-3 sm:pt-8 shadow-2xl relative z-[100000] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-bold text-[#191c1e]">
                Choose Your Pet
              </h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="w-8 h-8 flex items-center justify-center text-[#584237] hover:text-[#191c1e] hover:bg-[#eceef0] rounded-full transition-all"
                aria-label="Close"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs md:text-sm text-[#584237] mb-4 md:mb-6">
              Select the pet you&apos;d like to bring to this play date.
            </p>

            <div className="space-y-2 mb-4 md:mb-6 max-h-48 md:max-h-64 overflow-y-auto -mx-2 px-2">
              {userPets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`w-full flex items-center gap-3 p-2.5 md:p-3 rounded-xl md:rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                    selectedPetId === pet.id
                      ? "border-[#9d4300] bg-[#ffdbca]/30"
                      : "border-[#e0c0b1] hover:border-[#9d4300]"
                  }`}
                >
                  {pet.photoURL ? (
                    <Image
                      src={pet.photoURL}
                      alt={pet.name}
                      width={44}
                      height={44}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-100 flex items-center justify-center text-base md:text-xl shrink-0">
                      🐾
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm md:text-base text-[#191c1e]">{pet.name}</p>
                    <p className="text-[11px] md:text-xs text-[#584237] truncate">
                      {pet.breed} · {pet.age} · {pet.temperament}
                    </p>
                  </div>
                  {selectedPetId === pet.id && (
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#9d4300] text-white flex items-center justify-center text-xs font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-[#584237] hover:bg-[#eceef0] active:bg-[#e0e3e5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={joining || !selectedPetId}
                className="flex-[2] bg-[#9d4300] text-white py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-sm md:text-base hover:brightness-110 active:brightness-90 shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joining && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {joining ? "Joining..." : "Join Play Date"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pet Profile Card (privacy-first: shows ONLY pet info) ──── */

function PetProfileCard({
  pet,
  badge,
}: {
  pet: Pet;
  badge?: string;
}) {
  const typeConfig =
    PET_TYPE_CONFIG[pet.type] || PET_TYPE_CONFIG["other"];

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      {pet.photoURL ? (
        <img
          src={pet.photoURL}
          alt={pet.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
        />
      ) : (
        <div
          className={`w-12 h-12 rounded-full ${typeConfig.bg} flex items-center justify-center text-xl`}
        >
          {typeConfig.emoji}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-800 truncate">{pet.name}</p>
          {badge && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
              {badge}
            </span>
          )}
          {pet.vaccinated && (
            <span
              className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-600"
              title="Vaccinated"
            >
              💉
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate">
          {pet.breed} · {pet.age} ·{" "}
          {pet.gender === "male" ? "♂" : "♀"} · {pet.temperament}
        </p>
      </div>
      <span className="text-lg">{typeConfig.emoji}</span>
    </div>
  );
}
