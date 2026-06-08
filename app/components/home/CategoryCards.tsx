"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, HeartPulse, ShoppingBag, Users } from "lucide-react";

const cards = [
  {
    title: "SOS Alerts",
    subtitle: "Report an injured animal and notify nearby helpers instantly.",
    meta: "Real-time rescue",
    icon: AlertCircle,
    href: "/report",
    tone: "text-[#ff5a24] bg-[#fff2ec] border-[#ffd8c8]",
  },
  {
    title: "Nearby Vets",
    subtitle: "Find clinics and medical support during urgent rescue cases.",
    meta: "Within 10 km",
    icon: HeartPulse,
    href: "/vets_detail",
    tone: "text-[#12976e] bg-[#edf9f4] border-[#c9efe2]",
  },
  {
    title: "Volunteers",
    subtitle: "Join a coordinated local network for animal rescue response.",
    meta: "Active responders",
    icon: Users,
    href: "/volunteer-form",
    tone: "text-[#d48600] bg-[#fff8e8] border-[#f8dfaa]",
  },
  {
    title: "Pet Shop",
    subtitle: "Access food, medicines, and essentials for ongoing care.",
    meta: "Delivered support",
    icon: ShoppingBag,
    href: "/shop",
    tone: "text-[#2f70c9] bg-[#edf5ff] border-[#cfe2ff]",
  },
];

export default function CategoryCards() {
  return (
    <section className="relative overflow-hidden bg-[#fff8f0] px-4 pb-14 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#eadfd5] to-transparent" />
      <div className="relative mx-auto grid max-w-7xl gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group relative min-h-[132px] overflow-hidden rounded-2xl border border-white/80 bg-white/84 p-5 shadow-[0_24px_70px_-48px_rgba(53,38,28,0.75)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#ffd8c8] hover:bg-white active:scale-[0.99]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(255,90,36,0.11),transparent_34%)] opacity-0 transition duration-300 group-hover:opacity-100" />
              <div className="relative flex h-full items-start gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7b8b83]">
                        {card.meta}
                      </p>
                      <h2 className="mt-2 text-lg font-black tracking-tight text-[#151d19]">
                        {card.title}
                      </h2>
                    </div>
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#eadfd5] bg-[#fff8f0] text-[#ff5a24] transition duration-300 group-hover:translate-x-1 group-hover:bg-[#ff5a24] group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#65716b]">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
