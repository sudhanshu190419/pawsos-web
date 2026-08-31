"use client";

import React, { memo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Eye,
  ShoppingCart,
  Star,
  ShoppingBag,
  ArrowLeftRight,
  Check,
  Sparkles,
  Dog,
  Cat,
  Bird,
  Fish,
  Rabbit,
} from "lucide-react";
import { useWishlist } from "@/app/shop/hooks/useWishlist";
import { useCompare } from "@/app/shop/hooks/useCompare";
import { ShopProduct, BADGE_COLORS, DEFAULT_BADGE_COLOR } from "@/app/shop/shopConstants";

const ANIMAL_ICON_MAP: Record<string, React.ElementType> = {
  Dog: Dog,
  Dogs: Dog,
  Cat: Cat,
  Cats: Cat,
  Bird: Bird,
  Birds: Bird,
  Fish: Fish,
  "Small Pets": Rabbit,
};

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    discountPrice?: number | null;
    category?: string;
    animals?: string[];
    images?: string[];
    brandName?: string;
    brandId?: string;
    avgRating?: number;
    reviewCount?: number;
    stockQty?: number;
    weight?: number;
    length?: number | null;
    breadth?: number | null;
    height?: number | null;
    shiprocketPickupId?: number | null;
    status?: "active" | "inactive" | "deleted";
    featured?: boolean;
    createdAt?: any;
    updatedAt?: any;
  };
  onAddToCart: (product: any) => void;
  onQuickView?: (product: any) => void;
  priority?: boolean;
  showCompare?: boolean;
  onRemoveFromWishlist?: (productId: string) => void;
}

const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  onQuickView,
  priority = false,
  showCompare = true,
  onRemoveFromWishlist,
}: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useCompare();

  const isWishlisted = isInWishlist(product.id);
  const compared = isCompared(product.id);

  const [isAddedLocal, setIsAddedLocal] = useState(false);

  // Price calculations - strictly real data
  const rawPrice = Number(product.price) || 0;
  const rawDiscount =
    product.discountPrice !== undefined && product.discountPrice !== null
      ? Number(product.discountPrice)
      : null;

  const hasDiscount =
    rawDiscount !== null && rawDiscount > 0 && rawDiscount < rawPrice;
  const displayPrice = hasDiscount ? rawDiscount : rawPrice;
  const originalPrice = hasDiscount ? rawPrice : null;
  const savings = hasDiscount ? rawPrice - rawDiscount : 0;
  const discountPercent = hasDiscount
    ? Math.round(((rawPrice - rawDiscount) / rawPrice) * 100)
    : 0;

  // Stock check
  const isOutOfStock =
    product.stockQty !== undefined &&
    product.stockQty !== null &&
    product.stockQty <= 0;

  // Image handling
  const imageUrl = product.images?.[0] || null;
  const hasImage = Boolean(imageUrl);
  const isFirebaseImage =
    typeof imageUrl === "string" &&
    (imageUrl.includes("firebasestorage.googleapis.com") ||
      imageUrl.includes("storage.googleapis.com"));
  const blurDataUrl =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=";

  // Category badge
  const category = product.category || "";
  const badgeColor = BADGE_COLORS[category] || DEFAULT_BADGE_COLOR;

  // Rating check
  const hasRating =
    typeof product.avgRating === "number" &&
    product.avgRating > 0 &&
    typeof product.reviewCount === "number" &&
    product.reviewCount > 0;

  const handleAddClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOutOfStock) return;

      onAddToCart(product);
      setIsAddedLocal(true);
      setTimeout(() => {
        setIsAddedLocal(false);
      }, 1500);
    },
    [isOutOfStock, onAddToCart, product]
  );

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-stone-200/80 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
    >
      <Link
        href={`/shop/product/${product.id}`}
        className="block flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-3xl"
        tabIndex={0}
      >
        {/* ── IMAGE CONTAINER (aspect-[4/3]) ── */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100/70">
          {hasImage ? (
            <Image
              src={imageUrl!}
              alt={product.name || "Product image"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              unoptimized={isFirebaseImage}
              placeholder="blur"
              blurDataURL={blurDataUrl}
              className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
          )}

          {/* Category Badge (top-left) */}
          {category && (
            <span
              className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${badgeColor}`}
            >
              {category}
            </span>
          )}

          {/* Top-Right Action Badges (Wishlist + Compare) - 40px min tap targets */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            {/* Compare Button */}
            {showCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCompare(product as ShopProduct);
                }}
                aria-label={compared ? "Remove from compare" : "Add to compare"}
                title={compared ? "Comparing this product" : "Compare with other products"}
                className={`min-w-[40px] min-h-[40px] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                  compared
                    ? "bg-secondary text-white shadow-secondary/30 scale-105"
                    : "bg-white/90 hover:bg-white text-stone-700 hover:text-secondary backdrop-blur-sm"
                }`}
              >
                {compared ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <ArrowLeftRight className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await toggleWishlist(product as ShopProduct);
                if (onRemoveFromWishlist && isWishlisted) {
                  onRemoveFromWishlist(product.id);
                }
              }}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              title={isWishlisted ? "In your wishlist" : "Save to wishlist"}
              className={`min-w-[40px] min-h-[40px] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                isWishlisted
                  ? "bg-rose-50 text-rose-500 hover:bg-rose-100 scale-105"
                  : "bg-white/90 hover:bg-white text-stone-700 hover:text-rose-500 backdrop-blur-sm"
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : ""
                }`}
              />
            </button>
          </div>

          {/* Quick View Button on Desktop Hover - 40px min height */}
          {onQuickView && (
            <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center justify-center z-10 pointer-events-none group-hover:pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(product);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[40px] bg-white/95 hover:bg-white text-neutral-900 text-xs font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Eye className="w-4 h-4 text-primary" />
                <span>Quick View</span>
              </button>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
              <span className="px-3 py-1.5 bg-stone-900/90 text-white text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-wider shadow-md">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── CARD BODY (8-point scale: p-4 sm:p-5) ── */}
        <div className="p-4 sm:p-5 flex flex-col space-y-2">
          {/* Brand Name & Animals */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-primary truncate">
              {product.brandName || "AnimalSathi Verified"}
            </span>

            {/* Target Animal Icon */}
            {product.animals && product.animals.length > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {product.animals.slice(0, 2).map((animal) => {
                  const AnimalIcon = ANIMAL_ICON_MAP[animal] || Dog;
                  return (
                    <span
                      key={animal}
                      title={animal}
                      className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
                    >
                      <AnimalIcon className="w-3 h-3" />
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 leading-snug min-h-[2.4rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Real Rating (only shown if real rating exists) */}
          {hasRating ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black text-stone-900">
                  {product.avgRating?.toFixed(1)}
                </span>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">
                ({product.reviewCount})
              </span>
            </div>
          ) : (
            <div className="h-4" />
          )}

          {/* Price & Desktop Add-to-Cart (Unified Cognitive Price & Discount Grouping) */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-1">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-black text-stone-900 tracking-tight">
                  ₹{displayPrice.toLocaleString("en-IN")}
                </span>
                {originalPrice !== null && (
                  <span className="text-[11px] text-stone-400 line-through font-medium">
                    ₹{originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-extrabold">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Save ₹{savings.toLocaleString("en-IN")}</span>
                    <span className="text-emerald-600 font-black">({discountPercent}% OFF)</span>
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Add to Cart Button (40px min hit target) */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddClick}
              aria-label={isOutOfStock ? "Out of Stock" : "Add to Cart"}
              className={`hidden sm:flex items-center justify-center min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl transition-all duration-200 shadow-sm active:scale-95 ${
                isAddedLocal
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : isOutOfStock
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
              }`}
            >
              {isAddedLocal ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </Link>

      {/* ── MOBILE ADD TO CART BUTTON (40px min tap target) ── */}
      <div className="px-4 pb-4 pt-0 sm:hidden">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddClick}
          className={`w-full min-h-[40px] flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
            isAddedLocal
              ? "bg-emerald-600 text-white shadow-sm"
              : isOutOfStock
              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-primary active:bg-primary-container text-white shadow-sm"
          }`}
        >
          {isAddedLocal ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
});

export default ProductCard;
