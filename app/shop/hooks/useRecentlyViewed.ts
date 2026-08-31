"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "animalsathi-recent-products";
const MAX_RECENT = 10;

export function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const getRecentProductIds = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (id): id is string => typeof id === "string" && id.trim().length > 0
          );
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
    return [];
  }, []);

  useEffect(() => {
    setRecentIds(getRecentProductIds());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setRecentIds(getRecentProductIds());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [getRecentProductIds]);

  const addProduct = useCallback(
    (productId: string) => {
      if (!productId || typeof productId !== "string") return;
      if (typeof window === "undefined") return;

      try {
        const current = getRecentProductIds();
        const next = [
          productId,
          ...current.filter((id) => id !== productId),
        ].slice(0, MAX_RECENT);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setRecentIds(next);
      } catch {
        // Ignore localStorage write errors
      }
    },
    [getRecentProductIds]
  );

  return {
    recentIds,
    addProduct,
    getRecentProductIds,
  };
}
