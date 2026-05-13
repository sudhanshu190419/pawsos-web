"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

export type Role = "user" | "volunteer" | "ngo" | "vet" | "hospital" | "admin" | null;

export interface UserMeta {
  role: Role;
  volunteerApproved: boolean;
  ngoApproved: boolean;
  orgApproved: boolean;
  organizationId?: string;
  name: string;
}

interface AuthContextType {
  currentUser: User | null;
  userMeta: UserMeta;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userMeta: { role: null, volunteerApproved: false, ngoApproved: false, orgApproved: false, name: "" },
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta>({
    role: null,
    volunteerApproved: false,
    ngoApproved: false,
    orgApproved: false,
    name: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen for Auth State changes
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (!user) {
        setUserMeta({ role: null, volunteerApproved: false, ngoApproved: false, orgApproved: false, name: "" });
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // 2. Listen for User Metadata changes in real-time
    const unsubMeta = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserMeta({
          role: (data.role as Role) || null,
          volunteerApproved: data.volunteerApproved === true,
          ngoApproved: data.ngoApproved === true,
          orgApproved: data.orgApproved === true,
          organizationId: data.organizationId,
          name: data.name || "",
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to user meta:", error);
      setLoading(false);
    });

    return () => unsubMeta();
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, userMeta, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
