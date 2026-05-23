"use client";

interface ProductsHeaderProps {
  total: number;
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
}

export default function ProductsHeader({ total, search, onSearch, onAdd }: ProductsHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Products</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Catalog</h2>
        <p className="text-sm text-slate-500 mt-1">{total} products in your marketplace.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products"
            className="w-full sm:w-64 rounded-xl px-4 py-2.5 text-sm font-medium border border-slate-200 bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
        >
          + Add Product
        </button>
      </div>
    </div>
  );
}
