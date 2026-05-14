"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { showGlobalToast } from "./ui/GlobalToastHost";
import { 
  Building2, 
  User as UserIcon, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Ambulance, 
  Stethoscope, 
  ExternalLink, 
  ShieldCheck,
  MapPin, 
  ChevronRight,
  X,
  Activity
} from "lucide-react";

interface OrgData {
  id: string;
  ownerId: string;
  orgName: string;
  type: "hospital" | "ngo" | "vet";
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  regNumber: string;
  bedCount: number;
  hasAmbulance: boolean;
  specialties: string[];
  logo: string;
  licenseFile: string;
  status: string;
  createdAt: any;
}

export default function OrganizationApprovals() {
  const [pendingOrgs, setPendingOrgs] = useState<OrgData[]>([]);
  const [activeOrgs, setActiveOrgs] = useState<OrgData[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"pending" | "active">("pending");
  const [selectedOrg, setSelectedOrg] = useState<OrgData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Listen for Pending Organizations
    const qPending = query(collection(db, "pending_organizations"), where("status", "==", "pending_review"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const fetchedPending = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<OrgData, "id">) }));
      setPendingOrgs(fetchedPending);
      setLoading(false);
    });

    // Listen for Active Organizations
    const qActive = query(collection(db, "organizations"));
    const unsubActive = onSnapshot(qActive, (snapshot) => {
      const fetchedActive = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<OrgData, "id">) }));
      setActiveOrgs(fetchedActive);
    });

    return () => {
      unsubPending();
      unsubActive();
    };
  }, []);

  const buildOrgEmpId = (orgId: string) => {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${orgId}-EMP-${suffix}`;
  };

  const handleApprove = async () => {
    if (!selectedOrg) return;
    setIsProcessing(true);
    try {
      // Generate a clean organization ID
      const orgId = "ORG-" + Math.random().toString(36).substring(2, 7).toUpperCase();
      
      // 1. Create entry in organizations collection
      await setDoc(doc(db, "organizations", orgId), {
        ...selectedOrg,
        id: orgId,
        isApproved: true,
        approvedAt: serverTimestamp(),
        ownerId: selectedOrg.ownerId,
      });

      // 2. Fetch current user data to check role
      const userRef = doc(db, "users", selectedOrg.ownerId);
      const userSnap = await getDoc(userRef);

      // 3. Update user document without overriding global role
      const updates: any = {
        orgApproved: true,
        organizationId: orgId,
        organizationName: selectedOrg.orgName,
        orgRole: "owner",
        orgEmpId: buildOrgEmpId(orgId),
      };

      await updateDoc(userRef, updates);

      // 4. Delete pending application
      await deleteDoc(doc(db, "pending_organizations", selectedOrg.id));

      showGlobalToast(`Organization "${selectedOrg.orgName}" approved successfully!`, "success");
      setSelectedOrg(null); 
    } catch (error: any) {
      console.error("Error approving organization:", error);
      showGlobalToast(error.message || "Failed to approve organization.", "error");
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedOrg) return;
    const reason = window.prompt("Reason for rejection (Optional):");
    if (reason === null) return; 

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "pending_organizations", selectedOrg.id), { status: "rejected", rejectionReason: reason });
      showGlobalToast(`Organization "${selectedOrg.orgName}" rejected.`, "info");
      setSelectedOrg(null); 
    } catch (error: any) {
      console.error("Error rejecting organization:", error);
      showGlobalToast(error.message || "Failed to reject organization.", "error");
    }
    setIsProcessing(false);
  };

  const displayList = viewMode === "pending" ? pendingOrgs : activeOrgs;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full">

        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Enterprise Partners</h2>

          <div className="flex bg-slate-200/50 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode("pending")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === "pending" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Requests ({pendingOrgs.length})
            </button>
            <button 
              onClick={() => setViewMode("active")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === "active" ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Verified ({activeOrgs.length})
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[600px]">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
              <div className="text-3xl mb-2">🏢</div>
              <p className="text-slate-500 font-bold text-sm">
                No {viewMode === "pending" ? "pending requests" : "active partners"} yet.
              </p>
            </div>
          ) : (
            displayList.map((org) => (
              <div key={org.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-primary/20 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 truncate mr-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center text-xl shrink-0 border border-primary/10">
                    {org.type === "hospital" ? <Stethoscope className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                      {org.orgName} 
                      {viewMode === "active" && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate uppercase tracking-wider">{org.type} · {org.city}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrg(org)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors shrink-0 shadow-sm ${viewMode === "pending" ? "bg-slate-900 text-white hover:bg-primary" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"}`}
                >
                  {viewMode === "pending" ? "Review" : "View Profile"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Review</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Verification Terminal</p>
              </div>
              <button onClick={() => setSelectedOrg(null)} className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-full flex items-center justify-center transition-colors shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              <div className="flex items-center gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="w-20 h-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-3xl">
                  {selectedOrg.type === "hospital" ? <Stethoscope className="w-10 h-10" /> : <Building2 className="w-10 h-10" />}
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    {selectedOrg.orgName}
                    {viewMode === "active" && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>}
                  </h4>
                  <span className="inline-block mt-2 bg-white text-slate-500 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-slate-200">
                    Type: {selectedOrg.type}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8 mb-8">
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Contact Details</h5>
                  <div className="space-y-2 text-sm font-medium text-slate-700">
                    <p className="flex items-center gap-3"><UserIcon className="w-4 h-4 text-slate-400" /> {selectedOrg.contactPerson}</p>
                    <p className="flex items-center gap-3 text-primary"><Mail className="w-4 h-4" /> {selectedOrg.email}</p>
                    <p className="flex items-center gap-3 text-primary"><Phone className="w-4 h-4" /> {selectedOrg.phone}</p>
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Capabilities</h5>
                  <div className="space-y-2 text-sm font-medium text-slate-700">
                    <p className="flex items-center gap-3"><Activity className="w-4 h-4 text-primary" /> {selectedOrg.bedCount} Bed Capacity</p>
                    {selectedOrg.hasAmbulance && (
                      <p className="flex items-center gap-3 text-green-600"><Ambulance className="w-4 h-4" /> Ambulance Service</p>
                    )}
                    <p className="flex items-center gap-3"><MapPin className="w-4 h-4 text-slate-400" /> {selectedOrg.city}</p>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Verified Assets</h5>
                <a href={selectedOrg.licenseFile} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                    <span className="font-bold text-sm text-slate-800">Medical / Operation License</span>
                  </div>
                  <span className="text-primary text-sm font-bold group-hover:underline">View File ↗</span>
                </a>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              {viewMode === "pending" ? (
                <>
                  <button onClick={handleReject} disabled={isProcessing} className="flex-1 bg-white border-2 border-red-200 text-red-600 py-3.5 rounded-xl font-bold hover:bg-red-50 transition-colors disabled:opacity-50">
                    Reject
                  </button>
                  <button onClick={handleApprove} disabled={isProcessing} className="flex-[2] bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-primary-container transition-all disabled:opacity-50 flex items-center justify-center gap-2 shimmer-btn shadow-primary/20">
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "✅ Verify & Onboard"}
                  </button>
                </>
              ) : (
                <button onClick={() => setSelectedOrg(null)} className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                  Close Record
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
