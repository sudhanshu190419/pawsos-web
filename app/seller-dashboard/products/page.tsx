"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { auth, db, storage } from "../../lib/firebase";
import { fetchBrandProfile } from "../../lib/seller";
import ProductsHeader from "./components/ProductsHeader";
import ProductFormModal from "./components/ProductFormModal";
import ProductCard from "./components/ProductCard";
import ProductsEmptyState from "./components/ProductsEmptyState";
import ConfirmDialog from "./components/ConfirmDialog";
import type { ProductFormValues, ProductImageItem, ProductRecord } from "./productTypes";
import type { BrandProfile } from "../../lib/seller";

type ProductFormErrors = Partial<Record<keyof ProductFormValues | "images" | "shiprocket", string>>;

export default function SellerProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setBrandProfile(null);
      setBrandLoading(false);
      return;
    }
    setBrandLoading(true);
    fetchBrandProfile(user.uid)
      .then((profile) => setBrandProfile(profile))
      .catch((err) => console.error("Brand profile fetch failed:", err))
      .finally(() => setBrandLoading(false));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }
    setLoadingProducts(true);
    const q = query(
      collection(db, "products"),
      where("brandId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<ProductRecord, "id">;
          return { id: docSnap.id, ...data } as ProductRecord;
        });
        setProducts(next);
        setLoadingProducts(false);
      },
      (err) => {
        console.error("Products listener failed:", err);
        setLoadingProducts(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  const canUpload = brandProfile?.verificationStatus === "approved";

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const term = search.trim().toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(term) || (product.category?.toLowerCase() ?? "").includes(term)
    );
  }, [products, search]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product: ProductRecord) => {
    setEditingProduct(product);
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormErrors({});
    setUploadProgress(undefined);
  };

  const validateForm = useCallback(
    (values: ProductFormValues, images: ProductImageItem[]) => {
      const errors: ProductFormErrors = {};
      if (!values.name.trim()) errors.name = "Product name is required";
      if (!values.category.trim()) errors.category = "Category is required";
      if (!values.description.trim()) errors.description = "Description is required";

      const price = Number(values.price);
      const discount = values.discountPrice ? Number(values.discountPrice) : null;
      const stock = Number(values.stockQty);
      const weight = Number(values.weight);
      const length = values.length ? Number(values.length) : null;
      const breadth = values.breadth ? Number(values.breadth) : null;
      const height = values.height ? Number(values.height) : null;

      if (!values.price || Number.isNaN(price) || price <= 0) errors.price = "Enter a valid price";
      if (discount !== null && (Number.isNaN(discount) || discount < 0)) {
        errors.discountPrice = "Enter a valid discount";
      }
      if (discount !== null && price > 0 && discount >= price) {
        errors.discountPrice = "Discount must be less than price";
      }
      if (!values.stockQty || Number.isNaN(stock) || stock < 0) {
        errors.stockQty = "Enter stock quantity";
      }
      if (!values.weight || Number.isNaN(weight) || weight <= 0) {
        errors.weight = "Weight is required for Shiprocket";
      }
      if (length !== null && (Number.isNaN(length) || length <= 0)) {
        errors.length = "Enter a valid length";
      }
      if (breadth !== null && (Number.isNaN(breadth) || breadth <= 0)) {
        errors.breadth = "Enter a valid breadth";
      }
      if (height !== null && (Number.isNaN(height) || height <= 0)) {
        errors.height = "Enter a valid height";
      }
      if (images.length === 0) errors.images = "Add at least one product image";
      if (images.length > 6) errors.images = "You can upload up to 6 images";
      if (!brandProfile?.shiprocketPickupId) {
        errors.shiprocket = "Shiprocket pickup ID is missing. Contact support to reconnect logistics.";
      }
      if (!canUpload) {
        errors.shiprocket = "Only approved sellers can upload products.";
      }

      return { errors, price, discount, stock, weight, length, breadth, height };
    },
    [brandProfile?.shiprocketPickupId, canUpload]
  );

  const uploadImages = async (productId: string, items: ProductImageItem[]) => {
    const newImages = items.filter((img) => img.isNew && img.file);
    if (newImages.length === 0) return [] as string[];

    const totalBytes = newImages.reduce((sum, img) => sum + (img.file?.size ?? 0), 0);
    let uploadedBytes = 0;
    const urls: string[] = [];

    for (const img of newImages) {
      const file = img.file;
      if (!file) continue;
      const fileRef = ref(storage, `products/${user?.uid}/${productId}/${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      const url = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const current = uploadedBytes + snapshot.bytesTransferred;
            const progress = totalBytes > 0 ? (current / totalBytes) * 100 : 0;
            setUploadProgress(progress);
          },
          reject,
          async () => {
            uploadedBytes += uploadTask.snapshot.totalBytes;
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          }
        );
      });
      urls.push(url);
    }

    return urls;
  };

  const handleSubmit = async (values: ProductFormValues, images: ProductImageItem[]) => {
    const { errors, price, discount, stock, weight, length, breadth, height } = validateForm(values, images);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!user?.uid || !brandProfile) return;

    setIsSaving(true);
    setUploadProgress(undefined);
    setFormErrors({});

    try {
      const existingUrls = images.filter((img) => !img.isNew).map((img) => img.url);
      const brandName = brandProfile.brandName || user.displayName || "Brand Seller";
      const shiprocketPickupId = brandProfile.shiprocketPickupId ?? null;

      if (editingProduct) {
        const newUrls = await uploadImages(editingProduct.id, images);
        await updateDoc(doc(db, "products", editingProduct.id), {
          name: values.name.trim(),
          description: values.description.trim(),
          category: values.category.trim(),
          animals: values.animals ?? [],
          price,
          discountPrice: discount,
          stockQty: stock,
          weight,
          length,
          breadth,
          height,
          images: [...existingUrls, ...newUrls],
          brandName,
          shiprocketPickupId,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, "products"), {
          brandId: user.uid,
          brandName,
          shiprocketPickupId,
          name: values.name.trim(),
          description: values.description.trim(),
          category: values.category.trim(),
          animals: values.animals ?? [],
          price,
          discountPrice: discount,
          stockQty: stock,
          weight,
          length,
          breadth,
          height,
          images: existingUrls,
          status: "active",
          createdAt: serverTimestamp(),
        });

        const newUrls = await uploadImages(docRef.id, images);
        if (newUrls.length > 0) {
          await updateDoc(doc(db, "products", docRef.id), {
            images: newUrls,
          });
        }
      }

      closeModal();
    } catch (err) {
      console.error("Product save failed:", err);
      setFormErrors({ shiprocket: "Failed to save product. Please retry." });
    } finally {
      setIsSaving(false);
      setUploadProgress(undefined);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "products", deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductsHeader
        total={products.length}
        search={search}
        onSearch={setSearch}
        onAdd={openCreateModal}
      />

      {!brandLoading && !brandProfile?.shiprocketPickupId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Shiprocket pickup ID is missing. Product publishing will be paused until logistics are connected.
        </div>
      )}

      {brandLoading || loadingProducts ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
              <div className="w-full aspect-[4/3] rounded-xl bg-slate-100" />
              <div className="mt-4 h-4 bg-slate-100 rounded w-3/4" />
              <div className="mt-2 h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <ProductsEmptyState onAdd={openCreateModal} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openEditModal}
              onDelete={(target) => setDeleteTarget(target)}
            />
          ))}
        </div>
      )}

      <ProductFormModal
        open={modalOpen}
        mode={editingProduct ? "edit" : "create"}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmit}
        errors={formErrors}
        isSaving={isSaving}
        uploadProgress={uploadProgress}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
