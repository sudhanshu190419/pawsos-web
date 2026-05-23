export interface VetNavItem {
  label: string;
  href: string;
  icon: string;
}

export const VET_DASHBOARD_NAV: VetNavItem[] = [
  { label: "Overview", href: "/vet-dashboard", icon: "📊" },
  { label: "Products", href: "/vet-dashboard/products", icon: "📦" },
  { label: "Orders", href: "/vet-dashboard/orders", icon: "🧾" },
  { label: "Analytics", href: "/vet-dashboard/analytics", icon: "📈" },
  { label: "Settings", href: "/vet-dashboard/settings", icon: "⚙️" },
];
