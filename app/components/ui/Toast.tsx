"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export type ToastState = {
  message: string;
  tone?: ToastTone;
};

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-stone-200 bg-stone-50 text-stone-900",
};

const toneIcons: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-700" />,
  error: <AlertTriangle className="h-4 w-4 text-red-700" />,
  info: <Info className="h-4 w-4 text-stone-600" />,
};

export function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  const tone = toast?.tone || "info";

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`fixed left-1/2 top-5 z-[200000] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_20px_70px_rgba(31,27,24,0.12)] ${toneClasses[tone]}`}>
      <span className="shrink-0">{toneIcons[tone]}</span>
      <span className="min-w-0 flex-1">{toast.message}</span>
      <button onClick={onDismiss} aria-label="Dismiss notification" className="rounded-lg p-1 text-current opacity-60 transition hover:bg-white/70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToast({ message, tone });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  return useMemo(() => ({ toast, showToast, dismissToast }), [toast, showToast, dismissToast]);
}
