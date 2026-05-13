"use client";

// Prevent prerendering - Firebase must initialize at runtime
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Building2, 
  Users, 
  ShoppingBag, 
  LogOut, 
  ChevronRight, 
  Menu, 
  ExternalLink,
  ShieldCheck,
  Heart,
  Stethoscope
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";

import LiveSOSFeed from "../components/LiveSOSFeed";
import PendingApprovals from "../components/PendingApprovals";
import VolunteerApprovals from "../components/VolunteerApprovals";
import VetApprovals from "../components/VetApprovals"; 
import OrganizationApprovals from "../components/OrganizationApprovals";

import { useUserMeta } from "../hooks/useUserMeta";

export default function AdminDashboard() {
  const router = useRouter();
  
  const { currentUser: user, userMeta, loading: isCheckingAuth } = useUserMeta();
  const isAdminAuthorized = userMeta.role === "admin";

  useEffect(() => {
    if (!isCheckingAuth && !isAdminAuthorized) {
      router.push("/");
    }
  }, [isCheckingAuth, isAdminAuthorized, router]);

  // Existing UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); 
  
  const [pendingNGOCount, setPendingNGOCount] = useState(0);
  const [activeSOSCount, setActiveSOSCount] = useState(0);
  const [pendingVetCount, setPendingVetCount] = useState(0);
  const [pendingOrgCount, setPendingOrgCount] = useState(0);

  // Existing Data Fetching (Only runs if authorized)
  useEffect(() => {
    if (!isAdminAuthorized) return; // Don't fetch if not admin

    const ngoQuery = query(collection(db, "ngos_web"), where("verificationStatus", "==", "pending_review"));
    const unsubNGO = onSnapshot(ngoQuery, (snapshot) => {
      setPendingNGOCount(snapshot.size);
    });

    const sosQuery = query(collection(db, "sos_alerts"), where("status", "in", ["active", "critical"]));
    const unsubSOS = onSnapshot(sosQuery, (snapshot) => {
      setActiveSOSCount(snapshot.size);
    });
    
    const vetQuery = query(collection(db, "users"), where("vetStatus", "==", "pending"));
    const unsubVet = onSnapshot(vetQuery, (snapshot) => {
      setPendingVetCount(snapshot.size);
    });

    const orgQuery = query(collection(db, "pending_organizations"), where("status", "==", "pending_review"));
    const unsubOrg = onSnapshot(orgQuery, (snapshot) => {
      setPendingOrgCount(snapshot.size);
    });

    return () => {
      unsubNGO();
      unsubSOS();
      unsubVet();
      unsubOrg();
    };
  }, [isAdminAuthorized]);


  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Securing Terminal...</p>
      </div>
    );
  }

  if (!isAdminAuthorized) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 selection:bg-primary/10 selection:text-primary">

      {/* SIDEBAR */}
      <aside className={`bg-slate-900 text-white w-64 flex-shrink-0 transition-all duration-300 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full absolute md:relative md:w-20 z-20"}`}>

        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <span className={`text-white font-black text-xl tracking-tighter flex items-center gap-2 ${!isSidebarOpen && "md:hidden"}`}>
            <span className="text-primary"><ShieldCheck className="w-6 h-6" /></span> AnimalSathi
          </span>
          <span className={`text-primary hidden ${!isSidebarOpen && "md:block"}`}><ShieldCheck className="w-6 h-6" /></span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-8 flex flex-col gap-1 px-4">
          <div onClick={() => setActiveTab("dashboard")}>
            <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "dashboard"} isOpen={isSidebarOpen} />
          </div>
          <div onClick={() => setActiveTab("sos")}>
            <NavItem icon={AlertCircle} label="SOS Alerts" badge={activeSOSCount > 0 ? activeSOSCount : null} active={activeTab === "sos"} isOpen={isSidebarOpen} colorClass="text-rescue-red" />
          </div>
          <div onClick={() => setActiveTab("organizations")}>
            <NavItem icon={ShieldCheck} label="Enterprise" badge={pendingOrgCount > 0 ? pendingOrgCount : null} active={activeTab === "organizations"} isOpen={isSidebarOpen} colorClass="text-[#9C3E23]" />
          </div>
          <div onClick={() => setActiveTab("ngos")}>
            <NavItem icon={Building2} label="NGO Partners" badge={pendingNGOCount > 0 ? pendingNGOCount : null} active={activeTab === "ngos"} isOpen={isSidebarOpen} />
          </div>
          <div onClick={() => setActiveTab("volunteers")}>
            <NavItem icon={Users} label="Volunteers" active={activeTab === "volunteers"} isOpen={isSidebarOpen} />
          </div>
          <div onClick={() => setActiveTab("vets")}>
            <NavItem icon={Stethoscope} label="Veterinarians" badge={pendingVetCount > 0 ? pendingVetCount : null} active={activeTab === "vets"} isOpen={isSidebarOpen} />
          </div>
          <div onClick={() => setActiveTab("shop")}>
            <NavItem icon={ShoppingBag} label="Marketplace" active={activeTab === "shop"} isOpen={isSidebarOpen} />
          </div>
        </nav>

        {/* Admin Profile Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-primary/20">AD</div>
            <div className={`overflow-hidden transition-all ${!isSidebarOpen && "md:hidden"}`}>
              <p className="text-xs font-black text-white truncate">Admin Terminal</p>
              <button onClick={() => signOut(auth)} className="text-[10px] font-bold text-white/40 hover:text-primary transition-colors flex items-center gap-1 mt-0.5">
                Sign Out <LogOut className="w-2.5 h-2.5" />
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
              {isSidebarOpen ? <Menu className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 hidden sm:block">Command Center</h1>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 border border-primary/10 px-5 py-2.5 rounded-xl hover:bg-primary/10 transition-all flex items-center gap-2">
              View Live Site <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 md:p-10 lg:p-12 bg-slate-50/50">

          {/* Top Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard icon={AlertCircle} title="Active SOS" value={activeSOSCount} trend="Immediate Action" color="red" />
            <StatCard icon={ShieldCheck} title="Pending Orgs" value={pendingOrgCount} trend={pendingOrgCount > 0 ? "Review Required" : "System Clear"} color="amber" />
            <StatCard icon={Heart} title="Lives Saved" value="1,248" trend="+15 this week" color="green" />
            <StatCard icon={Users} title="Rescuers" value="342" trend="+12 this month" color="blue" />
          </div>

          {/* DYNAMIC TAB CONTENT */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-8 animate-fadeUp">
              <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800">Live SOS Feed</h2>
                  <button onClick={() => setActiveTab("sos")} className="text-xs font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">View Operational Map</button>
                </div>
                <div className="p-2 overflow-auto">
                  <LiveSOSFeed />
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden h-fit">
                <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800">Org Requests</h2>
                </div>
                <div className="p-4">
                  <OrganizationApprovals />
                </div>
              </div>
            </div>
          )}

          {activeTab === "organizations" && (
            <div className="max-w-4xl mx-auto animate-fadeUp">
               <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[600px]">
                 <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
                   <h2 className="text-lg font-bold text-slate-800">Enterprise Partner Verification</h2>
                 </div>
                 <div className="p-6">
                    <OrganizationApprovals />
                 </div>
               </div>
            </div>
          )}

          {activeTab === "vets" && (
            <div className="max-w-4xl mx-auto animate-fadeUp">
               <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[600px]">
                 <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
                   <h2 className="text-lg font-bold text-slate-800">Veterinarian Verification</h2>
                 </div>
                 <div className="p-6">
                    <VetApprovals />
                 </div>
               </div>
            </div>
          )}

          {activeTab === "ngos" && (
            <div className="max-w-4xl mx-auto animate-fadeUp">
               <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[600px]">
                 <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
                   <h2 className="text-lg font-bold text-slate-800">NGO Partner Onboarding</h2>
                 </div>
                 <div className="p-6">
                    <PendingApprovals />
                 </div>
               </div>
            </div>
          )}

          {activeTab === "sos" && (
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col animate-fadeUp min-h-[700px]">
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">Operational SOS Map</h2>
              </div>
              <div className="flex-1 p-2">
                <LiveSOSFeed />
              </div>
            </div>
          )}

          {activeTab === "volunteers" && (
            <div className="max-w-4xl mx-auto animate-fadeUp">
              <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[600px]">
                <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800">Volunteer Management</h2>
                </div>
                <div className="p-6">
                   <VolunteerApprovals />
                </div>
              </div>
            </div>
          )}

          {activeTab === "shop" && (
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col animate-fadeUp">
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">Shop Orders Management</h2>
              </div>
              <div className="p-24 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/5 flex items-center justify-center mb-8 border border-primary/10">
                  <ShoppingBag className="w-10 h-10 text-primary opacity-40" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">Marketplace Terminal Offline</h3>
                <p className="text-slate-500 max-w-md font-medium leading-relaxed">
                  This secure gateway will track merchandise orders, medical supply logistics, and vendor inventory once the commerce layer is activated.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* --- ADMIN UI HELPER COMPONENTS --- */

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: number | null;
  isOpen: boolean;
  colorClass?: string;
}

function NavItem({ icon: Icon, label, active, badge, isOpen, colorClass = "" }: NavItemProps) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 group border border-transparent ${active ? "bg-primary text-white shadow-lg shadow-primary/20 border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]" : "hover:bg-white/10 text-white/60 hover:text-white"}`}>
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

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend: string;
  color: "red" | "green" | "blue" | "amber";
}

function StatCard({ icon: Icon, title, value, trend, color }: StatCardProps) {
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
        <h3 className="text-4xl font-black text-slate-800 mb-1 font-mono tracking-tighter">{value}</h3>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
        <div className="flex items-center gap-1.5 mt-3">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${color === 'red' || color === 'amber' ? 'bg-primary' : 'bg-slate-300'}`} />
          <p className={`text-[10px] font-bold ${color === 'red' || color === 'amber' ? 'text-primary' : 'text-slate-400'}`}>{trend}</p>
        </div>
      </div>
    </div>
  );
}