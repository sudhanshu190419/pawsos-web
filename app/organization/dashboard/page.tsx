"use client";

import { useState, useEffect, useMemo } from "react";
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
import LiveMap from "../../components/LiveMap";
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
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeVisibleCount, setEmployeeVisibleCount] = useState(10);
  const [employeeSortKey, setEmployeeSortKey] = useState<"priority" | "name" | "role" | "status" | "sos">("priority");
  const [employeeSortDir, setEmployeeSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push("/");
      }
    }
  }, [currentUser, userMeta, authLoading, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || !orgData?.ownerId) return;
    if (currentUser.uid !== orgData.ownerId) {
      router.push("/dashboard");
    }
  }, [authLoading, currentUser, orgData, router]);

  useEffect(() => {
    if (!userMeta.organizationId) return;

    // Listen to Organization Data
    const unsubOrg = onSnapshot(doc(db, "organizations", userMeta.organizationId), (snap) => {
      if (snap.exists()) setOrgData(snap.data());
    });

    // Listen to Active Alerts
    const qAlerts = query(collection(db, "sos_alerts"), where("status", "==", "active"));
    const unsubAlerts = onSnapshot(qAlerts, (snap) => setActiveAlerts(snap.size));

    // Live SOS feed (for telemetry + map)
    const qAllAlerts = query(collection(db, "sos_alerts"));
    const unsubAllAlerts = onSnapshot(qAllAlerts, (snap) => {
      setSosAlerts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Team members (real data only)
    const qTeam = query(
      collection(db, "users"),
      where("organizationId", "==", userMeta.organizationId),
      where("orgApproved", "==", true)
    );
    const unsubTeam = onSnapshot(qTeam, (snap) => {
      setTeamMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

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
      unsubAllAlerts();
      unsubTeam();
      unsubReqs();
    };
  }, [userMeta.organizationId]);

  const getMemberCoords = (member: any) => {
    const loc = member.lastLocation;
    const latitude = typeof loc?.latitude === "number" ? loc.latitude : null;
    const longitude = typeof loc?.longitude === "number" ? loc.longitude : null;
    return { latitude, longitude };
  };

  const responders = teamMembers.map((member) => {
    const coords = getMemberCoords(member);
    return {
      id: member.id,
      name: member.displayName || member.name || member.email || "Responder",
      role: member.orgRole || "Staff",
      status: member.status || member.volunteerStatus || "Available",
      task: member.activeTask || member.currentTask || member.task || "",
      ...coords,
    };
  });

  const centerLocation = useMemo(() => {
    const hq = orgData?.hqLocation;
    const latitude = typeof hq?.latitude === "number" ? hq.latitude : null;
    const longitude = typeof hq?.longitude === "number" ? hq.longitude : null;
    if (typeof latitude === "number" && typeof longitude === "number") {
      return { latitude, longitude };
    }
    return null;
  }, [orgData]);

  const mapAlerts = sosAlerts.map((alert) => {
    const rawLocation = alert.location;
    const latitude = typeof alert.latitude === "number" ? alert.latitude : (typeof rawLocation?.latitude === "number" ? rawLocation.latitude : null);
    const longitude = typeof alert.longitude === "number" ? alert.longitude : (typeof rawLocation?.longitude === "number" ? rawLocation.longitude : null);
    return {
      id: alert.id,
      description: alert.description,
      address: alert.address,
      urgency: alert.urgency,
      latitude,
      longitude,
    };
  });

  const getUrgencyRank = (urgency?: string) => {
    const value = (urgency || "").toLowerCase();
    if (value === "critical") return 3;
    if (value === "high") return 2;
    if (value === "normal") return 1;
    return 0;
  };

  const employeeActivity = useMemo(() => {
    const rows = teamMembers.map((member) => {
      const assignedAlerts = sosAlerts.filter((alert) => alert.assignedResponderId === member.id);
      const topAlert = assignedAlerts.sort((a, b) => getUrgencyRank(b.urgency) - getUrgencyRank(a.urgency))[0];
      return {
        id: member.id,
        name: member.displayName || member.name || member.email || "Responder",
        role: member.orgRole || "Staff",
        status: member.status || member.volunteerStatus || "Available",
        task: member.activeTask || member.currentTask || member.task || "",
        sosTitle: topAlert?.title || topAlert?.description || "",
        sosUrgency: topAlert?.urgency || "",
        priority: getUrgencyRank(topAlert?.urgency),
      };
    });

    const query = employeeSearch.trim().toLowerCase();
    const filtered = query
      ? rows.filter((row) =>
          [row.name, row.role, row.status, row.task, row.sosTitle, row.sosUrgency]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      : rows;

    const sorted = [...filtered].sort((a, b) => {
      const dir = employeeSortDir === "asc" ? 1 : -1;
      if (employeeSortKey === "priority") {
        return (a.priority - b.priority) * dir;
      }
      if (employeeSortKey === "name") {
        return a.name.localeCompare(b.name) * dir;
      }
      if (employeeSortKey === "role") {
        return a.role.localeCompare(b.role) * dir;
      }
      if (employeeSortKey === "status") {
        return a.status.localeCompare(b.status) * dir;
      }
      return a.sosTitle.localeCompare(b.sosTitle) * dir;
    });

    return sorted;
  }, [teamMembers, sosAlerts, employeeSearch, employeeSortKey, employeeSortDir]);

  const visibleEmployeeActivity = useMemo(() => {
    return employeeActivity.slice(0, employeeVisibleCount);
  }, [employeeActivity, employeeVisibleCount]);

  const toggleEmployeeSort = (key: "priority" | "name" | "role" | "status" | "sos") => {
    if (employeeSortKey === key) {
      setEmployeeSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      setEmployeeVisibleCount(10);
      return;
    }
    setEmployeeSortKey(key);
    setEmployeeSortDir("desc");
    setEmployeeVisibleCount(10);
  };

  const buildOrgEmpId = (orgId: string) => {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${orgId}-EMP-${suffix}`;
  };

  const handleSaveMember = async () => {
    if (!selectedMember?.id) return;
    setIsUpdatingMember(true);
    try {
      const roleEl = document.getElementById("member-role-select") as HTMLSelectElement | null;
      const nextRole = roleEl?.value || selectedMember.orgRole || "Staff";
      await updateDoc(doc(db, "users", selectedMember.id), { orgRole: nextRole });
      showGlobalToast("Permissions updated", "success");
      setSelectedMember(null);
    } catch (e: any) {
      showGlobalToast(e.message || "Failed to update member.", "error");
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleRevokeMember = async () => {
    if (!selectedMember?.id) return;
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    setIsUpdatingMember(true);
    try {
      await updateDoc(doc(db, "users", selectedMember.id), {
        orgApproved: false,
        organizationId: null,
        organizationName: null,
      });
      showGlobalToast("Member removed from team", "info");
      setSelectedMember(null);
    } catch (e: any) {
      showGlobalToast(e.message || "Failed to remove member.", "error");
    } finally {
      setIsUpdatingMember(false);
    }
  };

  if (authLoading) return <LoadingScreen />;
  if (currentUser && orgData?.ownerId && currentUser.uid !== orgData.ownerId) return null;

  const isOrgOwner = Boolean(currentUser?.uid && orgData?.ownerId && currentUser.uid === orgData.ownerId);

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
        orgRole: request.role || "member",
        orgEmpId: buildOrgEmpId(request.orgId)
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
              {/* Summary Cards */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-7">
                  <FamilyStatusCard orgData={orgData} responderCount={teamMembers.length} />
                </div>
                <div className="xl:col-span-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard icon={AlertCircle} label="Active SOS" value={activeAlerts} color="red" trend="Immediate Action" />
                    <StatCard icon={Clock} label="Avg. Response" value="12m" color="amber" trend="Operational Speed" />
                    <StatCard icon={Ambulance} label="Dispatched" value="02" color="blue" trend="Active Rescues" />
                    <StatCard icon={Building2} label="Bed Capacity" value={`${orgData?.bedCount || 0}%`} color="green" trend="Total Units" />
                  </div>
                </div>
              </div>

              {/* Main Operational Area */}
              <div className="space-y-8">
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                  <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Emergency Telemetry Map</h2>
                  </div>
                  <div className="p-4 h-[320px]">
                    <LiveMap
                      alerts={mapAlerts}
                      activeCase={activeCase}
                      setActiveCase={setActiveCase}
                      isExpanded={isMapExpanded}
                      setIsExpanded={setIsMapExpanded}
                      currentLocation={null}
                      responders={responders}
                      hqLocation={centerLocation}
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                  <div className="px-8 py-6 border-b border-slate-200 flex flex-col gap-4 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800">Responder Activity</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        value={employeeSearch}
                        onChange={(e) => {
                          setEmployeeSearch(e.target.value);
                          setEmployeeVisibleCount(10);
                        }}
                        placeholder="Search by any value"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-white text-slate-500 uppercase text-[10px] font-black border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 cursor-pointer" onClick={() => toggleEmployeeSort("priority")}>Priority</th>
                          <th className="px-6 py-4 cursor-pointer" onClick={() => toggleEmployeeSort("name")}>Member</th>
                          <th className="px-6 py-4 cursor-pointer" onClick={() => toggleEmployeeSort("role")}>Role</th>
                          <th className="px-6 py-4 cursor-pointer" onClick={() => toggleEmployeeSort("status")}>Status</th>
                          <th className="px-6 py-4 cursor-pointer" onClick={() => toggleEmployeeSort("sos")}>Assigned SOS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visibleEmployeeActivity.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                              No responders found.
                            </td>
                          </tr>
                        ) : (
                          visibleEmployeeActivity.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  row.priority === 3 ? "bg-red-50 text-red-600" :
                                  row.priority === 2 ? "bg-amber-50 text-amber-600" :
                                  row.priority === 1 ? "bg-slate-100 text-slate-600" :
                                  "bg-slate-50 text-slate-400"
                                }`}>
                                  {row.priority === 3 ? "Critical" : row.priority === 2 ? "High" : row.priority === 1 ? "Normal" : "None"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-800">{row.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{row.task || "No task"}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                                  {row.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-bold text-slate-700">{row.status}</span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-700 truncate max-w-[220px]">{row.sosTitle || "Unassigned"}</p>
                                {row.sosUrgency && (
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.sosUrgency}</p>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {employeeActivity.length > visibleEmployeeActivity.length && (
                    <div className="p-4 flex justify-center border-t border-slate-100 bg-white">
                      <button
                        onClick={() => setEmployeeVisibleCount((prev) => prev + 10)}
                        className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-primary transition-colors"
                      >
                        Load 10 more
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                  <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Emergency Telemetry List</h2>
                    <button onClick={() => setActiveTab("feed")} className="text-xs font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Full Screen Feed</button>
                  </div>
                  <div className="p-2">
                    <LiveSOSFeed
                      showDispatchControls
                      responders={responders}
                        isOwner={isOrgOwner}
                      centerLocation={centerLocation}
                      initialLimit={10}
                      pageSize={10}
                      showLoadMore
                    />
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
                <LiveSOSFeed
                  showDispatchControls
                  responders={responders}
                  isOwner={isOrgOwner}
                  centerLocation={centerLocation}
                  initialLimit={10}
                  pageSize={10}
                  showLoadMore
                />
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
                    {teamMembers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-sm text-slate-400 font-medium">
                          No team members found.
                        </td>
                      </tr>
                    ) : (
                      teamMembers.map((member) => (
                        <MemberRow
                          key={member.id}
                          name={member.displayName || member.name || "Responder"}
                          email={member.email || ""}
                          role={member.orgRole || "Staff"}
                          status={member.status || "Active"}
                          onManage={() => setSelectedMember(member)}
                        />
                      ))
                    )}
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
            <p className="text-slate-500 text-sm font-medium mb-8">Update role or access for {selectedMember.displayName || selectedMember.name || "Member"}.</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Operational Role</label>
                <select id="member-role-select" defaultValue={selectedMember.orgRole || "Staff"} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/50 transition-all appearance-none">
                  <option>Senior Vet</option>
                  <option>Dispatcher</option>
                  <option>Ambulance Driver</option>
                  <option>Rescue Volunteer</option>
                  <option>Staff</option>
                </select>
              </div>
              
              <div className="pt-4 space-y-3">
                <button 
                  onClick={handleSaveMember}
                  disabled={isUpdatingMember}
                  className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-primary transition-all disabled:opacity-60"
                >
                  {isUpdatingMember ? "Saving..." : "Save Permissions"}
                </button>
                <button 
                  onClick={handleRevokeMember}
                  disabled={isUpdatingMember}
                  className="w-full bg-rescue-red/5 text-rescue-red px-6 py-4 rounded-xl font-bold text-sm hover:bg-rescue-red/10 transition-all disabled:opacity-60"
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
    red: "bg-red-50 text-rescue-red border-red-100",
    green: "bg-secondary/5 text-secondary border-secondary/10",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-primary/5 text-primary border-primary/10",
  };

  const glowMap: Record<string, string> = {
    red: "bg-rescue-red/5",
    green: "bg-secondary/5",
    blue: "bg-blue-600/5",
    amber: "bg-primary/5",
  };

  return (
    <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
      {/* Dynamic Glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl transition-colors duration-500 ${glowMap[color]} group-hover:opacity-100 opacity-50`}></div>
      
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500">
        <Icon className="w-20 h-20 -mr-6 -mt-6 rotate-12" />
      </div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] ${colorMap[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-4xl font-display font-medium text-on-surface mb-1 tracking-tighter">{value}</h3>
        <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.25em]">{label}</p>
        <div className="flex items-center gap-2 mt-4">
          <div className={`w-1.5 h-1.5 rounded-full ${color === 'red' || color === 'amber' ? 'bg-primary animate-pulse' : 'bg-on-surface-variant/20'}`} />
          <p className={`text-[10px] font-bold uppercase tracking-widest ${color === 'red' || color === 'amber' ? 'text-primary' : 'text-on-surface-variant/40'}`}>{trend}</p>
        </div>
      </div>
    </div>
  );
}

function FamilyStatusCard({ orgData, responderCount }: { orgData: any; responderCount: number }) {
  const occupancy = typeof orgData?.occupancy === "number" ? orgData.occupancy : (typeof orgData?.bedCount === "number" ? orgData.bedCount : 0);
  const occupancyPercent = Math.min(100, Math.max(0, occupancy));
  const hasAmbulance = Boolean(orgData?.hasAmbulance);
  const respondersOnline = responderCount > 0;

  const featureRows = [
    {
      key: "ambulance",
      icon: Ambulance,
      label: "Ambulance Fleet",
      value: hasAmbulance ? "Operational" : "Offline",
      tone: hasAmbulance ? "ok" : "idle",
    },
    {
      key: "intake",
      icon: Radio,
      label: "Rescue Triage",
      value: "Live",
      tone: "ok",
    },
    {
      key: "responders",
      icon: Users,
      label: "On-Call Family",
      value: respondersOnline ? `${responderCount} active` : "No roster",
      tone: respondersOnline ? "ok" : "idle",
    },
    {
      key: "hq",
      icon: Zap,
      label: "Command Link",
      value: "Secure",
      tone: "ok",
    },
  ] as const;

  return (
    <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:shadow-[0_30px_60px_-12px_rgba(156,62,35,0.12)] transition-all duration-500 group relative overflow-hidden h-full">
      {/* Interactive Background Elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors duration-700"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] group-hover:bg-secondary/10 transition-colors duration-700"></div>
      
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
        <Building2 className="w-40 h-40 -mr-16 -mt-16 text-primary" />
      </div>

      <div className="relative z-10 space-y-8 lg:space-y-10">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border border-primary/20 bg-primary/5 text-primary shadow-[0_8px_20px_-6px_rgba(156,62,35,0.25)] group-hover:rotate-3 transition-all duration-500 shrink-0">
              <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary/50 truncate">Sanctuary Overview</p>
              <h3 className="text-2xl sm:text-3xl font-display font-medium text-on-surface tracking-tight mt-0.5 truncate">Family Status</h3>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border bg-white/60 border-white/80 backdrop-blur-md shadow-sm">
              <div className={`w-1.5 h-1.5 rounded-full ${respondersOnline ? "bg-secondary animate-pulse shadow-[0_0_8px_rgba(68,100,100,0.6)]" : "bg-on-surface-variant/20"}`}></div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest text-on-surface-variant whitespace-nowrap">
                {respondersOnline ? `${responderCount} responders` : "Offline"}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border backdrop-blur-md shadow-sm ${hasAmbulance ? "bg-secondary/10 border-secondary/20 text-secondary" : "bg-white/40 border-white/60 text-on-surface-variant/40"}`}>
              <Ambulance className="w-3 h-3 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap">
                {hasAmbulance ? "Fleet Ready" : "Fleet Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featureRows.map((row) => (
              <StatusFeatureRow
                key={row.key}
                icon={row.icon}
                label={row.label}
                value={row.value}
                tone={row.tone}
              />
            ))}
          </div>

          <div className="rounded-[2.5rem] border border-white/80 bg-gradient-to-br from-white/60 to-white/20 p-8 flex flex-col justify-between backdrop-blur-xl shadow-[inset_0_2px_10px_rgba(255,255,255,0.5),0_15px_30px_-10px_rgba(0,0,0,0.03)] relative overflow-hidden">
            {/* Subtle Inner Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Current Load
                </p>
                <p className="text-sm font-mono font-bold text-on-surface">
                  {occupancy}<span className="text-on-surface-variant/30 ml-1">/ 100</span>
                </p>
              </div>
              
              <div className="w-full h-4 bg-white/50 rounded-full p-0.5 border border-white/80 shadow-inner overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-secondary to-secondary/70 rounded-full transition-all duration-1000 ease-out relative" 
                  style={{ width: `${occupancyPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  {/* Highlight Line */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10 relative z-10">
              <div className="bg-white/80 border border-white rounded-2xl p-4 shadow-sm group/tile hover:bg-white transition-all duration-300">
                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">Density</p>
                <p className="text-2xl font-display font-medium text-secondary mt-1">{occupancyPercent}%</p>
              </div>
              <div className="bg-white/80 border border-white rounded-2xl p-4 shadow-sm group/tile hover:bg-white transition-all duration-300">
                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">Network</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(68,100,100,0.6)]"></div>
                  <p className="text-2xl font-display font-medium text-on-surface">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusFeatureRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: "ok" | "idle";
}) {
  const isOk = tone === "ok";
  const colorClass = isOk ? "text-secondary" : "text-on-surface-variant/40";
  const borderClass = isOk ? "border-secondary/20 bg-white/80" : "border-white/40 bg-white/20";
  const iconBg = isOk ? "bg-secondary/5" : "bg-on-surface-variant/5";

  return (
    <div className={`flex items-center justify-between gap-2 sm:gap-4 rounded-2xl border p-3 sm:p-4 shadow-sm hover:translate-x-1 hover:shadow-md transition-all duration-300 group/row ${borderClass} backdrop-blur-md`}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${iconBg} group-hover/row:scale-110`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass}`} />
        </div>
        <span className="text-[12px] sm:text-[14px] font-bold text-on-surface-variant/70 group-hover/row:text-on-surface transition-colors truncate">{label}</span>
      </div>
      <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.05em] sm:tracking-[0.1em] text-right shrink-0 ${colorClass}`}>{value}</span>
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