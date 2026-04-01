"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, getDoc, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createPortal } from "react-dom";

// 🔥 NEW: Image Compression Function
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; // Resize large images
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP format for massive size reduction (70% quality)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas to Blob failed"));
          },
          "image/webp", 
          0.7
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function ShopPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isVet, setIsVet] = useState(false);
  const [vetClinicName, setVetClinicName] = useState("");
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "Medicine",
    description: "",
    image: null as File | null,
  });

  // 1. Authenticate and check if user is a verified Vet
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
        } catch (error) {
          console.error("Error checking vet status:", error);
        }
      }
    });
    return () => unsub();
  }, []);

  // 2. Fetch Products from Firestore
  useEffect(() => {
    const q = query(collection(db, "shop_products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 3. Handle Add Product Submission
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProduct.image || !newProduct.name || !newProduct.price) {
      alert("Please fill all fields and upload an image.");
      return;
    }

    setIsUploading(true);
    try {
      // 🔥 FIX: Compress the image before sending to Firebase
      const compressedBlob = await compressImage(newProduct.image);
      
      // Upload the lightweight WebP Blob instead of the raw File
      const storageRef = ref(storage, `shop_images/${user.uid}_${Date.now()}.webp`);
      await uploadBytes(storageRef, compressedBlob);
      const imageUrl = await getDownloadURL(storageRef);

      // Save to Firestore
      await addDoc(collection(db, "shop_products"), {
        name: newProduct.name,
        price: Number(newProduct.price),
        category: newProduct.category,
        description: newProduct.description,
        imageUrl: imageUrl,
        vetId: user.uid,
        vetClinicName: vetClinicName,
        createdAt: serverTimestamp(),
      });

      setShowAddModal(false);
      setNewProduct({ name: "", price: "", category: "Medicine", description: "", image: null });
      alert("Product added successfully! 🎉");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product.");
    } finally {
      setIsUploading(false);
    }
  };

  // Filter products by category
  const filteredProducts = products.filter(p => activeCategory === "All" || p.category === activeCategory);

  return (
    <main className="min-h-screen bg-slate-50 pb-16 sm:pb-24 text-slate-900 selection:bg-blue-200">
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white pt-20 pb-16 sm:pt-24 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/20 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none"></div>
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
          
          {/* ONLY SHOW TO APPROVED VETS */}
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
          {["All", "Medicine", "Food", "Toys"].map(cat => (
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
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">No products found</h3>
            <p className="text-sm sm:text-base text-slate-500">Check back later for new supplies from our vets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-[1.25rem] sm:rounded-[2rem] p-2.5 sm:p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                
                {/* Image */}
                <div className="w-full h-32 sm:h-48 bg-slate-50 rounded-xl sm:rounded-2xl mb-2 sm:mb-4 overflow-hidden relative">
                  {/* 🔥 FIX: Added native lazy loading and async decoding for faster page paints */}
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-black text-slate-700 shadow-sm uppercase tracking-wider">
                    {product.category}
                  </div>
                </div>
                
                {/* Details */}
                <div className="flex-1 flex flex-col px-1">
                  <h3 className="font-bold text-sm sm:text-lg text-slate-800 leading-tight mb-1 line-clamp-1">{product.name}</h3>
                  
                  <p className="text-[9px] sm:text-xs font-medium text-blue-600 mb-1.5 sm:mb-3 flex items-center gap-1 line-clamp-1 truncate w-full">
                    🏥 <span className="truncate">{product.vetClinicName}</span>
                  </p>
                  
                  <p className="text-[10px] sm:text-sm text-slate-500 line-clamp-2 mb-2 sm:mb-4 flex-1 leading-snug">
                    {product.description}
                  </p>
                  
                  {/* Footer / Price */}
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

      {/* ADD PRODUCT MODAL (Only Vets see this) */}
      {isVet && showAddModal && typeof document !== "undefined" && createPortal(
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
                  onChange={(e) => setNewProduct({...newProduct, image: e.target.files?.[0] || null})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 sm:mb-2">Product Name *</label>
                <input 
                  type="text" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 outline-none focus:border-blue-500 font-medium text-sm sm:text-base"
                  required placeholder="e.g. Tick & Flea Spray"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 sm:mb-2">Price (₹) *</label>
                  <input 
                    type="number" 
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 outline-none focus:border-blue-500 font-bold text-sm sm:text-base"
                    required placeholder="299"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 sm:mb-2">Category *</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
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
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
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
  );
}