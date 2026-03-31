"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";


export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 🔥 NEW STATE: Controls whether the mobile menu is open or closed
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setIsMobileMenuOpen(false); // Close menu on logout
    router.refresh();
  };

  return (
    <header className="w-full sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-orange-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        
        {/* LOGO */}
        {/* LOGO */}
        <Link
          href="/"
          className="hover:scale-105 transition-transform flex items-center ml-14 md:ml-0"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* 🔥 NEW: Optimized Next.js Image Component */}
          <Image 
            src="/logo.png" 
            alt="AnimalSathi Logo" 
            width={180} 
            height={60} 
            priority={true} // Tells Vercel: "Load this instantly!"
            className="h-10 md:h-14 w-auto object-contain" 
          />
        </Link>

        {/* CENTER NAV LINKS (DESKTOP ONLY) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
          <Link href="/how-it-works" prefetch={false} className="hover:text-orange-600 transition-colors">How It Works</Link>

          {/* JOIN US DROPDOWN */}
          <div className="relative group">
            <span className="cursor-pointer hover:text-orange-600 py-2 transition-colors flex items-center gap-1">
              Join Us
              <svg className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-56 py-3 flex flex-col">
                <Link href={user ? "/volunteer-form" : "/auth"} prefetch={false} className="px-5 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-600 font-semibold text-slate-700 transition-colors"><span className="mr-2 text-base">🦸‍♂️</span> Become a Volunteer</Link>
                <Link href="/onboarding" className="px-5 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-600 font-semibold text-slate-700 transition-colors"><span className="mr-2 text-base">🏢</span> NGO Partnerships</Link>
                <Link href="/vets" prefetch={false} className="px-5 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-600 font-semibold text-slate-700 transition-colors"><span className="mr-2 text-base">🏥</span> Register as a Vet</Link>
              </div>
            </div>
          </div>

          {/* ABOUT US DROPDOWN */}
          <div className="relative group">
            <span className="cursor-pointer hover:text-orange-600 py-2 transition-colors flex items-center gap-1">
              About Us
              <svg className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-48 py-3 flex flex-col">
                <Link href="/about" prefetch={false} className="px-5 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-600 font-semibold text-slate-700 transition-colors"><span className="mr-2 text-base">📖</span> Our Story</Link>
                <Link href="/investors" prefetch={false} className="px-5 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-600 font-semibold text-slate-700 transition-colors"><span className="mr-2 text-base">💼</span> Investors</Link>
                <Link href="/contact" className="px-5 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-600 font-semibold text-slate-700 transition-colors"><span className="mr-2 text-base">✉️</span> Contact Us</Link>
              </div>
            </div>
          </div>

          <Link href="/shop" prefetch={false} className="hover:text-orange-600 transition-colors">Shop</Link>
        </nav>

        {/* RIGHT SIDE: PROFILE, APP CTA, & MOBILE MENU BUTTON */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {!loading && user ? (
            /* PROFILE MENU (Desktop & Mobile) */
            <div className="relative group">
              <img
                src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c"}
                alt="User Profile"
                className="w-10 h-10 md:w-11 md:h-11 rounded-full cursor-pointer border-2 border-slate-100 hover:border-orange-300 transition-colors object-cover shadow-sm"
              />
              <div className="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-60 flex flex-col overflow-hidden">
                  <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || "Animal Lover"}</p>
                    <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="py-2 flex flex-col">
                    <Link href="/dashboard?tab=profile" className="px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3"><span className="text-lg">👤</span> My Profile</Link>
                    <Link href="/dashboard?tab=reports" className="px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3"><span className="text-lg">📋</span> My SOS Reports</Link>
                    <Link href="/dashboard?tab=settings" className="px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3"><span className="text-lg">⚙️</span> Settings</Link>
                  </div>
                  <div className="py-2 border-t border-slate-100 bg-white">
                    <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"><span className="text-lg">🚪</span> Sign Out</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SIGN IN BUTTON */
            <Link href="/auth" className="text-slate-600 px-3 md:px-4 py-2 rounded-full text-sm font-bold hover:text-orange-600 transition-colors">
              Log In
            </Link>
          )}

          {/* GET APP BUTTON (Hidden on very small screens to save space) */}
          <Link
            href="/download"
            prefetch={false}
            className="hidden sm:block bg-slate-900 text-white px-5 md:px-6 py-2.5 rounded-full text-sm font-bold hover:bg-orange-600 shadow-md hover:-translate-y-0.5 transition-all"
          >
            Get the App
          </Link>

          {/* 🔥 MOBILE HAMBURGER BUTTON */}
          <button 
            className="md:hidden text-slate-800 p-2 hover:bg-orange-50 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              // X Icon
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              // Hamburger Icon
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>

        </div>
      </div>

      {/* 🔥 MOBILE DROPDOWN MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-orange-100 shadow-2xl flex flex-col py-4 px-6 animate-in slide-in-from-top-2 duration-200">
          
          <Link onClick={() => setIsMobileMenuOpen(false)} href="/how-it-works" className="py-3 text-base font-bold text-slate-800 border-b border-slate-50">How It Works</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} href="/shop" className="py-3 text-base font-bold text-slate-800 border-b border-slate-50">Shop Marketplace</Link>
          
          {/* Mobile Join Us Section */}
          <div className="py-3 border-b border-slate-50">
            <p className="text-xs font-black text-orange-500 uppercase tracking-wider mb-2">Join Us</p>
            <div className="flex flex-col gap-2 pl-2">
              <Link onClick={() => setIsMobileMenuOpen(false)} href={user ? "/volunteer-form" : "/auth"} prefetch={false} className="py-2 text-sm font-semibold text-slate-600 flex items-center gap-2">🦸‍♂️ Become a Volunteer</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/onboarding" prefetch={false} className="py-2 text-sm font-semibold text-slate-600 flex items-center gap-2">🏢 NGO Partnerships</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/vet-onboarding" prefetch={false} className="py-2 text-sm font-semibold text-slate-600 flex items-center gap-2">🏥 Register as a Vet</Link>
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

          {/* Mobile App Button (Visible only if screen is very small) */}
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