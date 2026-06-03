"use client";

import { useState, useCallback, useMemo } from "react";
import { User, signOut, GoogleAuthProvider, reauthenticateWithPopup, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type Toast = {
  message: string;
  type: "success" | "error";
};

export default function SettingsContent({
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

  /**
   * Call the deleteUserAccount Cloud Function which handles:
   * - Seller/volunteer pre-checks
   * - Deleting personal data (users doc, subcollections, Storage files)
   * - Anonymizing business records (orders, donations, SOS alerts)
   * - Deleting Firebase Auth account
   */
  const callDeleteFunction = useCallback(async () => {
    setIsDeleting(true);
    try {
      const functions = getFunctions();
      const deleteFn = httpsCallable<{ uid: string }, { success: boolean; summary?: any }>(functions, "deleteUserAccount");
      const result = await deleteFn({ uid: user.uid });
      const data = result.data;

      if (data.success) {
        // Success — redirect to auth page (Auth deletion will trigger sign-out)
        showToast("Account deleted successfully.");
        setTimeout(() => router.push("/auth"), 1500);
      } else {
        showToast("Failed to delete account.", "error");
      }
    } catch (err: any) {
      // Handle specific error messages from the Cloud Function
      const message = err?.message || "Failed to delete account. Please try again.";
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
    }
  }, [user.uid, router, showToast]);

  const executeGoogleDelete = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      await callDeleteFunction();
    } catch {
      showToast("Re-authentication failed. Log out and back in, then try again.", "error");
    }
  }, [user, callDeleteFunction, showToast]);

  const executePasswordDelete = useCallback(async () => {
    if (!password) return;
    try {
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      await callDeleteFunction();
    } catch {
      showToast("Incorrect password or failed to delete account.", "error");
    }
  }, [user, password, callDeleteFunction, showToast]);

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
    <div className="space-y-6 md:space-y-8">
      <div className="bg-white rounded-3xl p-5 md:p-8 border border-slate-100 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
          <span>⚙️</span> Account Actions
        </h2>
        <button
          onClick={handleLogout}
          className="w-full group flex justify-between items-center px-5 py-3.5 md:px-6 md:py-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-200 hover:bg-red-50 transition-all font-bold text-slate-700 hover:text-red-600 shadow-sm text-sm md:text-base"
        >
          <span className="flex items-center gap-3 md:gap-4">
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

      <div className="bg-red-50/50 rounded-3xl p-5 md:p-8 border border-red-100">
        <h2 className="text-lg md:text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-xs md:text-sm text-slate-600 mb-5 md:mb-6">
          Once you delete your account, there is no going back. All your SOS reports and data will be permanently removed.
        </p>
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="w-full sm:w-auto bg-white border-2 border-red-200 text-red-600 px-6 py-3 md:py-2.5 rounded-2xl md:rounded-full font-bold text-sm hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
        >
          {isDeleting ? "Deleting…" : "Delete Account"}
        </button>
      </div>

      {showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-200">
              <h3 className="text-xl sm:text-2xl font-black text-red-600 mb-2">Confirm Deletion</h3>
              <p className="text-slate-500 text-xs sm:text-sm mb-5 sm:mb-6">Enter your password to permanently delete your account.</p>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 sm:px-5 py-3 outline-none focus:border-red-500 transition-colors text-slate-900 font-bold mb-6 sm:mb-8 text-sm sm:text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex gap-3 pb-4 sm:pb-0">
                <button
                  onClick={() => { setShowDeleteModal(false); setPassword(""); }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={executePasswordDelete}
                  disabled={isDeleting || !password}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50 text-sm sm:text-base"
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