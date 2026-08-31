"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Bone,
  Pill,
  Gamepad2,
  Scissors,
  Tag,
  Home,
  Cookie,
  HeartPulse,
  Sparkles,
  ArrowLeftRight,
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import {
  ANIMAL_OPTIONS,
  CATEGORY_OPTIONS,
  ShopProduct,
} from "@/app/shop/shopConstants";

/* ═══════════════════════════════════════════════════
   CATEGORY ICON MAPPING
   ═══════════════════════════════════════════════════ */
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Food: Bone,
  Medicine: Pill,
  Toys: Gamepad2,
  Grooming: Scissors,
  Accessories: Tag,
  "Beds & Crates": Home,
  Treats: Cookie,
  "Health Supplements": HeartPulse,
};

/* ═══════════════════════════════════════════════════
   STATIC PROMO ITEMS & QUICK LINKS
   ═══════════════════════════════════════════════════ */
const PROMO_ITEMS = [
  { icon: "🚚", text: "Free delivery on orders above ₹499" },
  { icon: "🩺", text: "100% Vet-approved essentials & medications" },
  { icon: "🏷️", text: "Use code PAWSOME for 10% off your first order" },
  { icon: "⚡", text: "Express shipping available pan-India" },
  { icon: "🔄", text: "Easy 7-day hassle-free returns" },
] as const;

const QUICK_LINKS = [
  { icon: Heart, label: "My Wishlist", href: "/shop/wishlist" },
  { icon: ArrowLeftRight, label: "Compare Products", href: "/shop/compare" },
  { icon: Truck, label: "Track Orders", href: "/orders" },
  { icon: Package, label: "My Orders", href: "/orders" },
  { icon: Shield, label: "Vet Consultation", href: "/vet" },
] as const;

const POPULAR_SEARCHES = [
  "Royal Canin",
  "Cat Litter",
  "Tick & Flea Spray",
  "Puppy Chews",
  "Multivitamins",
  "Aquarium Filter",
] as const;

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */
export type ShopHeaderProps = {
  onCartClick?: () => void;
  cartCount?: number;
  user?: FirebaseUser | null;
  onAddProduct?: () => void;
  onSearch?: (query: string) => void;
  onSelectAnimal?: (animal: string) => void;
  onSelectCategory?: (category: string) => void;
  products?: ShopProduct[];
};

/* ═══════════════════════════════════════════════════
   PROMO STRIP
   ═══════════════════════════════════════════════════ */
const PromoStrip = memo(() => (
  <div className="bg-neutral-900 overflow-hidden select-none border-b border-neutral-800">
    <div className="flex whitespace-nowrap animate-[promo-scroll_34s_linear_infinite] hover:[animation-play-state:paused]">
      {[...PROMO_ITEMS, ...PROMO_ITEMS, ...PROMO_ITEMS].map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 px-8 py-2 text-neutral-300 text-[11px] font-medium flex-shrink-0 tracking-wide"
        >
          <span className="text-xs opacity-90">{item.icon}</span>
          <span>{item.text}</span>
          <span className="w-1 h-1 bg-primary rounded-full ml-6" />
        </span>
      ))}
    </div>
  </div>
));
PromoStrip.displayName = "PromoStrip";

/* ═══════════════════════════════════════════════════
   MEGA MENU PANEL (Aligned with ANIMAL_OPTIONS)
   ═══════════════════════════════════════════════════ */
const MegaMenuPanel = memo(
  ({
    animal,
    isOpen,
    onClose,
    onSelectSubcategory,
  }: {
    animal: (typeof ANIMAL_OPTIONS)[number];
    isOpen: boolean;
    onClose: () => void;
    onSelectSubcategory?: (animal: string, category: string) => void;
  }) => {
    if (!isOpen) return null;

    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          className="absolute top-full left-0 mt-1 w-[620px] bg-warm-surface rounded-2xl z-50 overflow-hidden border border-warm-line shadow-2xl"
          role="menu"
          aria-label={`${animal.label} categories`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-warm-line/80 bg-white/70">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{animal.emoji}</span>
              <div>
                <p className="text-sm font-extrabold text-neutral-900">
                  {animal.label} Care & Essentials
                </p>
                <p className="text-[11px] text-neutral-500 font-medium">
                  Verified nutrition, clinical care & wellness for {animal.label.toLowerCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subcategories Grid */}
          <div className="p-3.5 grid grid-cols-2 gap-1.5 bg-warm-surface">
            {CATEGORY_OPTIONS.map((cat) => {
              const IconComp = CATEGORY_ICON_MAP[cat.value] || Package;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    onSelectSubcategory?.(animal.value, cat.value);
                    onClose();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-warm-line text-left group transition-all"
                  role="menuitem"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-800 group-hover:text-primary transition-colors leading-tight">
                      {animal.label} {cat.value}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">
                      Explore top-rated products
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer tags */}
          <div className="px-5 py-3 border-t border-warm-line bg-white/50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onSelectSubcategory?.(animal.value, "All");
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-container transition-colors"
            >
              <span>View All {animal.label} Products</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <span className="text-[11px] text-neutral-400 font-medium">
              100% Genuine Brands
            </span>
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
    onSubmit,
    products,
  }: {
    isOpen: boolean;
    query: string;
    onChange: (val: string) => void;
    onClose: () => void;
    onSubmit?: (query: string) => void;
    products?: ShopProduct[];
  }) => {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const results = useMemo(() => {
      if (!query.trim() || !products) return [];
      const q = query.toLowerCase();
      return products
        .filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.brandName?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.animals?.some((a) => a.toLowerCase().includes(q))
        )
        .slice(0, 6);
    }, [query, products]);

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
        className="fixed inset-0 z-[200000] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xl mx-auto pt-[76px] sm:pt-28 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-warm-surface rounded-2xl overflow-hidden shadow-2xl border border-warm-line">
            {/* Input Row */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-warm-line">
              <Search className="w-5 h-5 text-primary flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search food, medicines, toys, treats..."
                className="flex-1 text-[15px] font-medium text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    onSubmit?.(query.trim());
                    onClose();
                  }
                }}
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                {query && (
                  <button
                    onClick={() => onChange("")}
                    className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 text-neutral-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-[11px] font-bold text-neutral-500 hover:text-neutral-800 transition-colors px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200"
                >
                  ESC
                </button>
              </div>
            </div>

            {/* Results / Suggestions Body */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {!query ? (
                <div className="space-y-4">
                  {/* Popular Searches */}
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span>Trending Searches</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            onChange(term);
                            onSubmit?.(term);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-primary/10 text-neutral-700 hover:text-primary text-xs font-semibold rounded-full border border-warm-line hover:border-primary/30 transition-all active:scale-95 shadow-sm"
                        >
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Browse Categories */}
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Shop by Animal
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ANIMAL_OPTIONS.map((animal) => (
                        <button
                          key={animal.value}
                          onClick={() => {
                            onSubmit?.(animal.value);
                            onClose();
                          }}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-primary/5 border border-warm-line hover:border-primary/30 transition-all text-left group"
                        >
                          <span className="text-xl leading-none">{animal.emoji}</span>
                          <div>
                            <p className="text-xs font-bold text-neutral-800 group-hover:text-primary transition-colors">
                              {animal.label}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 px-1">
                    Matching Products ({results.length})
                  </p>
                  {results.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        router.push(`/shop/product/${product.id}`);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white hover:bg-primary/5 border border-warm-line hover:border-primary/30 transition-all text-left group shadow-sm"
                    >
                      <div className="w-11 h-11 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden relative border border-neutral-200">
                        {product.images && product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="44px"
                            unoptimized={
                              typeof product.images[0] === "string" &&
                              (product.images[0].includes("firebasestorage.googleapis.com") ||
                                product.images[0].includes("storage.googleapis.com"))
                            }
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate group-hover:text-primary transition-colors">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-extrabold text-primary">
                            ₹{Number(product.discountPrice || product.price).toLocaleString("en-IN")}
                          </span>
                          {product.brandName && (
                            <span className="text-[10px] text-neutral-400 font-medium truncate">
                              by {product.brandName}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-primary transition-colors flex-shrink-0" />
                    </button>
                  ))}

                  <div className="pt-3 pb-1 text-center">
                    <button
                      onClick={() => {
                        onSubmit?.(query.trim());
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-container transition-colors"
                    >
                      <span>View all catalog results for &ldquo;{query}&rdquo;</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-neutral-700">
                    No products found matching &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Try searching for generic terms like &quot;dog food&quot;, &quot;shampoo&quot;, or &quot;medicines&quot;.
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
    onSelectAnimal,
  }: {
    isOpen: boolean;
    onClose: () => void;
    cartCount: number;
    onCartClick?: () => void;
    locationLabel: string;
    onRefreshLocation: () => void;
    isLocating: boolean;
    onSelectAnimal?: (animal: string) => void;
  }) => {
    useEffect(() => {
      if (isOpen) document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[200000] bg-black/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
      >
        <aside
          className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-warm-surface flex flex-col shadow-2xl border-r border-warm-line"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-warm-line bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-sm">
                A
              </div>
              <span className="font-extrabold text-neutral-900 text-base tracking-tight">
                AnimalSathi
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 text-neutral-500"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Delivery Location */}
          <div className="px-5 py-3 bg-white/60 border-b border-warm-line">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-neutral-600 truncate flex-1 font-medium">
                Delivering to <span className="font-bold text-neutral-900">{locationLabel}</span>
              </p>
              <button
                type="button"
                onClick={onRefreshLocation}
                disabled={isLocating}
                className="text-[11px] font-bold text-primary hover:text-primary-container disabled:opacity-50"
              >
                {isLocating ? "..." : "Change"}
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onCartClick?.();
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart ({cartCount})</span>
              </button>
              <Link
                href="/auth"
                onClick={onClose}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-warm-line text-neutral-800 text-xs font-bold active:scale-95 transition-all shadow-sm"
              >
                <User className="w-4 h-4" />
                <span>Account</span>
              </Link>
            </div>

            {/* Shop by Animal */}
            <div>
              <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-2 px-1">
                Shop by Pet
              </p>
              <div className="space-y-1">
                {ANIMAL_OPTIONS.map((animal) => (
                  <button
                    key={animal.value}
                    onClick={() => {
                      onSelectAnimal?.(animal.value);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white hover:bg-primary/5 border border-warm-line text-left transition-all group"
                  >
                    <span className="text-lg leading-none">{animal.emoji}</span>
                    <span className="text-xs font-bold text-neutral-800 group-hover:text-primary flex-1">
                      {animal.label}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-300 -rotate-90" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-2 px-1">
                Services & Support
              </p>
              <div className="space-y-1">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white hover:bg-neutral-50 border border-warm-line text-xs font-bold text-neutral-700 transition-all"
                  >
                    <link.icon className="w-4 h-4 text-primary" />
                    <span>{link.label}</span>
                  </Link>
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
   MAIN COMPONENT: ShopHeader
   ═══════════════════════════════════════════════════ */
export default function ShopHeader({
  onCartClick,
  cartCount = 0,
  onSearch,
  onSelectAnimal,
  onSelectCategory,
  products = [],
}: ShopHeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Detecting…");
  const [isLocating, setIsLocating] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Geolocation Resolver */
  const resolveLocationFromCoords = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const city =
        data?.address?.city ||
        data?.address?.town ||
        data?.address?.village ||
        data?.address?.county ||
        "";
      const state = data?.address?.state || "";
      const parts = [city, state].filter(Boolean);
      setLocationLabel(parts.length > 0 ? parts.slice(0, 2).join(", ") : "India");
    } catch {
      setLocationLabel("New Delhi, IN");
    }
  }, []);

  const detectLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationLabel("New Delhi, IN");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await resolveLocationFromCoords(pos.coords.latitude, pos.coords.longitude);
        setIsLocating(false);
      },
      () => {
        setLocationLabel("New Delhi, IN");
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, [resolveLocationFromCoords]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  /* Scroll shadow */
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* Click outside mega menu */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* Keyboard shortcut Cmd+K */
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

  const toggleMenu = useCallback((id: string) => {
    setOpenMenu((prev) => (prev === id ? null : id));
  }, []);

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
    }, 150);
  }, []);

  const handleSubcategorySelect = useCallback(
    (animal: string, category: string) => {
      onSelectAnimal?.(animal);
      if (category !== "All") {
        onSelectCategory?.(category);
      }
    },
    [onSelectAnimal, onSelectCategory]
  );

  return (
    <header className="w-full relative z-40 bg-white">
      {/* ── TOP PROMO STRIP ── */}
      <PromoStrip />

      {/* ── MAIN HEADER BAR ── */}
      <div
        className={`sticky-shop-header bg-white transition-shadow duration-200 ${
          isScrolled ? "shadow-md border-b border-neutral-200/80" : "border-b border-neutral-100"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 lg:px-8 h-16 sm:h-[70px]">
          {/* Left: Mobile Menu Button & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-neutral-100 text-neutral-700 transition-colors"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm sm:text-base shadow-sm group-hover:scale-105 transition-transform">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-neutral-900 text-base sm:text-lg tracking-tight leading-tight group-hover:text-primary transition-colors">
                  AnimalSathi
                </span>
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none">
                  Shop & Pharmacy
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Global Search Bar (desktop) */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex flex-1 max-w-[460px] items-center gap-3 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/80 rounded-xl px-4 py-2.5 cursor-text transition-all group"
            aria-label="Search products"
          >
            <Search className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm text-neutral-400 flex-1 text-left truncate font-medium">
              Search medicines, food, toys, supplements...
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 bg-white border border-neutral-200 rounded text-[10px] font-bold text-neutral-500 shadow-sm">
              ⌘K
            </kbd>
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Mobile search trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-neutral-100 text-neutral-700"
              aria-label="Search catalog"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Location indicator (desktop) */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="max-w-[120px] truncate">{locationLabel}</span>
            </button>

            {/* Wishlist Link */}
            <Link
              href="/shop/wishlist"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-red-500 hover:bg-red-50/60 transition-colors"
              title="My Wishlist"
            >
              <Heart className="w-4 h-4 text-red-500" />
              <span className="hidden lg:inline">Wishlist</span>
            </Link>

            {/* Track Orders Link */}
            <Link
              href="/orders"
              className="hidden md:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              <Truck className="w-4 h-4 text-secondary" />
              <span>Orders</span>
            </Link>

            {/* Cart Button */}
            <button
              type="button"
              onClick={onCartClick}
              aria-label={`Shopping cart with ${cartCount} items`}
              className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-primary/20 hover:shadow-md transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="min-w-[20px] h-5 px-1 bg-white text-primary text-[10px] leading-5 text-center rounded-full font-black shadow-sm">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── DESKTOP NAVIGATION BAR (Animals + Mega Menus) ── */}
        <nav
          ref={navRef}
          className="hidden md:block border-t border-warm-line/60 bg-warm-surface"
          aria-label="Product categories"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {ANIMAL_OPTIONS.map((animal) => (
                <div
                  key={animal.value}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => openMenuHover(animal.value)}
                  onMouseLeave={scheduleCloseMenu}
                >
                  <button
                    type="button"
                    onClick={() => toggleMenu(animal.value)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs sm:text-[13px] font-bold transition-all relative ${
                      openMenu === animal.value
                        ? "text-primary"
                        : "text-neutral-700 hover:text-neutral-900"
                    }`}
                    aria-expanded={openMenu === animal.value}
                    aria-haspopup="true"
                  >
                    <span className="text-base leading-none">{animal.emoji}</span>
                    <span>{animal.label}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        openMenu === animal.value ? "rotate-180 text-primary" : "text-neutral-400"
                      }`}
                    />
                    {openMenu === animal.value && (
                      <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
                    )}
                  </button>

                  {/* Mega Menu Panel */}
                  <MegaMenuPanel
                    animal={animal}
                    isOpen={openMenu === animal.value}
                    onClose={closeMenu}
                    onSelectSubcategory={handleSubcategorySelect}
                  />
                </div>
              ))}
            </div>

            {/* Quick Consultation Badge */}
            <Link
              href="/vet"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-neutral-900 px-3 py-1 rounded-lg hover:bg-white/80 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Talk to a Certified Vet</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* ── SEARCH OVERLAY ── */}
      <SearchOverlay
        isOpen={isSearchOpen}
        query={searchQuery}
        onChange={setSearchQuery}
        onClose={() => setIsSearchOpen(false)}
        onSubmit={onSearch}
        products={products}
      />

      {/* ── MOBILE DRAWER ── */}
      <MobileDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        cartCount={cartCount}
        onCartClick={onCartClick}
        locationLabel={locationLabel}
        onRefreshLocation={detectLocation}
        isLocating={isLocating}
        onSelectAnimal={onSelectAnimal}
      />
    </header>
  );
}