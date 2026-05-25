"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProductFormValues, ProductImageItem, ProductRecord } from "../productTypes";

interface ProductFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialProduct?: ProductRecord | null;
  onClose: () => void;
  onSubmit: (values: ProductFormValues, images: ProductImageItem[]) => void;
  errors?: Partial<Record<keyof ProductFormValues | "images" | "shiprocket", string>>;
  isSaving?: boolean;
  uploadProgress?: number;
}

const INITIAL_VALUES: ProductFormValues = {
  name: "",
  description: "",
  category: "",
  price: "",
  discountPrice: "",
  stockQty: "",
  weight: "",
  length: "",
  breadth: "",
  height: "",
};

export default function ProductFormModal({
  open,
  mode,
  initialProduct,
  onClose,
  onSubmit,
  errors,
  isSaving = false,
  uploadProgress,
}: ProductFormModalProps) {
  const [values, setValues] = useState<ProductFormValues>(INITIAL_VALUES);
  const [images, setImages] = useState<ProductImageItem[]>([]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialProduct) {
      setValues({
        name: initialProduct.name,
        description: initialProduct.description,
        category: initialProduct.category,
        price: String(initialProduct.price ?? ""),
        discountPrice: initialProduct.discountPrice ? String(initialProduct.discountPrice) : "",
        stockQty: String(initialProduct.stockQty ?? ""),
        weight: String(initialProduct.weight ?? ""),
        length: initialProduct.length ? String(initialProduct.length) : "",
        breadth: initialProduct.breadth ? String(initialProduct.breadth) : "",
        height: initialProduct.height ? String(initialProduct.height) : "",
      });
      setImages(
        (initialProduct.images || []).map((url) => ({
          id: url,
          url,
          isNew: false,
        }))
      );
    } else {
      setValues(INITIAL_VALUES);
      setImages([]);
    }
  }, [open, mode, initialProduct]);

  useEffect(() => {
    if (open) return;
    images.filter((img) => img.isNew).forEach((img) => URL.revokeObjectURL(img.url));
  }, [open, images]);

  const title = useMemo(() => (mode === "create" ? "Add Product" : "Edit Product"), [mode]);

  const handleChange = (field: keyof ProductFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remainingSlots = Math.max(0, 6 - images.length);
    const accepted = Array.from(files).slice(0, remainingSlots);
    const next = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      url: URL.createObjectURL(file),
      isNew: true,
      file,
    }));
    setImages((prev) => [...prev, ...next]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.isNew) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values, images);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white w-full sm:max-w-3xl rounded-t-[2rem] sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-400 mt-1">Add detailed product info for marketplace sync.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          <section className="space-y-4">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">Basic</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormInput label="Product Name *" value={values.name} onChange={(val) => handleChange("name", val)} placeholder="Premium Pet Food" error={errors?.name} />
              <FormInput label="Category *" value={values.category} onChange={(val) => handleChange("category", val)} placeholder="Supplements" error={errors?.category} />
            </div>
            <FormTextarea label="Description *" value={values.description} onChange={(val) => handleChange("description", val)} placeholder="Short description of the product" error={errors?.description} />
            <div className="grid sm:grid-cols-3 gap-4">
              <FormInput label="Price (INR) *" value={values.price} onChange={(val) => handleChange("price", val)} placeholder="499" inputMode="numeric" error={errors?.price} />
              <FormInput label="Discount Price" value={values.discountPrice} onChange={(val) => handleChange("discountPrice", val)} placeholder="449" inputMode="numeric" error={errors?.discountPrice} />
              <FormInput label="Stock Qty *" value={values.stockQty} onChange={(val) => handleChange("stockQty", val)} placeholder="100" inputMode="numeric" error={errors?.stockQty} />
            </div>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">Shipping</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormInput label="Weight (kg) *" value={values.weight} onChange={(val) => handleChange("weight", val)} placeholder="1.2" inputMode="decimal" error={errors?.weight} />
              <FormInput label="Length (cm)" value={values.length} onChange={(val) => handleChange("length", val)} placeholder="20" inputMode="numeric" error={errors?.length} />
              <FormInput label="Breadth (cm)" value={values.breadth} onChange={(val) => handleChange("breadth", val)} placeholder="12" inputMode="numeric" error={errors?.breadth} />
              <FormInput label="Height (cm)" value={values.height} onChange={(val) => handleChange("height", val)} placeholder="8" inputMode="numeric" error={errors?.height} />
            </div>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">Media</p>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
              />
              <p className="text-xs text-slate-400 mt-2">Upload up to 6 images (JPG/PNG/WebP).</p>
              {errors?.images && <p className="text-xs text-red-500 mt-2">{errors.images}</p>}
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Preview" className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 text-slate-600 hover:text-red-600 border border-slate-200 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {uploadProgress !== undefined && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
              Uploading images… {Math.round(uploadProgress)}%
              <div className="mt-2 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {errors?.shiprocket && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.shiprocket}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl font-semibold text-sm text-white bg-slate-950 hover:bg-orange-600 transition-colors"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
}

function FormInput({ label, value, onChange, placeholder, inputMode, error }: FieldProps) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={`w-full rounded-xl px-4 py-3 text-sm font-medium border bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all ${
          error ? "border-red-300 bg-red-50" : "border-slate-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

interface TextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

function FormTextarea({ label, value, onChange, placeholder, error }: TextareaProps) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={`w-full rounded-xl px-4 py-3 text-sm font-medium border bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all ${
          error ? "border-red-300 bg-red-50" : "border-slate-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
