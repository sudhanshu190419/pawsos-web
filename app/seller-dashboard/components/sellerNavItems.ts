export interface SellerNavItem {
  label: string;
  href: string;
  icon: string;
}

export const SELLER_DASHBOARD_NAV: SellerNavItem[] = [
  { label: "Overview", href: "/seller-dashboard", icon: "📊" },
  { label: "Products", href: "/seller-dashboard/products", icon: "📦" },
  { label: "Orders", href: "/seller-dashboard/orders", icon: "🧾" },
  { label: "Analytics", href: "/seller-dashboard/analytics", icon: "📈" },
  { label: "Payouts", href: "/seller-dashboard/payouts", icon: "💰" },
  { label: "Settings", href: "/seller-dashboard/settings", icon: "⚙️" },
];
