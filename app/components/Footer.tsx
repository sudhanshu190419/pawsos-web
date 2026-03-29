import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
        
        {/* BRAND & MISSION (Takes up 2 columns on large screens) */}
        <div className="lg:col-span-2">
          <Link href="/" className="inline-block mb-6">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-orange-500">🐾</span> AnimalSathi
            </h3>
          </Link>
          <p className="text-slate-500 leading-relaxed mb-8 max-w-sm pr-4">
            A community-driven platform connecting compassionate people, dedicated volunteers, and verified vets to rescue and protect animals across India.
          </p>
          
         
        </div>

        {/* EXPLORE */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
            Explore
          </h4>
          <ul className="space-y-4">
            <FooterLink href="/">Home</FooterLink>
            <FooterLink href="/about">About Us</FooterLink>
            <FooterLink href="/how-it-works">How It Works</FooterLink>
            <FooterLink href="/shop">Shop</FooterLink>
          </ul>
        </div>

        {/* JOIN US */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
            Join Us
          </h4>
          <ul className="space-y-4">
            <FooterLink href="/volunteer-form">Volunteer</FooterLink>
            <FooterLink href="/onboarding">NGO Partner</FooterLink>
            <FooterLink href="/vets">Register as Vet</FooterLink>
            <FooterLink href="/investors">Investors <span className="text-xs bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full ml-1">New</span></FooterLink>
          </ul>
        </div>

        {/* CONTACT & APP (Takes up 2 columns on large screens) */}
        <div className="lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
            Get in Touch
          </h4>
          <div className="space-y-4 mb-8">
            <a href="mailto:animalsathi.app@gmail.com" className="text-slate-500 hover:text-orange-600 transition-colors flex items-center gap-2 group">
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
            className="inline-flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
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
      <div className="max-w-7xl mx-auto px-6 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-slate-500">
          © {new Date().getFullYear()} AnimalSathi. All rights reserved.
        </div>
        
        <div className="flex items-center gap-6 text-sm text-slate-500">
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
      className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm hover:shadow-md font-bold text-sm"
    >
      {icon}
    </a>
  );
}