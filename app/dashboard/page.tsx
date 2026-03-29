  "use client";

  import { useEffect, useState } from "react";
  import { auth , db} from "./../lib/firebase"; // Adjust path to your firebase config
  import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
  import { useRouter, useSearchParams } from "next/navigation";
  import { doc, getDoc, collection, query, where, onSnapshot, setDoc } from "firebase/firestore";
  import { createPortal } from "react-dom";
  import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

  export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isVolunteer, setIsVolunteer] = useState(false);

    // NEW: States to hold the real data counts
    const [sosCount, setSosCount] = useState(0);
    const [resolvedCount, setResolvedCount] = useState(0);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);


  // Validation: True if empty (allowed to clear), OR has at least 10 numbers
  // NEW: Checks for EXACTLY 10 digits (or 12 if they type the '91' country code)
  const digitCount = editPhone.replace(/\D/g, "").length;
  const isValidPhone = editPhone.trim() === "" || digitCount === 10 || digitCount === 10;

    // NEW: Fetch real-time SOS counts based on user and role
    useEffect(() => {
      if (!user) return;

      // 1. Fetch Total SOS Reported by this user
      // 1. Fetch Total SOS Reported by this user
      const sosQuery = query(
        collection(db, "sos_alerts"), 
        where("createdBy", "==", user.uid)
      );
      
      const unsubSOS = onSnapshot(sosQuery, 
        (snapshot) => {
          console.log("🔥 SOS Alerts found for user:", snapshot.size); // Debug log
          setSosCount(snapshot.size);
        },
        (error) => {
          console.error("🚨 Error fetching SOS alerts:", error); // Error log
        }
      );

      // 2. Fetch Cases Resolved (Only if they are a volunteer)
      let unsubResolved = () => {};
      
      if (isVolunteer) {
        const resolvedQuery = query(
          collection(db, "sos_alerts"),
          where("status", "==", "resolved"),
          where("resolvedBy", "==", user.uid)
        );
        
        unsubResolved = onSnapshot(resolvedQuery, 
          (snapshot) => {
            console.log("✅ Resolved cases found:", snapshot.size); // Debug log
            setResolvedCount(snapshot.size);
          },
          (error) => {
            console.error("🚨 Error fetching resolved cases:", error); // Error log
          }
        );
      }

      return () => {
        unsubSOS();
        unsubResolved();
      };
    }, [user, isVolunteer]);
    
    // 2. GET THE TAB FROM THE URL
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get("tab") as "profile" | "reports" | "credentials" | "settings" | null;
    
    // 3. SET THE INITIAL STATE BASED ON THE URL (defaults to "profile")
    const [activeTab, setActiveTab] = useState<"profile" | "reports" | "credentials" | "settings">(tabFromUrl || "profile");
    
    const router = useRouter();
    
  const handleSaveDetails = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      
      // Use the imports from the top of the file
      await setDoc(userRef, {
        phone: editPhone,
        city: editCity,
      }, { merge: true });

      // Update local state so the UI refreshes immediately
      setUserData((prev: any) => ({ ...prev, phone: editPhone, city: editCity }));
      setIsEditModalOpen(false);
      alert("Profile updated successfully! 🎉");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (Optional: Limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const storage = getStorage();
      // Creates a unique folder path for this user's avatar
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);

      // 1. Upload the image file to Firebase Storage
      await uploadBytes(storageRef, file);

      // 2. Get the public download URL
      const downloadURL = await getDownloadURL(storageRef);

      // 3. Update Firebase Authentication Profile
      await updateProfile(user, { photoURL: downloadURL });

      // 4. Update Firestore Database (so it matches)
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

      // 5. Update the local React state to show the new image instantly
      setUser({ ...user, photoURL: downloadURL } as User);
      
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Check console for details.");
    } finally {
      setIsUploading(false);
    }
  };
    // 4. LISTEN FOR URL CHANGES (So the dropdown works even if you are already on the dashboard page)
    useEffect(() => {
      if (tabFromUrl) {
        setActiveTab(tabFromUrl);
      }
    }, [tabFromUrl]);
    useEffect(() => {
    setMounted(true);
  }, []);

    const [vetData, setVetData] = useState<any>(null); // 🔥 NEW: State for Vet Data
    const [ngoData, setNgoData] = useState<any>(null);


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
      } else {
        setUser(currentUser);
        
        // 1. Fetch Normal User/Volunteer Data
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data); // ✅ SAVE DATA TO STATE
          
          if (data.role === "volunteer" && data.volunteerApproved === true) {
            setIsVolunteer(true);
          }
        }

        // 2. 🔥 NEW: Fetch Veterinarian Data
        try {
          const vetDocRef = doc(db, "vets_web", currentUser.uid);
          const vetDoc = await getDoc(vetDocRef);
          if (vetDoc.exists()) {
            setVetData(vetDoc.data());
          }
          
        } catch (error) {
          console.error("Error fetching vet data:", error);
        }
        try {
          const ngoDocRef = doc(db, "ngos_web", currentUser.uid);
          const ngoDoc = await getDoc(ngoDocRef);
          if (ngoDoc.exists()) {
            setNgoData(ngoDoc.data());
          }
        } catch (error) {
          console.error("Error fetching NGO data:", error);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);
  useEffect(() => {
    if (isEditModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // cleanup (VERY IMPORTANT)
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isEditModalOpen]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!user) return null;

    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">
        
        {/* PROFILE HEADER BACKGROUND */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-orange-400 to-orange-600 w-full relative">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-20 md:-mt-24 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* LEFT COLUMN: SIDEBAR */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 text-center sticky top-24 z-10">
                
                {/* Hidden File Input */}
  <input 
    type="file" 
    id="avatarUpload" 
    accept="image/*" 
    className="hidden" 
    onChange={handleImageUpload}
  />

  <div className="relative inline-block mb-4 group">
    <img
      src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=fff4e6&color=ea580c&size=128"}
      alt="Profile"
      // Dims the image slightly while uploading
      className={`w-32 h-32 mx-auto rounded-full border-4 border-white shadow-lg object-cover bg-orange-50 transition-opacity ${isUploading ? 'opacity-40' : 'opacity-100'}`}
    />

    {/* Show a loading spinner over the image when uploading */}
    {isUploading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )}

    {/* Button triggers the hidden file input */}
    <button 
      onClick={() => document.getElementById('avatarUpload')?.click()}
      disabled={isUploading}
      className="absolute bottom-0 right-0 bg-orange-500 text-white w-10 h-10 rounded-full border-2 border-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-sm disabled:bg-slate-400"
    >
      ✏️
    </button>
  </div>

                <h2 className="text-xl font-bold text-slate-800 truncate">
                  {user.displayName || "Animal Lover"}
                </h2>
                <p className="text-sm text-slate-500 truncate mb-6">
                  {user.email}
                </p>

                {/* NEW DYNAMIC BADGE */}
                
  {/* NEW DYNAMIC BADGE (Prioritizes Vet Status) */}
                {/* NEW DYNAMIC BADGE (Prioritizes NGO -> Vet -> Volunteer) */}
                {ngoData?.verificationStatus === "approved" ? (
                  <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse shadow-[0_0_8px_rgba(147,51,234,0.8)]"></span>
                    Verified NGO
                  </div>
                ) : vetData?.verificationStatus === "approved" ? (
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]"></span>
                    Verified Veterinarian
                  </div>
                ) : isVolunteer ? (
                  <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    Verified Rescuer
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Community Member
                  </div>
                )}

                {/* Sidebar Navigation (Now uses onClick instead of href) */}
                <div className="flex flex-col gap-2 text-left border-t border-slate-100 pt-6">
                  <SidebarButton 
                    icon="👤" label="Personal Info" 
                    isActive={activeTab === "profile"} 
                    onClick={() => setActiveTab("profile")} 
                  />
                  <SidebarButton 
                    icon="📋" label="My SOS Reports" 
                    isActive={activeTab === "reports"} 
                    onClick={() => setActiveTab("reports")} 
                  />
                  {isVolunteer && (
                    <>
                  <SidebarButton 
                    icon="🎖️" label="My Credentials" 
                    isActive={activeTab === "credentials"} 
                    onClick={() => setActiveTab("credentials")} 
                  />
                  <SidebarButton 
                    icon="⚙️" label="Account Settings" 
                    isActive={activeTab === "settings"} 
                    onClick={() => setActiveTab("settings")} 
                  />
                  </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DYNAMIC CONTENT AREA */}
            {/* RIGHT COLUMN: DYNAMIC CONTENT AREA */}
            <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col gap-8">
              {activeTab === "profile" && (
    <ProfileContent 
      user={user} 
      isVolunteer={isVolunteer} 
      sosCount={sosCount} 
      resolvedCount={resolvedCount} 
      onNavigate={setActiveTab}
      userData={userData}
      vetData={vetData}
      ngoData={ngoData}
      onEditClick={() => {
        // Pre-fill fields with existing data
        setEditPhone(userData?.phone || "");
        setEditCity(userData?.city || "");
        setIsEditModalOpen(true);
      }} 
    />
  )}
              {activeTab === "reports" && <ReportsContent user={user} isVolunteer={isVolunteer} />}
              {activeTab === "settings" && <SettingsContent user={user} />}
              
              {/* Volunteer Only Components */}
              
              {isVolunteer && activeTab === "credentials" && <CredentialsContent userData={userData} />}
            </div>

          </div>
        </div>
        {/* EDIT DETAILS MODAL */}
  {/* EDIT DETAILS MODAL */}
  {/* EDIT DETAILS MODAL - PLACE THIS AT THE VERY BOTTOM OF YOUR MAIN RETURN */}
  {mounted && isEditModalOpen && typeof document !== "undefined" &&
    createPortal(
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }} // Force it above everything
      >
        {/* 1. Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsEditModalOpen(false)} 
        />

        {/* 2. Modal Card */}
        <div 
          className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-[100000] animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()} // Crucial: prevents closing when clicking inside
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-black text-slate-800">Update Profile</h3>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <p className="text-slate-500 text-sm mb-6">
            Fill in your details to stay connected with the rescue team.
          </p>

          <div className="space-y-5">
          <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
              <input
                type="text"
                maxLength={15}
                placeholder="+91 XXXXX XXXXX"
                className={`w-full mt-1 bg-white rounded-2xl px-5 py-3 outline-none transition-colors text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal ${
                  !isValidPhone && editPhone.length > 0 
                    ? "border-2 border-red-500 focus:border-red-500" 
                    : "border-2 border-slate-200 focus:border-orange-500"
                }`}
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
              {/* Error Message */}
              {!isValidPhone && editPhone.length > 0 && (
                <p className="text-red-600 text-xs font-black mt-1.5 ml-2 drop-shadow-sm">
      ⚠️ Please enter a valid 10-digit number
    </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">City / Location</label>
              <input
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
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }
      </main>
    );
  }

  /* =========================================
    TAB CONTENT COMPONENTS
    ========================================= */

  // 1. PROFILE TAB
  // 1. PROFILE TAB
  // 1. PROFILE TAB
  // 1. PROFILE TAB
  function ProfileContent({ 
    user, 
    isVolunteer, 
    sosCount = 0, 
    resolvedCount = 0, 
    onNavigate,
    userData,
    vetData,
    ngoData,
    onEditClick // <--- Add this prop
  }: any) {
    return (
      <>
        {/* CONDITIONAL RENDER WITH REAL DATA */}
        {isVolunteer ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatBox icon="🚨" value={String(sosCount || 0)} label="SOS Reported" />
            <StatBox icon="🐕" value={String(resolvedCount || 0)} label="Animals Helped" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatBox icon="🚨" value={String(sosCount || 0)} label="SOS Reported" />
            
            <a href="/volunteer-form" className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border border-orange-200 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🤝</div>
              <div className="text-lg font-black text-orange-700">Become a Volunteer</div>
              <div className="text-xs font-bold text-orange-600 uppercase tracking-wide mt-1">Join the rescue team →</div>
            </a>
          </div>
        )}
{ngoData && (
          <div className="mt-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
              NGO Partner Profile
            </h3>
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
              
              {/* Application Status */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="font-bold text-slate-800 text-lg">Partnership Status</span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  ngoData.verificationStatus === "approved" ? "bg-green-100 text-green-700 border border-green-200" :
                  ngoData.verificationStatus === "rejected" ? "bg-red-100 text-red-700 border border-red-200" :
                  "bg-amber-100 text-amber-700 border border-amber-200"
                }`}>
                  {ngoData.verificationStatus === "approved" ? "Verified" :
                   ngoData.verificationStatus === "rejected" ? "Rejected" : "Pending Review"}
                </span>
              </div>

              {/* NGO Info */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl border border-orange-100">🏢</div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{ngoData.ngoName || "NGO Details"}</p>
                    <p className="text-sm text-slate-500 mt-1">{ngoData.fullAddress || "No address provided"}</p>
                  </div>
                </div>
              </div>

              {/* Operational Capacity (Ambulance/Shelter) */}
              <div className="p-6 border-b border-slate-100 bg-white">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Operational Capacity</p>
                <div className="flex flex-wrap gap-4">
                  <div className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${ngoData.hasAmbulance ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                    🚑 Ambulance {ngoData.hasAmbulance ? "Active" : "None"}
                  </div>
                  <div className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${ngoData.hasShelter ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                    🏡 Shelter {ngoData.hasShelter ? "Active" : "None"}
                  </div>
                </div>
              </div>

              {/* View Uploaded Cert */}
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
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  →
                </div>
              </a>
              
            </div>
          </div>
        )}
      </>
    );
  }
  // 2. REPORTS TAB
  // 2. REPORTS TAB (REAL-TIME DATA)
  function ReportsContent({ user, isVolunteer }: { user: User, isVolunteer: boolean }) {
    const [reportTab, setReportTab] = useState("All");
    const [reports, setReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(true);

    useEffect(() => {
      if (!user) return;
      setLoadingReports(true);

      let createdReports: any[] = [];
      let acceptedReports: any[] = [];

      // Helper function to merge, remove duplicates, and sort by newest
      const updateReports = () => {
        const merged = [...createdReports, ...acceptedReports];
        const unique = merged.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        unique.sort((a, b) => (b.time?.seconds || 0) - (a.time?.seconds || 0));
        setReports(unique);
        setLoadingReports(false);
      };

      // Query 1: Cases created by the user
      const q1 = query(collection(db, "sos_alerts"), where("createdBy", "==", user.uid));
      const unsub1 = onSnapshot(q1, (snap) => {
        createdReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        updateReports();
      });

      // Query 2: Cases accepted by the user (Only if volunteer)
      let unsub2 = () => {};
      if (isVolunteer) {
        const q2 = query(collection(db, "sos_alerts"), where("acceptedBy", "==", user.uid));
        unsub2 = onSnapshot(q2, (snap) => {
          acceptedReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          updateReports();
        });
      }

      return () => {
        unsub1();
        unsub2();
      };
    }, [user, isVolunteer]);

    // Filter based on selected tab
    const filteredReports = reports.filter(item => {
      if (reportTab === "All") return true;
      if (reportTab === "Active") return item.status !== 'resolved';
      if (reportTab === "Resolved") return item.status === 'resolved';
      return true;
    });

    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">My SOS Reports</h3>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200 pb-px">
          {["All", "Active", "Resolved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setReportTab(tab)}
              className={`pb-3 px-2 font-semibold text-sm transition-colors border-b-2 ${
                reportTab === tab ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab} ({reportTab === tab ? filteredReports.length : reports.filter(item => {
                if (tab === "All") return true;
                if (tab === "Active") return item.status !== 'resolved';
                return item.status === 'resolved';
              }).length})
            </button>
          ))}
        </div>

        {/* Loading & Empty States */}
        <div className="space-y-4">
          {loadingReports ? (
            <div className="text-center py-10 text-slate-500">Loading your reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <div className="text-4xl mb-3">📄</div>
              <p className="font-semibold text-slate-700">No cases found</p>
              <p className="text-sm">Cases will appear here when reported</p>
            </div>
          ) : (
            filteredReports.map((item) => (
              <ReportCard key={item.id} item={item} />
            ))
          )}
        </div>
      </div>
    );
  }

  // 3. BADGES TAB
  

  // 4. SETTINGS TAB
  // 4. SETTINGS TAB
// 4. SETTINGS TAB
function SettingsContent({ user }: { user: any }) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isGoogleUser = user?.providerData?.some((p: any) => p.providerId === 'google.com');

  // 🔥 Log Out
  const handleLogout = async () => {
    try {
      const { signOut, getAuth } = await import("firebase/auth");
      const auth = getAuth();
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out.");
    }
  };

  // 🔥 Trigger the Delete Flow
  const handleDeleteClick = () => {
    if (isGoogleUser) {
      // Google users get a simple browser confirmation before the popup
      if (confirm("This will permanently delete your account and all data. Proceed?")) {
        executeGoogleDelete();
      }
    } else {
      // Password users get the modal to type their password
      setShowDeleteModal(true);
    }
  };

  // 🔴 Delete Logic: Google Users
  const executeGoogleDelete = async () => {
    setIsDeleting(true);
    try {
      const { GoogleAuthProvider, reauthenticateWithPopup, deleteUser, getAuth } = await import("firebase/auth");
      const { deleteDoc, doc } = await import("firebase/firestore");
      
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      // 1. Re-authenticate
      await reauthenticateWithPopup(auth.currentUser!, provider);
      
      // 2. Delete Firestore Data
      await deleteDoc(doc(db, "users", user.uid));
      
      // 3. Delete Auth Account
      await deleteUser(auth.currentUser!);

      alert("Account permanently deleted.");
      router.push("/auth");
    } catch (error) {
      console.error(error);
      alert("Failed to delete account. You may need to log out and log back in first.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 🔴 Delete Logic: Email/Password Users
  const executePasswordDelete = async () => {
    if (!password) {
      alert("Please enter your password.");
      return;
    }
    
    setIsDeleting(true);
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, deleteUser, getAuth } = await import("firebase/auth");
      const { deleteDoc, doc } = await import("firebase/firestore");
      
      const auth = getAuth();
      
      // 1. Create credential & Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(auth.currentUser!, credential);

      // 2. Delete Firestore Data
      await deleteDoc(doc(db, "users", user.uid));
      
      // 3. Delete Auth Account
      await deleteUser(auth.currentUser!);

      setShowDeleteModal(false);
      alert("Account permanently deleted.");
      router.push("/auth");
    } catch (error) {
      console.error(error);
      alert("Incorrect password or failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* ACCOUNT ACTIONS SECTION */}
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

      {/* DANGER ZONE */}
      <div className="bg-red-50/50 rounded-3xl p-8 border border-red-100">
        <h2 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-600 mb-6">
          Once you delete your account, there is no going back. All your SOS reports and badges will be permanently removed.
        </p>
        <button 
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="bg-white border-2 border-red-200 text-red-600 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
        >
          {isDeleting && isGoogleUser ? "Deleting..." : "Delete Account"}
        </button>
      </div>

      {/* DELETE ACCOUNT PASSWORD MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-red-600 mb-2">Confirm Deletion</h3>
            <p className="text-slate-500 text-sm mb-6">
              Please enter your password to confirm you want to permanently delete your account.
            </p>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-red-500 transition-colors text-slate-900 font-bold mb-8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPassword("");
                }}
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
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
  /* =========================================
    HELPER UI COMPONENTS
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

  // ... (StatBox, DetailField, ActivityItem, ReportCard, BadgeCard, ToggleRow remain exactly the same as previously defined)
  function StatBox({ icon, value, label }: any) { return ( <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all"> <div className="text-2xl mb-2">{icon}</div> <div className="text-2xl font-black text-slate-800">{value}</div> <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{label}</div> </div> ); }
  function DetailField({ label, value }: any) { return ( <div> <p className="text-sm font-semibold text-slate-500 mb-1">{label}</p> <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium"> {value} </div> </div> ); }
  function ActivityItem({ icon, title, date, status, statusColor }: any) { return ( <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors"> <div className="flex items-center gap-4"> <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-lg"> {icon} </div> <div> <p className="font-semibold text-slate-800 text-sm md:text-base">{title}</p> <p className="text-xs text-slate-500">{date}</p> </div> </div> <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusColor}`}> {status} </div> </div> ); }
  function ReportCard({ item }: { item: any }) { 
    // Helpers to match your React Native app colors
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'resolved': return 'bg-green-100 text-green-700';
        case 'responding': return 'bg-teal-100 text-teal-700';
        case 'active': return 'bg-orange-100 text-orange-700';
        default: return 'bg-blue-100 text-blue-700';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'critical': return 'bg-red-500';
        case 'high': return 'bg-orange-500';
        case 'medium': return 'bg-yellow-500';
        default: return 'bg-green-500';
      }
    };

    // Safely format the date from Firestore Timestamp
    const formattedDate = item.time?.toDate 
      ? item.time.toDate().toLocaleDateString('en-GB') + ' ' + item.time.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) 
      : 'Unknown time';

    return ( 
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer flex flex-col md:flex-row"> 
        
        {/* Image Section - Makes it larger on desktop like the screenshot */}
        <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 relative overflow-hidden rounded-xl m-4 md:m-5">
    <img 
      src={item.photoURL || "https://via.placeholder.com/400x300?text=No+Image"} 
      alt="SOS Report" 
      className="w-full h-full object-cover" 
    />
    {/* Mobile Priority Badge (Only shows if you want it on top of the image) */}
    <div className="absolute top-1 left-1 md:hidden flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm">
      <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(item.urgency)}`}></div>
      <span className="text-[8px] font-bold text-slate-700 uppercase">
        {item.urgency || "MID"}
      </span>
    </div>
  </div>
        
        {/* Content Section */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between"> 
          
          <div>
            {/* Header Row: Title & Status */}
            <div className="flex justify-between items-start mb-2 gap-4">
              <h3 className="font-bold text-slate-800 text-lg md:text-xl leading-tight line-clamp-2 flex-1">
                {item.description || "Emergency Reported"}
              </h3> 
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${getStatusColor(item.status)}`}> 
                {item.status || "active"} 
              </div>
            </div>
            
            {/* Desktop Priority Badge */}
            <div className="hidden md:flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.urgency)}`}></div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                {item.urgency || "MEDIUM"} PRIORITY
              </span>
            </div>

            <hr className="border-slate-100 my-4 md:hidden" />
          </div>

          {/* Meta Data Footer */}
          <div className="space-y-2 mt-2 md:mt-0">
            <p className="text-sm text-slate-600 flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">📍</span> 
              <span className="line-clamp-2">{item.address || "Location not specified"}</span>
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
  // 3. CREDENTIALS TAB
// 3. CREDENTIALS TAB
function CredentialsContent({ userData }: { userData: any }) {
  const idCardUrl = userData?.idCardPath || userData?.idcardPath || userData?.id_card_path;
  const certUrl = userData?.certificatePath || userData?.certPath;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
      <h3 className="text-2xl font-bold text-slate-800 mb-2">My Credentials</h3>
      <p className="text-slate-500 mb-8 text-sm">View and download your official PawSOS volunteer documents.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ID CARD - Now using a sleek Dark Slate Theme */}
        <div className={`relative p-6 rounded-3xl border transition-all duration-300 flex flex-col ${idCardUrl ? "border-slate-300 bg-white shadow-md hover:shadow-lg hover:-translate-y-1" : "border-slate-200 bg-slate-50 opacity-70"}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 shadow-inner ${idCardUrl ? "bg-slate-100 text-slate-800" : "bg-slate-200 text-slate-400"}`}>
            💳
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Volunteer ID Card</h3>
          <p className="text-xs text-slate-500 mb-6 flex-1">
            {idCardUrl ? "Your official identification for field rescues." : "Not issued yet."}
          </p>
          
          {idCardUrl ? (
            <a href={idCardUrl} target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-slate-800 text-white text-center rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors shadow-sm">
              View Document →
            </a>
          ) : (
            <button disabled className="w-full py-3 bg-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed">
              Unavailable
            </button>
          )}
        </div>

        {/* CERTIFICATE - Original Orange Theme */}
        <div className={`relative p-6 rounded-3xl border transition-all duration-300 flex flex-col ${certUrl ? "border-orange-200 bg-orange-50/30 shadow-md hover:shadow-lg hover:-translate-y-1" : "border-slate-200 bg-slate-50 opacity-70"}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 shadow-inner ${certUrl ? "bg-orange-100 text-orange-600" : "bg-slate-200 text-slate-400"}`}>
            🎓
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Volunteer Certificate</h3>
          <p className="text-xs text-slate-500 mb-6 flex-1">
            {certUrl ? "Official recognition of your service." : "Not available yet."}
          </p>
          
          {certUrl ? (
            <a href={certUrl} target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-orange-500 text-white text-center rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-sm">
              View Document →
            </a>
          ) : (
            <button disabled className="w-full py-3 bg-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed">
              Unavailable
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
  