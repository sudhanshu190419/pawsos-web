"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Star,
  Sparkles,
  Pill,
  Bone,
  Heart,
  Package,
} from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Reveal from "../Reveal";

/* ═══════════════════════════════════════════════════
   FEATURED CATEGORIES
   ═══════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════
   FEATURED PRODUCTS SKELETON
   ═══════════════════════════════════════════════════ */
const ProductSkeleton = memo(() => (
  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
    <div className="aspect-square bg-slate-100" />
    <div className="p-3 md:p-4 space-y-2">
      <div className="h-3 bg-slate-100 rounded w-3/4" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
      <div className="flex items-baseline gap-2">
        <div className="h-4 bg-slate-100 rounded w-1/4" />
        <div className="h-3 bg-slate-100 rounded w-1/6" />
      </div>
    </div>
  </div>
));
ProductSkeleton.displayName = "ProductSkeleton";

/* ═══════════════════════════════════════════════════
   FEATURED PRODUCTS (mapped from Firestore)
   ═══════════════════════════════════════════════════ */
const BADGE_COLORS: Record<string, string> = {
  Medicine: "bg-blue-500 text-white",
  Food: "bg-amber-500 text-white",
  Toys: "bg-violet-500 text-white",
  Bandages: "bg-emerald-500 text-white",
  default: "bg-orange-500 text-white",
};

interface FeaturedProduct {
  id: string;
  name: string;
  price: string;
  original: string;
  badge: string;
  badgeColor: string;
  image: string;
  rating: number;
  reviews: number;
}

/* Simple hash from id → stable pseudo-random values */
function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mapProduct(doc: any): FeaturedProduct {
  const price = Number(doc.price) || 0;
  const original = price > 0 ? Math.round(price * 1.35) : 0;
  const imageUrl = doc.images?.[0] || doc.imageUrl || "";
  const category = doc.category || "";
  const seed = hashCode(doc.id || "");
  return {
    id: doc.id,
    name: doc.name || "Untitled Product",
    price: `₹${price.toLocaleString("en-IN")}`,
    original: `₹${original.toLocaleString("en-IN")}`,
    badge: category || "New",
    badgeColor: BADGE_COLORS[category] || BADGE_COLORS.default,
    image: imageUrl,
    rating: Math.round((4.5 + (seed % 50) / 100) * 10) / 10,
    reviews: 50 + (seed % 250),
  };
}

/* ═══════════════════════════════════════════════════
   TRUST BADGES
   ═══════════════════════════════════════════════════ */
const TRUST = [
  { icon: Truck, label: "Free Delivery", sub: "Orders above ₹499" },
  { icon: ShieldCheck, label: "100% Genuine", sub: "Verified sellers only" },
  { icon: BadgeCheck, label: "Easy Returns", sub: "7-day return policy" },
  { icon: Sparkles, label: "Vet Recommended", sub: "Expert-curated products" },
];

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */
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
    <section className="relative py-14 sm:py-20 md:py-28 overflow-hidden bg-gradient-to-b from-white via-amber-50/30 to-white">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-40 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <Reveal>
          <div className="text-center mb-10 sm:mb-14 md:mb-20">
            <span className="inline-block text-orange-600 font-bold tracking-widest uppercase text-xs bg-orange-100 px-3 py-1 rounded-full mb-4">
              Pet Marketplace
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Everything Your Pet{" "}
              <span className="text-orange-500">Needs</span>
            </h2>
            <div className="w-16 h-1.5 bg-orange-400 rounded-full mx-auto mb-5" />
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Shop vet-recommended food, medicines, and accessories — all from
              verified sellers. Every purchase supports animal rescue.
            </p>
          </div>
        </Reveal>

        

        {/* ── Featured Products ── */}
        <Reveal>
          <div className="mb-10 sm:mb-14 md:mb-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Featured Products
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Handpicked essentials for your furry friends
                </p>
              </div>
              <Link
                href="/shop"
                className="group hidden sm:inline-flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
              ) : featuredProducts.length === 0 ? (
                <p className="col-span-full text-center text-sm text-slate-400 py-8">
                  No products available yet
                </p>
              ) : featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href="/shop"
                  className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm
                             hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-slate-50">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Badge */}
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${product.badgeColor}`}
                    >
                      {product.badge}
                    </span>
                    {/* Hover add button */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <span className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center
                                       opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                        <ShoppingBag className="w-4 h-4 text-orange-500" />
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 md:p-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">
                      {product.name}
                    </h4>
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] font-bold text-slate-700">
                        {product.rating}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({product.reviews})
                      </span>
                    </div>
                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        {product.price}
                      </span>
                      <span className="text-[11px] text-slate-400 line-through">
                        {product.original}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile "View All" */}
            <div className="sm:hidden mt-6 text-center">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm
                           shadow-lg shadow-orange-500/25 hover:bg-orange-600 hover:shadow-xl hover:-translate-y-0.5
                           active:scale-[0.98] transition-all duration-200"
              >
                <ShoppingBag className="w-4 h-4" />
                Browse All Products
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Reveal>

        {/* ── Trust Strip ── */}
        <div className="hidden sm:block">
        <Reveal>
          <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {TRUST.map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <t.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{t.label}</p>
                    <p className="text-[11px] text-slate-400">{t.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="hidden sm:block">
        <Reveal>            <div className="mt-10 sm:mt-14 md:mt-20 text-center">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 bg-orange-500 text-white px-10 py-4 rounded-xl font-bold text-base
                         shadow-lg shadow-orange-500/25 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/30
                         hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
            >
              <ShoppingBag className="w-5 h-5" />
              Explore the Full Shop
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-slate-400 mt-4">
              500+ products • Verified sellers • Supports animal rescue
            </p>
          </div>
        </Reveal>
        </div>
      </div>
    </section>
  );
}
