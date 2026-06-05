import Link from "next/link";
import {
  Building2,
  Stethoscope,
  Hospital,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Reveal from "../Reveal";

const PARTNERS = [
  {
    icon: Building2,
    title: "Join as an NGO",
    description:
      "Register your animal welfare organization and access our rescue coordination tools, volunteer network, and funding resources.",
    features: [
      "Rescue coordination dashboard",
      "Access to volunteer network",
      "Fundraising support",
      "Impact analytics & reporting",
    ],
    cta: "Apply as NGO",
    href: "/onboarding",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    accentBg: "bg-blue-600",
  },
  {
    icon: Stethoscope,
    title: "Register as a Vet",
    description:
      "Join our veterinary network and provide consultations, emergency triage, and ongoing care for rescued animals.",
    features: [
      "Teleconsultation tools",
      "Emergency case alerts",
      "Professional networking",
      "Verified vet badge",
    ],
    cta: "Register as Vet",
    href: "/vets",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    accentBg: "bg-emerald-600",
  },
  {
    icon: Hospital,
    title: "Hospital Onboarding",
    description:
      "Partner your veterinary hospital with AnimalSathi for referral management, patient tracking, and community visibility.",
    features: [
      "Patient referral pipeline",
      "Online appointment booking",
      "Hospital visibility profile",
      "Analytics & insights",
    ],
    cta: "Onboard Hospital",
    href: "/onboarding/organization",
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
    accentBg: "bg-violet-600",
  },
];

export default function PartnershipSection() {
  return (
    <section className="relative py-14 sm:py-20 md:py-28 overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-10 sm:mb-14 md:mb-20">
            <span className="inline-block text-orange-600 font-bold tracking-widest uppercase text-xs bg-orange-100 px-3 py-1 rounded-full mb-4">
              Partner With Us
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Grow Your Impact{" "}
              <span className="text-orange-500">With Us</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Whether you&apos;re an NGO, a veterinarian, or a hospital —
              there&apos;s a place for you in the AnimalSathi ecosystem.
            </p>
          </div>
        </Reveal>

        {/* Partner cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PARTNERS.map((p) => (
            <Reveal key={p.title}>
              <div className="group bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl ${p.bg} flex items-center justify-center border ${p.border} mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <p.icon className={`w-6 h-6 ${p.color}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {p.description}
                </p>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-grow">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 ${p.color} shrink-0`}
                      />
                      <span className="text-sm text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={p.href}
                  className={`group/btn inline-flex items-center justify-center gap-2 ${p.accentBg} text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200`}
                >
                  {p.cta}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
