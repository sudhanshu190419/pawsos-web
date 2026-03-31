"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { db } from "../lib/firebase"; 
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";

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
}

export default function LiveSOSFeed() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔥 NEW: State for our active filter
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "responding" | "resolved">("all");

  useEffect(() => {
    // We increased the limit to 100 so client-side filtering has plenty of data to work with
    const q = query(
      collection(db, "sos_alerts"), 
      orderBy("time", "desc"), 
      
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<SOSAlert, "id">),
      }));
      
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

  // 🔥 NEW: Client-side filtering logic
  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === "all") return true;
    return alert.status === activeFilter;
  });

  // Helper function to get nice colors for different statuses
  const getStatusStyle = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'bg-red-50 text-red-600 border-red-200';
      case 'responding': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="text-4xl mb-3 opacity-50">📭</div>
                  <p className="text-slate-500 font-bold">No {activeFilter !== 'all' ? activeFilter : ''} alerts found.</p>
                  <p className="text-slate-400 text-xs mt-1">Everything looks clear in this category.</p>
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => (
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
                  
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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