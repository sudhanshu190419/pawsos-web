"use client";

import React, { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  ShoppingBag,
  X,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  Truck,
  ShieldCheck,
  Package,
} from "lucide-react";

export type CartItemData = {
  id: string;
  name: string;
  price: number | string;
  qty?: number;
  imageUrl?: string;
  brandName?: string;
  stockQty?: number;
};

export type CartDrawerProps = {
  items: CartItemData[];
  total: number;
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onBuyNow: () => void;
};

const FREE_DELIVERY_THRESHOLD = 499;

const CartDrawer = memo(function CartDrawer({
  items,
  total,
  onClose,
  onUpdateQty,
  onRemove,
  onBuyNow,
}: CartDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted || typeof document === "undefined") return null;

  const totalItemsCount = items.reduce((sum, item) => sum + (item.qty || 1), 0);
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - total);
  const freeDeliveryProgress = Math.min(
    100,
    Math.round((total / FREE_DELIVERY_THRESHOLD) * 100)
  );
  const isFreeDelivery = total >= FREE_DELIVERY_THRESHOLD;

  const drawerContent = (
    <div
      className="fixed inset-0 z-[100000] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 bg-warm-surface border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-900 font-sans tracking-tight">
                    Your Cart
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                    {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Review & checkout items
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Progress Bar */}
          {items.length > 0 && (
            <div className="px-5 py-3 bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/70 border-b border-amber-100/60">
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Truck
                    className={`w-4 h-4 ${
                      isFreeDelivery ? "text-emerald-600" : "text-primary"
                    }`}
                  />
                  {isFreeDelivery ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      You&apos;ve unlocked FREE delivery!
                    </span>
                  ) : (
                    <span className="text-neutral-700">
                      Add{" "}
                      <strong className="text-primary font-bold">
                        ₹{remainingForFreeDelivery.toLocaleString("en-IN")}
                      </strong>{" "}
                      more for{" "}
                      <span className="text-emerald-700 font-semibold">
                        FREE delivery
                      </span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-neutral-500">
                  {freeDeliveryProgress}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-neutral-200/80 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFreeDelivery
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-primary to-[#bc5639]"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${freeDeliveryProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Item List or Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
                <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4 text-primary">
                  <ShoppingBag className="w-10 h-10 text-primary/70" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 font-sans">
                  Your cart is empty
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-[240px] leading-relaxed">
                  Looks like you haven&apos;t added any pet essentials yet. Explore
                  our curated collection!
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#85341c] transition-colors flex items-center gap-2 active:scale-95"
                >
                  Explore Store
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const unitPrice = Number(item.price) || 0;
                  const qty = item.qty || 1;
                  const lineTotal = unitPrice * qty;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-sm hover:border-neutral-300 hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <div className="flex gap-3.5">
                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200/60 relative">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              width={80}
                              height={80}
                              sizes="80px"
                              unoptimized={true}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider line-clamp-1">
                                {item.brandName || "PawSOS Store"}
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemove(item.id)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title={`Remove ${item.name}`}
                                aria-label={`Remove ${item.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 leading-snug mt-0.5">
                              {item.name}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100">
                            <div>
                              <p className="text-xs sm:text-sm font-extrabold text-neutral-900 font-sans">
                                ₹{lineTotal.toLocaleString("en-IN")}
                              </p>
                              {qty > 1 && (
                                <p className="text-[10px] text-neutral-400">
                                  ₹{unitPrice.toLocaleString("en-IN")} each
                                </p>
                              )}
                            </div>

                            {/* Stepper */}
                            <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 shadow-inner overflow-hidden">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors active:scale-95"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-neutral-800 select-none">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors active:scale-95"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="border-t border-neutral-200 bg-warm-surface p-4 sm:p-5 space-y-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
              {/* Calculations */}
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    Delivery
                    {isFreeDelivery && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                        Unlocked
                      </span>
                    )}
                  </span>
                  {isFreeDelivery ? (
                    <span className="font-bold text-emerald-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-neutral-900">₹49</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-sm">
                  <span className="font-bold text-neutral-900">
                    Estimated Total
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-neutral-900 font-sans">
                      ₹
                      {(
                        total + (isFreeDelivery ? 0 : 49)
                      ).toLocaleString("en-IN")}
                    </span>
                    <p className="text-[10px] text-neutral-400">
                      Incl. of all taxes
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={onBuyNow}
                className="w-full bg-gradient-to-r from-primary via-[#b3492d] to-primary hover:from-[#85341c] hover:to-[#85341c] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Continue Shopping */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-1.5 text-center text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                Continue Shopping
              </button>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-center gap-4 text-[10px] text-neutral-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                  100% Genuine
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-secondary" />
                  Fast Dispatch
                </span>
                <span>•</span>
                <span>🔒 Secure SSL</span>
              </div>
            </div>
          )}
        </motion.aside>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
});

CartDrawer.displayName = "CartDrawer";

export default CartDrawer;
