"use client";

import { useState, useEffect, useCallback } from "react";
import { auth, db, storage } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, getDoc, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createPortal } from "react-dom";

// ─────────────────────────────────────────────
// IMAGE COMPRESSION  (unchanged, already solid)
// ─────────────────────────────────────────────
const compressImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height *= MAX / width; width = MAX; }
        } else {
          if (height > MAX) { width *= MAX / height; height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Blob failed"))),
          "image/webp",
          0.7
        );
      };
    };
    reader.onerror = reject;
  });

// ─────────────────────────────────────────────
// OPTIMIZED PRODUCT IMAGE  — the key upgrade
// ─────────────────────────────────────────────
// FIX 1: Skeleton shown instantly while src is fetching
// FIX 2: Fade-in on load so there's no jarring pop
// FIX 3: Error fallback — never shows a broken-image icon
// FIX 4: eager/lazy split — first 8 cards load immediately, rest are deferred
// FIX 5: fetchpriority="high" on first 4 so browser prioritises them in the queue
const ProductImage = ({
  src,
  alt,
  index,
}: {
  src: string;
  alt: string;
  index: number;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Images visible on first paint load eagerly; the rest are lazy
  const isEager = index < 8;
  const isHighPriority = index < 4;

  return (
    <div className="w-full h-32 sm:h-48 bg-slate-100 rounded-xl sm:rounded-2xl mb-2 sm:mb-4 overflow-hidden relative">

      {/* Skeleton shimmer — visible until the real image is ready */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-[shimmer_1.4s_infinite]" />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
          <span className="text-2xl">🖼️</span>
          <span className="text-[9px] font-medium">Image unavailable</span>
        </div>
      )}

      {/* Actual image — invisible until loaded, then fades in */}
      {!error && (
        <img
          src={src}
          alt={alt}
          width={400}          // FIX 5: explicit dimensions prevent CLS
          height={400}
          loading={isEager ? "eager" : "lazy"}
          decoding="async"
          // @ts-expect-error – fetchpriority is valid HTML, just missing from older @types
          fetchpriority={isHighPriority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            w-full h-full object-cover group-hover:scale-105 transition-all duration-500
            ${loaded ? "opacity-100" : "opacity-0"}
          `}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// PRODUCT CARD SKELETON  (shown while Firestore loads)
// ─────────────────────────────────────────────
const ProductCardSkeleton = () => (
  <div className="bg-white rounded-[1.25rem] sm:rounded-[2rem] p-2.5 sm:p-4 border border-slate-100 shadow-sm flex flex-col animate-pulse">
    <div className="w-full h-32 sm:h-48 bg-slate-200 rounded-xl sm:rounded-2xl mb-2 sm:mb-4" />
    <div className="px-1 space-y-2">
      <div className="h-4 bg-slate-200 rounded-full w-3/4" />
      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
      <div className="h-3 bg-slate-100 rounded-full w-full" />
      <div className="h-3 bg-slate-100 rounded-full w-2/3" />
      <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
        <div className="h-5 bg-slate-200 rounded-full w-1/4" />
        <div className="w-7 h-7 sm:w-10 sm:h-10 bg-slate-200 rounded-full" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function ShopPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isVet, setIsVet] = useState(false);
  const [vetClinicName, setVetClinicName] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "Medicine",
    description: "",
    image: null as File | null,
  });

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const vetDoc = await getDoc(doc(db, "vets_web", currentUser.uid));
          if (vetDoc.exists() && vetDoc.data().verificationStatus === "approved") {
            setIsVet(true);
            setVetClinicName(vetDoc.data().clinicName || "Verified Clinic");
          }
        } catch (e) {
          console.error("Vet check failed:", e);
        }
      }
    });
    return () => unsub();
  }, []);

  // Firestore realtime listener
  useEffect(() => {
    const q = query(collection(db, "shop_products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Add product handler
  const handleAddProduct = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newProduct.image || !newProduct.name || !newProduct.price) {
        alert("Please fill all fields and upload an image.");
        return;
      }
      setIsUploading(true);
      try {
        const compressed = await compressImage(newProduct.image);
        const storageRef = ref(storage, `shop_images/${user.uid}_${Date.now()}.webp`);
        await uploadBytes(storageRef, compressed);
        const imageUrl = await getDownloadURL(storageRef);

        await addDoc(collection(db, "shop_products"), {
          name: newProduct.name,
          price: Number(newProduct.price),
          category: newProduct.category,
          description: newProduct.description,
          imageUrl,
          vetId: user.uid,
          vetClinicName,
          createdAt: serverTimestamp(),
        });

        setShowAddModal(false);
        setNewProduct({ name: "", price: "", category: "Medicine", description: "", image: null });
        alert("Product added successfully! 🎉");
      } catch (e) {
        console.error("Upload failed:", e);
        alert("Failed to add product.");
      } finally {
        setIsUploading(false);
      }
    },
    [user, newProduct, vetClinicName]
  );

  const filteredProducts = products.filter(
    (p) => activeCategory === "All" || p.category === activeCategory
  );

  return (
    <>
      {/* 
        FIX 6: Inject the shimmer keyframe once at the top level.
        Tailwind doesn't ship arbitrary @keyframes, so we add it via a <style> tag.
      */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .animate-\\[shimmer_1\\.4s_infinite\\] {
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite linear;
        }
      `}</style>

      <main className="min-h-screen bg-slate-50 pb-16 sm:pb-24 text-slate-900 selection:bg-blue-200">

        {/* HERO */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white pt-20 pb-16 sm:pt-24 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/20 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4 border border-white/10">
                <span>Verified Supplies</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3 sm:mb-4">
                AnimalSathi <span className="text-blue-400">Vet Shop</span>
              </h1>
              <p className="text-slate-300 max-w-xl text-base sm:text-lg font-light leading-relaxed px-2 sm:px-0">
                Trusted medicines, premium food, and safe toys directly from our network of verified veterinarians.
              </p>
            </div>
            {isVet && (
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto shrink-0 bg-blue-500 hover:bg-blue-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <span className="text-xl leading-none mb-0.5">+</span> Add New Product
              </button>
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">

          {/* CATEGORY FILTERS */}
          <div className="bg-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 mb-8 sm:mb-10">
            {["All", "Medicine", "Food", "Toys"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {cat === "Medicine" ? "💊 " : cat === "Food" ? "🦴 " : cat === "Toys" ? "🎾 " : "✨ "}
                {cat}
              </button>
            ))}
          </div>

          {/* PRODUCTS GRID */}
          {loading ? (
            // FIX 7: Replace the single spinner with a full skeleton grid —
            // users see the layout instantly, no content-jump on arrival.
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 sm:py-20 bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">No products found</h3>
              <p className="text-sm sm:text-base text-slate-500">Check back later for new supplies from our vets.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white rounded-[1.25rem] sm:rounded-[2rem] p-2.5 sm:p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                >
                  {/* FIX 1–5 live inside ProductImage */}
                  <ProductImage src={product.imageUrl} alt={product.name} index={index} />

                  <div className="flex-1 flex flex-col px-1">
                    <h3 className="font-bold text-sm sm:text-lg text-slate-800 leading-tight mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[9px] sm:text-xs font-medium text-blue-600 mb-1.5 sm:mb-3 flex items-center gap-1 truncate w-full">
                      🏥 <span className="truncate">{product.vetClinicName}</span>
                    </p>
                    <p className="text-[10px] sm:text-sm text-slate-500 line-clamp-2 mb-2 sm:mb-4 flex-1 leading-snug">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2 sm:pt-4 border-t border-slate-100">
                      <span className="text-base sm:text-xl font-black text-slate-900">₹{product.price}</span>
                      <button className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors text-xs sm:text-base">
                        →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ADD PRODUCT MODAL */}
        {isVet && showAddModal && typeof document !== "undefined" &&
          createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800">Add New Product</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl sm:text-3xl leading-none">&times;</button>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 sm:mb-2">Product Image *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files?.[0] || null })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 sm:mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 outline-none focus:border-blue-500 font-medium text-sm sm:text-base"
                      required
                      placeholder="e.g. Tick & Flea Spray"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 sm:mb-2">Price (₹) *</label>
                      <input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 outline-none focus:border-blue-500 font-bold text-sm sm:text-base"
                        required
                        placeholder="299"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 sm:mb-2">Category *</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 outline-none focus:border-blue-500 font-medium cursor-pointer appearance-none text-sm sm:text-base"
                      >
                        <option>Medicine</option>
                        <option>Food</option>
                        <option>Toys</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 sm:mb-2">Short Description</label>
                    <textarea
                      rows={3}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 outline-none focus:border-blue-500 font-medium resize-none text-sm sm:text-base"
                      placeholder="Describe the product and its benefits..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-blue-600 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50 mt-2 sm:mt-4"
                  >
                    {isUploading ? "Uploading & Compressing..." : "List Product"}
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )}
      </main>
    </>
  );
}