"use client";

import { useEffect } from "react";
import { ShoppingBag, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shop Page Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
        <ShoppingBag className="h-10 w-10" />
      </div>
      
      <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
        Marketplace Unavailable
      </h2>
      
      <p className="mb-10 max-w-md text-base font-medium leading-relaxed text-slate-500">
        We're having trouble loading the pet shop right now. Please try again in a few moments.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Shop
        </button>
        
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
