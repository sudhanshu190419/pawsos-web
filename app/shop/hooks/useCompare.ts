"use client";

import { useState, useEffect, useCallback } from "react";
import { ShopProduct } from "@/app/shop/shopConstants";

const STORAGE_KEY = "animalsathi-compare-products";
const CUSTOM_EVENT_KEY = "animalsathi-compare-updated";
export const MAX_COMPARE_ITEMS = 4;

function getStoredCompareList(): ShopProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE_ITEMS) : [];
  } catch {
    return [];
  }
}

function saveStoredCompareList(items: ShopProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_COMPARE_ITEMS)));
    window.dispatchEvent(new Event(CUSTOM_EVENT_KEY));
  } catch {
    // Ignore storage write errors
  }
}

export function useCompare() {
  const [compareList, setCompareList] = useState<ShopProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load initial from localStorage on mount & listen for updates
  useEffect(() => {
    setCompareList(getStoredCompareList());
    setIsLoaded(true);

    const handleSync = () => {
      setCompareList(getStoredCompareList());
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(CUSTOM_EVENT_KEY, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(CUSTOM_EVENT_KEY, handleSync);
    };
  }, []);

  const isCompared = useCallback(
    (productId: string): boolean => {
      if (!productId) return false;
      return compareList.some((p) => p.id === productId);
    },
    [compareList]
  );

  const toggleCompare = useCallback(
    (product: ShopProduct): { success: boolean; action: "added" | "removed" | "limit_reached" } => {
      if (!product || !product.id) {
        return { success: false, action: "limit_reached" };
      }

      const current = getStoredCompareList();
      const exists = current.some((p) => p.id === product.id);

      if (exists) {
        const next = current.filter((p) => p.id !== product.id);
        saveStoredCompareList(next);
        setCompareList(next);
        return { success: true, action: "removed" };
      } else {
        if (current.length >= MAX_COMPARE_ITEMS) {
          return { success: false, action: "limit_reached" };
        }
        const next = [...current, product];
        saveStoredCompareList(next);
        setCompareList(next);
        return { success: true, action: "added" };
      }
    },
    []
  );

  const removeCompare = useCallback((productId: string): void => {
    if (!productId) return;
    const current = getStoredCompareList();
    const next = current.filter((p) => p.id !== productId);
    saveStoredCompareList(next);
    setCompareList(next);
  }, []);

  const clearCompare = useCallback((): void => {
    saveStoredCompareList([]);
    setCompareList([]);
  }, []);

  return {
    compareList,
    isCompared,
    toggleCompare,
    removeCompare,
    clearCompare,
    isLoaded,
    maxItems: MAX_COMPARE_ITEMS,
  };
}
