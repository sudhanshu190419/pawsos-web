"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

interface VetDashboardContextValue {
  displayName: string;
}

const VetDashboardContext = createContext<VetDashboardContextValue | null>(null);

export function VetDashboardProvider({
  value,
  children,
}: {
  value: VetDashboardContextValue;
  children: ReactNode;
}) {
  return <VetDashboardContext.Provider value={value}>{children}</VetDashboardContext.Provider>;
}

export function useVetDashboard() {
  const ctx = useContext(VetDashboardContext);
  if (!ctx) {
    throw new Error("useVetDashboard must be used within VetDashboardProvider");
  }
  return ctx;
}
