"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "../lib/firebase";
import { listenToUserOrders, type Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../lib/orders";
import { ChevronLeft, Package, ShoppingBag, Clock, MapPin, CreditCard, ChevronRight, X, Truck } from "lucide-react";
import ShipmentTrackingCard from "../components/ShipmentTrackingCard";

/* ═══════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════ */
const PageSkeleton = () => (
  <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-xs font-medium text-slate-400">Loading your orders…</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   ORDER DETAIL MODAL
   ═══════════════════════════════════════════════════ */
const OrderDetailModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
  const orderNumber = order.orderId.slice(0, 8).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[100001] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
      style={{ animation: "fadeIn 180ms ease-out" }}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 280ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Order #{orderNumber}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {order.createdAt?.toDate?.().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) || "Just now"}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ORDER_STATUS_COLORS[order.orderStatus] || "bg-slate-100 text-slate-600"}`}>
              {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                  {item.productImage ? (
                    <Image src={item.productImage} alt={item.productName} width={44} height={44} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-4 h-4" strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.productName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.brandName} · Qty: {item.quantity}</p>
                </div>
                <p className="text-xs font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 pt-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700 font-medium">₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Delivery</span>
              <span className="text-slate-700 font-medium">
                {order.deliveryFee === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : `₹${order.deliveryFee.toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="border-t border-slate-100 pt-1.5 mt-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">Total</span>
                <span className="text-base font-extrabold text-slate-900">₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Shipment tracking info */}
          {order.shipments && order.shipments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" strokeWidth={1.5} />
                Shipments
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

          {/* Payment */}
          <div className="rounded-lg bg-slate-50 p-2.5 flex items-center gap-2.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-slate-700">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}
              </p>
              <p className="text-[9px] text-slate-400 capitalize">{order.paymentStatus}</p>
            </div>
          </div>

          {/* Delivery Address */}
          {order.shippingAddress && (
            <div className="rounded-lg bg-slate-50 p-2.5 flex items-start gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[11px] font-semibold text-slate-700">{order.shippingAddress.label || "Delivery Address"}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {order.shippingAddress.line1}, {order.shippingAddress.line2}
                  {order.shippingAddress.pincode ? ` - ${order.shippingAddress.pincode}` : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100">
          <Link
            href={`/order-success/${order.orderId}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            View Full Details
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   ORDER CARD
   ═══════════════════════════════════════════════════ */
const OrderCard = ({ order, onClick }: { order: Order; onClick: () => void }) => {
  const orderNumber = order.orderId.slice(0, 8).toUpperCase();
  const itemCount = order.items.length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-100 rounded-xl p-3.5 hover:shadow-md hover:border-slate-200 transition-all shadow-sm"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-900">Order #{orderNumber}</p>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${ORDER_STATUS_COLORS[order.orderStatus] || "bg-slate-100 text-slate-600"}`}>
              {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {order.createdAt?.toDate?.().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) || "Just now"}
            {" · "}
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" strokeWidth={2} />
      </div>

      {/* Item previews */}
      <div className="flex items-center gap-2">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.productId} className="w-9 h-9 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
            {item.productImage ? (
              <Image src={item.productImage} alt={item.productName} width={36} height={36} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package className="w-3.5 h-3.5" strokeWidth={1} />
              </div>
            )}
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <span className="text-[9px] font-bold text-slate-400">+{order.items.length - 3}</span>
          </div>
        )}
        <div className="flex-1 text-right">
          <p className="text-xs font-bold text-slate-900">₹{order.totalAmount.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </button>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function OrdersPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth?redirect=/orders");
        return;
      }
      setUserId(user.uid);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const unsub = listenToUserOrders(
      userId,
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load orders:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userId]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/shop")}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Back to shop"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" strokeWidth={2} />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">My Orders</h1>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {orders.length === 0 ? "No orders yet" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2} />
              Shop
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7 text-amber-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">No Orders Yet</h2>
            <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
              Browse our marketplace and find something your pet will love!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2} />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((order) => (
              <OrderCard key={order.orderId} order={order} onClick={() => setSelectedOrder(order)} />
            ))}
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
