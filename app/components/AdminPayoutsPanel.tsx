"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { SellerPayout } from "../lib/orders";
import { DollarSign, CheckCircle2, Clock, XCircle, Search, Store, ShoppingBag } from "lucide-react";

/* ── Status Badge ── */
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    paid: <CheckCircle2 className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

/* ── Props ── */
interface AdminPayoutsPanelProps {
  payouts: SellerPayout[];
  user: { uid: string } | null;
  onUpdated: () => void;
}

/* ── Panel ── */
export default function AdminPayoutsPanel({ payouts, user, onUpdated }: AdminPayoutsPanelProps) {
  const [viewFilter, setViewFilter] = useState<"pending" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [paymentNote, setPaymentNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);

  const filteredPayouts = payouts
    .filter((p) => viewFilter === "pending" ? p.status === "pending" : true)
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.sellerName?.toLowerCase().includes(q) ||
        p.orderId.toLowerCase().includes(q) ||
        p.sellerId.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      );
    });

  const totalPendingAmount = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaidAmount = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  /* ── Mark as Paid ── */
  const handleMarkAsPaid = async (payoutId: string) => {
    if (!user?.uid) return;
    setMarkingId(payoutId);
    try {
      await updateDoc(doc(db, "seller_payouts", payoutId), {
        status: "paid",
        paidAt: serverTimestamp(),
        paidBy: user.uid,
        paymentNote: paymentNote.trim() || null,
      });
      setPaymentNote("");
      setShowNoteInput(null);
      onUpdated();
    } catch (err) {
      console.error("Failed to mark payout as paid:", err);
      alert("Failed to update payout. Please try again.");
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Seller Payout Management</h2>
            <p className="text-sm text-slate-500 mt-1">
              {payouts.filter((p) => p.status === "pending").length} pending payout{payouts.filter((p) => p.status === "pending").length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-3xl font-black text-amber-800">
              ₹{totalPendingAmount.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {payouts.filter((p) => p.status === "pending").length} payout{payouts.filter((p) => p.status === "pending").length !== 1 ? "s" : ""} to settle
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Paid Out</p>
            <p className="text-3xl font-black text-emerald-800">
              ₹{totalPaidAmount.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {payouts.filter((p) => p.status === "paid").length} completed
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
            <p className="text-3xl font-black text-slate-800">
              ₹{(totalPendingAmount + totalPaidAmount).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {payouts.length} total record{payouts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <div className="flex gap-1.5">
            {(["pending", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setViewFilter(f)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  viewFilter === f
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-slate-400"
                }`}
              >
                {f === "pending" ? "Pending Only" : "All Payouts"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by seller name, order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Payouts List */}
      {filteredPayouts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {viewFilter === "pending" ? "All Caught Up!" : "No Payouts Yet"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {viewFilter === "pending"
              ? "All seller payouts have been settled. Great work!"
              : "Payout records will appear here when sellers receive orders."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPayouts.map((payout) => {
            const orderNumber = payout.orderId.slice(0, 8).toUpperCase();
            const sellerName = payout.sellerName || "Unknown Seller";

            return (
              <div
                key={payout.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  {/* Left: Seller + Order Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-100">
                      <Store className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Seller name — prominent */}
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {sellerName}
                        </p>
                        <StatusBadge status={payout.status} />
                      </div>
                      {/* Order + item details */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          Order #{orderNumber}
                        </span>
                        {payout.orderItemCount > 0 && (
                          <>
                            <span className="text-slate-200">|</span>
                            <span>{payout.orderItemCount} item{payout.orderItemCount !== 1 ? "s" : ""}</span>
                          </>
                        )}
                        <span className="text-slate-200">|</span>
                        <span>
                          {payout.createdAt?.toDate?.().toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          }) || "Just now"}
                        </span>
                      </div>
                      {/* Seller UID — subtle, for reference */}
                      <p className="text-[9px] text-slate-300 font-mono mt-0.5">
                        ID: {payout.sellerId.slice(0, 12)}...
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount + Actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">₹{payout.amount.toLocaleString("en-IN")}</p>
                      {payout.platformFee > 0 && (
                        <p className="text-[9px] text-slate-400">Fee: ₹{payout.platformFee.toLocaleString("en-IN")}</p>
                      )}
                    </div>

                    {payout.status === "pending" && (
                      <div className="flex items-center gap-2">
                        {showNoteInput === payout.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={paymentNote}
                              onChange={(e) => setPaymentNote(e.target.value)}
                              placeholder="Add note..."
                              className="w-28 px-2 py-1.5 text-[10px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <button
                              onClick={() => setShowNoteInput(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold px-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowNoteInput(payout.id || null)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold underline underline-offset-2"
                          >
                            + Note
                          </button>
                        )}
                        <button
                          onClick={() => handleMarkAsPaid(payout.id!)}
                          disabled={markingId === payout.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
                        >
                          {markingId === payout.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {markingId === payout.id ? "Marking..." : "Mark as Paid"}
                        </button>
                      </div>
                    )}

                    {payout.status === "paid" && payout.paidAt?.toDate && (
                      <p className="text-[10px] text-slate-400 max-w-[140px] text-right leading-relaxed">
                        Paid {payout.paidAt.toDate().toLocaleDateString("en-IN", {
                          day: "numeric", month: "short",
                        })}
                        {payout.paymentNote && (
                          <span className="block italic text-slate-400 truncate">· {payout.paymentNote}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
