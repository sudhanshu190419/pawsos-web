import { DashboardCard, EmptyState, MetricCard } from "../components/SellerDashboardCards";

export default function SellerAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Analytics</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Marketplace Insights</h2>
        <p className="text-sm text-slate-500 mt-1">Monitor traffic, conversion, and repeat buyers.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Views" value="0" note="Traffic insights will appear here" />
        <MetricCard label="Conversion" value="0%" note="Orders divided by visits" />
        <MetricCard label="Repeat Buyers" value="0" note="Buyer loyalty metrics" />
      </div>

      <DashboardCard title="Coming Soon" subtitle="Charts and cohort reports">
        <EmptyState message="Analytics dashboards are being prepared for the next release." />
      </DashboardCard>
    </div>
  );
}
