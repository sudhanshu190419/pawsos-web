"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SELLER_DASHBOARD_NAV } from "./sellerNavItems";

export default function SellerMobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {SELLER_DASHBOARD_NAV.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/seller-dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`shrink-0 px-4 py-2 rounded-full border text-xs font-semibold transition-colors ${
              isActive
                ? "border-orange-200 bg-orange-50 text-orange-700"
                : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
