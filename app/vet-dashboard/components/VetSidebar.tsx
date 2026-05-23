"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { VET_DASHBOARD_NAV } from "./vetNavItems";

export default function VetSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">Seller Hub</p>
        <h1 className="mt-2 text-lg font-extrabold text-slate-900">Vet Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Marketplace-grade controls for verified vets.</p>
      </div>
      <nav className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-1">
        {VET_DASHBOARD_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/vet-dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                isActive
                  ? "bg-orange-50 text-orange-700 border border-orange-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
        <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Shiprocket</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">Logistics connection</p>
        <p className="text-xs text-slate-500 mt-1">Connect when you are ready to fulfill orders.</p>
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-slate-950 text-white text-sm font-semibold py-2.5 hover:bg-orange-600 transition-colors"
        >
          Connect Shiprocket
        </button>
      </div>
    </div>
  );
}
