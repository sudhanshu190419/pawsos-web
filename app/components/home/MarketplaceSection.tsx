"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Reveal from "../Reveal";

/* ═══════════════════════════════════════════════════
   FEATURED PRODUCTS SKELETON
   ═══════════════════════════════════════════════════ */
const ProductSkeleton = memo(() => (
  <div className="bg-white rounded-[2rem] overflow-hidden border border-[#1C1614]/5 shadow-sm animate-pulse">
    <div className="aspect-square bg-[#e8e2e0]" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-[#e8e2e0] rounded w-3/4" />
      <div className="h-4 bg-[#e8e2e0] rounded w-1/2" />
      <div className="h-5 bg-[#e8e2e0] rounded w-1/4" />
    </div>
  </div>
));
ProductSkeleton.displayName = "ProductSkeleton";

/* ═══════════════════════════════════════════════════
   FEATURED PRODUCTS (mapped from Firestore)
   ═══════════════════════════════════════════════════ */
const BADGE_COLORS: Record<string, string> = {
  Medicine: "bg-blue-600 text-white",
  Food: "bg-amber-600 text-white",
  Toys: "bg-violet-600 text-white",
  Bandages: "bg-emerald-600 text-white",
  default: "bg-primary text-white",
};

interface FeaturedProduct {
  id: string;
  name: string;
  price: string;
  badge: string;
  badgeColor: string;
  image: string;
}

function mapProduct(doc: any): FeaturedProduct {
  const price = Number(doc.price) || 0;
  const imageUrl = doc.images?.[0] || doc.imageUrl || "";
  const category = doc.category || "";
  return {
    id: doc.id,
    name: doc.name || "Untitled Product",
    price: `₹${price.toLocaleString("en-IN")}`,
    badge: category || "Shop",
    badgeColor: BADGE_COLORS[category] || BADGE_COLORS.default,
    image: imageUrl,
  };
}

/* ═══════════════════════════════════════════════════
   TRUST BADGES
   ═══════════════════════════════════════════════════ */
const TRUST = [
  { icon: Truck, label: "Fast Shipping", sub: "Delivered to your doorstep" },
  { icon: ShieldCheck, label: "100% Genuine", sub: "Directly from verified brands" },
  { icon: BadgeCheck, label: "Easy Returns", sub: "Simple return and exchanges" },
  { icon: Sparkles, label: "Vet Approved", sub: "Handpicked safe inventory" },
];

export default function MarketplaceSection() {
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(4)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map((d) => mapProduct({ id: d.id, ...d.data() }));
      setFeaturedProducts(products);
      setLoading(false);
    }, (error) => {
      console.error("[MarketplaceSection] Firestore error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden bg-[#FDF8F3] border-b border-[#1C1614]/5">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-dot-pattern opacity-5 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <Reveal>
          <div className="mb-12 md:mb-16">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#9c3e23] font-semibold mb-4 block">
              Merchandise Shop
            </span>
            <h2 className="font-display italic text-4xl md:text-5xl lg:text-6xl text-[#1C1614] leading-[1.1]">
              Curated items for your pets
            </h2>
            <p className="text-slate-500 text-base md:text-lg font-sans mt-4 max-w-[50ch] leading-relaxed">
              Browse food, wellness supplies, and toys sourced directly from verified ethical sellers. 
              Every purchase helps support street rescue missions.
            </p>
          </div>
        </Reveal>

        {/* Product Grid Header */}
        <Reveal>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#1C1614] font-sans">
                Latest Arrivals
              </h3>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-container transition-colors"
            >
              <span>View full shop</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>

        {/* Product Cards Grid */}
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-full bg-white rounded-[2rem] border border-[#1C1614]/5 p-12 text-center text-slate-400 font-sans shadow-sm">
                Shop listings will appear here soon.
              </div>
            ) : (
              featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href="/shop"
                  className="group bg-white rounded-[2rem] overflow-hidden border border-[#1C1614]/5 shadow-sm hover:shadow-[0_8px_30px_rgba(156,62,35,0.06)] hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden bg-slate-50 border-b border-[#1C1614]/5">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                      {/* Badge */}
                      <span
                        className={`absolute top-4 left-4 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm ${product.badgeColor}`}
                      >
                        {product.badge}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h4 className="text-sm sm:text-base font-semibold text-[#1C1614] line-clamp-2 leading-snug font-sans">
                        {product.name}
                      </h4>
                    </div>
                  </div>

                  {/* Price Row */}
                  <div className="p-5 pt-0 flex justify-between items-center border-t border-[#1C1614]/5 mt-2 pt-4">
                    <span className="text-base sm:text-lg font-bold text-[#1C1614] font-sans">
                      {product.price}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Reveal>

        {/* Trust Badges Strip */}
        <Reveal>
          <div className="mt-16 md:mt-24 bg-white rounded-[2rem] border border-[#1C1614]/5 p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {TRUST.map((t) => (
                <div key={t.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#9c3e23]/5 text-[#9c3e23] flex items-center justify-center shrink-0">
                    <t.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1C1614] font-sans">{t.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans">{t.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
