"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchOrder } from "../../lib/orders";
import type { Order } from "../../lib/orders";
import {
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  CreditCard,
  ChevronLeft,
  ShoppingBag,
  Truck,
} from "lucide-react";
import ShipmentTrackingCard from "../../components/ShipmentTrackingCard";

/* ═══════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════ */
const PageSkeleton = () => (
  <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-xs font-medium text-slate-400">Loading order details…</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   ORDER STATUS TIMELINE
   ═══════════════════════════════════════════════════ */
const OrderTimeline = ({ status }: { status: string }) => {
  const steps = [
    { key: "placed", label: "Order Placed", icon: CheckCircle2 },
    { key: "confirmed", label: "Confirmed", icon: Package },
    { key: "packed", label: "Packed", icon: Package },
    { key: "shipped", label: "Shipped", icon: Clock },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  const currentIdx = steps.findIndex(
    (s) => s.key === status || (status === "pending" && s.key === "placed")
  );
  const isCancelled = status === "cancelled";

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />

      <div className="space-y-5 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const completed = idx <= currentIdx && !isCancelled;
          const active = idx === currentIdx && !isCancelled;

          return (
            <div key={step.key} className="flex items-start gap-3 pl-0">
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  completed
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                    : isCancelled && idx === 0
                    ? "bg-red-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div className="pt-1">
                <p
                  className={`text-sm font-semibold ${
                    completed
                      ? "text-slate-900"
                      : isCancelled && idx === 0
                      ? "text-red-600"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                  {active && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      In Progress
                    </span>
                  )}
                </p>
                {completed && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {idx === 0
                      ? "Your order has been placed successfully"
                      : `Step ${idx + 1} of ${steps.length} complete`}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="flex items-start gap-3 pl-0">
            <div className="relative z-10 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="pt-1">
              <p className="text-sm font-semibold text-red-600">Order Cancelled</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                This order has been cancelled
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function OrderSuccessPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOrder(id as string)
      .then((data) => setOrder(data))
      .catch((err) => console.error("Failed to fetch order:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton />;

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">
            We couldn&apos;t find this order. It may have been removed or the link is invalid.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const isDelivered = order.orderStatus === "delivered";
  const orderNumber = order.orderId.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* ════════ HEADER ════════ */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
              Back to Shop
            </Link>
            <button
              onClick={() => router.push("/orders")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2} />
              My Orders
            </button>
          </div>
        </div>
      </div>

      {/* ════════ SUCCESS BANNER ════════ */}
      <div className="bg-gradient-to-b from-emerald-50 to-white border-b border-emerald-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={2} />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            Your order has been confirmed and is being processed. You will receive tracking updates once it ships.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
            <Package className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
            <span className="text-xs font-bold text-slate-800">Order #{orderNumber}</span>
          </div>
        </div>
      </div>

      {/* ════════ CONTENT ════════ */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* ── Delivery Timeline ── */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-indigo-600" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Delivery Timeline</h3>
              <p className="text-[10px] text-slate-400">Estimated within 3-5 business days</p>
            </div>
          </div>
          <OrderTimeline status={order.orderStatus} />
        </div>

        {/* ── Order Summary ── */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-amber-600" strokeWidth={2} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Order Summary</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-4 h-4" strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.productName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {item.brandName} · Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-xs font-bold text-slate-900 flex-shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>

          {/* Seller groups */}
          {order.vendorGroups && order.vendorGroups.length > 1 && (
            <div className="mt-3 pt-3 border-t border-dashed border-slate-100">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Sellers
              </p>
              <div className="space-y-1">
                {order.vendorGroups.map((group) => (
                  <div
                    key={group.brandId}
                    className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-orange-600">
                          {group.brandName.charAt(0)}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">
                        {group.brandName}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Shipment Tracking ── */}
        {order.shipments && order.shipments.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-indigo-600" strokeWidth={2} />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Shipment Tracking</h3>
            </div>

            <div className="space-y-2.5">
              {order.shipments.map((shipment, idx) => (
                <ShipmentTrackingCard
                  key={shipment.shiprocketOrderId || idx}
                  shipment={shipment}
                  shipmentIndex={idx}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Delivery Address ── */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Delivery Address</h3>
          </div>
          <div className="text-sm text-slate-600 ml-10">
            <p className="font-semibold text-slate-700">
              {order.shippingAddress?.label || "Address"}
            </p>
            <p>{order.shippingAddress?.line1}</p>
            <p>
              {order.shippingAddress?.line2}
              {order.shippingAddress?.pincode
                ? ` - ${order.shippingAddress.pincode}`
                : ""}
            </p>
          </div>
        </div>

        {/* ── Payment Info ── */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-violet-600" strokeWidth={2} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Payment Details</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700 font-medium">
                ₹{order.subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Delivery</span>
              <span className="text-slate-700 font-medium">
                {order.deliveryFee === 0 ? (
                  <span className="text-emerald-600 font-semibold">FREE</span>
                ) : (
                  `₹${order.deliveryFee.toLocaleString("en-IN")}`
                )}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">Total</span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[9px] font-medium capitalize">
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 pb-8">
          <Link
            href="/shop"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2} />
            Continue Shopping
          </Link>
          <Link
            href="/orders"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            <Package className="w-3.5 h-3.5" strokeWidth={2} />
            View All Orders
          </Link>
        </div>
      </main>
    </div>
  );
}
