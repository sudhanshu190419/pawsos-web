"use client";

import React, { memo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowRight,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  ShopProduct,
  BADGE_COLORS,
  DEFAULT_BADGE_COLOR,
  ANIMAL_OPTIONS,
} from "@/app/shop/shopConstants";

export interface QuickViewModalProps {
  product: ShopProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ShopProduct, qty: number) => void;
}

const ANIMAL_EMOJI_MAP: Record<string, string> = Object.fromEntries(
  ANIMAL_OPTIONS.map((a) => [a.value, a.emoji])
);

const QuickViewModal = memo(function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: QuickViewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Reset state when product changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(0);
      setQuantity(1);
      setIsAdded(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, product]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleQuantityDecrease = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1));
  }, []);

  const handleQuantityIncrease = useCallback(() => {
    setQuantity((prev) => {
      if (product && product.stockQty && product.stockQty > 0) {
        return Math.min(product.stockQty, prev + 1);
      }
      return prev + 1;
    });
  }, [product]);

  const handleAdd = useCallback(() => {
    if (!product) return;
    const isOutOfStock = product.stockQty !== undefined && product.stockQty <= 0;
    if (isOutOfStock) return;

    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1600);
  }, [product, quantity, onAddToCart]);

  if (!isOpen || !product) return null;

  // Price calculations
  const rawPrice = Number(product.price) || 0;
  const rawDiscount =
    product.discountPrice !== undefined && product.discountPrice !== null
      ? Number(product.discountPrice)
      : null;
  const hasDiscount =
    rawDiscount !== null && rawDiscount > 0 && rawDiscount < rawPrice;
  const displayPrice = hasDiscount ? rawDiscount : rawPrice;
  const originalPrice = hasDiscount ? rawPrice : null;
  const discountPercent = hasDiscount
    ? Math.round(((rawPrice - rawDiscount) / rawPrice) * 100)
    : 0;

  // Stock status
  const isOutOfStock =
    product.stockQty !== undefined && product.stockQty <= 0;

  // Rating
  const hasRating =
    typeof product.avgRating === "number" &&
    product.avgRating > 0 &&
    typeof product.reviewCount === "number" &&
    product.reviewCount > 0;

  // Images
  const images =
    product.images && product.images.length > 0 ? product.images : [];
  const currentImageUrl = images[selectedImageIndex] || images[0] || null;
  const isFirebaseImage =
    typeof currentImageUrl === "string" &&
    (currentImageUrl.includes("firebasestorage.googleapis.com") ||
      currentImageUrl.includes("storage.googleapis.com"));

  const badgeColor =
    (product.category && BADGE_COLORS[product.category]) || DEFAULT_BADGE_COLOR;

  const blurDataUrl =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl bg-warm-surface rounded-2xl sm:rounded-3xl shadow-2xl border border-warm-line/80 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 border border-neutral-200/60 backdrop-blur-sm"
          >
            <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          <div className="overflow-y-auto p-4 sm:p-6 lg:p-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7 items-start">
              {/* ── LEFT: IMAGE GALLERY ── */}
              <div className="flex flex-col space-y-3">
                {/* Main image container */}
                <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/60 shadow-inner">
                  {currentImageUrl ? (
                    <Image
                      src={currentImageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      priority
                      unoptimized={isFirebaseImage}
                      placeholder="blur"
                      blurDataURL={blurDataUrl}
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-2">
                      <ShoppingBag className="w-12 h-12 stroke-[1.2]" />
                      <span className="text-xs font-medium">No image available</span>
                    </div>
                  )}

                  {/* Category Badge */}
                  {product.category && (
                    <span
                      className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm ${badgeColor}`}
                    >
                      {product.category}
                    </span>
                  )}

                  {/* Discount percentage tag */}
                  {hasDiscount && (
                    <span className="absolute bottom-3 left-3 z-10 px-2.5 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {discountPercent}% OFF
                    </span>
                  )}

                  {/* Out of stock overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <span className="px-3.5 py-1.5 bg-neutral-900/90 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg shadow-md">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnails row */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          selectedImageIndex === idx
                            ? "border-primary ring-2 ring-primary/20 scale-100"
                            : "border-neutral-200/80 hover:border-neutral-400 opacity-75 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={imgUrl}
                          alt={`${product.name} thumbnail ${idx + 1}`}
                          fill
                          sizes="64px"
                          unoptimized={
                            typeof imgUrl === "string" &&
                            (imgUrl.includes("firebasestorage.googleapis.com") ||
                              imgUrl.includes("storage.googleapis.com"))
                          }
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── RIGHT: PRODUCT DETAILS ── */}
              <div className="flex flex-col space-y-4">
                {/* Brand & Animal tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {product.brandName && (
                    <span className="text-xs sm:text-sm font-bold text-secondary tracking-wide uppercase">
                      {product.brandName}
                    </span>
                  )}

                  {product.animals && product.animals.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {product.animals.map((animal) => (
                        <span
                          key={animal}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60"
                        >
                          <span>{ANIMAL_EMOJI_MAP[animal] || "🐾"}</span>
                          <span>{animal}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h2
                  id="quick-view-title"
                  className="text-lg sm:text-xl md:text-2xl font-extrabold text-neutral-900 leading-tight tracking-tight"
                >
                  {product.name}
                </h2>

                {/* Real Rating (if any) */}
                {hasRating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-neutral-900">
                        {product.avgRating?.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500 font-medium">
                      ({product.reviewCount} customer {product.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}

                {/* Price Display */}
                <div className="flex items-baseline gap-2.5 pt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </span>
                  {originalPrice !== null && (
                    <span className="text-sm sm:text-base text-neutral-400 line-through font-medium">
                      ₹{originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  <span className="text-[11px] text-neutral-500 font-medium ml-1">
                    (Inclusive of all taxes)
                  </span>
                </div>

                {/* Stock status indicator */}
                <div className="text-xs font-semibold">
                  {isOutOfStock ? (
                    <span className="text-error flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-error inline-block" />
                      Currently Out of Stock
                    </span>
                  ) : product.stockQty && product.stockQty <= 5 ? (
                    <span className="text-amber-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                      Only {product.stockQty} left in stock - order soon
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      In Stock & Ready to Ship
                    </span>
                  )}
                </div>

                {/* Description snippet */}
                {product.description && (
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200/50">
                    {product.description}
                  </p>
                )}

                {/* Stepper + Add to Cart */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between sm:justify-start border border-neutral-300 rounded-xl bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={handleQuantityDecrease}
                      disabled={quantity <= 1 || isOutOfStock}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-neutral-900 select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={handleQuantityIncrease}
                      disabled={
                        isOutOfStock ||
                        (Boolean(product.stockQty) && quantity >= (product.stockQty || 1))
                      }
                      aria-label="Increase quantity"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 active:scale-[0.98] ${
                      isAdded
                        ? "bg-emerald-600 text-white shadow-emerald-600/20"
                        : isOutOfStock
                        ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                        : "bg-primary hover:bg-primary-container text-white shadow-primary/25 hover:shadow-primary/35"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add {quantity > 1 ? `(${quantity})` : ""} to Cart</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-200/80">
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/70 border border-neutral-200/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="text-[10px] font-bold text-neutral-800 leading-tight">
                      Vet Verified
                    </span>
                    <span className="text-[9px] text-neutral-500">100% Genuine</span>
                  </div>

                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/70 border border-neutral-200/60">
                    <Truck className="w-4 h-4 text-secondary mb-1" />
                    <span className="text-[10px] font-bold text-neutral-800 leading-tight">
                      Fast Shipping
                    </span>
                    <span className="text-[9px] text-neutral-500">Across India</span>
                  </div>

                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/70 border border-neutral-200/60">
                    <RotateCcw className="w-4 h-4 text-primary mb-1" />
                    <span className="text-[10px] font-bold text-neutral-800 leading-tight">
                      Easy Returns
                    </span>
                    <span className="text-[9px] text-neutral-500">7-Day Policy</span>
                  </div>
                </div>

                {/* View Full Product Details Link */}
                <div className="pt-2 text-center sm:text-left">
                  <Link
                    href={`/shop/product/${product.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-container group transition-colors"
                  >
                    <span>View Full Product Details & Specifications</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default QuickViewModal;
