"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
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
import ShopHeader from "../components/ShopHeader";
import ProductCard from "../components/ProductCard";
import CheckoutPanel from "../components/CheckoutPanel";

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
const compressImage = (file: File, maxSize = 500, quality = 0.7): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
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
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const isEager = index < 4;

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
          <img
            src={src}
            alt={alt}
            loading={isEager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
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
const CartDrawer = memo(
  ({
    items,
    total,
    onClose,
    onUpdateQty,
    onRemove,
    onBuyNow,
  }: {
    items: any[];
    total: number;
    onClose: () => void;
    onUpdateQty: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onBuyNow: () => void;
  }) => {
    // Focus trap: close on Escape
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

    return (
      <div
        className="fixed inset-0 z-[100000] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        style={{ animation: "cart-backdrop-in 220ms ease-out" }}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <aside
          className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "cart-drawer-in 280ms cubic-bezier(0.22,1,0.36,1)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Your Cart</h3>
                <p className="text-xs text-slate-400">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-700">Your cart is empty</p>
                <p className="text-sm text-slate-400 mt-1">Add items to get started</p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 text-sm font-semibold text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                  style={{ animation: `fade-up 300ms ease-out ${idx * 50}ms both` }}
                >
                  <div className="flex gap-3">
                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.vetClinicName || "Verified Clinic"}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-extrabold text-slate-900">
                          ₹{((Number(item.price) || 0) * (item.qty || 1)).toLocaleString("en-IN")}
                        </p>
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-base"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-slate-800">{item.qty || 1}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-base"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="self-start w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-slate-100 p-4 space-y-3 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Subtotal</p>
                  <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                    ₹{total.toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full font-medium">
                  Taxes calculated at checkout
                </span>
              </div>
              <button
                type="button"
                onClick={onBuyNow}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
              >
                Proceed to Checkout →
              </button>
            </div>
          )}
        </aside>
      </div>
    );
  }
);
CartDrawer.displayName = "CartDrawer";

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
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 font-medium cursor-pointer text-sm transition-all appearance-none"
                >
                  <option>Medicine</option>
                  <option>Food</option>
                  <option>Toys</option>
                  <option>Bandages</option>
                </select>
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

const CATEGORIES = [
  { name: "All", icon: "✨" },
  { name: "Food", icon: "🍖" },
  { name: "Medicine", icon: "💊" },
  { name: "Toys", icon: "🎾" },
  { name: "Bandages", icon: "🩹" },
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
  const [activeAnimal, setActiveAnimal] = useState("Dog");
  const [searchQuery, setSearchQuery] = useState("");

  const productRailRef = useRef<HTMLDivElement>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
  localStorage.setItem("cart", JSON.stringify(cartItems));
}, [cartItems]);
  // Firestore realtime listener
  useEffect(() => {
    const q = query(collection(db, "shop_products"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Utility
  const normalize = useCallback(
    (value: unknown) => String(value ?? "").trim().toLowerCase(),
    []
  );

  // Filtered products (memoized)
  const filteredProducts = useMemo(() => {
    let result = products.filter(
      (p) =>
        (p.animal ? normalize(p.animal) === normalize(activeAnimal) : true) &&
        (normalize(activeCategory) === "all" || normalize(p.category) === normalize(activeCategory))
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          normalize(p.name).includes(q) ||
          normalize(p.description).includes(q) ||
          normalize(p.vetClinicName).includes(q)
      );
    }
    return result;
  }, [products, activeAnimal, activeCategory, searchQuery, normalize]);

  // Add product handler
  const handleAddProduct = useCallback(
    async (formData: {
      name: string;
      price: string;
      category: string;
      animal: string;
      description: string;
      image: File | null;
    }) => {
      if (!user || !formData.image || !formData.name || !formData.price) {
        showToast("Please fill all required fields and upload an image.", "error");
        return;
      }
      setIsUploading(true);
      try {
        const compressed = await compressImage(formData.image);
        const storageRef = ref(storage, `shop_images/${user.uid}_${Date.now()}.webp`);
        await uploadBytes(storageRef, compressed);
        const imageUrl = await getDownloadURL(storageRef);

        await addDoc(collection(db, "shop_products"), {
          name: formData.name,
          price: Number(formData.price),
          category: formData.category,
          animal: formData.animal,
          description: formData.description,
          imageUrl,
          vetId: user.uid,
          vetClinicName,
          createdAt: serverTimestamp(),
        });

        setShowAddModal(false);
        showToast("Product added successfully! 🎉", "success");
      } catch (e) {
        console.error("Upload failed:", e);
        showToast("Failed to add product. Please try again.", "error");
      } finally {
        setIsUploading(false);
      }
    },
    [user, vetClinicName, showToast]
  );

  // Scroll management
  useEffect(() => {
    const rail = productRailRef.current;
    if (!rail) return;

    const updateButtons = () => {
      const maxLeft = rail.scrollWidth - rail.clientWidth;
      setCanScrollLeft(rail.scrollLeft > 4);
      setCanScrollRight(rail.scrollLeft < maxLeft - 4);
    };

    updateButtons();
    rail.addEventListener("scroll", updateButtons, { passive: true });
    const resizeObs = new ResizeObserver(updateButtons);
    resizeObs.observe(rail);

    return () => {
      rail.removeEventListener("scroll", updateButtons);
      resizeObs.disconnect();
    };
  }, [filteredProducts.length]);

  const scrollProductRail = useCallback((direction: "left" | "right") => {
    productRailRef.current?.scrollBy({
      left: direction === "right" ? 340 : -340,
      behavior: "smooth",
    });
  }, []);

  // Cart operations
  const handleAddToCart = useCallback(
    (product: any) => {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, qty: (item.qty || 1) + 1 } : item
          );
        }
        return [...prev, { ...product, qty: 1 }];
      });
      setIsCartOpen(true);
      showToast(`${product.name} added to cart`, "success");
    },
    [showToast]
  );

  const handleCartClick = useCallback(() => setIsCartOpen(true), []);

  const updateCartQty = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, qty: Math.max(0, (item.qty || 1) + delta) } : item
        )
        .filter((item) => (item.qty || 0) > 0)
    );
  }, []);

  const removeFromCart = useCallback(
    (productId: string) => {
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
      showToast("Item removed from cart", "info");
    },
    [showToast]
  );

  const handleBuyNow = useCallback(() => {
    if (cartItems.length === 0) return;
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, [cartItems.length]);

  const handleBackToCart = useCallback(() => {
    setIsCheckoutOpen(false);
    setIsCartOpen(true);
  }, []);

  const handlePlaceOrder = useCallback(() => {
    setCartItems([]);
    setIsCheckoutOpen(false);
    showToast("Order placed successfully! 🎉", "success");
  }, [showToast]);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0),
    [cartItems]
  );

  return (
    <>
      <GlobalStyles />

      <ShopHeader onCartClick={handleCartClick} cartCount={cartItems.length} />

      <main className="min-h-screen bg-slate-50 pb-16 sm:pb-24 text-slate-900 selection:bg-orange-100">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 relative z-20">
          {/* ═══ ANIMAL SELECTION ═══ */}
          <div className="mb-8">
            <div className="rounded-3xl border border-orange-100 bg-gradient-to-b from-orange-50/70 to-white px-4 py-5 sm:px-6 sm:py-6">
              <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Who are you shopping for?
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Pick a profile to get products tailored to them.
                </p>
              </div>

              <div
                className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4"
                role="radiogroup"
                aria-label="Animal profile selector"
              >
                {ANIMALS.map((a, index) => {
                  const isSelected = activeAnimal === a.filterValue && (a.name !== "Pet parent" || activeAnimal === "Dog");

                  return (
                    <button
                      key={a.name}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Shop for ${a.name}`}
                      onClick={() => {
                        setActiveAnimal(a.filterValue);
                        setActiveCategory("All");
                        setSearchQuery("");
                      }}
                      className={`group relative flex flex-col items-center rounded-2xl border bg-white p-2.5 text-center transition-all duration-300 sm:p-3 ${
                        isSelected
                          ? "border-orange-500 shadow-md shadow-orange-100 ring-2 ring-orange-100"
                          : "border-orange-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                      }`}
                      style={{
                        animation: `pet-card-in 420ms ease-out ${index * 45}ms both`,
                        ...(isSelected ? { animation: `pet-card-in 420ms ease-out ${index * 45}ms both, active-glow 2.2s ease-in-out infinite` } : {}),
                      }}
                    >
                      <div className="relative w-full overflow-hidden rounded-xl bg-orange-50/60 p-1.5 sm:p-2">
                        <img
                          src={a.image}
                          alt={a.name}
                          loading="lazy"
                          decoding="async"
                          className="h-20 w-full object-contain transition-transform duration-300 group-hover:scale-105 sm:h-24"
                        />
                      </div>
                      <span
                        className={`mt-2 text-xs font-semibold sm:text-sm ${
                          isSelected ? "text-orange-700" : "text-slate-700"
                        }`}
                      >
                        {a.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

         

          {/* ═══ CATEGORY STRIP ═══ */}
          <div className="mb-8 rounded-2xl border border-orange-100/80 bg-gradient-to-r from-white via-orange-50/40 to-white px-3 py-3 sm:px-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Browse by Category
              </p>
              <p className="text-[11px] sm:text-xs text-orange-600 font-semibold">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Product categories">
              {CATEGORIES.map((cat) => {
                const isActive = normalize(activeCategory) === normalize(cat.name);
                return (
                  <button
                    key={cat.name}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200"
                        : "border-orange-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <span className="text-[13px]">{cat.icon}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ PRODUCTS ═══ */}
          {loading ? (
            <div className="flex gap-4 overflow-hidden px-14">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              className="text-center py-20 bg-white rounded-3xl border border-orange-100"
              style={{ animation: "fade-up 400ms ease-out" }}
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-5">
                <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700">No products found</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : "No items match your current filters. Try selecting a different category."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-5 px-6 py-2.5 text-sm font-semibold text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="relative group/rail">
              {/* Left Arrow */}
              <button
                type="button"
                aria-label="Scroll products left"
                onClick={() => scrollProductRail("left")}
                disabled={!canScrollLeft}
                className={`absolute -left-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-orange-600 shadow-xl backdrop-blur transition-all md:flex ${
                  canScrollLeft
                    ? "hover:scale-110 hover:bg-orange-50 hover:border-orange-200 hover:shadow-orange-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                type="button"
                aria-label="Scroll products right"
                onClick={() => scrollProductRail("right")}
                disabled={!canScrollRight}
                className={`absolute -right-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-orange-600 shadow-xl backdrop-blur transition-all md:flex ${
                  canScrollRight
                    ? "hover:scale-110 hover:bg-orange-50 hover:border-orange-200 hover:shadow-orange-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Left gradient fade */}
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none hidden md:block" />
              )}
              {/* Right gradient fade */}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none hidden md:block" />
              )}

              <div
                ref={productRailRef}
                className="flex gap-4 overflow-x-auto pb-4 px-2 md:px-14 scrollbar-hide scroll-smooth"
              >
                {filteredProducts.map((product, idx) => (
                  <div
                    key={product.id}
                    style={{ animation: `fade-up 400ms ease-out ${Math.min(idx * 60, 400)}ms both` }}
                    className="flex-shrink-0"
                  >
                    <ProductCard product={product} onAddToCart={handleAddToCart} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ VET FAB BUTTON ═══ */}
          {isVet && (
            <button
              onClick={() => setShowAddModal(true)}
              className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 flex items-center justify-center hover:scale-105 transition-all active:scale-95"
              aria-label="Add new product"
              style={{ animation: "bounce-in 500ms cubic-bezier(0.68,-0.55,0.27,1.55)" }}
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          )}
        </section>
      </main>

      {/* ═══ PORTALS ═══ */}

      {/* Cart Drawer */}
      {isCartOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <CartDrawer
            items={cartItems}
            total={cartTotal}
            onClose={() => setIsCartOpen(false)}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            onBuyNow={handleBuyNow}
          />,
          document.body
        )}

      {/* Checkout Panel */}
      {isCheckoutOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <CheckoutPanel
            items={cartItems}
            total={cartTotal}
            onBackToCart={handleBackToCart}
            onClose={() => setIsCheckoutOpen(false)}
            onPlaceOrder={handlePlaceOrder}
          />,
          document.body
        )}

      {/* Add Product Modal */}
      {isVet &&
        showAddModal &&
        typeof document !== "undefined" &&
        createPortal(
          <AddProductModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddProduct}
            isUploading={isUploading}
          />,
          document.body
        )}

      {/* Toast Notifications */}
      {typeof document !== "undefined" && <ToastContainer toasts={toasts} onDismiss={dismissToast} />}
    </>
  );
}