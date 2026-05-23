"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import {
  ChevronLeft,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Star,
  Heart,
  Share2,
  CheckCircle2,
  Stethoscope,
  Minus,
  Plus,
  Package,
} from "lucide-react";
import ShopHeader from "../../../components/ShopHeader";
import ProductCard from "../../../components/ProductCard";
import CheckoutPanel from "../../../components/CheckoutPanel";
import CartDrawer from "../../../components/CartDrawer";
import { useCart } from "../../../components/cart";

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */
const PRODUCT_FEATURES = [
  { icon: ShieldCheck, title: "Vet Verified", desc: "Clinically tested & approved" },
  { icon: Truck,       title: "Fast Delivery", desc: "Delivered within 24–48 hrs" },
  { icon: RefreshCcw,  title: "7-Day Returns",  desc: "Easy & hassle-free" },
] as const;

const TRUST_POINTS = [
  "Vet-verified products only",
  "24-hour delivery guarantee",
  "100% money-back guarantee",
] as const;

const TABS = ["description", "specifications", "reviews"] as const;
type Tab = (typeof TABS)[number];

/* ═══════════════════════════════════════════════════
   SMALL REUSABLE PIECES
   ═══════════════════════════════════════════════════ */

const StarRow = memo(({ count = 5, size = "sm" }: { count?: number; size?: "sm" | "xs" }) => {
  const cls = size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3";
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < count ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"}`}
        />
      ))}
    </span>
  );
});
StarRow.displayName = "StarRow";

const FeatureCard = memo(({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
  <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors text-center">
    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
      <Icon className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.8} />
    </div>
    <p className="text-[11px] font-semibold text-neutral-800 leading-tight">{title}</p>
    <p className="text-[10px] text-neutral-400 leading-snug">{desc}</p>
  </div>
));
FeatureCard.displayName = "FeatureCard";

const PageSkeleton = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      <p className="text-xs font-medium text-neutral-400">Loading product…</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   IMAGE GALLERY
   ═══════════════════════════════════════════════════ */
const ImageGallery = memo(
  ({
    imageUrl,
    name,
    discount,
    inStock,
  }: {
    imageUrl?: string;
    name: string;
    discount: number;
    inStock: boolean;
  }) => {
    const [activeThumb, setActiveThumb] = useState(0);

    return (
      <div className="space-y-2">
        {/* Main image */}
        <div className="relative w-full aspect-[4/3] bg-neutral-50 rounded-2xl overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
              priority
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-300">
              <Package className="w-12 h-12" strokeWidth={1} />
              <p className="text-xs font-medium">No image available</p>
            </div>
          )}

          {discount > 0 && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-wide shadow-sm">
                {discount}% OFF
              </span>
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-white text-neutral-800 border border-neutral-200 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                Out of Stock
              </span>
            </div>
          )}

          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart className="w-3.5 h-3.5 text-neutral-500" strokeWidth={1.8} />
          </button>
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveThumb(i)}
              className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                activeThumb === i
                  ? "border-neutral-800 shadow-sm"
                  : "border-neutral-200 hover:border-neutral-400"
              }`}
              aria-label={`View ${i + 1}`}
            >
              <Image
                src={imageUrl || "https://via.placeholder.com/150"}
                alt={`Product view ${i + 1}`}
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    );
  }
);
ImageGallery.displayName = "ImageGallery";

/* ═══════════════════════════════════════════════════
   QUANTITY SELECTOR
   ═══════════════════════════════════════════════════ */
const QuantitySelector = memo(
  ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
    <div
      className="inline-flex items-center rounded-lg border border-neutral-200 bg-white overflow-hidden"
      role="group"
      aria-label="Quantity selector"
    >
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="w-3 h-3" strokeWidth={2.5} />
      </button>
      <span className="w-8 h-8 flex items-center justify-center text-[13px] font-semibold text-neutral-900 border-x border-neutral-200">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="w-3 h-3" strokeWidth={2.5} />
      </button>
    </div>
  )
);
QuantitySelector.displayName = "QuantitySelector";

/* ═══════════════════════════════════════════════════
   TAB CONTENT
   ═══════════════════════════════════════════════════ */
const TabDescription = ({ product }: { product: any }) => (
  <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
    <p>{product.description || "Premium quality product sourced and verified by certified veterinarians."}</p>
    <div>
      <h3 className="text-sm font-semibold text-neutral-900 mb-2">Key Benefits</h3>
      <ul className="space-y-1.5">
        {[
          "Clinically tested and approved by certified vets",
          "Safe for all pet breeds and sizes",
          "Long-lasting effectiveness",
          "Easy to use and apply",
        ].map((point) => (
          <li key={point} className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const TabSpecifications = ({ product }: { product: any }) => (
  <div className="divide-y divide-neutral-100">
    {[
      { label: "Category", value: product.category },
      { label: "Suitable For", value: product.animal || "All Pets" },
      { label: "Quantity", value: "1 Unit" },
      { label: "Storage", value: "Cool, dry place" },
      { label: "Shelf Life", value: "24 months" },
    ].map(({ label, value }) => (
      <div key={label} className="flex items-center justify-between py-2.5 gap-4">
        <span className="text-xs text-neutral-400 font-medium">{label}</span>
        <span className="text-xs font-semibold text-neutral-800 text-right">{value}</span>
      </div>
    ))}
  </div>
);

const TabReviews = () => (
  <div className="space-y-4">
    {/* Aggregate */}
    <div className="flex items-center gap-5 p-4 rounded-xl bg-neutral-50">
      <div className="text-center">
        <p className="text-3xl font-bold text-neutral-900 tracking-tight">4.8</p>
        <StarRow count={5} />
        <p className="text-[10px] text-neutral-400 mt-0.5">248 reviews</p>
      </div>
      <div className="flex-1 space-y-1">
        {[5, 4, 3, 2, 1].map((n) => {
          const widths: Record<number, string> = { 5: "75%", 4: "15%", 3: "6%", 2: "3%", 1: "1%" };
          return (
            <div key={n} className="flex items-center gap-1.5">
              <span className="text-[10px] text-neutral-400 w-2.5">{n}</span>
              <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: widths[n] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Review cards */}
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-semibold text-neutral-600">
                {["RA", "SM", "KP"][i]}
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-800">{["Ravi A.", "Smita M.", "Karan P."][i]}</p>
                <p className="text-[9px] text-neutral-400">Verified purchase</p>
              </div>
            </div>
            <StarRow count={5} size="xs" />
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            &ldquo;Excellent quality! My pet absolutely loves it. Shipping was fast and the packaging was great. Highly recommended for all pet parents.&rdquo;
          </p>
        </div>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const { items: cartItems, totals, addItem, updateQty, removeItem, clear } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [wishlist, setWishlist] = useState(false);

  /* ── Fetch product + related ── */
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const raw = { id: docSnap.id, ...docSnap.data() } as any;
          if ((raw.status ?? "active") !== "active") {
            router.push("/shop");
            return;
          }
          const data = {
            ...raw,
            images: Array.isArray(raw.images) ? raw.images : raw.imageUrl ? [raw.imageUrl] : [],
            clinicName: raw.clinicName ?? raw.vetClinicName ?? "",
            imageUrl: raw.imageUrl ?? raw.images?.[0] ?? "",
            vetClinicName: raw.vetClinicName ?? raw.clinicName ?? "",
          } as any;
          console.log("[Shop] product raw:", raw);
          console.log("[Shop] product mapped:", data);
          setProduct(data);
          const q = query(
            collection(db, "products"),
            where("category", "==", data.category),
            where("status", "==", "active"),
            limit(5)
          );
          const relatedSnap = await getDocs(q);
          const related = relatedSnap.docs
            .map((d) => {
              const item = { id: d.id, ...d.data() } as any;
              return {
                ...item,
                images: Array.isArray(item.images) ? item.images : item.imageUrl ? [item.imageUrl] : [],
                clinicName: item.clinicName ?? item.vetClinicName ?? "",
                imageUrl: item.imageUrl ?? item.images?.[0] ?? "",
                vetClinicName: item.vetClinicName ?? item.clinicName ?? "",
              };
            })
            .filter((p) => p.id !== id);
          console.log("[Shop] related products mapped:", related);
          setRelatedProducts(related);
        } else {
          router.push("/shop");
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);


  /* ── Cart action ── */
  const handleAddToCart = useCallback(
    (prod: any) => {
      const result = addItem(prod, quantity);
      if (result.ok) setIsCartOpen(true);
    },
    [addItem, quantity]
  );

  /* ── Derived values ── */
  const price = Number(product?.price) || 0;
  const originalPrice = price + 100;
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  const inStock = true;
  const cartTotal = totals.subtotal;

  if (loading) return <PageSkeleton />;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <ShopHeader cartCount={totals.itemCount} onCartClick={() => setIsCartOpen(true)} user={null} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* ── Back ── */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-5"
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
          Back to shop
        </button>

        {/* ══════════════════════════════════
            HERO: IMAGE + INFO
        ══════════════════════════════════ */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-7 xl:gap-10 mb-10">

          {/* LEFT: Gallery */}
          <ImageGallery
            imageUrl={product.imageUrl}
            name={product.name}
            discount={discount}
            inStock={inStock}
          />

          {/* RIGHT: Info */}
          <div className="flex flex-col gap-4">

            {/* Clinic badge */}
            {product.vetClinicName && (
              <div className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                <Stethoscope className="w-3 h-3 text-emerald-600" strokeWidth={2} />
                <span className="text-[10px] font-semibold text-emerald-700 tracking-wide">{product.vetClinicName}</span>
              </div>
            )}

            {/* Title + rating */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight tracking-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-2">
                <StarRow count={5} />
                <span className="text-xs text-neutral-400 font-medium">4.8 · 248 reviews</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-neutral-400 line-through font-medium">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
                {discount > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    {discount}% off
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">Inclusive of all taxes</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-100" />

            {/* Feature cards */}
            <div className="grid grid-cols-3 gap-1.5">
              {PRODUCT_FEATURES.map((f) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-100" />

            {/* Quantity + CTA */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <QuantitySelector value={quantity} onChange={setQuantity} />
                <p className="text-[11px] font-medium">
                  {inStock ? (
                    <span className="text-emerald-600">● In stock</span>
                  ) : (
                    <span className="text-red-500">● Out of stock</span>
                  )}
                </p>
              </div>

              <button
                onClick={() => handleAddToCart(product)}
                disabled={!inStock}
                className="w-full h-10 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
                Add to Cart
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setWishlist((v) => !v)}
                  className={`flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl border text-[12px] font-medium transition-all ${
                    wishlist
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                  aria-label="Toggle wishlist"
                >
                  <Heart className={`w-3.5 h-3.5 ${wishlist ? "fill-rose-500 text-rose-500" : ""}`} strokeWidth={1.8} />
                  {wishlist ? "Wishlisted" : "Wishlist"}
                </button>
                <button
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 text-[12px] font-medium transition-all"
                  aria-label="Share product"
                >
                  <Share2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                  Share
                </button>
              </div>
            </div>

            {/* Trust points */}
            <div className="p-3 rounded-xl bg-neutral-50 space-y-1.5">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                  <span className="text-[12px] text-neutral-600 font-medium">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════
            TABS
        ══════════════════════════════════ */}
        <section className="border-t border-neutral-100 pt-6 mb-10">
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-neutral-100 mb-5 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-[12px] font-semibold capitalize whitespace-nowrap border-b-2 -mb-px transition-all ${
                  activeTab === tab
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="max-w-xl">
            {activeTab === "description"    && <TabDescription product={product} />}
            {activeTab === "specifications" && <TabSpecifications product={product} />}
            {activeTab === "reviews"        && <TabReviews />}
          </div>
        </section>

        {/* ══════════════════════════════════
            RELATED PRODUCTS
        ══════════════════════════════════ */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-neutral-100 pt-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">Related Products</h2>
              <a href="#" className="text-[12px] font-medium text-orange-500 hover:text-orange-600 transition-colors">
                View all
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {relatedProducts.map((prod, index) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onAddToCart={() => handleAddToCart(prod)}
                  priority={index < 4}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── CART DRAWER ── */}
      {isCartOpen && (
        <CartDrawer
          items={cartItems}
          total={cartTotal}
          onClose={() => setIsCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onBuyNow={() => { setIsCheckoutOpen(true); setIsCartOpen(false); }}
        />
      )}

      {/* ── CHECKOUT PANEL ── */}
      {isCheckoutOpen && (
        <CheckoutPanel
          items={cartItems}
          total={cartTotal}
          onBackToCart={() => { setIsCheckoutOpen(false); setIsCartOpen(true); }}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderPlaced={() => { clear(); setIsCheckoutOpen(false); }}
        />
      )}
    </div>
  );
}