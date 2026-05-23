"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "../lib/firebase";
import { fetchVetVerificationStatus } from "../lib/vet";
import VetSidebar from "./components/VetSidebar";
import VetMobileNav from "./components/VetMobileNav";
import { VetDashboardProvider } from "./components/VetDashboardContext";

export default function VetDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (cancelled) return;
      setUser(currentUser);

      if (!currentUser) {
        router.replace("/vets");
        setIsChecking(false);
        return;
      }

      try {
        const status = await fetchVetVerificationStatus(currentUser.uid);
        if (cancelled) return;
        if (status !== "approved") {
          router.replace("/vets");
          setIsChecking(false);
          return;
        }
        setIsApproved(true);
      } catch (err) {
        console.error("Vet dashboard access check failed:", err);
        router.replace("/vets");
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [router]);

  const displayName = useMemo(() => user?.displayName ?? "Vet Partner", [user?.displayName]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <span className="w-4 h-4 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm font-semibold">Preparing your dashboard…</span>
        </div>
      </div>
    );
  }

  if (!isApproved) return null;

  return (
    <VetDashboardProvider value={{ displayName }}>
      <main className="min-h-screen bg-[#FAFAF8] text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-[240px_1fr] gap-6">
            <aside className="hidden lg:flex">
              <VetSidebar />
            </aside>
            <section className="space-y-6">
              <div className="lg:hidden">
                <VetMobileNav />
              </div>
              {children}
            </section>
          </div>
        </div>
      </main>
    </VetDashboardProvider>
  );
}
