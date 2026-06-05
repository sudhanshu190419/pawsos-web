import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star, ShoppingCart } from "lucide-react";

/* ═══════════════════════════════════════════════════
   CATEGORY BADGE COLORS (matches homepage)
   ═══════════════════════════════════════════════════ */
const BADGE_COLORS: Record<string, string> = {
  Medicine: "bg-blue-500 text-white",
  Food: "bg-amber-500 text-white",
  Toys: "bg-violet-500 text-white",
  Bandages: "bg-emerald-500 text-white",
};
const DEFAULT_BADGE_COLOR = "bg-orange-500 text-white";

/* Simple deterministic hash from string */
function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function ProductCard({
  product,
  onAddToCart,
  priority = false,
}: {
  product: any;
  onAddToCart: (product: any) => void;
  priority?: boolean;
}) {
  const price = Number(product.price) || 0;
  const originalPrice = price > 0 ? Math.round(price * 1.35) : 0;
  const imageUrl = product.images?.[0] || null;
  const hasImage = !!imageUrl;
  const isFirebaseImage =
    typeof imageUrl === "string" &&
    imageUrl.includes("firebasestorage.googleapis.com");
  const category = product.category || "";
  const badgeColor = BADGE_COLORS[category] || DEFAULT_BADGE_COLOR;
  const blurDataUrl =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=";

  /* Stable pseudo-rating derived from product id */
  const seed = hashCode(product.id || "");
  const rating = Math.round((4.5 + (seed % 50) / 100) * 10) / 10;
  const reviews = 50 + (seed % 250);

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <Link
        href={`/shop/product/${product.id}`}
        className="block"
        tabIndex={0}
      >
        {/* ── IMAGE ── */}
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              unoptimized={isFirebaseImage}
              placeholder="blur"
              blurDataURL={blurDataUrl}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5l.75-.75"
                />
              </svg>
            </div>
          )}

          {/* Badge (category-colored, matching homepage) */}
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${badgeColor}`}
          >
            {category || "New"}
          </span>

          {/* Hover add-to-cart overlay — desktop only (matching homepage style) */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 hidden sm:flex items-center justify-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(product);
              }}
              aria-label="Add to cart"
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center
                         opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300"
            >
              <ShoppingBag className="w-4 h-4 text-orange-500" />
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="p-3 md:p-4">
          {/* Brand name */}
          {product.brandName && (
            <p className="text-[10px] font-semibold text-orange-500 truncate leading-none mb-1">
              {product.brandName}
            </p>
          )}

          {/* Product name */}
          <h3 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-slate-700">
              {rating}
            </span>
            <span className="text-[10px] text-slate-400">({reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              ₹{price.toLocaleString("en-IN")}
            </span>
            {originalPrice > price && (
              <span className="text-[11px] text-slate-400 line-through">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ── ADD TO CART — mobile full-width button ── */}
      <div className="px-3 pb-3 pt-0 sm:hidden">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="w-full flex items-center justify-center gap-1.5 bg-orange-500 active:bg-orange-600 text-white text-[11px] font-semibold py-2.5 rounded-xl transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
