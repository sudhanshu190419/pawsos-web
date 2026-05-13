"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { db, auth } from "../../lib/firebase";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Users, 
  Settings, 
  LogOut, 
  Activity, 
  Map as MapIcon, 
  Ambulance, 
  Building2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Radio,
  Clock,
  Menu,
  X
} from "lucide-react";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, getDocs, getDoc } from "firebase/firestore";
import LiveSOSFeed from "../../components/LiveSOSFeed";
import { showGlobalToast } from "../../components/ui/GlobalToastHost";

export default function OrganizationDashboard() {
  const { currentUser, userMeta, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);

  // Modals State
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Stats & Requests
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || (userMeta.role !== "hospital" && userMeta.role !== "ngo" && userMeta.role !== "admin")) {
        router.push("/");
      }
    }
  }, [currentUser, userMeta, authLoading, router]);

  useEffect(() => {
    if (!userMeta.organizationId) return;

    // Listen to Organization Data
    const unsubOrg = onSnapshot(doc(db, "organizations", userMeta.organizationId), (snap) => {
      if (snap.exists()) setOrgData(snap.data());
    });

    // Listen to Active Alerts
    const qAlerts = query(collection(db, "sos_alerts"), where("status", "==", "active"));
    const unsubAlerts = onSnapshot(qAlerts, (snap) => setActiveAlerts(snap.size));

    // Listen to Pending Join Requests (Users requesting to join this org)
    const qReqs = query(
      collection(db, "invitations"), 
      where("orgId", "==", userMeta.organizationId),
      where("type", "==", "user_request"),
      where("status", "==", "pending")
    );
    const unsubReqs = onSnapshot(qReqs, (snap) => {
      setPendingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubOrg();
      unsubAlerts();
      unsubReqs();
    };
  }, [userMeta.organizationId]);

  if (authLoading) return <LoadingScreen />;

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    const role = (e.currentTarget.elements.namedItem("role") as HTMLSelectElement).value;

    try {
      // 1. Check if an invite already exists
      const q = query(
        collection(db, "invitations"), 
        where("userEmail", "==", email), 
        where("orgId", "==", userMeta.organizationId),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        showGlobalToast("A pending invitation already exists for this email.", "info");
        return;
      }

      // 2. Create the invitation
      await setDoc(doc(collection(db, "invitations")), {
        orgId: userMeta.organizationId,
        orgName: orgData?.orgName || "Organization",
        userEmail: email,
        type: "org_invite",
        status: "pending",
        role: role,
        createdAt: serverTimestamp()
      });

      showGlobalToast(`Invitation sent to ${email}`, "success");
      setShowAddMember(false);
    } catch (e: any) {
      showGlobalToast(e.message, "error");
    }
  };

  const handleApproveRequest = async (request: any) => {
    try {
      // 1. Update user record
      await updateDoc(doc(db, "users", request.userId), {
        organizationId: request.orgId,
        organizationName: request.orgName,
        orgApproved: true,
        role: orgData?.type === "hospital" ? "hospital" : "ngo"
      });

      // 2. Mark request as accepted
      await updateDoc(doc(db, "invitations", request.id), { status: "accepted" });
      
      showGlobalToast(`Approved ${request.userName} successfully!`, "success");
    } catch (e: any) {
      showGlobalToast(e.message, "error");
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await updateDoc(doc(db, "invitations", id), { status: "rejected" });
      showGlobalToast("Request rejected.", "info");
    } catch (e: any) {
      showGlobalToast(e.message, "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 selection:bg-primary/10 selection:text-primary">
      
      {/* SIDEBAR - Matching Admin Sidebar */}
      <aside className={`bg-slate-900 text-white w-64 flex-shrink-0 transition-all duration-300 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full absolute md:relative md:w-20 z-20"}`}>
        
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <span className={`text-white font-black text-xl tracking-tighter flex items-center gap-2 ${!isSidebarOpen && "md:hidden"}`}>
            <span className="text-primary"><ShieldCheck className="w-6 h-6" /></span> Command
          </span>
          <span className={`text-primary hidden ${!isSidebarOpen && "md:block"}`}><ShieldCheck className="w-6 h-6" /></span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-8 flex flex-col gap-1 px-4">
          <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} isOpen={isSidebarOpen} />
          <NavItem icon={Radio} label="Live Feed" active={activeTab === "feed"} onClick={() => setActiveTab("feed")} isOpen={isSidebarOpen} badge={activeAlerts > 0 ? activeAlerts : null} colorClass="text-rescue-red" />
          <NavItem icon={Users} label="Team Dispatch" active={activeTab === "team"} onClick={() => setActiveTab("team")} isOpen={isSidebarOpen} />
          <NavItem icon={Activity} label="Facility HUD" active={activeTab === "facility"} onClick={() => setActiveTab("facility")} isOpen={isSidebarOpen} />
          <NavItem icon={Settings} label="System Config" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} isOpen={isSidebarOpen} />
        </nav>

        {/* Org Profile Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-primary/20">
              {orgData?.name?.[0] || "O"}
            </div>
            <div className={`overflow-hidden transition-all ${!isSidebarOpen && "md:hidden"}`}>
              <p className="text-xs font-black text-white truncate">{orgData?.name || "Organization"}</p>
              <button onClick={() => signOut(auth)} className="text-[10px] font-bold text-white/40 hover:text-primary transition-colors flex items-center gap-1 mt-0.5">
                DISCONNECT <LogOut className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 hidden sm:block">Operational Terminal // {activeTab}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-field-green/5 border border-field-green/10 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-field-green animate-pulse" />
              <span className="text-[10px] font-black text-field-green uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-auto p-6 md:p-10 lg:p-12 relative z-10 bg-slate-50/50">
          
          {activeTab === "overview" && (
            <div className="space-y-12 animate-fadeUp">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={AlertCircle} label="Active SOS" value={activeAlerts} color="red" trend="Immediate Action" />
                <StatCard icon={Ambulance} label="Dispatched" value="02" color="blue" trend="Active Rescues" />
                <StatCard icon={Building2} label="Bed Capacity" value={`${orgData?.bedCount || 0}%`} color="green" trend="Total Units" />
                <StatCard icon={Clock} label="Avg. Response" value="12m" color="amber" trend="Operational Speed" />
              </div>

              {/* Main Operational Area */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                      <h2 className="text-lg font-bold text-slate-800">Emergency Telemetry</h2>
                      <button onClick={() => setActiveTab("feed")} className="text-xs font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Full Screen Feed</button>
                    </div>
                    <div className="p-2 overflow-auto">
                      <LiveSOSFeed />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <FacilityControlHUD orgData={orgData} />
                  <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Connected Responders</h3>
                    <div className="space-y-4">
                      <ResponderItem name="Officer Rajesh" status="Responding" time="4m ago" />
                      <ResponderItem name="Volunteer Amit" status="On Site" time="12m ago" />
                      <ResponderItem name="Dr. Priya" status="Available" time="Online" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "feed" && (
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col animate-fadeUp min-h-[700px]">
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">Operational Map</h2>
              </div>
              <div className="flex-1 p-2">
                <LiveSOSFeed />
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fadeUp">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Team Dispatch</h2>
                  <p className="text-slate-500 font-medium">Manage responders and medical staff</p>
                </div>
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all shimmer-btn"
                >
                  + Add Member
                </button>
              </div>

              {/* PENDING JOIN REQUESTS */}
              {pendingRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary ml-1">Pending Join Requests ({pendingRequests.length})</h3>
                  <div className="grid gap-4">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="bg-white border-2 border-primary/20 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center text-xl font-black">
                            {req.userName?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{req.userName || "User Request"}</p>
                            <p className="text-xs text-slate-500">{req.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleRejectRequest(req.id)} className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 transition-colors">Reject</button>
                          <button onClick={() => handleApproveRequest(req)} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-container transition-all shadow-md">Approve Member</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Member</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <MemberRow 
                      name="Dr. Sameer Khan" 
                      email="sameer@pawsos.org" 
                      role="Senior Vet" 
                      status="Active" 
                      onManage={() => setSelectedMember({ name: "Dr. Sameer Khan", role: "Senior Vet", email: "sameer@pawsos.org" })}
                    />
                    <MemberRow 
                      name="Anita Sharma" 
                      email="anita@pawsos.org" 
                      role="Dispatcher" 
                      status="On Duty" 
                      onManage={() => setSelectedMember({ name: "Anita Sharma", role: "Dispatcher", email: "anita@pawsos.org" })}
                    />
                    <MemberRow 
                      name="Rahul Verma" 
                      email="rahul@pawsos.org" 
                      role="Ambulance Driver" 
                      status="Offline" 
                      onManage={() => setSelectedMember({ name: "Rahul Verma", role: "Ambulance Driver", email: "rahul@pawsos.org" })}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "facility" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fadeUp">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Facility HUD</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <FacilityControlHUD orgData={orgData} />
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-10 flex flex-col justify-center items-center text-center">
                  <div className="w-20 h-20 bg-field-green/10 text-field-green rounded-[2rem] flex items-center justify-center mb-6">
                    <Activity className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">System Health</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">All medical telemetry sensors are active and transmitting to the AnimalSathi network.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fadeUp">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Configuration</h2>
              <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-10 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Public Profile</h3>
                  <div className="grid gap-4">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500 mb-2 block ml-1">Display Name</span>
                      <input type="text" defaultValue={orgData?.orgName} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/50 transition-all" />
                    </label>
                  </div>
                </div>
                <div className="pt-8 border-t border-slate-100 flex justify-end">
                  <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary transition-all">Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {showAddMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Add Team Member</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">Invite a responder to your command terminal via email.</p>
            
            <form onSubmit={handleAddMember} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Member Email</label>
                <input 
                  name="email"
                  type="email" 
                  required
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/50 transition-all" 
                />
                </div>
                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Operational Role</label>
                <select name="role" required className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/50 transition-all appearance-none">
                  <option value="Senior Vet">Senior Vet</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Ambulance Driver">Ambulance Driver</option>
                  <option value="Rescue Volunteer">Rescue Volunteer</option>
                </select>
                </div>
                <div className="flex gap-4 pt-4">

                <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all shimmer-btn">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Manage Member</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">Update role or access for {selectedMember.name}.</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Operational Role</label>
                <select defaultValue={selectedMember.role} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/50 transition-all appearance-none">
                  <option>Senior Vet</option>
                  <option>Dispatcher</option>
                  <option>Ambulance Driver</option>
                  <option>Rescue Volunteer</option>
                </select>
              </div>
              
              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => {
                    import("../../components/ui/GlobalToastHost").then(({ showGlobalToast }) => {
                      showGlobalToast("Permissions updated", "success");
                      setSelectedMember(null);
                    });
                  }}
                  className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-primary transition-all"
                >
                  Save Permissions
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to remove this member?")) {
                      import("../../components/ui/GlobalToastHost").then(({ showGlobalToast }) => {
                        showGlobalToast("Member removed from team", "info");
                        setSelectedMember(null);
                      });
                    }
                  }}
                  className="w-full bg-rescue-red/5 text-rescue-red px-6 py-4 rounded-xl font-bold text-sm hover:bg-rescue-red/10 transition-all"
                >
                  Revoke Access
                </button>
                <button onClick={() => setSelectedMember(null)} className="w-full py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Close Record</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- HELPER COMPONENTS --- */

function MemberRow({ name, email, role, status, onManage }: { name: string, email: string, role: string, status: string, onManage: () => void }) {
  const statusColor = status === "Active" ? "bg-field-green" : status === "On Duty" ? "bg-primary" : "bg-slate-300";
  
  return (
    <tr className="group hover:bg-slate-50 transition-colors">
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{name}</p>
            <p className="text-[10px] font-medium text-slate-500">{email}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
          {role}
        </span>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${statusColor} animate-pulse`} />
          <span className="text-xs font-bold text-slate-800">{status}</span>
        </div>
      </td>
      <td className="px-8 py-5 text-right">
        <button 
          onClick={onManage}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
        >
          Manage
        </button>
      </td>
    </tr>
  );
}


function NavItem({ icon: Icon, label, active, onClick, isOpen, badge, colorClass = "" }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 group border border-transparent ${active ? "bg-primary text-white shadow-lg shadow-primary/20 border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]" : "hover:bg-white/10 text-white/60 hover:text-white"}`}
    >
      <div className="flex items-center gap-4">
        <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : colorClass || "text-white/40 group-hover:text-primary"}`} />
        <span className={`font-bold text-sm tracking-tight truncate ${!isOpen && "md:hidden"}`}>{label}</span>
      </div>
      {badge ? (
        <span className={`bg-rescue-red text-white text-[9px] font-black px-2 py-0.5 rounded-full ${!isOpen && "md:hidden"} shadow-sm font-mono`}>
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, trend }: any) {
  const colorMap: Record<string, string> = {
    red: "bg-red-50 text-red-600 border-red-100",
    green: "bg-green-50 text-green-600 border-green-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group active:scale-[0.98] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Icon className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
      </div>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:rotate-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] ${colorMap[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-4xl font-black text-slate-900 mb-1 font-mono tracking-tighter">{value}</h3>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
        <div className="flex items-center gap-1.5 mt-3">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${color === 'red' || color === 'amber' ? 'bg-primary' : 'bg-slate-300'}`} />
          <p className={`text-[10px] font-bold ${color === 'red' || color === 'amber' ? 'text-primary' : 'text-slate-400'}`}>{trend}</p>
        </div>
      </div>
    </div>
  );
}

function FacilityControlHUD({ orgData }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800">Facility Status</h2>
      </div>
      <div className="p-8 space-y-6">
        <StatusToggle label="Ambulance Service" active={orgData?.hasAmbulance} />
        <StatusToggle label="Emergency Intake" active={true} />
        <div className="pt-6 border-t border-slate-100">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
            <span>Occupancy</span>
            <span className="text-slate-800 font-mono">{orgData?.bedCount || 0}/100 Units</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${orgData?.bedCount || 0}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusToggle({ label, active }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <div className={`w-11 h-6 rounded-full p-1 transition-all shadow-inner ${active ? 'bg-field-green' : 'bg-slate-200'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

function ResponderItem({ name, status, time }: any) {
  return (
    <div className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm shadow-sm text-slate-400">👤</div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-field-green">{status}</p>
        </div>
      </div>
      <span className="text-[9px] font-black text-slate-300">{time}</span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin mb-6" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Initialising Command Terminal...</p>
    </div>
  );
}