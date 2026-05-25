"use client";

import Link from "next/link";

import {
  DashboardCard,
  EmptyState,
  InfoTile,
  MetricCard,
  StatusPill,
} from "./components/SellerDashboardCards";
import { useSellerDashboard } from "./components/SellerDashboardContext";

export default function SellerDashboardPage() {
  const { displayName } = useSellerDashboard();

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
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Today</p>
          <h3 className="text-lg font-bold text-slate-900 mt-2">Revenue Snapshot</h3>
          <div className="mt-6 grid gap-4">
            <MetricCard label="Total Revenue" value="₹0" note="Connect payments to start" />
            <MetricCard label="Pending Payouts" value="₹0" note="Awaiting first order" />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Total Products" value="0" note="Start with 3–5 essentials" />
        <MetricCard label="Pending Orders" value="0" note="Orders will show here" />
        <MetricCard label="Fulfilled Orders" value="0" note="Auto-sync via Shiprocket" />
      </div>

      <DashboardCard title="Next Up" subtitle="Prepare your catalog">
        <EmptyState message="Use Products to start adding SKUs when you are ready to sell." />
      </DashboardCard>
    </div>
  );
}
