"use client";

import { useEffect, useState } from "react";
import { db, functions } from "../lib/firebase";
import { httpsCallable } from "firebase/functions";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

interface NGOData {
  id: string;
  uid: string;
  ngoName: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  fullAddress: string;
  serviceArea: string;
  regNumber: string;
  darpanId?: string;
  hasAmbulance: boolean;
  hasShelter: boolean;
  animalTypes: string[];
  logo: string;
  regCert: string;
  eightyGCert?: string;
  verificationStatus: string;
  status: string;
  role: string;
  createdAt: any;
  updatedAt: any;
  latitude: number;
  longitude: number;
}

export default function PendingApprovals() {
  const [pendingNGOs, setPendingNGOs] = useState<NGOData[]>([]);
  const [activeNGOs, setActiveNGOs] = useState<NGOData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState<"pending" | "active">("pending");
  const [selectedNGO, setSelectedNGO] = useState<NGOData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 1. Listen for PENDING NGOs
    const qPending = query(collection(db, "ngos_web"), where("verificationStatus", "==", "pending_review"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const fetchedPending = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<NGOData, "id">) }));
      setPendingNGOs(fetchedPending);
      setLoading(false);
    });

    // 2. Listen for ACTIVE NGOs (Already approved)
    const qActive = query(collection(db, "ngos_web"), where("verificationStatus", "==", "approved"));
    const unsubActive = onSnapshot(qActive, (snapshot) => {
      const fetchedActive = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<NGOData, "id">) }));
      setActiveNGOs(fetchedActive);
    });

    return () => {
      unsubPending();
      unsubActive();
    };
  }, []);

  // Handle Approving the NGO
  const handleApprove = async () => {
    if (!selectedNGO) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "ngos_web", selectedNGO.id), { verificationStatus: "approved", status: "active", role: "ngo" });
      await updateDoc(doc(db, "users", selectedNGO.uid), { ngoApproved: true });

      // Send approval email (non-blocking — admin action succeeds regardless)
      const notifyNGO = httpsCallable(functions, "notifyNGOApprovalStatus");
      void notifyNGO({
        ngoEmail: selectedNGO.email,
        ngoName: selectedNGO.ngoName,
        contactPerson: selectedNGO.contactPerson,
        status: "approved",
      }).catch((err) => {
        console.warn("[PendingApprovals] NGO approval email send failed (non-blocking):", err);
      });

      setSelectedNGO(null); 
    } catch (error) {
      console.error("Error approving NGO:", error);
      alert("Failed to approve NGO.");
    }
    setIsProcessing(false);
  };

  // Handle Rejecting or Revoking the NGO
  const handleReject = async () => {
    if (!selectedNGO) return;
    const reason = window.prompt("Reason for rejection/revocation (Optional):");
    if (reason === null) return; 

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "ngos_web", selectedNGO.id), { verificationStatus: "rejected", status: "inactive", role: "user", rejectionReason: reason });
      await updateDoc(doc(db, "users", selectedNGO.uid), { ngoApproved: false });

      // Send rejection email (non-blocking — admin action succeeds regardless)
      const notifyNGO = httpsCallable(functions, "notifyNGOApprovalStatus");
      void notifyNGO({
        ngoEmail: selectedNGO.email,
        ngoName: selectedNGO.ngoName,
        contactPerson: selectedNGO.contactPerson,
        status: "rejected",
        reason: reason || undefined,
      }).catch((err) => {
        console.warn("[PendingApprovals] NGO rejection email send failed (non-blocking):", err);
      });

      setSelectedNGO(null); 
    } catch (error) {
      console.error("Error rejecting NGO:", error);
      alert("Failed to update NGO status.");
    }
    setIsProcessing(false);
  };

  // Determine which list to show based on the toggle
  const displayList = viewMode === "pending" ? pendingNGOs : activeNGOs;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full">
        
        {/* Header & Custom Tabs */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">NGO Management</h2>
          
          {/* Segmented Control Toggle */}
          <div className="flex bg-slate-200/50 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode("pending")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === "pending" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Pending ({pendingNGOs.length})
            </button>
            <button 
              onClick={() => setViewMode("active")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === "active" ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Active ({activeNGOs.length})
            </button>
          </div>
        </div>
        
        {/* NGO List */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[600px]">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
              <div className="text-3xl mb-2">{viewMode === "pending" ? "🎉" : "🏢"}</div>
              <p className="text-slate-500 font-bold text-sm">
                {viewMode === "pending" ? "You're all caught up!" : "No active NGOs yet."}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {viewMode === "pending" ? "No pending applications." : "Approve some applications to see them here."}
              </p>
            </div>
          ) : (
            displayList.map((ngo) => (
              <div key={ngo.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-orange-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 truncate mr-4">
                  {ngo.logo ? (
                    <img src={ngo.logo} alt="logo" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xl shrink-0 border border-orange-100">🏢</div>
                  )}
                  <div className="truncate">
                    <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                      {ngo.ngoName} 
                      {viewMode === "active" && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{ngo.city} • {ngo.contactPerson}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNGO(ngo)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors shrink-0 shadow-sm ${viewMode === "pending" ? "bg-slate-900 text-white hover:bg-orange-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"}`}
                >
                  {viewMode === "pending" ? "Review" : "View Profile"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- REVIEW / PROFILE MODAL --- */}
      {selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {viewMode === "pending" ? "Review Application" : "NGO Profile"}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {viewMode === "pending" ? "Verify credentials before approving." : "Active platform partner."}
                </p>
              </div>
              <button onClick={() => setSelectedNGO(null)} className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-full flex items-center justify-center transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-8 overflow-y-auto">
              
              {/* Profile Card */}
              <div className="flex items-center gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                {selectedNGO.logo ? (
                  <img src={selectedNGO.logo} alt="logo" className="w-20 h-20 rounded-xl object-cover shadow-sm border border-slate-200" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center text-3xl">🏢</div>
                )}
                <div>
                  <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    {selectedNGO.ngoName}
                    {viewMode === "active" && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>}
                  </h4>
                  <p className="text-sm font-bold text-slate-500 mt-1">Reg No: <span className="text-slate-700">{selectedNGO.regNumber}</span></p>
                  {selectedNGO.darpanId && <p className="text-sm font-bold text-slate-500">NITI Aayog: <span className="text-slate-700">{selectedNGO.darpanId}</span></p>}
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid sm:grid-cols-2 gap-8 mb-8">
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Contact Info</h5>
                  <div className="space-y-2 text-sm font-medium text-slate-700">
                    <p>👤 {selectedNGO.contactPerson}</p>
                    <p>📞 <a href={`tel:${selectedNGO.phone}`} className="text-orange-600 hover:underline">{selectedNGO.phone}</a></p>
                    <p>✉️ <a href={`mailto:${selectedNGO.email}`} className="text-orange-600 hover:underline">{selectedNGO.email}</a></p>
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Location & Capacity</h5>
                  <div className="space-y-2 text-sm font-medium text-slate-700">
                    <p>📍 {selectedNGO.city}</p>
                    <p className="flex gap-2">
                      {selectedNGO.hasAmbulance && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">🚑 Ambulance</span>}
                      {selectedNGO.hasShelter && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">🏡 Shelter</span>}
                    </p>
                    <p className="text-xs text-slate-500">Handles: {selectedNGO.animalTypes?.join(", ")}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Uploaded Documents</h5>
                <div className="flex flex-col gap-3">
                  <a href={selectedNGO.regCert} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <span className="font-bold text-sm text-slate-800">Registration Certificate</span>
                    </div>
                    <span className="text-orange-600 text-sm font-bold group-hover:underline">View File ↗</span>
                  </a>
                  {selectedNGO.eightyGCert && (
                    <a href={selectedNGO.eightyGCert} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <span className="font-bold text-sm text-slate-800">80G Exemption Certificate</span>
                      </div>
                      <span className="text-orange-600 text-sm font-bold group-hover:underline">View File ↗</span>
                    </a>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer / Actions - CHANGES BASED ON TOGGLE */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              {viewMode === "pending" ? (
                <>
                  <button onClick={handleReject} disabled={isProcessing} className="flex-1 bg-white border-2 border-red-200 text-red-600 py-3.5 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50">
                    Reject Application
                  </button>
                  <button onClick={handleApprove} disabled={isProcessing} className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-green-700 hover:shadow-green-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isProcessing ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "✅ Approve & Verify"}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setSelectedNGO(null)} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                    Close Profile
                  </button>
                  <button onClick={handleReject} disabled={isProcessing} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-3.5 rounded-xl font-bold hover:bg-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isProcessing ? "Processing..." : "🚨 Revoke Access"}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}