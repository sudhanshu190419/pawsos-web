"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";

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
const originalPrice = price + 50; // fake MRP for UI
const discount = Math.round(((originalPrice - price) / originalPrice) * 100);

return ( <div className="group w-[190px] sm:w-[210px] flex-shrink-0 bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">

```
  {/* IMAGE */}
  <div className="relative w-full h-40 overflow-hidden">
    <Image
      src={product.imageUrl}
      alt={product.name}
      fill
      sizes="(max-width: 640px) 190px, 210px"
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
    />

    {/* DISCOUNT BADGE */}
    <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">
      {discount}% OFF
    </span>
  </div>

  {/* CONTENT */}
  <div className="p-3 flex flex-col gap-1">

    {/* CLINIC */}
    <p className="text-[11px] text-orange-600 font-semibold">
      {product.vetClinicName || "Verified Clinic"}
    </p>

    {/* NAME */}
    <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">
      {product.name}
    </h3>

    {/* RATING */}
    <div className="flex items-center gap-1 text-[11px] text-yellow-500">
      ⭐⭐⭐⭐☆
      <span className="text-slate-500">(120)</span>
    </div>

    {/* PRICE */}
    <div className="flex items-center gap-2 mt-1">
      <span className="text-base font-semibold text-slate-800">
        ₹{price}
      </span>
      <span className="text-xs line-through text-slate-400">
        ₹{originalPrice}
      </span>
    </div>

    {/* BUTTON */}
    <button
      onClick={() => onAddToCart(product)}
      className="mt-2 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2 rounded-lg transition"
    >
      <ShoppingCart className="w-4 h-4" />
      Add to Cart
    </button>

  </div>
</div>


);
}
