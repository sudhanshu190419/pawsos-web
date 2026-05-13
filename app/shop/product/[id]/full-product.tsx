"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Info,
  CheckCircle2,
  MapPin,
  Stethoscope
} from "lucide-react";
import ShopHeader from "../../../components/ShopHeader";
import ProductCard from "../../../components/ProductCard";
import CheckoutPanel from "../../../components/CheckoutPanel";
import CartDrawer from "../../../components/CartDrawer";
import { createPortal } from "react-dom";

/* ═══════════════════════════════════════════════════
   MOCK DATA & UTILS
   ═══════════════════════════════════════════════════ */
const PRODUCT_FEATURES = [
  { icon: ShieldCheck, title: "Vet Verified", desc: "Clinically tested & approved" },
  { icon: Truck, title: "Fast Delivery", desc: "Within 24-48 hours" },
  { icon: RefreshCcw, title: "7-Day Returns", desc: "Easy & hassle-free" },
];

/* ═══════════════════════════════════════════════════
   MAIN PRODUCT PAGE
   ═══════════════════════════════════════════════════ */
export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Fetch product & related
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        const docRef = doc(db, "shop_products", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          setProduct(data);
          
          // Fetch related (same category)
          const q = query(
            collection(db, "shop_products"),
            where("category", "==", data.category),
            limit(5)
          );
          const relatedSnap = await getDocs(q);
          setRelatedProducts(
            relatedSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.id !== id)
          );
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

  // Cart sync
  useEffect(() => {
      if (typeof window === "undefined") return;
      try {
        const stored = localStorage.getItem("cart");
        if (stored) setCartItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to read persisted cart:", e);
      }
  }, []);

  useEffect(() => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem("cart", JSON.stringify(cartItems));
        window.dispatchEvent(new CustomEvent("cart-updated", { detail: cartItems }));
      } catch (e) {
        console.error("Failed to persist cart:", e);
      }
    }, [cartItems]);

    // listen for cart updates from other components/tabs
    useEffect(() => {
      if (typeof window === "undefined") return;
      const handler = (e: Event) => {
        try {
          const detail = (e as CustomEvent).detail;
          if (Array.isArray(detail)) setCartItems(detail);
        } catch (err) {
          // ignore
        }
      };
      window.addEventListener("cart-updated", handler as EventListener);
      return () => window.removeEventListener("cart-updated", handler as EventListener);
    }, []);

  const handleAddToCart = useCallback((prod: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === prod.id);
      if (existing) {
        return prev.map(item => 
          item.id === prod.id ? { ...item, qty: (item.qty || 1) + quantity } : item
        );
      }
      return [...prev, { ...prod, qty: quantity }];
    });
    setIsCartOpen(true);
  }, [quantity]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse text-sm">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const price = Number(product.price) || 0;
  const originalPrice = price + 100;
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  const inStock = true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-surface via-white to-slate-50 text-slate-900 selection:bg-primary/10">
      <ShopHeader
        cartCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
        user={null}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb & Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Shop
        </button>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="relative w-full aspect-square bg-gradient-to-br from-warm-surface to-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 shadow-lg">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
              )}
              {discount > 0 && (
                <div className="absolute top-6 left-6 bg-rescue-red text-white px-4 py-2 rounded-full font-black text-lg shadow-lg">
                  {discount}% OFF
                </div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white text-rescue-red px-6 py-3 rounded-full font-black text-lg">OUT OF STOCK</span>
                </div>
              )}
            </div>
            {/* Thumbnails - Can add more images here */}
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-slate-100 border-2 border-slate-200 overflow-hidden cursor-pointer hover:border-primary transition-colors">
                  <Image
                    src={product.imageUrl || "https://via.placeholder.com/150"}
                    alt={`View ${i + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col gap-8">
            {/* Clinic Badge */}
            {product.vetClinicName && (
              <div className="inline-flex items-center gap-2 w-fit">
                <Stethoscope className="w-4 h-4 text-field-green" />
                <span className="text-sm font-bold text-field-green">{product.vetClinicName}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-600">(248 reviews)</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1 font-medium">Price</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-primary">₹{price.toLocaleString("en-IN")}</span>
                  <span className="text-xl line-through text-slate-400">₹{originalPrice.toLocaleString("en-IN")}</span>
                  <span className="bg-rescue-red/10 text-rescue-red px-3 py-1 rounded-full text-sm font-black">
                    Save {discount}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Taxes calculated at checkout</p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              {PRODUCT_FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all">
                  <Icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>

            {/* Quantity & CTA */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center text-primary font-black text-xl hover:bg-slate-100 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-black text-lg text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center text-primary font-black text-xl hover:bg-slate-100 transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!inStock}
                  className="flex-1 h-14 bg-gradient-to-r from-primary to-primary-container text-white font-black text-lg rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
                <button className="w-14 h-14 rounded-xl border-2 border-slate-200 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center text-slate-600 hover:text-primary">
                  <Heart className="w-6 h-6" />
                </button>
              </div>
              <button className="w-full h-12 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Product
              </button>
            </div>

            {/* Trust Badges */}
            <div className="border-t border-slate-200 pt-6">
              <p className="text-xs text-slate-600 font-semibold mb-4 uppercase tracking-widest">Why buy from us</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-field-green flex-shrink-0" />
                  <span className="text-sm text-slate-600">Vet-verified products only</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-field-green flex-shrink-0" />
                  <span className="text-sm text-slate-600">24-hour delivery guarantee</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-field-green flex-shrink-0" />
                  <span className="text-sm text-slate-600">100% money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-t border-slate-200 pt-12">
          <div className="flex gap-6 mb-8 overflow-x-auto pb-2">
            {["description", "specifications", "reviews"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-bold text-sm capitalize whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab
                    ? "text-primary border-primary"
                    : "text-slate-600 border-transparent hover:text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-8">
            {activeTab === "description" && (
              <div className="prose prose-sm max-w-none text-slate-700 space-y-4">
                <p>{product.description || "Premium quality product sourced and verified by certified veterinarians."}</p>
                <h3 className="text-lg font-bold text-slate-900 mt-6">Key Benefits</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Clinically tested and approved</li>
                  <li>Safe for all pet breeds and sizes</li>
                  <li>Long-lasting effectiveness</li>
                  <li>Easy to use and apply</li>
                </ul>
              </div>
            )}
            {activeTab === "specifications" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-600 font-medium mb-1">Category</p>
                    <p className="font-bold text-slate-800">{product.category}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-600 font-medium mb-1">Suitable For</p>
                    <p className="font-bold text-slate-800">{product.animal || "All Pets"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-600 font-medium mb-1">Quantity</p>
                    <p className="font-bold text-slate-800">1 Unit</p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-4xl font-black text-primary mb-2">4.8/5</p>
                  <p className="text-sm text-slate-600">Based on 248 verified purchases</p>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border-b border-slate-100 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-800">Happy Pet Parent</p>
                          <p className="text-xs text-slate-500">Verified purchase</p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">"Excellent quality! My pet loves it. Highly recommended!"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-slate-200">
            <h2 className="text-3xl font-black text-slate-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map(prod => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onAddToCart={() => handleAddToCart(prod)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {isCartOpen && (
        <CartDrawer
          items={cartItems}
          total={cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0)}
          onClose={() => setIsCartOpen(false)}
          onUpdateQty={(id, delta) => {
            setCartItems((prev) =>
              prev
                .map((item) =>
                  item.id === id
                    ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) }
                    : item
                )
                .filter((item) => item.qty > 0)
            );
          }}
          onRemove={(id) => setCartItems((prev) => prev.filter((item) => item.id !== id))}
          onBuyNow={() => {
            setIsCheckoutOpen(true);
            setIsCartOpen(false);
          }}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutPanel
          items={cartItems}
          total={cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0)}
          onBackToCart={() => {
            setIsCheckoutOpen(false);
            setIsCartOpen(true);
          }}
          onClose={() => setIsCheckoutOpen(false)}
          onPlaceOrder={() => {
            setCartItems([]);
            setIsCheckoutOpen(false);
          }}
        />
      )}
    </div>
  );
}

