"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();

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
  const spotsLeft = playdate.maxPets - playdate.attendeeCount;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Color strip */}
      <div
        className="h-2 w-full"
        style={{
          background: `linear-gradient(90deg, ${config.dot}, ${config.dot}66)`,
        }}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Back link */}
        <Link
          href="/playdate"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-semibold mb-6 transition-colors"
        >
          ← Back to Play Dates
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex items-start justify-between gap-4 mb-4">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.color} ${config.border} border`}
              >
                <span className="text-sm">{config.emoji}</span>
                {playdate.petType === "all"
                  ? "All Pets Welcome"
                  : playdate.petType.charAt(0).toUpperCase() +
                    playdate.petType.slice(1) +
                    "s Only"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold transition-colors"
                >
                  {copied ? "✓ Copied!" : "📤 Share"}
                </button>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
              {playdate.title}
            </h1>

            {playdate.description && (
              <p className="text-slate-500 leading-relaxed">
                {playdate.description}
              </p>
            )}
          </div>

          {/* Meta Info */}
          <div className="p-6 md:p-8 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  When
                </p>
                <p className="font-bold text-slate-800">
                  {formatPlaydateDate(playdate.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  Where
                </p>
                <p className="font-bold text-slate-800">
                  {playdate.locationName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
              <span className="text-2xl">🐾</span>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  Spots
                </p>
                <p className="font-bold text-slate-800">
                  {playdate.attendeeCount} / {playdate.maxPets}
                  <span className="text-sm text-slate-400 ml-1">
                    ({spotsLeft} left)
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
              <span className="text-2xl">
                {playdate.status === "upcoming"
                  ? "🟢"
                  : playdate.status === "completed"
                  ? "✅"
                  : "🔴"}
              </span>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  Status
                </p>
                <p className="font-bold text-slate-800 capitalize">
                  {playdate.status}
                </p>
              </div>
            </div>
          </div>

          {/* Host Pet (no user info) */}
          {hostPet && (
            <div className="p-6 md:p-8 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Host Pet
              </h3>
              <PetProfileCard pet={hostPet} badge="Host" />
            </div>
          )}

          {/* Attending Pets (no user info — privacy!) */}
          <div className="p-6 md:p-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              Attending Pets{" "}
              <span className="text-slate-300">
                ({attendeePets.length})
              </span>
            </h3>

            {attendeePets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attendeePets.map((pet) => (
                  <PetProfileCard key={pet.id} pet={pet} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-3xl block mb-2">🐾</span>
                <p className="text-sm text-slate-400 font-medium">
                  No pets have joined yet. Be the first!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {currentUser ? (
            hasJoined ? (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="flex-1 py-3.5 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                {leaving && (
                  <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                )}
                {leaving ? "Leaving..." : "Leave Play Date"}
              </button>
            ) : isHost ? (
              <div className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-center">
                You&apos;re hosting this play date
              </div>
            ) : !hasPets ? (
              <Link
                href="/pets/register"
                className="flex-1 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 text-center"
              >
                🐾 Register a Pet to Join
              </Link>
            ) : isFull ? (
              <div className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-center">
                This play date is full
              </div>
            ) : (
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex-1 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
              >
                🐾 Join with Your Pet
              </button>
            )
          ) : (
            <Link
              href="/auth"
              className="flex-1 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 text-center"
            >
              Sign In to Join
            </Link>
          )}
        </div>
      </div>

      {/* Join Modal — select which pet to bring */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[99999]">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowJoinModal(false)}
          />
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative z-[100000]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-slate-800">
                Choose Your Pet
              </h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              Select the pet you&apos;d like to bring to this play date.
            </p>

            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {userPets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                    selectedPetId === pet.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {pet.photoURL ? (
                    <img
                      src={pet.photoURL}
                      alt={pet.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl">
                      🐾
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800">{pet.name}</p>
                    <p className="text-xs text-slate-400">
                      {pet.breed} · {pet.age} · {pet.temperament}
                    </p>
                  </div>
                  {selectedPetId === pet.id && (
                    <span className="ml-auto text-orange-500 text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={joining || !selectedPetId}
                className="flex-[2] bg-orange-500 text-white py-3 rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
