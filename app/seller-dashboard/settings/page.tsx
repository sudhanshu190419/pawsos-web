import { DashboardCard, EmptyState, InfoTile } from "../components/SellerDashboardCards";

export default function SellerSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Settings</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Seller Preferences</h2>
        <p className="text-sm text-slate-500 mt-1">Update your storefront, payouts, and logistics.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <InfoTile label="Storefront" value="Draft" tone="neutral" />
        <InfoTile label="Shiprocket" value="Not Connected" tone="warning" />
      </div>

      <DashboardCard title="Configuration" subtitle="Controls are coming soon">
        <EmptyState message="Seller settings will appear here once storefront setup is ready." />
      </DashboardCard>
    </div>
  );
}
