import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Plus } from "lucide-react";

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
  const originalPrice = price + 50;
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  const imageUrl = product.images?.[0] || null;
  const hasImage = !!imageUrl;
  const isFirebaseImage = typeof imageUrl === "string" && imageUrl.includes("firebasestorage.googleapis.com");
  const blurDataUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=";

  return (
    <div className="group relative flex flex-col bg-white border border-neutral-100 rounded-xl overflow-hidden hover:border-neutral-200 hover:shadow-md transition-all duration-200">
      <Link href={`/shop/product/${product.id}`} className="block flex-1" tabIndex={0}>

        {/* ── IMAGE ── */}
        <div className="relative w-full aspect-square bg-neutral-50 overflow-hidden">
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
              className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-200">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5l.75-.75" />
              </svg>
            </div>
          )}

          {/* Discount badge — only shown when meaningful */}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
              {discount}%&nbsp;OFF
            </span>
          )}

          {/* Quick-add button — desktop hover */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
            aria-label="Add to cart"
            className="hidden sm:flex absolute bottom-2 right-2 w-8 h-8 items-center justify-center bg-white border border-neutral-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 hover:bg-orange-500 hover:border-orange-500 hover:text-white text-neutral-700"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div className="px-2.5 pt-2 pb-1">
          {/* Clinic name */}
          {product.brandName && (
            <p className="text-[10px] font-semibold text-orange-500 truncate leading-none mb-1">
              {product.brandName}
            </p>
          )}

          {/* Product name */}
          <h3 className="text-[12px] sm:text-[13px] font-semibold text-neutral-800 line-clamp-2 leading-snug mb-1.5">
            {product.name}
          </h3>

          {/* Price row */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] sm:text-[14px] font-bold text-neutral-900">
              ₹{price.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-neutral-400 line-through leading-none">
              ₹{originalPrice.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </Link>

      {/* ── ADD TO CART — mobile full-width button ── */}
      <div className="px-2.5 pb-2.5 pt-1 sm:hidden">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
          className="w-full flex items-center justify-center gap-1.5 bg-orange-500 active:bg-orange-600 text-white text-[11px] font-semibold py-2 rounded-lg transition-colors"
        >
          <ShoppingCart className="w-3 h-3" strokeWidth={2} />
          Add to Cart
        </button>
      </div>

      {/* ── ADD TO CART — desktop text row (below price, no hover needed) ── */}
      <div className="hidden sm:block px-2.5 pb-2.5 pt-0.5">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
          className="w-full flex items-center justify-center gap-1.5 border border-orange-100 hover:bg-orange-500 hover:border-orange-500 hover:text-white text-orange-500 text-[11px] font-semibold py-1.5 rounded-lg transition-all duration-150"
        >
          <ShoppingCart className="w-3 h-3" strokeWidth={2} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}