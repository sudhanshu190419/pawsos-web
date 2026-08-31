"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { db } from "../lib/firebase";
import { CartProvider, useCart } from "../components/cart";
import { useCompare } from "./hooks/useCompare";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";
import {
  ANIMAL_OPTIONS,
  CATEGORY_OPTIONS,
  SORT_OPTIONS,
  ShopProduct,
  SortOption,
} from "./shopConstants";
import SmoothScrollProvider from "./providers/SmoothScrollProvider";
import GSAPRegistration from "./providers/GSAPRegistration";
import ShopHero from "../components/ShopHero";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import CartDrawer from "../components/CartDrawer";
import CheckoutPanel from "../components/CheckoutPanel";
import {
  Sparkles,
  Bone,
  Pill,
  Gamepad2,
  Scissors,
  Tag,
  Home,
  Cookie,
  HeartPulse,
  SlidersHorizontal,
  ChevronDown,
  X,
  ShoppingCart,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  RotateCcw,
  History,
  Dog,
  Cat,
  Bird,
  Fish,
  Rabbit,
  Layers,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   CATEGORY ICON MAPPER (Lucide SVG)
   ═══════════════════════════════════════════════════ */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Bone,
  Medicine: Pill,
  Toys: Gamepad2,
  Grooming: Scissors,
  Accessories: Tag,
  "Beds & Crates": Home,
  Treats: Cookie,
  "Health Supplements": HeartPulse,
};

const ANIMAL_ICONS: Record<string, React.ElementType> = {
  Dog: Dog,
  Cat: Cat,
  Bird: Bird,
  Fish: Fish,
  "Small Pets": Rabbit,
};

/* ═══════════════════════════════════════════════════
   TOAST NOTIFICATION TYPES
   ═══════════════════════════════════════════════════ */
type ToastType = "success" | "error" | "info";
interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

/* ═══════════════════════════════════════════════════
   PRODUCT CARD SKELETON (8-Point Grid)
   ═══════════════════════════════════════════════════ */
const ProductCardSkeleton = memo(() => (
  <div className="bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-5 flex flex-col justify-between animate-pulse shadow-sm">
    <div className="w-full aspect-[4/3] bg-stone-100 rounded-2xl mb-3" />
    <div className="space-y-2">
      <div className="h-3 bg-stone-100 rounded w-1/3" />
      <div className="h-4 bg-stone-100 rounded w-3/4" />
      <div className="h-3 bg-stone-100 rounded w-1/2" />
      <div className="flex justify-between items-center pt-2 border-t border-stone-100">
        <div className="h-5 bg-stone-200 rounded w-1/3" />
        <div className="w-10 h-10 bg-stone-100 rounded-xl" />
      </div>
    </div>
  </div>
));
ProductCardSkeleton.displayName = "ProductCardSkeleton";

/* ═══════════════════════════════════════════════════
   MAIN SHOP COMPONENT CONTENT
   ═══════════════════════════════════════════════════ */
function FullShopContent() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeAnimal, setActiveAnimal] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(16);

  // Modal & Drawer State
  const [quickViewProduct, setQuickViewProduct] = useState<ShopProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);

  // Cart Context
  const { items: cartItems, totals, addItem, updateQty, removeItem, clear } = useCart();

  // Compare Context
  const { compareList, clearCompare } = useCompare();

  // Recently Viewed Hook
  const { recentIds, addProduct: addToRecent } = useRecentlyViewed();

  // Toast Stack
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Section reference for smooth scrolling to catalog
  const catalogRef = useRef<HTMLDivElement>(null);
  const scrollToCatalog = useCallback(() => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Realtime Firestore Products Listener
  useEffect(() => {
    const productsRef = collection(db, "products");
    const q = query(
      productsRef,
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProducts: ShopProduct[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const images =
            Array.isArray(data.images) && data.images.length > 0
              ? data.images
              : data.imageUrl
              ? [data.imageUrl]
              : [];

          const animals =
            Array.isArray(data.animals) && data.animals.length > 0
              ? data.animals
              : data.animal
              ? [data.animal]
              : [];

          return {
            id: docSnap.id,
            name: data.name || "Untitled Product",
            description: data.description || "",
            price: Number(data.price) || 0,
            discountPrice:
              data.discountPrice !== undefined && data.discountPrice !== null
                ? Number(data.discountPrice)
                : null,
            category: data.category || "Food",
            animals,
            images,
            brandId: data.brandId || "",
            brandName:
              data.brandName ||
              data.vetName ||
              data.clinicName ||
              data.vetClinicName ||
              "AnimalSathi Verified",
            stockQty:
              data.stockQty !== undefined && data.stockQty !== null
                ? Number(data.stockQty)
                : 15,
            weight: Number(data.weight) || 0.5,
            length: data.length ?? null,
            breadth: data.breadth ?? null,
            height: data.height ?? null,
            shiprocketPickupId: data.shiprocketPickupId ?? null,
            status: data.status || "active",
            avgRating: Number(data.avgRating) || 0,
            reviewCount: Number(data.reviewCount) || 0,
            featured: Boolean(data.featured),
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt,
          } as ShopProduct;
        });

        setProducts(fetchedProducts);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore products snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute dynamic max price from products
  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return 5000;
    const maxVal = Math.max(...products.map((p) => p.price || 0));
    return Math.max(maxVal, 2000);
  }, [products]);

  // Reset pagination count when active filters change
  useEffect(() => {
    setVisibleCount(16);
  }, [activeCategory, activeAnimal, searchQuery, sortBy, priceRange, inStockOnly]);

  // Filter & Sort Pipeline
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Status filter
    list = list.filter((p) => (p.status || "active") === "active");

    // Category filter
    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }

    // Animal species filter
    if (activeAnimal && activeAnimal !== "All") {
      list = list.filter((p) => {
        if (p.animals && p.animals.length > 0) {
          return p.animals.some(
            (a) => a.toLowerCase() === activeAnimal.toLowerCase()
          );
        }
        return false;
      });
    }

    // Search query live filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brandName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.animals.some((a) => a.toLowerCase().includes(q))
      );
    }

    // Price range filter
    list = list.filter((p) => {
      const effectivePrice =
        p.discountPrice && p.discountPrice < p.price
          ? p.discountPrice
          : p.price;
      return effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
    });

    // In-Stock filter
    if (inStockOnly) {
      list = list.filter((p) => p.stockQty !== undefined && p.stockQty > 0);
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        list.sort((a, b) => {
          const priceA =
            a.discountPrice && a.discountPrice < a.price ? a.discountPrice : a.price;
          const priceB =
            b.discountPrice && b.discountPrice < b.price ? b.discountPrice : b.price;
          return priceA - priceB;
        });
        break;
      case "price-high":
        list.sort((a, b) => {
          const priceA =
            a.discountPrice && a.discountPrice < a.price ? a.discountPrice : a.price;
          const priceB =
            b.discountPrice && b.discountPrice < b.price ? b.discountPrice : b.price;
          return priceB - priceA;
        });
        break;
      case "rating":
        list.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case "popular":
        list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case "newest":
      default:
        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        break;
    }

    return list;
  }, [products, activeCategory, activeAnimal, searchQuery, priceRange, inStockOnly, sortBy]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  // Check if any filter is actively applied
  const isAnyFilterActive =
    activeCategory !== "All" ||
    (Boolean(activeAnimal) && activeAnimal !== "All") ||
    Boolean(searchQuery.trim()) ||
    priceRange[0] > 0 ||
    priceRange[1] < maxProductPrice ||
    inStockOnly;

  // Category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    for (const p of products) {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  // Animal item counts
  const animalCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    for (const p of products) {
      if (p.animals) {
        for (const a of p.animals) {
          counts[a] = (counts[a] || 0) + 1;
        }
      }
    }
    return counts;
  }, [products]);

  // Recently Viewed Products Resolution
  const recentlyViewedProducts = useMemo(() => {
    if (!recentIds || recentIds.length === 0) return [];
    return recentIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is ShopProduct => Boolean(p))
      .slice(0, 4);
  }, [recentIds, products]);

  // Add to Cart handler
  const handleAddToCart = useCallback(
    (product: ShopProduct, qty: number = 1) => {
      const result = addItem(product, qty);
      addToRecent(product.id);
      if (result.ok) {
        showToast(`Added ${product.name} (${qty}) to cart`, "success");
      } else {
        showToast(result.reason, "error");
      }
    },
    [addItem, addToRecent, showToast]
  );

  // Quick View Handler
  const handleQuickView = useCallback(
    (product: ShopProduct) => {
      setQuickViewProduct(product);
      addToRecent(product.id);
    },
    [addToRecent]
  );

  // Reset all active filters
  const handleResetFilters = useCallback(() => {
    setActiveCategory("All");
    setActiveAnimal("");
    setSearchQuery("");
    setPriceRange([0, maxProductPrice]);
    setInStockOnly(false);
    setSortBy("newest");
  }, [maxProductPrice]);

  return (
    <div className="full-bleed-page min-h-screen bg-warm-surface text-on-surface flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
      {/* ── 1. CLEAN EDITORIAL LUXURY HERO (NO Search/Animal Chips) ── */}
      <ShopHero onShopNow={scrollToCatalog} />

      {/* ── 2. MAIN CATALOG & UNIFIED FILTER ENGINE ── */}
      <div id="catalog" ref={catalogRef} className="scroll-mt-24 sm:scroll-mt-28">
        {/* ── STICKY UNIFIED FILTER & DISCOVERY BAR ── */}
        <div className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-xl border-y border-stone-200 shadow-sm py-3 sm:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            {/* Top Discovery Row: Live Search Input + Sort Dropdown + Mobile Filter Trigger */}
            <div className="flex items-center gap-3">
              {/* Live Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clinical food, medicines, supplements, toys, brands..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200/60 focus:bg-white text-xs sm:text-sm font-medium text-stone-900 placeholder:text-stone-400 border border-stone-200/80 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Drawer Trigger */}
              <button
                type="button"
                onClick={() => setShowFilterDrawer(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-xs font-bold text-stone-800 transition-all flex-shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Filters</span>
                {isAnyFilterActive && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative flex-shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-stone-100 hover:bg-stone-200/70 border border-stone-200 rounded-2xl px-4 py-2.5 pr-8 text-xs font-bold text-stone-900 cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Animal Species Selector Pills Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
                <Layers className="w-3 h-3 text-primary" />
                <span>Species:</span>
              </span>

              {/* All Pets Pill */}
              <button
                type="button"
                onClick={() => setActiveAnimal("")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 active:scale-95 ${
                  !activeAnimal || activeAnimal === "All"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/70"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>All Pets</span>
              </button>

              {/* Species Pills with Lucide Vector Icons */}
              {ANIMAL_OPTIONS.map((animal) => {
                const IconComp = ANIMAL_ICONS[animal.value] || Dog;
                const isSelected = activeAnimal === animal.value;

                return (
                  <button
                    key={animal.value}
                    type="button"
                    onClick={() =>
                      setActiveAnimal(isSelected ? "" : animal.value)
                    }
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 active:scale-95 ${
                      isSelected
                        ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/70"
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-primary"}`} />
                    <span>{animal.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Chips Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-stone-100">
              {/* All Categories Chip */}
              <button
                type="button"
                onClick={() => setActiveCategory("All")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${
                  activeCategory === "All"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/70"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>All Categories</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === "All" ? "bg-white/25 text-white" : "bg-stone-200 text-stone-600"
                }`}>
                  {products.length}
                </span>
              </button>

              {/* Category Chips with Lucide Icons */}
              {CATEGORY_OPTIONS.map((cat) => {
                const IconComp = CATEGORY_ICONS[cat.value] || Package;
                const isActive = activeCategory === cat.value;
                const count = categoryCounts[cat.value] || 0;

                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setActiveCategory(cat.value)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 active:scale-95 ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/70"
                    }`}
                  >
                    <IconComp className="w-3 h-3" />
                    <span>{cat.value}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-white/25 text-white" : "bg-stone-200 text-stone-600"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Filters Row with 1-Click Clear All */}
            {isAnyFilterActive && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                <span className="text-xs font-black text-stone-900 mr-1">
                  Active Filters:
                </span>

                {activeCategory !== "All" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    <span>Category: {activeCategory}</span>
                    <button
                      type="button"
                      onClick={() => setActiveCategory("All")}
                      aria-label="Remove category filter"
                      className="hover:bg-primary/20 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {activeAnimal && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary text-xs font-bold border border-secondary/20">
                    <span>Pet: {activeAnimal}</span>
                    <button
                      type="button"
                      onClick={() => setActiveAnimal("")}
                      aria-label="Remove pet filter"
                      className="hover:bg-secondary/20 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                    <span>&ldquo;{searchQuery}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Remove search query"
                      className="hover:bg-amber-200 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <span>In Stock</span>
                    <button
                      type="button"
                      onClick={() => setInStockOnly(false)}
                      aria-label="Remove in-stock filter"
                      className="hover:bg-emerald-200 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {priceRange[1] < maxProductPrice && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 text-xs font-bold border border-stone-200">
                    <span>Under ₹{priceRange[1].toLocaleString("en-IN")}</span>
                    <button
                      type="button"
                      onClick={() => setPriceRange([0, maxProductPrice])}
                      aria-label="Reset price filter"
                      className="hover:bg-stone-200 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-primary hover:underline ml-2"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN CATALOG CONTENT CONTAINER ── */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
            {/* ── DESKTOP COLLAPSIBLE SIDEBAR ── */}
            <aside className="hidden lg:block lg:col-span-1 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 sticky top-48">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h2 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Filter Catalog
                  </h2>
                </div>
                {isAnyFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* In-Stock Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/60">
                <label
                  htmlFor="inStockToggleDesktop"
                  className="text-xs font-bold text-stone-800 cursor-pointer"
                >
                  In-Stock Items Only
                </label>
                <input
                  id="inStockToggleDesktop"
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer accent-primary"
                />
              </div>

              {/* Price Range Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    Max Price
                  </span>
                  <span className="text-xs font-black text-primary">
                    ₹{priceRange[1].toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxProductPrice}
                  step="50"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-bold">
                  <span>₹0</span>
                  <span>₹{maxProductPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Categories Checklist */}
              <div className="space-y-2.5 border-t border-stone-200 pt-4">
                <span className="text-xs font-black text-stone-900 uppercase tracking-wider block">
                  Category
                </span>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1 scrollbar-none">
                  <label className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-stone-700 cursor-pointer hover:bg-stone-50 hover:text-primary">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="desktopCategoryGroup"
                        checked={activeCategory === "All"}
                        onChange={() => setActiveCategory("All")}
                        className="accent-primary"
                      />
                      <span>All Categories</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-bold">
                      {products.length}
                    </span>
                  </label>
                  {CATEGORY_OPTIONS.map((cat) => {
                    const count = categoryCounts[cat.value] || 0;
                    return (
                      <label
                        key={cat.value}
                        className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-stone-700 cursor-pointer hover:bg-stone-50 hover:text-primary"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="desktopCategoryGroup"
                            checked={activeCategory === cat.value}
                            onChange={() => setActiveCategory(cat.value)}
                            className="accent-primary"
                          />
                          <span>{cat.value}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-bold">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Target Species Checklist */}
              <div className="space-y-2.5 border-t border-stone-200 pt-4">
                <span className="text-xs font-black text-stone-900 uppercase tracking-wider block">
                  Target Species
                </span>
                <div className="space-y-1">
                  <label className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-stone-700 cursor-pointer hover:bg-stone-50 hover:text-primary">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="desktopAnimalGroup"
                        checked={!activeAnimal || activeAnimal === "All"}
                        onChange={() => setActiveAnimal("")}
                        className="accent-primary"
                      />
                      <span>All Species</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-bold">
                      {products.length}
                    </span>
                  </label>
                  {ANIMAL_OPTIONS.map((animal) => {
                    const AnimalIcon = ANIMAL_ICONS[animal.value] || Dog;
                    const count = animalCounts[animal.value] || 0;
                    return (
                      <label
                        key={animal.value}
                        className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-stone-700 cursor-pointer hover:bg-stone-50 hover:text-primary"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="desktopAnimalGroup"
                            checked={activeAnimal === animal.value}
                            onChange={() => setActiveAnimal(animal.value)}
                            className="accent-primary"
                          />
                          <AnimalIcon className="w-3.5 h-3.5 text-stone-500" />
                          <span>{animal.label}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-bold">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* ── RIGHT MAIN PRODUCT GRID ── */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                    {activeCategory !== "All"
                      ? `${activeCategory} Collection`
                      : activeAnimal
                      ? `${activeAnimal} Care Essentials`
                      : "Curated Store Catalog"}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Showing {filteredProducts.length} certified item{filteredProducts.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {loading ? (
                /* Loading Skeleton Grid */
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : visibleProducts.length === 0 ? (
                /* Polished Empty State */
                <div className="flex flex-col items-center justify-center text-center p-8 sm:p-16 bg-white rounded-3xl border border-dashed border-stone-200 my-4 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                    <Package className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-stone-900 mb-1">
                    No products matched your criteria
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-6 leading-relaxed">
                    We couldn&apos;t find any items matching your active search query or filter tags. Try resetting filters to explore the entire catalog.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/25 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              ) : (
                /* Responsive Product Grid: 2-col -> 3-col -> 4-col */
                <motion.div
                  layout
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
                >
                  <AnimatePresence>
                    {visibleProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ProductCard
                          product={product}
                          onAddToCart={() => handleAddToCart(product)}
                          onQuickView={() => handleQuickView(product)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── PAGINATION / LOAD MORE BUTTON ── */}
              {visibleCount < filteredProducts.length && (
                <div className="flex justify-center pt-8 pb-4">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 16)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 hover:border-primary/40 text-stone-800 text-xs sm:text-sm font-bold shadow-sm hover:shadow-md active:scale-95 transition-all"
                  >
                    <span>
                      Load More Products ({filteredProducts.length - visibleCount} remaining)
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. RECENTLY VIEWED PRODUCTS SECTION ── */}
          {recentlyViewedProducts.length > 0 && (
            <section className="mt-16 pt-12 border-t border-stone-200">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                    Recently Viewed Products
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Pick up right where you left off
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {recentlyViewedProducts.map((product) => (
                  <ProductCard
                    key={`recent-${product.id}`}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onQuickView={() => handleQuickView(product)}
                  />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ── MOBILE FILTER DRAWER SHEET ── */}
      {showFilterDrawer && (
        <div
          className="fixed inset-0 z-[200000] bg-black/60 backdrop-blur-sm lg:hidden flex flex-col justify-end"
          onClick={() => setShowFilterDrawer(false)}
        >
          <div
            className="bg-warm-surface w-full max-h-[85vh] rounded-t-3xl p-5 overflow-y-auto shadow-2xl border-t border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="text-base font-black text-stone-900">Filters</h3>
              <button
                type="button"
                onClick={() => setShowFilterDrawer(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"
                aria-label="Close filter drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* In stock toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-800">
                  In-Stock Items Only
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-primary accent-primary"
                />
              </div>

              {/* Price Range */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Max Price</span>
                  <span className="text-primary font-black">
                    ₹{priceRange[1].toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxProductPrice}
                  step="50"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                  className="w-full accent-primary"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-700">Category</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("All")}
                    className={`p-2.5 rounded-2xl text-xs font-bold text-left border ${
                      activeCategory === "All"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-stone-700 border-stone-200"
                    }`}
                  >
                    All Categories
                  </button>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setActiveCategory(cat.value)}
                      className={`p-2.5 rounded-2xl text-xs font-bold text-left border ${
                        activeCategory === cat.value
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-stone-700 border-stone-200"
                      }`}
                    >
                      {cat.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Species */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-700">
                  Target Species
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAnimal("")}
                    className={`p-2.5 rounded-2xl text-xs font-bold text-left border flex items-center gap-2 ${
                      !activeAnimal
                        ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                        : "bg-white text-stone-700 border-stone-200"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>All Pets</span>
                  </button>
                  {ANIMAL_OPTIONS.map((animal) => {
                    const AnimalIcon = ANIMAL_ICONS[animal.value] || Dog;
                    const isSelected = activeAnimal === animal.value;
                    return (
                      <button
                        key={animal.value}
                        type="button"
                        onClick={() => setActiveAnimal(animal.value)}
                        className={`p-2.5 rounded-2xl text-xs font-bold text-left border flex items-center gap-2 ${
                          isSelected
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-white text-stone-700 border-stone-200"
                        }`}
                      >
                        <AnimalIcon className="w-3.5 h-3.5" />
                        <span>{animal.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 py-3 rounded-2xl bg-white border border-stone-200 text-stone-800 text-xs font-bold"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterDrawer(false)}
                  className="flex-1 py-3 rounded-2xl bg-primary text-white text-xs font-bold shadow-md"
                >
                  Show Results ({filteredProducts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK VIEW MODAL ── */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* ── FLOATING COMPARE BAR ── */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`fixed ${
              totals.itemCount > 0 ? "bottom-24 sm:bottom-24" : "bottom-4 sm:bottom-6"
            } left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-stone-900 text-white rounded-3xl shadow-2xl border border-stone-700 p-3.5 flex items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                {compareList.slice(0, 3).map((prod) => (
                  <div
                    key={prod.id}
                    className="w-8 h-8 rounded-xl overflow-hidden border-2 border-stone-900 bg-stone-800 relative flex-shrink-0"
                  >
                    {prod.images?.[0] ? (
                      <Image
                        src={prod.images[0]}
                        alt={prod.name}
                        fill
                        sizes="32px"
                        unoptimized={
                          typeof prod.images[0] === "string" &&
                          (prod.images[0].includes("firebasestorage.googleapis.com") ||
                            prod.images[0].includes("storage.googleapis.com"))
                        }
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">
                  Comparing {compareList.length}/4 items
                </p>
                <p className="text-[10px] text-stone-400 truncate">
                  {compareList.map((p) => p.name).join(", ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={clearCompare}
                className="text-[11px] font-bold text-stone-400 hover:text-white px-2 py-1 transition-colors"
              >
                Clear
              </button>
              <Link
                href="/shop/compare"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/90 text-white text-xs font-bold transition-all shadow-sm"
              >
                <span>Compare</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING CART BOTTOM BAR ── */}
      <AnimatePresence>
        {totals.itemCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200 p-3.5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {totals.itemCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-stone-500 font-bold leading-tight">
                  {totals.itemCount} item{totals.itemCount !== 1 ? "s" : ""} in cart
                </p>
                <p className="text-sm sm:text-base font-black text-stone-900 tracking-tight leading-tight mt-0.5">
                  ₹{totals.subtotal.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-container active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/25 transition-all"
            >
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CART DRAWER (With live ₹499 Free Shipping Progress Bar) ── */}
      {isCartOpen && (
        <CartDrawer
          items={cartItems}
          total={totals.subtotal}
          onClose={() => setIsCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onBuyNow={() => {
            setIsCheckoutOpen(true);
            setIsCartOpen(false);
          }}
        />
      )}

      {/* ── CHECKOUT PANEL ── */}
      {isCheckoutOpen && (
        <CheckoutPanel
          items={cartItems}
          onBackToCart={() => {
            setIsCheckoutOpen(false);
            setIsCartOpen(true);
          }}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderPlaced={(_orderId) => {
            clear();
            setIsCheckoutOpen(false);
            showToast("Order placed successfully!", "success");
          }}
        />
      )}

      {/* ── TOAST NOTIFICATIONS STACK ── */}
      <div
        className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[200000] flex flex-col gap-2 items-center pointer-events-none w-full max-w-sm px-4"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => dismissToast(toast.id)}
              className="pointer-events-auto w-full flex items-center gap-3 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-700 cursor-pointer"
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : toast.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : (
                <Package className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}
              <p className="text-xs font-bold flex-1 truncate">{toast.message}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                }}
                className="text-stone-400 hover:text-white"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EXPORT DEFAULT WITH GSAP, LENIS & CART PROVIDERS
   ═══════════════════════════════════════════════════ */
export default function ShopPage() {
  return (
    <GSAPRegistration>
      <SmoothScrollProvider>
        <CartProvider>
          <FullShopContent />
        </CartProvider>
      </SmoothScrollProvider>
    </GSAPRegistration>
  );
}
