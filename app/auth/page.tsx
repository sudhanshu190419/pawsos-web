import { Suspense } from "react";
import AuthClient from "./AuthClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-[3px] border-slate-100 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading…</p>
          </div>
        </div>
      }
    >
      <AuthClient />
    </Suspense>
  );
}