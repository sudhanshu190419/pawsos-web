"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  type Order,
  type OrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../lib/orders";
import {
  Package,
  Search,
  X,
  ChevronDown,
  MapPin,
  CreditCard,
  Truck,
  User,
  Store,
} from "lucide-react";
import ShipmentTrackingCard from "./ShipmentTrackingCard";

/* ═══════════════════════════════════════════════════
   STATUS FILTERS
   ═══════════════════════════════════════════════════ */

const STATUS_FILTERS: Array<{ label: string; value: OrderStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Placed", value: "placed" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

/* ═══════════════════════════════════════════════════
   METRIC CARD
   ═══════════════════════════════════════════════════ */

const MetricBadge = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) => {
  const colorMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-2 hover:shadow-sm transition-shadow">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
        {value}
      </p>
      <div className={`w-full h-1 rounded-full ${colorMap[color]?.split(" ")[0] || "bg-slate-100"}`} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   ORDER ROW
   ═══════════════════════════════════════════════════ */

const AdminOrderRow = ({ order }: { order: Order }) => {
  const [expanded, setExpanded] = useState(false);
  const orderNumber = order.orderId.slice(0, 8).toUpperCase();
  const itemCount = order.items?.length || 0;
  const vendorCount = order.vendorGroups?.length || 0;
  const formatDate = (ts: any) => {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* ── Collapsed Header ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Order icon */}
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-4.5 h-4.5 text-slate-500" strokeWidth={1.5} />
          </div>

          {/* Order info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">#{orderNumber}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${ORDER_STATUS_COLORS[order.orderStatus] || "bg-slate-100 text-slate-600"}`}>
                {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              <User className="w-3 h-3" strokeWidth={1.5} />
              {order.userName || "Anonymous"}
              <span className="text-slate-300 mx-0.5">·</span>
              {itemCount} item{itemCount !== 1 ? "s" : ""}
              {vendorCount > 1 && (
                <>
                  <span className="text-slate-300 mx-0.5">·</span>
                  {vendorCount} seller{vendorCount !== 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right side: amount + date */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">₹{order.totalAmount.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <CreditCard className="w-3 h-3" strokeWidth={1.5} />
              {order.paymentMethod === "cod" ? "COD" : "Online"}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </div>
        </div>
      </button>

      {/* ── Expanded Details ── */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-5 animate-fadeIn">
          {/* Items grouped by vendor */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Package className="w-3 h-3" strokeWidth={1.5} />
              Items
            </p>
            <div className="divide-y divide-slate-50 rounded-xl border border-slate-100 overflow-hidden">
              {order.vendorGroups?.map((group, gi) => (
                <div key={group.brandId || gi}>
                  {/* Vendor header */}
                  <div className="px-3 py-2 bg-slate-50/80 flex items-center gap-2 border-b border-slate-100">
                    <Store className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
                    <p className="text-[11px] font-semibold text-slate-700">{group.brandName}</p>
                    <span className="ml-auto text-[10px] text-slate-400 font-medium">
                      ₹{group.sellerPayoutAmount.toLocaleString("en-IN")} payout
                    </span>
                  </div>
                  {/* Items within this group */}
                  {group.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 px-3 py-2.5 last:border-b-0">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                        {item.productImage ? (
                          <Image src={item.productImage} alt={item.productName} width={36} height={36} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-3.5 h-3.5" strokeWidth={1} />
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
              ))}
            </div>
          </div>

          {/* Totals breakdown */}
          <div className="grid xs:grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Subtotal</p>
              <p className="text-sm font-bold text-slate-900 mt-1">₹{order.subtotal.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Delivery</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {order.deliveryFee === 0 ? (
                  <span className="text-emerald-600">FREE</span>
                ) : (
                  `₹${order.deliveryFee.toLocaleString("en-IN")}`
                )}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Payment</p>
              <p className="text-sm font-bold text-slate-900 mt-1 capitalize">{order.paymentMethod === "cod" ? "COD" : "Online"}</p>
              <p className={`text-[10px] font-medium mt-0.5 ${order.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                {order.paymentStatus}
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl p-3 text-white">
              <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">Total</p>
              <p className="text-base font-black mt-1">₹{order.totalAmount.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-[11px] font-semibold text-slate-700">{order.shippingAddress.label || "Delivery Address"}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                  {order.shippingAddress.pincode ? ` — ${order.shippingAddress.pincode}` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Customer info */}
          {order.userName && (
            <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <User className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-[11px] font-semibold text-slate-700">{order.userName}</p>
                {order.customerEmail && (
                  <p className="text-[10px] text-slate-400">{order.customerEmail}</p>
                )}
              </div>
            </div>
          )}

          {/* Shipment tracking */}
          {order.shipments && order.shipments.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3 h-3" strokeWidth={1.5} />
                Shipments ({order.shipments.length})
              </p>
              {order.shipments.map((shipment, idx) => (
                <ShipmentTrackingCard
                  key={shipment.shiprocketOrderId || idx}
                  shipment={shipment}
                  shipmentIndex={idx}
                  compact
                />
              ))}
            </div>
          )}

          {/* Order metadata */}
          <div className="pt-2 border-t border-dashed border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Order ID: {order.orderId}</span>
            <span>Placed {formatDate(order.createdAt)}</span>
          </div>
        </div>
      )}

    </div>
  );
};

/* ═══════════════════════════════════════════════════
   SKELETON LOADING
   ═══════════════════════════════════════════════════ */

const OrderSkeleton = () => (
  <div className="space-y-2.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-100 rounded w-1/4" />
            <div className="h-2.5 bg-slate-50 rounded w-1/3" />
          </div>
          <div className="w-20 h-3 bg-slate-100 rounded" />
        </div>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════ */

export default function AdminOrdersPanel({ orders, loading }: { orders: Order[]; loading?: boolean }) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

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
          o.userName?.toLowerCase().includes(q) ||
          o.items?.some((item) => item.productName.toLowerCase().includes(q)) ||
          o.vendorGroups?.some((g) => g.brandName.toLowerCase().includes(q)) ||
          o.shippingAddress?.pincode?.includes(q)
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

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    [orders]
  );

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "pending" || o.orderStatus === "placed" || o.orderStatus === "confirmed"
  ).length;
  const shippedOrders = orders.filter(
    (o) => o.orderStatus === "shipped" || o.orderStatus === "packed"
  ).length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === "cancelled").length;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Marketplace
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          All Orders
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          View and manage every order across all sellers on the platform.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricBadge label="Total Orders" value={orders.length} color="slate" />
        <MetricBadge label="Pending" value={pendingOrders} color="amber" />
        <MetricBadge label="Shipped" value={shippedOrders} color="blue" />
        <MetricBadge label="Delivered" value={deliveredOrders} color="emerald" />
        <MetricBadge label="Cancelled" value={cancelledOrders} color="red" />
        <MetricBadge
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          color="violet"
        />
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
              {f.label}
              {(statusCounts[f.value] ?? 0) > 0 && (
                <span className={`text-[10px] ${statusFilter === f.value ? "text-white/70" : "text-slate-400"}`}>
                  ({statusCounts[f.value]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order ID, user, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-slate-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <OrderSkeleton />
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <Package className="w-8 h-8 text-slate-400" strokeWidth={1} />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800 mb-1">
            {searchQuery || statusFilter !== "all" ? "No matching orders" : "No orders yet"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Orders will appear here once customers start purchasing from the marketplace."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[11px] text-slate-400 font-medium">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            {statusFilter !== "all" &&
              ` · ${ORDER_STATUS_LABELS[statusFilter as OrderStatus] || statusFilter}`}
          </p>
          {filteredOrders.map((order) => (
            <AdminOrderRow key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

<style>{`
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .animate-fadeIn { animation: fadeIn 200ms ease-out; }
`}</style>
