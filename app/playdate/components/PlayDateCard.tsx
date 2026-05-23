"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { Playdate, Pet } from "../hooks/usePlaydates";

// ─── Types & Constants ────────────────────────────────────────────────────────

type PetType = "dog" | "cat" | "bird" | "rabbit" | "all" | "other";

interface PetConfig {
  emoji: string;
  accent: string;
  label: string;
}

const PET_CONFIG = {
  dog:    { emoji: "🐕", accent: "#f59e0b", label: "Dogs" },
  cat:    { emoji: "🐱", accent: "#8b5cf6", label: "Cats" },
  bird:   { emoji: "🐦", accent: "#0ea5e9", label: "Birds" },
  rabbit: { emoji: "🐰", accent: "#ec4899", label: "Rabbits" },
  all:    { emoji: "🐾", accent: "#f97316", label: "All Pets" },
  other:  { emoji: "🐾", accent: "#64748b", label: "Pets" },
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
    <img
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

  const spotsLeft = playdate.maxPets - playdate.attendeeCount;
  const isFull = spotsLeft <= 0;

  return (
    <Link
      href={`/playdate/${playdate.id}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-2xl"
    >
      <article className="relative h-full flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all duration-200 group-hover:border-slate-200 group-hover:shadow-lg group-hover:-translate-y-px">

        {/* Accent strip */}
        <div
          className="h-[3px] w-full flex-shrink-0"
          style={{ backgroundColor: config.accent }}
          aria-hidden="true"
        />

        <div className="flex flex-col flex-1 p-5 gap-4">

          {/* Row 1: Type pill + Availability */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100">
              <span aria-hidden="true">{config.emoji}</span>
              {config.label}
            </span>

            <span
              className={[
                "inline-block px-2.5 py-1 rounded-full text-[11px] font-bold leading-none border",
                isFull
                  ? "bg-red-50 text-red-500 border-red-100"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100",
              ].join(" ")}
            >
              {isFull ? "Full" : `${spotsLeft} left`}
            </span>
          </div>

          {/* Row 2: Title + Description */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-[15px] leading-snug text-slate-900 line-clamp-2 transition-colors group-hover:text-orange-600">
              {playdate.title}
            </h3>
            {playdate.description && (
              <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">
                {playdate.description}
              </p>
            )}
          </div>

          {/* Row 3: Host pet */}
          {hostPet && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
              <Avatar
                src={hostPet.photoURL}
                name={hostPet.name}
                emoji={getPetConfig(hostPet.type).emoji}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-800 truncate">
                  {hostPet.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {hostPet.breed} · {hostPet.age}
                </p>
              </div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-wide">
                Host
              </span>
            </div>
          )}

          {/* Row 4: Date + Location */}
          <dl className="space-y-1.5">
            <div className="flex items-center gap-2 text-[13px]">
              <dt className="sr-only">Date</dt>
              <span aria-hidden="true" className="text-slate-400 leading-none">📅</span>
              <dd className="font-medium text-slate-700">{formattedDate}</dd>
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <dt className="sr-only">Location</dt>
              <span aria-hidden="true" className="text-slate-400 leading-none">📍</span>
              <dd className="text-slate-500 truncate">{playdate.locationName}</dd>
            </div>
          </dl>

          {/* Row 5: Footer — attendees + arrow */}
          <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
            <AttendeeStack
              pets={attendeePets}
              total={playdate.attendeeCount}
              max={playdate.maxPets}
            />

            <div
              className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
              aria-hidden="true"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

        </div>
      </article>
    </Link>
  );
});

PlayDateCard.displayName = "PlayDateCard";

export default PlayDateCard;
export { PET_CONFIG as PET_TYPE_CONFIG, formatPlaydateDate };