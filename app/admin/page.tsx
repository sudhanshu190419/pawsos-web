"use client";

// Prevent prerendering - Firebase must initialize at runtime
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 🔥 Added for redirects
import { auth, db } from "../lib/firebase"; // 🔥 Make sure auth is exported from here
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";

import LiveSOSFeed from "../components/LiveSOSFeed";
import PendingApprovals from "../components/PendingApprovals";
import VolunteerApprovals from "../components/VolunteerApprovals";
import VetApprovals from "../components/VetApprovals"; 


export default function AdminDashboard() {
  const router = useRouter();
  
  // 🔥 NEW: Security State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);

  // Existing UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); 
  
  const [pendingNGOCount, setPendingNGOCount] = useState(0);
  const [activeSOSCount, setActiveSOSCount] = useState(0);
  const [pendingVetCount, setPendingVetCount] = useState(0);

  // 🔥 THE SECURITY GATEKEEPER
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if this logged-in user actually has admin rights
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdminAuthorized(true);
          } else {
            console.warn("Access Denied: User is not an admin.");
            router.push("/"); // Kick to home page
          }
        } catch (error) {
          console.error("Error verifying admin status:", error);
          router.push("/");
        }
      } else {
        // Not logged in at all
        router.push("/login"); // or "/" depending on your setup
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

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

    return () => {
      unsubNGO();
      unsubSOS();
      unsubVet();
    };
  }, [isAdminAuthorized]); // 🔥 Dependency added


  // 🔥 LOADING SCREEN (Prevents UI flashing while checking credentials)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold tracking-wide">Verifying Secure Access...</p>
      </div>
    );
  }

  // 🔥 DOUBLE CHECK (If somehow they bypass loading, render nothing)
  if (!isAdminAuthorized) return null;


  // ... THE REST OF YOUR RETURN STATEMENT STAYS EXACTLY THE SAME ...
  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* SIDEBAR */}
      <aside className={`bg-slate-900 text-slate-300 w-64 flex-shrink-0 transition-all duration-300 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full absolute md:relative md:w-20 z-20"}`}>
        
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <span className={`text-white font-black text-xl tracking-tight ${!isSidebarOpen && "md:hidden"}`}>
            Animal<span className="text-orange-500">Sathi</span> <span className="text-xs bg-slate-800 px-2 py-1 rounded-md text-slate-400 ml-1">ADMIN</span>
          </span>
          <span className={`text-orange-500 text-2xl hidden ${!isSidebarOpen && "md:block"}`}>🐾</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
          <div onClick={() => setActiveTab("dashboard")}>
            <NavItem icon="📊" label="Dashboard" active={activeTab === "dashboard"} isOpen={isSidebarOpen} />
          </div>
          <div onClick={() => setActiveTab("sos")}>
            <NavItem icon="🚨" label="Live SOS Alerts" badge={activeSOSCount > 0 ? activeSOSCount : null} active={activeTab === "sos"} isOpen={isSidebarOpen} />
          </div>
          <div onClick={() => setActiveTab("ngos")}>
            <NavItem icon="🏢" label="NGO Approvals" badge={pendingNGOCount > 0 ? pendingNGOCount : null} active={activeTab === "ngos"} isOpen={isSidebarOpen} />
          </div>
          <div onClick={() => setActiveTab("volunteers")}>
            <NavItem icon="🦸‍♂️" label="Volunteers" active={activeTab === "volunteers"} isOpen={isSidebarOpen} />
          </div>
          <div onClick={() => setActiveTab("vets")}>
            <NavItem icon="🏥" label="Veterinarians" badge={pendingVetCount > 0 ? pendingVetCount : null} active={activeTab === "vets"} isOpen={isSidebarOpen} />
          </div>
          <div onClick={() => setActiveTab("shop")}>
            <NavItem icon="🛒" label="Shop Orders" active={activeTab === "shop"} isOpen={isSidebarOpen} />
          </div>
          
          
          
        </nav>

        {/* Admin Profile Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shrink-0">AD</div>
            <div className={`overflow-hidden transition-all ${!isSidebarOpen && "md:hidden"}`}>
              <p className="text-sm font-bold text-white truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate">admin@animalsathi.com</p>
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
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Command Center</h1>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-full hover:bg-orange-100 transition-colors">
              View Live Site
            </Link>
          </div>
        </header>

        {/* Dashboard Content (Scrollable) */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          
          {/* Top Stats Row (Always Visible) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon="🚨" title="Active SOS" value={activeSOSCount} trend="Requires Action" color="red" />
            <StatCard icon="🏢" title="Pending NGOs" value={pendingNGOCount} trend={pendingNGOCount > 0 ? "Requires review" : "All caught up"} color="orange" />
            <StatCard icon="❤️" title="Animals Rescued" value="1,248" trend="+15 this week" color="green" />
            <StatCard icon="🦸‍♂️" title="Volunteers" value="342" trend="+12 this month" color="blue" />
          </div>

          {/* DYNAMIC TAB CONTENT */}
          {activeTab === "dashboard" && (
            <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800">Live SOS Feed</h2>
                  <button onClick={() => setActiveTab("sos")} className="text-sm font-bold text-orange-600 hover:text-orange-700">View All</button>
                </div>
                <LiveSOSFeed />
              </div>
              <PendingApprovals />
            </div>
          )}

          {activeTab === "vets" && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300 h-[800px]">
               <VetApprovals />
            </div>
          )}

          {activeTab === "ngos" && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300 h-[800px]">
               <PendingApprovals />
            </div>
          )}

          {activeTab === "sos" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">All Live SOS Alerts</h2>
              </div>
              <LiveSOSFeed />
            </div>
          )}

          {activeTab === "volunteers" && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
              <VolunteerApprovals />
            </div>
          )}

          {activeTab === "shop" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">Shop Orders Management</h2>
              </div>
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4 opacity-50">🛒</div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Shop Module Coming Soon</h3>
                <p className="text-slate-500 max-w-md">
                  This section will track all your merchandise orders, donations, and shop inventory once the e-commerce features are connected.
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

function NavItem({ icon, label, active, badge, isOpen }: any) {
  return (
    <div className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors ${active ? "bg-orange-500 text-white" : "hover:bg-slate-800 text-slate-300"}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className={`font-bold text-sm truncate ${!isOpen && "md:hidden"}`}>{label}</span>
      </div>
      {badge ? (
        <span className={`bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ${!isOpen && "md:hidden"}`}>
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function StatCard({ icon, title, value, trend, color }: any) {
  const colorMap: Record<string, string> = {
    red: "bg-red-50 text-red-600 border-red-100",
    green: "bg-green-50 text-green-600 border-green-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black text-slate-800 mb-1">{value}</h3>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</p>
        <p className={`text-xs font-bold mt-2 ${color === 'red' || color === 'orange' ? 'text-orange-500' : 'text-slate-400'}`}>{trend}</p>
      </div>
    </div>
  );
}