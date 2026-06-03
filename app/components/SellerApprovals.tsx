"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import type { BrandProfile, SellerVerificationStatus } from "../lib/seller";

export default function SellerApprovals() {
  const [pendingSellers, setPendingSellers] = useState<BrandProfile[]>([]);
  const [activeSellers, setActiveSellers] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"pending" | "active">("pending");
  const [selectedSeller, setSelectedSeller] = useState<BrandProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const qPending = query(
      collection(db, "brands"),
      where("verificationStatus", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as BrandProfile[];
      setPendingSellers(fetched);
      setLoading(false);
    });

    const qActive = query(
      collection(db, "brands"),
      where("verificationStatus", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const unsubActive = onSnapshot(qActive, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as BrandProfile[];
      setActiveSellers(fetched);
    });

    return () => {
      unsubPending();
      unsubActive();
    };
  }, []);

  const displayList = useMemo(() => {
    const source = viewMode === "pending" ? pendingSellers : activeSellers;
    if (!search.trim()) return source;
    const term = search.trim().toLowerCase();
    return source.filter(
      (s) =>
        s.brandName?.toLowerCase().includes(term) ||
        s.ownerName?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.city?.toLowerCase().includes(term)
    );
  }, [viewMode, pendingSellers, activeSellers, search]);

  const handleApprove = async () => {
    if (!selectedSeller) return;
    setIsProcessing(true);

    try {
      const requiredFields: (keyof BrandProfile)[] = [
        "brandName", "ownerName", "email", "phone",
        "pickupAddress", "city", "state", "pincode",
      ];
      const missingFields = requiredFields.filter((key) => {
        const value = selectedSeller[key];
        return !value || value === "";
      });

      if (missingFields.length > 0) {
        alert(`Seller is missing required Shiprocket fields: ${missingFields.join(", ")}`);
        setIsProcessing(false);
        return;
      }

      // Debug: log the runtime value
      console.log("ENABLE_SHIPROCKET raw value:", process.env.NEXT_PUBLIC_ENABLE_SHIPROCKET);

      // Create Shiprocket pickup
      const pickupResponse = await fetch("/api/shiprocket/create-pickup", {
        
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedSeller.uid,
          brandName: selectedSeller.brandName,
          fullName: selectedSeller.ownerName,
          email: selectedSeller.email,
          phone: selectedSeller.phone,
          clinicAddress: selectedSeller.pickupAddress,
          city: selectedSeller.city,
          state: selectedSeller.state,
          pincode: selectedSeller.pincode,
        }),
      });

      const pickupData = await pickupResponse.json();

      if (!pickupResponse.ok || !pickupData?.success) {
        throw new Error(pickupData?.error || "Shiprocket pickup creation failed");
      }

      const pickupId = pickupData?.data?.pickup_id;
      const pickupCode = pickupData?.data?.address?.pickup_code || pickupData?.data?.pickup_code;

      if (!pickupId) {
        throw new Error("Shiprocket pickup ID missing from response");
      }

      await updateDoc(doc(db, "brands", selectedSeller.uid), {
        verificationStatus: "approved",
        shiprocketPickupCreated: true,
        shiprocketPickupId: pickupId,
        shiprocketPickupName: pickupCode || null,
      });

      alert("Seller approved successfully! Shiprocket pickup created.");
      setSelectedSeller(null);
    } catch (error: any) {
      console.error("Error approving seller:", error);
      alert(`Failed to approve seller: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSeller) return;
    const reason = window.prompt("Reason for rejection (optional):");
    if (reason === null) return;

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "brands", selectedSeller.uid), {
        verificationStatus: "rejected" as SellerVerificationStatus,
        rejectionReason: reason || "",
      });
      setSelectedSeller(null);
    } catch (error) {
      console.error("Error rejecting seller:", error);
      alert("Failed to reject seller.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedSeller) return;
    if (!window.confirm("Are you sure you want to revoke this seller's approved status?")) return;

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "brands", selectedSeller.uid), {
        verificationStatus: "rejected" as SellerVerificationStatus,
      });
      setSelectedSeller(null);
    } catch (error) {
      console.error("Error revoking seller:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Seller Directory</h2>

          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sellers…"
              className="w-44 rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <div className="flex bg-slate-200/50 p-1 rounded-lg">
              <button
                onClick={() => { setViewMode("pending"); setSearch(""); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  viewMode === "pending" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Pending ({pendingSellers.length})
              </button>
              <button
                onClick={() => { setViewMode("active"); setSearch(""); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  viewMode === "active" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Active ({activeSellers.length})
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[600px]">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
              <div className="text-3xl mb-2">{viewMode === "pending" ? "📋" : "🏪"}</div>
              <p className="text-slate-500 font-bold text-sm">
                {viewMode === "pending"
                  ? "Zero pending applications!"
                  : "No active sellers yet."}
              </p>
            </div>
          ) : (
            displayList.map((seller) => (
              <div
                key={seller.uid}
                className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 truncate mr-4">
                  {seller.logoURL ? (
                    <img
                      src={seller.logoURL}
                      alt={seller.brandName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg font-black shrink-0 border border-orange-100">
                      {seller.brandName?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                      {seller.brandName || "Unknown"}
                      {viewMode === "active" && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {seller.ownerName} • {seller.city || "Location"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSeller(seller)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors shrink-0 shadow-sm ${
                    viewMode === "pending"
                      ? "bg-slate-900 text-white hover:bg-orange-600"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {viewMode === "pending" ? "Review" : "View Profile"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {viewMode === "pending" ? "Review Seller Application" : "Seller Profile"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSeller(null)}
                className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-full flex items-center justify-center transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              {/* Brand Header */}
              <div className="flex items-center gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                {selectedSeller.logoURL ? (
                  <img
                    src={selectedSeller.logoURL}
                    alt={selectedSeller.brandName}
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-3xl">
                    🏪
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    {selectedSeller.brandName || "Unknown Brand"}
                    {viewMode === "active" && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Verified
                      </span>
                    )}
                  </h4>
                  <p className="text-sm font-bold text-slate-500 mt-1">
                    {selectedSeller.ownerName} • {selectedSeller.city}, {selectedSeller.state}
                  </p>
                </div>
              </div>

              {/* Contact & Business Info */}
              <div className="grid sm:grid-cols-2 gap-8 mb-8">
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Contact Info</h5>
                  <div className="space-y-2 text-sm font-medium text-slate-700">
                    <p>✉️ {selectedSeller.email || "N/A"}</p>
                    <p>📞 {selectedSeller.phone || "N/A"}</p>
                    {selectedSeller.website && (
                      <p>
                        🌐{" "}
                        <a
                          href={selectedSeller.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:underline"
                        >
                          {selectedSeller.website}
                        </a>
                      </p>
                    )}
                    {selectedSeller.instagram && <p>📸 {selectedSeller.instagram}</p>}
                    {selectedSeller.gstNumber && <p>🧾 GST: {selectedSeller.gstNumber}</p>}
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Pickup Address</h5>
                  <div className="space-y-2 text-sm font-medium text-slate-700">
                    <p>📍 {selectedSeller.pickupAddress || "No address"}</p>
                    <p>
                      {selectedSeller.city}, {selectedSeller.state} - {selectedSeller.pincode}
                    </p>
                    {selectedSeller.shiprocketPickupCreated && (
                      <p className="text-emerald-600 text-xs font-bold">
                        ✅ Shiprocket pickup configured (ID: {selectedSeller.shiprocketPickupId})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedSeller.description && (
                <div className="mb-8">
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Brand Description</h5>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    {selectedSeller.description}
                  </p>
                </div>
              )}

              {/* Documents */}
              <div className="space-y-4">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Uploaded Documents</h5>
                {selectedSeller.logoURL && (
                  <a
                    href={selectedSeller.logoURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🖼️</span>
                      <span className="font-bold text-sm text-slate-800">Brand Logo</span>
                    </div>
                    <span className="text-orange-600 text-sm font-bold group-hover:underline">View ↗</span>
                  </a>
                )}
                {selectedSeller.businessDocumentURL && (
                  <a
                    href={selectedSeller.businessDocumentURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <span className="font-bold text-sm text-slate-800">Business Verification Document</span>
                    </div>
                    <span className="text-orange-600 text-sm font-bold group-hover:underline">View ↗</span>
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              {viewMode === "pending" ? (
                <>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="flex-1 bg-white border-2 border-red-200 text-red-600 py-3.5 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? "Processing…" : "✅ Approve & Setup Shiprocket"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleRevoke}
                  disabled={isProcessing}
                  className="w-full bg-red-50 text-red-600 border border-red-200 py-3.5 rounded-xl font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                >
                  🚨 Revoke Seller Status
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
