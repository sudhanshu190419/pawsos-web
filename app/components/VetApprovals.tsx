"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

// 🔥 Updated to perfectly match your real Firebase schema!
interface VetData {
  id: string;
  uid: string;
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  clinicAddress?: string;
  profilePhotoURL?: string;
  documentURL?: string;
  availability?: string[];
  serviceArea?: string;
  willingToTravel?: boolean;
  verificationStatus?: string; // e.g., "pending_review", "approved"
  status?: string;             // e.g., "pending", "active"
  createdAt?: any;
}

export default function VetApprovals() {
  const [pendingVets, setPendingVets] = useState<VetData[]>([]);
  const [activeVets, setActiveVets] = useState<VetData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<"pending" | "active">("pending");
  const [selectedVet, setSelectedVet] = useState<VetData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ⚠️ NOTE: Change "vets" below to "users" or "vet_applications" depending on your exact collection name!
  const COLLECTION_NAME = "vets_web"; 

  useEffect(() => {
    // 🔥 Listen for PENDING Vets using "verificationStatus" == "pending_review"
    const qPending = query(collection(db, COLLECTION_NAME), where("verificationStatus", "==", "pending_review"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        uid: doc.data().uid || doc.id,
        ...doc.data()
      })) as VetData[];
      
      setPendingVets(fetched);
      setLoading(false);
    });

    // 🔥 Listen for ACTIVE Vets using "verificationStatus" == "approved"
    const qActive = query(collection(db, COLLECTION_NAME), where("verificationStatus", "==", "approved"));
    const unsubActive = onSnapshot(qActive, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        uid: doc.data().uid || doc.id,
        ...doc.data()
      })) as VetData[];
      
      setActiveVets(fetched);
    });

    return () => {
      unsubPending();
      unsubActive();
    };
  }, []);

  const handleApprove = async () => {
    if (!selectedVet) return;
    setIsProcessing(true);
    try {
      // 1. Update the Vet Application document
      await updateDoc(doc(db, COLLECTION_NAME, selectedVet.id), { 
        verificationStatus: 'approved',
        status: 'active'
      });

      // 2. Update the main user document so the Mobile App unlocks Vet features!
      await updateDoc(doc(db, "users", selectedVet.uid), { 
        vetApproved: true,
        vetApprovedSince: new Date()
      });

      setSelectedVet(null); 
    } catch (error) {
      console.error("Error approving vet:", error);
      alert("Failed to approve veterinarian.");
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedVet) return;
    const reason = window.prompt("Reason for rejection/revocation (Optional):");
    if (reason === null) return; 

    setIsProcessing(true);
    try {
      // 1. Update the Vet Application document
      await updateDoc(doc(db, COLLECTION_NAME, selectedVet.id), { 
        verificationStatus: 'rejected',
        status: 'inactive',
        rejectionReason: reason 
      });

      // 2. Lock them back to a normal user
      await updateDoc(doc(db, "users", selectedVet.uid), { 
        vetApproved: false,
        
      });

      setSelectedVet(null); 
    } catch (error) {
      console.error("Error updating vet:", error);
      alert("Failed to update status.");
    }
    setIsProcessing(false);
  };

  const displayList = viewMode === "pending" ? pendingVets : activeVets;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Veterinarian Directory</h2>
          
          <div className="flex bg-slate-200/50 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode("pending")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === "pending" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Pending ({pendingVets.length})
            </button>
            <button 
              onClick={() => setViewMode("active")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === "active" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Active ({activeVets.length})
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto max-h-[600px]">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
              <div className="text-3xl mb-2">{viewMode === "pending" ? "🩺" : "🏥"}</div>
              <p className="text-slate-500 font-bold text-sm">
                {viewMode === "pending" ? "Zero pending applications!" : "No active veterinarians yet."}
              </p>
            </div>
          ) : (
            displayList.map((vet) => (
              <div key={vet.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-emerald-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 truncate mr-4">
                  {/* 🔥 Using profilePhotoURL */}
                  {vet.profilePhotoURL ? (
                    <img src={vet.profilePhotoURL} alt="doc" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-black shrink-0 border border-emerald-100">
                      {vet.fullName?.charAt(0)?.toUpperCase() || "V"}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                      Dr. {vet.fullName || "Unknown"}
                      {viewMode === "active" && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{vet.clinicAddress || "Clinic"} • {vet.city || "Location"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedVet(vet)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors shrink-0 shadow-sm ${viewMode === "pending" ? "bg-slate-900 text-white hover:bg-emerald-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"}`}
                >
                  {viewMode === "pending" ? "Review" : "View Profile"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {viewMode === "pending" ? "Review Vet Application" : "Veterinarian Profile"}
                </h3>
              </div>
              <button onClick={() => setSelectedVet(null)} className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-full flex items-center justify-center transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              
              <div className="flex items-center gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                {selectedVet.profilePhotoURL ? (
                  <img src={selectedVet.profilePhotoURL} alt="doc" className="w-20 h-20 rounded-full object-cover shadow-sm border border-slate-200" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl">🩺</div>
                )}
                <div>
                  <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    Dr. {selectedVet.fullName || "Unknown"}
                    {viewMode === "active" && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>}
                  </h4>
                  {/* 🔥 Using serviceArea and Travel preferences */}
                  <p className="text-sm font-bold text-slate-500 mt-1">Service Area: {selectedVet.serviceArea || "N/A"}</p>
                  {selectedVet.willingToTravel && (
                    <p className="text-xs font-bold text-emerald-600 mt-1 bg-emerald-100 inline-block px-2 py-0.5 rounded">🚗 Willing to Travel</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8 mb-8">
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Contact Info</h5>
                  <div className="space-y-2 text-sm font-medium text-slate-700">
                    <p>📞 <a href={`tel:${selectedVet.phone}`} className="text-emerald-600 hover:underline">{selectedVet.phone || "N/A"}</a></p>
                    <p>✉️ <a href={`mailto:${selectedVet.email}`} className="text-emerald-600 hover:underline">{selectedVet.email || "N/A"}</a></p>
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Clinic & Hours</h5>
                  <div className="space-y-2 text-sm font-medium text-slate-700">
                    <p>📍 {selectedVet.clinicAddress || "No address"}, {selectedVet.city || ""}</p>
                    {/* 🔥 Mapping the Availability Array */}
                    {selectedVet.availability && selectedVet.availability.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedVet.availability.map((time, idx) => (
                          <span key={idx} className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{time}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 🔥 Using documentURL */}
              {selectedVet.documentURL && (
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Verification Documents</h5>
                  <a href={selectedVet.documentURL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <span className="font-bold text-sm text-slate-800">Review Submitted Document</span>
                    </div>
                    <span className="text-emerald-600 text-sm font-bold group-hover:underline">View File ↗</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              {viewMode === "pending" ? (
                <>
                  <button onClick={handleReject} disabled={isProcessing} className="flex-1 bg-white border-2 border-red-200 text-red-600 py-3.5 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-colors">
                    Reject Vet
                  </button>
                  <button onClick={handleApprove} disabled={isProcessing} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all">
                    {isProcessing ? "Processing..." : "✅ Approve Vet"}
                  </button>
                </>
              ) : (
                <button onClick={handleReject} disabled={isProcessing} className="w-full bg-red-50 text-red-600 border border-red-200 py-3.5 rounded-xl font-bold hover:bg-red-100 transition-all">
                  🚨 Revoke Vet Status
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}