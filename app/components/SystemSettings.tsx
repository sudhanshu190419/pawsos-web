"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// 1. Strict Typing for the Settings Data
interface AppSettings {
  adminEmail: string;
  supportPhone: string;
  emailAlertsSOS: boolean;
  emailAlertsApprovals: boolean;
  maintenanceMode: boolean;
  autoApproveVets: boolean;
}

// 2. Strict Typing for Helper Components (Fixes the VS Code Errors!)
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  danger?: boolean;
}

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    adminEmail: "admin@animalsathi.com",
    supportPhone: "+91 0000000000",
    emailAlertsSOS: true,
    emailAlertsApprovals: false,
    maintenanceMode: false,
    autoApproveVets: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "platform_settings", "general");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "platform_settings", "general"), settings, { merge: true });
      alert("✅ Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("❌ Failed to save settings.");
    }
    setSaving(false);
  };

  // 🔥 Removed 'any' and restricted value to string or boolean
  const handleChange = (field: keyof AppSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-[600px]">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">System Settings</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your platform configurations and preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "💾 Save Changes"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30 p-4 space-y-2">
          <TabButton active={activeTab === "general"} onClick={() => setActiveTab("general")} icon="⚙️" label="General" />
          <TabButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} icon="🔔" label="Notifications" />
          <TabButton active={activeTab === "advanced"} onClick={() => setActiveTab("advanced")} icon="⚡" label="Advanced" />
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          
          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Contact Information</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Admin Email</label>
                    <input 
                      type="email" 
                      value={settings.adminEmail}
                      onChange={(e) => handleChange("adminEmail", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Support Phone</label>
                    <input 
                      type="text" 
                      value={settings.supportPhone}
                      onChange={(e) => handleChange("supportPhone", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Admin Email Alerts</h3>
                <p className="text-sm text-slate-500 mb-6">Choose what events trigger an email to your admin inbox.</p>
                
                <div className="space-y-4 max-w-2xl">
                  <ToggleRow 
                    label="Critical SOS Alerts" 
                    description="Get emailed immediately when a High or Critical SOS is reported."
                    checked={settings.emailAlertsSOS}
                    onChange={(val) => handleChange("emailAlertsSOS", val)}
                  />
                  <div className="h-px bg-slate-100 w-full"></div>
                  <ToggleRow 
                    label="New Pending Approvals" 
                    description="Get a daily digest of new NGOs, Vets, and Volunteers waiting for review."
                    checked={settings.emailAlertsApprovals}
                    onChange={(val) => handleChange("emailAlertsApprovals", val)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ADVANCED TAB (DANGER ZONE) */}
          {activeTab === "advanced" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Platform Controls</h3>
                <p className="text-sm text-slate-500 mb-6">Proceed with caution. These settings affect the live platform.</p>
                
                <div className="space-y-4 max-w-2xl">
                  <ToggleRow 
                    label="Auto-Approve Veterinarians" 
                    description="Skip the manual review process for Vets (Not Recommended)."
                    checked={settings.autoApproveVets}
                    onChange={(val) => handleChange("autoApproveVets", val)}
                    danger
                  />
                  <div className="h-px bg-slate-100 w-full"></div>
                  <ToggleRow 
                    label="Maintenance Mode" 
                    description="Temporarily disable new signups and SOS reporting while upgrading the app."
                    checked={settings.maintenanceMode}
                    onChange={(val) => handleChange("maintenanceMode", val)}
                    danger
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* --- HELPER COMPONENTS --- */

// 🔥 Applied the strict interface here
function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

// 🔥 Applied the strict interface here
function ToggleRow({ label, description, checked, onChange, danger = false }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-8 py-2">
      <div>
        <h4 className={`font-bold text-sm ${danger ? "text-red-600" : "text-slate-800"}`}>{label}</h4>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      
      <button 
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? (danger ? 'bg-red-500' : 'bg-slate-900') : 'bg-slate-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}