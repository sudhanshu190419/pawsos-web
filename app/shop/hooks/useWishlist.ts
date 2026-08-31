"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";
import { ShopProduct } from "@/app/shop/shopConstants";

const GUEST_STORAGE_KEY = "animalsathi-guest-wishlist";
const CUSTOM_EVENT_KEY = "animalsathi-wishlist-updated";

function getGuestWishlist(): ShopProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGuestWishlist(items: ShopProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CUSTOM_EVENT_KEY));
  } catch {
    // Ignore localStorage write error
  }
}

export function useWishlist() {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [wishlistProducts, setWishlistProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const isMigratingRef = useRef(false);

  // 1. Listen for Firebase Auth changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        // Fallback to guest list
        const guestItems = getGuestWishlist();
        setWishlistProducts(guestItems);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // 2. Real-time Firestore Wishlist Sync for Logged-in User
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const wishlistRef = collection(db, "users", currentUser.uid, "wishlist");
    const q = query(wishlistRef, orderBy("addedAt", "desc"));

    const unsubSnapshot = onSnapshot(
      q,
      async (snapshot) => {
        const products: ShopProduct[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.product) {
            products.push({
              ...data.product,
              id: docSnap.id,
            } as ShopProduct);
          } else {
            // Fallback for minimal doc
            products.push({
              id: docSnap.id,
              name: data.name || "Saved Item",
              description: data.description || "",
              price: Number(data.price) || 0,
              discountPrice: data.discountPrice ?? null,
              category: data.category || "Food",
              animals: Array.isArray(data.animals) ? data.animals : [],
              images: Array.isArray(data.images) ? data.images : [],
              brandId: data.brandId || "",
              brandName: data.brandName || "Verified Store",
              stockQty: Number(data.stockQty ?? 10),
              weight: Number(data.weight ?? 0.5),
              status: "active",
              avgRating: Number(data.avgRating || 0),
              reviewCount: Number(data.reviewCount || 0),
              createdAt: data.addedAt,
            } as ShopProduct);
          }
        });

        // Migrate guest items into user account if needed
        if (!isMigratingRef.current) {
          const guestItems = getGuestWishlist();
          if (guestItems.length > 0) {
            isMigratingRef.current = true;
            for (const item of guestItems) {
              const alreadyExists = products.some((p) => p.id === item.id);
              if (!alreadyExists) {
                const itemRef = doc(db, "users", currentUser.uid, "wishlist", item.id);
                setDoc(
                  itemRef,
                  {
                    productId: item.id,
                    product: item,
                    addedAt: serverTimestamp(),
                  },
                  { merge: true }
                ).catch(() => {});
              }
            }
            // Clear guest items after migration
            try {
              localStorage.removeItem(GUEST_STORAGE_KEY);
            } catch {}
          }
        }

        setWishlistProducts(products);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to user wishlist:", error);
        // Fallback to guest list on error
        setWishlistProducts(getGuestWishlist());
        setLoading(false);
      }
    );

    return () => unsubSnapshot();
  }, [currentUser]);

  // 3. Listen to localStorage updates across tabs / components for guests
  useEffect(() => {
    if (currentUser) return;

    const handleSync = () => {
      setWishlistProducts(getGuestWishlist());
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(CUSTOM_EVENT_KEY, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(CUSTOM_EVENT_KEY, handleSync);
    };
  }, [currentUser]);

  // Derived list of IDs
  const wishlistIds = wishlistProducts.map((p) => p.id);

  // Check if item is in wishlist
  const isInWishlist = useCallback(
    (productId: string): boolean => {
      if (!productId) return false;
      return wishlistProducts.some((p) => p.id === productId);
    },
    [wishlistProducts]
  );

  // Toggle wishlist item
  const toggleWishlist = useCallback(
    async (product: ShopProduct): Promise<void> => {
      if (!product || !product.id) return;

      const currentlyInWishlist = wishlistProducts.some((p) => p.id === product.id);

      if (currentUser) {
        const itemRef = doc(db, "users", currentUser.uid, "wishlist", product.id);
        if (currentlyInWishlist) {
          await deleteDoc(itemRef);
        } else {
          await setDoc(itemRef, {
            productId: product.id,
            product: {
              id: product.id,
              name: product.name,
              description: product.description || "",
              price: product.price,
              discountPrice: product.discountPrice ?? null,
              category: product.category || "Food",
              animals: product.animals || [],
              images: product.images || [],
              brandId: product.brandId || "",
              brandName: product.brandName || "",
              stockQty: product.stockQty ?? 10,
              weight: product.weight || 0.5,
              length: product.length ?? null,
              breadth: product.breadth ?? null,
              height: product.height ?? null,
              shiprocketPickupId: product.shiprocketPickupId ?? null,
              status: product.status || "active",
              avgRating: product.avgRating || 0,
              reviewCount: product.reviewCount || 0,
              featured: Boolean(product.featured),
            },
            addedAt: serverTimestamp(),
          });
        }
      } else {
        // Guest mode
        const currentGuestList = getGuestWishlist();
        let nextGuestList: ShopProduct[];
        if (currentlyInWishlist) {
          nextGuestList = currentGuestList.filter((p) => p.id !== product.id);
        } else {
          nextGuestList = [product, ...currentGuestList.filter((p) => p.id !== product.id)];
        }
        saveGuestWishlist(nextGuestList);
        setWishlistProducts(nextGuestList);
      }
    },
    [currentUser, wishlistProducts]
  );

  return {
    wishlistIds,
    wishlistProducts,
    isInWishlist,
    toggleWishlist,
    loading,
  };
}
