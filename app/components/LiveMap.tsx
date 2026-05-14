import dynamic from "next/dynamic";
import type { LiveMapProps } from "./LiveMapClient";

const LiveMap = dynamic<LiveMapProps>(() => import("./LiveMapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[160px] rounded-2xl bg-slate-100 animate-pulse" />
  ),
});

export default LiveMap;
