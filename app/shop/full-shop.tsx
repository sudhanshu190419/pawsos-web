"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import Image from "next/image";
import { auth, db, storage } from "../lib/firebase";
import { CartProvider, useCart } from "../components/cart";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  limit,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createPortal } from "react-dom";
import { Sparkles, Bone, Pill, Circle, Activity, Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import ShopHeader from "../components/ShopHeader";
import ProductCard from "../components/ProductCard";
import CheckoutPanel from "../components/CheckoutPanel";
import CartDrawer from "../components/CartDrawer";
import ShopHero, { HeroStyles } from "../components/ShopHero"; // ← NEW

/* ═══════════════════════════════════════════════════
   GLOBAL STYLES
   ═══════════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .animate-shimmer {
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes modal-overlay-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes modal-content-in {
      from { opacity: 0; transform: scale(0.97) translateY(6px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes sheet-in {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { scrollbar-width: none; }
    @media (max-width: 640px) {
      .filter-chip { min-height: 36px; }
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════
   IMAGE COMPRESSION
   ═══════════════════════════════════════════════════ */
const compressImage = (file: File, maxSize = 300, quality = 0.5): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
        else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Blob creation failed"))),
          "image/webp", quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

/* ═══════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════ */
type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };
let toastId = 0;

const ToastContainer = ({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) => {
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200000] flex flex-col gap-1.5 items-center pointer-events-none w-[calc(100%-2rem)] max-w-xs sm:max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          onClick={() => onDismiss(t.id)}
          className="pointer-events-auto w-full flex items-center gap-2.5 bg-white border border-neutral-200 shadow-lg rounded-xl px-3.5 py-2.5 cursor-pointer"
          style={{ animation: "toast-in 250ms ease-out" }}
        >
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.type === "success" ? "bg-emerald-500" : t.type === "error" ? "bg-red-500" : "bg-blue-500"}`} />
          <p className="text-[13px] font-medium text-neutral-800 flex-1 truncate">{t.message}</p>
          <button onClick={(e) => { e.stopPropagation(); onDismiss(t.id); }} className="text-neutral-300 flex-shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};

/* ═══════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════ */
const ProductCardSkeleton = memo(() => (
  <div className="bg-white rounded-xl border border-neutral-100 flex flex-col animate-pulse overflow-hidden">
    <div className="w-full aspect-square bg-neutral-100" />
    <div className="p-2.5 space-y-1.5">
      <div className="h-3 bg-neutral-100 rounded w-3/4" />
      <div className="h-3 bg-neutral-50 rounded w-1/2" />
      <div className="flex justify-between items-center pt-1.5">
        <div className="h-3.5 bg-neutral-100 rounded w-1/4" />
        <div className="w-6 h-6 bg-neutral-100 rounded-lg" />
      </div>
    </div>
  </div>
));
ProductCardSkeleton.displayName = "ProductCardSkeleton";

/* ═══════════════════════════════════════════════════
   FILTER DRAWER
   ═══════════════════════════════════════════════════ */
const FilterDrawer = memo(({
  activeCategory,
  activeAnimal,
  onCategoryChange,
  onAnimalChange,
  onClose,
  categories,
  animals,
}: {
  activeCategory: string;
  activeAnimal: string;
  onCategoryChange: (c: string) => void;
  onAnimalChange: (a: string) => void;
  onClose: () => void;
  categories: typeof CATEGORIES;
  animals: typeof ANIMALS;
}) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const hasFilters = activeCategory !== "All" || activeAnimal;

  return createPortal(
    <div
      className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-[1px]"
      onClick={onClose}
      style={{ animation: "modal-overlay-in 180ms ease-out" }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "sheet-in 280ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-neutral-200 rounded-full" />
        </div>
        <div className="px-4 pb-6 pt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-neutral-900">Filters</h3>
            {hasFilters && (
              <button onClick={() => { onCategoryChange("All"); onAnimalChange(""); }} className="text-[12px] font-semibold text-orange-500">
                Clear all
              </button>
            )}
          </div>
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Category</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categories.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => { onCategoryChange(name); }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all filter-chip ${
                  activeCategory === name ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200"
                }`}
              >
                <Icon className="w-3 h-3" strokeWidth={2} />
                {name}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Animal</p>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {animals.map((animal) => (
              <button
                key={animal.name}
                onClick={() => onAnimalChange(activeAnimal === animal.filterValue ? "" : animal.filterValue)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all filter-chip ${
                  activeAnimal === animal.filterValue ? "bg-orange-500 text-white border-orange-500" : "bg-white text-neutral-600 border-neutral-200"
                }`}
              >
                <span className="text-sm leading-none">{animal.emoji}</span>
                {animal.name}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="w-full bg-neutral-900 text-white py-3 rounded-xl text-[13px] font-semibold">
            Show Results
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});
FilterDrawer.displayName = "FilterDrawer";

/* ═══════════════════════════════════════════════════
   ADD PRODUCT MODAL
   ═══════════════════════════════════════════════════ */
const AddProductModal = memo(({
  onClose,
  onSubmit,
  isUploading,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; price: string; category: string; animal: string; description: string; image: File | null }) => void;
  isUploading: boolean;
}) => {
  const [form, setForm] = useState({ name: "", price: "", category: "Medicine", animal: "Dog", description: "", image: null as File | null });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, image: file }));
    if (file) { const r = new FileReader(); r.onload = (ev) => setImagePreview(ev.target?.result as string); r.readAsDataURL(file); }
    else setImagePreview(null);
  };

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const inputCls = "w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 text-[14px] sm:text-[13px] font-medium text-neutral-800 outline-none focus:ring-1 focus:ring-neutral-900/20 focus:border-neutral-500 transition-all placeholder:text-neutral-400";
  const labelCls = "block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1";

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
      style={{ animation: "modal-overlay-in 180ms ease-out" }}
      role="dialog" aria-modal="true"
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl relative max-h-[95vh] sm:max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-9 h-1 bg-neutral-200 rounded-full" />
        </div>
        <div className="flex justify-between items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-[15px] font-bold text-neutral-900">Add New Product</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5 hidden sm:block">Fill in details to list your product</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors" aria-label="Close">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          <div>
            <label className={labelCls}>Product Image *</label>
            {imagePreview ? (
              <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden border border-neutral-200 group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white rounded-lg text-[11px] font-semibold text-neutral-700">Change</button>
                  <button type="button" onClick={() => { setForm((p) => ({ ...p, image: null })); setImagePreview(null); }} className="px-3 py-1.5 bg-red-500 rounded-lg text-[11px] font-semibold text-white">Remove</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 sm:h-36 rounded-xl border border-dashed border-neutral-300 hover:border-neutral-500 flex flex-col items-center justify-center gap-1.5 text-neutral-400 hover:text-neutral-600 transition-all bg-neutral-50/50 active:bg-neutral-100">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5l.75-.75M18 3.75h.008v.008H18V3.75z" />
                </svg>
                <span className="text-[12px] font-medium">Tap to upload image</span>
                <span className="text-[10px] text-neutral-300">PNG, JPG, WEBP · max 5MB</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
          <div>
            <label className={labelCls}>Product Name *</label>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} required placeholder="e.g. Tick & Flea Spray" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Price (₹) *</label>
              <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} className={inputCls} required placeholder="299" min="1" inputMode="numeric" />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <div className="relative">
                <select value={form.category} onChange={(e) => update("category", e.target.value)} className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                  <option>Medicine</option><option>Food</option><option>Toys</option><option>Bandages</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Animal Type *</label>
            <div className="flex flex-wrap gap-1.5">
              {["Dog", "Cat", "Bird", "Fish", "Rabbit"].map((animal) => (
                <button key={animal} type="button" onClick={() => update("animal", animal)}
                  className={`px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all filter-chip ${form.animal === animal ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200"}`}>
                  {animal}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} className={`${inputCls} resize-none`} placeholder="Describe the product and its benefits…" />
          </div>
          <button type="submit" disabled={isUploading || !form.name || !form.price || !form.image}
            className="w-full bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white py-3 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading…
              </span>
            ) : "List Product"}
          </button>
        </form>
      </div>
    </div>
  );
});
AddProductModal.displayName = "AddProductModal";

/* ═══════════════════════════════════════════════════
   STATIC DATA
   ═══════════════════════════════════════════════════ */
const ANIMALS = [
  { name: "Dog",        filterValue: "Dog",    emoji: "🐕" },
  { name: "Cat",        filterValue: "Cat",    emoji: "🐈" },
  { name: "Pet Parent", filterValue: "Dog",    emoji: "👤" },
  { name: "Fish",       filterValue: "Fish",   emoji: "🐟" },
  { name: "Rabbit",     filterValue: "Rabbit", emoji: "🐇" },
  { name: "Bird",       filterValue: "Bird",   emoji: "🐦" },
] as const;

const CATEGORIES: { name: string; icon: React.ElementType }[] = [
  { name: "All",      icon: Sparkles },
  { name: "Food",     icon: Bone },
  { name: "Medicine", icon: Pill },
  { name: "Toys",     icon: Circle },
  { name: "Bandages", icon: Activity },
];

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
function ShopPageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isVet, setIsVet] = useState(false);
  const [vetClinicName, setVetClinicName] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeAnimal, setActiveAnimal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const { items: cartItems, totals, addItem, updateQty, removeItem, clear } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  /* ── Ref to scroll to products section ── */
  const productsRef = useRef<HTMLDivElement>(null);
  const scrollToProducts = useCallback(() => {
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* Auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const vetDoc = await getDoc(doc(db, "vets_web", currentUser.uid));
          if (vetDoc.exists() && vetDoc.data().verificationStatus === "approved") {
            setIsVet(true);
            setVetClinicName(vetDoc.data().clinicName || "Verified Clinic");
          }
        } catch (e) { console.error("Vet check failed:", e); }
      }
    });
    return () => unsub();
  }, []);


  /* Firestore */
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const raw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const mapped = raw.map((item: any) => ({
        ...item,
        images: Array.isArray(item.images) ? item.images : item.imageUrl ? [item.imageUrl] : [],
        clinicName: item.clinicName ?? item.vetClinicName ?? "",
        imageUrl: item.imageUrl ?? item.images?.[0] ?? "",
        vetClinicName: item.vetClinicName ?? item.clinicName ?? "",
      }));
      console.log("[Shop] fetched products raw:", raw);
      console.log("[Shop] mapped products:", mapped);
      setProducts(mapped);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    console.log("[Shop] final render products:", products);
  }, [products]);

  useEffect(() => { setVisibleCount(16); }, [activeCategory, activeAnimal, searchQuery]);

  const filteredProducts = useMemo(() => {
    let result = products;
    result = result.filter((p) => (p.status ?? "active") === "active");
    if (activeCategory !== "All") result = result.filter((p) => p.category === activeCategory);
    if (activeAnimal) result = result.filter((p) => p.animal === activeAnimal);
    if (searchQuery) result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [products, activeCategory, activeAnimal, searchQuery]);

  const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);
  const cartTotal = totals.subtotal;

  const handleAddToCart = useCallback((product: any) => {
    const result = addItem(product, 1);
    if (result.ok) showToast(`${product.name} added to cart`);
    else showToast(result.reason, "error");
  }, [addItem, showToast]);

  const activeFilterCount = (activeCategory !== "All" ? 1 : 0) + (activeAnimal ? 1 : 0);
  const clearFilters = useCallback(() => { setActiveCategory("All"); setActiveAnimal(""); setSearchQuery(""); }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <GlobalStyles />
      <HeroStyles />  {/* ← hero font + animation styles */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <ShopHeader
        cartCount={totals.itemCount}
        onCartClick={() => setIsCartOpen(true)}
        user={user}
        onAddProduct={isVet ? () => setShowAddModal(true) : undefined}
      />

      {/* ══════════════════════════════════════════
          HERO SECTION  ← NEW
          ══════════════════════════════════════════ */}
      <ShopHero
        onShopNow={scrollToProducts}
        onExplore={scrollToProducts}
      />

      {/* ══════════════════════════════════════════
          SEARCH + FILTERS + PRODUCTS
          ══════════════════════════════════════════ */}
      <main
        ref={productsRef}
        className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6"
      >
        {/* ── Search + Filters ── */}
        <div className="mb-4 sm:mb-6 space-y-2.5 sm:space-y-3">

          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 sm:py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[14px] sm:text-[13px] font-medium text-neutral-800 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-neutral-900/20 focus:border-neutral-400 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilterDrawer(true)}
              className="sm:hidden flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-700 bg-white relative"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Category filter — desktop */}
          <div className="hidden sm:flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {CATEGORIES.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setActiveCategory(name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap border transition-all ${
                  activeCategory === name
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900"
                }`}
              >
                <Icon className="w-3 h-3" strokeWidth={2} />
                {name}
              </button>
            ))}
          </div>

          {/* Animal filter — desktop */}
          <div className="hidden sm:flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {ANIMALS.map((animal) => (
              <button
                key={animal.name}
                onClick={() => setActiveAnimal(activeAnimal === animal.filterValue ? "" : animal.filterValue)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap border transition-all ${
                  activeAnimal === animal.filterValue
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <span className="text-sm leading-none">{animal.emoji}</span>
                {animal.name}
              </button>
            ))}
          </div>

          {/* Active filter chips on mobile */}
          {activeFilterCount > 0 && (
            <div className="flex sm:hidden gap-1.5 flex-wrap">
              {activeCategory !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-900 text-white rounded-lg text-[11px] font-semibold">
                  {activeCategory}
                  <button onClick={() => setActiveCategory("All")}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {activeAnimal && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white rounded-lg text-[11px] font-semibold">
                  {activeAnimal}
                  <button onClick={() => setActiveAnimal("")}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
            </div>
          )}

          {/* Result count */}
          {!loading && (
            <p className="text-[11px] text-neutral-400 font-medium">
              {filteredProducts.length === 0 ? "No products found" : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""}`}
              {(activeCategory !== "All" || activeAnimal || searchQuery) && (
                <button onClick={clearFilters} className="ml-2 text-orange-500 underline underline-offset-2">
                  Clear all
                </button>
              )}
            </p>
          )}
        </div>

        {/* ── Products Grid ── */}
        <div className="mb-6 sm:mb-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
              {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="text-center py-16 sm:py-20 border border-dashed border-neutral-200 rounded-xl">
              <p className="text-2xl mb-2">📦</p>
              <p className="text-sm font-medium text-neutral-500">No products match your filters</p>
              <button onClick={clearFilters} className="mt-2 text-[12px] font-semibold text-orange-500 underline underline-offset-2">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                  priority={index < 16}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Load More ── */}
        {visibleCount < filteredProducts.length && (
          <div className="flex justify-center pb-4">
            <button
              onClick={() => setVisibleCount((prev) => prev + 16)}
              className="px-6 py-2.5 sm:py-2 border border-neutral-200 rounded-lg text-[13px] font-semibold text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 active:bg-neutral-100 transition-all"
            >
              Load more · {filteredProducts.length - visibleCount} remaining
            </button>
          </div>
        )}
      </main>

      {/* Mobile Filter Drawer */}
      {showFilterDrawer && (
        <FilterDrawer
          activeCategory={activeCategory}
          activeAnimal={activeAnimal}
          onCategoryChange={setActiveCategory}
          onAnimalChange={setActiveAnimal}
          onClose={() => setShowFilterDrawer(false)}
          categories={CATEGORIES}
          animals={ANIMALS}
        />
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          items={cartItems}
          total={cartTotal}
          onClose={() => setIsCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onBuyNow={() => { setIsCheckoutOpen(true); setIsCartOpen(false); }}
        />
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            setIsUploading(true);
            try {
              let imageUrl = "";
              if (data.image && user) {
                const storageRef = ref(storage, `shop_products/${user.uid}_${Date.now()}`);
                await uploadBytes(storageRef, data.image);
                imageUrl = await getDownloadURL(storageRef);
              }
              await addDoc(collection(db, "shop_products"), {
                name: data.name,
                price: Number(data.price),
                category: data.category,
                animal: data.animal,
                description: data.description,
                imageUrl,
                vetClinicName,
                vetUserId: user?.uid,
                createdAt: serverTimestamp(),
              });
              showToast("Product listed successfully");
              setShowAddModal(false);
            } catch (error: any) {
              showToast(error.message, "error");
            }
            setIsUploading(false);
          }}
          isUploading={isUploading}
        />
      )}

      {/* Checkout Panel */}
      {isCheckoutOpen && (
        <CheckoutPanel
          items={cartItems}
          total={cartTotal}
          onBackToCart={() => { setIsCheckoutOpen(false); setIsCartOpen(true); }}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderPlaced={() => { clear(); setIsCheckoutOpen(false); showToast("Order placed successfully!"); }}
        />
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <CartProvider>
      <ShopPageContent />
    </CartProvider>
  );
}
