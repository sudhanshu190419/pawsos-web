import type { ReactNode } from "react";

interface StatusPillProps {
  label: string;
  tone: "success" | "warning" | "neutral";
}

export function StatusPill({ label, tone }: StatusPillProps) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  }[tone];

  return (
    <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}

interface InfoTileProps {
  label: string;
  value: string;
  tone: "success" | "warning" | "neutral";
}

export function InfoTile({ label, value, tone }: InfoTileProps) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 ${styles}`}>
      <p className="text-xs font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold mt-1">{value}</p>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  note: string;
}

export function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-2">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{note}</p>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function DashboardCard({ title, subtitle, children }: DashboardCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-lg font-bold text-slate-900 mt-2">{subtitle}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}
