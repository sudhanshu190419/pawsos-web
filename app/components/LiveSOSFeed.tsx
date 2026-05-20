"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase"; 
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteField,
  getDocs,
  where,
} from "firebase/firestore";

interface SOSAlert {
  id: string;
  address: string;
  createdBy: string;
  description: string;
  photoURL: string;
  reportedByName: string;
  status: string; // active, responding, resolved
  time: any; 
  title: string;
  type: string;
  urgency: string; // critical, high, normal
  latitude?: number | null;
  longitude?: number | null;
  assignedResponderId?: string;
  assignedResponderName?: string;
  assignedResponderRole?: string;
  assignedTask?: string;
}

type ResponderOption = {
  id: string;
  name: string;
  role?: string;
};

type LiveSOSFeedProps = {
  showDispatchControls?: boolean;
  responders?: ResponderOption[];
  isOwner?: boolean;
  centerLocation?: { latitude: number; longitude: number } | null;
  initialLimit?: number;
  pageSize?: number;
  showLoadMore?: boolean;
};

export default function LiveSOSFeed({
  showDispatchControls = false,
  responders = [],
  isOwner = false,
  centerLocation = null,
  initialLimit = 10,
  pageSize = 10,
  showLoadMore = true,
}: LiveSOSFeedProps) {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔥 NEW: State for our active filter
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "responding" | "resolved">("all");
  const [alertRadiusKm, setAlertRadiusKm] = useState(10);
  const [assignments, setAssignments] = useState<Record<string, { responderId: string; task: string; role: string }>>({});
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [roleUpdates, setRoleUpdates] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(initialLimit);

  const roleOptions = ["Dispatcher", "Senior Vet", "Ambulance Driver", "Rescue Volunteer", "Staff"];

  useEffect(() => {
    // We increased the limit to 100 so client-side filtering has plenty of data to work with
    const q = query(
      collection(db, "sos_alerts"), 
      orderBy("time", "desc"), 
      
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as Omit<SOSAlert, "id"> & { location?: any };
        let latitude: number | null | undefined = raw.latitude;
        let longitude: number | null | undefined = raw.longitude;
        if (raw.location && typeof raw.location === "object") {
          latitude = typeof raw.location.latitude === "number" ? raw.location.latitude : latitude;
          longitude = typeof raw.location.longitude === "number" ? raw.location.longitude : longitude;
        }
        return {
          id: docSnap.id,
          ...raw,
          latitude,
          longitude,
        };
      });
      
      setAlerts(fetchedAlerts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching SOS alerts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Format the Firebase timestamp into a readable time & date
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true 
      }).format(date);
    } catch {
      return "Recent";
    }
  };

  const centerCoords = useMemo(() => {
    if (!centerLocation) return null;
    if (typeof centerLocation.latitude !== "number" || typeof centerLocation.longitude !== "number") return null;
    return centerLocation;
  }, [centerLocation]);

  const computeDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (val: number) => (val * Math.PI) / 180;
    const r = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 🔥 NEW: Client-side filtering logic (status + optional radius)
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (activeFilter !== "all" && alert.status !== activeFilter) return false;
      if (!showDispatchControls || !centerCoords) return true;
      if (typeof alert.latitude !== "number" || typeof alert.longitude !== "number") return true;
      const distance = computeDistanceKm(centerCoords.latitude, centerCoords.longitude, alert.latitude, alert.longitude);
      return distance <= alertRadiusKm;
    });
  }, [alerts, activeFilter, showDispatchControls, centerCoords, alertRadiusKm]);

  useEffect(() => {
    setVisibleCount(initialLimit);
  }, [activeFilter, alertRadiusKm, initialLimit]);

  const limitedAlerts = useMemo(() => {
    return filteredAlerts.slice(0, visibleCount);
  }, [filteredAlerts, visibleCount]);

  // Helper function to get nice colors for different statuses
  const getStatusStyle = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'bg-red-50 text-red-600 border-red-200';
      case 'responding': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleAssign = async (alert: SOSAlert) => {
  const selection = assignments[alert.id];

  if (
    !selection?.responderId ||
    !selection?.task ||
    !selection?.role
  ) return;

  const responder = responders.find(
    (r) => r.id === selection.responderId
  );

  if (!responder) return;

  setIsAssigning(alert.id);

  try {

    // 1. CREATE TASK DOCUMENT
    await addDoc(collection(db, "assigned_tasks"), {
      sosId: alert.id,

      assignedTo: responder.id,
      assignedBy: "ORG_OWNER_ID", // replace later with auth user id

      responderName: responder.name,
      responderRole: responder.role || "Staff",

      organizationId: "ORG_ID", // replace later dynamically

      taskType: selection.task,

      title: alert.title,
      description: alert.description,
      address: alert.address,
      urgency: alert.urgency,

      photoURL: alert.photoURL || "",

      location: {
        latitude: alert.latitude || null,
        longitude: alert.longitude || null,
      },

      status: "assigned",

      createdAt: serverTimestamp(),
      acceptedAt: null,
      completedAt: null,
    });

    // CREATE NOTIFICATION
await addDoc(collection(db, "notifications"), {
  userId: responder.id,

  type: "SOS_TASK",

  sosId: alert.id,

  title: "🚨 New SOS Assigned",

  message: `${selection.task} assigned for ${alert.title}`,

  read: false,

  createdAt: serverTimestamp(),
});

    // 2. UPDATE SOS ALERT LIGHTLY
    await updateDoc(doc(db, "sos_alerts", alert.id), {
  assignedResponderId: responder.id,
  assignedResponderName: responder.name,
  assignedResponderRole: responder.role || "Staff",

  assignedTask: selection.task,

  assignedAt: serverTimestamp(),

  // IMPORTANT
  acceptedBy: responder.id,
  acceptedByName: responder.name,
  acceptedAt: serverTimestamp(),

  status: "responding",
});

  } catch (error) {
    console.error("Failed to assign responder:", error);
  } finally {
    setIsAssigning(null);
  }
};

const handleDeassign = async (alert: SOSAlert) => {
  if (!alert.assignedResponderId) return;

  try {

    // 1. FIND ASSIGNED TASK
    const q = query(
      collection(db, "assigned_tasks"),
      where("sosId", "==", alert.id),
      where("assignedTo", "==", alert.assignedResponderId)
    );

    const snap = await getDocs(q);

    // 2. MARK TASK CANCELLED
    for (const taskDoc of snap.docs) {
      await updateDoc(doc(db, "assigned_tasks", taskDoc.id), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
      });
    }

    // 3. REMOVE ASSIGNMENT FROM SOS
    await updateDoc(doc(db, "sos_alerts", alert.id), {
      assignedResponderId: deleteField(),
      assignedResponderName: deleteField(),
      assignedResponderRole: deleteField(),
      assignedTask: deleteField(),
      assignedAt: deleteField(),

      status: "active",
    });

    // 4. SEND NOTIFICATION
    await addDoc(collection(db, "notifications"), {
      userId: alert.assignedResponderId,

      type: "TASK_REMOVED",

      sosId: alert.id,

      title: "❌ SOS Assignment Removed",

      message: `You were removed from ${alert.title}`,

      read: false,

      createdAt: serverTimestamp(),
    });

  } catch (error) {
    console.error("Failed to deassign responder:", error);
  }
};

  const busyResponderIds = useMemo(() => {
    return new Set(
      alerts
        .filter((alert) => alert.assignedResponderId && alert.status !== "resolved")
        .map((alert) => alert.assignedResponderId as string)
    );
  }, [alerts]);

  const getAvailableResponders = (alertId: string) => {
    const selectedRole = assignments[alertId]?.role;
    if (!selectedRole) return [] as ResponderOption[];
    return responders.filter((responder) => {
      const roleMatches = (responder.role || "Staff") === selectedRole;
      const isBusy = busyResponderIds.has(responder.id);
      return roleMatches && !isBusy;
    });
  };

  const handleRoleUpdate = async (responderId: string, nextRole: string) => {
    if (!isOwner) return;
    setRoleUpdates((prev) => ({ ...prev, [responderId]: true }));
    try {
      await updateDoc(doc(db, "users", responderId), { orgRole: nextRole });
    } catch (error) {
      console.error("Failed to update responder role:", error);
    } finally {
      setRoleUpdates((prev) => ({ ...prev, [responderId]: false }));
    }
  };

  const getAssignedResponder = (alert: SOSAlert) => {
    if (!alert.assignedResponderId) return null;
    const responder = responders.find((r) => r.id === alert.assignedResponderId);
    if (responder) {
      return { name: responder.name, role: responder.role || "Staff" };
    }
    return {
      name: alert.assignedResponderName || "Responder",
      role: alert.assignedResponderRole || "Staff",
    };
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      
      {/* 🔥 NEW: Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto">
        <FilterPill 
          label="All Alerts" 
          count={alerts.length} 
          isActive={activeFilter === "all"} 
          onClick={() => setActiveFilter("all")} 
        />
        <FilterPill 
          label="🚨 Active" 
          count={alerts.filter(a => a.status === 'active').length} 
          isActive={activeFilter === "active"} 
          onClick={() => setActiveFilter("active")} 
          colorClass="hover:bg-red-50 hover:text-red-700 hover:border-red-200 active-red"
        />
        <FilterPill 
          label="🏃 Responding" 
          count={alerts.filter(a => a.status === 'responding').length} 
          isActive={activeFilter === "responding"} 
          onClick={() => setActiveFilter("responding")} 
          colorClass="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 active-blue"
        />
        <FilterPill 
          label="✅ Resolved" 
          count={alerts.filter(a => a.status === 'resolved').length} 
          isActive={activeFilter === "resolved"} 
          onClick={() => setActiveFilter("resolved")} 
          colorClass="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 active-emerald"
        />

        {showDispatchControls && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alert Radius</span>
            <select
              value={alertRadiusKm}
              onChange={(e) => setAlertRadiusKm(Number(e.target.value))}
              className="bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-full text-slate-600 hover:border-slate-300"
            >
              {[5, 10, 25, 50].map((km) => (
                <option key={km} value={km}>{km} km</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table Area */}
      <div className="p-0 overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">Alert Info</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Responder</th>
              {showDispatchControls && <th className="px-6 py-4">Dispatch</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={showDispatchControls ? 6 : 5} className="px-6 py-16 text-center">
                  <div className="text-4xl mb-3 opacity-50">📭</div>
                  <p className="text-slate-500 font-bold">No {activeFilter !== 'all' ? activeFilter : ''} alerts found.</p>
                  <p className="text-slate-400 text-xs mt-1">Everything looks clear in this category.</p>
                </td>
              </tr>
            ) : (
              limitedAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors group">
                  
                  {/* 1. Alert Info (Photo + Urgency/Status) */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {alert.photoURL ? (
                        <img 
                          src={alert.photoURL} 
                          alt="SOS" 
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl">
                          🐾
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1.5 items-start">
                        {/* Urgency Badge */}
                        {alert.urgency === "high" || alert.urgency === "critical" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> {alert.urgency}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
                            {alert.urgency || "Normal"}
                          </span>
                        )}
                        
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 border rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusStyle(alert.status)}`}>
                          {alert.status || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Details (Title + Description) */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 mb-1 truncate max-w-[200px] text-base group-hover:text-orange-600 transition-colors cursor-pointer">
                      {alert.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">
                      {alert.description}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider flex items-center gap-1">
                      <span>👤</span> {alert.reportedByName || "Anonymous"}
                    </p>
                  </td>

                  {/* 3. Location (Address) */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">📍</span>
                      <p className="font-medium text-slate-700 line-clamp-2 max-w-[220px] text-xs leading-relaxed">
                        {alert.address}
                      </p>
                    </div>
                  </td>

                  {/* 4. Timestamp */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap">
                      {formatTime(alert.time)}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {(() => {
                      const assigned = getAssignedResponder(alert);
                      if (!assigned) {
                        return <span className="text-xs font-semibold text-slate-400">Unassigned</span>;
                      }
                      return (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{assigned.name}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {assigned.role}
                          </span>
                        </div>
                      );
                    })()}
                  </td>

                  {showDispatchControls && (
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <select
                            value={assignments[alert.id]?.task || ""}
                            onChange={(e) =>
                              setAssignments((prev) => ({
                                ...prev,
                                [alert.id]: {
                                  responderId: prev[alert.id]?.responderId || "",
                                  role: prev[alert.id]?.role || "",
                                  task: e.target.value,
                                },
                              }))
                            }
                            className="w-full bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg text-slate-600"
                          >
                            <option value="">Select task</option>
                            <option value="Responding">Responding to SOS</option>
                            <option value="Transport">Ambulance transport</option>
                            <option value="Vet Care">Assign vet care</option>
                          </select>
                          <select
                            value={assignments[alert.id]?.role || ""}
                            onChange={(e) =>
                              setAssignments((prev) => ({
                                ...prev,
                                [alert.id]: {
                                  responderId: "",
                                  role: e.target.value,
                                  task: prev[alert.id]?.task || "",
                                },
                              }))
                            }
                            className="w-full bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg text-slate-600"
                          >
                            <option value="">Select role</option>
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <select
                            value={assignments[alert.id]?.responderId || ""}
                            onChange={(e) =>
                              setAssignments((prev) => ({
                                ...prev,
                                [alert.id]: {
                                  responderId: e.target.value,
                                  role: prev[alert.id]?.role || "",
                                  task: prev[alert.id]?.task || "",
                                },
                              }))
                            }
                            className="w-full bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg text-slate-600"
                            disabled={!assignments[alert.id]?.role || !isOwner}
                          >
                            <option value="">Select responder</option>
                            {getAvailableResponders(alert.id).map((responder) => (
                              <option key={responder.id} value={responder.id}>
                                {responder.name} {responder.role ? `• ${responder.role}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        {isOwner && assignments[alert.id]?.responderId && (
                          <div className="flex items-center gap-2">
                            <select
                              value={
                                responders.find((r) => r.id === assignments[alert.id]?.responderId)?.role ||
                                "Staff"
                              }
                              onChange={(e) => handleRoleUpdate(assignments[alert.id]?.responderId, e.target.value)}
                              className="w-full bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg text-slate-600"
                            >
                              {roleOptions.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                              {roleUpdates[assignments[alert.id]?.responderId] ? "Updating..." : "Role"}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">

  <button
    onClick={() => handleAssign(alert)}
    disabled={
      isAssigning === alert.id ||
      !assignments[alert.id]?.responderId ||
      !assignments[alert.id]?.task ||
      !assignments[alert.id]?.role
    }
    className="px-3 py-2 text-xs font-black uppercase tracking-widest rounded-lg bg-slate-900 text-white hover:bg-primary transition-colors disabled:opacity-50"
  >
    {isAssigning === alert.id ? "Assigning..." : "Assign"}
  </button>

  {alert.assignedResponderId && (
    <button
      onClick={() => handleDeassign(alert)}
      className="px-3 py-2 text-xs font-black uppercase tracking-widest rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
    >
      Deassign
    </button>
  )}

  {(alert.assignedResponderName || alert.assignedTask) && (
    <span className="text-[10px] font-bold text-slate-400">
      {alert.assignedTask || "Assigned"} • {alert.assignedResponderName || "Responder"}
    </span>
  )}

</div>
                      </div>
                    </td>
                  )}
                  
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showLoadMore && filteredAlerts.length > limitedAlerts.length && (
        <div className="p-4 flex justify-center border-t border-slate-100 bg-white">
          <button
            onClick={() => setVisibleCount((prev) => prev + pageSize)}
            className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-primary transition-colors"
          >
            Load 10 more
          </button>
        </div>
      )}
    </div>
  );
}

/* --- HELPER COMPONENTS --- */

function FilterPill({ label, count, isActive, onClick, colorClass = "" }: any) {
  // Determine active colors based on the passed colorClass (to give active/resolved different colors)
  let activeStyles = "bg-slate-900 text-white border-slate-900 shadow-sm";
  if (isActive && colorClass.includes("active-red")) activeStyles = "bg-red-600 text-white border-red-600 shadow-sm";
  if (isActive && colorClass.includes("active-blue")) activeStyles = "bg-blue-600 text-white border-blue-600 shadow-sm";
  if (isActive && colorClass.includes("active-emerald")) activeStyles = "bg-emerald-600 text-white border-emerald-600 shadow-sm";

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 shrink-0 ${isActive ? activeStyles : `bg-white text-slate-600 border-slate-200 hover:border-slate-300 ${colorClass}`}`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}