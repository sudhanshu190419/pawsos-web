"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import {
  useUserPets,
  createPlaydate,
  PetType,
  Pet,
} from "../hooks/usePlaydates";
import { GeoPoint } from "firebase/firestore";

const PET_TYPE_OPTIONS: {
  value: PetType | "all";
  label: string;
  emoji: string;
}[] = [
  { value: "all", label: "All Pets Welcome", emoji: "🐾" },
  { value: "dog", label: "Dogs Only", emoji: "🐕" },
  { value: "cat", label: "Cats Only", emoji: "🐱" },
  { value: "bird", label: "Birds Only", emoji: "🐦" },
];

export default function CreatePlayDatePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { pets, loading: petsLoading, hasPets } = useUserPets(currentUser);
  const { location } = useLocation();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [petType, setPetType] = useState<PetType | "all">("all");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<number>(0);
  const [locationLng, setLocationLng] = useState<number>(0);
  const [maxPets, setMaxPets] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState("");

  // Auto-fill location from context
  useEffect(() => {
    if (location && !locationName) {
      setLocationName(location.address || "");
      setLocationLat(location.latitude);
      setLocationLng(location.longitude);
    }
  }, [location, locationName]);

  // Auto-select first pet
  useEffect(() => {
    if (pets.length > 0 && !selectedPetId) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (
      !title.trim() ||
      !dateStr ||
      !timeStr ||
      !locationName.trim() ||
      !selectedPetId
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const playdateDate = new Date(`${dateStr}T${timeStr}`);
    if (playdateDate <= new Date()) {
      setError("Play date must be in the future.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const id = await createPlaydate({
        title: title.trim(),
        description: description.trim(),
        petType,
        date: playdateDate,
        locationName: locationName.trim(),
        location: new GeoPoint(
          locationLat || location?.latitude || 28.6139,
          locationLng || location?.longitude || 77.209
        ),
        locationLat: locationLat || location?.latitude || 28.6139,
        locationLng: locationLng || location?.longitude || 77.209,
        maxPets,
        createdBy: currentUser.uid,
        creatorName: currentUser.displayName || "Anonymous",
        creatorPhoto: currentUser.photoURL || "",
        hostPetId: selectedPetId,
      });

      setCreatedId(id);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Failed to create play date. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || petsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="w-14 h-14 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Auth gate
  if (!currentUser) {
    router.push("/auth");
    return null;
  }

  // Pet gate
  if (!hasPets) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-slate-100 text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-5xl mx-auto mb-6 border-4 border-white shadow-md">
            🐾
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
            Register a Pet First
          </h2>
          <p className="text-slate-600 mb-8">
            You need at least one registered pet to create a play date.
          </p>
          <Link
            href="/pets/register"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-orange-600 active:scale-95 transition-all duration-300 shadow-lg shadow-orange-500/30"
          >
            🐾 Register Your Pet
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-slate-100 text-center max-w-md w-full">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-green-50 border-4 border-white rounded-full flex items-center justify-center text-3xl shadow-lg">
            🎉
          </div>
          <div className="mt-6 mb-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
              Play Date Created!
            </h2>
            <p className="text-slate-600">
              Your play date <strong className="text-orange-600">&quot;{title}&quot;</strong> is live! Other pet parents can now discover and join it.
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-8">
            <Link
              href={`/playdate/${createdId}`}
              className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all duration-300 shadow-lg shadow-orange-500/30"
            >
              View Play Date
            </Link>
            <Link
              href="/playdate"
              className="w-full py-3.5 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all duration-300"
            >
              Browse All Play Dates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2 rounded-full mb-5 shadow-sm">
            <span className="animate-paw-bounce">🐾</span>
            <span className="text-orange-600 font-extrabold text-xs uppercase tracking-widest">New Play Date</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-3 leading-tight">
            Create a Play Date
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto text-base leading-relaxed">
            Set up a meetup for your pet and let others discover and join it.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-slate-100 space-y-7"
        >
          {/* Select Your Pet */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1 mb-3 block">
              Your Pet <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedPetId === pet.id
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {pet.photoURL ? (
                    <img
                      src={pet.photoURL}
                      alt={pet.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">
                      🐾
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800">
                      {pet.name}
                    </p>
                    <p className="text-xs text-slate-500">{pet.breed}</p>
                  </div>
                </button>
              ))}
            </div>
            <Link
              href="/pets/register"
              className="mt-3 inline-flex items-center gap-1 text-xs text-orange-600 font-bold hover:underline transition-colors"
            >
              + Add another pet
            </Link>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1 mb-2 block">
              Play Date Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Morning Dog Walk at Lodi Garden"
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:bg-orange-50/30 transition-all duration-300 text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal"
              required
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1 mb-2 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others what to expect — activities, rules, what to bring..."
              rows={3}
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:bg-orange-50/30 transition-all duration-300 text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal resize-none"
              maxLength={500}
            />
          </div>

          {/* Pet Type */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1 mb-3 block">
              Who can join? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PET_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPetType(opt.value)}
                  className={`px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all duration-300 flex items-center gap-2.5 ${
                    petType === opt.value
                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-left">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1 mb-2 block">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                min={today}
                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:bg-orange-50/30 transition-all duration-300 text-slate-900 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1 mb-2 block">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:bg-orange-50/30 transition-all duration-300 text-slate-900 font-bold"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1 mb-2 block">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Lodi Garden, New Delhi"
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:bg-orange-50/30 transition-all duration-300 text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal"
              required
            />
            {location && (
              <p className="text-xs text-slate-500 mt-2 ml-1 font-medium">
                📍 Auto-detected: {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
              </p>
            )}
          </div>

          {/* Max Pets */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1 mb-3 block">
              Max Pets: <span className="text-orange-600 font-black text-sm">{maxPets}</span>
            </label>
            <input
              type="range"
              min={2}
              max={30}
              value={maxPets}
              onChange={(e) => setMaxPets(Number(e.target.value))}
              className="w-full accent-orange-500 h-2.5 rounded-lg appearance-none bg-slate-200"
            />
            <div className="flex justify-between text-xs text-slate-500 font-semibold mt-2">
              <span>2 pets</span>
              <span>30 pets</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-bold">
              ❌ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-orange-500 text-white font-black rounded-xl hover:bg-orange-600 active:scale-95 transition-all duration-300 shadow-lg shadow-orange-500/30 disabled:opacity-50 flex items-center justify-center gap-2.5 text-base"
          >
            {submitting && (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {submitting ? "Creating..." : "🎉 Create Play Date"}
          </button>
        </form>
      </div>
    </div>
  );
}
