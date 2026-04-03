"use client";

import { useState, useMemo, useCallback } from "react";
import { User } from "firebase/auth";
import { useReports } from "../hooks/useReports";
import type { SosAlert } from "../hooks/useReports";

export default function ReportsContent({ user, isVolunteer }: { user: User; isVolunteer: boolean }) {
  const { reports, loading } = useReports(user, isVolunteer);
  const [reportTab, setReportTab] = useState<"All" | "Active" | "Resolved">("All");

  const filtered = useMemo(
    () =>
      reports.filter((r) => {
        if (reportTab === "Active") return r.status !== "resolved";
        if (reportTab === "Resolved") return r.status === "resolved";
        return true;
      }),
    [reports, reportTab]
  );

  const countFor = useCallback(
    (tab: "All" | "Active" | "Resolved") =>
      reports.filter((r) => {
        if (tab === "Active") return r.status !== "resolved";
        if (tab === "Resolved") return r.status === "resolved";
        return true;
      }).length,
    [reports]
  );

  return (
    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 min-h-[300px] md:min-h-[500px]">
      <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 md:mb-6">My SOS Reports</h3>

      <div className="flex gap-2 sm:gap-4 mb-6 border-b border-slate-200 pb-px overflow-x-auto hide-scrollbar">
        {(["All", "Active", "Resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setReportTab(tab)}
            className={`pb-3 px-2 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
              reportTab === tab
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab} ({countFor(tab)})
          </button>
        ))}
      </div>

      <div className="space-y-4 md:space-y-5">
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading your reports…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <div className="text-4xl mb-3">📄</div>
            <p className="font-semibold text-slate-700">No cases found</p>
            <p className="text-sm">Cases will appear here when reported</p>
          </div>
        ) : (
          filtered.map((item) => <ReportCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  resolved: "bg-green-100 text-green-700",
  responding: "bg-teal-100 text-teal-700",
  active: "bg-orange-100 text-orange-700",
};

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

function ReportCard({ item }: { item: SosAlert }) {
  const statusClass = STATUS_STYLES[item.status ?? "active"] ?? "bg-blue-100 text-blue-700";
  const urgencyClass = URGENCY_COLORS[item.urgency ?? "low"] ?? "bg-green-500";

  const formattedDate = useMemo(() => {
    if (!item.time?.toDate) return "Unknown time";
    const d = item.time.toDate();
    return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }, [item.time]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row">
      {/* Image container: full width on mobile, squared on desktop */}
      <div className="w-full h-40 md:w-32 md:h-32 flex-shrink-0 relative overflow-hidden rounded-t-2xl md:rounded-xl md:m-5">
        <img
          src={item.photoURL ?? "https://via.placeholder.com/400x300?text=No+Image"}
          alt="SOS Report"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 p-4 md:p-6 md:pl-0 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2 gap-3">
            <h3 className="font-bold text-slate-800 text-base md:text-xl leading-tight line-clamp-2 flex-1">
              {item.description ?? "Emergency Reported"}
            </h3>
            <div className={`px-2.5 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap ${statusClass}`}>
              {item.status ?? "active"}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className={`w-2 h-2 rounded-full ${urgencyClass}`} />
            <span className="text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-wide">
              {item.urgency ?? "medium"} priority
            </span>
          </div>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <p className="text-xs md:text-sm text-slate-600 flex items-start gap-2">
            <span className="text-slate-400 mt-0.5">📍</span>
            <span className="line-clamp-2">{item.address ?? "Location not specified"}</span>
          </p>
          <p className="text-xs md:text-sm text-slate-500 flex items-center gap-2">
            <span className="text-slate-400">🕒</span>
            {formattedDate}
          </p>
        </div>
      </div>
    </div>
  );
}