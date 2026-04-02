"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { auth, db } from "./../lib/firebase";
import {
  onAuthStateChanged,
  User,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";

/* =========================================
   TYPES & INTERFACES
   ========================================= */

type TabId = "profile" | "reports" | "credentials" | "settings";
type VerificationStatus = "approved" | "rejected" | "pending";
type ReportStatus = "active" | "responding" | "resolved";
type UrgencyLevel = "critical" | "high" | "medium" | "low";

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

interface SosAlert {
  id: string;
  createdBy?: string;
  status?: ReportStatus;
  resolvedBy?: string;
  acceptedBy?: string;
  description?: string;
  address?: string;
  photoURL?: string;
  urgency?: UrgencyLevel;
  time?: { seconds: number; toDate: () => Date };
}

interface Toast {
  message: string;
  type: "success" | "error";
}

/* =========================================
   CUSTOM HOOKS
   ========================================= */

/** Centralizes all auth + Firestore profile fetching */
function useProfile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [vetData, setVetData] = useState<VetData | null>(null);
  const [ngoData, setNgoData] = useState<NgoData | null>(null);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }

      setUser(currentUser);

      // Fetch all three collections in parallel — no sequential awaits
      const [userSnap, vetSnap, ngoSnap] = await Promise.allSettled([
        getDoc(doc(db, "users", currentUser.uid)),
        getDoc(doc(db, "vets_web", currentUser.uid)),
        getDoc(doc(db, "ngos_web", currentUser.uid)),
      ]);

      if (userSnap.status === "fulfilled" && userSnap.value.exists()) {
        const data = userSnap.value.data() as UserData;
        setUserData(data);
        setIsVolunteer(data.role === "volunteer" && data.volunteerApproved === true);
      }
      if (vetSnap.status === "fulfilled" && vetSnap.value.exists()) {
        setVetData(vetSnap.value.data() as VetData);
      }
      if (ngoSnap.status === "fulfilled" && ngoSnap.value.exists()) {
        setNgoData(ngoSnap.value.data() as NgoData);
      }

      setLoading(false);
    });

    return unsub;
  }, [router]);

  const updateUserData = useCallback((patch: Partial<UserData>) => {
    setUserData((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const updateProfilePhoto = useCallback(
    (photoURL: string) => {
      if (user) setUser({ ...user, photoURL } as User);
    },
    [user]
  );

  return { user, userData, vetData, ngoData, isVolunteer, loading, updateUserData, updateProfilePhoto };
}

/** Real-time SOS counts scoped to the current user */
function useSosCounts(user: User | null, isVolunteer: boolean) {
  const [sosCount, setSosCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubSos = onSnapshot(
      query(collection(db, "sos_alerts"), where("createdBy", "==", user.uid)),
      (snap) => setSosCount(snap.size)
    );

    let unsubResolved = () => {};
    if (isVolunteer) {
      unsubResolved = onSnapshot(
        query(
          collection(db, "sos_alerts"),
          where("status", "==", "resolved"),
          where("resolvedBy", "==", user.uid)
        ),
        (snap) => setResolvedCount(snap.size)
      );
    }

    return () => {
      unsubSos();
      unsubResolved();
    };
  }, [user, isVolunteer]);

  return { sosCount, resolvedCount };
}

/** Real-time report list for the Reports tab */
function useReports(user: User | null, isVolunteer: boolean) {
  const [reports, setReports] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Use refs so the merge function always sees the latest arrays
  // without needing to be re-subscribed when the other query updates.
  const createdRef = useRef<SosAlert[]>([]);
  const acceptedRef = useRef<SosAlert[]>([]);

  const merge = useCallback(() => {
    const seen = new Set<string>();
    const merged: SosAlert[] = [];
    for (const item of [...createdRef.current, ...acceptedRef.current]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    merged.sort((a, b) => (b.time?.seconds ?? 0) - (a.time?.seconds ?? 0));
    setReports(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsub1 = onSnapshot(
      query(collection(db, "sos_alerts"), where("createdBy", "==", user.uid)),
      (snap) => {
        createdRef.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SosAlert));
        merge();
      }
    );

    let unsub2 = () => {};
    if (isVolunteer) {
      unsub2 = onSnapshot(
        query(collection(db, "sos_alerts"), where("acceptedBy", "==", user.uid)),
        (snap) => {
          acceptedRef.current = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SosAlert));
          merge();
        }
      );
    }

    return () => {
      unsub1();
      unsub2();
    };
  }, [user, isVolunteer, merge]);

  return { reports, loading };
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
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200000] px-6 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
        toast.type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      <span>{toast.type === "success" ? "✅" : "❌"}</span>
      {toast.message}
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

  // Sync tab if URL changes (e.g. navbar dropdown)
  useEffect(() => {
    const tab = searchParams.get("tab") as TabId | null;
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  // Toast state (replaces alert())
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isEditModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isEditModalOpen]);

  const openEditModal = useCallback(() => {
    setEditPhone(userData?.phone ?? "");
    setEditCity(userData?.city ?? "");
    setIsEditModalOpen(true);
  }, [userData]);

  // FIXED: the original had `digitCount === 10 || digitCount === 10` — a no-op duplicate.
  // Correct: allow 10-digit local OR 12-digit with country code (e.g. 919876543210).
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
      {/* Header gradient */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-orange-400 to-orange-600 w-full relative">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-20 md:-mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">

          {/* ── SIDEBAR ── */}
          <aside className="w-full md:w-1/3 lg:w-1/4">
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 text-center sticky top-24">
              <input
                type="file"
                id="avatarUpload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <img
                  src={
                    user.photoURL ??
                    "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c&size=128"
                  }
                  alt="Profile"
                  className={`w-32 h-32 mx-auto rounded-full border-4 border-white shadow-lg object-cover bg-orange-50 transition-opacity ${
                    isUploading ? "opacity-40" : "opacity-100"
                  }`}
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
                  className="absolute bottom-0 right-0 bg-orange-500 text-white w-10 h-10 rounded-full border-2 border-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-sm disabled:bg-slate-400"
                >
                  ✏️
                </button>
              </div>

              <h2 className="text-xl font-bold text-slate-800 truncate">
                {user.displayName ?? "Animal Lover"}
              </h2>
              <p className="text-sm text-slate-500 truncate mb-6">{user.email}</p>

              {/* Dynamic badge */}
              <div
                className={`inline-flex items-center gap-2 border px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 shadow-sm ${userBadge.classes}`}
              >
                <span className={`w-2 h-2 rounded-full animate-pulse ${userBadge.dot}`} />
                {userBadge.label}
              </div>

              {/* Nav */}
              <nav className="flex flex-col gap-2 text-left border-t border-slate-100 pt-6">
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
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col gap-8">
            {activeTab === "profile" && (
              <ProfileContent
                user={user}
                isVolunteer={isVolunteer}
                sosCount={sosCount}
                resolvedCount={resolvedCount}
                userData={userData}
                vetData={vetData}
                ngoData={ngoData}
                onEditClick={openEditModal}
              />
            )}
            {activeTab === "reports" && <ReportsContent user={user} isVolunteer={isVolunteer} />}
            {activeTab === "settings" && <SettingsContent user={user} showToast={showToast} />}
            {isVolunteer && activeTab === "credentials" && <CredentialsContent userData={userData} />}
          </div>
        </div>
      </div>

      {/* Edit Modal — rendered in body via portal */}
      {isEditModalOpen &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <div
              className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-[100000] animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-slate-800">Update Profile</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl" aria-label="Close">×</button>
              </div>
              <p className="text-slate-500 text-sm mb-6">Fill in your details to stay connected with the rescue team.</p>

              <div className="space-y-5">
                <div>
                  <label htmlFor="phone-input" className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                  <input
                    id="phone-input"
                    type="tel"
                    maxLength={15}
                    placeholder="+91 XXXXX XXXXX"
                    className={`w-full mt-1 bg-white rounded-2xl px-5 py-3 outline-none transition-colors text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal border-2 ${
                      !isValidPhone && editPhone.length > 0
                        ? "border-red-500 focus:border-red-500"
                        : "border-slate-200 focus:border-orange-500"
                    }`}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                  {!isValidPhone && editPhone.length > 0 && (
                    <p className="text-red-600 text-xs font-black mt-1.5 ml-2">
                      ⚠️ Enter a valid 10-digit number (or 12 with country code)
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="city-input" className="text-xs font-bold text-slate-500 uppercase ml-1">City / Location</label>
                  <input
                    id="city-input"
                    type="text"
                    placeholder="e.g. New Delhi"
                    className="w-full mt-1 bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-orange-500 transition-colors text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  disabled={isSaving || !isValidPhone}
                  className="flex-[2] bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Toast */}
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

/* =========================================
   TAB CONTENT COMPONENTS
   ========================================= */

function ProfileContent({
  user,
  isVolunteer,
  sosCount,
  resolvedCount,
  userData,
  vetData,
  ngoData,
  onEditClick,
}: {
  user: User;
  isVolunteer: boolean;
  sosCount: number;
  resolvedCount: number;
  userData: UserData | null;
  vetData: VetData | null;
  ngoData: NgoData | null;
  onEditClick: () => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatBox icon="🚨" value={sosCount} label="SOS Reported" />
        {isVolunteer ? (
          <StatBox icon="🐕" value={resolvedCount} label="Animals Helped" />
        ) : (
          <a
            href="/volunteer-form"
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border border-orange-200 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🤝</div>
            <div className="text-lg font-black text-orange-700">Become a Volunteer</div>
            <div className="text-xs font-bold text-orange-600 uppercase tracking-wide mt-1">Join the rescue team →</div>
          </a>
        )}
      </div>

      {/* Personal details card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800">Personal Info</h3>
          <button
            onClick={onEditClick}
            className="text-sm font-bold text-orange-500 hover:text-orange-600 border border-orange-200 hover:border-orange-400 px-4 py-2 rounded-xl transition-colors"
          >
            Edit ✏️
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailField label="Display Name" value={user.displayName ?? "—"} />
          <DetailField label="Email" value={user.email ?? "—"} />
          <DetailField label="Phone" value={userData?.phone ?? "Not set"} />
          <DetailField label="City" value={userData?.city ?? "Not set"} />
        </div>
      </div>

      {/* NGO card */}
      {ngoData && (
        <div className="mt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">NGO Partner Profile</h3>
          <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-bold text-slate-800 text-lg">Partnership Status</span>
              <StatusPill status={ngoData.verificationStatus} />
            </div>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl border border-orange-100">🏢</div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">{ngoData.ngoName ?? "NGO Details"}</p>
                  <p className="text-sm text-slate-500 mt-1">{ngoData.fullAddress ?? "No address provided"}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Operational Capacity</p>
              <div className="flex flex-wrap gap-4">
                <CapacityBadge emoji="🚑" label="Ambulance" active={!!ngoData.hasAmbulance} activeClass="bg-red-50 border-red-200 text-red-700" />
                <CapacityBadge emoji="🏡" label="Shelter" active={!!ngoData.hasShelter} activeClass="bg-emerald-50 border-emerald-200 text-emerald-700" />
              </div>
            </div>
            <a
              href={ngoData.regCert}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl border border-slate-200 group-hover:bg-purple-50 transition-colors">📄</div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Registration Certificate</p>
                  <p className="text-sm text-slate-500 mt-1">Tap to view uploaded document</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-purple-500 group-hover:text-white transition-all">→</div>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function ReportsContent({ user, isVolunteer }: { user: User; isVolunteer: boolean }) {
  const { reports, loading } = useReports(user, isVolunteer);
  const [reportTab, setReportTab] = useState<"All" | "Active" | "Resolved">("All");

  const filtered = useMemo(
    () =>
      reports.filter((r) => {
        if (reportTab === "Active") return r.status !== "resolved";
        if (reportTab === "Resolved") return r.status === "resolved";
        return true;
      }),
    [reports, reportTab]
  );

  const countFor = useCallback(
    (tab: "All" | "Active" | "Resolved") =>
      reports.filter((r) => {
        if (tab === "Active") return r.status !== "resolved";
        if (tab === "Resolved") return r.status === "resolved";
        return true;
      }).length,
    [reports]
  );

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">My SOS Reports</h3>

      <div className="flex gap-4 mb-6 border-b border-slate-200 pb-px">
        {(["All", "Active", "Resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setReportTab(tab)}
            className={`pb-3 px-2 font-semibold text-sm transition-colors border-b-2 ${
              reportTab === tab
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab} ({countFor(tab)})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading your reports…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <div className="text-4xl mb-3">📄</div>
            <p className="font-semibold text-slate-700">No cases found</p>
            <p className="text-sm">Cases will appear here when reported</p>
          </div>
        ) : (
          filtered.map((item) => <ReportCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

function SettingsContent({
  user,
  showToast,
}: {
  user: User;
  showToast: (message: string, type?: Toast["type"]) => void;
}) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isGoogleUser = useMemo(
    () => user.providerData.some((p) => p.providerId === "google.com"),
    [user]
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch {
      showToast("Failed to log out.", "error");
    }
  }, [router, showToast]);

  const executeGoogleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      router.push("/auth");
    } catch {
      showToast("Failed to delete account. Log out and back in, then try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  }, [user, router, showToast]);

  const executePasswordDelete = useCallback(async () => {
    if (!password) return;
    setIsDeleting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      router.push("/auth");
    } catch {
      showToast("Incorrect password or failed to delete account.", "error");
    } finally {
      setIsDeleting(false);
    }
  }, [user, password, router, showToast]);

  const handleDeleteClick = useCallback(() => {
    if (isGoogleUser) {
      if (confirm("This will permanently delete your account and all data. Proceed?")) {
        executeGoogleDelete();
      }
    } else {
      setShowDeleteModal(true);
    }
  }, [isGoogleUser, executeGoogleDelete]);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span>⚙️</span> Account Actions
        </h2>
        <button
          onClick={handleLogout}
          className="w-full group flex justify-between items-center px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-200 hover:bg-red-50 transition-all font-bold text-slate-700 hover:text-red-600 shadow-sm"
        >
          <span className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 group-hover:bg-red-200 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-slate-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            Log Out
          </span>
          <span className="text-slate-400 group-hover:text-red-400 transition-colors transform group-hover:translate-x-1">→</span>
        </button>
      </div>

      <div className="bg-red-50/50 rounded-3xl p-8 border border-red-100">
        <h2 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-600 mb-6">
          Once you delete your account, there is no going back. All your SOS reports and data will be permanently removed.
        </p>
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="bg-white border-2 border-red-200 text-red-600 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
        >
          {isDeleting ? "Deleting…" : "Delete Account"}
        </button>
      </div>

      {showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-2xl font-black text-red-600 mb-2">Confirm Deletion</h3>
              <p className="text-slate-500 text-sm mb-6">Enter your password to permanently delete your account.</p>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-red-500 transition-colors text-slate-900 font-bold mb-8"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setPassword(""); }}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executePasswordDelete}
                  disabled={isDeleting || !password}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50"
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function CredentialsContent({ userData }: { userData: UserData | null }) {
  const idCardUrl = userData?.idCardPath ?? userData?.idcardPath ?? userData?.id_card_path;
  const certUrl = userData?.certificatePath ?? userData?.certPath;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
      <h3 className="text-2xl font-bold text-slate-800 mb-2">My Credentials</h3>
      <p className="text-slate-500 mb-8 text-sm">View and download your official PawSOS volunteer documents.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CredentialCard
          emoji="💳"
          title="Volunteer ID Card"
          description={idCardUrl ? "Your official identification for field rescues." : "Not issued yet."}
          url={idCardUrl}
          theme="slate"
        />
        <CredentialCard
          emoji="🎓"
          title="Volunteer Certificate"
          description={certUrl ? "Official recognition of your service." : "Not available yet."}
          url={certUrl}
          theme="orange"
        />
      </div>
    </div>
  );
}

/* =========================================
   REUSABLE UI PRIMITIVES
   ========================================= */

function SidebarButton({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-orange-50 text-orange-600 shadow-sm border border-orange-100"
          : "text-slate-600 hover:bg-slate-50 border border-transparent hover:text-slate-900"
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

function StatBox({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-black text-slate-800">{value}</div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500 mb-1">{label}</p>
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium">{value}</div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  resolved: "bg-green-100 text-green-700",
  responding: "bg-teal-100 text-teal-700",
  active: "bg-orange-100 text-orange-700",
};

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

function ReportCard({ item }: { item: SosAlert }) {
  const statusClass = STATUS_STYLES[item.status ?? "active"] ?? "bg-blue-100 text-blue-700";
  const urgencyClass = URGENCY_COLORS[item.urgency ?? "low"] ?? "bg-green-500";

  const formattedDate = useMemo(() => {
    if (!item.time?.toDate) return "Unknown time";
    const d = item.time.toDate();
    return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }, [item.time]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col md:flex-row">
      <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 relative overflow-hidden rounded-xl m-4 md:m-5">
        <img
          src={item.photoURL ?? "https://via.placeholder.com/400x300?text=No+Image"}
          alt="SOS Report"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2 gap-4">
            <h3 className="font-bold text-slate-800 text-lg md:text-xl leading-tight line-clamp-2 flex-1">
              {item.description ?? "Emergency Reported"}
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${statusClass}`}>
              {item.status ?? "active"}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${urgencyClass}`} />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              {item.urgency ?? "medium"} priority
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-slate-400 mt-0.5">📍</span>
            <span className="line-clamp-2">{item.address ?? "Location not specified"}</span>
          </p>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <span className="text-slate-400">🕒</span>
            {formattedDate}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status?: VerificationStatus }) {
  const styles =
    status === "approved" ? "bg-green-100 text-green-700 border-green-200" :
    status === "rejected" ? "bg-red-100 text-red-700 border-red-200" :
    "bg-amber-100 text-amber-700 border-amber-200";
  const label = status === "approved" ? "Verified" : status === "rejected" ? "Rejected" : "Pending Review";
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${styles}`}>
      {label}
    </span>
  );
}

function CapacityBadge({ emoji, label, active, activeClass }: { emoji: string; label: string; active: boolean; activeClass: string }) {
  return (
    <div className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${active ? activeClass : "bg-slate-50 border-slate-200 text-slate-400"}`}>
      {emoji} {label} {active ? "Active" : "None"}
    </div>
  );
}

function CredentialCard({
  emoji,
  title,
  description,
  url,
  theme,
}: {
  emoji: string;
  title: string;
  description: string;
  url?: string;
  theme: "slate" | "orange";
}) {
  const active = !!url;
  const iconBg = active
    ? theme === "slate" ? "bg-slate-100 text-slate-800" : "bg-orange-100 text-orange-600"
    : "bg-slate-200 text-slate-400";
  const borderBg = active
    ? theme === "slate" ? "border-slate-300 bg-white shadow-md hover:shadow-lg hover:-translate-y-1" : "border-orange-200 bg-orange-50/30 shadow-md hover:shadow-lg hover:-translate-y-1"
    : "border-slate-200 bg-slate-50 opacity-70";
  const btnClass = active
    ? theme === "slate" ? "bg-slate-800 text-white hover:bg-slate-900" : "bg-orange-500 text-white hover:bg-orange-600"
    : "bg-slate-200 text-slate-400 cursor-not-allowed";

  return (
    <div className={`relative p-6 rounded-3xl border transition-all duration-300 flex flex-col ${borderBg}`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 shadow-inner ${iconBg}`}>
        {emoji}
      </div>
      <h3 className="font-bold text-slate-800 text-lg mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-6 flex-1">{description}</p>
      {active ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`block w-full py-3 text-center rounded-xl font-bold text-sm transition-colors shadow-sm ${btnClass}`}>
          View Document →
        </a>
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