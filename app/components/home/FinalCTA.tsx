import Link from "next/link";
import {
  AlertCircle,
  Users,
  Download,
  ArrowRight,
  Heart,
  Shield,
  Zap,
} from "lucide-react";
import Reveal from "../Reveal";

export default function FinalCTA() {
  return (
    <section className="relative py-14 sm:py-24 md:py-32 overflow-hidden bg-white border-t border-slate-100">
      {/* Ambient blurs */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100 rounded-full blur-[100px] -ml-48 -mb-48" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Community badge */}
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2 rounded-full mb-8 shadow-sm">
              <div className="flex -space-x-2">
                {["R", "S", "P", "A", "M"].map((l, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-orange-600"
                  >
                    {l}
                  </div>
                ))}
              </div>
              <span className="text-orange-600 font-bold text-xs sm:text-sm uppercase tracking-wider ml-1">
                Join 10,000+ Animal Lovers
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
              Ready to Make an{" "}
              <span className="text-orange-500">Impact?</span>
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
              Compassion becomes powerful when communities work together. Help us
              build India&apos;s strongest animal rescue network today.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-8">
              <Link
                href="/report"
                className="group bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                <AlertCircle className="w-5 h-5" />
                Report an SOS
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/volunteer-form"
                className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-white hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                <Users className="w-5 h-5 text-slate-400" />
                Become a Volunteer
              </Link>
            </div>

            {/* Secondary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-10">
              <a
                href="https://play.google.com/store/apps/details?id=com.pawsos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Download the App
              </a>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 px-6 py-3.5 rounded-xl hover:bg-slate-50 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                Join as an NGO Partner
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>100% Verified Network</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Real-time Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Free & Open to All</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
