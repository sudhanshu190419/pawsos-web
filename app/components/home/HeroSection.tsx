"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Crosshair,
  HeartHandshake,
  Navigation,
  Play,
  Radio,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";

const rescueSteps = [
  {
    title: "SOS reported",
    note: "2 min ago",
    icon: Siren,
    tone: "text-[#ff5a24] bg-[#fff2ec] border-[#ffd8c8]",
  },
  {
    title: "Volunteer alerted",
    note: "K7 team nearby",
    icon: Bell,
    tone: "text-[#d48600] bg-[#fff8e8] border-[#f8dfaa]",
  },
  {
    title: "NGO support active",
    note: "ETA: 12 min",
    icon: ShieldCheck,
    tone: "text-[#12976e] bg-[#edf9f4] border-[#c9efe2]",
  },
];

const mapPins = [
  { top: "27%", left: "35%", label: "V1", color: "bg-[#16a37a]" },
  { top: "46%", left: "55%", label: "SOS", color: "bg-[#ff4f25]" },
  { top: "62%", left: "30%", label: "NGO", color: "bg-[#d99418]" },
  { top: "70%", left: "73%", label: "V2", color: "bg-[#16a37a]" },
];

const proofPoints = [
  "Completely free",
  "SOS alerts within 7 KM",
  "No experience needed",
  "Accept or skip anytime",
];

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#fff8f0] text-[#151d19]">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-[0.16] sm:w-[72%]"
          style={{ backgroundImage: "url('/hero-rescue.png')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#fff8f0_0%,rgba(255,248,240,0.96)_37%,rgba(255,248,240,0.76)_100%)]" />
        <div className="absolute inset-0 opacity-[0.32] bg-[radial-gradient(circle_at_18%_20%,rgba(41,151,114,0.22),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(255,90,36,0.18),transparent_27%)]" />
        <div className="absolute inset-0 opacity-[0.13] bg-[linear-gradient(to_right,#9fb7aa_1px,transparent_1px),linear-gradient(to_bottom,#9fb7aa_1px,transparent_1px)] bg-[size:58px_58px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-10 pt-10 sm:px-6 md:pt-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-8 lg:pb-12">
        <div className="max-w-xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#ffd8c8] bg-white/78 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#ff5a24] shadow-[0_18px_45px_-30px_rgba(156,62,35,0.55)] backdrop-blur">
            <CircleDot className="h-3.5 w-3.5" />
            Join India&apos;s rescue network
          </div>

          <h1 className="max-w-[12ch] text-5xl font-black leading-[0.95] tracking-[-0.03em] text-[#151d19] sm:text-6xl lg:text-7xl">
            Help animals near you in real time.
          </h1>

          <p className="mt-6 max-w-[58ch] text-base font-semibold leading-8 text-[#58655f] sm:text-lg">
            Receive emergency animal rescue alerts within approximately 7 km of your location. Accept a case, coordinate with NGOs and veterinarians, and help save lives in your community.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {proofPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm font-bold text-[#33413b]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ffd8c8] bg-white/82 text-[#ff5a24] shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                {point}
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/volunteer-form"
              className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-[#ff5a24] px-6 text-sm font-extrabold text-white shadow-[0_20px_38px_-20px_rgba(255,90,36,0.82)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff6b35] active:scale-[0.98]"
            >
              Become a Volunteer
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl border border-[#e8ddd2] bg-white/78 px-6 text-sm font-extrabold text-[#1f2924] shadow-[0_18px_40px_-30px_rgba(35,28,22,0.5)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4eee8] text-[#1f2924]">
                <Play className="h-3.5 w-3.5 fill-current" />
              </span>
              See How It Works
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-[#f4cdbb]/38 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/82 shadow-[0_34px_90px_-46px_rgba(53,38,28,0.62)] backdrop-blur-xl">
            <div className="grid min-h-[520px] lg:grid-cols-[190px_1fr]">
              <aside className="border-b border-[#eadfd5] bg-white/88 p-4 lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-2 text-sm font-black text-[#18221d]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a24] text-white">
                    <HeartHandshake className="h-5 w-5" />
                  </span>
                  AnimalSathi
                </div>

                <div className="mt-6 rounded-2xl border border-[#d8eee5] bg-[#f7fffb] p-3">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#dcf7ed] text-[#12976e]">
                      <span className="absolute h-3 w-3 animate-ping rounded-full bg-[#39c894]/45" />
                      <Radio className="relative h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-[#17211c]">You&apos;re online</p>
                      <p className="text-[10px] font-semibold text-[#69756f]">Ready to help animals</p>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#7b8b83]">Active rescue</p>
                <div className="mt-3 space-y-3">
                  {rescueSteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className={`rounded-2xl border p-3 ${step.tone}`}>
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/72">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-[11px] font-black text-[#1d2722]">{step.title}</p>
                            <p className="text-[10px] font-bold text-[#75817a]">{step.note}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className="mt-4 w-full rounded-xl border border-[#e8ddd2] bg-white py-3 text-[11px] font-black text-[#1f2924] transition hover:bg-[#fff8f0]">
                  View all rescues
                </button>
              </aside>

              <div className="relative min-h-[420px] overflow-hidden bg-[#f3f5ef]">
                <div className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-[#e0d8cf] bg-white/88 px-3 py-2 text-[11px] font-black text-[#1f2924] shadow-sm backdrop-blur">
                  Bengaluru
                  <ChevronDown className="h-3.5 w-3.5 text-[#718078]" />
                </div>

                <div className="absolute inset-0 opacity-90">
                  <div className="absolute inset-0 bg-[linear-gradient(28deg,transparent_0_19%,rgba(126,148,136,0.22)_20%,transparent_21%_43%,rgba(126,148,136,0.18)_44%,transparent_45%_100%),linear-gradient(118deg,transparent_0_24%,rgba(126,148,136,0.2)_25%,transparent_26%_66%,rgba(126,148,136,0.16)_67%,transparent_68%_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,112,55,0.13),transparent_31%),linear-gradient(to_right,rgba(63,82,72,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,82,72,0.08)_1px,transparent_1px)] bg-[size:auto,70px_70px,70px_70px]" />
                </div>

                <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ff7a45]/35 bg-[#ff6b35]/8" />
                <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#2f8df6]/12">
                  <span className="h-5 w-5 rounded-full border-4 border-white bg-[#2f8df6] shadow-[0_0_0_12px_rgba(47,141,246,0.14)]" />
                </div>
                <div className="absolute left-[57%] top-[51%] rounded-full bg-white/88 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#1f2924] shadow-sm">
                  7 km radius
                </div>

                {mapPins.map((pin) => (
                  <div
                    key={pin.label}
                    className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                    style={{ top: pin.top, left: pin.left }}
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-white ${pin.color} text-[10px] font-black text-white shadow-xl`}>
                      {pin.label}
                    </span>
                  </div>
                ))}

                <div className="absolute right-5 top-9 z-20 w-[250px] rounded-3xl border border-[#eadfd5] bg-white/92 p-4 shadow-2xl backdrop-blur-md max-sm:hidden">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff2ec] text-[#ff5a24]">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-[#1f2924]">New SOS alert</p>
                        <span className="text-[10px] font-bold text-[#7f8a84]">2 min ago</span>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold leading-5 text-[#65716b]">
                        Injured dog near MG Road, unable to move.
                      </p>
                      <p className="mt-2 text-[10px] font-black text-[#ff5a24]">1.2 km away - urgent</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className="rounded-xl border border-[#eadfd5] bg-[#f8f3ee] py-2 text-[11px] font-black text-[#28322d]">Skip</button>
                    <button className="rounded-xl bg-[#ff5a24] py-2 text-[11px] font-black text-white">Accept</button>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-20 grid gap-3 border-t border-[#eadfd5] bg-white/90 p-4 backdrop-blur-md sm:grid-cols-3">
                  <MapConsoleFooter icon={Users} title="Assigned NGO" detail="People For Animals - ETA 15 min" />
                  <MapConsoleFooter icon={Navigation} title="Rescue in progress" detail="Team en route to location" />
                  <MapConsoleFooter icon={Bell} title="Live updates" detail="We will notify you" />
                </div>

                <div className="absolute bottom-28 right-5 z-20 overflow-hidden rounded-2xl border border-[#eadfd5] bg-white/88 shadow-xl backdrop-blur">
                  <button className="flex h-10 w-10 items-center justify-center border-b border-[#eadfd5] text-[#1f2924]">+</button>
                  <button className="flex h-10 w-10 items-center justify-center border-b border-[#eadfd5] text-[#1f2924]">-</button>
                  <button className="flex h-10 w-10 items-center justify-center text-[#1f2924]">
                    <Crosshair className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MapConsoleFooter({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf9f4] text-[#12976e]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-black text-[#1f2924]">{title}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-[#75817a]">{detail}</p>
      </div>
    </div>
  );
}
