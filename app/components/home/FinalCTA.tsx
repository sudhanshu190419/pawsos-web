import Link from "next/link";
import Reveal from "../Reveal";

export default function FinalCTA() {
  return (
    <section className="relative py-20 md:py-28 lg:py-36 bg-[#FEF4E8] overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(156,62,35,0.04),transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 text-center">
        <Reveal>
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            
            {/* Heading */}
            <h2 className="font-display italic text-4xl md:text-5xl lg:text-6xl text-[#1a1c1c] leading-[1.1]">
              Ready to make a difference?
            </h2>

            {/* Subtitle */}
            <p className="text-slate-600 text-base md:text-lg font-sans mt-6 max-w-[50ch] mx-auto leading-relaxed">
              Every report, every rescue, and every life saved starts with someone who cares. 
              Join India's community-first network for stray animal rescue today.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 mt-10 w-full sm:w-auto">
              
              {/* Primary CTA: Report SOS */}
              <Link
                href="/report"
                className="bg-primary text-on-primary font-bold text-base rounded-2xl py-4 px-8 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-primary/25 inline-flex items-center justify-center gap-2 group"
              >
                <span>Report an SOS</span>
                <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>

              {/* Secondary CTA: Download App */}
              <a
                href="https://play.google.com/store/apps/details?id=com.animalsathi.app"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#1C1614]/20 text-[#1C1614] hover:bg-[#1C1614]/5 font-bold text-base rounded-2xl py-4 px-8 active:scale-[0.98] transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">
                  download
                </span>
                <span>Download the app</span>
              </a>

            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}
