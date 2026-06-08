"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Mail, MapPin, Sparkles } from "lucide-react";
import { FaInstagram, FaFacebook, FaLinkedin, FaXTwitter } from "react-icons/fa6";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com/animal.sathi",
    icon: <FaInstagram className="w-4 h-4" />,
  },
  {
    label: "Twitter",
    href: "https://twitter.com/animalsathi",
    icon: <FaXTwitter className="w-4 h-4" />,
  },
  {
    label: "Facebook",
    href: "https://facebook.com/animalsathi",
    icon: <FaFacebook className="w-4 h-4" />,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/animalsathi",
    icon: <FaLinkedin className="w-4 h-4" />,
  },
];

const EXPLORE_LINKS = [
  { text: "Home", href: "/" },
  { text: "About Us", href: "/about" },
  { text: "How It Works", href: "/how-it-works" },
  { text: "Shop", href: "/shop" },
];

const JOIN_LINKS = [
  { text: "Volunteer", href: "/volunteer-form" },
  { text: "NGO Partner", href: "/onboarding" },
  { text: "Register as Vet", href: "/vets" },
  { text: "Investors", href: "/investors", badge: "New" },
];

const LEGAL_LINKS = [
  { text: "Privacy Policy", href: "/privacy" },
  { text: "Terms of Service", href: "/terms" },
  { text: "Cookie Policy", href: "/cookies" },
];

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/auth") return null;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname.replace(/\/$/, "") === href.replace(/\/$/, "")) {
      e.preventDefault();
      router.push(href);
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 50);
    }
  };

  return (
    <footer className="relative bg-[#fffcf9] border-t border-[#ffd8c8]/40 text-[#1C1614] font-sans py-14">
      {/* Dynamic top divider line */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff5a24]/20 to-transparent"
      />

      <div className="max-w-7xl mx-auto px-6">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          
          {/* Column 1: Brand Logo, Quote & Socials */}
          <div className="flex flex-col items-start space-y-4">
            <Link
              href="/"
              onClick={(e) => handleLinkClick(e, "/")}
              className="hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            >
              <Image
                src="/logo.png"
                alt="AnimalSathi Logo"
                width={140}
                height={46}
                className="h-8 w-auto object-contain"
              />
            </Link>
            
            {/* Editorial Quote block - adds brand character */}
            <p className="text-xs font-serif italic text-stone-500 leading-relaxed max-w-xs border-l-2 border-[#ff5a24]/30 pl-3">
              "Until one has loved an animal, a part of one's soul remains unawakened."
            </p>
            
            {/* Social Icons with subtle springs */}
            <div className="flex items-center gap-2 pt-2">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#1C1614]/10 bg-white hover:border-[#ff5a24]/50 hover:bg-[#ff5a24]/5 hover:-translate-y-0.5 text-[#58655f] hover:text-[#ff5a24] flex items-center justify-center transition-all duration-300"
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Explore */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff5a24]">
              Explore
            </h4>
            <ul className="space-y-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="group inline-flex items-center gap-0.5 text-xs text-[#58655f] hover:text-[#ff5a24] transition-all duration-200 hover:translate-x-0.5"
                  >
                    <span>{link.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Join Us */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff5a24]">
              Join Us
            </h4>
            <ul className="space-y-3">
              {JOIN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="group inline-flex items-center gap-1.5 text-xs text-[#58655f] hover:text-[#ff5a24] transition-all duration-200 hover:translate-x-0.5"
                  >
                    <span>{link.text}</span>
                    {link.badge && (
                      <span className="text-[7px] font-extrabold tracking-wider uppercase bg-[#ff5a24]/10 text-[#ff5a24] px-1.5 py-0.5 rounded leading-none">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & App Download */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff5a24]">
              Contact & App
            </h4>
            
            {/* Contact details with Node status indicator */}
            <div className="space-y-3 text-xs text-[#58655f]">
              <a
                href="mailto:info@animalsathi.com"
                className="flex items-center gap-2 hover:text-[#ff5a24] transition-colors duration-200"
              >
                <Mail className="w-3.5 h-3.5 text-[#ff5a24] shrink-0" />
                <span className="break-all">info@animalsathi.com</span>
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#ff5a24] mt-0.5 shrink-0" />
                <span className="leading-relaxed text-[11px]">
                  GL Bajaj Institute, Greater Noida, UP 201306
                </span>
              </div>
              
              {/* Telemetry dispatcher indicator - adds character */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#edf9f4] border border-[#c9efe2] text-[8px] font-bold text-[#12976e] w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12976e] animate-pulse" />
                Dispatch Node Online
              </div>
            </div>

            {/* Enlarged QR Code widget */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              {/* Google Play store badge */}
              <a
                href="https://play.google.com/store/apps/details?id=com.pawsos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#1C1614]/10 bg-white hover:bg-orange-50/30 hover:border-[#ff5a24]/30 text-[#1C1614] transition-all duration-300 active:scale-[0.98] shadow-sm w-fit"
              >
                <svg viewBox="0 0 24 24" fill="#ff5a24" className="w-4 h-4 shrink-0">
                  <path d="M3.18 23.76a2 2 0 01-.93-.89V1.13A2 2 0 013.18.24l.1-.06 12.77 11.76v.12L3.28 23.82l-.1-.06zM17.34 15.22l-3.14-2.9 3.14-2.9 3.55 2.01a1.03 1.03 0 010 1.79l-3.55 2zM3.28.18L14.2 10.6 10.7 14 3.28.18zm10.92 13.62l-9.92 9.02L14.2 13.4l-.01.4z" />
                </svg>
                <div className="text-left">
                  <p className="text-[7px] uppercase tracking-wider text-stone-500 font-bold leading-none">Get it on</p>
                  <p className="text-[9px] font-bold mt-0.5 leading-none">Play Store</p>
                </div>
              </a>

              {/* Styled QR Code Box - Enlarged as requested */}
              <div className="flex items-center gap-2.5 bg-white border border-[#1C1614]/10 rounded-xl p-1.5 pr-3 shadow-sm w-fit">
                <div className="p-1 rounded bg-white shrink-0 border border-[#1C1614]/5">
                  <img
                    src="/qr-code.png"
                    alt="Scan"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="text-left">
                  <p className="text-[7px] uppercase tracking-wider text-stone-400 font-bold leading-none">App Link</p>
                  <p className="text-[9px] font-bold text-[#1C1614] mt-0.5 leading-none">Scan to Get</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom row: Copyright & Legal */}
        <div className="mt-12 pt-6 border-t border-[#ffd8c8]/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#58655f]">
          <p className="flex items-center gap-1.5">
            © {new Date().getFullYear()} AnimalSathi · Crafted with{" "}
            <Heart className="w-3.5 h-3.5 text-[#ff5a24] fill-[#ff5a24]" /> for animals.
          </p>
          <nav aria-label="Legal" className="flex gap-4 sm:gap-6">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={(e) => handleLinkClick(e, l.href)}
                className="hover:text-[#ff5a24] transition-colors duration-200"
              >
                {l.text}
              </Link>
            ))}
          </nav>
        </div>

      </div>
    </footer>
  );
}