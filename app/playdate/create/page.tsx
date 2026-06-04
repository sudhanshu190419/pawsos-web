"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import { useLocation } from "../../lib/LocationContext";
import {
  useUserPets,
  createPlaydate,
  uploadPlaydateImage,
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      // Upload image first if provided
      let photoURL = "";
      if (imageFile) {
        photoURL = await uploadPlaydateImage(imageFile, currentUser.uid);
      }

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
        photoURL,
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
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8fa]">
        <div className="w-14 h-14 border-4 border-[#ffe088] border-t-[#cca830] rounded-full animate-spin" />
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
      <div className="min-h-screen bg-[#fbf8fa] flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-[#c5c6cd] text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-[#ffe088]/30 flex items-center justify-center text-5xl mx-auto mb-6 border-4 border-white shadow-md">
            🐾
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#091426] mb-3">
            Register a Pet First
          </h2>
          <p className="text-[#45474c] mb-8">
            You need at least one registered pet to create a play date.
          </p>
          <Link
            href="/pets/register"
            className="inline-flex items-center gap-2 bg-[#cca830] text-[#4f3e00] px-8 py-3.5 rounded-xl font-bold hover:bg-[#735c00] hover:text-white active:scale-95 transition-all duration-300 shadow-lg"
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
      <div className="fixed inset-0 z-[100] bg-[#091426]/40 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-[#fbf8fa] rounded-[2rem] p-10 md:p-12 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-[#ffe088]/30 text-[#735c00] rounded-full flex items-center justify-center mb-8">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#091426] mb-4">
            Event Curated
          </h2>
          <p className="text-base text-[#45474c] mb-10 leading-relaxed">
            Your gathering has been published. Prepare for a delightful experience with fellow enthusiasts.
          </p>
          <div className="flex flex-col w-full gap-4">
            <Link
              href={`/playdate/${createdId}`}
              className="w-full py-4 bg-[#091426] text-white rounded-xl font-bold hover:bg-[#091426]/90 transition-all"
            >
              View Invitation
            </Link>
            <Link
              href="/playdate"
              className="w-full py-4 text-[#45474c] font-bold hover:text-[#091426] transition-all underline underline-offset-4"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Header */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto pt-8 md:pt-12 mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#091426] mb-2">
          Curate a Memorable Play Date
        </h1>
        <p className="text-base md:text-lg text-[#45474c]">
          Set the stage for a delightful gathering of companions.
        </p>
      </section>

      {/* Main Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 px-4 md:px-10 max-w-[1280px] mx-auto">
        
        {/* Left Side: Form Details */}
        <form id="createPlayDateForm" className="lg:col-span-7 flex flex-col gap-8" onSubmit={handleSubmit}>
          
          {/* Pet Selection Carousel */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-[#091426] uppercase tracking-wider">
              Select Your Host Pet
            </label>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 md:pb-4 scroll-hide -mx-2 px-2 no-scrollbar">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`flex-shrink-0 w-28 sm:w-32 md:w-40 group cursor-pointer text-left ${
                    selectedPetId === pet.id ? "selected" : ""
                  }`}
                >
                  <div
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-300 ${
                      selectedPetId === pet.id
                        ? "border-[#cca830] shadow-md"
                        : "border-transparent hover:border-slate-200"
                    }`}
                  >
                    {pet.photoURL ? (
                      <img
                        src={pet.photoURL}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-4xl">
                        🐾
                      </div>
                    )}
                    <div
                      className={`absolute inset-0 bg-[#091426]/20 flex items-center justify-center transition-opacity ${
                        selectedPetId === pet.id ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-sm font-semibold text-[#091426]">
                    {pet.name}
                  </p>
                </button>
              ))}
              {/* Add Pet Button */}
              <Link
                href="/pets/register"
                className="flex-shrink-0 w-40 aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-[#cca830] hover:text-[#cca830] transition-all cursor-pointer"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
                <span className="text-xs font-semibold">Add Pet</span>
              </Link>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#091426]" htmlFor="title">
              Play Date Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Afternoon Garden Social"
              className="w-full bg-[#f5f3f4] border border-[#c5c6cd] rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#cca830] focus:border-[#cca830] outline-none transition-all placeholder:text-[#636360]/50"
              required
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#091426]" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share what makes this gathering special..."
              rows={4}
              className="w-full bg-[#f5f3f4] border border-[#c5c6cd] rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#cca830] focus:border-[#cca830] outline-none transition-all placeholder:text-[#636360]/50 resize-none"
              maxLength={500}
            />
          </div>

          

          {/* Who Can Join? */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-[#091426] uppercase tracking-wider">
              Who Can Join?
            </label>
            <div className="flex flex-wrap gap-3">
              {PET_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPetType(opt.value)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all ${
                    petType === opt.value
                      ? "bg-[#ffe088] text-[#4f3e00] border-[#cca830] shadow-sm"
                      : "border-[#c5c6cd] text-[#45474c] hover:border-[#cca830] hover:text-[#735c00]"
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max Capacity */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-[#091426]">Maximum Capacity</label>
              <span className="text-sm font-bold text-[#735c00] bg-[#ffe088]/30 px-3 py-1 rounded-full">
                {maxPets} Pets
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={30}
              value={maxPets}
              onChange={(e) => setMaxPets(Number(e.target.value))}
              className="custom-slider"
            />
            <div className="flex justify-between text-xs text-[#636360]/60 font-medium">
              <span>2 Pets</span>
              <span>30 Pets</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm font-semibold">
              {error}
            </div>
          )}
        </form>

        {/* Right Side: Logistics */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Logistics Card */}
          <div className="bg-[#f5f3f4] border border-[#c5c6cd] rounded-2xl p-6 flex flex-col gap-6">
            <h3 className="text-xl font-semibold text-[#091426]">Logistics</h3>
            
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[#636360]">Date</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45474c] w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    min={today}
                    className="w-full bg-white border border-[#c5c6cd] rounded-lg pl-10 pr-4 py-2.5 focus:border-[#cca830] outline-none text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[#636360]">Time</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45474c] w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <input
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full bg-white border border-[#c5c6cd] rounded-lg pl-10 pr-4 py-2.5 focus:border-[#cca830] outline-none text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location (no map - manual input only) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[#636360]">Location</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45474c] w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Type your location..."
                  className="w-full bg-white border border-[#c5c6cd] rounded-lg pl-10 pr-4 py-2.5 focus:border-[#cca830] outline-none text-sm"
                  required
                />
              </div>
              {location && (
                <p className="text-xs text-slate-500 mt-1 ml-1">
                  📍 Auto-detected: {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            form="createPlayDateForm"
            disabled={submitting}
            className="w-full bg-[#cca830] hover:bg-[#735c00] text-[#4f3e00] hover:text-white py-4 rounded-xl font-bold text-base shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {submitting && (
              <div className="w-5 h-5 border-2 border-[#4f3e00]/30 border-t-[#4f3e00] rounded-full animate-spin" />
            )}
            {submitting ? "Creating..." : (
              <>
                <span>Create Play Date</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#45474c] px-8">
            Your invitation will be shared with the community instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
