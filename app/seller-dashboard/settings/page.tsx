"use client";

import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { fetchBrandProfile, INDIAN_STATES } from "../../lib/seller";
import type { BrandProfile } from "../../lib/seller";

/* ──────────────────── Types ──────────────────── */

type SaveStatus = "idle" | "confirming" | "saving" | "success" | "error";

interface PickupForm {
  pickupAddress: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

const INITIAL_FORM: PickupForm = {
  pickupAddress: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
};

/* ──────────────────── Validation ──────────────────── */

function validatePickupForm(data: PickupForm): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.pickupAddress.trim()) {
    errors.pickupAddress = "Pickup address is required";
  } else if (!/\d/.test(data.pickupAddress)) {
    errors.pickupAddress = "Address must include a house/shop number for Shiprocket";
  }

  if (!data.city.trim()) errors.city = "City is required";
  if (!data.state) errors.state = "Please select a state";

  if (!data.pincode.trim()) {
    errors.pincode = "Pincode is required";
  } else if (!/^[1-9]\d{5}$/.test(data.pincode.trim())) {
    errors.pincode = "Enter a valid 6-digit pincode";
  }

  if (!data.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, ""))) {
    errors.phone = "Enter a valid 10-digit Indian phone number";
  }

  return errors;
}

/* ══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */

export default function SellerSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<PickupForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");

  // ── Load user + brand profile ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchBrandProfile(user.uid)
      .then((profile) => {
        if (profile) {
          setBrandProfile(profile);
          setForm({
            pickupAddress: profile.pickupAddress || "",
            city: profile.city || "",
            state: profile.state || "",
            pincode: profile.pincode || "",
            phone: profile.phone || "",
          });
        }
      })
      .catch((err) => console.error("Failed to load brand profile:", err))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  // ── Handle field changes ──
  const handleChange = useCallback(
    (field: keyof PickupForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
      // Reset status on edit
      if (saveStatus === "success" || saveStatus === "error") {
        setSaveStatus("idle");
        setSaveMessage("");
      }
    },
    [errors, saveStatus]
  );

  // ── Initiate save with confirmation ──
  const handleSaveClick = useCallback(() => {
    const validationErrors = validatePickupForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSaveStatus("confirming");
  }, [form]);

  // ── Confirm and actually save ──
  const handleConfirmSave = useCallback(async () => {
    if (!user?.uid || !brandProfile) return;

    setSaveStatus("saving");
    setSaveMessage("");
    setErrors({});

    try {
      // Step 1: Create a new Shiprocket pickup location
      const pickupResponse = await fetch("/api/shiprocket/create-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: user.uid,
          brandName: brandProfile.brandName,
          fullName: brandProfile.ownerName,
          email: brandProfile.email,
          phone: form.phone,
          clinicAddress: form.pickupAddress.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
        }),
      });

      const pickupData = await pickupResponse.json();

      if (!pickupResponse.ok || !pickupData?.success) {
        throw new Error(pickupData?.error || "Shiprocket pickup creation failed");
      }

      const newPickupId = pickupData?.data?.pickup_id;
      const newPickupCode =
        pickupData?.data?.address?.pickup_code || pickupData?.data?.pickup_code;

      if (!newPickupId) {
        throw new Error("Shiprocket pickup ID missing from response");
      }

      // Step 2: Update Firestore with new address and pickup info
      await updateDoc(doc(db, "brands", user.uid), {
        pickupAddress: form.pickupAddress.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        phone: form.phone.trim(),
        shiprocketPickupCreated: true,
        shiprocketPickupId: newPickupId,
        shiprocketPickupName: newPickupCode || null,
        shiprocketPickupCreatedAt: serverTimestamp(),
        shiprocketPickupStatus: "active",
      });

      // Step 3: Update local state
      setBrandProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pickupAddress: form.pickupAddress.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          phone: form.phone.trim(),
          shiprocketPickupCreated: true,
          shiprocketPickupId: newPickupId,
          shiprocketPickupName: newPickupCode || null,
          shiprocketPickupStatus: "active",
        };
      });

      setSaveStatus("success");
      setSaveMessage(
        "Pickup address updated successfully! New Shiprocket pickup location is active."
      );
    } catch (err: any) {
      console.error("Failed to update pickup address:", err);
      setSaveStatus("error");
      setSaveMessage(
        err?.message || "Failed to update pickup address. Please try again."
      );
    }
  }, [user?.uid, brandProfile, form]);

  // ── Cancel confirmation ──
  const handleCancelConfirm = useCallback(() => {
    setSaveStatus("idle");
    setSaveMessage("");
  }, []);

  // ── Dismiss success/error ──
  const handleDismiss = useCallback(() => {
    setSaveStatus("idle");
    setSaveMessage("");
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Settings
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Seller Preferences
          </h2>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="w-5 h-5 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-sm font-semibold">Loading profile…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!brandProfile) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Settings
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Seller Preferences
          </h2>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-700">
            Could not load your seller profile. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  const pickupStatus = brandProfile.shiprocketPickupStatus || "active";
  const pickupCreatedDate = brandProfile.shiprocketPickupCreatedAt?.toDate
    ? brandProfile.shiprocketPickupCreatedAt.toDate().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">
      {/* ──────── Header ──────── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Settings
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          Seller Preferences
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your storefront and logistics settings.
        </p>
      </div>

      {/* ──────── Current Status Cards ──────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Storefront
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {brandProfile.brandName}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {brandProfile.verificationStatus === "approved" ? (
              <span className="text-emerald-600 font-medium">✓ Verified</span>
            ) : (
              <span className="text-amber-600 font-medium">⏳ {brandProfile.verificationStatus}</span>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Shiprocket Pickup
          </p>
          {brandProfile.shiprocketPickupCreated ? (
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {pickupStatus === "active" ? "Active" : pickupStatus}
              </p>
              {brandProfile.shiprocketPickupName && (
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  ID: {brandProfile.shiprocketPickupName}
                </p>
              )}
              {pickupCreatedDate && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Created: {pickupCreatedDate}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-semibold text-amber-600">Not Configured</p>
          )}
        </div>
      </div>

      {/* ──────── Pickup Address Form ──────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Pickup Address</p>
            <p className="text-xs text-slate-400">
              Where Shiprocket will pick up your orders for delivery
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Pickup Address */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Pickup Address *
            </label>
            <textarea
              value={form.pickupAddress}
              onChange={(e) => handleChange("pickupAddress", e.target.value)}
              placeholder="Shop No. 42, Main Road, Andheri East"
              rows={2}
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all ${
                errors.pickupAddress
                  ? "border-red-300 bg-red-50 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              }`}
            />
            {errors.pickupAddress && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.pickupAddress}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Must include a house or shop number for Shiprocket
            </p>
          </div>

          {/* City, State, Pincode */}
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                City *
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Mumbai"
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all ${
                  errors.city
                    ? "border-red-300 bg-red-50 text-slate-900"
                    : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                }`}
              />
              {errors.city && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                State *
              </label>
              <select
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all ${
                  errors.state
                    ? "border-red-300 bg-red-50 text-slate-900"
                    : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                }`}
              >
                <option value="">Select state…</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Pincode *
              </label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) =>
                  handleChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="400001"
                maxLength={6}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all ${
                  errors.pincode
                    ? "border-red-300 bg-red-50 text-slate-900"
                    : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                }`}
              />
              {errors.pincode && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.pincode}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Contact Phone *
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="9876543210"
              maxLength={10}
              className={`w-full max-w-xs rounded-xl px-4 py-3 text-sm font-medium border transition-all ${
                errors.phone
                  ? "border-red-300 bg-red-50 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Used by Shiprocket for pickup coordination
            </p>
          </div>
        </div>

        {/* ──────── Action Buttons ──────── */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-end items-center">
          {saveStatus === "idle" && (
            <button
              onClick={handleSaveClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
            >
              Update Pickup Address
            </button>
          )}
        </div>
      </div>

      {/* ──────── Confirmation Dialog ──────── */}
      {saveStatus === "confirming" && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={handleCancelConfirm} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-3">
                Change Pickup Address?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Changing your pickup address will create a new Shiprocket pickup location.
                Existing orders will not be affected.
              </p>
            </div>

            {/* Summary of changes */}
            <div className="mt-6 rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                New Address
              </p>
              <p className="text-sm text-slate-700">
                {form.pickupAddress}
              </p>
              <p className="text-sm text-slate-700">
                {form.city}, {form.state} - {form.pincode}
              </p>
              <p className="text-sm text-slate-700">
                📞 {form.phone}
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25 transition-all text-center"
              >
                Yes, Update Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────── Saving State ──────── */}
      {saveStatus === "saving" && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">Updating Pickup Address</h3>
            <p className="mt-2 text-sm text-slate-500">
              Creating new Shiprocket pickup location…
            </p>
            <div className="mt-5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      )}

      {/* ──────── Success State ──────── */}
      {saveStatus === "success" && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={handleDismiss} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-slate-900">Updated Successfully!</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {saveMessage}
            </p>
            <button
              onClick={handleDismiss}
              className="mt-6 w-full px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ──────── Error State ──────── */}
      {saveStatus === "error" && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={handleDismiss} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-slate-900">Update Failed</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {saveMessage || "Something went wrong. Please try again."}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleDismiss}
                className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleSaveClick}
                className="w-full px-6 py-3 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
