import Link from "next/link";
import { Sparkles, Search, Lock, MapPin } from "lucide-react";
import Reveal from "../Reveal";

export default function PlayDatePromo() {
  return (
    <Reveal>
      <section className="px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto bg-[#FFF8F4] rounded-3xl sm:rounded-[32px] p-5 sm:p-10 md:p-20 relative overflow-hidden border border-orange-100/20 shadow-sm">
          {/* Decorative paws */}
          <div className="pointer-events-none absolute top-8 sm:top-12 right-8 sm:right-12 text-5xl sm:text-6xl opacity-[0.12] rotate-12">
            🐾
          </div>
          <div className="pointer-events-none absolute bottom-8 sm:bottom-12 left-8 sm:left-12 text-5xl sm:text-6xl opacity-[0.12] -rotate-12">
            🐾
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-16 relative z-10">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-orange-100/30 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
                  New Feature
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-extrabold text-slate-900 leading-tight tracking-tight">
                Find a{" "}
                <span className="relative inline-block text-orange-500">
                  Play Date
                  <span className="absolute -bottom-1 left-0 right-0 h-[4px] bg-orange-400/30 rounded-full" />
                </span>{" "}
                for your pet
              </h2>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-[540px] mx-auto lg:mx-0">
                Let your furry friend make new friends! Browse nearby play dates,
                meet other pets based on their personality — and keep your
                identity private.
              </p>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                <span className="inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-slate-100/20 text-xs font-semibold text-slate-600 shadow-sm">
                  <Lock className="w-3.5 h-3.5 text-orange-500" />
                  Privacy First
                </span>
                <span className="inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-slate-100/20 text-xs font-semibold text-slate-600 shadow-sm">
                  <span className="text-sm">🐾</span>
                  Pet Profiles Only
                </span>
                <span className="inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-slate-100/20 text-xs font-semibold text-slate-600 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  Location-Based
                </span>
              </div>

              {/* CTA */}
              <Link
                href="/playdate"
                className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-white font-bold rounded-xl shadow-[0px_12px_24px_-8px_rgba(249,115,22,0.5)] hover:shadow-[0px_16px_32px_-8px_rgba(249,115,22,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 mt-4"
              >
                <Search className="w-5 h-5" />
                Explore Play Dates
              </Link>
            </div>

            {/* Glassmorphism Pet Card */}
            <div className="flex-1 relative w-full max-w-[500px] flex justify-center items-center py-8 lg:py-0">
              {/* Stacked cards for depth */}
              <div className="absolute w-[90%] h-[320px] bg-white/40 rounded-[24px] rotate-2 translate-y-4 shadow-sm border border-white/50" />
              <div className="absolute w-[95%] h-[330px] bg-white/60 rounded-[28px] -rotate-1 translate-y-2 shadow-md border border-white/60" />

              {/* Main card */}
              <div className="relative z-20 w-full bg-white/70 backdrop-blur-[12px] p-6 sm:p-8 rounded-[32px] shadow-2xl border border-white/80 space-y-5">
                {/* Pet header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-inner border-2 border-white shrink-0">
                      <img
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLX6VsQ7g7oX0sy_rh6mepN3owKoO3Toowmv3k8sZxRN2gCYGwvlAwG2vbpCIwcovUaUoDf9khYJNvEKQfGNkgDXguWi2pFUFClLRTg9Jxc7N3aAWB20HdJp1VQZqiFHy9vGaD1d-pBRC62hgFsotq8avhwmOjkwRUilKsAzqcacOnAS2X0IckF5RxikV58EbfS_GUb0CZ8Dz7EyuYOixDHS-M-wZyDw1Oup0fHj3rZ787ppmPePnW5nK0lW1uxPBN083sLq3nhMg"
                        alt="Bruno the Golden Retriever"
                      />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-800">
                        Bruno
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        Golden Retriever • 2 years
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-100">
                    Friendly
                  </span>
                </div>

                {/* Event card */}
                <div className="p-4 sm:p-5 bg-slate-100/70 rounded-2xl border border-slate-200/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-slate-700 flex items-center gap-2">
                      Sunday Park Walk 🌳
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Tomorrow, 8:00 AM • Lodi Garden
                  </p>
                </div>

                {/* Attendees */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex -space-x-3 overflow-hidden">
                    <div className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white overflow-hidden bg-orange-100">
                      <img
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWwbi2zAgLqHVm0-x1JExphiBXR8IvL4UNaVxDu8YDG9OyLoUZpDW7TR0EB-LHrPFyX4dJ7VjAlBqE4MepAOM2CCRAFwUuqAo_FmtxCEV9DlwiDDfo6Vey_Dprz82eK4ayS_jxfnTdNuZxLkw9Sv4uRlBea7au5tXDkrDypjMPMqFAHbM77W6FaqPb2c9C79oic9aRDfvNH7QYS9ThjGXl9BQR_ISNBQL3Qskh4QmssxLEK-pGVK9ZffF4Ii-XH-7auZGuF65sYIk"
                        alt="Attendee 1"
                      />
                    </div>
                    <div className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white overflow-hidden bg-amber-100">
                      <img
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDFycNJ-LlWsBTMEnaHtg-6opvaj7dAz9kfq1PDxdPCVdYv6NTCclsPtq8L5_7DmcUC1GhAZVjBmQO9zZzdBzAMMXwhZ6u-cpBUSF5sNshkmZwd1mzoD--CtFarmYOllGOi0esr7v-FvH44qd_8o6ioXojHg48hrRwAj9_cbL3qK_WUchRSDeVO1ZgXQEmhw1PDK2Cp8GAXxz1-A6R20ZCSfr7fwlqUBbiL9yiy-FiOTyk1ZviC-xfR2C_TA61g6u78j1E3cg7B4U"
                        alt="Attendee 2"
                      />
                    </div>
                    <div className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white overflow-hidden bg-pink-100">
                      <img
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhThno3duv-dec6yrQkvRDzP3UWj_lMMw7Xm2W0CfUbu_qn5IlCmDwqXexWYgu1eRFNNpNHQEt4WrCmt2rBLDlQJ9a5mRHNUlB0VX5Xgnq9KxU0kOKozgSjACf80l0CdV8gjP5aJursJ6_fh8VS_11vw_2neoKw-ntJIPvnQOc4A37uEun2Bp0f9LN-bfg_AkCA4QqEIQQKLxQUkRfzivFZ8k5_87dfxN8DKmHlN7312tIOYBM9t__6T59km8ErRLUccvsKwqIPBU"
                        alt="Attendee 3"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">
                    3/10 pets joined
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
