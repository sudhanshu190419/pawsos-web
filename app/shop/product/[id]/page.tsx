"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductDetailPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect all product page traffic to the Shop Coming Soon teaser
    router.replace("/shop");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Redirecting to Marketplace...</p>
      </div>
    </div>
  );
}
