import Reveal from "../Reveal";

const STEPS = [
  {
    icon: "emergency",
    step: "01",
    title: "Spot an animal in need",
    description: "See a stray animal that's injured, stuck, or in danger? Open AnimalSathi and tap Report.",
  },
  {
    icon: "add_alert",
    step: "02",
    title: "File an SOS report",
    description: "Share the location, a quick photo, and what kind of help is needed. Takes under a minute.",
  },
  {
    icon: "notifications_active",
    step: "03",
    title: "Nearby volunteers are notified",
    description: "Verified volunteers and rescue teams within your area receive the alert instantly.",
  },
  {
    icon: "local_hospital",
    step: "04",
    title: "NGOs and vets coordinate",
    description: "Partner organizations and veterinarians step in for medical care and safe shelter.",
  },
  {
    icon: "check_circle",
    step: "05",
    title: "Animal rescued",
    description: "The animal gets the help it needs. You can track the status right from your dashboard.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative bg-[#FEF4E8] py-20 md:py-28 lg:py-36 overflow-hidden">
      {/* Decorative subtle background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(156,62,35,0.04),transparent_40%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
          
          {/* Left Column: Pinned Heading on Desktop */}
          <div className="lg:sticky lg:top-32 mb-16 lg:mb-0">
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-4 block">
                Simple & transparent
              </span>
            </Reveal>
            <Reveal>
              <h2 className="font-display italic text-4xl md:text-5xl lg:text-6xl text-[#1a1c1c] leading-[1.1] max-w-[15ch]">
                How rescue works
              </h2>
            </Reveal>
            <Reveal>
              <p className="text-slate-600 text-base md:text-lg font-sans mt-6 max-w-[40ch] leading-relaxed">
                A community-backed response clicks into action the moment you report an emergency. 
                Here is the journey from rescue to recovery.
              </p>
            </Reveal>
          </div>

          {/* Right Column: Steps List */}
          <div className="flex flex-col">
            {STEPS.map((step, index) => {
              const isLast = index === STEPS.length - 1;
              return (
                <div key={index}>
                  <Reveal>
                    <div className={`py-8 md:py-10 flex gap-6 md:gap-8 items-start ${!isLast ? "border-b border-[#1c1614]/10" : ""}`}>
                      {/* Step Number & Icon */}
                      <div className="flex flex-col items-center gap-3">
                        <span className="font-mono text-sm font-bold text-primary tracking-wider">
                          {step.step}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl">
                            {step.icon}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#1a1c1c] font-sans">
                          {step.title}
                        </h3>
                        <p className="text-slate-600 text-base font-sans leading-relaxed mt-2 max-w-[50ch]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}