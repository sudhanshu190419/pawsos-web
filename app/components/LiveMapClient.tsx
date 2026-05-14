"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2, MapPin } from "lucide-react";

// Fix for default Leaflet icon paths in Next.js
const defaultIconPrototype = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown };
delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createCustomIcon = (urgency?: string) => {
  let color = "#bc5639";
  if (urgency?.toLowerCase() === "critical") color = "#ba1a1a";
  if (urgency?.toLowerCase() === "low") color = "#446464";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="white" stroke-width="2">
      <path d="M12 21.5c-1.5 0-8-5.5-8-11.5a8 8 0 1 1 16 0c0 6-6.5 11.5-8 11.5z" />
      <circle cx="12" cy="10" r="3" fill="white" />
    </svg>
  `;

  return L.divIcon({
    className: "custom-leaflet-icon",
    html: svgIcon,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export type LiveMapProps = {
  alerts: MapAlert[];
  activeCase: string | null;
  setActiveCase: (id: string | null) => void;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  currentLocation: { latitude: number; longitude: number } | null;
  responders?: MapResponder[];
  hqLocation?: { latitude: number; longitude: number } | null;
};

type MapAlert = {
  id: string;
  description?: string;
  address?: string;
  urgency?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type MapResponder = {
  id: string;
  name: string;
  role?: string;
  status?: string;
  task?: string;
  latitude?: number | null;
  longitude?: number | null;
};

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const centerChanged =
      Math.abs(currentCenter.lat - center[0]) > 0.000001 ||
      Math.abs(currentCenter.lng - center[1]) > 0.000001;

    if (centerChanged || currentZoom !== zoom) {
      map.setView(center, zoom, { animate: false });
    }
  }, [center, zoom, map]);
  return null;
}

// Forces Leaflet to re-render tiles whenever the container resizes (e.g. fullscreen toggle)
function InvalidateOnExpand({ isExpanded }: { isExpanded: boolean }) {
  const map = useMap();
  useEffect(() => {
    // Small delay lets CSS transition finish before Leaflet measures the new size
    const t = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 350);
    return () => clearTimeout(t);
  }, [isExpanded, map]);
  return null;
}

export default function LiveMap({
  alerts,
  activeCase,
  setActiveCase,
  isExpanded,
  setIsExpanded,
  currentLocation,
  responders = [],
  hqLocation = null,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  // ESC key closes fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) setIsExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isExpanded, setIsExpanded]);

  // Wait for container to have real dimensions before mounting Leaflet
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Scrub stale Leaflet instance (Fast Refresh safety)
    const existing = el.querySelector(".leaflet-container") as HTMLElement & { _leaflet_id?: number };
    if (existing?._leaflet_id != null) {
      try {
        // Simple cleanup: just remove the element content and clear the ID
        existing.innerHTML = "";
      } catch {
        // Silently fail
      }
      delete existing._leaflet_id;
    }

    if (el.offsetWidth > 0 && el.offsetHeight >= 100) {
      const frame = requestAnimationFrame(() => setMapReady(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height >= 100) {
          setMapReady(true);
          observer.disconnect();
          break;
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { center, zoom } = useMemo(() => {
    if (activeCase) {
      const activeAlert = alerts.find((a) => a.id === activeCase);
      if (
        activeAlert &&
        typeof activeAlert.latitude === "number" && !isNaN(activeAlert.latitude) &&
        typeof activeAlert.longitude === "number" && !isNaN(activeAlert.longitude)
      ) {
        return { center: [activeAlert.latitude, activeAlert.longitude] as [number, number], zoom: 15 };
      }
    }

    if (
      currentLocation &&
      typeof currentLocation.latitude === "number" && !isNaN(currentLocation.latitude) &&
      typeof currentLocation.longitude === "number" && !isNaN(currentLocation.longitude)
    ) {
      return { center: [currentLocation.latitude, currentLocation.longitude] as [number, number], zoom: 13 };
    }

    return { center: [28.6139, 77.209] as [number, number], zoom: 11 };
  }, [activeCase, alerts, currentLocation]);

  return (
    <>
      {/* Backdrop overlay when fullscreen */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        ref={containerRef}
        className={`soft-shadow border border-white/50 bg-surface-container transition-all duration-500 ${
          isExpanded
            ? "fixed z-[9999] rounded-2xl overflow-hidden shadow-2xl"
            : "relative w-full min-h-[120px] h-full rounded-2xl overflow-hidden"
        }`}
        style={isExpanded ? { top: "76px", left: "8px", right: "8px", bottom: "8px" } : {}}
      >
        {/* Loading skeleton */}
        {!mapReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-100 animate-pulse rounded-2xl">
            <MapPin className="w-8 h-8 text-slate-300" />
            <span className="text-slate-400 text-sm font-medium">Loading map...</span>
          </div>
        )}

        {mapReady && (
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <ChangeView center={center} zoom={zoom} />
            <InvalidateOnExpand isExpanded={isExpanded} />

            {hqLocation && typeof hqLocation.latitude === "number" && typeof hqLocation.longitude === "number" && (
              <Marker
                position={[hqLocation.latitude, hqLocation.longitude]}
                icon={L.divIcon({
                  className: "",
                  html: `
                    <div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#111827" stroke="#ffffff" stroke-width="1.5">
                        <path d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3z" />
                        <path d="M9 10h6v6H9z" fill="#ffffff" stroke="none" />
                      </svg>
                    </div>
                  `,
                  iconSize: [30, 30],
                  iconAnchor: [15, 30],
                })}
              >
                <Popup>HQ Location</Popup>
              </Marker>
            )}

            {currentLocation && (
              <Marker
                position={[currentLocation.latitude, currentLocation.longitude]}
                icon={L.divIcon({
                  className: "bg-blue-500 w-4 h-4 rounded-full border-2 border-white shadow-md",
                  iconSize: [16, 16],
                })}
              >
                <Popup>You are here</Popup>
              </Marker>
            )}

            {alerts.map((alert) => {
              if (typeof alert.latitude !== "number" || typeof alert.longitude !== "number") return null;
              return (
                <Marker
                  key={alert.id}
                  position={[alert.latitude, alert.longitude]}
                  icon={createCustomIcon(alert.urgency)}
                  eventHandlers={{ click: () => setActiveCase(alert.id) }}
                >
                  <Popup className="custom-popup">
                    <div className="font-sans">
                      <p className="font-bold text-sm mb-1">{alert.description || "Emergency Alert"}</p>
                      <p className="text-xs text-slate-500">{alert.address}</p>
                      <div className="mt-2 text-xs font-bold uppercase tracking-wide text-primary">
                        {alert.urgency || "MEDIUM"}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {responders.map((responder) => {
              if (typeof responder.latitude !== "number" || typeof responder.longitude !== "number") return null;
              return (
                <Marker
                  key={responder.id}
                  position={[responder.latitude, responder.longitude]}
                  icon={L.divIcon({
                    className: "",
                    html: `
                      <div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#2563eb" stroke="#ffffff" stroke-width="1.5">
                          <path d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3z" />
                          <path d="M11 8h2v3h3v2h-3v3h-2v-3H8v-2h3V8z" fill="#ffffff" stroke="none" />
                        </svg>
                      </div>
                    `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                  })}
                >
                  <Popup className="custom-popup">
                    <div className="font-sans">
                      <p className="font-bold text-sm mb-1">{responder.name}</p>
                      <p className="text-xs text-slate-500">{responder.role || "Staff"}</p>
                      <div className="mt-2 text-xs font-bold uppercase tracking-wide text-primary">
                        {responder.status || "Available"}
                      </div>
                      {responder.task && (
                        <p className="text-[11px] text-slate-500 mt-1">{responder.task}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* "Live Tracker" badge overlay */}
        <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
          <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-bold text-on-surface">Live Tracker</span>
              <span className="text-[9px] text-on-surface-variant font-medium">Real-time alerts</span>
            </div>
          </div>
        </div>

        {/* Expand / Collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-3 right-3 z-[1000] p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 hover:bg-white transition-all duration-200 group"
          title={isExpanded ? "Minimize map" : "Expand map"}
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
          ) : (
            <Maximize2 className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
          )}
        </button>

        {/* ESC hint -- desktop only */}
        {isExpanded && (
          <div className="hidden sm:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl items-center gap-2">
            <span>Press ESC or tap outside to close</span>
          </div>
        )}
      </div>
    </>
  );
}
