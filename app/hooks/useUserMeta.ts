"use client";

import { useAuth } from "../lib/AuthContext";

/**
 * useUserMeta Hook (Refactored)
 * Now consumes the global AuthProvider state to avoid redundant Firebase listeners.
 */
export function useUserMeta() {
  const { currentUser, userMeta, loading } = useAuth();

  return { 
    currentUser, 
    userMeta, 
    loading 
  };
}
