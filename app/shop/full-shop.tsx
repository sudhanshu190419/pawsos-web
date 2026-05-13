"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import Image from "next/image";
import { auth, db, storage } from "../lib/firebase";
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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createPortal } from "react-dom";
import { Sparkles, Bone, Pill, Circle, Activity } from "lucide-react";
import ShopHeader from "../components/ShopHeader";
import ProductCard from "../components/ProductCard";
import CheckoutPanel from "../components/CheckoutPanel";
import CartDrawer from "../components/CartDrawer";

/* ═══════════════════════════════════════════════════
   GLOBAL STYLES (injected once)
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
    @keyframes pet-card-in {
      0%   { opacity: 0; transform: translateY(12px) scale(0.96); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes active-glow {
      0%, 100% { box-shadow: 0 8px 24px rgba(249,115,22,0.18); }
      50%      { box-shadow: 0 12px 28px rgba(249,115,22,0.30); }
    }
    @keyframes cart-backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes cart-drawer-in {
      from { opacity: 0; transform: translateX(24px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(16px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toast-out {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(16px) scale(0.95); }
    }
    @keyframes modal-overlay-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes modal-content-in {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes bounce-in {
      0%   { transform: scale(0); }
      50%  { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { scrollbar-width: none; }
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
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Blob creation failed"))),
          "image/webp",
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

/* ═══════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   ═══════════════════════════════════════════════════ */
type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

let toastId = 0;

const ToastIcon = ({ type }: { type: ToastType }) => {
  if (type === "success")
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    );
  if (type === "error")
    return (
      <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  return (
    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </div>
  );
};

const ToastContainer = ({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) => {
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200000] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          onClick={() => onDismiss(t.id)}
          className="pointer-events-auto flex items-center gap-3 bg-white border border-slate-200 shadow-2xl rounded-2xl px-4 py-3 min-w-[280px] max-w-sm cursor-pointer hover:shadow-lg transition-shadow"
          style={{ animation: "toast-in 300ms ease-out" }}
        >
          <ToastIcon type={t.type} />
          <p className="text-sm font-semibold text-slate-800 flex-1">{t.message}</p>
        </div>
      ))}
    </div>,
    document.body
  );
};

/* ═══════════════════════════════════════════════════
   OPTIMIZED PRODUCT IMAGE (memoized)
   ═══════════════════════════════════════════════════ */
const ProductImage = memo(
  ({ src, alt, index }: { src: string; alt: string; index: number }) => {
    const optimizedSrc = `${src}?alt=media&width=300`;
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const isEager = false;

    return (
      <div className="w-full h-36 sm:h-40 rounded-xl mb-2 overflow-hidden relative bg-slate-50">
        {!loaded && !error && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-shimmer" />
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-1">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5l.75-.75M18 3.75h.008v.008H18V3.75z" />
            </svg>
            <span className="text-[10px] font-medium">Image unavailable</span>
          </div>
        )}
        {!error && (
  <>
    {index === 0 && (
      <link rel="preload" as="image" href={optimizedSrc} />
    )}

    <img
      src={optimizedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      width="300"
      height="300"
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      className={`w-full h-full object-cover transition-all duration-500 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  </>
)}
      </div>
    );
  }
);
ProductImage.displayName = "ProductImage";

/* ═══════════════════════════════════════════════════
   PRODUCT CARD SKELETON
   ═══════════════════════════════════════════════════ */
const ProductCardSkeleton = memo(() => (
  <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col animate-pulse min-w-[180px] sm:min-w-[220px]">
    <div className="w-full h-36 sm:h-40 bg-slate-100 rounded-xl mb-2" />
    <div className="px-1 space-y-2 flex-1">
      <div className="h-4 bg-slate-100 rounded-full w-3/4" />
      <div className="h-3 bg-slate-50 rounded-full w-1/2" />
      <div className="h-3 bg-slate-50 rounded-full w-full" />
      <div className="flex justify-between items-center pt-3 mt-auto border-t border-slate-50">
        <div className="h-5 bg-slate-100 rounded-full w-1/4" />
        <div className="w-8 h-8 bg-slate-100 rounded-full" />
      </div>
    </div>
  </div>
));
ProductCardSkeleton.displayName = "ProductCardSkeleton";

/* ═══════════════════════════════════════════════════
   CART DRAWER (extracted component)
   ═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   ADD PRODUCT MODAL (extracted component)
   ═══════════════════════════════════════════════════ */
const AddProductModal = memo(
  ({
    onClose,
    onSubmit,
    isUploading,
  }: {
    onClose: () => void;
    onSubmit: (data: {
      name: string;
      price: string;
      category: string;
      animal: string;
      description: string;
      image: File | null;
    }) => void;
    isUploading: boolean;
  }) => {
    const [form, setForm] = useState({
      name: "",
      price: "",
      category: "Medicine",
      animal: "Dog",
      description: "",
      image: null as File | null,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handler);
        document.body.style.overflow = "";
      };
    }, [onClose]);
    

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setForm((prev) => ({ ...prev, image: file }));
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    };

    const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "modal-overlay-in 200ms ease-out" }}
        role="dialog"
        aria-modal="true"
        aria-label="Add new product"
      >
        <div
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "modal-content-in 300ms cubic-bezier(0.16,1,0.3,1)" }}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-800">Add New Product</h2>
              <p className="text-xs text-slate-400 mt-0.5">Fill in details to list your product</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form);
            }}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
          >
            {/* Image Upload */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Product Image *
              </label>
              {imagePreview ? (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, image: null }));
                        setImagePreview(null);
                      }}
                      className="px-4 py-2 bg-red-500 rounded-xl text-xs font-bold text-white hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-orange-500 transition-all bg-slate-50/50"
                >
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5l.75-.75M18 3.75h.008v.008H18V3.75z" />
                  </svg>
                  <span className="text-xs font-semibold">Click to upload product image</span>
                  <span className="text-[10px] text-slate-300">PNG, JPG, WEBP up to 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 font-medium text-sm transition-all"
                required
                placeholder="e.g. Tick & Flea Spray"
              />
            </div>

            {/* Price + Category row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 font-bold text-sm transition-all"
                  required
                  placeholder="299"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <div className="group relative">
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-2xl border border-orange-100/80 bg-gradient-to-r from-white via-orange-50/45 to-white px-4 pr-10 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_26px_-20px_rgba(249,115,22,0.55)] outline-none transition-all duration-200 hover:border-orange-300 hover:shadow-[0_14px_28px_-20px_rgba(249,115,22,0.6)] focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option>Medicine</option>
                    <option>Food</option>
                    <option>Toys</option>
                    <option>Bandages</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors duration-200 group-hover:text-orange-500 group-focus-within:text-orange-500">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M5.5 7.5L10 12l4.5-4.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Animal Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Animal Type *
              </label>
              <div className="flex flex-wrap gap-2">
                {["Dog", "Cat", "Bird", "Fish", "Rabbit"].map((animal) => (
                  <button
                    key={animal}
                    type="button"
                    onClick={() => update("animal", animal)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                      form.animal === animal
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200"
                        : "bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    {animal}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Short Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 font-medium resize-none text-sm transition-all"
                placeholder="Describe the product and its benefits..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isUploading || !form.name || !form.price || !form.image}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-base hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Compressing &amp; Uploading…
                </span>
              ) : (
                "List Product"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }
);
AddProductModal.displayName = "AddProductModal";

/* ═══════════════════════════════════════════════════
   ANIMAL DATA + CATEGORY DATA (static, outside render)
   ═══════════════════════════════════════════════════ */
const ANIMALS = [
  { name: "Dog", image: "/dog.png", filterValue: "Dog" },
  { name: "Cat", image: "/cat.png", filterValue: "Cat" },
  { name: "Pet parent", image: "/pet-parent.png", filterValue: "Dog" },
  { name: "Fish", image: "/fish.png", filterValue: "Fish" },
  { name: "Rabbit", image: "/rabbit.png", filterValue: "Rabbit" },
  { name: "Bird", image: "/bird.png", filterValue: "Bird" },
] as const;

const CATEGORIES: { name: string; icon: React.ElementType }[] = [
  { name: "All",      icon: Sparkles },
  { name: "Food",     icon: Bone },
  { name: "Medicine", icon: Pill },
  { name: "Toys",     icon: Circle },
  { name: "Bandages", icon: Activity },
] as const;

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function ShopPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isVet, setIsVet] = useState(false);
  const [vetClinicName, setVetClinicName] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeAnimal, setActiveAnimal] = useState("");
  const [selectedAnimalCard, setSelectedAnimalCard] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const productRailRef = useRef<HTMLDivElement>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  // Toast system
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auth check
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
        } catch (e) {
          console.error("Vet check failed:", e);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
  const stored = localStorage.getItem("cart");
  if (stored) setCartItems(JSON.parse(stored));
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    // notify other components/tabs in this window
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: cartItems }));
  } catch (e) {
    console.error("Failed to persist cart:", e);
  }
}, [cartItems]);

// Listen for cart updates from other components/tabs
useEffect(() => {
  if (typeof window === "undefined") return;
  const handler = (e: Event) => {
    try {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) setCartItems(detail);
    } catch (err) {
      // ignore
    }
  };
  window.addEventListener("cart-updated", handler as EventListener);
  return () => window.removeEventListener("cart-updated", handler as EventListener);
}, []);
  // Firestore realtime listener
  useEffect(() => {
    const q = query(collection(db, "shop_products"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);
  // Reset visible products when filters change
useEffect(() => {
  setVisibleCount(8);
}, [activeCategory, activeAnimal, searchQuery]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeCategory !== "All") result = result.filter((p) => p.category === activeCategory);
    if (activeAnimal) result = result.filter((p) => p.animal === activeAnimal);
    if (searchQuery) result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [products, activeCategory, activeAnimal, searchQuery]);

  const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/10 selection:text-primary">
      <GlobalStyles />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <ShopHeader
        cartCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
        user={user}
        onAddProduct={isVet ? () => setShowAddModal(true) : undefined}
      />

      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Search & Filters */}
        <div className="mb-12 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All", "Medicine", "Nutrition", "Toys", "Accessories"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Animal Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {ANIMALS.map((animal) => (
              <button
                key={animal.name}
                onClick={() => setActiveAnimal(activeAnimal === animal.name ? "" : animal.name)}
                className={`px-3 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2 ${
                  activeAnimal === animal.name
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span className="text-lg">{animal.name === "Dog" ? "🐕" : animal.name === "Cat" ? "🐈" : "🐾"}</span>
                {animal.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-12">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-slate-500 font-medium">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => {
                    setCartItems((prev) => {
                      const existing = prev.find((item) => item.id === product.id);
                      if (existing) {
                        return prev.map((item) =>
                          item.id === product.id ? { ...item, qty: (item.qty || 1) + 1 } : item
                        );
                      }
                      return [...prev, { ...product, qty: 1 }];
                    });
                    showToast(`Added ${product.name} to cart!`);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {visibleCount < filteredProducts.length && (
          <div className="flex justify-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 8)}
              className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-container transition-all"
            >
              Load More Products
            </button>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          items={cartItems}
          total={cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0)}
          onClose={() => setIsCartOpen(false)}
          onUpdateQty={(id, delta) => {
            setCartItems((prev) =>
              prev.map((item) =>
                item.id === id
                  ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) }
                  : item
              ).filter((item) => item.qty > 0)
            );
          }}
          onRemove={(id) => setCartItems((prev) => prev.filter((item) => item.id !== id))}
          onBuyNow={() => {
            setIsCheckoutOpen(true);
            setIsCartOpen(false);
          }}
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
              showToast("Product added successfully!");
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
          total={cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0)}
          onBackToCart={() => {
            setIsCheckoutOpen(false);
            setIsCartOpen(true);
          }}
          onClose={() => setIsCheckoutOpen(false)}
          onPlaceOrder={() => {
            setCartItems([]);
            setIsCheckoutOpen(false);
            showToast("Order placed successfully!", "success");
          }}
        />
      )}
    </div>
  );
}
