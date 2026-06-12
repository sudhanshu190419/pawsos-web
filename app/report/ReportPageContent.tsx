"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  collection,
  GeoPoint,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useLocation } from "../lib/LocationContext";
import {
  Dog,
  AlertTriangle,
  Stethoscope,
  Info,
  CheckCircle,
  Zap,
  RefreshCw,
  WifiOff,
  MapPinOff,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LiveMap = dynamic(() => import("../components/LiveMap"), { ssr: false });

type AlertStatus = "active" | "responding" | "resolved";
type FilterValue = "All" | "Critical" | "High Priority" | "Medical";

type SosAlert = {
  id: string;
  description?: string;
  address?: string;
  urgency?: string;
  status?: AlertStatus;
  createdBy?: string;
  reportedByName?: string;
  acceptedBy?: string;
  acceptedByName?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  photoURL?: string;
  afterImageURL?: string;
  time?: Timestamp | Date | string;
  location?: GeoPoint | { latitude?: number; longitude?: number };
  latitude?: number | null;
  longitude?: number | null;
  distance?: number;
};

const DISTANCE_OPTIONS = [5, 10, 20, 50, 100];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getReadableTime(time?: Timestamp | Date | string) {
  if (!time) return "Just now";
  let date: Date;
  if (typeof (time as Timestamp).toDate === "function") {
    date = (time as Timestamp).toDate();
  } else {
    date = new Date(time as Date | string);
  }
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getUrgencyProps(urgency?: string) {
  const u = (urgency || "").toLowerCase();
  if (u === "critical") return { color: "error", icon: <AlertTriangle className="w-4 h-4" /> };
  if (u === "high") return { color: "primary", icon: <Stethoscope className="w-4 h-4" /> };
  return { color: "secondary", icon: <Info className="w-4 h-4" /> };
}

export default function ReportPageContent() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState(5);
  const [showRadiusControl, setShowRadiusControl] = useState(false);

  const { location: currentLocation, requestLocation, isLoading: locationLoading } = useLocation();

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  const handleRetryLocation = useCallback(async () => {
    await requestLocation({ showToast: true });
  }, [requestLocation]);

  // ── Subscribe to ALL sos_alerts (no auth required after rule change) ──
  useEffect(() => {
    setFetchError(null);
    const unsub = onSnapshot(
      query(collection(db, "sos_alerts"), orderBy("time", "desc")),
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => {
            const raw = item.data() as Omit<SosAlert, "id">;
            let latitude: number | null = typeof raw.latitude === "number" ? raw.latitude : null;
            let longitude: number | null = typeof raw.longitude === "number" ? raw.longitude : null;

            if (raw.location instanceof GeoPoint) {
              latitude = raw.location.latitude;
              longitude = raw.location.longitude;
            } else if (raw.location && typeof raw.location === "object") {
              latitude = typeof raw.location.latitude === "number" ? raw.location.latitude : latitude;
              longitude = typeof raw.location.longitude === "number" ? raw.location.longitude : longitude;
            }

            return { id: item.id, ...raw, latitude, longitude } as SosAlert;
          })
          .filter((row) => row.time || row.location || row.latitude || row.longitude);

        setAlerts(data);
        setLoading(false);
        setFetchError(null);
      },
      (error) => {
        console.error("Failed to load SOS alerts:", error);
        setFetchError("Failed to load live alerts. Please check your connection and try again.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Compute distances & filter to active + responding, sorted by distance ──
  const processedAlerts = useMemo(() => {
    return alerts
      .map((alert) => {
        let distance: number | undefined = undefined;
        const hasUserLocation = !!currentLocation;
        const hasAlertLocation = typeof alert.latitude === "number" && typeof alert.longitude === "number";

        if (hasUserLocation && hasAlertLocation) {
          distance = getDistanceKm(currentLocation.latitude, currentLocation.longitude, alert.latitude!, alert.longitude!);
        }
        return { ...alert, distance };
      })
      .filter((alert) => {
        const status = alert.status || "active";
        // Show active + responding alerts to everyone
        if (status !== "active" && status !== "responding") return false;

        // If we have both locations, apply distance filter
        if (alert.distance !== undefined) {
          return alert.distance <= maxDistanceKm;
        }
        // If location unknown, still show it
        return true;
      })
      .sort((a, b) => {
        // Sort by distance first (closest first), then by time
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;

        const timeA = a.time ? (typeof (a.time as Timestamp).toDate === "function" ? (a.time as Timestamp).toDate().getTime() : new Date(a.time as Date | string).getTime()) : 0;
        const timeB = b.time ? (typeof (b.time as Timestamp).toDate === "function" ? (b.time as Timestamp).toDate().getTime() : new Date(b.time as Date | string).getTime()) : 0;
        return timeB - timeA;
      });
  }, [alerts, currentLocation, maxDistanceKm]);

  // ── Urgency filter ──
  const filteredAlerts = useMemo(() => {
    if (activeFilter === "All") return processedAlerts;
    if (activeFilter === "Critical") return processedAlerts.filter((a) => (a.urgency || "").toLowerCase() === "critical");
    if (activeFilter === "High Priority") return processedAlerts.filter((a) => (a.urgency || "").toLowerCase() === "high");
    if (activeFilter === "Medical") return processedAlerts.filter((a) => ["critical", "high"].includes((a.urgency || "").toLowerCase()));
    return processedAlerts;
  }, [processedAlerts, activeFilter]);

  const paginatedAlerts = useMemo(() => {
    return filteredAlerts.slice(0, visibleCount);
  }, [filteredAlerts, visibleCount]);

  const stats = useMemo(() => {
    return {
      critical: alerts.filter(a => (a.urgency || "").toLowerCase() === "critical").length,
      active: alerts.filter(a => (a.status || "active") === "active").length,
      responding: alerts.filter(a => a.status === "responding").length,
    };
  }, [alerts]);

  const getAlertDistance = (alert: SosAlert) => {
    if (alert.distance !== undefined) {
      return `${alert.distance.toFixed(1)} km away`;
    }
    return "Distance unknown";
  };

  return (
    <div className="bg-slate-50/50 text-slate-900 font-sans antialiased h-[100dvh] flex flex-col overflow-hidden">
      <GlobalStyles />

      {/* Modern Header Bar */}
      <header className="sticky top-0 z-[60] bg-white border-b border-slate-200/60 shadow-sm px-4 sm:px-6 h-[64px] sm:h-[72px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-none tracking-tight">Active SOS</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Real-time priority dispatch
            </p>
          </div>
        </div>

        {/* Action Controls & Stats */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-red-50 border border-red-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">{stats.critical} Critical</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">{stats.active} Active</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{stats.responding} Responding</span>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </header>
      
      {/* Centered Content Layout */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 flex-1 min-h-0 flex flex-col gap-5 py-6">
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 lg:max-h-[78vh]">
          
          {/* Map — Left Column */}
          <section className="lg:col-span-7 h-[20vh] lg:h-full relative rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
            <LiveMap 
              alerts={processedAlerts} 
              activeCase={activeCase} 
              setActiveCase={setActiveCase} 
              isExpanded={isMapExpanded}
              setIsExpanded={setIsMapExpanded}
              currentLocation={currentLocation}
            />
            {!currentLocation && !locationLoading && (
              <div className="absolute top-4 left-4 right-4 z-[100] p-3 bg-red-600/90 backdrop-blur-md rounded-xl text-white text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-fade-in">
                <div className="flex items-center gap-2">
                  <MapPinOff className="w-4 h-4 shrink-0" />
                  <span>Enable location for nearby alerts</span>
                </div>
                <button 
                  onClick={handleRetryLocation}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors whitespace-nowrap"
                >
                  Enable
                </button>
              </div>
            )}
          </section>

          {/* Alert List — Right Column */}
          <section className="lg:col-span-5 flex flex-col min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden max-h-[calc(100vh-180px)] lg:max-h-none">
            <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">Nearby Alerts</h2>
                <div className="flex items-center gap-2">
                  {/* Distance Radius Control */}
                  <button
                    onClick={() => setShowRadiusControl(!showRadiusControl)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      showRadiusControl 
                        ? "bg-primary text-white shadow-sm" 
                        : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    {maxDistanceKm} km
                  </button>
                  <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-black text-slate-400 uppercase">
                    {filteredAlerts.length} Total
                  </span>
                </div>
              </div>

              {/* Radius slider - expandable */}
              <AnimatePresence>
                {showRadiusControl && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Radius</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        {DISTANCE_OPTIONS.map((km) => (
                          <button
                            key={km}
                            onClick={() => { setMaxDistanceKm(km); setVisibleCount(10); }}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              maxDistanceKm === km
                                ? "bg-primary text-white shadow-sm"
                                : "bg-white text-slate-500 border border-slate-200 hover:border-primary/30"
                            }`}
                          >
                            {km} km
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {["All", "Critical", "High Priority", "Medical"].map((filter) => (
                  <button 
                    key={filter}
                    onClick={() => {
                      setActiveFilter(filter as FilterValue);
                      setVisibleCount(10);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                      activeFilter === filter 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 bg-slate-50/30">
              {/* ── Error State ── */}
              {fetchError ? (
                <div className="py-16 text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                    <WifiOff className="w-10 h-10 text-red-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Failed to load alerts</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">{fetchError}</p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                  >
                    Retry
                  </button>
                </div>

              /* ── Location Not Found State ── */
              ) : !currentLocation && !locationLoading && !loading && alerts.length > 0 && filteredAlerts.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100">
                    <MapPinOff className="w-10 h-10 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Location not available</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">
                      Enable location access to see nearby alerts, or increase the search radius.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRetryLocation}
                      className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    >
                      Enable Location
                    </button>
                    <button
                      onClick={() => { setMaxDistanceKm(100); setShowRadiusControl(true); }}
                      className="px-5 py-2.5 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Show All
                    </button>
                  </div>
                </div>

              /* ── Loading State ── */
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                  <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing live data...</p>
                </div>

              /* ── Empty State ── */
              ) : filteredAlerts.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <Dog className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No alerts found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                    No active alerts within {maxDistanceKm} km. Try increasing the search radius.
                  </p>
                  <button
                    onClick={() => { setMaxDistanceKm(100); setShowRadiusControl(true); }}
                    className="mt-4 px-5 py-2.5 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Expand to 100 km
                  </button>
                </div>

              /* ── Alert Cards ── */
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginatedAlerts.map((alert, idx) => {
                    const { color, icon } = getUrgencyProps(alert.urgency);
                    const isActive = activeCase === alert.id;
                    const distanceStr = getAlertDistance(alert);
                    const isRespondingAlert = alert.status === "responding";
                    
                    return (
                      <motion.article 
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        onClick={() => setActiveCase(isActive ? null : alert.id)}
                        className={`group relative bg-white rounded-2xl border transition-all duration-300 cursor-pointer p-4 ${
                          isActive 
                            ? "border-primary/30 shadow-xl shadow-primary/5 bg-primary/[0.01]" 
                            : "border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/30"
                        }`}
                      >
                        <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-colors ${
                          isRespondingAlert ? "bg-blue-500" : color === "error" ? "bg-red-500" : color === "primary" ? "bg-orange-500" : "bg-slate-400"
                        }`} />

                        <div className="flex gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={alert.photoURL || "/sos-dog.png"} alt="SOS" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                              isRespondingAlert ? "bg-blue-500" : color === "error" ? "bg-red-500" : color === "primary" ? "bg-orange-500" : "bg-slate-400"
                            }`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${
                                isRespondingAlert ? "text-blue-600" : color === "error" ? "text-red-600" : "text-orange-600"
                              }`}>
                                {isRespondingAlert ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : icon} {isRespondingAlert ? "RESPONDING" : alert.urgency || "NORMAL"}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getReadableTime(alert.time)}</span>
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 mb-1 tracking-tight group-hover:text-primary transition-colors">
                              {alert.description || "Emergency Alert"}
                            </h3>
                            
                            <div className="flex items-center gap-1.5 text-slate-400 mb-3">
                              <MapPinIcon className="w-3 h-3" />
                              <p className="text-[11px] font-medium truncate">{alert.address || "Unknown Location"}</p>
                              <span className="text-[10px] font-bold text-slate-300 ml-auto whitespace-nowrap">{distanceStr}</span>
                            </div>

                            {/* Expanded content when clicked */}
                            <AnimatePresence>
                              {isActive && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  {/* All users → Accept goes to download page */}
                                  {(alert.status === "active") && (
                                    <Link 
                                      href="/download"
                                      className="w-full block text-center py-3 mt-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.97]"
                                    >
                                      Accept via App
                                    </Link>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Status badges */}
                            {isRespondingAlert && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                RESPONDING: {alert.acceptedByName || "Volunteer"}
                              </div>
                            )}
                            {alert.status === "resolved" && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                <CheckCircle className="w-3 h-3" />
                                RESOLVED: {alert.resolvedByName || "Hero"}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}

                  {filteredAlerts.length > visibleCount && (
                    <div className="py-4 flex justify-center">
                      <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                      >
                        Load More Alerts
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ─── Local Components & Icons ────────────────────────────────────────────────
function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

const GlobalStyles = () => (
  <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
  `}</style>
);
