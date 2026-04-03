"use client";

import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";


type UserData = {
  role?: string;
  volunteerApproved?: boolean;
  phone?: string;
  city?: string;
  photoURL?: string;
};

type VerificationStatus = "approved" | "rejected" | "pending";

type VetData = {
  verificationStatus?: VerificationStatus;
};

type NgoData = {
  verificationStatus?: VerificationStatus;
  ngoName?: string;
  fullAddress?: string;
  hasAmbulance?: boolean;
  hasShelter?: boolean;
};

export function useProfile() {
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

      // Fetch all three collections in parallel
      const [userSnap, vetSnap, ngoSnap] = await Promise.allSettled([
        getDoc(doc(db, "users", currentUser.uid)),
        getDoc(doc(db, "vets_web", currentUser.uid)),
        getDoc(doc(db, "ngos_web", currentUser.uid)),
      ]);

      let isApprovedRescuer = false;

      if (userSnap.status === "fulfilled" && userSnap.value.exists()) {
        const data = userSnap.value.data() as UserData;
        setUserData(data);
        
        // FIXED: Case-insensitive check for role, ensures it works even if saved as "Volunteer"
        if (data.role?.toLowerCase() === "volunteer" && data.volunteerApproved === true) {
          isApprovedRescuer = true;
        }
      }

      if (vetSnap.status === "fulfilled" && vetSnap.value.exists()) {
        const data = vetSnap.value.data() as VetData;
        setVetData(data);
        
        // Include Vets as volunteers so they don't see "Become a Volunteer"
        if (data.verificationStatus === "approved") {
          isApprovedRescuer = true;
        }
      }

      if (ngoSnap.status === "fulfilled" && ngoSnap.value.exists()) {
        const data = ngoSnap.value.data() as NgoData;
        setNgoData(data);
        
        // Include NGOs as volunteers so they don't see "Become a Volunteer"
        if (data.verificationStatus === "approved") {
          isApprovedRescuer = true;
        }
      }

      // Set the final state
      setIsVolunteer(isApprovedRescuer);
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