"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  createBrandApplication,
  INDIAN_STATES,
  uploadBrandFile,
  validateBrandForm,
  type BrandFormData,
  type BrandProfile,
} from "../lib/seller";

type Step = "form" | "uploading" | "success";

const INITIAL_FORM: BrandFormData = {
  brandName: "",
  ownerName: "",
  email: "",
  phone: "",
  gstNumber: "",
  pickupAddress: "",
  city: "",
  state: "",
  pincode: "",
  website: "",
  instagram: "",
  description: "",
};

export default function BecomeSellerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [form, setForm] = useState<BrandFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [submitError, setSubmitError] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleChange = (field: keyof BrandFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleLogo = (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: "Logo must be under 2MB" }));
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((prev) => { const n = { ...prev }; delete n.logo; return n; });
  };

  const handleDocument = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, document: "Document must be under 10MB" }));
      return;
    }
    setDocFile(file);
    setDocName(file.name);
    setErrors((prev) => { const n = { ...prev }; delete n.document; return n; });
  };

  const fieldErrors = useMemo(() => {
    if (Object.keys(errors).length === 0) return errors;
    return errors;
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const validationErrors = validateBrandForm(form);
    if (!logoFile) validationErrors.logo = "Brand logo is required";
    if (!docFile) validationErrors.document = "Business verification document is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!user?.uid) {
      router.push("/auth?redirect=/become-seller");
      return;
    }

    setIsSubmitting(true);
    setStep("uploading");

    try {
      // Check if user already has a brand application
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const existingSnap = await getDoc(doc(db, "brands", user.uid));
      if (existingSnap.exists()) {
        setSubmitError("You already have a seller application under review. Please wait for approval.");
        setStep("form");
        setIsSubmitting(false);
        return;
      }

      setUploadProgress(15);

      const [logoURL, businessDocumentURL] = await Promise.all([
        uploadBrandFile(user.uid, logoFile!, "logo"),
        uploadBrandFile(user.uid, docFile!, "document"),
      ]);

      setUploadProgress(60);

      await createBrandApplication(user.uid, {
        ...form,
        logoURL,
        businessDocumentURL,
      });

      setUploadProgress(100);
      setStep("success");
    } catch (err: any) {
      console.error("Seller application failed:", err);
      setSubmitError(err?.message || "Something went wrong. Please try again.");
      setStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <span className="w-4 h-4 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading…</span>
        </div>
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-extrabold text-slate-900">Submitting your application</h3>
            <p className="text-sm text-slate-500 mt-2">Uploading files and creating your seller profile…</p>
            <div className="mt-6 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{Math.round(uploadProgress)}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-extrabold text-slate-900">Application Submitted!</h3>
            <p className="text-sm text-slate-500 mt-2">
              Thank you for applying to become a seller on AnimalSathi Marketplace. Our team will review your application and get back to you.
            </p>
            <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-slate-700">
              <p className="font-semibold">What happens next?</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                <li>✅ Our admin team reviews your documents</li>
                <li>✅ Shiprocket pickup location is configured</li>
                <li>✅ You get access to the Seller Dashboard</li>
              </ul>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Back to Home
              </Link>
              <Link
                href="/shop"
                className="px-5 py-3 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25 transition-all"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            ← Back
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">AnimalSathi Marketplace</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest mb-4">
            🏪 Become a Seller
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Start Selling on AnimalSathi
          </h1>
          <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
            Join India&apos;s fastest-growing pet care marketplace. Reach thousands of pet parents across the country.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
          {/* Business Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <p className="text-sm font-bold text-slate-900">Business Information</p>
                <p className="text-xs text-slate-400">Your brand and contact details</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                label="Brand Name *"
                value={form.brandName}
                onChange={(v) => handleChange("brandName", v)}
                placeholder="My Pet Brand"
                error={errors.brandName}
              />
              <FormField
                label="Owner Name *"
                value={form.ownerName}
                onChange={(v) => handleChange("ownerName", v)}
                placeholder="John Doe"
                error={errors.ownerName}
              />
              <FormField
                label="Business Email *"
                type="email"
                value={form.email}
                onChange={(v) => handleChange("email", v)}
                placeholder="hello@mybrand.com"
                error={errors.email}
              />
              <FormField
                label="Phone Number *"
                type="tel"
                value={form.phone}
                onChange={(v) => handleChange("phone", v)}
                placeholder="9876543210"
                inputMode="numeric"
                error={errors.phone}
              />
              <FormField
                label="GST Number (optional)"
                value={form.gstNumber}
                onChange={(v) => handleChange("gstNumber", v)}
                placeholder="27ABCDE1234F1Z5"
                error={errors.gstNumber}
              />
            </div>
          </div>

          {/* Pickup / Shipping */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <p className="text-sm font-bold text-slate-900">Pickup / Shipping Address</p>
                <p className="text-xs text-slate-400">Where Shiprocket will pick up your orders</p>
              </div>
            </div>
            <div className="space-y-5">
              <FormField
                label="Pickup Address *"
                value={form.pickupAddress}
                onChange={(v) => handleChange("pickupAddress", v)}
                placeholder="Shop No. 42, Main Road, Andheri East"
                error={errors.pickupAddress}
                helper="Must include a house or shop number for Shiprocket"
              />
              <div className="grid sm:grid-cols-3 gap-5">
                <FormField
                  label="City *"
                  value={form.city}
                  onChange={(v) => handleChange("city", v)}
                  placeholder="Mumbai"
                  error={errors.city}
                />
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    State *
                  </label>
                  <select
                    value={form.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium border bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all ${
                      errors.state ? "border-red-300 bg-red-50" : "border-slate-200"
                    }`}
                  >
                    <option value="">Select state…</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <p className="mt-1 text-xs text-red-500 font-medium">{errors.state}</p>}
                </div>
                <FormField
                  label="Pincode *"
                  value={form.pincode}
                  onChange={(v) => handleChange("pincode", v)}
                  placeholder="400001"
                  inputMode="numeric"
                  maxLength={6}
                  error={errors.pincode}
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <p className="text-sm font-bold text-slate-900">Brand Media</p>
                <p className="text-xs text-slate-400">Upload your logo and verification documents</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Logo Upload */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Brand Logo * <span className="text-slate-300 normal-case">(under 2MB)</span>
                </label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                    logoPreview
                      ? "border-emerald-200 bg-emerald-50/30"
                      : errors.logo
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/30"
                  }`}
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-contain mx-auto rounded-lg" />
                  ) : (
                    <div className="text-slate-400">
                      <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-medium">Click to upload logo</p>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
                  />
                </div>
                {errors.logo && <p className="mt-1 text-xs text-red-500 font-medium">{errors.logo}</p>}
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Business Document * <span className="text-slate-300 normal-case">(under 10MB)</span>
                </label>
                <div
                  onClick={() => docInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                    docFile
                      ? "border-emerald-200 bg-emerald-50/30"
                      : errors.document
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/30"
                  }`}
                >
                  {docFile ? (
                    <div className="text-slate-700">
                      <svg className="w-10 h-10 mx-auto mb-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-xs font-medium truncate max-w-full">{docName}</p>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs font-medium">Upload GST / business proof</p>
                    </div>
                  )}
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => handleDocument(e.target.files?.[0] ?? null)}
                  />
                </div>
                {errors.document && <p className="mt-1 text-xs text-red-500 font-medium">{errors.document}</p>}
              </div>
            </div>
          </div>

          {/* Optional Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">Optional Details</p>
                <p className="text-xs text-slate-400">Help customers learn more about your brand</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                label="Website"
                value={form.website}
                onChange={(v) => handleChange("website", v)}
                placeholder="https://mybrand.com"
              />
              <FormField
                label="Instagram"
                value={form.instagram}
                onChange={(v) => handleChange("instagram", v)}
                placeholder="@mybrand"
              />
            </div>
            <div className="mt-5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Brand Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Tell us about your brand and what makes your products special…"
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium border border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 font-medium">
              {submitError}
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link
              href="/"
              className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
            >
              {isSubmitting ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
  error,
  helper,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  error?: string;
  helper?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`w-full rounded-xl px-4 py-3 text-sm font-medium border bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all ${
          error ? "border-red-300 bg-red-50" : "border-slate-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
  );
}
