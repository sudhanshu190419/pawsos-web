"use client";

import { useEffect, useState } from "react";
import { Toast, ToastState, ToastTone } from "./Toast";

export function GlobalToastHost() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast({ message: e.detail.message, tone: e.detail.tone });
    };

    window.addEventListener("show-global-toast", handleToast);
    return () => window.removeEventListener("show-global-toast", handleToast);
  }, []);

  return <Toast toast={toast} onDismiss={() => setToast(null)} />;
}

export function showGlobalToast(message: string, tone: ToastTone = "info") {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("show-global-toast", { detail: { message, tone } });
    window.dispatchEvent(event);
  }
}
