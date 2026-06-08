"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, RefreshCw } from "lucide-react";
import { fetchVetVerificationStatus, VetVerificationStatus } from "../lib/vet";
import { fetchSellerVerificationStatus } from "../lib/seller";
import type { SellerVerificationStatus } from "../lib/seller";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [vetStatus, setVetStatus] = useState<VetVerificationStatus | null>(null);
  const [vetStatusLoading, setVetStatusLoading] = useState(false);
  const vetStatusFetchedFor = useRef<string | null>(null);
  const [sellerStatus, setSellerStatus] = useState<SellerVerificationStatus | null>(null);
  const [sellerStatusLoading, setSellerStatusLoading] = useState(false);
  const sellerStatusFetchedFor = useRef<string | null>(null);
  const [orgApproved, setOrgApproved] = useState(false);
  const [orgApprovedLoading, setOrgApprovedLoading] = useState(false);
  const orgApprovedFetchedFor = useRef<string | null>(null);
  
  // Controls whether the mobile menu is open or closed
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Accordion states for mobile menu sections
  const [mobileAccordion, setMobileAccordion] = useState<{services: boolean; joinUs: boolean; aboutUs: boolean}>({
    services: false,
    joinUs: false,
    aboutUs: false
  });

  const toggleAccordion = (section: 'services' | 'joinUs' | 'aboutUs') => {
    setMobileAccordion(prev => ({...prev, [section]: !prev[section]}));
  };

  const router = useRouter();

  // Lock body scroll & signal bottom nav when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.dataset.mobileMenuOpen = 'true';
    } else {
      document.body.style.overflow = '';
      document.body.dataset.mobileMenuOpen = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.dataset.mobileMenuOpen = '';
    };
  }, [isMobileMenuOpen]);

  const loadFirebaseAuth = async () => {
    const firebase = await import("../lib/firebase");
    return firebase.auth;
  };
  const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setScrolled(window.scrollY > 10);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

// Get user location from localStorage
useEffect(() => {
  const storedLocation = localStorage.getItem("userLocation");
  if (storedLocation) {
    try {
      const loc = JSON.parse(storedLocation);
      setUserLocation(loc);
    } catch (e) {
      console.warn("Could not parse stored location");
    }
  }
}, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser({
        displayName: parsed.name,
        email: parsed.email,
        photoURL: parsed.photo,
      } as User);

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

  useEffect(() => {
    if (!user?.uid) {
      setVetStatus(null);
      vetStatusFetchedFor.current = null;
      return;
    }
    if (vetStatusFetchedFor.current === user.uid) return;
    let cancelled = false;
    setVetStatusLoading(true);
    fetchVetVerificationStatus(user.uid)
      .then((status) => {
        if (cancelled) return;
        setVetStatus(status);
        vetStatusFetchedFor.current = user.uid;
      })
      .catch((err) => {
        console.error("Vet status check failed:", err);
      })
      .finally(() => {
        if (cancelled) return;
        setVetStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Fetch seller status
  useEffect(() => {
    if (!user?.uid) {
      setSellerStatus(null);
      sellerStatusFetchedFor.current = null;
      return;
    }
    if (sellerStatusFetchedFor.current === user.uid) return;
    let cancelled = false;
    setSellerStatusLoading(true);
    fetchSellerVerificationStatus(user.uid)
      .then((status) => {
        if (cancelled) return;
        setSellerStatus(status);
        sellerStatusFetchedFor.current = user.uid;
      })
      .catch((err) => {
        console.error("Seller status check failed:", err);
      })
      .finally(() => {
        if (cancelled) return;
        setSellerStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Fetch orgApproved status
  useEffect(() => {
    if (!user?.uid) {
      setOrgApproved(false);
      orgApprovedFetchedFor.current = null;
      return;
    }
    if (orgApprovedFetchedFor.current === user.uid) return;
    let cancelled = false;
    setOrgApprovedLoading(true);
    import("firebase/firestore")
      .then(({ doc, getDoc }) =>
        import("../lib/firebase").then(({ db }) =>
          getDoc(doc(db, "users", user.uid!)).then((snap) => {
            if (cancelled) return;
            const approved = snap.exists() && snap.data().orgApproved === true;
            setOrgApproved(approved);
            orgApprovedFetchedFor.current = user.uid;
          })
        )
      )
      .catch((err) => {
        console.error("Org approved check failed:", err);
      })
      .finally(() => {
        if (cancelled) return;
        setOrgApprovedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleLogout = async () => {
    const authInstance = await loadFirebaseAuth();
    await signOut(authInstance);

    setUser(null);
    setIsMobileMenuOpen(false);
    router.refresh();
  };

  const requestLocation = () => {
    setLocationLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            // Extract a concise address: city/town/village and district
            let shortAddress = "";
            if (data.address) {
              const locality = data.address.city || data.address.town || data.address.village || "";
              const district = data.address.state_district || data.address.county || data.address.state || "";
              
              if (locality && district && locality !== district) {
                shortAddress = `${locality}, ${district}`;
              } else if (locality || district) {
                shortAddress = locality || district;
              }
            }
            const addressToSave = shortAddress ? shortAddress : data.display_name;

            const locData = { latitude, longitude, address: addressToSave };
            setUserLocation(locData);
            localStorage.setItem("userLocation", JSON.stringify(locData));
          } catch (error) {
            console.error("Geocoding failed", error);
            const locData = { latitude, longitude };
            setUserLocation(locData);
            localStorage.setItem("userLocation", JSON.stringify(locData));
          }
          setLocationLoading(false);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Could not fetch location. Please enable location permissions.");
          setLocationLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setLocationLoading(false);
    }
  };

  /* ─── Shared style fragments ─── */
  const navLinkClass = `relative group text-slate-600 text-[13px] font-semibold tracking-wide uppercase
    after:absolute after:left-0 after:-bottom-1 
    after:h-[2px] after:w-0 
    after:bg-orange-500 
    after:transition-all after:duration-300 
    group-hover:after:w-full hover:text-orange-600 transition-colors`;

  const dropdownTriggerClass = `cursor-pointer relative text-slate-600 text-[13px] font-semibold tracking-wide uppercase
    after:absolute after:left-0 after:-bottom-1 
    after:h-[2px] after:w-0 
    after:bg-orange-500 
    after:transition-all after:duration-300 
    group-hover:after:w-full py-2 hover:text-orange-600 transition-colors flex items-center gap-1`;

  const dropdownPanelClass = `absolute left-1/2 -translate-x-1/2 top-full pt-4 
    opacity-0 translate-y-[10px]
    group-hover:opacity-100 group-hover:translate-y-0
    transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
    pointer-events-none group-hover:pointer-events-auto`;

  const dropdownCardClass = `bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]
    w-64 p-2 flex flex-col`;

  const dropdownItemClass = `flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors group/item`;

  return (
    <>
      <header
        className={`fixed top-3 inset-x-3 md:inset-x-6 lg:inset-x-10 z-[999] rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          bg-white/80 backdrop-blur-2xl border border-slate-200/40
          ${scrolled
            ? "shadow-[0_12px_40px_rgba(0,0,0,0.12)] border-slate-200/60 bg-white/90"
            : "shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
          }`}
      >
        <div className="px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
          
          {/* LEFT SIDE: LOGO & LOCATION */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* LOGO */}
            <Link
              href="/"
              className="hover:scale-105 transition-transform flex items-center shrink-0"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Image 
                src="/logo.png" 
                alt="AnimalSathi Logo" 
                width={180} 
                height={60} 
                priority={true}
                className="h-8 md:h-10 lg:h-12 w-auto object-contain" 
              />
            </Link>
 
            {/* INLINE LOCATION — pill style */}
            <div 
              className="flex items-center rounded-full px-2.5 py-1.5 cursor-pointer max-w-[100px] sm:max-w-[140px] lg:max-w-[180px] transition-all duration-300 text-slate-700 bg-slate-100/70 hover:bg-slate-200/60"
              onClick={!userLocation ? requestLocation : undefined}
            >
              <MapPin className="w-3 h-3 text-orange-500 mr-1 shrink-0" />
              <span className="text-[11px] sm:text-[12px] font-medium tracking-tight truncate">
                {locationLoading ? "Fetching..." : userLocation ? (
                  <>{userLocation.address || `${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)}`}</>
                ) : (
                  "Set location"
                )}
              </span>
              {userLocation && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    requestLocation();
                  }}
                  className="ml-1.5 hover:text-orange-600 transition-colors shrink-0"
                  title="Reload location"
                >
                  <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${locationLoading ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
          </div>

          {/* CENTER NAV LINKS (DESKTOP ONLY) */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8">
            <Link href="/" prefetch={false} className={navLinkClass}>Home</Link>

            <Link href="/how-it-works" prefetch={false} className={navLinkClass}>How It Works</Link>

            {/* SERVICES DROPDOWN */}
            <div className="relative group">
              <span className={dropdownTriggerClass}>
                Services
                <svg 
                  className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className={dropdownPanelClass}>
                <div className={dropdownCardClass}>
                  <Link href="/playdate" prefetch={false} className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary group-hover/item:scale-110 transition-transform">pets</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Play Date</span>
                      <span className="text-[10px] text-slate-500">Socialize your furry friend</span>
                    </div>
                  </Link>
                  <Link href="/vet-appointments" prefetch={false} className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary group-hover/item:scale-110 transition-transform">medical_services</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Vet Appointments</span>
                      <span className="text-[10px] text-slate-500">Expert medical care</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* JOIN US DROPDOWN */}
            <div className="relative group">
              <span className={dropdownTriggerClass}>
                Join Us
                <svg className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover:rotate-180" fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </span>
              <div className={dropdownPanelClass}>
                <div className={dropdownCardClass}>
                  <Link href="/volunteer-form" prefetch={false} className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary">volunteer_activism</span>
                    <span className="text-sm font-semibold text-slate-700">Become a Volunteer</span>
                  </Link>
                  <Link href="/onboarding" prefetch={false} className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary">corporate_fare</span>
                    <span className="text-sm font-semibold text-slate-700">NGO Partnerships</span>
                  </Link>
                  <Link href="/onboarding/organization" prefetch={false} className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary">local_hospital</span>
                    <span className="text-sm font-semibold text-slate-700">Hospital Onboarding</span>
                  </Link>
                  <Link href="/vets" prefetch={false} className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary">stethoscope</span>
                    <span className="text-sm font-semibold text-slate-700">Register as a Vet</span>
                  </Link>
                  <Link href="/become-seller" prefetch={false} className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary">storefront</span>
                    <span className="text-sm font-semibold text-slate-700">Become a Seller</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* ABOUT US DROPDOWN */}
            <div className="relative group">
              <span className={dropdownTriggerClass}>
                About Us
                <svg 
                  className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className={dropdownPanelClass}>
                <div className={dropdownCardClass}>
                  <Link href="/about" className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary group-hover/item:scale-110 transition-transform">auto_stories</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Our Story</span>
                      <span className="text-[10px] text-slate-500">How AnimalSathi started</span>
                    </div>
                  </Link>
                  <Link href="/investors" className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary group-hover/item:scale-110 transition-transform">business_center</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Investors</span>
                      <span className="text-[10px] text-slate-500">Funding & growth details</span>
                    </div>
                  </Link>
                  <Link href="/contact" className={dropdownItemClass}>
                    <span className="material-symbols-outlined text-primary group-hover/item:scale-110 transition-transform">contact_support</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Contact Us</span>
                      <span className="text-[10px] text-slate-500">Reach out to our team</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/shop" prefetch={false} className={navLinkClass}>Shop</Link>
          </nav>

          {/* RIGHT SIDE: PROFILE, APP CTA, & MOBILE MENU BUTTON */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            
            {!loading && user ? (
              <>
                {/* DESKTOP PROFILE MENU (Hidden on Mobile) */}
                <div className="hidden md:block relative group">
                  <img
                    src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c"}
                    alt="User Profile"
                    className="w-10 h-10 rounded-full cursor-pointer border-2 border-white/80 hover:scale-105 hover:ring-2 hover:ring-orange-400/30 transition-all duration-200 object-cover shadow-sm"
                  />
                  <div className="absolute right-0 top-full pt-4 
                    opacity-0 translate-y-[10px]
                    group-hover:opacity-100 group-hover:translate-y-0
                    transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                    pointer-events-none group-hover:pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]
                      w-60 flex flex-col overflow-hidden">
                      <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || "Animal Lover"}</p>
                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                      </div>
                      <div className="p-2 flex flex-col">
                        {orgApproved && !orgApprovedLoading && (
                          <Link href="/organization/dashboard" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm font-semibold text-slate-700">
                            <span className="material-symbols-outlined text-primary">dashboard</span>
                            Organization Dashboard
                          </Link>
                        )}
                        {sellerStatus === "approved" && !sellerStatusLoading && (
                          <Link href="/seller-dashboard" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm font-semibold text-slate-700">
                            <span className="material-symbols-outlined text-primary">storefront</span>
                            Seller Dashboard
                          </Link>
                        )}
                        {(!sellerStatus || (sellerStatus !== "approved" && sellerStatus !== "pending")) && !sellerStatusLoading && (
                          <Link href="/become-seller" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm font-semibold text-slate-700">
                            <span className="material-symbols-outlined text-primary">storefront</span>
                            Become a Seller
                          </Link>
                        )}
                        <Link href="/dashboard?tab=profile" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm font-semibold text-slate-700">
                          <span className="material-symbols-outlined text-primary">person</span>
                          My Profile
                        </Link>
                        <Link href="/dashboard?tab=reports" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm font-semibold text-slate-700">
                          <span className="material-symbols-outlined text-primary">emergency</span>
                          My SOS Reports
                        </Link>
                        <Link href="/dashboard?tab=settings" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm font-semibold text-slate-700">
                          <span className="material-symbols-outlined text-primary">settings</span>
                          Settings
                        </Link>
                      </div>
                      <div className="p-2 border-t border-slate-100">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-sm font-bold text-red-600">
                          <span className="material-symbols-outlined text-red-500">logout</span>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOBILE AVATAR (Triggers Hamburger Menu) */}
                <img
                  src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c"}
                  alt="User Profile"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden w-8 h-8 rounded-full cursor-pointer border-2 border-white/80 object-cover shadow-sm"
                />
              </>
            ) : (
              /* SIGN IN BUTTON */
              <Link href="/auth" className={`${navLinkClass} px-3 md:px-4 py-2`}>
                Log In
              </Link>
            )}

            {/* GET APP BUTTON */}
            <Link
              href="/download"
              prefetch={false}
              className="hidden sm:flex items-center gap-2
                bg-orange-500 text-white px-5 py-2 rounded-full text-[13px] font-semibold tracking-wide
                shadow-lg shadow-orange-500/20
                hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30
                transition-all duration-200 shimmer-btn"
            >
              Get the App
            </Link>

            {/* MOBILE HAMBURGER BUTTON - Animated morph */}
            <button 
              className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100/60 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <div className="w-5 h-4 relative flex flex-col justify-between">
                <span className={`block h-0.5 w-full bg-slate-700 rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block h-0.5 w-full bg-slate-700 rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isMobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100'}`} />
                <span className={`block h-0.5 w-full bg-slate-700 rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE OVERLAY BACKDROP */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[998] transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* MOBILE SLIDE-DOWN MENU — floating panel */}
      <div className={`md:hidden fixed top-[72px] inset-x-3 z-[999] bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isMobileMenuOpen ? 'max-h-[calc(100vh-6rem)] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-3 pointer-events-none'}`}>
        <div className="flex flex-col py-2 px-4 overflow-y-auto overscroll-contain">
          
          {/* USER ACCOUNT SECTION (Visible only if logged in) */}
          {user && (
            <div className="py-3 mb-1 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c"}
                  alt="User Profile"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">{user.displayName || "Animal Lover"}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {orgApproved && !orgApprovedLoading && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/organization/dashboard" className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 rounded-lg flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">dashboard</span> Org Dashboard</Link>
                )}
                {sellerStatus === "approved" && !sellerStatusLoading && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/seller-dashboard" className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 rounded-lg flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">storefront</span> Seller Dashboard</Link>
                )}
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/dashboard?tab=profile" className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 rounded-lg flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">person</span> Profile</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/dashboard?tab=reports" className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 rounded-lg flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">emergency</span> SOS Reports</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/dashboard?tab=settings" className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 rounded-lg flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">settings</span> Settings</Link>
                {(!sellerStatus || (sellerStatus !== "approved" && sellerStatus !== "pending")) && !sellerStatusLoading && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/become-seller" className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 rounded-lg flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">storefront</span> Become a Seller</Link>
                )}
                <button onClick={handleLogout} className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">logout</span> Sign Out</button>
              </div>
            </div>
          )}

          {/* Primary Navigation Items */}
          <div className="flex flex-col divide-y divide-slate-50">
            <Link onClick={() => setIsMobileMenuOpen(false)} href="/" className="py-3.5 text-sm font-bold text-slate-800 flex items-center gap-3 active:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">home</span>
              Home
            </Link>

            <Link onClick={() => setIsMobileMenuOpen(false)} href="/how-it-works" className="py-3.5 text-sm font-bold text-slate-800 flex items-center gap-3 active:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">info</span>
              How It Works
            </Link>

            {/* Services Accordion */}
            <div className="-mx-4 px-4">
              <button 
                onClick={() => toggleAccordion('services')}
                className="w-full py-3.5 text-sm font-bold text-slate-800 flex items-center justify-between active:bg-slate-50 rounded-lg transition-colors px-1"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">medical_services</span>
                  Services
                </span>
                <span className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200 ${mobileAccordion.services ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              <div className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileAccordion.services ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pb-2 pl-9 flex flex-col gap-0.5">
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/playdate" className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">pets</span>
                    Play Date
                  </Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/vet-appointments" className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">medical_services</span>
                    Vet Appointments
                  </Link>
                </div>
              </div>
            </div>

            <Link onClick={() => setIsMobileMenuOpen(false)} href="/shop" className="py-3.5 text-sm font-bold text-slate-800 flex items-center gap-3 active:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">storefront</span>
              Shop Marketplace
            </Link>

            {/* Join Us Accordion */}
            <div className="-mx-4 px-4">
              <button 
                onClick={() => toggleAccordion('joinUs')}
                className="w-full py-3.5 text-sm font-bold text-slate-800 flex items-center justify-between active:bg-slate-50 rounded-lg transition-colors px-1"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">group_add</span>
                  Join Us
                </span>
                <span className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200 ${mobileAccordion.joinUs ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              <div className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileAccordion.joinUs ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pb-2 pl-9 flex flex-col gap-0.5">
                  <Link onClick={() => setIsMobileMenuOpen(false)} href={user ? "/volunteer-form" : "/auth"} prefetch={false} className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">volunteer_activism</span>
                    Become a Volunteer
                  </Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/onboarding" prefetch={false} className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">corporate_fare</span>
                    NGO Partnerships
                  </Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/onboarding/organization" prefetch={false} className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">local_hospital</span>
                    Hospital Onboarding
                  </Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/vets" prefetch={false} className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">stethoscope</span>
                    Register as a Vet
                  </Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/become-seller" prefetch={false} className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">storefront</span>
                    Become a Seller
                  </Link>
                </div>
              </div>
            </div>

            {/* About Us Accordion */}
            <div className="-mx-4 px-4">
              <button 
                onClick={() => toggleAccordion('aboutUs')}
                className="w-full py-3.5 text-sm font-bold text-slate-800 flex items-center justify-between active:bg-slate-50 rounded-lg transition-colors px-1"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">info</span>
                  About Us
                </span>
                <span className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200 ${mobileAccordion.aboutUs ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              <div className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileAccordion.aboutUs ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pb-2 pl-9 flex flex-col gap-0.5">
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/about" prefetch={false} className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">auto_stories</span>
                    Our Story
                  </Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/investors" prefetch={false} className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">business_center</span>
                    Investors
                  </Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} prefetch={false} href="/contact" className="py-2.5 px-3 text-sm font-semibold text-slate-600 rounded-lg hover:bg-orange-50 active:bg-orange-50 transition-colors flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">contact_support</span>
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile App CTA */}
          <Link
            onClick={() => setIsMobileMenuOpen(false)}
            href="/download"
            prefetch={false}
            className="mt-4 mb-2 w-full bg-orange-500 text-white text-center py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">install_mobile</span>
            Download the App
          </Link>
          
          {/* Spacer for bottom safety */}
          <div className="h-4" />
        </div>
      </div>
    </>
  );
}