import { DashboardCard, EmptyState, MetricCard } from "../components/VetDashboardCards";

export default function VetOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Orders</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Order Management</h2>
        <p className="text-sm text-slate-500 mt-1">Track fulfillment, returns, and delivery timelines.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Pending" value="0" note="Awaiting confirmation" />
        <MetricCard label="In Transit" value="0" note="Shiprocket sync ready" />
        <MetricCard label="Delivered" value="0" note="Customer satisfaction" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <DashboardCard title="Live Orders" subtitle="Newest orders appear here">
          <EmptyState message="No orders yet. Once your catalog is live, orders will appear here." />
        </DashboardCard>
        <DashboardCard title="Returns" subtitle="Manage disputes with transparency">
          <EmptyState message="Returns and replacements will appear here." />
        </DashboardCard>
      </div>
    </div>
  );
}
