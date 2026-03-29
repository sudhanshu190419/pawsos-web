"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase"; 
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";

// Updated to perfectly match your Firebase database fields!
interface SOSAlert {
  id: string;
  address: string;
  createdBy: string;
  description: string;
  photoURL: string;
  reportedByName: string;
  status: string;
  time: any; // Firebase Timestamp
  title: string;
  type: string;
  urgency: string; 
}

export default function LiveSOSFeed() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 Changed "createdAt" to "time" to match your database!
    const q = query(
      collection(db, "sos_alerts"), 
      orderBy("time", "desc"), 
      limit(50)
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

  // Format the Firebase timestamp into a readable time
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate();
      // Returns format like "10:51 PM"
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
    } catch {
      return "Recent";
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
    <div className="p-0 overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-100">
          <tr>
            <th className="px-6 py-4">Alert Info</th>
            <th className="px-6 py-4">Details</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          
          {alerts.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">
                No active SOS alerts right now.
              </td>
            </tr>
          ) : (
            alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                
                {/* 1. Alert Info (Photo + Urgency/Status) */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {/* Display the uploaded photo if it exists */}
                    {alert.photoURL ? (
                      <img 
                        src={alert.photoURL} 
                        alt="SOS" 
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl">
                        🐾
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1 items-start">
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
                      
                      {/* Status text (e.g., "active") */}
                      <span className="text-xs font-bold text-slate-400 capitalize">{alert.status}</span>
                    </div>
                  </div>
                </td>

                {/* 2. Details (Title + Description) */}
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 mb-0.5 truncate max-w-[200px]">
                    {alert.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">
                    {alert.description}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    By: {alert.reportedByName}
                  </p>
                </td>

                {/* 3. Location (Address) */}
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-700 line-clamp-2 max-w-[250px]">
                    {alert.address}
                  </p>
                </td>

                {/* 4. Timestamp */}
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg text-xs">
                    {formatTime(alert.time)}
                  </span>
                </td>
                
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}