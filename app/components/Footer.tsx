import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-12 md:pt-20 pb-8 md:pb-10">
      {/* Changed to grid-cols-2 on mobile. 
        Brand and Contact span both columns on mobile, while Explore and Join Us take 1 column each.
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 mb-12 md:mb-16">
        
        {/* BRAND & MISSION */}
        <div className="col-span-2">
          <Link href="/" className="inline-block mb-4 md:mb-6">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-orange-500">🐾</span> AnimalSathi
            </h3>
          </Link>
          <p className="text-slate-500 leading-relaxed max-w-sm pr-4 md:mb-8">
            A community-driven platform connecting compassionate people, dedicated volunteers, and verified vets to rescue and protect animals across India.
          </p>
        </div>

        {/* EXPLORE */}
        <div className="col-span-1">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 md:mb-6">
            Explore
          </h4>
          <ul className="space-y-3 md:space-y-4">
            <FooterLink href="/">Home</FooterLink>
            <FooterLink href="/about">About Us</FooterLink>
            <FooterLink href="/how-it-works">How It Works</FooterLink>
            <FooterLink href="/shop">Shop</FooterLink>
          </ul>
        </div>

        {/* JOIN US */}
        <div className="col-span-1">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 md:mb-6">
            Join Us
          </h4>
          <ul className="space-y-3 md:space-y-4">
            <FooterLink href="/volunteer-form">Volunteer</FooterLink>
            <FooterLink href="/onboarding">NGO Partner</FooterLink>
            <FooterLink href="/vets">Register as Vet</FooterLink>
            <FooterLink href="/investors">
              Investors <span className="text-[10px] md:text-xs bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full ml-1 whitespace-nowrap">New</span>
            </FooterLink>
          </ul>
        </div>

        {/* CONTACT & APP */}
        <div className="col-span-2">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 md:mb-6">
            Get in Touch
          </h4>
          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
            <a href="mailto:animalsathi.app@gmail.com" className="text-slate-500 hover:text-orange-600 transition-colors flex items-center gap-2 group break-all">
              <span className="text-xl group-hover:scale-110 transition-transform">✉️</span>
              animalsathi.app@gmail.com
            </a>
            <p className="text-slate-500 flex items-center gap-2">
              <span className="text-xl">📍</span>
              Operating across India
            </p>
          </div>

          <p className="text-sm font-semibold text-slate-800 mb-3">
            #BeAnAnimalSathi
          </p>
          
          {/* App Download Button */}
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-sm w-fit"
          >
             <span className="text-2xl">📱</span>
             <div className="text-left">
               <p className="text-[10px] text-slate-300 uppercase leading-none mb-1">Get it on</p>
               <p className="text-sm font-semibold leading-none">Google Play</p>
             </div>
          </a>
        </div>
      </div>

      {/* BOTTOM LEGAL BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-200 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-slate-500 text-center md:text-left">
          © {new Date().getFullYear()} AnimalSathi. All rights reserved.
        </div>
        
        {/* Added flex-wrap and justify-center so links wrap nicely on mobile screens */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-slate-900 transition-colors">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link 
        href={href} 
        className="text-slate-500 hover:text-orange-600 transition-all duration-300 hover:translate-x-1 inline-block"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({ href, icon }: { href: string; icon: string }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm hover:shadow-md font-bold text-sm shrink-0"
    >
      {icon}
    </a>
  );
}