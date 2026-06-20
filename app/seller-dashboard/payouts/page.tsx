"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { DashboardCard, EmptyState, MetricCard } from "../components/SellerDashboardCards";
import {
  listenToSellerPayouts,
  type SellerPayout,
} from "../../lib/orders";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function SellerPayoutsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<SellerPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsub = listenToSellerPayouts(
      userId,
      (data) => {
        setPayouts(data);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load payouts:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userId]);

  const metrics = useMemo(() => {
    let totalEarned = 0;
    let totalPaid = 0;
    let totalPending = 0;

    for (const payout of payouts) {
      if (payout.status === "paid") {
        totalPaid += payout.amount;
        totalEarned += payout.amount;
      } else if (payout.status === "pending") {
        totalPending += payout.amount;
        totalEarned += payout.amount;
      }
    }

    return { totalEarned, totalPaid, totalPending };
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    if (!searchQuery.trim()) return payouts;
    const q = searchQuery.toLowerCase();
    return payouts.filter(
      (p) =>
        p.orderId.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    );
  }, [payouts, searchQuery]);

  const pendingCount = payouts.filter((p) => p.status === "pending").length;
  const paidCount = payouts.filter((p) => p.status === "paid").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">Finance</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Payout History</h2>
        <p className="text-sm text-slate-500 mt-1">Track your earnings and payout status.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Earned"
          value={loading ? "..." : `₹${metrics.totalEarned.toLocaleString("en-IN")}`}
          note={`Across ${payouts.length} payout${payouts.length !== 1 ? "s" : ""}`}
        />
        <MetricCard
          label="Paid Out"
          value={loading ? "..." : `₹${metrics.totalPaid.toLocaleString("en-IN")}`}
          note={`${paidCount} completed payout${paidCount !== 1 ? "s" : ""}`}
        />
        <MetricCard
          label="Pending"
          value={loading ? "..." : `₹${metrics.totalPending.toLocaleString("en-IN")}`}
          note={`${pendingCount} payout${pendingCount !== 1 ? "s" : ""} awaiting settlement`}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by order ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-slate-300"
        />
      </div>

      {/* Payouts List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-50 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPayouts.length === 0 ? (
        <DashboardCard title="Payouts" subtitle={searchQuery ? "No matching payouts" : "Your payout history"}>
          <EmptyState
            message={
              searchQuery
                ? "No payouts match your search."
                : "Payout records will appear here once you start receiving orders. Every order generates a payout record automatically."
            }
          />
        </DashboardCard>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 font-medium">
            {filteredPayouts.length} payout{filteredPayouts.length !== 1 ? "s" : ""}
          </p>

          {filteredPayouts.map((payout) => {
            const isExpanded = expandedOrder === payout.id;
            const orderNumber = payout.orderId.slice(0, 8).toUpperCase();

            return (
              <div
                key={payout.id}
                className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : (payout.id || null))}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        Order #{orderNumber}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {payout.createdAt?.toDate?.().toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }) || "Just now"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        ₹{payout.amount.toLocaleString("en-IN")}
                      </p>
                      {payout.platformFee > 0 && (
                        <p className="text-[9px] text-slate-400">Fee: ₹{payout.platformFee.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                    <StatusBadge status={payout.status} />
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" strokeWidth={2} />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={2} />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3.5 space-y-2.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">₹{payout.amount.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Platform Fee</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">₹{payout.platformFee.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</p>
                        <p className="mt-0.5">
                          <StatusBadge status={payout.status} />
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {payout.status === "paid" ? "Paid On" : "Created"}
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          {payout.status === "paid" && payout.paidAt?.toDate
                            ? payout.paidAt.toDate().toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : payout.createdAt?.toDate?.().toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }) || "—"}
                        </p>
                      </div>
                    </div>

                    {payout.paymentNote && (
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Note</p>
                        <p className="text-xs text-slate-600 mt-0.5">{payout.paymentNote}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-[9px] font-mono text-slate-300">
                        ID: {payout.id?.slice(0, 12)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
