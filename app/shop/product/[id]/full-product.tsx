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
    const stored = localStorage.getItem("cart");
    if (stored) setCartItems(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

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

  return null; // Logic is here but UI is hidden for now
}
