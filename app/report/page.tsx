"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  GeoPoint,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../lib/firebase";

type AlertStatus = "active" | "responding" | "resolved";
type FilterValue = "All" | "Critical" | "High" | "Medium" | "Low";
type Role = "user" | "volunteer" | "ngo" | "vet" | "admin" | null;

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
};

type UserMeta = {
  role: Role;
  volunteerApproved: boolean;
  ngoApproved: boolean;
  name: string;
};

const MAX_DISTANCE_KM = 10;

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function urgencyColor(urgency?: string) {
  switch ((urgency || "").toLowerCase()) {
    case "critical":
      return "bg-red-600";
    case "high":
      return "bg-amber-500";
    case "medium":
      return "bg-yellow-400";
    case "low":
      return "bg-emerald-500";
    default:
      return "bg-slate-400";
  }
}

function statusBadgeClass(status?: AlertStatus) {
  if (status === "responding") return "bg-cyan-100 text-cyan-700";
  if (status === "resolved") return "bg-emerald-100 text-emerald-700";
  return "bg-orange-100 text-orange-700";
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

export default function ReportPage() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<FilterValue>("All");
  const [selectedAlert, setSelectedAlert] = useState<SosAlert | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta>({
    role: null,
    volunteerApproved: false,
    ngoApproved: false,
    name: "",
  });

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isResponder =
    (userMeta.role === "volunteer" && userMeta.volunteerApproved) || userMeta.ngoApproved;

  const hydrateUserMeta = useCallback(async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return;
      const data = userDoc.data();
      setUserMeta({
        role: (data.role as Role) || null,
        volunteerApproved: data.volunteerApproved === true,
        ngoApproved: data.ngoApproved === true,
        name: data.name || "",
      });
    } catch {
      setUserMeta((prev) => ({ ...prev }));
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await hydrateUserMeta(user);
      } else {
        setUserMeta({ role: null, volunteerApproved: false, ngoApproved: false, name: "" });
      }
    });
    return () => unsub();
  }, [hydrateUserMeta]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setCurrentLocation(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  const subscribeToAlerts = useCallback(() => {
    return onSnapshot(
      query(collection(db, "sos_alerts"), orderBy("time", "desc")),
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => {
            const raw = item.data() as Omit<SosAlert, "id">;
            let latitude: number | null = null;
            let longitude: number | null = null;

            if (raw.location instanceof GeoPoint) {
              latitude = raw.location.latitude;
              longitude = raw.location.longitude;
            } else if (raw.location && typeof raw.location === "object") {
              latitude = typeof raw.location.latitude === "number" ? raw.location.latitude : null;
              longitude = typeof raw.location.longitude === "number" ? raw.location.longitude : null;
            }

            return {
              id: item.id,
              ...raw,
              latitude,
              longitude,
            } as SosAlert;
          })
          .filter((row) => row.time || row.location || row.latitude || row.longitude);

        setAlerts(data);
        setLoading(false);
        setRefreshing(false);
      },
      () => {
        setLoading(false);
        setRefreshing(false);
      }
    );
  }, []);

  useEffect(() => {
    const unsub = subscribeToAlerts();
    return () => unsub();
  }, [subscribeToAlerts]);

  const roleFilteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const hasUserLocation =
        !!currentLocation &&
        typeof currentLocation.latitude === "number" &&
        typeof currentLocation.longitude === "number";
      const hasAlertLocation =
        typeof alert.latitude === "number" &&
        typeof alert.longitude === "number";

      if (isResponder) {
        if (alert.acceptedBy === currentUser?.uid) return true;

        if (alert.status === "active") {
          if (!hasUserLocation || !hasAlertLocation) return false;
          const distance = getDistanceKm(
            currentLocation.latitude,
            currentLocation.longitude,
            alert.latitude,
            alert.longitude
          );
          return distance <= MAX_DISTANCE_KM;
        }
        return false;
      }

      if (alert.createdBy === currentUser?.uid) return true;

      if (alert.status === "active") {
        if (!hasUserLocation || !hasAlertLocation) return false;
        const distance = getDistanceKm(
          currentLocation.latitude,
          currentLocation.longitude,
          alert.latitude,
          alert.longitude
        );
        return distance <= MAX_DISTANCE_KM;
      }

      return false;
    });
  }, [alerts, currentLocation, currentUser?.uid, isResponder]);

  const filteredAlerts = useMemo(() => {
    if (selectedFilter === "All") return roleFilteredAlerts;
    return roleFilteredAlerts.filter(
      (alert) => (alert.urgency || "").toLowerCase() === selectedFilter.toLowerCase()
    );
  }, [roleFilteredAlerts, selectedFilter]);

  const counts = useMemo(() => {
    return {
      critical: roleFilteredAlerts.filter((a) => (a.urgency || "").toLowerCase() === "critical").length,
      active: roleFilteredAlerts.filter((a) => a.status === "active").length,
      responding: roleFilteredAlerts.filter((a) => a.status === "responding").length,
    };
  }, [roleFilteredAlerts]);

  const openDirections = useCallback((latitude?: number | null, longitude?: number | null) => {
    if (typeof latitude !== "number" || typeof longitude !== "number") return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const markAsResponding = useCallback(
    async (alertId: string) => {
      if (!currentUser?.uid) return;
      setActionBusy(true);
      try {
        const profileDoc = await getDoc(doc(db, "users", currentUser.uid));
        const volunteerName =
          profileDoc.exists() && profileDoc.data().name ? profileDoc.data().name : userMeta.name || "Volunteer";

        await updateDoc(doc(db, "sos_alerts", alertId), {
          status: "responding",
          acceptedBy: currentUser.uid,
          acceptedByName: volunteerName,
          acceptedAt: serverTimestamp(),
        });
      } finally {
        setActionBusy(false);
      }
    },
    [currentUser?.uid, userMeta.name]
  );

  const startResolveFlow = useCallback(() => {
    if (!selectedAlert || actionBusy) return;
    fileInputRef.current?.click();
  }, [selectedAlert, actionBusy]);

  const handleAfterImagePicked = useCallback(
    async (file: File | null) => {
      if (!file || !selectedAlert || !currentUser) return;

      const authorizedResponder =
        (userMeta.role === "volunteer" && userMeta.volunteerApproved) || userMeta.ngoApproved;

      if (!authorizedResponder || selectedAlert.acceptedBy !== currentUser.uid) {
        return;
      }

      setActionBusy(true);
      try {
        const storageRef = ref(storage, `after_images/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" });
        const afterImageURL = await getDownloadURL(storageRef);

        await updateDoc(doc(db, "sos_alerts", selectedAlert.id), {
          status: "resolved",
          afterImageURL,
          resolvedBy: currentUser.uid,
          resolvedByName: selectedAlert.acceptedByName || userMeta.name || "Volunteer",
          resolvedAt: serverTimestamp(),
        });
      } finally {
        setActionBusy(false);
      }
    },
    [selectedAlert, currentUser, userMeta]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const unsub = subscribeToAlerts();
    setTimeout(() => {
      unsub();
      setRefreshing(false);
    }, 900);
  }, [subscribeToAlerts]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <div className="rounded-3xl border border-orange-100 bg-white shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Active Alerts</h1>
              <p className="text-sm text-slate-500 mt-1">Real-time emergency alerts in your area</p>
              {!currentLocation && (
                <p className="text-xs text-amber-600 mt-1">
                  Turn on location access to view nearby SOS alerts.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="px-4 py-2 rounded-xl border border-orange-200 text-orange-600 font-semibold text-sm hover:bg-orange-50 transition-colors"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <CountCard label="Critical" value={counts.critical} icon="⚡" tone="text-red-600" />
            <CountCard label="Active" value={counts.active} icon="🚨" tone="text-amber-600" />
            <CountCard label="Accepted" value={counts.responding} icon="🦸" tone="text-cyan-600" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {["All", "Critical", "High", "Medium", "Low"].map((label) => {
              const selected = selectedFilter === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedFilter(label as FilterValue)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    selected
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-orange-50 hover:border-orange-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading active alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-slate-700">No alerts found</p>
            <p className="text-sm text-slate-500 mt-1">Try changing the urgency filter.</p>
          </div>
        ) : (
          <div className="mt-6 max-w-2xl mx-auto space-y-3">
            {filteredAlerts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedAlert(item)}
                className="w-full text-left rounded-2xl border border-slate-200 bg-white p-3 hover:shadow-sm hover:border-orange-200 transition-all"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="inline-flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${urgencyColor(item.urgency)}`} />
                    <span className="text-xs font-bold text-slate-600 uppercase">{(item.urgency || "medium").toUpperCase()}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${statusBadgeClass(item.status)}`}>
                    {item.status || "active"}
                  </span>
                </div>

                <div className="flex gap-3">
                  <img
                    src={item.photoURL || "/sos-dog.png"}
                    alt="SOS"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[15px] text-slate-900 line-clamp-2">{item.description || "Emergency alert"}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.address || "Location not specified"}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5">{getReadableTime(item.time)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedAlert && (
        <div className="fixed inset-0 z-[200000] bg-black/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-[92%] sm:w-full max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-2xl mb-2 sm:mb-0">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${urgencyColor(selectedAlert.urgency)}`} />
                <span className="text-xs font-black text-slate-600 uppercase">
                  {(selectedAlert.urgency || "medium").toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-5">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <img
                    src={selectedAlert.photoURL || "/sos-dog.png"}
                    alt="Before rescue"
                    className="w-full h-28 sm:h-44 rounded-xl sm:rounded-2xl object-cover border border-slate-200"
                  />
                  <p className="text-xs font-semibold text-slate-500 mt-1.5">Before Rescue</p>
                </div>
                <div>
                  {selectedAlert.afterImageURL ? (
                    <>
                      <img
                        src={selectedAlert.afterImageURL}
                        alt="After rescue"
                        className="w-full h-28 sm:h-44 rounded-xl sm:rounded-2xl object-cover border border-slate-200"
                      />
                      <p className="text-xs font-semibold text-slate-500 mt-1.5">After Rescue</p>
                    </>
                  ) : (
                    <div className="w-full h-28 sm:h-44 rounded-xl sm:rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-center px-4">
                      <p className="text-xs text-slate-400">After image will appear once case is resolved</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-base sm:text-xl font-bold sm:font-extrabold text-slate-900 leading-snug">{selectedAlert.description || "Emergency Alert"}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Alert Level: {(selectedAlert.urgency || "medium").charAt(0).toUpperCase() + (selectedAlert.urgency || "medium").slice(1)}
                </p>
                <p className="mt-2 text-xs sm:text-sm text-slate-600">📍 {selectedAlert.address || "Location not specified"}</p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">🕒 Reported {getReadableTime(selectedAlert.time)}</p>

                <p className="mt-2 text-xs sm:text-sm text-slate-500">
                  {selectedAlert.status === "resolved"
                    ? `Case resolved by ${selectedAlert.resolvedByName || "Volunteer"}`
                    : selectedAlert.acceptedBy
                    ? `Case accepted by ${selectedAlert.acceptedByName || "Volunteer"}`
                    : `Reported by ${selectedAlert.reportedByName || "Community User"}`}
                </p>
              </div>

              <div className="space-y-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => openDirections(selectedAlert.latitude, selectedAlert.longitude)}
                  className="w-full border border-orange-300 bg-white text-orange-700 rounded-xl py-2.5 font-semibold text-sm hover:bg-orange-50 transition-colors"
                >
                  Get Directions
                </button>

                {selectedAlert.status === "active" && !isResponder && (
                  <Link
                    href="/volunteer-form"
                    className="block w-full text-center rounded-xl py-2.5 font-semibold text-sm bg-[#00BFA5] text-white hover:bg-[#00a896] transition-colors"
                  >
                    Become a volunteer to accept this case
                  </Link>
                )}

                {selectedAlert.status === "active" && isResponder && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => markAsResponding(selectedAlert.id)}
                    className="w-full rounded-xl py-2.5 font-semibold text-sm bg-[#00BFA5] text-white hover:bg-[#00a896] transition-colors disabled:opacity-60"
                  >
                    {actionBusy ? "Please wait..." : "Accept This Case"}
                  </button>
                )}

                {selectedAlert.status === "responding" &&
                  isResponder &&
                  selectedAlert.acceptedBy === currentUser?.uid && (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={startResolveFlow}
                      className="w-full rounded-xl py-2.5 font-semibold text-sm bg-[#00BFA5] text-white hover:bg-[#00a896] transition-colors disabled:opacity-60"
                    >
                      {actionBusy ? "Uploading..." : "Mark as Resolved"}
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          void handleAfterImagePicked(file);
          e.currentTarget.value = "";
        }}
      />
    </main>
  );
}

function CountCard({ label, value, icon, tone }: { label: string; value: number; icon: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-center">
      <p className="text-lg">{icon}</p>
      <p className={`text-xl font-black ${tone}`}>{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}
