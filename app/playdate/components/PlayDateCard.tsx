"use client";

import Link from "next/link";
import { Playdate, Pet } from "../hooks/usePlaydates";

const PET_TYPE_CONFIG: Record<
  string,
  { emoji: string; color: string; bg: string; border: string; dot: string }
> = {
  dog: {
    emoji: "🐕",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "#f59e0b",
  },
  cat: {
    emoji: "🐱",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "#8b5cf6",
  },
  bird: {
    emoji: "🐦",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    dot: "#0ea5e9",
  },
  rabbit: {
    emoji: "🐰",
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    dot: "#ec4899",
  },
  all: {
    emoji: "🐾",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "#f97316",
  },
  other: {
    emoji: "🐾",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "#64748b",
  },
};

function formatPlaydateDate(timestamp: any): string {
  if (!timestamp) return "TBD";
  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (days === 0) return `Today, ${timeStr}`;
  if (days === 1) return `Tomorrow, ${timeStr}`;
  if (days < 7) {
    const dayName = date.toLocaleDateString("en-IN", { weekday: "short" });
    return `${dayName}, ${timeStr}`;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  }) + `, ${timeStr}`;
}

interface PlayDateCardProps {
  playdate: Playdate;
  hostPet?: Pet | null;
  attendeePets?: Pet[];
}

export default function PlayDateCard({
  playdate,
  hostPet,
  attendeePets = [],
}: PlayDateCardProps) {
  const config = PET_TYPE_CONFIG[playdate.petType] || PET_TYPE_CONFIG.all;
  const isFull = playdate.attendeeCount >= playdate.maxPets;
  const spotsLeft = playdate.maxPets - playdate.attendeeCount;

  return (
    <Link href={`/playdate/${playdate.id}`} className="group block h-full">
      <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-white pet-card-glow border border-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col">
        {/* Top gradient strip */}
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${config.dot}, ${config.dot}88)`,
          }}
        />

        <div className="p-5 sm:p-6 flex flex-col flex-1">
          {/* Top row: Type badge + spots */}
          <div className="flex items-center justify-between mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.color} ${config.border} border`}
            >
              <span className="text-sm">{config.emoji}</span>
              {playdate.petType === "all"
                ? "All Pets"
                : playdate.petType.charAt(0).toUpperCase() +
                  playdate.petType.slice(1) +
                  "s"}
            </span>

            {isFull ? (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">
                Full
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
                {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg text-slate-800 mb-1.5 leading-tight tracking-tight group-hover:text-orange-600 transition-colors line-clamp-2">
            {playdate.title}
          </h3>

          {/* Description preview */}
          {playdate.description && (
            <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
              {playdate.description}
            </p>
          )}

          {/* Host Pet info */}
          {hostPet && (
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 mb-4 border border-slate-100">
              {hostPet.photoURL ? (
                <img
                  src={hostPet.photoURL}
                  alt={hostPet.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-lg">
                  {PET_TYPE_CONFIG[hostPet.type]?.emoji || "🐾"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {hostPet.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {hostPet.breed} · {hostPet.age}
                </p>
              </div>
              <span className="ml-auto text-[10px] font-black text-orange-500 uppercase">
                Host
              </span>
            </div>
          )}

          {/* Meta: Date + Location */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-base">📅</span>
              <span className="font-semibold">
                {formatPlaydateDate(playdate.date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="text-base">📍</span>
              <span className="truncate">{playdate.locationName}</span>
            </div>
          </div>

          {/* Footer: Attendee pets + CTA */}
          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
            {/* Attendee pet avatars */}
            <div className="flex items-center gap-2">
              {attendeePets.length > 0 ? (
                <div className="flex -space-x-2">
                  {attendeePets.slice(0, 4).map((pet) => (
                    <div
                      key={pet.id}
                      className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-slate-100"
                      title={pet.name}
                    >
                      {pet.photoURL ? (
                        <img
                          src={pet.photoURL}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">
                          {PET_TYPE_CONFIG[pet.type]?.emoji || "🐾"}
                        </div>
                      )}
                    </div>
                  ))}
                  {attendeePets.length > 4 && (
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      +{attendeePets.length - 4}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  No attendees yet
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-bold">
                {playdate.attendeeCount}/{playdate.maxPets}
              </span>
            </div>

            {/* Arrow indicator */}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-900 text-white shadow-md opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <svg
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export { PET_TYPE_CONFIG, formatPlaydateDate };
