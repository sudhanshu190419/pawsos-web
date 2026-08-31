"use client";

import React, { useState, useCallback, useRef, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  ArrowRight,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package,
  X,
} from "lucide-react";
import { CartProvider, useCart } from "@/app/components/cart";
import { ShopProduct } from "@/app/shop/shopConstants";
import { useWishlist } from "@/app/shop/hooks/useWishlist";
import { useCompare } from "@/app/shop/hooks/useCompare";
import SmoothScrollProvider from "@/app/shop/providers/SmoothScrollProvider";
import GSAPRegistration from "@/app/shop/providers/GSAPRegistration";
import ShopHeader from "@/app/components/ShopHeader";
import ProductCard from "@/app/components/ProductCard";
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

function WishlistContent() {
  const { wishlistProducts, loading, toggleWishlist } = useWishlist();
  const { compareList, clearCompare } = useCompare();
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

  const handleAddAllToCart = useCallback(() => {
    let addedCount = 0;
    for (const prod of wishlistProducts) {
      if (prod.stockQty && prod.stockQty > 0) {
        const res = addItem(prod, 1);
        if (res.ok) addedCount++;
      }
    }
    if (addedCount > 0) {
      showToast(`Added ${addedCount} item${addedCount !== 1 ? "s" : ""} to cart`, "success");
      setIsCartOpen(true);
    } else {
      showToast("No in-stock items available to add", "error");
    }
  }, [wishlistProducts, addItem, showToast]);

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
          {/* Breadcrumb nav */}
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
            <span className="text-neutral-900 font-bold">My Wishlist</span>
          </nav>

          {/* Page Heading & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
                <Heart className="w-5 h-5 fill-red-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Saved Items
                </h1>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  {wishlistProducts.length} product{wishlistProducts.length !== 1 ? "s" : ""} saved for later
                </p>
              </div>
            </div>

            {wishlistProducts.length > 0 && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/20 active:scale-95 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Move All to Cart</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-neutral-200/80 p-4 animate-pulse shadow-sm"
              >
                <div className="w-full aspect-[4/3] bg-neutral-100 rounded-xl mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-neutral-100 rounded w-1/3" />
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center p-8 sm:p-16 bg-white rounded-3xl border border-dashed border-warm-line shadow-sm my-6">
            <div className="w-20 h-20 rounded-3xl bg-red-50 text-red-400 flex items-center justify-center mb-5 shadow-inner">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-6 leading-relaxed">
              Explore our marketplace to find vet-approved nutrition, wellness essentials, toys, and care items for your pets.
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
        ) : (
          /* Products Grid */
          <div className="space-y-6">
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
            >
              <AnimatePresence>
                {wishlistProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={() => handleAddToCart(product)}
                      onQuickView={() => setQuickViewProduct(product)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
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
            } left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-neutral-900 text-white rounded-2xl shadow-2xl border border-neutral-700 p-3 sm:p-3.5 flex items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-secondary text-white flex items-center justify-center flex-shrink-0 text-xs font-black">
                {compareList.length}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">
                  Comparing {compareList.length}/4 items
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  {compareList.map((p) => p.name).join(", ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={clearCompare}
                className="text-[11px] font-bold text-neutral-400 hover:text-white px-2 py-1 transition-colors"
              >
                Clear
              </button>
              <Link
                href="/shop/compare"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/90 text-white text-xs font-bold transition-all shadow-sm"
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

export default function WishlistPage() {
  return (
    <GSAPRegistration>
      <SmoothScrollProvider>
        <CartProvider>
          <WishlistContent />
        </CartProvider>
      </SmoothScrollProvider>
    </GSAPRegistration>
  );
}
