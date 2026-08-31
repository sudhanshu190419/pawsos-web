"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  documentId,
} from "firebase/firestore";

import { db, auth } from "@/app/lib/firebase";
import { useCart } from "@/app/components/cart";
import {
  ANIMAL_OPTIONS,
  CATEGORY_OPTIONS,
  BADGE_COLORS,
  DEFAULT_BADGE_COLOR,
  ShopProduct,
} from "@/app/shop/shopConstants";
import { useReviews } from "@/app/shop/hooks/useReviews";
import { useRecentlyViewed } from "@/app/shop/hooks/useRecentlyViewed";

import SmoothScrollProvider from "@/app/shop/providers/SmoothScrollProvider";
import GSAPRegistration from "@/app/shop/providers/GSAPRegistration";
import ShopHeader from "@/app/components/ShopHeader";
import ProductCard from "@/app/components/ProductCard";
import CheckoutPanel from "@/app/components/CheckoutPanel";
import QuickViewModal from "@/app/components/QuickViewModal";
import CartDrawer from "@/app/components/CartDrawer";

import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  Share2,
  Check,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Package,
  AlertCircle,
  X,
  MessageSquare,
  Award,
  Layers,
  ArrowRight,
  Clock,
  Sparkle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   HELPERS & CONSTANTS
   ═══════════════════════════════════════════════════ */

const ANIMAL_EMOJI_MAP: Record<string, string> = Object.fromEntries(
  ANIMAL_OPTIONS.map((a) => [a.value, `${a.emoji} ${a.label}`])
);

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Vet Verified",
    desc: "Clinically tested & approved formulation",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Express 24–48 hrs pan-India shipping",
  },
  {
    icon: RotateCcw,
    title: "Easy 7-Day Returns",
    desc: "100% refund guarantee on unopened items",
  },
] as const;

type ActiveTab = "description" | "specifications" | "reviews";

/* ═══════════════════════════════════════════════════
   STAR RATING DISPLAY
   ═══════════════════════════════════════════════════ */
const StarRating = memo(
  ({
    rating,
    size = "md",
    showCount = false,
    reviewCount,
    onClick,
  }: {
    rating: number;
    size?: "sm" | "md" | "lg";
    showCount?: boolean;
    reviewCount?: number;
    onClick?: () => void;
  }) => {
    const starSizeCls =
      size === "sm"
        ? "w-3.5 h-3.5"
        : size === "lg"
        ? "w-5 h-5"
        : "w-4 h-4";

    return (
      <div
        className={`inline-flex items-center gap-1.5 ${
          onClick ? "cursor-pointer group" : ""
        }`}
        onClick={onClick}
      >
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const filled = i + 1 <= Math.round(rating);
            return (
              <Star
                key={i}
                className={`${starSizeCls} ${
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-neutral-200 text-neutral-200"
                } transition-transform group-hover:scale-110`}
              />
            );
          })}
        </div>
        {showCount && (
          <span className="text-xs font-semibold text-neutral-600 group-hover:text-primary transition-colors">
            {rating > 0 ? rating.toFixed(1) : "New"}
            {typeof reviewCount === "number" && ` (${reviewCount} reviews)`}
          </span>
        )}
      </div>
    );
  }
);
StarRating.displayName = "StarRating";

/* ═══════════════════════════════════════════════════
   WRITE REVIEW MODAL
   ═══════════════════════════════════════════════════ */
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: { rating: number; text: string; userName: string }) => Promise<boolean>;
  submitting: boolean;
  productName: string;
  defaultUserName?: string;
}

const WriteReviewModal = memo(function WriteReviewModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  productName,
  defaultUserName = "",
}: WriteReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState(defaultUserName);
  const [text, setText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUserName(defaultUserName || "");
      setText("");
      setRating(5);
      setHoverRating(0);
      setFormError(null);
    }
  }, [isOpen, defaultUserName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    if (text.trim().length < 5) {
      setFormError("Please write at least 5 characters in your review.");
      return;
    }
    setFormError(null);
    const success = await onSubmit({
      rating,
      text: text.trim(),
      userName: userName.trim(),
    });
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-warm-surface border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 font-sans">
              Write a Review
            </h3>
            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
              for {productName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Star Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Overall Rating *
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-neutral-300 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          active
                            ? "fill-amber-400 text-amber-400"
                            : "fill-neutral-200 text-neutral-200"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-neutral-600">
                {RATING_LABELS[hoverRating || rating]}
              </span>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Your Review *
            </label>
            <textarea
              required
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did your pet think? Tell other pet parents about product quality, size, and experience..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
            <p className="text-[11px] text-neutral-400 mt-1 text-right">
              {text.trim().length}/5 characters minimum
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#85341c] disabled:opacity-50 transition-all flex items-center gap-2 active:scale-95"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════
   TOAST NOTIFICATION COMPONENT
   ═══════════════════════════════════════════════════ */
const Toast = memo(
  ({
    message,
    type = "success",
    onClose,
  }: {
    message: string;
    type?: "success" | "info" | "error";
    onClose: () => void;
  }) => {
    useEffect(() => {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[100002] flex items-center gap-2.5 px-4 py-3 bg-neutral-900 text-white rounded-2xl shadow-xl text-xs font-medium border border-neutral-800"
      >
        {type === "success" && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        )}
        {type === "info" && (
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
        )}
        {type === "error" && (
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        )}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-neutral-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }
);
Toast.displayName = "Toast";

/* ═══════════════════════════════════════════════════
   MAIN PRODUCT DETAIL PAGE COMPONENT
   ═══════════════════════════════════════════════════ */
export default function FullProduct() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const productId = Array.isArray(rawId) ? rawId[0] : rawId || "";

  // Authentication State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Cart & Hooks
  const { items: cartItems, totals, addItem, updateQty, removeItem } = useCart();
  const {
    reviews,
    loading: reviewsLoading,
    submitting: reviewSubmitting,
    submitReview,
  } = useReviews(productId);
  const { recentIds, addProduct: recordRecentlyViewed } = useRecentlyViewed();

  // Component State
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Gallery & Purchase State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddedAnimation, setIsAddedAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("description");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ShopProduct | null>(null);

  // Carousels Data
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([]);
  const [recentProducts, setRecentProducts] = useState<ShopProduct[]>([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const reviewsSectionRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      setToastMessage({ message, type });
    },
    []
  );

  // Fetch Main Product
  useEffect(() => {
    if (!productId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    async function loadProduct() {
      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || !isMounted) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const data = docSnap.data();
        if (data.status === "deleted" || data.status === "inactive") {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const loadedProduct = {
          id: docSnap.id,
          ...data,
        } as ShopProduct;

        if (isMounted) {
          setProduct(loadedProduct);
          setActiveImageIndex(0);
          setQuantity(1);
          setLoading(false);
          // Register to recently viewed
          recordRecentlyViewed(loadedProduct.id);
        }
      } catch (err) {
        console.error("Error loading product:", err);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId, recordRecentlyViewed]);

  // Fetch Related Products (same category)
  useEffect(() => {
    if (!product?.category || !product?.id) return;
    const currentCategory = product.category;
    const currentId = product.id;
    let isMounted = true;

    async function loadRelated() {
      try {
        const q = query(
          collection(db, "products"),
          where("category", "==", currentCategory),
          where("status", "==", "active"),
          limit(8)
        );
        const snap = await getDocs(q);
        const list: ShopProduct[] = [];
        snap.forEach((d) => {
          if (d.id !== currentId) {
            list.push({ id: d.id, ...d.data() } as ShopProduct);
          }
        });
        if (isMounted) {
          setRelatedProducts(list.slice(0, 6));
        }
      } catch (err) {
        console.error("Error fetching related products:", err);
      }
    }

    loadRelated();
    return () => {
      isMounted = false;
    };
  }, [product?.category, product?.id]);

  // Fetch Recently Viewed Products
  useEffect(() => {
    const idsToFetch = recentIds.filter((id) => id !== productId).slice(0, 6);
    if (idsToFetch.length === 0) {
      setRecentProducts([]);
      return;
    }

    let isMounted = true;
    async function loadRecent() {
      try {
        const docsSnap = await Promise.all(
          idsToFetch.map((id) => getDoc(doc(db, "products", id)))
        );
        const items: ShopProduct[] = [];
        docsSnap.forEach((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.status === "active") {
              items.push({ id: snap.id, ...data } as ShopProduct);
            }
          }
        });
        if (isMounted) {
          setRecentProducts(items);
        }
      } catch (err) {
        console.error("Error fetching recent products:", err);
      }
    }

    loadRecent();
    return () => {
      isMounted = false;
    };
  }, [recentIds, productId]);

  // Price & Stock Calculations
  const activePrice = product?.discountPrice ?? product?.price ?? 0;
  const originalPrice = product?.price ?? 0;
  const hasDiscount =
    product?.discountPrice !== undefined &&
    product.discountPrice !== null &&
    product.discountPrice < originalPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - activePrice) / originalPrice) * 100)
    : 0;
  const savingsAmount = hasDiscount ? originalPrice - activePrice : 0;

  const stockQty = product?.stockQty ?? 0;
  const isOutOfStock = stockQty <= 0;
  const isLowStock = stockQty > 0 && stockQty <= 8;

  // Images list with fallback
  const images = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    return ["/placeholder-product.png"];
  }, [product]);

  // Rating calculations from product / reviews
  const avgRating = product?.avgRating || 0;
  const reviewCount = product?.reviewCount || reviews.length || 0;

  // Rating breakdown percentages
  const ratingDistribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded] = (counts[rounded] || 0) + 1;
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((stars) => {
      const cnt = counts[stars] || 0;
      const pct = Math.round((cnt / total) * 100);
      return { stars, count: cnt, percent: reviews.length ? pct : 0 };
    });
  }, [reviews]);

  // Add to Cart handler
  const handleAddToCart = useCallback(() => {
    if (!product || isOutOfStock) return;
    const res = addItem(product, quantity);
    if (!res.ok) {
      showToast(res.reason || "Could not add to cart", "error");
      return;
    }
    setIsAddedAnimation(true);
    showToast(`Added ${quantity} × ${product.name} to cart!`, "success");
    setTimeout(() => setIsAddedAnimation(false), 1800);
  }, [product, isOutOfStock, quantity, addItem, showToast]);

  // Buy Now handler
  const handleBuyNow = useCallback(() => {
    if (!product || isOutOfStock) return;
    addItem(product, quantity);
    setIsCheckoutOpen(true);
  }, [product, isOutOfStock, quantity, addItem]);

  // Share handler
  const handleShare = useCallback(() => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Product link copied to clipboard!", "info");
    }
  }, [showToast]);

  // Wishlist handler
  const handleToggleWishlist = useCallback(() => {
    setIsWishlisted((prev) => {
      const next = !prev;
      showToast(
        next ? "Added to your wishlist!" : "Removed from wishlist",
        "info"
      );
      return next;
    });
  }, [showToast]);

  // Submit Review
  const handleSubmitReview = useCallback(
    async ({
      rating,
      text,
      userName,
    }: {
      rating: number;
      text: string;
      userName: string;
    }) => {
      if (!product) return false;
      const res = await submitReview({
        rating,
        text,
        userName,
        userId: currentUser?.uid || `guest-${Date.now()}`,
        userAvatar: currentUser?.photoURL || null,
      });
      if (res.success) {
        showToast("Thank you! Your review has been submitted.", "success");
        return true;
      } else {
        showToast(res.error || "Failed to submit review", "error");
        return false;
      }
    },
    [product, submitReview, currentUser, showToast]
  );

  // Scroll to reviews
  const scrollToReviews = useCallback(() => {
    setActiveTab("reviews");
    reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Quick View handler
  const handleOpenQuickView = useCallback((p: ShopProduct) => {
    setQuickViewProduct(p);
  }, []);

  // Loading Skeleton State
  if (loading) {
    return (
      <GSAPRegistration>
        <SmoothScrollProvider>
          <div className="min-h-screen bg-warm-surface flex flex-col">
            <ShopHeader
              onCartClick={() => setIsCartOpen(true)}
              cartCount={totals.itemCount}
              user={currentUser}
            />
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 animate-pulse space-y-8">
              {/* Breadcrumb Skeleton */}
              <div className="h-4 w-48 bg-neutral-200 rounded-md" />

              {/* Main Grid Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                <div className="lg:col-span-6 space-y-4">
                  <div className="aspect-[4/3] w-full bg-neutral-200 rounded-2xl" />
                  <div className="flex gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-16 h-16 bg-neutral-200 rounded-xl" />
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-6 space-y-4">
                  <div className="h-6 w-32 bg-neutral-200 rounded-full" />
                  <div className="h-8 w-3/4 bg-neutral-200 rounded-lg" />
                  <div className="h-5 w-40 bg-neutral-200 rounded-md" />
                  <div className="h-10 w-48 bg-neutral-200 rounded-lg" />
                  <div className="h-24 w-full bg-neutral-200 rounded-xl" />
                  <div className="h-12 w-full bg-neutral-200 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </SmoothScrollProvider>
      </GSAPRegistration>
    );
  }

  // Not Found State
  if (notFound || !product) {
    return (
      <GSAPRegistration>
        <SmoothScrollProvider>
          <div className="min-h-screen bg-warm-surface flex flex-col">
            <ShopHeader
              onCartClick={() => setIsCartOpen(true)}
              cartCount={totals.itemCount}
              user={currentUser}
            />
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary">
                <Package className="w-10 h-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans tracking-tight">
                Product Not Found
              </h1>
              <p className="text-sm text-neutral-500 max-w-md mt-2 leading-relaxed">
                The pet item you are looking for is unavailable, out of catalog,
                or has moved to a new home.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/shop"
                  className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#85341c] transition-all flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Back to Shop
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </SmoothScrollProvider>
      </GSAPRegistration>
    );
  }

  const categoryBadgeColor =
    BADGE_COLORS[product.category] || DEFAULT_BADGE_COLOR;

  return (
    <GSAPRegistration>
      <SmoothScrollProvider>
        <div className="min-h-screen bg-warm-surface text-neutral-900 flex flex-col selection:bg-primary/20">
          {/* Header */}
          <ShopHeader
            onCartClick={() => setIsCartOpen(true)}
            cartCount={totals.itemCount}
            user={currentUser}
            onSearch={(q) => router.push(`/shop?q=${encodeURIComponent(q)}`)}
            onSelectAnimal={(a) =>
              router.push(`/shop?animal=${encodeURIComponent(a)}`)
            }
            onSelectCategory={(c) =>
              router.push(`/shop?category=${encodeURIComponent(c)}`)
            }
          />

          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 sm:space-y-14">
            {/* ═══════════════════════════════════════════════════
                BREADCRUMBS
                ═══════════════════════════════════════════════════ */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap"
            >
              <Link
                href="/"
                className="hover:text-primary transition-colors font-medium"
              >
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <Link
                href="/shop"
                className="hover:text-primary transition-colors font-medium"
              >
                Shop
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <Link
                href={`/shop?category=${encodeURIComponent(product.category)}`}
                className="hover:text-primary transition-colors font-medium capitalize"
              >
                {product.category}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-800 font-semibold truncate max-w-[200px] sm:max-w-[300px]">
                {product.name}
              </span>
            </nav>

            {/* ═══════════════════════════════════════════════════
                TOP SECTION: GALLERY & PRODUCT PURCHASE PANEL
                ═══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Image Gallery */}
              <div className="lg:col-span-6 space-y-4">
                {/* Main 4:3 Aspect Image Display */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-neutral-200/80 shadow-sm group">
                  <Image
                    src={images[activeImageIndex] || "/placeholder-product.png"}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    unoptimized={true}
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2 items-center z-10">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${categoryBadgeColor}`}
                    >
                      {product.category}
                    </span>
                    {hasDiscount && (
                      <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-red-600 text-white shadow-sm flex items-center gap-1">
                        <Sparkle className="w-3 h-3" />
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Wishlist & Share Actions */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-white transition-all active:scale-95"
                      title="Share product"
                      aria-label="Share product"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-neutral-600 hover:text-red-500 hover:bg-white transition-all active:scale-95"
                      title="Add to wishlist"
                      aria-label="Add to wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isWishlisted
                            ? "fill-red-500 text-red-500"
                            : "text-neutral-600"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Selector Row */}
                {images.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white border-2 flex-shrink-0 transition-all ${
                          activeImageIndex === idx
                            ? "border-primary ring-2 ring-primary/20 shadow-md scale-105"
                            : "border-neutral-200/80 hover:border-neutral-300 opacity-75 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={imgUrl}
                          alt={`${product.name} thumbnail ${idx + 1}`}
                          fill
                          sizes="80px"
                          unoptimized={true}
                          className="object-cover object-center"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Product Info & Actions */}
              <div className="lg:col-span-6 space-y-6">
                {/* Brand & Animals */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {product.brandName || "Verified Pet Store"}
                  </span>
                  {product.animals && product.animals.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {product.animals.map((animal) => (
                        <span
                          key={animal}
                          className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold"
                        >
                          {ANIMAL_EMOJI_MAP[animal] || animal}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Ratings Row */}
                <div className="flex items-center gap-3 pt-1">
                  <StarRating
                    rating={avgRating}
                    size="md"
                    showCount
                    reviewCount={reviewCount}
                    onClick={scrollToReviews}
                  />
                  <span className="text-neutral-300">•</span>
                  <button
                    type="button"
                    onClick={scrollToReviews}
                    className="text-xs font-semibold text-secondary hover:text-primary transition-colors underline underline-offset-2"
                  >
                    Read {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                  </button>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/70 shadow-sm space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-extrabold text-neutral-900 font-sans tracking-tight">
                      ₹{activePrice.toLocaleString("en-IN")}
                    </span>
                    {hasDiscount && (
                      <span className="text-base sm:text-lg text-neutral-400 line-through font-medium">
                        ₹{originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                        Save ₹{savingsAmount.toLocaleString("en-IN")} (
                        {discountPercent}% OFF)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Inclusive of all taxes. Free shipping on orders above ₹499.
                  </p>
                </div>

                {/* Stock Indicator */}
                <div className="flex items-center gap-2 text-xs font-medium">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 text-red-600 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      Only {stockQty} left in stock - order soon
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      In Stock ({stockQty} units available)
                    </span>
                  )}
                </div>

                {/* Quantity & Actions */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Quantity
                    </span>
                    <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                      <button
                        type="button"
                        disabled={isOutOfStock || quantity <= 1}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-neutral-900 select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock || quantity >= Math.min(stockQty, 99)}
                        onClick={() =>
                          setQuantity((q) =>
                            Math.min(stockQty > 0 ? stockQty : 99, q + 1)
                          )
                        }
                        className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors active:scale-95"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={handleAddToCart}
                      className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                        isAddedAnimation
                          ? "bg-emerald-600 text-white"
                          : "bg-white border-2 border-primary text-primary hover:bg-primary/5"
                      } disabled:opacity-50 disabled:pointer-events-none`}
                    >
                      {isAddedAnimation ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          Added to Cart!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={handleBuyNow}
                      className="w-full py-3.5 px-6 bg-gradient-to-r from-primary via-[#b3492d] to-primary hover:from-[#85341c] hover:to-[#85341c] text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Buy Now
                    </button>
                  </div>
                </div>

                {/* Value Props Grid */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-200/80">
                  {VALUE_PROPS.map((prop, idx) => {
                    const Icon = prop.icon;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center text-center p-3 rounded-xl bg-white border border-neutral-100 shadow-sm hover:border-neutral-200 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-neutral-800 line-clamp-1">
                          {prop.title}
                        </h4>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5">
                          {prop.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                MIDDLE SECTION: TABBED PANEL
                ═══════════════════════════════════════════════════ */}
            <div
              ref={reviewsSectionRef}
              className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden"
            >
              {/* Tab Navigation Bar */}
              <div className="flex border-b border-neutral-200 bg-neutral-50/50 overflow-x-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab("description")}
                  className={`px-6 py-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                    activeTab === "description"
                      ? "border-primary text-primary bg-white shadow-sm"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Description
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("specifications")}
                  className={`px-6 py-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                    activeTab === "specifications"
                      ? "border-primary text-primary bg-white shadow-sm"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Specifications
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`px-6 py-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                    activeTab === "reviews"
                      ? "border-primary text-primary bg-white shadow-sm"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Customer Reviews ({reviewCount})
                </button>
              </div>

              {/* Tab 1: Description */}
              {activeTab === "description" && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="prose max-w-none text-neutral-700 text-sm leading-relaxed whitespace-pre-line font-normal">
                    {product.description ||
                      "No extended description provided for this product."}
                  </div>

                  {/* Benefit highlights */}
                  <div className="pt-6 border-t border-neutral-100">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">
                      Why Pet Parents Love This
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-warm-surface border border-neutral-200/60 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-800">
                            100% Genuine & Safe
                          </h4>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Sourced directly from verified brands and licensed vet
                            laboratories.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-warm-surface border border-neutral-200/60 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-800">
                            Vet Formulated
                          </h4>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Tailored for maximum bioavailability and high pet
                            palatability.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-warm-surface border border-neutral-200/60 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-800">
                            Temperature-Controlled Shipping
                          </h4>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Packed securely to retain freshness, potency, and
                            integrity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Specifications */}
              {activeTab === "specifications" && (
                <div className="p-6 sm:p-8">
                  <div className="max-w-2xl overflow-hidden rounded-xl border border-neutral-200">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <tbody className="divide-y divide-neutral-200">
                        <tr className="bg-neutral-50">
                          <td className="py-3 px-4 font-semibold text-neutral-600 w-1/3">
                            Category
                          </td>
                          <td className="py-3 px-4 font-medium text-neutral-900">
                            {product.category}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-neutral-600">
                            Suitable Animals
                          </td>
                          <td className="py-3 px-4 font-medium text-neutral-900">
                            {product.animals?.join(", ") || "All Pets"}
                          </td>
                        </tr>
                        <tr className="bg-neutral-50">
                          <td className="py-3 px-4 font-semibold text-neutral-600">
                            Net Weight
                          </td>
                          <td className="py-3 px-4 font-medium text-neutral-900">
                            {product.weight ? `${product.weight} kg` : "Standard"}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-neutral-600">
                            Dimensions (L × B × H)
                          </td>
                          <td className="py-3 px-4 font-medium text-neutral-900">
                            {product.length && product.breadth && product.height
                              ? `${product.length} × ${product.breadth} × ${product.height} cm`
                              : "Standard Unit Size"}
                          </td>
                        </tr>
                        <tr className="bg-neutral-50">
                          <td className="py-3 px-4 font-semibold text-neutral-600">
                            Brand / Seller
                          </td>
                          <td className="py-3 px-4 font-medium text-neutral-900">
                            {product.brandName || "PawSOS Store"}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-neutral-600">
                            Product SKU
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-neutral-600">
                            {product.id}
                          </td>
                        </tr>
                        <tr className="bg-neutral-50">
                          <td className="py-3 px-4 font-semibold text-neutral-600">
                            Storage Instructions
                          </td>
                          <td className="py-3 px-4 font-medium text-neutral-900">
                            Store in a cool, dry place away from direct sunlight
                            and moisture.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Customer Reviews */}
              {activeTab === "reviews" && (
                <div className="p-6 sm:p-8 space-y-8">
                  {/* Reviews Aggregate Header */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-6 rounded-2xl bg-warm-surface border border-neutral-200/70">
                    {/* Overall Score */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center md:border-r md:border-neutral-200/80 pr-0 md:pr-6">
                      <span className="text-5xl font-extrabold text-neutral-900 font-sans tracking-tight">
                        {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                      </span>
                      <div className="mt-2">
                        <StarRating rating={avgRating} size="lg" />
                      </div>
                      <p className="text-xs text-neutral-500 font-medium mt-1">
                        Based on {reviewCount} verified ratings
                      </p>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="md:col-span-5 space-y-2">
                      {ratingDistribution.map((item) => (
                        <div
                          key={item.stars}
                          className="flex items-center gap-3 text-xs"
                        >
                          <span className="w-12 font-medium text-neutral-600 flex items-center gap-1">
                            {item.stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-medium text-neutral-400">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Write Review CTA */}
                    <div className="md:col-span-3 flex flex-col items-center justify-center text-center pl-0 md:pl-4">
                      <p className="text-xs text-neutral-600 mb-3 font-medium">
                        Have you used this product?
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsReviewModalOpen(true)}
                        className="w-full py-2.5 px-4 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#85341c] transition-colors flex items-center justify-center gap-2 active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Write a Review
                      </button>
                    </div>
                  </div>

                  {/* Reviews List */}
                  {reviewsLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-neutral-400">Loading reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-bold text-neutral-800">
                        No reviews yet
                      </h4>
                      <p className="text-xs text-neutral-500 max-w-sm">
                        Be the first to share your experience with other pet
                        parents!
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsReviewModalOpen(true)}
                        className="mt-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-[#85341c] transition-colors"
                      >
                        Be the First to Review
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 space-y-4">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                {rev.userName ? rev.userName.charAt(0).toUpperCase() : "A"}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-neutral-900">
                                    {rev.userName}
                                  </h4>
                                  {rev.verified && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Verified Buyer
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-neutral-400">
                                  {new Date(rev.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                            <StarRating rating={rev.rating} size="sm" />
                          </div>

                          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
                            {rev.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════
                BOTTOM SECTION 1: RELATED PRODUCTS
                ═══════════════════════════════════════════════════ */}
            {relatedProducts.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-sans tracking-tight">
                      Related Products in {product.category}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Explore similar essentials for your beloved pets
                    </p>
                  </div>
                  <Link
                    href={`/shop?category=${encodeURIComponent(product.category)}`}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    View all in {product.category}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {relatedProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={(prod) => {
                        addItem(prod, 1);
                        showToast(`Added ${prod.name} to cart!`, "success");
                      }}
                      onQuickView={handleOpenQuickView}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════
                BOTTOM SECTION 2: RECENTLY VIEWED PRODUCTS
                ═══════════════════════════════════════════════════ */}
            {recentProducts.length > 0 && (
              <section className="space-y-6 pt-4 border-t border-neutral-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-sans tracking-tight">
                      Recently Viewed
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Items you checked out recently
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {recentProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={(prod) => {
                        addItem(prod, 1);
                        showToast(`Added ${prod.name} to cart!`, "success");
                      }}
                      onQuickView={handleOpenQuickView}
                    />
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ═══════════════════════════════════════════════════
              MODALS, DRAWERS & OVERLAYS
              ═══════════════════════════════════════════════════ */}
          {/* Cart Drawer */}
          {isCartOpen && (
            <CartDrawer
              items={cartItems}
              total={totals.subtotal}
              onClose={() => setIsCartOpen(false)}
              onUpdateQty={updateQty}
              onRemove={removeItem}
              onBuyNow={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
            />
          )}

          {/* Checkout Panel */}
          {isCheckoutOpen && (
            <CheckoutPanel
              items={cartItems}
              onClose={() => setIsCheckoutOpen(false)}
              onBackToCart={() => {
                setIsCheckoutOpen(false);
                setIsCartOpen(true);
              }}
              onOrderPlaced={(orderId) => {
                setIsCheckoutOpen(false);
                showToast(`Order placed successfully! #${orderId}`, "success");
                router.push(`/shop`);
              }}
            />
          )}

          {/* Quick View Modal */}
          {quickViewProduct && (
            <QuickViewModal
              product={quickViewProduct}
              isOpen={!!quickViewProduct}
              onClose={() => setQuickViewProduct(null)}
              onAddToCart={(p, qty) => {
                addItem(p, qty);
                showToast(`Added ${qty} × ${p.name} to cart!`, "success");
              }}
            />
          )}

          {/* Write Review Modal */}
          <WriteReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onSubmit={handleSubmitReview}
            submitting={reviewSubmitting}
            productName={product.name}
            defaultUserName={currentUser?.displayName || ""}
          />

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <Toast
                message={toastMessage.message}
                type={toastMessage.type}
                onClose={() => setToastMessage(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </SmoothScrollProvider>
    </GSAPRegistration>
  );
}