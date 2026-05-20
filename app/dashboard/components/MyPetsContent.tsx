"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "firebase/auth";
import { useUserPets, Pet, PetType } from "../../playdate/hooks/usePlaydates";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const PET_TYPE_EMOJI: Record<string, string> = {
  dog: "🐕",
  cat: "🐱",
  bird: "🐦",
  rabbit: "🐰",
  other: "🐾",
};

interface MyPetsContentProps {
  user: User;
}

export default function MyPetsContent({ user }: MyPetsContentProps) {
  const { pets, loading } = useUserPets(user);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (petId: string) => {
    if (!confirm("Are you sure you want to remove this pet?")) return;
    setDeletingId(petId);
    try {
      await deleteDoc(doc(db, "pets", petId));
    } catch (err) {
      console.error("Failed to delete pet:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800">
            My Pets
          </h3>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your registered pets and add new ones.
          </p>
        </div>
        <Link
          href="/pets/register"
          className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-md shadow-orange-200 flex items-center gap-1.5 whitespace-nowrap"
        >
          <span className="text-base">+</span> Add Pet
        </Link>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 animate-paw-bounce inline-block">
            🐾
          </div>
          <h4 className="text-xl font-extrabold text-slate-800 mb-2">
            No pets registered yet
          </h4>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm">
            Register your pet to unlock Play Dates and connect with other
            pet parents in your area.
          </p>
          <Link
            href="/pets/register"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
          >
            🐾 Register Your First Pet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onDelete={() => handleDelete(pet.id)}
              isDeleting={deletingId === pet.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PetCard({
  pet,
  onDelete,
  isDeleting,
}: {
  pet: Pet;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const emoji = PET_TYPE_EMOJI[pet.type] || "🐾";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex gap-4">
      {/* Avatar */}
      {pet.photoURL ? (
        <img
          src={pet.photoURL}
          alt={pet.name}
          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0 border border-orange-100">
          {emoji}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-slate-800 truncate">{pet.name}</h4>
          <span className="text-sm">{emoji}</span>
          {pet.vaccinated && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
              Vaccinated
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-1.5">
          {pet.breed} · {pet.age} · {pet.gender === "male" ? "♂ Male" : "♀ Female"}
        </p>
        <p className="text-xs text-slate-500">
          <span className="font-semibold">Temperament:</span>{" "}
          {pet.temperament}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          title="Remove pet"
        >
          {isDeleting ? "..." : "✕"}
        </button>
      </div>
    </div>
  );
}
