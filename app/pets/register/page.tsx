"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import { registerPet, PetType } from "../../playdate/hooks/usePlaydates";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const PET_TYPES: { value: PetType; label: string; icon: string }[] = [
  { value: "dog", label: "Dog", icon: "🐕" },
  { value: "cat", label: "Cat", icon: "🐱" },
  { value: "bird", label: "Bird", icon: "🐦" },
  { value: "rabbit", label: "Rabbit", icon: "🐰" },
  { value: "other", label: "Other", icon: "🐾" },
];

const TEMPERAMENTS = [
  "Energetic",
  "Calm",
  "Friendly",
  "Shy",
  "Playful",
  "Protective",
];

const AGE_OPTIONS = [
  "Puppy / Kitten",
  "1 - 3 years",
  "3 - 7 years",
  "7+ years (Senior)",
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
  const [neutered, setNeutered] = useState(false);
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
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push("/auth");
      return;
    }
    if (!name.trim() || !breed.trim() || !age || !temperament) {
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
        age,
        gender,
        temperament,
        photoURL,
        ownerId: currentUser.uid,
        vaccinated,
        neutered,
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
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#ffdbd0] border-t-[#ab3500] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#594139]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    router.push("/auth");
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-[#e3e2e0] text-center max-w-md w-full relative overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#ffdbd0]/30 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#c0ecda]/30 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-[#ffb59d]/40 flex items-center justify-center text-4xl mx-auto mb-6 border-4 border-white shadow-lg">
              🐾
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a1c1a] mb-3">
              Pet Registered!
            </h2>
            <p className="text-sm md:text-base text-[#594139] mb-8 leading-relaxed">
              <strong className="text-[#ab3500]">{name}</strong> is now part of the AnimalSathi family. You&apos;re ready to explore Play Dates!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/playdate")}
                className="w-full py-3.5 bg-[#ab3500] text-white font-bold rounded-xl hover:brightness-110 active:translate-y-0.5 transition-all shadow-[0_4px_0_0_#832600]"
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
                  if (photoPreview) URL.revokeObjectURL(photoPreview);
                  setPhotoPreview(null);
                }}
                className="w-full py-3.5 border-2 border-[#e3e2e0] text-[#594139] font-bold rounded-xl hover:bg-[#f4f3f1] active:translate-y-0.5 transition-all"
              >
                + Register Another Pet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1c1a] selection:bg-[#ffdbd0] selection:text-[#390c00]">
      {/* ─── Background Orbs ───────────────────────────────── */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#ffdbd0]/30 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#c0ecda]/30 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="pt-16 md:pt-24 pb-16 min-h-screen">
        <div className="w-full max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start">

            {/* ─── Left: Hero Content ──────────────────────────── */}
            <div className="w-full lg:w-5/12 lg:sticky lg:top-28 space-y-5 md:space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1a1c1a] leading-tight">
                Join the{" "}
                <span className="text-[#ab3500]">AnimalSathi</span> Family
              </h1>
              <p className="text-base md:text-lg text-[#594139] leading-relaxed">
                Share a few details about your companion to start discovering local play dates and premium care services tailored just for them.
              </p>

              {/* Hero image - desktop only */}
              <div className="hidden lg:block relative rounded-xl overflow-hidden shadow-xl aspect-video bg-white/70 backdrop-blur-[20px] border border-white/30 p-1.5">
                <Image
                  className="w-full h-full object-cover rounded-lg"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBly8Hn3V1UI3sahmx4qlOtsuYHsrLWdbGTxXmhZ00a4wI6uU7267AG3Bfb955JeaE48svOdGTIovi3CN5PICECLzBSLyDU9LllQGUyTAv2gPpOkcdLJE_lFxhh1ZzdHwk_wtqSYXNHPUJT-ZMAO-q2ioQUBdd4asl5gwWdhTaWAbLPARy-4HlqQgRcdl6n94nkoFnR6W2QKyDVqnHO8AIauE5Mj26yqOBtLzb-R_KWuzH4bY7I9xbJrpReYHZ8q1n2AbBAON3N2qFX"
                  alt="Happy dog and cat sitting together"
                  width={600}
                  height={340}
                  priority
                />
              </div>
            </div>

            {/* ─── Right: Registration Form ─────────────────────── */}
            <div className="w-full lg:w-7/12">
              <div className="bg-white/70 backdrop-blur-[20px] border border-white/30 shadow-[0_10px_30px_-10px_rgba(26,32,44,0.08)] rounded-xl p-6 md:p-10 lg:p-12 space-y-8 md:space-y-10">

                {/* ── Photo Upload ──────────────────────────────── */}
                <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="group relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#e9e8e5] cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Pet preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl md:text-5xl">🐾</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <svg className="w-6 h-6 md:w-7 md:h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span className="text-white text-[10px] md:text-xs font-semibold mt-0.5">Change Photo</span>
                    </div>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs md:text-sm font-semibold text-[#594139]">
                    Click to upload pet photo
                  </p>
                </div>

                {/* ── Form ──────────────────────────────────────── */}
                <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">

                  {/* === Step 1: Identity === */}
                  <section className="space-y-5 md:space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#ff6b35] text-white flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                        1
                      </span>
                      <h2 className="text-lg md:text-xl font-bold text-[#1a1c1a]">Identity</h2>
                    </div>

                    {/* Pet Name */}
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-xs md:text-sm font-semibold text-[#594139] ml-1">
                        Pet Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="What's their name?"
                        className="w-full h-12 md:h-14 bg-[#f4f3f1] border-0 border-b-2 border-[#e1bfb5] focus:border-[#ab3500] focus:ring-0 text-lg md:text-xl font-bold transition-all placeholder:text-[#594139]/30 outline-none px-1"
                        required
                      />
                    </div>

                    {/* Pet Type */}
                    <div className="space-y-3">
                      <label className="text-xs md:text-sm font-semibold text-[#594139] ml-1">
                        Pet Type
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                        {PET_TYPES.map((pt) => (
                          <button
                            key={pt.value}
                            type="button"
                            onClick={() => setType(pt.value)}
                            className={`flex flex-col items-center justify-center p-3 md:p-4 border rounded-xl transition-all group ${
                              type === pt.value
                                ? "border-[#ab3500] bg-[#ffdbd0] shadow-sm"
                                : "border-[#e1bfb5] bg-white hover:border-[#ab3500]"
                            }`}
                          >
                            <span className={`text-2xl md:text-3xl transition-transform ${type === pt.value ? "scale-110" : "group-hover:scale-110"}`}>
                              {pt.icon}
                            </span>
                            <span className={`text-[10px] md:text-xs font-semibold mt-1.5 ${
                              type === pt.value ? "text-[#ab3500]" : "text-[#594139]"
                            }`}>
                              {pt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* === Step 2: Details === */}
                  <section className="space-y-5 md:space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#ff6b35] text-white flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                        2
                      </span>
                      <h2 className="text-lg md:text-xl font-bold text-[#1a1c1a]">Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* Breed */}
                      <div className="space-y-1.5 md:space-y-2">
                        <label className="text-xs md:text-sm font-semibold text-[#594139] ml-1">
                          Breed
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={breed}
                            onChange={(e) => setBreed(e.target.value)}
                            placeholder="Search breeds..."
                            className="w-full h-11 md:h-12 px-4 rounded-xl bg-[#f4f3f1] border border-[#e1bfb5] focus:border-[#ab3500] focus:ring-0 transition-all text-sm md:text-base outline-none"
                            required
                          />
                          <svg className="absolute right-3.5 top-3 md:top-3.5 w-4 h-4 md:w-5 md:h-5 text-[#594139]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                          </svg>
                        </div>
                      </div>

                      {/* Age */}
                      <div className="space-y-1.5 md:space-y-2">
                        <label className="text-xs md:text-sm font-semibold text-[#594139] ml-1">
                          Age
                        </label>
                        <select
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full h-11 md:h-12 px-4 rounded-xl bg-[#f4f3f1] border border-[#e1bfb5] focus:border-[#ab3500] focus:ring-0 transition-all text-sm md:text-base outline-none appearance-none cursor-pointer"
                          required
                        >
                          <option value="" disabled>Select age group</option>
                          {AGE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-semibold text-[#594139] ml-1">
                        Gender
                      </label>
                      <div className="flex p-1 bg-[#efeeeb] rounded-xl max-w-[240px] md:max-w-[280px]">
                        <button
                          type="button"
                          onClick={() => setGender("male")}
                          className={`flex-1 h-9 md:h-10 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                            gender === "male"
                              ? "bg-white shadow-sm text-[#ab3500]"
                              : "text-[#594139] hover:text-[#ab3500]"
                          }`}
                        >
                          ♂ Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender("female")}
                          className={`flex-1 h-9 md:h-10 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                            gender === "female"
                              ? "bg-white shadow-sm text-[#ab3500]"
                              : "text-[#594139] hover:text-[#ab3500]"
                          }`}
                        >
                          ♀ Female
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* === Step 3: Personality === */}
                  <section className="space-y-5 md:space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#ff6b35] text-white flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                        3
                      </span>
                      <h2 className="text-lg md:text-xl font-bold text-[#1a1c1a]">Personality</h2>
                    </div>

                    <div className="flex flex-wrap gap-2 md:gap-2.5">
                      {TEMPERAMENTS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTemperament(t)}
                          className={`px-4 md:px-5 py-2 rounded-full border text-xs md:text-sm font-semibold transition-all ${
                            temperament === t
                              ? "bg-[#3e6658] text-white border-[#3e6658] shadow-sm"
                              : "bg-white text-[#594139] border-[#e1bfb5] hover:border-[#ab3500]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* === Step 4: Health & Safety === */}
                  <section className="space-y-5 md:space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#ff6b35] text-white flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                        4
                      </span>
                      <h2 className="text-lg md:text-xl font-bold text-[#1a1c1a]">Health &amp; Safety</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                      {/* Vaccinated */}
                      <label
                        className={`flex-1 flex items-center p-4 md:p-5 rounded-xl cursor-pointer transition-all ${
                          vaccinated
                            ? "border-2 border-[#ab3500] bg-[#ffdbd0]/20"
                            : "border border-[#e1bfb5] bg-white hover:border-[#ab3500]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={vaccinated}
                          onChange={(e) => setVaccinated(e.target.checked)}
                          className="w-5 h-5 md:w-6 md:h-6 rounded-md text-[#ab3500] focus:ring-[#ab3500] mr-3 md:mr-4 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs md:text-sm font-bold text-[#1a1c1a]">Fully Vaccinated</span>
                          <span className="text-[10px] md:text-xs text-[#594139]">Important for play dates</span>
                        </div>
                        <svg className="w-4 h-4 md:w-5 md:h-5 ml-auto text-[#ab3500] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </label>

                      {/* Neutered / Spayed */}
                      <label
                        className={`flex-1 flex items-center p-4 md:p-5 rounded-xl cursor-pointer transition-all ${
                          neutered
                            ? "border-2 border-[#ab3500] bg-[#ffdbd0]/20"
                            : "border border-[#e1bfb5] bg-white hover:border-[#ab3500]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={neutered}
                          onChange={(e) => setNeutered(e.target.checked)}
                          className="w-5 h-5 md:w-6 md:h-6 rounded-md text-[#ab3500] focus:ring-[#ab3500] mr-3 md:mr-4 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs md:text-sm font-bold text-[#1a1c1a]">Neutered / Spayed</span>
                          <span className="text-[10px] md:text-xs text-[#594139]">Standard medical status</span>
                        </div>
                        <svg className="w-4 h-4 md:w-5 md:h-5 ml-auto text-[#ab3500] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </label>
                    </div>
                  </section>

                  {/* Error */}
                  {error && (
                    <div className="bg-[#ffdad6] border border-[#ffb5b0] rounded-xl px-4 md:px-5 py-3 text-[#93000a] text-xs md:text-sm font-bold flex items-center gap-2">
                      <svg className="w-4 h-4 md:w-5 md:h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-2 md:pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 md:h-14 bg-[#ab3500] text-white rounded-xl font-bold text-base md:text-lg shadow-[0_4px_0_0_#832600] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 md:gap-3 group disabled:opacity-60 disabled:active:translate-y-0 disabled:shadow-[0_4px_0_0_#832600]"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <span>Register Companion</span>
                          <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] md:text-xs text-[#594139] mt-3 md:mt-4">
                      By registering, you agree to our{" "}
                      <Link href="/terms" className="text-[#ab3500] font-bold hover:underline">
                        Terms of Service
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
