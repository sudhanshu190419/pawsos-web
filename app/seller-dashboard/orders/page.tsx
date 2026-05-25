"use client";

import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { auth, db } from "../../lib/firebase";
import {
  listenToSellerOrders,
  getSellerItemsFromOrder,
  getSellerSubtotalFromOrder,
  type Order,
  type OrderItem,
  type OrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  isValidTransition,
} from "../../lib/orders";
import { DashboardCard, EmptyState, MetricCard } from "../components/SellerDashboardCards";
import { useSellerDashboard } from "../components/SellerDashboardContext";
import { ChevronDown, Package, Search, Clock, CheckCircle2, X, Truck } from "lucide-react";
import ShipmentTrackingCard from "../../components/ShipmentTrackingCard";

/* ═══════════════════════════════════════════════════
   STATUS FILTER
   ═══════════════════════════════════════════════════ */
const STATUS_FILTERS: Array<{ label: string; value: OrderStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

/* ═══════════════════════════════════════════════════
   ORDER STATUS UPDATE BUTTON
   ═══════════════════════════════════════════════════ */
const StatusUpdateButton = ({
  orderId,
  currentStatus,
  onUpdated,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  onUpdated: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const nextStatuses = ORDER_STATUSES.filter(
    (s) => s !== currentStatus && isValidTransition(currentStatus, s) && s !== "cancelled"
  );
  const canCancel = currentStatus === "pending" || currentStatus === "confirmed";

  if (nextStatuses.length === 0 && !canCancel) return null;

  const handleUpdate = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    setUpdateError("");
    try {
      await updateDoc(doc(db, "orders", orderId), {
        orderStatus: newStatus,
        updatedAt: serverTimestamp(),
      });
      onUpdated();
      setIsOpen(false);
    } catch (err) {
      setUpdateError("Failed to update. Try again.");
      console.error("Failed to update order status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {isUpdating ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            Updating…
          </span>
        ) : (
          <>
            Update Status
            <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
          </>
        )}
      </button>      {updateError && (
        <p className="text-[10px] text-red-500 mt-1">{updateError}</p>
      )}
      {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => { setIsOpen(false); setUpdateError(""); }} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px]">
            {nextStatuses.map((status) => (
              <button
                key={status}
                onClick={() => handleUpdate(status)}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <span className={`w-2 h-2 rounded-full ${ORDER_STATUS_COLORS[status]?.split(" ")[0] || "bg-slate-400"}`} />
                Mark as {ORDER_STATUS_LABELS[status]}
              </button>
            ))}
            {canCancel && (
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => handleUpdate("cancelled")}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   ORDER ROW (for seller)
   ═══════════════════════════════════════════════════ */
const SellerOrderRow = ({
  order,
  brandId,
  onStatusUpdated,
}: {
  order: Order;
  brandId: string;
  onStatusUpdated: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const sellerItems = getSellerItemsFromOrder(order, brandId);
  const sellerSubtotal = getSellerSubtotalFromOrder(order, brandId);
  const orderNumber = order.orderId.slice(0, 8).toUpperCase();

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            {sellerItems[0]?.productImage ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100">
                <Image src={sellerItems[0].productImage} alt="" width={40} height={40} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Order #{orderNumber}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {sellerItems.length} item{sellerItems.length !== 1 ? "s" : ""} · ₹{sellerSubtotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${ORDER_STATUS_COLORS[order.orderStatus] || "bg-slate-100 text-slate-600"}`}>
            {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* Seller's items only */}
          <div className="divide-y divide-slate-50">
            {sellerItems.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                  {item.productImage ? (
                    <Image src={item.productImage} alt={item.productName} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-4 h-4" strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.productName}</p>
                  <p className="text-[10px] text-slate-400">Qty: {item.quantity} · ₹{item.price.toLocaleString("en-IN")} each</p>
                </div>
                <p className="text-xs font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>

          {/* Customer & dates */}
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Customer: {order.userName || "Anonymous"}</span>
            <span>
              {order.createdAt?.toDate?.().toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
              }) || "Just now"}
            </span>
          </div>

          {/* Shipment tracking */}
          {order.shipments && order.shipments.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3 h-3" strokeWidth={1.5} />
                Shipment Tracking
              </p>
              {order.shipments
                .filter((s) => s.brandId === brandId)
                .map((shipment, idx) => (
                  <ShipmentTrackingCard
                    key={shipment.shiprocketOrderId || shipment.brandId}
                    shipment={shipment}
                    shipmentIndex={idx}
                    compact
                  />
                ))}
              {order.shipments.filter((s) => s.brandId === brandId).length === 0 && (
                <p className="text-[10px] text-slate-400 italic">No tracking data for this brand</p>
              )}
            </div>
          )}

          {/* Status update */}
          <div className="flex justify-end pt-1 border-t border-dashed border-slate-100">
            <StatusUpdateButton orderId={order.orderId} currentStatus={order.orderStatus} onUpdated={onStatusUpdated} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function SellerOrdersPage() {
  const { displayName } = useSellerDashboard();
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsub = listenToSellerOrders(
      userId,
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load seller orders:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userId]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.orderStatus === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.items?.some((item) => item.productName.toLowerCase().includes(q)) ||
          o.userName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    ORDER_STATUSES.forEach((s) => {
      counts[s] = orders.filter((o) => o.orderStatus === s).length;
    });
    return counts;
  }, [orders]);

  const pendingOrders = orders.filter((o) => o.orderStatus === "pending").length;
  const shippedOrders = orders.filter((o) => o.orderStatus === "shipped" || o.orderStatus === "packed").length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Orders</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Order Management</h2>
        <p className="text-sm text-slate-500 mt-1">Track, fulfill, and manage your brand&apos;s orders.</p>
      </div>

      {/* Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Pending" value={String(pendingOrders)} note="Awaiting confirmation" />
        <MetricCard label="In Transit" value={String(shippedOrders)} note="Packed or shipped" />
        <MetricCard label="Delivered" value={String(deliveredOrders)} note="Completed orders" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all ${
                statusFilter === f.value
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              {ORDER_STATUS_LABELS[f.value as OrderStatus] || f.label}
              {statusCounts[f.value] > 0 && (
                <span className={`text-[10px] ${statusFilter === f.value ? "text-white/70" : "text-slate-400"}`}>
                  ({statusCounts[f.value]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-slate-300"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Orders list */}
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
                <div className="h-5 bg-slate-100 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <DashboardCard title="No Orders" subtitle={searchQuery ? "Try a different search" : "Orders will appear here when customers purchase your products"}>
          <EmptyState message={searchQuery ? "No orders match your search" : "No orders received yet. Share your store to get your first sale!"} />
        </DashboardCard>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[11px] text-slate-400 font-medium">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            {statusFilter !== "all" && ` · ${ORDER_STATUS_LABELS[statusFilter as OrderStatus] || statusFilter}`}
          </p>
          {filteredOrders.map((order) => (
            <SellerOrderRow
              key={order.orderId}
              order={order}
              brandId={userId!}
              onStatusUpdated={() => {}} // snapshot already handles re-render
            />
          ))}
        </div>
      )}
    </div>
  );
}
