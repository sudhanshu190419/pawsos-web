"use client";

import { memo, useEffect } from "react";
import Image from "next/image";

type CartItem = {
  id: string;
  name: string;
  price: number | string;
  qty?: number;
  imageUrl?: string;
  vetClinicName?: string;
};

type CartDrawerProps = {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onBuyNow: () => void;
};

const CartDrawer = memo(
  ({ items, total, onClose, onUpdateQty, onRemove, onBuyNow }: CartDrawerProps) => {
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handler);
        document.body.style.overflow = "";
      };
    }, [onClose]);

    return (
      <div
        className="fixed inset-0 z-[100000] bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        style={{ animation: "cart-backdrop-in 220ms ease-out" }}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <aside
          className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "cart-drawer-in 280ms cubic-bezier(0.22,1,0.36,1)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Your Cart</h3>
                <p className="text-xs text-slate-400">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-700">Your cart is empty</p>
                <p className="text-sm text-slate-400 mt-1">Add items to get started</p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 text-sm font-semibold text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                  style={{ animation: `fade-up 300ms ease-out ${idx * 50}ms both` }}
                >
                  <div className="flex gap-3">
                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={72}
                          height={72}
                          sizes="72px"
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.vetClinicName || "Verified Clinic"}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-extrabold text-slate-900">
                          ₹{((Number(item.price) || 0) * (item.qty || 1)).toLocaleString("en-IN")}
                        </p>
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-base"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-slate-800 transition-all duration-200">
                            {item.qty || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-base"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="self-start w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-slate-100 p-4 space-y-3 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Subtotal</p>
                  <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                    ₹{total.toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full font-medium">
                  Taxes calculated at checkout
                </span>
              </div>
              <button
                type="button"
                onClick={onBuyNow}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
              >
                Proceed to Checkout →
              </button>
            </div>
          )}
        </aside>
      </div>
    );
  }
);

CartDrawer.displayName = "CartDrawer";

export default CartDrawer;
