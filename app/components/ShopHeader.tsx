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
  Truck,
  Shield,
  Star,
  Menu as MenuIcon,
  ArrowRight,
  Package,
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

/* ═══════════════════════════════════════════════════
   STATIC DATA
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
  { icon: "🏷️", text: "10% off your first order — use NEWPET" },
  { icon: "⚡", text: "Same-day delivery in select cities" },
  { icon: "🔄", text: "Easy 7-day returns on all products" },
] as const;

const QUICK_LINKS = [
  { icon: Truck, label: "Track Order", href: "/orders" },
  { icon: Package, label: "My Orders", href: "/orders" },
  { icon: Heart, label: "Wishlist", href: "#" },
  { icon: Shield, label: "PetCare+", href: "#" },
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
  user?: FirebaseUser | null;
  onAddProduct?: () => void;
};

/* ═══════════════════════════════════════════════════
   PROMO STRIP
   ═══════════════════════════════════════════════════ */
const PromoStrip = memo(() => (
  <div className="bg-neutral-900 overflow-hidden select-none">
    <div className="flex whitespace-nowrap animate-[promo-scroll_32s_linear_infinite] hover:[animation-play-state:paused]">
      {[...PROMO_ITEMS, ...PROMO_ITEMS, ...PROMO_ITEMS].map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 px-8 py-2 text-neutral-300 text-[11px] font-medium flex-shrink-0 tracking-wide"
        >
          <span className="text-xs opacity-80">{item.icon}</span>
          {item.text}
          <span className="w-[3px] h-[3px] bg-neutral-600 rounded-full ml-4" />
        </span>
      ))}
    </div>
  </div>
));
PromoStrip.displayName = "PromoStrip";

/* ═══════════════════════════════════════════════════
   BADGE
   ═══════════════════════════════════════════════════ */
const Badge = ({ label }: { label: string }) => {
  if (!label) return null;
  const styles: Record<string, string> = {
    New: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    Popular: "bg-orange-50 text-orange-600 ring-1 ring-orange-100",
  };
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${styles[label] ?? "bg-neutral-100 text-neutral-500"}`}>
      {label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════
   MEGA MENU PANEL
   ═══════════════════════════════════════════════════ */
const MegaMenuPanel = memo(
  ({
    menu,
    isOpen,
    onClose,
    anchorRef,
  }: {
    menu: (typeof MENU_DATA)[number];
    isOpen: boolean;
    onClose: () => void;
    anchorRef?: React.RefObject<HTMLDivElement | null>;
  }) => {
    if (!isOpen) return null;

    return (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
        {/* Panel — positioned relative to the nav bar below */}
        <div
          className="absolute top-full left-0 mt-1 w-[600px] bg-white rounded-2xl z-50 overflow-hidden"
          style={{
            boxShadow: "0 8px 40px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)",
            animation: "panel-in 200ms cubic-bezier(0.16,1,0.3,1)",
          }}
          role="menu"
          aria-label={menu.title}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
            <span className="text-2xl">{menu.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{menu.title}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{menu.sub}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto w-7 h-7 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>

          {/* Items */}
          <div className="p-4 grid grid-cols-2 gap-1">
            {menu.items.map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 group/item transition-colors"
                role="menuitem"
              >
                <span className="w-9 h-9 rounded-lg bg-neutral-50 group-hover/item:bg-white flex items-center justify-center text-base flex-shrink-0 transition-colors shadow-none group-hover/item:shadow-sm">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-neutral-800 leading-tight">{item.label}</span>
                    <Badge label={item.badge} />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Footer tags */}
          <div className="px-5 py-3 border-t border-neutral-100 flex flex-wrap gap-1.5">
            {menu.tags.map((tag) => (
              <a
                key={tag}
                href="#"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium text-neutral-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              >
                {tag}
                <ArrowRight className="w-2.5 h-2.5" />
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
   SEARCH OVERLAY
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
      return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      if (isOpen) document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[200000] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "fade-in 150ms ease-out" }}
      >
        <div
          className="w-full max-w-xl mx-auto pt-[72px] sm:pt-24 px-4"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "slide-down 250ms cubic-bezier(0.16,1,0.3,1)" }}
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* Input Row */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Search className="w-4.5 h-4.5 text-neutral-400 flex-shrink-0" strokeWidth={2} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search food, toys, medicines for your pet…"
                className="flex-1 text-[15px] font-medium text-neutral-800 placeholder:text-neutral-300 outline-none bg-transparent"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                {query && (
                  <button
                    onClick={() => onChange("")}
                    className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                    aria-label="Clear"
                  >
                    <X className="w-3 h-3 text-neutral-500" strokeWidth={2.5} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-600 transition-colors px-2 py-1 rounded-md hover:bg-neutral-100"
                >
                  ESC
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-100 mx-4" />

            {/* Body */}
            <div className="px-4 py-4 max-h-[60vh] overflow-y-auto">
              {!query ? (
                <div className="space-y-5">
                  {/* Trending */}
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2.5">
                      Trending
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onClick={() => onChange(term)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-orange-50 text-neutral-600 hover:text-orange-600 text-xs font-medium rounded-full border border-neutral-100 hover:border-orange-100 transition-all"
                        >
                          <Star className="w-2.5 h-2.5 text-orange-400" fill="currentColor" strokeWidth={0} />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Browse Categories */}
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2.5">
                      Browse
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {MENU_DATA.slice(0, 4).map((cat) => (
                        <a
                          key={cat.id}
                          href="#"
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                        >
                          <span className="text-lg leading-none">{cat.emoji}</span>
                          <div>
                            <p className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-900 transition-colors leading-tight">
                              {cat.label}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">{cat.items.length} types</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Search className="w-8 h-8 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-600">
                    Results for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Connect your product database to show results
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
   MOBILE DRAWER
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
      return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      if (isOpen) document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
        style={{ animation: "fade-in 200ms ease-out" }}
      >
        <aside
          className="absolute left-0 top-0 h-full w-[80%] max-w-[320px] bg-white flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: "drawer-in 280ms cubic-bezier(0.16,1,0.3,1)",
            boxShadow: "24px 0 60px rgba(0,0,0,0.12)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-white text-xs font-black tracking-tight">A</span>
              </div>
              <span className="font-bold text-neutral-900 text-base tracking-tight">AnimalSathi</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {/* Delivery location */}
          <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" strokeWidth={2} />
              <p className="text-xs text-neutral-500">
                Delivering to <span className="font-semibold text-neutral-800">{locationLabel}</span>
              </p>
              <button
                type="button"
                onClick={onRefreshLocation}
                disabled={isLocating}
                className="ml-auto text-[11px] font-semibold text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-50"
              >
                {isLocating ? "Locating…" : "Change"}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Quick Actions */}
            <div className="px-4 py-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => { onClose(); onCartClick?.(); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-semibold shadow-sm shadow-orange-200 active:scale-[0.97] transition-transform"
              >
                <ShoppingCart className="w-4 h-4" />
                Cart {cartCount > 0 && `(${cartCount})`}
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold active:scale-[0.97] transition-transform">
                <User className="w-4 h-4" />
                Account
              </button>
            </div>

            {/* Section: Shop by Pet */}
            <div className="px-4 pb-2">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2 px-1">
                Shop by Pet
              </p>
              <div className="space-y-0.5">
                {MENU_DATA.map((menu) => (
                  <a
                    key={menu.id}
                    href="#"
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-lg flex-shrink-0">
                      {menu.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800">{menu.title}</p>
                      <p className="text-[10px] text-neutral-400">{menu.items.length} categories</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-300 -rotate-90 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            {/* Section: Quick Links */}
            <div className="px-4 py-4 mt-2 border-t border-neutral-100">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2 px-1">
                Quick Links
              </p>
              <div className="space-y-0.5">
                {QUICK_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <link.icon className="w-4 h-4 text-neutral-400" strokeWidth={1.8} />
                    <span className="text-sm text-neutral-600 font-medium">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    );
  }
);
MobileDrawer.displayName = "MobileDrawer";

/* ═══════════════════════════════════════════════════
   MAIN HEADER
   ═══════════════════════════════════════════════════ */
export default function ShopHeader({ onCartClick, cartCount = 0 }: ShopHeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Detecting…");
  const [isLocating, setIsLocating] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Location ── */
  const resolveLocationFromCoords = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || "";
      const state = data?.address?.state || "";
      const parts = [city, state].filter(Boolean);
      setLocationLabel(parts.length > 0 ? parts.slice(0, 2).join(", ") : "Current location");
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
      async (pos) => {
        await resolveLocationFromCoords(pos.coords.latitude, pos.coords.longitude);
        setIsLocating(false);
      },
      () => { setLocationLabel("Location denied"); setIsLocating(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, [resolveLocationFromCoords]);

  /* ── Scroll shadow ── */
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* ── Click outside mega menu ── */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Cmd+K shortcut ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setIsSearchOpen(true); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── Menu helpers ── */
  const toggleMenu = useCallback((id: string) => setOpenMenu((prev) => (prev === id ? null : id)), []);
  const closeMenu = useCallback(() => setOpenMenu(null), []);
  const openMenuHover = useCallback((id: string) => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setOpenMenu(id);
  }, []);
  const scheduleCloseMenu = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => { setOpenMenu(null); closeTimerRef.current = null; }, 160);
  }, []);
  const closeSearch = useCallback(() => { setIsSearchOpen(false); setSearchQuery(""); }, []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  useEffect(() => { return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }; }, []);
  useEffect(() => { detectLocation(); }, [detectLocation]);

  return (
    <div className="w-full">
      {/* ── PROMO STRIP ── */}
      <PromoStrip />

      {/* ── MAIN BAR ── */}
      <div
        className={`sticky top-0 z-50 bg-white transition-all duration-200 ${
          isScrolled ? "shadow-[0_1px_12px_rgba(0,0,0,0.06)]" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 h-16 sm:h-[68px]">

          {/* Mobile: Hamburger */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <MenuIcon className="w-[18px] h-[18px] text-neutral-700" strokeWidth={2} />
          </button>

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
              <span className="text-white text-xs font-black tracking-tight">A</span>
            </div>
            <span className="hidden sm:block font-bold text-neutral-900 text-[15px] tracking-tight">
              AnimalSathi
            </span>
          </a>

          {/* Search Bar (desktop) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex flex-1 max-w-[480px] mx-auto items-center gap-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl px-4 py-2.5 cursor-text transition-colors group"
            aria-label="Search products"
          >
            <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" strokeWidth={2} />
            <span className="text-sm text-neutral-400 flex-1 text-left truncate">
              Search food, toys, medicines…
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px] font-semibold text-neutral-400 transition-colors shadow-sm">
              ⌘K
            </kbd>
          </button>

          {/* Mobile: Search icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-colors ml-auto"
            aria-label="Search"
          >
            <Search className="w-[18px] h-[18px] text-neutral-700" strokeWidth={2} />
          </button>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            {/* Location */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-60"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" strokeWidth={2} />
              <span className="max-w-[130px] truncate text-[13px] font-medium">{locationLabel}</span>
            </button>

            <div className="w-px h-5 bg-neutral-200 mx-1" />

            {/* Wishlist */}
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors" aria-label="Wishlist">
              <Heart className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </button>

            {/* Account */}
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors" aria-label="Account">
              <User className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </button>

            {/* Cart */}
            <button
              type="button"
              onClick={onCartClick}
              aria-label={`Cart, ${cartCount} items`}
              className="relative flex items-center gap-2 ml-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm shadow-orange-200"
            >
              <ShoppingCart className="w-4 h-4" strokeWidth={2} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-white text-orange-600 text-[9px] leading-[18px] text-center rounded-full font-bold shadow ring-1 ring-orange-100">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Cart */}
          <button
            type="button"
            onClick={onCartClick}
            className="md:hidden relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-colors flex-shrink-0"
            aria-label={`Cart, ${cartCount} items`}
          >
            <ShoppingCart className="w-[18px] h-[18px] text-neutral-700" strokeWidth={2} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-orange-500 text-white text-[9px] leading-[16px] text-center rounded-full font-bold">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Bottom border ── */}
        <div className="h-px bg-neutral-100" />
      </div>

      {/* ── CATEGORY NAV (desktop) ── */}
      <nav
        className="relative z-[90] hidden md:block bg-white border-b border-neutral-100"
        ref={navRef}
        aria-label="Product categories"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-0.5">
            {MENU_DATA.map((menu) => (
              <div
                key={menu.id}
                className="relative flex-shrink-0"
                onMouseEnter={() => openMenuHover(menu.id)}
                onMouseLeave={scheduleCloseMenu}
              >
                <button
                  onClick={() => toggleMenu(menu.id)}
                  className={`group flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium transition-colors relative ${
                    openMenu === menu.id
                      ? "text-orange-600"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                  aria-expanded={openMenu === menu.id}
                  aria-haspopup="true"
                >
                  <span className="text-base leading-none">{menu.emoji}</span>
                  {menu.label}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      openMenu === menu.id ? "rotate-180 text-orange-500" : "text-neutral-300 group-hover:text-neutral-500"
                    }`}
                    strokeWidth={2.5}
                  />
                  {/* Active indicator */}
                  {openMenu === menu.id && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-orange-500 rounded-full" />
                  )}
                </button>

                {openMenu === menu.id && (
                  <MegaMenuPanel
                    menu={menu}
                    isOpen={true}
                    onClose={closeMenu}
                  />
                )}
              </div>
            ))}

            {/* Spacer + quick links */}
            <div className="ml-auto flex items-center gap-1 pl-4">
              {QUICK_LINKS.slice(0, 2).map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  <link.icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── SEARCH OVERLAY ── */}
      <SearchOverlay
        isOpen={isSearchOpen}
        query={searchQuery}
        onChange={setSearchQuery}
        onClose={closeSearch}
      />

      {/* ── MOBILE DRAWER ── */}
      <MobileDrawer
        isOpen={isMobileOpen}
        onClose={closeMobile}
        cartCount={cartCount}
        onCartClick={onCartClick}
        locationLabel={locationLabel}
        onRefreshLocation={detectLocation}
        isLocating={isLocating}
      />

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes promo-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawer-in {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}