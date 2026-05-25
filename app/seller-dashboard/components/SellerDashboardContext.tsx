"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

interface SellerDashboardContextValue {
  displayName: string;
}

const SellerDashboardContext = createContext<SellerDashboardContextValue | null>(null);

export function SellerDashboardProvider({
  value,
  children,
}: {
  value: SellerDashboardContextValue;
  children: ReactNode;
}) {
  return <SellerDashboardContext.Provider value={value}>{children}</SellerDashboardContext.Provider>;
}

export function useSellerDashboard() {
  const ctx = useContext(SellerDashboardContext);
  if (!ctx) {
    throw new Error("useSellerDashboard must be used within SellerDashboardProvider");
  }
  return ctx;
}
