"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import {
  DashboardCard,
  EmptyState,
  InfoTile,
  MetricCard,
  StatusPill,
} from "./components/SellerDashboardCards";
import { useSellerDashboard } from "./components/SellerDashboardContext";
import {
  listenToSellerOrders,
  getSellerSubtotalFromOrder,
  type Order,
} from "../lib/orders";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function SellerDashboardPage() {
  const { displayName } = useSellerDashboard();
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const [productCount, setProductCount] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "products"), where("brandId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      setProductCount(snap.size);
      setProductsLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let pendingPayouts = 0;
    let pendingOrders = 0;
    let fulfilledOrders = 0;

    for (const order of orders) {
      const sellerSubtotal = getSellerSubtotalFromOrder(order, userId!);
      const vendorGroup = order.vendorGroups?.find((g) => g.brandId === userId);

      // Use stored payout if available (new orders), otherwise calculate
      const payout = vendorGroup?.sellerPayoutAmount ?? sellerSubtotal;

      if (order.orderStatus === "delivered") {
        totalRevenue += payout;
        fulfilledOrders++;
      } else if (order.orderStatus !== "cancelled") {
        pendingPayouts += payout;
        pendingOrders++;
      }
    }

    return { totalRevenue, pendingPayouts, pendingOrders, fulfilledOrders };
  }, [orders, userId]);

  const hasOrders = orders.length > 0;
  const revenueNote = hasOrders ? `Across ${orders.length} orders` : "Start with 3–5 essentials";
  const payoutNote = hasOrders ? `${metrics.pendingOrders} pending` : "Awaiting first order";

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">Welcome</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Hi {displayName}</h2>
          <p className="text-sm text-slate-500 mt-1">Here is your live seller workspace.</p>
        </div>
        <Link
          href="/seller-dashboard/products"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
        >
          + Add Product
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Overview</p>
              <h3 className="text-lg font-bold text-slate-900 mt-2">Seller Status</h3>
            </div>
            <StatusPill tone="success" label="Approved Seller" />
          </div>
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <InfoTile label="Shiprocket" value="Not Connected" tone="warning" />
            <InfoTile label="Storefront" value="Draft" tone="neutral" />
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-orange-200 bg-orange-50/60 p-4">
            <p className="text-sm font-semibold text-slate-800">Next step: publish your product catalog</p>
            <p className="text-xs text-slate-500 mt-1">Add SKUs, pricing, and inventory when you are ready to sell.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Payouts</p>
          <h3 className="text-lg font-bold text-slate-900 mt-2">Revenue Snapshot</h3>
          <div className="mt-6 grid gap-4">
            <MetricCard
              label="Total Revenue"
              value={loading ? "Loading..." : `₹${metrics.totalRevenue.toLocaleString("en-IN")}`}
              note={revenueNote}
            />
            <MetricCard
              label="Pending Payouts"
              value={loading ? "..." : `₹${metrics.pendingPayouts.toLocaleString("en-IN")}`}
              note={payoutNote}
            />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Total Products"
          value={productsLoading ? "..." : String(productCount)}
          note={productCount === 0 ? "Start with 3–5 essentials" : "Live products"}
        />
        <MetricCard
          label="Pending Orders"
          value={String(metrics.pendingOrders)}
          note="Awaiting delivery"
        />
        <MetricCard
          label="Fulfilled Orders"
          value={String(metrics.fulfilledOrders)}
          note="Completed orders"
        />
      </div>

      {!hasOrders && !loading && (
        <DashboardCard title="Next Up" subtitle="Prepare your catalog">
          <EmptyState message="Use Products to start adding SKUs when you are ready to sell." />
        </DashboardCard>
      )}

      {hasOrders && (
        <DashboardCard title="Recent Orders" subtitle="Latest order activity">
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => {
              const sellerSubtotal = getSellerSubtotalFromOrder(order, userId!);
              const vendorGroup = order.vendorGroups?.find((g) => g.brandId === userId);
              const payout = vendorGroup?.sellerPayoutAmount ?? sellerSubtotal;
              return (
                <Link
                  key={order.orderId}
                  href="/seller-dashboard/orders"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">
                        #{order.orderId.slice(0, 4).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {order.items?.[0]?.productName || "Order"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-900">
                      ₹{payout.toLocaleString("en-IN")}
                    </p>
                    <p className={`text-[10px] font-medium ${
                      order.orderStatus === "delivered"
                        ? "text-emerald-600"
                        : order.orderStatus === "cancelled"
                        ? "text-red-400"
                        : "text-amber-500"
                    }`}>
                      {order.orderStatus}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
