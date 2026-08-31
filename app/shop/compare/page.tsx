"use client";

import React, { useState, useCallback, useRef, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  ShoppingCart,
  ArrowRight,
  ChevronRight,
  Trash2,
  Check,
  X,
  Star,
  Package,
  Layers,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { CartProvider, useCart } from "@/app/components/cart";
import { ShopProduct, BADGE_COLORS, DEFAULT_BADGE_COLOR } from "@/app/shop/shopConstants";
import { useCompare } from "@/app/shop/hooks/useCompare";
import SmoothScrollProvider from "@/app/shop/providers/SmoothScrollProvider";
import GSAPRegistration from "@/app/shop/providers/GSAPRegistration";
import ShopHeader from "@/app/components/ShopHeader";
import QuickViewModal from "@/app/components/QuickViewModal";
import CartDrawer from "@/app/components/CartDrawer";
import CheckoutPanel from "@/app/components/CheckoutPanel";

/* ═══════════════════════════════════════════════════
   TOAST NOTIFICATION TYPES
   ═══════════════════════════════════════════════════ */
type ToastType = "success" | "error" | "info";
interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

function CompareContent() {
  const { compareList, removeCompare, clearCompare, isLoaded, maxItems } = useCompare();
  const { items: cartItems, totals, addItem, updateQty, removeItem, clear } = useCart();

  const [quickViewProduct, setQuickViewProduct] = useState<ShopProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Toast stack
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

  const handleAddToCart = useCallback(
    (product: ShopProduct, qty: number = 1) => {
      const result = addItem(product, qty);
      if (result.ok) {
        showToast(`Added ${product.name} (${qty}) to cart`, "success");
      } else {
        showToast(result.reason, "error");
      }
    },
    [addItem, showToast]
  );

  return (
    <div className="min-h-screen bg-warm-surface text-on-surface flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
      {/* ── HEADER ── */}
      <ShopHeader
        cartCount={totals.itemCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* ── BREADCRUMBS & HERO STRIP ── */}
      <div className="bg-white border-b border-warm-line py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumbs"
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 mb-2"
          >
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
            <Link href="/shop" className="hover:text-primary transition-colors">
              Shop
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
            <span className="text-neutral-900 font-bold">Product Comparison</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-sm">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Product Comparison
                </h1>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Side-by-side spec analysis for up to {maxItems} products
                </p>
              </div>
            </div>

            {compareList.length > 0 && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={clearCompare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Clear All ({compareList.length})</span>
                </button>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More Items</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN COMPARISON MATRIX ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isLoaded ? (
          <div className="bg-white rounded-3xl p-8 border border-warm-line animate-pulse space-y-4">
            <div className="h-6 bg-neutral-100 rounded w-1/4" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-neutral-100 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : compareList.length === 0 ? (
          /* Empty State: 0 items */
          <div className="flex flex-col items-center justify-center text-center p-8 sm:p-16 bg-white rounded-3xl border border-dashed border-warm-line shadow-sm my-6">
            <div className="w-20 h-20 rounded-3xl bg-secondary/10 text-secondary flex items-center justify-center mb-5 shadow-inner">
              <ArrowLeftRight className="w-10 h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mb-2">
              No products to compare
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-6 leading-relaxed">
              Select any products from the shop catalog by clicking the compare icon on product cards to review prices, ingredients, and specs side-by-side.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/25 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : compareList.length === 1 ? (
          /* Single Item Guide */
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-bold text-amber-900">
                  You have 1 item selected. Add at least 1 more product to compare side-by-side!
                </p>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex-shrink-0"
              >
                <span>Add Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Render 1-item table/card view */}
            <div className="bg-white rounded-3xl border border-warm-line shadow-sm overflow-hidden p-6 max-w-md mx-auto">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  Selected Item
                </span>
                <button
                  type="button"
                  onClick={() => removeCompare(compareList[0].id)}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-neutral-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-neutral-100 mb-4 border border-neutral-100">
                {compareList[0].images?.[0] ? (
                  <Image
                    src={compareList[0].images[0]}
                    alt={compareList[0].name}
                    fill
                    sizes="320px"
                    unoptimized={
                      typeof compareList[0].images[0] === "string" &&
                      (compareList[0].images[0].includes("firebasestorage.googleapis.com") ||
                        compareList[0].images[0].includes("storage.googleapis.com"))
                    }
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>

              <h3 className="text-base font-extrabold text-neutral-900 mb-1">
                {compareList[0].name}
              </h3>
              <p className="text-xs text-secondary font-medium mb-3">
                by {compareList[0].brandName}
              </p>
              <p className="text-lg font-black text-neutral-900 mb-4">
                ₹{Number(compareList[0].discountPrice || compareList[0].price).toLocaleString("en-IN")}
              </p>

              <button
                type="button"
                onClick={() => handleAddToCart(compareList[0])}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ) : (
          /* Multi-item Matrix Table */
          <div className="bg-white rounded-3xl border border-warm-line shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-warm-line bg-neutral-50/50">
                    <th className="p-4 sm:p-5 w-44 sm:w-56 font-extrabold text-xs text-neutral-400 uppercase tracking-wider align-top">
                      Product Details
                    </th>
                    {compareList.map((product) => {
                      const rawPrice = Number(product.price) || 0;
                      const rawDiscount =
                        product.discountPrice !== undefined && product.discountPrice !== null
                          ? Number(product.discountPrice)
                          : null;
                      const hasDiscount =
                        rawDiscount !== null && rawDiscount > 0 && rawDiscount < rawPrice;
                      const displayPrice = hasDiscount ? rawDiscount : rawPrice;
                      const isOutOfStock =
                        product.stockQty !== undefined &&
                        product.stockQty !== null &&
                        product.stockQty <= 0;

                      return (
                        <th
                          key={product.id}
                          className="p-4 sm:p-5 font-normal align-top border-l border-warm-line min-w-[200px] max-w-[260px]"
                        >
                          <div className="flex flex-col h-full justify-between space-y-3">
                            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 group">
                              {product.images?.[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  sizes="220px"
                                  unoptimized={
                                    typeof product.images[0] === "string" &&
                                    (product.images[0].includes("firebasestorage.googleapis.com") ||
                                      product.images[0].includes("storage.googleapis.com"))
                                  }
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                  <Package className="w-8 h-8" />
                                </div>
                              )}

                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => removeCompare(product.id)}
                                aria-label={`Remove ${product.name} from comparison`}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-neutral-600 hover:text-red-500 flex items-center justify-center shadow-sm backdrop-blur-sm transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <p className="text-[11px] font-bold text-secondary truncate">
                                {product.brandName}
                              </p>
                              <Link
                                href={`/shop/product/${product.id}`}
                                className="text-xs sm:text-sm font-extrabold text-neutral-900 line-clamp-2 hover:text-primary transition-colors leading-snug"
                              >
                                {product.name}
                              </Link>
                            </div>

                            <div className="pt-1">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-base sm:text-lg font-black text-neutral-900">
                                  ₹{displayPrice.toLocaleString("en-IN")}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[11px] text-neutral-400 line-through">
                                    ₹{rawPrice.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => handleAddToCart(product)}
                              className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                isOutOfStock
                                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                  : "bg-primary hover:bg-primary-container text-white active:scale-95 shadow-primary/20"
                              }`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-warm-line text-xs font-medium">
                  {/* Row 1: Rating & Reviews */}
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-neutral-700 bg-neutral-50/30">
                      Rating & Reviews
                    </td>
                    {compareList.map((product) => {
                      const hasRating =
                        typeof product.avgRating === "number" &&
                        product.avgRating > 0 &&
                        typeof product.reviewCount === "number" &&
                        product.reviewCount > 0;

                      return (
                        <td key={`rating-${product.id}`} className="p-4 sm:p-5 border-l border-warm-line">
                          {hasRating ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-extrabold">{product.avgRating?.toFixed(1)}</span>
                              </div>
                              <span className="text-neutral-400 text-[11px]">
                                ({product.reviewCount} reviews)
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-[11px] italic">
                              No reviews yet
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 2: Category */}
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-neutral-700 bg-neutral-50/30">
                      Category
                    </td>
                    {compareList.map((product) => {
                      const cat = product.category || "Food";
                      const colorClass = BADGE_COLORS[cat] || DEFAULT_BADGE_COLOR;
                      return (
                        <td key={`cat-${product.id}`} className="p-4 sm:p-5 border-l border-warm-line">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colorClass}`}
                          >
                            {cat}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 3: Suitable Animals */}
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-neutral-700 bg-neutral-50/30">
                      Suitable Animals
                    </td>
                    {compareList.map((product) => (
                      <td key={`animals-${product.id}`} className="p-4 sm:p-5 border-l border-warm-line">
                        {product.animals && product.animals.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.animals.map((animal) => (
                              <span
                                key={animal}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-semibold"
                              >
                                {animal}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">All pets</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: Shipping Weight */}
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-neutral-700 bg-neutral-50/30">
                      Shipping Weight
                    </td>
                    {compareList.map((product) => (
                      <td key={`weight-${product.id}`} className="p-4 sm:p-5 border-l border-warm-line">
                        <span className="font-bold text-neutral-900">
                          {Number(product.weight || 0.5)} kg
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: Package Dimensions */}
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-neutral-700 bg-neutral-50/30">
                      Dimensions (L × B × H)
                    </td>
                    {compareList.map((product) => {
                      const l = product.length ?? "—";
                      const b = product.breadth ?? "—";
                      const h = product.height ?? "—";
                      const hasDims = product.length || product.breadth || product.height;

                      return (
                        <td key={`dims-${product.id}`} className="p-4 sm:p-5 border-l border-warm-line">
                          {hasDims ? (
                            <span className="font-mono text-neutral-800 text-[11px]">
                              {l} × {b} × {h} cm
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic">Standard packaging</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 6: In Stock Status */}
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-neutral-700 bg-neutral-50/30">
                      Stock Status
                    </td>
                    {compareList.map((product) => {
                      const inStock = product.stockQty !== undefined && product.stockQty > 0;
                      return (
                        <td key={`stock-${product.id}`} className="p-4 sm:p-5 border-l border-warm-line">
                          {inStock ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                              <span>In Stock ({product.stockQty} left)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>Out of Stock</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 7: Key Features & Description */}
                  <tr>
                    <td className="p-4 sm:p-5 font-bold text-neutral-700 bg-neutral-50/30 align-top">
                      Description & Features
                    </td>
                    {compareList.map((product) => (
                      <td
                        key={`desc-${product.id}`}
                        className="p-4 sm:p-5 border-l border-warm-line text-neutral-600 text-xs leading-relaxed align-top"
                      >
                        <p className="line-clamp-4">
                          {product.description || "No specific description available."}
                        </p>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── QUICK VIEW MODAL ── */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* ── FLOATING CART BOTTOM BAR ── */}
      <AnimatePresence>
        {totals.itemCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-warm-line p-3 sm:p-3.5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {totals.itemCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500 font-bold leading-tight">
                  {totals.itemCount} item{totals.itemCount !== 1 ? "s" : ""} in cart
                </p>
                <p className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight leading-tight mt-0.5">
                  ₹{totals.subtotal.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/20 transition-all"
            >
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CART DRAWER ── */}
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
              className="pointer-events-auto w-full flex items-center gap-3 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-neutral-700 cursor-pointer"
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
                className="text-neutral-400 hover:text-white"
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

export default function ComparePage() {
  return (
    <GSAPRegistration>
      <SmoothScrollProvider>
        <CartProvider>
          <CompareContent />
        </CartProvider>
      </SmoothScrollProvider>
    </GSAPRegistration>
  );
}
