"use client";

import type { ProductRecord } from "../productTypes";

interface ProductCardProps {
  product: ProductRecord;
  onEdit: (product: ProductRecord) => void;
  onDelete: (product: ProductRecord) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const image = product.images[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
      <div className="relative w-full aspect-[4/3] rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No image</div>
        )}
        <span className="absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          {product.status}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Stock: {product.stockQty}</span>
          <span className="text-slate-900 font-semibold">₹{product.price.toFixed(0)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
