"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { registerPet, PetType } from "../../playdate/hooks/usePlaydates";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const PET_TYPES: { value: PetType; label: string; emoji: string }[] = [
  { value: "dog", label: "Dog", emoji: "🐕" },
  { value: "cat", label: "Cat", emoji: "🐱" },
  { value: "bird", label: "Bird", emoji: "🐦" },
  { value: "rabbit", label: "Rabbit", emoji: "🐰" },
  { value: "other", label: "Other", emoji: "🐾" },
];

const TEMPERAMENTS = [
  "Friendly & Playful",
  "Calm & Gentle",
  "Energetic & Active",
  "Shy & Reserved",
  "Protective & Loyal",
  "Curious & Adventurous",
];

export default function PetRegisterPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState<PetType>("dog");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [temperament, setTemperament] = useState("");
  const [vaccinated, setVaccinated] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push("/auth");
      return;
    }
    if (!name.trim() || !breed.trim() || !age.trim() || !temperament) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let photoURL = "";
      if (photoFile) {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `pet_photos/${currentUser.uid}/${Date.now()}_${photoFile.name}`
        );
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await registerPet({
        name: name.trim(),
        type,
        breed: breed.trim(),
        age: age.trim(),
        gender,
        temperament,
        photoURL,
        ownerId: currentUser.uid,
        vaccinated,
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Failed to register pet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    router.push("/auth");
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 text-center max-w-md w-full animate-bounce-in">
          <div className="text-6xl mb-4 animate-paw-bounce inline-block">🐾</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3">
            Pet Registered!
          </h2>
          <p className="text-slate-500 mb-8">
            <strong>{name}</strong> is now part of the AnimalSathi family.
            You&apos;re ready to explore Play Dates!
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/playdate")}
              className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
            >
              🎉 Explore Play Dates
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setName("");
                setBreed("");
                setAge("");
                setTemperament("");
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="w-full py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              + Register Another Pet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-16 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-1.5 rounded-full mb-4">
            <span className="animate-paw-bounce inline-block">🐾</span>
            <span className="text-orange-600 font-bold text-xs uppercase tracking-wider">
              Pet Registration
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
            Register Your Pet
          </h1>
          <p className="text-slate-500 max-w-sm mx-auto">
            Add your furry friend to unlock Play Dates and connect with other
            pet parents in your area.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6"
        >
          {/* Photo Upload */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-28 h-28 rounded-full bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center overflow-hidden hover:border-orange-400 transition-colors group"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Pet preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <span className="text-3xl block mb-1">📸</span>
                  <span className="text-[10px] text-orange-400 font-bold uppercase">
                    Add Photo
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <span className="text-white text-sm font-bold">Change</span>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-[11px] text-slate-400 mt-2">
              Optional · Max 5MB
            </p>
          </div>

          {/* Pet Name */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Pet Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bruno, Whiskers, Coco"
              className="w-full mt-1.5 bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-orange-500 transition-colors text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal"
              required
            />
          </div>

          {/* Pet Type */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">
              Pet Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PET_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setType(pt.value)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all flex items-center gap-2 ${
                    type === pt.value
                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="text-lg">{pt.emoji}</span>
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Breed */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Breed <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="e.g. Golden Retriever, Persian, Parrot"
              className="w-full mt-1.5 bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-orange-500 transition-colors text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal"
              required
            />
          </div>

          {/* Age & Gender Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 2 years"
                className="w-full mt-1.5 bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-orange-500 transition-colors text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">
                Gender
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                    gender === "male"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  ♂ Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                    gender === "female"
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  ♀ Female
                </button>
              </div>
            </div>
          </div>

          {/* Temperament */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">
              Temperament <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPERAMENTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemperament(t)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all text-left ${
                    temperament === t
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Vaccinated */}
          <label className="flex items-center gap-3 cursor-pointer bg-green-50 border border-green-100 rounded-2xl px-5 py-4">
            <input
              type="checkbox"
              checked={vaccinated}
              onChange={(e) => setVaccinated(e.target.checked)}
              className="w-5 h-5 accent-green-600 rounded"
            />
            <div>
              <span className="font-bold text-slate-800 text-sm">
                Vaccinated
              </span>
              <p className="text-xs text-slate-500">
                Check if your pet&apos;s vaccinations are up to date
              </p>
            </div>
            {vaccinated && (
              <span className="ml-auto text-green-600 font-bold text-lg">
                ✓
              </span>
            )}
          </label>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3 text-red-700 text-sm font-bold">
              ❌ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2 text-base"
          >
            {submitting && (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {submitting ? "Registering..." : "🐾 Register Pet"}
          </button>
        </form>
      </div>
    </div>
  );
}
