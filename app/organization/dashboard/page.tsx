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
  X,
  Heart
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auto-open sidebar on desktop, close on mobile
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
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
    <div className="min-h-screen bg-[#FAFAF8] flex text-[#1c1c13] selection:bg-primary/10 selection:text-primary">
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#1c1c13]/40 backdrop-blur-sm z-10 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - Warm Brand Theme */}
      <aside className={`bg-white border-r border-[#e5e3d4] w-64 flex-shrink-0 transition-all duration-300 flex flex-col ${isSidebarOpen ? "translate-x-0 fixed z-30" : "-translate-x-full fixed z-20"} md:relative md:z-auto md:translate-x-0 ${isSidebarOpen ? "md:w-64" : "md:w-20"}`}>
        
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-[#e5e3d4]">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`font-black text-lg tracking-tight flex items-center gap-3 ${!isSidebarOpen && "md:hidden"}`}>
              <span className="text-primary"><Heart className="w-5 h-5" /></span>
              <span className="text-[#1c1c13]">Animal<span className="text-primary">Sathi</span></span>
            </span>
            <span className={`text-primary hidden ${!isSidebarOpen && "md:flex"}`}><Heart className="w-5 h-5" /></span>
          </div>
          {/* Mobile close button inside sidebar */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-[#727970] hover:bg-[#f6f4e5] rounded-xl transition-all border border-transparent hover:border-[#e5e3d4] -mr-1"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-0.5 px-3">
          <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} isOpen={isSidebarOpen} />
          <NavItem icon={Radio} label="Live Feed" active={activeTab === "feed"} onClick={() => setActiveTab("feed")} isOpen={isSidebarOpen} badge={activeAlerts > 0 ? activeAlerts : null} />
          <NavItem icon={Users} label="Team Dispatch" active={activeTab === "team"} onClick={() => setActiveTab("team")} isOpen={isSidebarOpen} />
          <NavItem icon={Activity} label="Facility HUD" active={activeTab === "facility"} onClick={() => setActiveTab("facility")} isOpen={isSidebarOpen} />
          <NavItem icon={Settings} label="System Config" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} isOpen={isSidebarOpen} />
        </nav>

        {/* Org Profile Footer */}
        <div className="p-4 border-t border-[#e5e3d4]">
          <div className="flex items-center gap-3 bg-[#f6f4e5] p-3 rounded-2xl border border-[#e5e3d4]">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              {orgData?.name?.[0] || "O"}
            </div>
            <div className={`overflow-hidden transition-all ${!isSidebarOpen && "md:hidden"}`}>
              <p className="text-xs font-bold text-[#1c1c13] truncate">{orgData?.name || "Organization"}</p>
              <button onClick={() => signOut(auth)} className="text-[10px] font-semibold text-[#727970] hover:text-primary transition-colors flex items-center gap-1 mt-0.5">
                LogOut <LogOut className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-[#e5e3d4] flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 flex items-center justify-center text-[#727970] hover:bg-[#f6f4e5] rounded-xl transition-all border border-transparent hover:border-[#e5e3d4]"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>              <h1 className="text-sm font-bold uppercase tracking-[0.15em] text-[#727970] hidden sm:block">Dashboard / {activeTab}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-secondary/5 border border-secondary/10 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span className="text-[8px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest hidden sm:inline">System Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 md:p-10 lg:p-12 relative z-10">
          
          {activeTab === "overview" && (
            <div className="space-y-12 animate-fadeUp">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-6">
                <div className="xl:col-span-7">
                  <FamilyStatusCard orgData={orgData} responderCount={teamMembers.length} />
                </div>
                <div className="xl:col-span-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                    <StatCard icon={AlertCircle} label="Active SOS" value={activeAlerts} color="red" trend="Immediate Action" />
                    <StatCard icon={Clock} label="Avg. Response" value="12m" color="amber" trend="Operational Speed" />
                    <StatCard icon={Ambulance} label="Dispatched" value="02" color="blue" trend="Active Rescues" />
                    <StatCard icon={Building2} label="Bed Capacity" value={`${orgData?.bedCount || 0}%`} color="green" trend="Total Units" />
                  </div>
                </div>
              </div>

              {/* Main Operational Area */}
              <div className="space-y-8">
                <div className="bg-white border border-[#e5e3d4] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#e5e3d4] flex justify-between items-center bg-[#FAFAF8]">
                    <h2 className="text-sm sm:text-lg font-bold text-[#1c1c13]">Emergency Telemetry Map</h2>
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

                <div className="bg-white border border-[#e5e3d4] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#e5e3d4] flex flex-col gap-3 sm:gap-4 bg-[#FAFAF8]">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm sm:text-lg font-bold text-[#1c1c13]">Responder Activity</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        value={employeeSearch}
                        onChange={(e) => {
                          setEmployeeSearch(e.target.value);
                          setEmployeeVisibleCount(10);
                        }}
                        placeholder="Search by any value"
                        className="w-full bg-white border border-[#e5e3d4] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#424941] placeholder:text-[#a0a89a] outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#424941]">
                      <thead className="bg-white text-[#727970] uppercase text-[10px] font-bold border-b border-[#e5e3d4]">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 cursor-pointer text-[8px] sm:text-[10px]" onClick={() => toggleEmployeeSort("priority")}>Priority</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 cursor-pointer text-[8px] sm:text-[10px]" onClick={() => toggleEmployeeSort("name")}>Member</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 cursor-pointer text-[8px] sm:text-[10px]" onClick={() => toggleEmployeeSort("role")}>Role</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 cursor-pointer text-[8px] sm:text-[10px]" onClick={() => toggleEmployeeSort("status")}>Status</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 cursor-pointer text-[8px] sm:text-[10px]" onClick={() => toggleEmployeeSort("sos")}>Assigned SOS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ebe1]">
                        {visibleEmployeeActivity.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-[#a0a89a] font-medium">
                              No responders found.
                            </td>
                          </tr>
                        ) : (
                          visibleEmployeeActivity.map((row) => (
                            <tr key={row.id} className="hover:bg-[#f6f4e5]/40 transition-colors">
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                  row.priority === 3 ? "bg-red-50 text-red-600" :
                                  row.priority === 2 ? "bg-amber-50 text-amber-600" :
                                  row.priority === 1 ? "bg-[#f6f4e5] text-[#424941]" :
                                  "bg-[#FAFAF8] text-[#a0a89a]"
                                }`}>
                                  {row.priority === 3 ? "Critical" : row.priority === 2 ? "High" : row.priority === 1 ? "Normal" : "None"}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                <p className="font-bold text-[#1c1c13] text-xs sm:text-sm">{row.name}</p>
                                <p className="text-[8px] sm:text-[10px] text-[#a0a89a] uppercase tracking-widest hidden sm:block">{row.task || "No task"}</p>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#727970] bg-[#f6f4e5] border border-[#e5e3d4] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                                  {row.role}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                <span className="text-[10px] sm:text-xs font-bold text-[#424941]">{row.status}</span>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                <p className="font-semibold text-[#424941] truncate max-w-[80px] sm:max-w-[220px] text-xs sm:text-sm">{row.sosTitle || "Unassigned"}</p>
                                {row.sosUrgency && (
                                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#a0a89a] hidden sm:block">{row.sosUrgency}</p>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {employeeActivity.length > visibleEmployeeActivity.length && (
                    <div className="p-4 flex justify-center border-t border-[#e5e3d4] bg-white">
                      <button
                        onClick={() => setEmployeeVisibleCount((prev) => prev + 10)}
                        className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#1c1c13] text-white hover:bg-primary transition-colors"
                      >
                        Load 10 more
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#e5e3d4] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#e5e3d4] flex justify-between items-center bg-[#FAFAF8]">
                    <h2 className="text-sm sm:text-lg font-bold text-[#1c1c13]">Emergency Telemetry List</h2>
                    <button onClick={() => setActiveTab("feed")} className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity whitespace-nowrap">Full Screen Feed</button>
                  </div>
                  <div className="p-0 sm:p-2">
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
            <div className="bg-white border border-[#e5e3d4] rounded-2xl shadow-sm overflow-hidden flex flex-col animate-fadeUp min-h-[700px]">                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#e5e3d4] flex justify-between items-center bg-[#FAFAF8]">
                <h2 className="text-sm sm:text-lg font-bold text-[#1c1c13]">Operational Feed</h2>
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1c1c13] tracking-tight">Team Dispatch</h2>
                  <p className="text-[#727970] font-medium">Manage responders and medical staff</p>
                </div>
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="bg-primary text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:-translate-y-0.5 transition-all shimmer-btn self-start"
                >
                  + Add Member
                </button>
              </div>

              {/* PENDING JOIN REQUESTS */}
              {pendingRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary ml-1">Pending Join Requests ({pendingRequests.length})</h3>
                  <div className="grid gap-4">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="bg-white border border-[#e5e3d4] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center text-xl font-bold">
                            {req.userName?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-[#1c1c13]">{req.userName || "User Request"}</p>
                            <p className="text-xs text-[#727970]">{req.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleRejectRequest(req.id)} className="px-6 py-2.5 rounded-xl font-bold text-xs text-[#a0a89a] hover:bg-[#f6f4e5] transition-colors">Reject</button>
                          <button onClick={() => handleApproveRequest(req)} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-container transition-all shadow-sm">Approve Member</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#e5e3d4] rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#FAFAF8] border-b border-[#e5e3d4]">
                    <tr>
                      <th className="px-3 sm:px-8 py-3 sm:py-5 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#727970]">Member</th>
                      <th className="px-3 sm:px-8 py-3 sm:py-5 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#727970]">Role</th>
                      <th className="px-3 sm:px-8 py-3 sm:py-5 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#727970]">Status</th>
                      <th className="px-3 sm:px-8 py-3 sm:py-5 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#727970]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ebe1]">
                    {teamMembers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-sm text-[#a0a89a] font-medium">
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
              <h2 className="text-3xl font-bold text-[#1c1c13] tracking-tight">Facility HUD</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <FacilityControlHUD orgData={orgData} />
                <div className="bg-white border border-[#e5e3d4] rounded-2xl shadow-sm p-10 flex flex-col justify-center items-center text-center">
                  <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6">
                    <Activity className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1c1c13] mb-2">System Health</h3>
                  <p className="text-[#727970] text-sm font-medium leading-relaxed">All medical telemetry sensors are active and transmitting to the network.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fadeUp">
              <h2 className="text-3xl font-bold text-[#1c1c13] tracking-tight">System Configuration</h2>
              <div className="bg-white border border-[#e5e3d4] rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#727970]">Public Profile</h3>
                  <div className="grid gap-4">
                    <label className="block">
                      <span className="text-xs font-bold text-[#727970] mb-2 block ml-1">Display Name</span>
                      <input type="text" defaultValue={orgData?.orgName} className="w-full bg-[#f6f4e5] border border-[#e5e3d4] rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all text-[#1c1c13]" />
                    </label>
                  </div>
                </div>
                <div className="pt-8 border-t border-[#e5e3d4] flex justify-end">
                  <button className="bg-[#1c1c13] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary transition-all">Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {showAddMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1c1c13]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-10 shadow-2xl border border-[#e5e3d4] animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-[#1c1c13] mb-2 tracking-tight">Add Team Member</h3>
            <p className="text-[#727970] text-sm font-medium mb-8">Invite a responder to join your organization.</p>
            
            <form onSubmit={handleAddMember} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#727970] ml-1">Member Email</label>
                <input 
                  name="email"
                  type="email" 
                  required
                  placeholder="name@example.com"
                  className="w-full bg-[#f6f4e5] border border-[#e5e3d4] rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all text-[#1c1c13] placeholder:text-[#a0a89a]" 
                />
                </div>
                <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#727970] ml-1">Operational Role</label>
                <select name="role" required className="w-full bg-[#f6f4e5] border border-[#e5e3d4] rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all appearance-none text-[#1c1c13]">
                  <option value="Senior Vet">Senior Vet</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Ambulance Driver">Ambulance Driver</option>
                  <option value="Rescue Volunteer">Rescue Volunteer</option>
                </select>
                </div>
                <div className="flex gap-4 pt-4">

                <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-sm text-[#727970] hover:bg-[#f6f4e5] transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:-translate-y-0.5 transition-all shimmer-btn">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1c1c13]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-10 shadow-2xl border border-[#e5e3d4] animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-[#1c1c13] mb-2 tracking-tight">Manage Member</h3>
            <p className="text-[#727970] text-sm font-medium mb-8">Update role or access for {selectedMember.displayName || selectedMember.name || "Member"}.</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#727970] ml-1">Operational Role</label>
                <select id="member-role-select" defaultValue={selectedMember.orgRole || "Staff"} className="w-full bg-[#f6f4e5] border border-[#e5e3d4] rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/40 transition-all appearance-none text-[#1c1c13]">
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
                  className="w-full bg-[#1c1c13] text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-primary transition-all disabled:opacity-60"
                >
                  {isUpdatingMember ? "Saving..." : "Save Permissions"}
                </button>
                <button 
                  onClick={handleRevokeMember}
                  disabled={isUpdatingMember}
                  className="w-full bg-red-50 text-red-600 px-6 py-4 rounded-xl font-bold text-sm hover:bg-red-100 transition-all disabled:opacity-60"
                >
                  Revoke Access
                </button>
                <button onClick={() => setSelectedMember(null)} className="w-full py-2 text-xs font-bold uppercase tracking-widest text-[#a0a89a] hover:text-[#424941] transition-colors">Close Record</button>
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
  const statusColor = status === "Active" ? "bg-secondary" : status === "On Duty" ? "bg-primary" : "bg-[#e5e3d4]";
  
  return (
    <tr className="group hover:bg-[#f6f4e5]/40 transition-colors"><td className="px-3 sm:px-8 py-3 sm:py-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] sm:text-sm shrink-0">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-[#1c1c13] truncate">{name}</p>
            <p className="text-[8px] sm:text-[10px] font-medium text-[#727970] truncate hidden sm:block">{email}</p>
          </div>
        </div>
      </td><td className="px-3 sm:px-8 py-3 sm:py-5">
        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#727970] bg-[#f6f4e5] border border-[#e5e3d4] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
          {role}
        </span>
      </td><td className="px-3 sm:px-8 py-3 sm:py-5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${statusColor} animate-pulse shrink-0`} />
          <span className="text-[10px] sm:text-xs font-bold text-[#1c1c13]">{status}</span>
        </div>
      </td><td className="px-3 sm:px-8 py-3 sm:py-5 text-right">
        <button 
          onClick={onManage}
          className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#a0a89a] hover:text-primary transition-colors"
        >
          Manage
        </button>
      </td></tr>
  );
}


function NavItem({ icon: Icon, label, active, onClick, isOpen, badge }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${active ? "bg-primary/10 text-primary font-bold" : "text-[#727970] hover:bg-[#f6f4e5] hover:text-[#1c1c13] font-medium"}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-primary" : "text-[#a0a89a] group-hover:text-[#424941]"}`} />
        <span className={`text-sm tracking-tight truncate ${!isOpen && "md:hidden"}`}>{label}</span>
      </div>
      {badge ? (
        <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, trend }: any) {
  const colorMap: Record<string, string> = {
    red: "bg-red-50 text-red-600 border-red-100",
    green: "bg-secondary/10 text-secondary border-secondary/20",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-primary/10 text-primary border-primary/20",
  };

  const glowMap: Record<string, string> = {
    red: "bg-red-50",
    green: "bg-secondary/5",
    blue: "bg-blue-50",
    amber: "bg-primary/5",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e5e3d4] shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
      {/* Dynamic Glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl transition-colors duration-500 ${glowMap[color]} group-hover:opacity-100 opacity-50`}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:rotate-3 group-hover:scale-105 ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-bold text-[#1c1c13] mb-1 tracking-tight">{value}</h3>
        <p className="text-[10px] font-bold text-[#727970] uppercase tracking-[0.2em]">{label}</p>
        <div className="flex items-center gap-2 mt-3">
          <div className={`w-1.5 h-1.5 rounded-full ${color === 'red' || color === 'amber' ? 'bg-primary animate-pulse' : 'bg-[#e5e3d4]'}`} />
          <p className={`text-[10px] font-bold uppercase tracking-widest ${color === 'red' || color === 'amber' ? 'text-primary' : 'text-[#a0a89a]'}`}>{trend}</p>
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
    { key: "ambulance", icon: Ambulance, label: "Ambulance Fleet", value: hasAmbulance ? "Operational" : "Offline", tone: hasAmbulance ? "ok" : "idle" },
    { key: "intake", icon: Radio, label: "Rescue Triage", value: "Live", tone: "ok" },
    { key: "responders", icon: Users, label: "On-Call Family", value: respondersOnline ? `${responderCount} active` : "No roster", tone: respondersOnline ? "ok" : "idle" },
    { key: "hq", icon: Zap, label: "Command Link", value: "Secure", tone: "ok" },
  ] as const;

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl border border-[#e5e3d4] shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group relative overflow-hidden h-full">
      {/* Ambient Glow Elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors duration-700"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] group-hover:bg-secondary/10 transition-colors duration-700"></div>
      
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.06] transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
        <Building2 className="w-40 h-40 -mr-16 -mt-16 text-primary" />
      </div>

      <div className="relative z-10 space-y-4 sm:space-y-8 lg:space-y-10">          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border border-primary/20 bg-primary/5 text-primary shadow-sm group-hover:rotate-3 transition-all duration-500 shrink-0">
                <Building2 className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 truncate">Sanctuary Overview</p>
                <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#1c1c13] tracking-tight truncate">Family Status</h3>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#e5e3d4] bg-white shadow-sm">
              <div className={`w-1.5 h-1.5 rounded-full ${respondersOnline ? "bg-secondary animate-pulse" : "bg-[#e5e3d4]"}`}></div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#727970] whitespace-nowrap">
                {respondersOnline ? `${responderCount} responders` : "Offline"}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border shadow-sm ${hasAmbulance ? "bg-secondary/10 border-secondary/20 text-secondary" : "bg-[#f6f4e5] border-[#e5e3d4] text-[#a0a89a]"}`}>
              <Ambulance className="w-3 h-3 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                {hasAmbulance ? "Fleet Ready" : "Fleet Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 sm:gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            {featureRows.map((row) => (
              <StatusFeatureRow key={row.key} icon={row.icon} label={row.label} value={row.value} tone={row.tone} />
            ))}
          </div>

          <div className="rounded-2xl border border-[#e5e3d4] bg-[#FAFAF8] p-4 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#727970] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Current Load
                </p>
                <p className="text-sm font-mono font-bold text-[#1c1c13]">
                  {occupancy}<span className="text-[#a0a89a] ml-1">/ 100</span>
                </p>
              </div>
              
              <div className="w-full h-4 bg-white rounded-full p-0.5 border border-[#e5e3d4] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-secondary to-secondary/70 rounded-full transition-all duration-1000 ease-out relative" 
                  style={{ width: `${occupancyPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-6 sm:mt-10 relative z-10">
              <div className="bg-white border border-[#e5e3d4] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
                <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#a0a89a]">Density</p>
                <p className="text-lg sm:text-2xl font-bold text-secondary mt-0.5 sm:mt-1">{occupancyPercent}%</p>
              </div>
              <div className="bg-white border border-[#e5e3d4] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
                <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#a0a89a]">Network</p>
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-secondary animate-pulse"></div>
                  <p className="text-sm sm:text-xl md:text-2xl font-bold text-[#1c1c13]">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusFeatureRow({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "ok" | "idle" }) {
  const isOk = tone === "ok";
  const colorClass = isOk ? "text-secondary" : "text-[#a0a89a]";
  const borderClass = isOk ? "border-secondary/20 bg-white" : "border-[#e5e3d4] bg-[#f6f4e5]";
  const iconBg = isOk ? "bg-secondary/5" : "bg-[#f0ebe1]";

  return (
    <div className={`flex items-center justify-between gap-2 sm:gap-4 rounded-2xl border p-3 sm:p-4 shadow-sm hover:translate-x-0.5 hover:shadow-md transition-all duration-300 group/row ${borderClass}`}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${iconBg} group-hover/row:scale-110`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass}`} />
        </div>
        <span className="text-[12px] sm:text-[14px] font-bold text-[#424941] group-hover/row:text-[#1c1c13] transition-colors truncate">{label}</span>
      </div>
      <span className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.05em] text-right shrink-0 ${colorClass}`}>{value}</span>
    </div>
  );
}

function FacilityControlHUD({ orgData }: any) {
  return (
    <div className="bg-white border border-[#e5e3d4] rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#e5e3d4] bg-[#FAFAF8]">
        <h2 className="text-sm sm:text-lg font-bold text-[#1c1c13]">Facility Status</h2>
      </div>
      <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
        <StatusToggle label="Ambulance Service" active={orgData?.hasAmbulance} />
        <StatusToggle label="Emergency Intake" active={true} />
        <div className="pt-6 border-t border-[#e5e3d4]">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#727970] mb-3">
            <span>Occupancy</span>
            <span className="text-[#1c1c13] font-mono">{orgData?.bedCount || 0}/100 Units</span>
          </div>
          <div className="w-full h-2 bg-[#f0ebe1] rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${orgData?.bedCount || 0}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusToggle({ label, active }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-[#424941]">{label}</span>
      <div className={`w-11 h-6 rounded-full p-1 transition-all ${active ? 'bg-secondary' : 'bg-[#e5e3d4]'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-[#e5e3d4] border-t-primary rounded-full animate-spin mb-6" />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#727970] animate-pulse">Loading dashboard...</p>
    </div>
  );
}