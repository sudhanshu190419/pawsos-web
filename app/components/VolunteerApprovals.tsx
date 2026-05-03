"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp  } from "firebase/firestore";



interface VolunteerUser {
  id: string;
  name?: string;
  email?: string;
  address?: string;
  contact?: string;
  reason?: string;
  photoURL?: string;
  volunteerStatus?: string;
}
export default function VolunteerApprovals() {
  const [pendingVolunteers, setPendingVolunteers] = useState<VolunteerUser[]>([]);
  const [activeVolunteers, setActiveVolunteers] = useState<VolunteerUser[]>([]);
const [viewMode, setViewMode] = useState<"pending" | "active">("pending");
const [selectedUser, setSelectedUser] = useState<VolunteerUser | null>(null);
const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
  // Pending
  const qPending = query(
    collection(db, "users"),
    where("volunteerStatus", "==", "pending")
  );

  const unsubPending = onSnapshot(qPending, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VolunteerUser[];
    setPendingVolunteers(data);
  });

  // Active
  const qActive = query(
    collection(db, "users"),
    where("volunteerStatus", "==", "approved")
  );

  const unsubActive = onSnapshot(qActive, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VolunteerUser[];
    setActiveVolunteers(data);
  });

  return () => {
    unsubPending();
    unsubActive();
  };
}, []);


const displayList =
  viewMode === "pending" ? pendingVolunteers : activeVolunteers;

  // ✅ APPROVE
  const handleApprove = async (user: VolunteerUser) => {
  setIsProcessing(true);

  try {
    await updateDoc(doc(db, "users", user.id), {
      volunteerStatus: "approved",
    });

    setSelectedUser(null);
  } catch (error) {
    console.error(error);
  } finally {
    setIsProcessing(false);
  }
};
  

  // ❌ REJECT
  const handleReject = async (userId: string) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      volunteerStatus: "rejected",
      volunteerApproved: false,
    });

    setSelectedUser(null); // ✅ ADD HERE

  } catch (error) {
    console.error(error);
  }
};


  return (
    <div className="bg-gray-50 p-6 rounded-2xl border shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
  Volunteer Approvals
</h2>
      <div className="flex mb-4">
  <button
    onClick={() => setViewMode("pending")}
    className={`px-4 py-2 rounded-l ${
      viewMode === "pending"
        ? "bg-orange-500 text-white"
        : "bg-gray-200"
    }`}
  >
    Pending ({pendingVolunteers.length})
  </button>

  <button
    onClick={() => setViewMode("active")}
    className={`px-4 py-2 rounded-r ${
      viewMode === "active"
        ? "bg-green-600 text-white"
        : "bg-gray-200"
    }`}
  >
    Active ({activeVolunteers.length})
  </button>
</div>

      {displayList.length === 0 ? (
  <p>No volunteers found</p>
) : (
  displayList.map((user) => (
  <div
    key={user.id}
    className="bg-white rounded-2xl shadow-sm border p-4 mb-4 flex items-center justify-between hover:shadow-md transition"
  >
    {/* LEFT SIDE */}
    <div className="flex items-center gap-4">

      {/* PROFILE IMAGE */}
      <img
        src={user.photoURL || "/default-avatar.png"}
        alt="profile"
        className="w-14 h-14 rounded-full object-cover border"
      />

      {/* USER INFO */}
      <div>
        <p className="font-semibold text-gray-800 text-base">
          {user.name || "Volunteer"}
        </p>
        <p className="text-sm text-gray-500">{user.email}</p>
        <p className="text-xs text-gray-400">
          📍 {user.address || "No address"}
        </p>

        {/* STATUS BADGE */}
        <span
          className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
            viewMode === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {viewMode === "pending" ? "Pending Review" : "Approved"}
        </span>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex gap-2">
      <button
  onClick={() => setSelectedUser(user)}
  className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${
    viewMode === "pending"
      ? "bg-slate-900 text-white hover:bg-orange-600"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
  }`}
>
  {viewMode === "pending" ? "Review" : "View Profile"}
</button>
    </div>
  </div>
))
)}
{selectedUser && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
        <h3 className="text-xl font-bold">
          {viewMode === "pending" ? "Review Volunteer" : "Volunteer Profile"}
        </h3>

        <button onClick={() => setSelectedUser(null)}>❌</button>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-4">
          <img
            src={selectedUser.photoURL || "/default-avatar.png"}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <p className="font-bold text-lg">{selectedUser.name}</p>
            <p className="text-sm text-gray-500">{selectedUser.email}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p>📞 {selectedUser.contact}</p>
          <p>📍 {selectedUser.address}</p>
          <p>📝 {selectedUser.reason}</p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t flex gap-3 bg-slate-50">
        {viewMode === "pending" ? (
          <>
            <button
  disabled={isProcessing}
  onClick={() => handleReject(selectedUser.id)}
  className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-bold disabled:opacity-50"
>
  {isProcessing ? "Processing..." : "Reject"}
</button>

            <button
  disabled={isProcessing}
  onClick={() => handleApprove(selectedUser)}
  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold disabled:opacity-50"
>
  {isProcessing ? "Processing..." : "Approve"}
</button>
          </>
        ) : (
          <button
            onClick={() => setSelectedUser(null)}
            className="flex-1 bg-gray-200 py-2 rounded-lg"
          >
            Close
          </button>
        )}
      </div>

    </div>
  </div>
)}
    </div>
    
  );
  
}