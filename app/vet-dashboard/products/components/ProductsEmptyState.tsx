export default function ProductsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="text-4xl mb-3">📦</div>
      <h3 className="text-lg font-bold text-slate-900">No products yet</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Add your first product to start selling on the AnimalSathi marketplace.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
      >
        + Add Product
      </button>
      <p className="text-xs text-slate-400 mt-3">Shiprocket-ready listings sync here.</p>
    </div>
  );
}
