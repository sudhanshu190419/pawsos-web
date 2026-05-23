"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { VET_DASHBOARD_NAV } from "./vetNavItems";

export default function VetMobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {VET_DASHBOARD_NAV.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/vet-dashboard" && pathname.startsWith(item.href));
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
