import Link from "next/link";
import { Heart, Users, TrendingUp, ArrowRight, IndianRupee } from "lucide-react";
import Reveal from "../Reveal";

const CAMPAIGNS = [
  {
    title: "Emergency Treatment for Luna",
    description: "Help fund surgery for a stray cat found with a severe eye infection.",
    raised: 12500,
    goal: 20000,
    donors: 89,
    daysLeft: 3,
    image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=600",
    urgent: true,
  },
  {
    title: "Street Dog Vaccination Drive",
    description: "Fund a mass vaccination campaign for 200+ street dogs in Bangalore.",
    raised: 45000,
    goal: 60000,
    donors: 234,
    daysLeft: 12,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=600",
    urgent: false,
  },
  {
    title: "Winter Shelter for Strays",
    description: "Build warm shelters for 50 stray animals during the harsh Delhi winter.",
    raised: 78000,
    goal: 100000,
    donors: 456,
    daysLeft: 20,
    image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?auto=format&fit=crop&q=80&w=600",
    urgent: false,
  },
];

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

export default function DonationSection() {
  return (
    <section className="relative py-14 sm:py-20 md:py-28 overflow-hidden bg-gradient-to-b from-slate-50/50 to-white">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-10 sm:mb-14 md:mb-20">
            <span className="inline-block text-orange-600 font-bold tracking-widest uppercase text-xs bg-orange-100 px-3 py-1 rounded-full mb-4">
              Make a Difference
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Fund a{" "}
              <span className="text-orange-500">Rescue</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              100% transparent donations. Every rupee goes directly to animal
              treatment, shelter, and rehabilitation.
            </p>
          </div>
        </Reveal>

        {/* Campaign cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {CAMPAIGNS.map((c) => {
            const percent = Math.min(100, Math.round((c.raised / c.goal) * 100));
            return (
              <Reveal key={c.title}>
                <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {c.urgent && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Urgent
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-lg text-[11px] font-semibold shadow-sm">
                      {c.daysLeft} days left
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-5 line-clamp-2">
                      {c.description}
                    </p>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-extrabold text-orange-500">
                          {formatCurrency(c.raised)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          of {formatCurrency(c.goal)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${percent}% funded`}>
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">
                          {c.donors} donors
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">
                        {percent}% funded
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Trust + CTA */}
        <Reveal>
          <div className="text-center space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-orange-500" />
                <span>100% Transparent</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Tax Deductible (80G)</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Real-time Updates</span>
              </div>
            </div>
            <Link
              href="/report"
              className="group inline-flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg shadow-orange-500/25 hover:bg-orange-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
            >
              <Heart className="w-5 h-5" />
              Donate Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
