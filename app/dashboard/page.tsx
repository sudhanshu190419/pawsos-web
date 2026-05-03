"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { auth, db } from "./../lib/firebase";
import { updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "./hooks/useProfile";

import { useSosCounts } from "./hooks/useSosCounts";
import ProfileContent from "./components/ProfileContent";
import ReportsContent from "./components/ReportsContent";
import SettingsContent from "./components/SettingsContent";

/* =========================================
   TYPES & INTERFACES
   ========================================= */

type TabId = "profile" | "reports" | "credentials" | "settings";
type VerificationStatus = "approved" | "rejected" | "pending";

interface UserData {
  role?: string;
  volunteerApproved?: boolean;
  phone?: string;
  city?: string;
  photoURL?: string;
  idCardPath?: string;
  idcardPath?: string;
  id_card_path?: string;
  certificatePath?: string;
  certPath?: string;
}

interface VetData {
  verificationStatus?: VerificationStatus;
  [key: string]: unknown;
}

interface NgoData {
  verificationStatus?: VerificationStatus;
  ngoName?: string;
  fullAddress?: string;
  hasAmbulance?: boolean;
  hasShelter?: boolean;
  regCert?: string;
  [key: string]: unknown;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

/* =========================================
   TOAST COMPONENT
   ========================================= */

function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200000] px-6 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 w-[90%] md:w-auto max-w-sm justify-center ${
        toast.type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      <span>{toast.type === "success" ? "✅" : "❌"}</span>
      <span className="truncate">{toast.message}</span>
    </div>
  );
}

/* =========================================
   PAGE SHELL
   ========================================= */

function ProfilePageContent() {
  const { user, userData, vetData, ngoData, isVolunteer, loading, updateUserData, updateProfilePhoto } =
    useProfile();
  const { sosCount, resolvedCount } = useSosCounts(user, isVolunteer);

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) ?? "profile"
  );

  useEffect(() => {
    const tab = searchParams.get("tab") as TabId | null;
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    document.body.style.overflow = isEditModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isEditModalOpen]);

  const openEditModal = useCallback(() => {
    setEditPhone(userData?.phone ?? "");
    setEditCity(userData?.city ?? "");
    setIsEditModalOpen(true);
  }, [userData]);

  const phoneDigits = useMemo(() => editPhone.replace(/\D/g, "").length, [editPhone]);
  const isValidPhone = editPhone.trim() === "" || phoneDigits === 10 || phoneDigits === 12;

  const handleSaveDetails = useCallback(async () => {
    if (!user || !isValidPhone) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), { phone: editPhone, city: editCity }, { merge: true });
      updateUserData({ phone: editPhone, city: editCity });
      setIsEditModalOpen(false);
      showToast("Profile updated successfully!");
    } catch {
      showToast("Failed to update profile.", "error");
    } finally {
      setIsSaving(false);
    }
  }, [user, isValidPhone, editPhone, editCity, updateUserData, showToast]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image must be smaller than 5MB.", "error");
        return;
      }
      setIsUploading(true);
      try {
        const storageRef = ref(getStorage(), `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await updateProfile(user, { photoURL: downloadURL });
        await setDoc(doc(db, "users", user.uid), { photoURL: downloadURL }, { merge: true });
        updateProfilePhoto(downloadURL);
        showToast("Photo updated!");
      } catch {
        showToast("Failed to upload image.", "error");
      } finally {
        setIsUploading(false);
      }
    },
    [user, updateProfilePhoto, showToast]
  );

  const userBadge = useMemo(() => {
    if (ngoData?.verificationStatus === "approved")
      return { label: "Verified NGO", classes: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.8)]" };
    if (vetData?.verificationStatus === "approved")
      return { label: "Verified Veterinarian", classes: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)]" };
    if (isVolunteer)
      return { label: "Verified Rescuer", classes: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" };
    return { label: "Community Member", classes: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" };
  }, [ngoData, vetData, isVolunteer]);

  if (loading) return <FullScreenSpinner />;
  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <div className="h-32 sm:h-40 md:h-64 bg-gradient-to-r from-orange-400 to-orange-600 w-full relative">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 md:-mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* ── SIDEBAR ── */}
          <aside className="w-full md:w-1/3 lg:w-1/4">
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 text-center sticky md:top-24">
              <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleImageUpload} />
              
              <div className="relative inline-block mb-4">
                <img
                  src={user.photoURL ?? "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c&size=128"}
                  alt="Profile"
                  className={`w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full border-4 border-white shadow-lg object-cover bg-orange-50 transition-opacity ${isUploading ? "opacity-40" : "opacity-100"}`}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => document.getElementById("avatarUpload")?.click()}
                  disabled={isUploading}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 bg-orange-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-sm disabled:bg-slate-400"
                >
                  <span className="text-sm md:text-base">✏️</span>
                </button>
              </div>

              <h2 className="text-xl font-bold text-slate-800 truncate px-2">{user.displayName ?? "Animal Lover"}</h2>
              <p className="text-sm text-slate-500 truncate mb-4 md:mb-6 px-2">{user.email}</p>

              <div className={`inline-flex items-center gap-2 border px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-4 md:mb-6 shadow-sm ${userBadge.classes}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${userBadge.dot}`} />
                {userBadge.label}
              </div>

              {/* Mobile-friendly horizontal scroll nav */}
              <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto hide-scrollbar text-left border-t border-slate-100 pt-4 md:pt-6 pb-2 md:pb-0 px-1">
                <SidebarButton icon="👤" label="Personal Info" isActive={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
                <SidebarButton icon="📋" label="My SOS Reports" isActive={activeTab === "reports"} onClick={() => setActiveTab("reports")} />
                {isVolunteer && (
                  <>
                    <SidebarButton icon="🎖️" label="My Credentials" isActive={activeTab === "credentials"} onClick={() => setActiveTab("credentials")} />
                    <SidebarButton icon="⚙️" label="Account Settings" isActive={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
                  </>
                )}
              </nav>
            </div>
          </aside>

          {/* ── CONTENT ── */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col gap-6">
            {activeTab === "profile" && <ProfileContent user={user} isVolunteer={isVolunteer} sosCount={sosCount} resolvedCount={resolvedCount} userData={userData} vetData={vetData} ngoData={ngoData} onEditClick={openEditModal} />}
            {activeTab === "reports" && <ReportsContent user={user} isVolunteer={isVolunteer} />}
            {activeTab === "settings" && <SettingsContent user={user} showToast={showToast} />}
            {isVolunteer && activeTab === "credentials" && <CredentialsContent userData={userData} />}
          </div>
        </div>
      </div>

      {isEditModalOpen &&
        createPortal(
          <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ zIndex: 99999 }}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <div
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative z-[100000] animate-in slide-in-from-bottom sm:zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800">Update Profile</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-3xl leading-none" aria-label="Close">×</button>
              </div>
              <p className="text-slate-500 text-sm mb-6">Fill in your details to stay connected with the rescue team.</p>

              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label htmlFor="phone-input" className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                  <input
                    id="phone-input"
                    type="tel"
                    maxLength={15}
                    placeholder="+91 XXXXX XXXXX"
                    className={`w-full mt-1 bg-white rounded-2xl px-4 sm:px-5 py-3 outline-none transition-colors text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal border-2 ${
                      !isValidPhone && editPhone.length > 0 ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-orange-500"
                    }`}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                  {!isValidPhone && editPhone.length > 0 && (
                    <p className="text-red-600 text-xs font-black mt-1.5 ml-2">⚠️ Enter a valid 10-digit number</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city-input" className="text-xs font-bold text-slate-500 uppercase ml-1">City / Location</label>
                  <input
                    id="city-input"
                    type="text"
                    placeholder="e.g. New Delhi"
                    className="w-full mt-1 bg-white border-2 border-slate-200 rounded-2xl px-4 sm:px-5 py-3 outline-none focus:border-orange-500 transition-colors text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pb-4 sm:pb-0">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  disabled={isSaving || !isValidPhone}
                  className="flex-[2] bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {toast && <ToastNotification toast={toast} onDismiss={() => setToast(null)} />}
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <ProfilePageContent />
    </Suspense>
  );
}

// 1. REPLACED: CredentialsContent
function CredentialsContent({ userData }: { userData: UserData | null }) {
  const idCardPath = userData?.idCardPath ?? userData?.idcardPath ?? userData?.id_card_path;
  const certPath = userData?.certificatePath ?? userData?.certPath;

  return (
    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 min-h-[300px] md:min-h-[500px]">
      <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">My Credentials</h3>
      <p className="text-slate-500 mb-6 md:mb-8 text-sm">View and download your official PawSOS volunteer documents.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <CredentialCard 
          emoji="💳" 
          title="Volunteer ID Card" 
          description={idCardPath ? "Your official identification for field rescues." : "Not issued yet."} 
          storagePath={idCardPath} 
          theme="slate" 
        />
        <CredentialCard 
          emoji="🎓" 
          title="Volunteer Certificate" 
          description={certPath ? "Official recognition of your service." : "Not available yet."} 
          storagePath={certPath} 
          theme="orange" 
        />
      </div>
    </div>
  );
}

// 2. UNTOUCHED: Keep your SidebarButton exactly as is
function SidebarButton({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 md:whitespace-normal md:w-full ${
        isActive ? "bg-orange-50 text-orange-600 shadow-sm border border-orange-100" : "text-slate-600 hover:bg-slate-50 border border-transparent hover:text-slate-900"
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

// 3. REPLACED: CredentialCard
function CredentialCard({ 
  emoji, 
  title, 
  description, 
  storagePath, 
  theme 
}: { 
  emoji: string; 
  title: string; 
  description: string; 
  storagePath?: string; 
  theme: "slate" | "orange" 
}) {
  const [isFetching, setIsFetching] = useState(false);
  
  const active = !!storagePath;
  const iconBg = active ? theme === "slate" ? "bg-slate-100 text-slate-800" : "bg-orange-100 text-orange-600" : "bg-slate-200 text-slate-400";
  const borderBg = active ? theme === "slate" ? "border-slate-300 bg-white shadow-md hover:-translate-y-1" : "border-orange-200 bg-orange-50/30 shadow-md hover:-translate-y-1" : "border-slate-200 bg-slate-50 opacity-70";
  const btnClass = active ? theme === "slate" ? "bg-slate-800 text-white hover:bg-slate-900" : "bg-orange-500 text-white hover:bg-orange-600" : "bg-slate-200 text-slate-400 cursor-not-allowed";

  const handleOpenDocument = async () => {
    if (!storagePath) return;
    setIsFetching(true);
    
    try {
      // 1. Safety Check: If it's ALREADY a full web URL (from your old backend), just open it directly.
      if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
        window.open(storagePath, "_blank", "noopener,noreferrer");
        setIsFetching(false);
        return;
      }

      // 2. Otherwise, treat it as a Firebase Storage path and fetch the secure URL
      const storage = getStorage();
      const fileRef = ref(storage, storagePath);
      const url = await getDownloadURL(fileRef);
      window.open(url, "_blank", "noopener,noreferrer");
      
    } catch (error) {
      console.error("Error fetching document:", error);
      alert("Could not load the document. It might still be generating or the file doesn't exist in Storage.");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className={`relative p-5 md:p-6 rounded-3xl border transition-all duration-300 flex flex-col ${borderBg}`}>
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl mb-4 shadow-inner ${iconBg}`}>
        {emoji}
      </div>
      <h3 className="font-bold text-slate-800 text-base md:text-lg mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-6 flex-1">{description}</p>
      
      {active ? (
        <button 
          onClick={handleOpenDocument}
          disabled={isFetching}
          className={`block w-full py-3 text-center rounded-xl font-bold text-sm transition-colors shadow-sm ${btnClass} ${isFetching ? 'opacity-75 cursor-wait' : ''}`}
        >
          {isFetching ? "Opening..." : "View Document →"}
        </button>
      ) : (
        <button disabled className={`w-full py-3 rounded-xl font-bold text-sm ${btnClass}`}>Unavailable</button>
      )}
    </div>
  );
}
function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );
}

// Global CSS fix for hide-scrollbar (add this to your globals.css if not already present)
// .hide-scrollbar::-webkit-scrollbar { display: none; }
// .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }