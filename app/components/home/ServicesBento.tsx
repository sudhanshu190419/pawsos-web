"use client";

import Link from "next/link";
import Image from "next/image";
import Reveal from "../Reveal";

export default function ServicesBento() {
  return (
    <section className="relative bg-[#FDF8F3] py-10 md:py-14 lg:py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-6 md:mb-8">
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#9c3e23] font-semibold mb-2.5 block">
              Our Ecosystem
            </span>
          </Reveal>
          <Reveal>
            <h2 className="font-display italic text-2xl md:text-3xl lg:text-4xl text-[#1C1614] leading-[1.2]">
              Everything your pet needs
            </h2>
          </Reveal>
          <Reveal>
            <p className="text-slate-500 text-xs sm:text-sm font-sans mt-2 max-w-[50ch] leading-relaxed">
              From emergency rescue to daily vet consultations and social play dates, 
              we connect you with the entire ecosystem of pet care.
            </p>
          </Reveal>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-6">
          
          {/* Card 1: SOS Emergency (Wide Card - span 2 cols on lg) */}
          <Link
            href="/report"
            className="lg:col-span-2 bg-white rounded-[1.5rem] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[210px] group border border-[#1C1614]/5 shadow-sm hover:shadow-[0_8px_25px_rgba(156,62,35,0.05)] hover:-translate-y-0.5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            {/* Bottom Right Framed Image */}
            <div className="absolute right-0 bottom-0 w-[33%] h-[75%] overflow-hidden rounded-tl-[1.25rem] border-l border-t border-slate-100 bg-slate-50 z-0">
              <Image
                src="/hero-rescue.png"
                alt="Emergency rescue"
                fill
                sizes="(max-w-768px) 100vw, 20vw"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
            </div>

            {/* Text Content */}
            <div className="relative z-10 max-w-[64%]">
              <span className="material-symbols-outlined text-primary text-xl mb-2 bg-primary/10 w-9 h-9 rounded-lg flex items-center justify-center">
                emergency
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#1C1614] font-sans group-hover:text-primary transition-colors leading-snug">
                Emergency SOS
              </h3>
              <p className="text-slate-500 text-xs font-sans mt-1 leading-relaxed max-w-[32ch]">
                Report injured, sick, or stranded animals in your neighborhood. Nearby volunteers are notified in real-time.
              </p>
            </div>

            <div className="relative z-10 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 group-hover:bg-primary group-hover:text-white py-1.5 px-3 rounded-lg transition-all duration-300">
                <span>Report now</span>
                <span className="material-symbols-outlined text-xs font-bold group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </span>
            </div>
          </Link>

          {/* Card 2: Vet Appointments */}
          <Link
            href="/vet-appointments"
            className="bg-white rounded-[1.5rem] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[210px] group border border-[#1C1614]/5 shadow-sm hover:shadow-[0_8px_25px_rgba(156,62,35,0.05)] hover:-translate-y-0.5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            {/* Bottom Right Framed Image */}
            <div className="absolute right-0 bottom-0 w-[36%] h-[52%] overflow-hidden rounded-tl-[1.25rem] border-l border-t border-slate-100 bg-slate-50 z-0">
              <Image
                src="/vet-care.png"
                alt="Veterinary care"
                fill
                sizes="(max-w-768px) 100vw, 15vw"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
            </div>

            {/* Text Content */}
            <div className="relative z-10 max-w-[62%]">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-base font-semibold">
                  medical_services
                </span>
              </div>
              <h3 className="text-base font-bold text-[#1C1614] font-sans group-hover:text-primary transition-colors leading-snug">
                Vet appointments
              </h3>
              <p className="text-slate-500 text-xs font-sans mt-1 leading-relaxed">
                Book verified veterinarians near you for consultations and clinic visits.
              </p>
            </div>

            <div className="relative z-10 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary group-hover:text-primary transition-colors">
                <span>Book now</span>
                <span className="material-symbols-outlined text-xs font-bold group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </span>
            </div>
          </Link>

          {/* Card 3: Play Dates */}
          <Link
            href="/playdate"
            className="bg-white rounded-[1.5rem] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[210px] group border border-[#1C1614]/5 shadow-sm hover:shadow-[0_8px_25px_rgba(156,62,35,0.05)] hover:-translate-y-0.5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            {/* Bottom Right Framed Image */}
            <div className="absolute right-0 bottom-0 w-[36%] h-[52%] overflow-hidden rounded-tl-[1.25rem] border-l border-t border-slate-100 bg-slate-50 z-0">
              <Image
                src="/playdate-dogs.png"
                alt="Play dates"
                fill
                sizes="(max-w-768px) 100vw, 15vw"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
            </div>

            {/* Text Content */}
            <div className="relative z-10 max-w-[62%]">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-base font-semibold">
                  pets
                </span>
              </div>
              <h3 className="text-base font-bold text-[#1C1614] font-sans group-hover:text-primary transition-colors leading-snug">
                Play dates
              </h3>
              <p className="text-slate-500 text-xs font-sans mt-1 leading-relaxed">
                Find local pet parents and schedule play sessions in pet parks.
              </p>
            </div>

            <div className="relative z-10 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 group-hover:text-primary transition-colors">
                <span>Find buddies</span>
                <span className="material-symbols-outlined text-xs font-bold group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </span>
            </div>
          </Link>

          {/* Card 4: Pet Shop */}
          <Link
            href="/shop"
            className="bg-white rounded-[1.5rem] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[210px] group border border-[#1C1614]/5 shadow-sm hover:shadow-[0_8px_25px_rgba(156,62,35,0.05)] hover:-translate-y-0.5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            {/* Bottom Right Framed Image */}
            <div className="absolute right-0 bottom-0 w-[36%] h-[52%] overflow-hidden rounded-tl-[1.25rem] border-l border-t border-slate-100 bg-slate-50 z-0">
              <Image
                src="/pet-shop.png"
                alt="Pet shop products"
                fill
                sizes="(max-w-768px) 100vw, 15vw"
                className="object-contain object-right-bottom group-hover:scale-103 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
            </div>
            
            {/* Soft gradient mask overlay over the image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/95 to-transparent pointer-events-none z-10" />

            {/* Text Content */}
            <div className="relative z-10 max-w-[62%]">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-base font-semibold">
                  shopping_bag
                </span>
              </div>
              <h3 className="text-base font-bold text-[#1C1614] font-sans group-hover:text-primary transition-colors leading-snug">
                Pet shop
              </h3>
              <p className="text-slate-500 text-xs font-sans mt-1 leading-relaxed">
                Curated organic pet food, medicine, and accessories sourced locally.
              </p>
            </div>

            <div className="relative z-10 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:text-primary transition-colors">
                <span>Shop items</span>
                <span className="material-symbols-outlined text-xs font-bold group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </span>
            </div>
          </Link>

          {/* Card 5: Volunteer Card */}
          <Link
            href="/volunteer-form"
            className="bg-white rounded-[1.5rem] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[210px] group border border-[#1C1614]/5 shadow-sm hover:shadow-[0_8px_25px_rgba(156,62,35,0.05)] hover:-translate-y-0.5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            {/* Bottom Right Framed Image */}
            <div className="absolute right-0 bottom-0 w-[36%] h-[52%] overflow-hidden rounded-tl-[1.25rem] border-l border-t border-slate-100 bg-slate-50 z-0">
              <Image
                src="/volunteer.png"
                alt="Volunteer community"
                fill
                sizes="(max-w-768px) 100vw, 15vw"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
            </div>

            {/* Text Content */}
            <div className="relative z-10 max-w-[62%]">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-base font-semibold">
                  volunteer_activism
                </span>
              </div>
              <h3 className="text-base font-bold text-[#1C1614] font-sans group-hover:text-primary transition-colors leading-snug">
                Volunteer
              </h3>
              <p className="text-slate-500 text-xs font-sans mt-1 leading-relaxed">
                Be a first responder, get verified, and save neighborhood animals.
              </p>
            </div>

            <div className="relative z-10 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C1614] group-hover:text-primary transition-colors">
                <span>Sign up</span>
                <span className="material-symbols-outlined text-xs font-bold group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </span>
            </div>
          </Link>

        </div>

      </div>
    </section>
  );
}
