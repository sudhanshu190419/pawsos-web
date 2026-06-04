"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Playdate, Pet } from "../hooks/usePlaydates";

// ─── Types & Constants ────────────────────────────────────────────────────────

type PetType = "dog" | "cat" | "bird" | "rabbit" | "all" | "other";

interface PetConfig {
  emoji: string;
  accent: string;
  label: string;
  bg: string;
  color: string;
  border: string;
}

const PET_CONFIG = {
  dog: {
    emoji: "🐕",
    accent: "#f59e0b",
    label: "Dogs",
    bg: "bg-orange-50",
    color: "text-orange-600",
    border: "border-orange-200",
  },

  cat: {
    emoji: "🐱",
    accent: "#8b5cf6",
    label: "Cats",
    bg: "bg-violet-50",
    color: "text-violet-600",
    border: "border-violet-200",
  },

  bird: {
    emoji: "🐦",
    accent: "#0ea5e9",
    label: "Birds",
    bg: "bg-sky-50",
    color: "text-sky-600",
    border: "border-sky-200",
  },

  rabbit: {
    emoji: "🐰",
    accent: "#ec4899",
    label: "Rabbits",
    bg: "bg-pink-50",
    color: "text-pink-600",
    border: "border-pink-200",
  },

  all: {
    emoji: "🐾",
    accent: "#f97316",
    label: "All Pets",
    bg: "bg-orange-50",
    color: "text-orange-600",
    border: "border-orange-200",
  },

  other: {
    emoji: "🐾",
    accent: "#64748b",
    label: "Pets",
    bg: "bg-slate-50",
    color: "text-slate-600",
    border: "border-slate-200",
  },
} as const satisfies Record<PetType, PetConfig>;

const FALLBACK_CONFIG = PET_CONFIG.other;

const MAX_VISIBLE_ATTENDEES = 4;

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatPlaydateDate(timestamp: unknown): string {
  if (!timestamp) return "TBD";

  const date =
    typeof (timestamp as { toDate?: () => Date }).toDate === "function"
      ? (timestamp as { toDate: () => Date }).toDate()
      : new Date(timestamp as string | number | Date);

  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / 86_400_000);

  const time = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffDays === 0) return `Today · ${time}`;
  if (diffDays === 1) return `Tomorrow · ${time}`;
  if (diffDays < 7)
    return `${date.toLocaleDateString("en-IN", { weekday: "short" })} · ${time}`;

  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${time}`;
}

function getPetConfig(type: string): PetConfig {
  return (PET_CONFIG as Record<string, PetConfig>)[type] ?? FALLBACK_CONFIG;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  src?: string | null;
  name: string;
  emoji?: string;
  size: number;
  className?: string;
}

const Avatar = memo<AvatarProps>(({ src, name, emoji = "🐾", size, className = "" }) =>
  src ? (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  ) : (
    <span
      className={`rounded-full bg-slate-100 flex items-center justify-center leading-none ${className}`}
      style={{ width: size, height: size, flexShrink: 0, fontSize: size * 0.5 }}
      aria-label={name}
    >
      {emoji}
    </span>
  )
);
Avatar.displayName = "Avatar";

// ─── Attendee Stack ───────────────────────────────────────────────────────────

interface AttendeeStackProps {
  pets: Pet[];
  total: number;
  max: number;
}

const AttendeeStack = memo<AttendeeStackProps>(({ pets, total, max }) => {
  const visible = pets.slice(0, MAX_VISIBLE_ATTENDEES);
  const extra = pets.length - MAX_VISIBLE_ATTENDEES;

  return (
    <div className="flex items-center gap-2">
      {visible.length > 0 ? (
        <div className="flex -space-x-1.5" role="list" aria-label="Attendee pets">
          {visible.map((pet) => (
            <div
              key={pet.id}
              role="listitem"
              className="rounded-full border-2 border-white overflow-hidden bg-slate-100 ring-0"
              style={{ width: 24, height: 24 }}
              title={pet.name}
            >
              <Avatar src={pet.photoURL} name={pet.name} emoji={getPetConfig(pet.type).emoji} size={24} />
            </div>
          ))}
          {extra > 0 && (
            <div
              className="rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500"
              style={{ width: 24, height: 24 }}
              aria-label={`${extra} more attendees`}
            >
              +{extra}
            </div>
          )}
        </div>
      ) : (
        <span className="text-[12px] text-slate-400">No attendees yet</span>
      )}
      <span className="text-[11px] text-slate-400 tabular-nums">
        {total}/{max}
      </span>
    </div>
  );
});
AttendeeStack.displayName = "AttendeeStack";

// ─── PlayDateCard ─────────────────────────────────────────────────────────────

interface PlayDateCardProps {
  playdate: Playdate;
  hostPet?: Pet | null;
  attendeePets?: Pet[];
}

const PlayDateCard = memo<PlayDateCardProps>(({ playdate, hostPet, attendeePets = [] }) => {
  const config = useMemo(() => getPetConfig(playdate.petType), [playdate.petType]);
  const formattedDate = useMemo(() => formatPlaydateDate(playdate.date), [playdate.date]);

  // Determine temperament/tag for the badge
  const badgeLabel = hostPet?.temperament || config.label;

  return (
    <Link
      href={`/playdate/${playdate.id}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-[2rem]"
    >
      <article className="card-3d-lift stagger-card relative h-full flex flex-col bg-white rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm border border-surface-container cursor-pointer active:scale-[0.98] transition-transform">

        {/* Image Section */}
        <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
          {playdate.photoURL ? (
            <Image
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              src={playdate.photoURL}
              alt={playdate.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : hostPet?.photoURL ? (
            <Image
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              src={hostPet.photoURL}
              alt={hostPet.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
              <span className="text-4xl md:text-6xl">{config.emoji}</span>
            </div>
          )}
          {/* Badge */}
          <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-white/90 backdrop-blur-md px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-sm">
            <span className="text-[#944a00] font-bold text-[9px] md:text-[10px] uppercase tracking-wider">
              {badgeLabel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-3 md:space-y-4 flex flex-col flex-1">

          {/* Row 1: Playdate Title + Location + Host Avatar */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm md:text-xl text-slate-900 leading-tight line-clamp-2">
                {hostPet?.name ? `${hostPet.name}, ${hostPet.age}` : playdate.title}
              </h3>
              <div className="flex items-center gap-1 text-on-surface-variant text-xs md:text-sm mt-0.5">
                <svg className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate">{playdate.locationName}</span>
              </div>
            </div>
            <div className="shrink-0 ml-2 md:ml-3">
              <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-orange-100">
                {playdate.creatorPhoto ? (
                  <Image
                    src={playdate.creatorPhoto}
                    alt={playdate.creatorName || "Host"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#944a00]">
                    {(playdate.creatorName || "H")[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Time + Spots */}
          <div className="flex items-center justify-between py-2 md:py-3 px-3 md:px-4 bg-slate-50/80 rounded-lg md:rounded-xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Time</span>
              <span className="text-xs md:text-sm font-bold text-slate-700">{formattedDate}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Spots</span>
              <AttendeeStack
                pets={attendeePets}
                total={playdate.attendeeCount}
                max={playdate.maxPets}
              />
            </div>
          </div>

          {/* Row 3: CTA Button (decorative span - parent Link handles navigation) */}
          <span className="w-full mt-auto py-2.5 md:py-3.5 bg-surface-container hover:bg-[#944a00] hover:text-white transition-all duration-300 rounded-lg md:rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 group/btn cursor-pointer">
            View Details
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 group-hover/btn:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
});

PlayDateCard.displayName = "PlayDateCard";

export default PlayDateCard;
export { PET_CONFIG as PET_TYPE_CONFIG, formatPlaydateDate };