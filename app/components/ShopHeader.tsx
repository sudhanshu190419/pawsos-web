"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Search,
  MapPin,
  ShoppingCart,
  User,
  ChevronDown,
  X,
  Heart,
  Phone,
  Truck,
  Shield,
  Star,
  Menu as MenuIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   STATIC DATA (outside component to avoid re-creation)
   ═══════════════════════════════════════════════════ */
const MENU_DATA = [
  {
    id: "dogs",
    label: "Dogs",
    emoji: "🐶",
    title: "Dog Products",
    sub: "Best care for your furry friend",
    items: [
      { icon: "🍖", label: "Dog Food", desc: "Dry, wet & raw diets", badge: "Popular" },
      { icon: "💊", label: "Medicines", desc: "Dewormers, vitamins", badge: "" },
      { icon: "🎾", label: "Toys", desc: "Chew toys & puzzles", badge: "New" },
      { icon: "🛁", label: "Grooming", desc: "Shampoos & brushes", badge: "" },
      { icon: "🦴", label: "Treats", desc: "Healthy & tasty snacks", badge: "" },
      { icon: "🛏️", label: "Beds & Crates", desc: "Comfort essentials", badge: "" },
    ],
    tags: ["All Dog Products", "New Arrivals", "Best Sellers", "Vet Picks"],
    color: "orange",
  },
  {
    id: "cats",
    label: "Cats",
    emoji: "🐱",
    title: "Cat Products",
    sub: "Everything your cat adores",
    items: [
      { icon: "🐟", label: "Cat Food", desc: "Dry, wet & treats", badge: "Popular" },
      { icon: "💊", label: "Medicines", desc: "Hairball, flea control", badge: "" },
      { icon: "🪡", label: "Toys", desc: "Wands & laser pointers", badge: "" },
      { icon: "🏠", label: "Litter & Beds", desc: "Hygiene & comfort", badge: "New" },
    ],
    tags: ["All Cat Products", "Organic Range", "Indoor Cats"],
    color: "violet",
  },
  {
    id: "birds",
    label: "Birds",
    emoji: "🐦",
    title: "Bird Products",
    sub: "Keep your birds happy & healthy",
    items: [
      { icon: "🌾", label: "Bird Food", desc: "Seeds, pellets & mix", badge: "" },
      { icon: "🏚️", label: "Cages", desc: "All sizes & styles", badge: "" },
      { icon: "🪺", label: "Nesting", desc: "Boxes & materials", badge: "" },
    ],
    tags: ["All Bird Products", "Parakeet Special"],
    color: "emerald",
  },
  {
    id: "fish",
    label: "Fish",
    emoji: "🐠",
    title: "Fish Products",
    sub: "Build the perfect aquarium",
    items: [
      { icon: "🫧", label: "Fish Food", desc: "Flakes, pellets & live", badge: "" },
      { icon: "🪸", label: "Aquarium", desc: "Tanks, filters & decor", badge: "Popular" },
    ],
    tags: ["All Fish Products", "Starter Kits"],
    color: "sky",
  },
  {
    id: "small-pets",
    label: "Small Pets",
    emoji: "🐹",
    title: "Small Pet Products",
    sub: "For hamsters, rabbits & more",
    items: [
      { icon: "🥕", label: "Food", desc: "Hay, pellets & treats", badge: "" },
      { icon: "🏡", label: "Habitats", desc: "Cages & accessories", badge: "" },
    ],
    tags: ["All Small Pets"],
    color: "amber",
  },
] as const;

const PROMO_ITEMS = [
  { icon: "🚚", text: "Free delivery on orders above ₹499" },
  { icon: "🩺", text: "Vet-approved products only" },
  { icon: "🏷️", text: "10% off first order — use NEWPET" },
  { icon: "⚡", text: "Same-day delivery in select cities" },
  { icon: "🔄", text: "Easy 7-day returns on all products" },
] as const;

const QUICK_LINKS = [
  { icon: Truck, label: "Track Order" },
  { icon: Phone, label: "Vet Help" },
  { icon: Heart, label: "Wishlist" },
  { icon: Shield, label: "PetCare+" },
] as const;

const TRENDING_SEARCHES = [
  "Royal Canin Dog Food",
  "Cat Litter",
  "Tick Spray",
  "Puppy Treats",
  "Aquarium Filter",
] as const;

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */
type ShopHeaderProps = {
  onCartClick?: () => void;
  cartCount?: number;
};

/* ═══════════════════════════════════════════════════
   PROMO STRIP (memoized)
   ═══════════════════════════════════════════════════ */
const PromoStrip = memo(() => (
  <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 overflow-hidden relative">
    <div className="flex whitespace-nowrap animate-[scroll-promo_28s_linear_infinite] hover:[animation-play-state:paused]">
      {[...PROMO_ITEMS, ...PROMO_ITEMS, ...PROMO_ITEMS].map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 px-6 py-2 text-white text-[11.5px] sm:text-xs font-medium flex-shrink-0"
        >
          <span className="text-sm">{item.icon}</span>
          {item.text}
          <span className="w-1 h-1 bg-white/30 rounded-full ml-2" />
        </span>
      ))}
    </div>
  </div>
));
PromoStrip.displayName = "PromoStrip";

/* ═══════════════════════════════════════════════════
   MEGA MENU PANEL (memoized)
   ═══════════════════════════════════════════════════ */
const MegaMenuPanel = memo(
  ({
    menu,
    isOpen,
    onClose,
  }: {
    menu: (typeof MENU_DATA)[number];
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40"
          onClick={onClose}
          style={{ animation: "megaFadeIn 200ms ease-out" }}
        />

        {/* Panel */}
        <div
          className="fixed top-[108px] sm:top-[116px] left-1/2 -translate-x-1/2 w-[95vw] max-w-[680px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ animation: "megaSlideIn 250ms cubic-bezier(0.16,1,0.3,1)" }}
          role="menu"
          aria-label={menu.title}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-orange-100">
                {menu.emoji}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight">
                  {menu.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{menu.sub}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/80 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Items Grid */}
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {menu.items.map((item, idx) => (
                <a
                  key={item.label}
                  href="#"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 group/item transition-all duration-150 relative"
                  role="menuitem"
                  style={{ animation: `megaItemIn 200ms ease-out ${idx * 40}ms both` }}
                >
                  <div className="w-10 h-10 bg-slate-50 group-hover/item:bg-orange-100 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-all duration-150 group-hover/item:scale-105">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-slate-800 leading-tight flex items-center gap-1.5">
                      {item.label}
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                            item.badge === "New"
                              ? "bg-emerald-50 text-emerald-600"
                              : item.badge === "Popular"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">{item.desc}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-300 -rotate-90 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer tags */}
          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex gap-2 flex-wrap">
            {menu.tags.map((tag) => (
              <a
                key={tag}
                href="#"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-[11px] font-semibold rounded-full border border-slate-200 hover:border-orange-200 cursor-pointer transition-all duration-150"
              >
                {tag}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </>
    );
  }
);
MegaMenuPanel.displayName = "MegaMenuPanel";

/* ═══════════════════════════════════════════════════
   SEARCH OVERLAY (memoized)
   ═══════════════════════════════════════════════════ */
const SearchOverlay = memo(
  ({
    isOpen,
    query,
    onChange,
    onClose,
  }: {
    isOpen: boolean;
    query: string;
    onChange: (val: string) => void;
    onClose: () => void;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isOpen) {
        requestAnimationFrame(() => inputRef.current?.focus());
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      if (isOpen) document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[200000] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "megaFadeIn 200ms ease-out" }}
      >
        <div
          className="w-full max-w-2xl mx-auto pt-4 sm:pt-20 px-4"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "searchSlideIn 300ms cubic-bezier(0.16,1,0.3,1)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" strokeWidth={2} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search food, toys, medicines for your pet..."
                className="flex-1 text-base font-medium text-slate-800 placeholder:text-slate-300 outline-none bg-transparent"
              />
              {query && (
                <button
                  onClick={() => onChange("")}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.5} />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors pl-2 border-l border-slate-100"
              >
                ESC
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
              {!query ? (
                <>
                  {/* Trending Searches */}
                  <div className="mb-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Trending Searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onClick={() => onChange(term)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-medium rounded-xl border border-slate-100 hover:border-orange-200 transition-all"
                        >
                          <Star className="w-3 h-3 text-orange-400" fill="currentColor" strokeWidth={0} />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Categories */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Browse Categories
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {MENU_DATA.slice(0, 4).map((cat) => (
                        <a
                          key={cat.id}
                          href="#"
                          className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-orange-50 transition-colors group"
                        >
                          <span className="text-xl">{cat.emoji}</span>
                          <div>
                            <p className="text-xs font-semibold text-slate-700 group-hover:text-orange-600 transition-colors">
                              {cat.label}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {cat.items.length} categories
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Search Results Placeholder */
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-7 h-7 text-slate-200" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">
                    Searching for &quot;{query}&quot;
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Results would appear here from your product database
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
SearchOverlay.displayName = "SearchOverlay";

/* ═══════════════════════════════════════════════════
   MOBILE MENU DRAWER (memoized)
   ═══════════════════════════════════════════════════ */
const MobileDrawer = memo(
  ({
    isOpen,
    onClose,
    cartCount,
    onCartClick,
    locationLabel,
    onRefreshLocation,
    isLocating,
  }: {
    isOpen: boolean;
    onClose: () => void;
    cartCount: number;
    onCartClick?: () => void;
    locationLabel: string;
    onRefreshLocation: () => void;
    isLocating: boolean;
  }) => {
    useEffect(() => {
      if (isOpen) document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      if (isOpen) document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
        style={{ animation: "megaFadeIn 200ms ease-out" }}
      >
        <aside
          className="absolute left-0 top-0 h-full w-[85%] max-w-[340px] bg-white shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "mobileDrawerIn 300ms cubic-bezier(0.16,1,0.3,1)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <span className="text-white text-sm font-black">P</span>
              </div>
              <span className="font-black text-slate-800 text-lg tracking-tight">PetShop</span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto py-3">
            {/* Quick Actions */}
            <div className="px-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onCartClick?.();
                  }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-100 text-orange-600"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-xs font-semibold">Cart ({cartCount})</span>
                </button>
                <button className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-semibold">Account</span>
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="px-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Shop by Pet
              </p>
              {MENU_DATA.map((menu, idx) => (
                <a
                  key={menu.id}
                  href="#"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-orange-50 transition-colors"
                  style={{ animation: `megaItemIn 200ms ease-out ${idx * 50}ms both` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg">
                    {menu.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{menu.title}</p>
                    <p className="text-[11px] text-slate-400">{menu.items.length} categories</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                </a>
              ))}
            </div>

            {/* Quick Links */}
            <div className="px-4 mt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Quick Links
              </p>
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.label}
                  href="#"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <link.icon className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
                  <span className="text-sm text-slate-600 font-medium">{link.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>Delivering to <strong className="text-slate-600">{locationLabel}</strong></span>
              <button
                type="button"
                onClick={onRefreshLocation}
                className="ml-auto text-orange-500 font-semibold text-[11px] disabled:opacity-60"
                disabled={isLocating}
              >
                {isLocating ? "Locating..." : "Refresh"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    );
  }
);
MobileDrawer.displayName = "MobileDrawer";

/* ═══════════════════════════════════════════════════
   MAIN HEADER COMPONENT
   ═══════════════════════════════════════════════════ */
export default function ShopHeader({ onCartClick, cartCount = 0 }: ShopHeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Finding location...");
  const [isLocating, setIsLocating] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolveLocationFromCoords = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      if (!res.ok) throw new Error("Reverse geocoding failed");
      const data = await res.json();
      const city =
        data?.address?.city ||
        data?.address?.town ||
        data?.address?.village ||
        data?.address?.county ||
        "";
      const state = data?.address?.state || "";
      const country = data?.address?.country || "";
      const parts = [city, state, country].filter(Boolean);
      if (parts.length > 0) {
        setLocationLabel(parts.slice(0, 2).join(", "));
      } else {
        setLocationLabel("Current location");
      }
    } catch {
      setLocationLabel("Location unavailable");
    }
  }, []);

  const detectLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationLabel("Location unavailable");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await resolveLocationFromCoords(latitude, longitude);
        setIsLocating(false);
      },
      () => {
        setLocationLabel("Location access denied");
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, [resolveLocationFromCoords]);

  // Scroll listener for sticky shadow
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Click outside to close mega menu
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const toggleMenu = useCallback(
    (id: string) => setOpenMenu((prev) => (prev === id ? null : id)),
    []
  );
  const closeMenu = useCallback(() => setOpenMenu(null), []);
  const openMenuHover = useCallback((id: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenMenu(id);
  }, []);
  const scheduleCloseMenu = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setOpenMenu(null);
      closeTimerRef.current = null;
    }, 180);
  }, []);
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
  }, []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  return (
    <div className="w-full">
      {/* ═══ PROMO STRIP ═══ */}
      <PromoStrip />

      {/* ═══ MAIN BAR ═══ */}
      <div
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b transition-shadow duration-300 ${
          isScrolled ? "border-slate-200 shadow-lg shadow-black/[0.04]" : "border-slate-100 shadow-none"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-5 px-4 sm:px-6 h-[64px] sm:h-[68px]">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Open navigation menu"
          >
            <MenuIcon className="w-5 h-5 text-slate-700" strokeWidth={2} />
          </button>

          

          {/* Search Bar (desktop) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 max-w-[520px] mx-auto relative hidden sm:flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 cursor-text transition-all duration-200 group"
            aria-label="Search products"
          >
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
            <span className="text-sm text-slate-400 font-medium flex-1 text-left truncate">
              Search food, toys, medicines...
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-semibold text-slate-400 group-hover:border-slate-300 transition-colors">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Search Icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors ml-auto"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-slate-600" strokeWidth={2} />
          </button>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-60"
            >
              <MapPin className="w-4 h-4 text-orange-500" strokeWidth={1.8} />
              <span className="max-w-[140px] truncate">{locationLabel}</span>
            </button>

            <div className="w-px h-6 bg-slate-100 mx-1" />

            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150">
              <Heart className="w-4 h-4" strokeWidth={1.8} />
            </button>

            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150">
              <User className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={onCartClick}
              aria-label={`Open cart, ${cartCount} items`}
              className="flex items-center gap-2 text-orange-700 bg-orange-50 hover:bg-orange-100 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 relative border border-orange-100 hover:border-orange-200 ml-1"
            >
              <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2} />
              Cart
              {cartCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 min-w-5 h-5 px-1.5 bg-orange-600 text-white text-[10px] leading-5 text-center rounded-full font-bold shadow-md shadow-orange-600/30"
                  style={{ animation: "bounceIn 400ms cubic-bezier(0.68,-0.55,0.27,1.55)" }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Cart */}
          <button
            type="button"
            onClick={onCartClick}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors relative flex-shrink-0"
            aria-label={`Cart, ${cartCount} items`}
          >
            <ShoppingCart className="w-5 h-5 text-slate-700" strokeWidth={2} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-600 text-white text-[9px] leading-[18px] text-center rounded-full font-bold">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══ CATEGORY NAV (desktop) ═══ */}
      <div
        className="relative z-[90] hidden md:block border-b border-orange-100/70 bg-gradient-to-r from-white via-orange-50/40 to-white"
        ref={navRef}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex items-center gap-1 rounded-2xl border border-orange-100/80 bg-white/90 px-2 shadow-[0_10px_30px_-20px_rgba(249,115,22,0.55)] backdrop-blur-sm">
          {MENU_DATA.map((menu) => (
            <div
              key={menu.id}
              className="relative flex-shrink-0"
              onMouseEnter={() => openMenuHover(menu.id)}
              onMouseLeave={scheduleCloseMenu}
            >
              <button
                onClick={() => toggleMenu(menu.id)}
                onMouseEnter={() => openMenuHover(menu.id)}
                className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm lg:text-base font-bold transition-all duration-200 whitespace-nowrap ${
                  openMenu === menu.id
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-orange-50"
                }`}
                aria-expanded={openMenu === menu.id}
                aria-haspopup="true"
              >
                <span className={`text-lg lg:text-xl transition-transform duration-200 ${openMenu === menu.id ? "scale-110" : "group-hover:scale-110"}`}>
                  {menu.emoji}
                </span>
                {menu.label}
                <ChevronDown
                  className={`w-3.5 h-3.5 lg:w-4 lg:h-4 transition-transform duration-200 ${
                    openMenu === menu.id ? "rotate-180 text-white/90" : "text-slate-400 group-hover:text-orange-500"
                  }`}
                  strokeWidth={2.5}
                />
              </button>

              {openMenu === menu.id && (
                <div
                  className="absolute left-0 top-full z-[120] w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                  role="menu"
                  aria-label={menu.title}
                >
                  {menu.items.map((item) => (
                    <a
                      key={item.label}
                      href="#"
                      role="menuitem"
                      onClick={closeMenu}
                      className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-orange-50"
                    >
                      <span className="mt-0.5 text-base leading-none">{item.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">{item.label}</span>
                        <span className="block truncate text-xs text-slate-500">{item.desc}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Spacer + Quick links */}
          <div className="ml-auto flex items-center gap-2 pl-2">
            {QUICK_LINKS.slice(0, 2).map((link) => (
              <a
                key={link.label}
                href="#"
                className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm lg:text-base font-semibold text-slate-600 transition-all duration-200 whitespace-nowrap hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-sm"
              >
                <span className="inline-flex h-6 w-6 lg:h-7 lg:w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-orange-100 group-hover:text-orange-600">
                  <link.icon className="w-4 h-4 lg:w-[18px] lg:h-[18px]" strokeWidth={1.9} />
                </span>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* ═══ SEARCH OVERLAY ═══ */}
      <SearchOverlay
        isOpen={isSearchOpen}
        query={searchQuery}
        onChange={setSearchQuery}
        onClose={closeSearch}
      />

      {/* ═══ MOBILE DRAWER ═══ */}
      <MobileDrawer
        isOpen={isMobileOpen}
        onClose={closeMobile}
        cartCount={cartCount}
        onCartClick={onCartClick}
        locationLabel={locationLabel}
        onRefreshLocation={detectLocation}
        isLocating={isLocating}
      />

      {/* ═══ KEYFRAMES ═══ */}
      <style>{`
        @keyframes scroll-promo {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        @keyframes megaFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes megaSlideIn {
          from { opacity: 0; transform: translate(-50%, 8px) scale(0.98); }
          to   { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes megaItemIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes searchSlideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mobileDrawerIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes bounceIn {
          0%   { transform: scale(0); }
          50%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}