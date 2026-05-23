"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { CartItem, CartTotals } from "./cartTypes";

const STORAGE_KEY = "animalsathi-cart-v1";

export type AddItemResult = { ok: true } | { ok: false; reason: string };

type CartContextValue = {
  items: CartItem[];
  totals: CartTotals;
  addItem: (product: any, qty?: number) => AddItemResult;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => AddItemResult;
  setQty: (id: string, qty: number) => AddItemResult;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: items }));
    } catch {
      // ignore persistence errors
    }
  }, [items]);

  const totals = useMemo<CartTotals>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
    return { subtotal, itemCount };
  }, [items]);

  const addItem = useCallback((product: any, qty = 1): AddItemResult => {
    if (!product?.id) return { ok: false, reason: "Invalid product" };
    const stockQty = Number(product.stockQty ?? product.stock ?? 0);
    const safeStock = Number.isFinite(stockQty) ? stockQty : 0;
    const mapped: CartItem = {
      id: product.id,
      name: product.name ?? "",
      price: Number(product.price ?? 0),
      qty: Math.max(1, qty),
      imageUrl: product.imageUrl ?? product.images?.[0] ?? "",
      vetClinicName: product.clinicName ?? product.vetClinicName ?? "",
      vetId: product.vetId ?? "",
      shiprocketPickupId: product.shiprocketPickupId ?? null,
      stockQty: safeStock,
    };

    let result: AddItemResult = { ok: true };

    setItems((prev) => {
      const existing = prev.find((item) => item.id === mapped.id);
      if (existing) {
        const nextQty = existing.qty + mapped.qty;
        if (safeStock > 0 && nextQty > safeStock) {
          result = { ok: false, reason: "Not enough stock" };
          return prev;
        }
        return prev.map((item) => (item.id === mapped.id ? { ...item, qty: nextQty } : item));
      }
      if (safeStock > 0 && mapped.qty > safeStock) {
        result = { ok: false, reason: "Not enough stock" };
        return prev;
      }
      return [...prev, mapped];
    });

    return result;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number): AddItemResult => {
    if (qty < 1) return { ok: false, reason: "Quantity must be at least 1" };
    let result: AddItemResult = { ok: true };
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.stockQty > 0 && qty > item.stockQty) {
          result = { ok: false, reason: "Not enough stock" };
          return item;
        }
        return { ...item, qty };
      })
    );
    return result;
  }, []);

  const updateQty = useCallback((id: string, delta: number): AddItemResult => {
    let result: AddItemResult = { ok: true };
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextQty = Math.max(1, item.qty + delta);
        if (item.stockQty > 0 && nextQty > item.stockQty) {
          result = { ok: false, reason: "Not enough stock" };
          return item;
        }
        return { ...item, qty: nextQty };
      })
    );
    return result;
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, totals, addItem, removeItem, updateQty, setQty, clear }),
    [items, totals, addItem, removeItem, updateQty, setQty, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
