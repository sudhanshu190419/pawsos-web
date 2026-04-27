"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Controls whether the mobile menu is open or closed
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();

  const loadFirebaseAuth = async () => {
    const firebase = await import("../lib/firebase");
    return firebase.auth;
  };
  const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setScrolled(window.scrollY > 10);
  };
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser({
        displayName: parsed.name,
        email: parsed.email,
        photoURL: parsed.photo,
      } as any);

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const initAuth = async () => {
      const authInstance = await loadFirebaseAuth();

      unsub = onAuthStateChanged(authInstance, (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          localStorage.setItem("user", JSON.stringify({
            name: currentUser.displayName,
            email: currentUser.email,
            photo: currentUser.photoURL,
          }));
        } else {
          localStorage.removeItem("user");
        }
        setLoading(false);
      });
    };

    setTimeout(() => {
      initAuth();
    }, 1000);

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleLogout = async () => {
    const authInstance = await loadFirebaseAuth();
    await signOut(authInstance);

    setUser(null);
    setIsMobileMenuOpen(false);
    router.refresh();
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-300
${scrolled ? "bg-white/80 shadow-md" : "bg-white/60"}
`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        
        {/* LOGO */}
        <Link
          href="/"
          className="hover:scale-105 transition-transform flex items-center"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Image 
            src="/logo.png" 
            alt="AnimalSathi Logo" 
            width={180} 
            height={60} 
            priority={true}
            className="h-10 md:h-14 w-auto object-contain" 
          />
        </Link>

        {/* CENTER NAV LINKS (DESKTOP ONLY) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
          <Link href="/" prefetch={false} className="relative group text-slate-600

after:absolute after:left-0 after:-bottom-1 
after:h-[2px] after:w-0 
after:bg-blue-600 
after:transition-all after:duration-300 
group-hover:after:w-full transition-colors">Home</Link>

          <Link href="/how-it-works" prefetch={false} className="relative group text-slate-600

after:absolute after:left-0 after:-bottom-1 
after:h-[2px] after:w-0 
after:bg-blue-600 
after:transition-all after:duration-300 
group-hover:after:w-full transition-colors">How It Works</Link>

          {/* JOIN US DROPDOWN */}
          <div className="relative group transition-all duration-300">
            <span className="cursor-pointer relative group text-slate-600

after:absolute after:left-0 after:-bottom-1 
after:h-[2px] after:w-0 
after:bg-blue-600 
after:transition-all after:duration-300 
group-hover:after:w-full py-2 transition-colors flex items-center gap-1">
              Join Us
              <svg className="w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:rotate-180"fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 
opacity-0 translate-y-3 scale-95 
group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 
transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
pointer-events-none group-hover:pointer-events-auto">
              <div className="bg-white border border-slate-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)]
backdrop-blur-sm w-56 py-3 flex flex-col">
                <Link href={user ? "/volunteer-form" : "/auth"} prefetch={false} className="px-4 py-3 text-sm flex items-start gap-3 rounded-lg
hover:bg-orange-50 transition-all group hover:bg-slate-100 hover:text-slate-900 font-semibold text-slate-700 transition-colors"><span className="mr-2 text-base">🦸‍♂️</span> Become a Volunteer</Link>
                <Link href="/onboarding" prefetch={false} className="px-4 py-3 text-sm flex items-start gap-3 rounded-lg
hover:bg-orange-50 transition-all group hover:bg-slate-100 hover:text-slate-900 font-semibold text-slate-700 transition-colors"><span className="mr-2 text-base">🏢</span> NGO Partnerships</Link>
                <Link href="/vets" prefetch={false} className="px-4 py-3 text-sm flex items-start gap-3 rounded-lg
hover:bg-orange-50 transition-all group hover:bg-slate-100 hover:text-slate-900 font-semibold text-slate-700 transition-colors"><span className="mr-2 text-base">🏥</span> Register as a Vet</Link>
              </div>
            </div>
          </div>

          {/* ABOUT US DROPDOWN */}
          <div className="relative group transition-all duration-300">
            <span className="cursor-pointer relative group text-slate-600

after:absolute after:left-0 after:-bottom-1 
after:h-[2px] after:w-0 
after:bg-blue-600 
after:transition-all after:duration-300 
group-hover:after:w-full py-2 transition-colors flex items-center gap-1">
              About Us
              <svg 
  className="w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:rotate-180"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
</svg>
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 
opacity-0 translate-y-3 scale-95 
group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 
transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
pointer-events-none group-hover:pointer-events-auto">
              <div className="bg-white border border-slate-200 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)]
backdrop-blur-sm w-48 py-3 flex flex-col">
                <Link href="/about" className="px-4 py-3 flex items-start gap-3 rounded-lg hover:bg-orange-50 transition-all group">
  <span className="text-lg group-hover:scale-110 transition">📖</span>
  <div>
    <p className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Our Story</p>
    <p className="text-xs text-slate-500">How AnimalSathi started</p>
  </div>
</Link>

<Link href="/investors" className="px-4 py-3 flex items-start gap-3 rounded-lg hover:bg-orange-50 transition-all group">
  <span className="text-lg group-hover:scale-110 transition">💼</span>
  <div>
    <p className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Investors</p>
    <p className="text-xs text-slate-500">Funding & growth details</p>
  </div>
</Link>

<Link href="/contact" className="px-4 py-3 flex items-start gap-3 rounded-lg hover:bg-orange-50 transition-all group">
  <span className="text-lg group-hover:scale-110 transition">✉️</span>
  <div>
    <p className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Contact Us</p>
    <p className="text-xs text-slate-500">Reach out to our team</p>
  </div>
</Link>
              </div>
            </div>
          </div>

          <Link href="/shop" prefetch={false} className="relative group text-slate-600

after:absolute after:left-0 after:-bottom-1 
after:h-[2px] after:w-0 
after:bg-blue-600 
after:transition-all after:duration-300 
group-hover:after:w-full transition-colors">Shop</Link>
        </nav>

        {/* RIGHT SIDE: PROFILE, APP CTA, & MOBILE MENU BUTTON */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {!loading && user ? (
            <>
              {/* DESKTOP PROFILE MENU (Hidden on Mobile) */}
              <div className="hidden md:block relative group">
                <img
                  src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c"}
                  alt="User Profile"
                  className="w-11 h-11 rounded-full cursor-pointer border-2 border-slate-100 hover:scale-105 hover:ring-2 hover:ring-blue-500/30 transition-all duration-200 transition-colors object-cover shadow-sm"
                />
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 
opacity-0 translate-y-3 scale-95 
group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 
transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
pointer-events-none group-hover:pointer-events-auto">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-lg
backdrop-blur-sm w-60 flex flex-col overflow-hidden">
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || "Animal Lover"}</p>
                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-2 flex flex-col">
                      <Link href="/dashboard?tab=profile" prefetch={false} className="px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-3"><span className="text-lg">👤</span> My Profile</Link>
                      <Link href="/dashboard?tab=reports" prefetch={false} className="px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-3"><span className="text-lg">📋</span> My SOS Reports</Link>
                      <Link href="/dashboard?tab=settings" prefetch={false} className="px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-3"><span className="text-lg">⚙️</span> Settings</Link>
                    </div>
                    <div className="py-2 border-t border-slate-100 bg-white">
                      <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"><span className="text-lg">🚪</span> Sign Out</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOBILE AVATAR (Triggers Hamburger Menu) */}
              <img
                src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c"}
                alt="User Profile"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-9 h-9 rounded-full cursor-pointer border-2 border-slate-100 object-cover shadow-sm"
              />
            </>
          ) : (
            /* SIGN IN BUTTON */
            <Link href="/auth" className="text-slate-600 px-3 md:px-4 py-2 rounded-full text-sm font-bold relative group text-slate-600

after:absolute after:left-0 after:-bottom-1 
after:h-[2px] after:w-0 
after:bg-blue-600 
after:transition-all after:duration-300 
group-hover:after:w-full transition-colors">
              Log In
            </Link>
          )}

          {/* GET APP BUTTON (Hidden on very small screens to save space) */}
          <Link
            href="/download"
            prefetch={false}
            className="hidden sm:flex items-center gap-2
bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold
shadow-lg shadow-orange-500/25
hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30
transition-all duration-200 shimmer-btn"
          >
            Get the App
          </Link>

          {/* MOBILE HAMBURGER BUTTON */}
          <button 
            className="md:hidden text-slate-800 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-2xl flex flex-col py-4 px-6 animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          
          {/* USER ACCOUNT SECTION (Visible only if logged in) */}
          {user && (
            <div className="py-4 border-b border-slate-100 bg-slate-50/50 -mx-6 px-6 mb-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c"}
                  alt="User Profile"
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">{user.displayName || "Animal Lover"}</p>
                  <p className="text-xs font-medium text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/dashboard?tab=profile" className="py-2.5 text-sm font-semibold text-slate-600 flex items-center gap-2">👤 My Profile</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/dashboard?tab=reports" className="py-2.5 text-sm font-semibold text-slate-600 flex items-center gap-2">📋 My SOS Reports</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/dashboard?tab=settings" className="py-2.5 text-sm font-semibold text-slate-600 flex items-center gap-2">⚙️ Settings</Link>
                <button onClick={handleLogout} className="text-left py-2.5 text-sm font-bold text-red-600 flex items-center gap-2 mt-1">🚪 Sign Out</button>
              </div>
            </div>
          )}

          <Link onClick={() => setIsMobileMenuOpen(false)} href="/" className="py-3 text-base font-bold text-slate-800 border-b border-slate-50">🏠 Home</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} href="/how-it-works" className="py-3 text-base font-bold text-slate-800 border-b border-slate-50">How It Works</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} href="/shop" className="py-3 text-base font-bold text-slate-800 border-b border-slate-50">Shop Marketplace</Link>
          
          {/* Mobile Join Us Section */}
          <div className="py-3 border-b border-slate-50">
            <p className="text-xs font-black text-orange-500 uppercase tracking-wider mb-2">Join Us</p>
            <div className="flex flex-col gap-2 pl-2">
              <Link onClick={() => setIsMobileMenuOpen(false)} href={user ? "/volunteer-form" : "/auth"} prefetch={false} className="py-2 text-sm font-semibold text-slate-600 flex items-center gap-2">🦸‍♂️ Become a Volunteer</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/onboarding" prefetch={false} className="py-2 text-sm font-semibold text-slate-600 flex items-center gap-2">🏢 NGO Partnerships</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/vets" prefetch={false} className="py-2 text-sm font-semibold text-slate-600 flex items-center gap-2">🏥 Register as a Vet</Link>
            </div>
          </div>

          {/* Mobile About Us Section */}
          <div className="py-3 border-b border-slate-50">
            <p className="text-xs font-black text-orange-500 uppercase tracking-wider mb-2">About Us</p>
            <div className="flex flex-col gap-2 pl-2">
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/about" prefetch={false} className="py-2 text-sm font-semibold text-slate-600 flex items-center gap-2">📖 Our Story</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/investors" prefetch={false} className="py-2 text-sm font-semibold text-slate-600 flex items-center gap-2">💼 Investors</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} prefetch={false} href="/contact" className="py-2 text-sm font-semibold text-slate-600 flex items-center gap-2">✉️ Contact Us</Link>
            </div>
          </div>

          {/* Mobile App Button */}
          <Link
            onClick={() => setIsMobileMenuOpen(false)}
            href="/download"
            prefetch={false}
            className="sm:hidden mt-6 bg-orange-600 text-white text-center py-3.5 rounded-2xl font-bold shadow-md"
          >
            Download the App
          </Link>
        </div>
      )}
    </header>
  );
}