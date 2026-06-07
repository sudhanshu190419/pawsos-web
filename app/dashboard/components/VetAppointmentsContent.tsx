"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { 
  Calendar, 
  Clock, 
  Video, 
  Building, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Mail, 
  User as UserIcon,
  Clipboard,
  CheckCircle2
} from "lucide-react";

interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  vetId: string;
  vetName: string;
  clinicName: string;
  petId: string;
  petName: string;
  petType: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationType: "clinic_visit" | "remote_consultation" | "emergency";
  reason: string;
  notes: string;
  amount: number;
  currency: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  appointmentStatus: "payment_pending" | "requested" | "accepted" | "rejected" | "completed" | "cancelled";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  rejectReason?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

interface VetAppointmentsContentProps {
  user: User;
}

type TabFilter = "all" | "requested" | "accepted" | "completed" | "cancelled_rejected";

export default function VetAppointmentsContent({ user }: VetAppointmentsContentProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TabFilter>("requested");

  // Rejection modal/reason state
  const [rejectingApp, setRejectingApp] = useState<Appointment | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Pricing & service settings state
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [emergencyFee, setEmergencyFee] = useState<number>(0);
  const [willingToTravel, setWillingToTravel] = useState(false);
  const [availability, setAvailability] = useState("");
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Fetch current pricing settings (real-time)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "vets_web", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConsultationFee(data.consultationFee || 0);
        setEmergencyFee(data.emergencyFee || 0);
        setWillingToTravel(data.willingToTravel || false);
        setAvailability(typeof data.availability === "string" ? data.availability : (data.availability || []).join(", "));
      }
    }, (e) => {
      console.warn("Failed to fetch vet pricing profile:", e);
    });

    return () => unsub();
  }, [user]);

  // Fetch appointments for this vet
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "vet_appointments"),
      where("vetId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Appointment));
      // Sort client-side by createdAt descending to avoid needing a composite index
      list.sort((a, b) => {
        const aTime = (a.createdAt as any)?.toMillis?.() ?? 0;
        const bTime = (b.createdAt as any)?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      setAppointments(list);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching vet appointments:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Update Status
  const handleUpdateStatus = async (appId: string, status: Appointment["appointmentStatus"], optionalData?: Record<string, unknown>) => {
    try {
      await updateDoc(doc(db, "vet_appointments", appId), {
        appointmentStatus: status,
        updatedAt: serverTimestamp(),
        ...optionalData
      });
      alert(`Appointment status updated to ${status}.`);
    } catch (e) {
      console.error("Error updating appointment status:", e);
      alert("Failed to update status. Please try again.");
    }
  };

  // Submit Rejection
  const handleSubmitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingApp) return;

    setIsSubmittingReject(true);
    try {
      await handleUpdateStatus(rejectingApp.id, "rejected", {
        rejectReason: rejectReasonText.trim() || "No reason specified"
      });
      setRejectingApp(null);
      setRejectReasonText("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Filter listings
  const filteredAppointments = appointments.filter(app => {
    if (activeFilter === "all") return true;
    if (activeFilter === "requested") return app.appointmentStatus === "requested";
    if (activeFilter === "accepted") return app.appointmentStatus === "accepted";
    if (activeFilter === "completed") return app.appointmentStatus === "completed";
    if (activeFilter === "cancelled_rejected") {
      return app.appointmentStatus === "cancelled" || app.appointmentStatus === "rejected";
    }
    return true;
  });

  const getStatusBadge = (status: Appointment["appointmentStatus"]) => {
    switch (status) {
      case "payment_pending":
        return <span className="bg-amber-100 text-amber-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Payment Pending</span>;
      case "requested":
        return <span className="bg-blue-100 text-blue-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Requested</span>;
      case "accepted":
        return <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Accepted</span>;
      case "completed":
        return <span className="bg-green-100 text-green-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Completed</span>;
      case "cancelled":
        return <span className="bg-slate-100 text-slate-500 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Cancelled</span>;
      case "rejected":
        return <span className="bg-red-100 text-red-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 min-h-[400px] text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex justify-between items-start md:items-center w-full md:w-auto gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800">Vet Appointment Manager</h3>
            <p className="text-slate-500 text-sm mt-0.5">Manage consultation requests and schedules.</p>
          </div>
          <button
            onClick={() => setShowPricingModal(true)}
            className="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            ⚙️ Pricing & Services
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto">
          {[
            { value: "requested", label: "Requested" },
            { value: "accepted", label: "Accepted" },
            { value: "completed", label: "Completed" },
            { value: "cancelled_rejected", label: "Declined" },
            { value: "all", label: "All" }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value as TabFilter)}
              className={`flex-1 md:flex-initial text-center px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === f.value
                  ? "bg-white text-orange-600 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:text-slate-800 border border-transparent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-150 rounded-2xl">
          <div className="text-5xl mb-4">📅</div>
          <h4 className="text-lg font-bold text-slate-700">No appointments found</h4>
          <p className="text-slate-400 text-xs max-w-xs mx-auto mt-1">
            There are no appointments matching the &quot;{activeFilter}&quot; status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => {
            return (
              <div 
                key={app.id} 
                className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-all flex flex-col md:flex-row justify-between gap-5 bg-slate-50/20"
              >
                
                {/* Details Side */}
                <div className="space-y-3.5 flex-1 min-w-0">
                  
                  {/* Title Bar */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-black text-slate-800 text-sm flex items-center gap-1.5 min-w-0">
                      <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{app.userName}</span>
                    </span>
                    <span className="text-slate-300 font-bold">|</span>
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <span>Patient:</span>
                      <strong className="text-slate-700">{app.petName}</strong>
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded capitalize text-[10px]">{app.petType}</span>
                    </span>
                    {getStatusBadge(app.appointmentStatus)}
                  </div>

                  {/* Consultation Specifics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl text-xs font-semibold text-slate-600 border border-slate-50">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{app.appointmentDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{app.appointmentTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.consultationType === "remote_consultation" ? (
                        <>
                          <Video className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Online / Video</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{app.consultationType === "emergency" ? "Emergency visit" : "Clinic visit"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <a href={`tel:${app.userPhone}`} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{app.userPhone}</span>
                    </a>
                    <a href={`mailto:${app.userEmail}`} className="flex items-center gap-1 hover:text-orange-500 transition-colors truncate">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{app.userEmail}</span>
                    </a>
                  </div>

                  {/* Reason Text */}
                  <div className="bg-orange-50/20 p-3.5 rounded-xl border border-orange-100/50 text-xs">
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1 flex items-center gap-1">
                      <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Reason for Consult
                    </p>
                    <p className="text-slate-700 font-bold leading-normal">{app.reason}</p>
                    {app.notes && (
                      <p className="text-slate-400 italic text-[11px] mt-1.5">Note: {app.notes}</p>
                    )}
                    {app.rejectReason && (
                      <div className="mt-2.5 pt-2 border-t border-red-100 text-red-600 font-semibold">
                        ❌ Reject Reason: {app.rejectReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial and Actions Side */}
                <div className="flex flex-col justify-between items-stretch md:items-end gap-4 min-w-[150px] shrink-0 text-left md:text-right border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase">Cons. Fee Paid</p>
                    <p className="text-lg font-black text-slate-800 leading-snug">₹{app.amount}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Payout Est: <strong className="text-slate-600">₹{app.amount * 0.90}</strong></p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-green-50 text-green-700 border border-green-150 px-2 py-0.5 rounded-full mt-1">
                      <CheckCircle2 className="w-3 h-3" /> {app.paymentStatus}
                    </span>
                  </div>

                  {/* Accept / Reject actions */}
                  <div className="flex flex-col gap-1.5 w-full">
                    {app.appointmentStatus === "requested" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(app.id, "accepted")}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <CheckCircle className="w-4 h-4" /> Accept Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingApp(app)}
                          className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                          <XCircle className="w-4 h-4" /> Decline Request
                        </button>
                      </>
                    )}

                    {app.appointmentStatus === "accepted" && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, "completed")}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                      >
                        ✔️ Complete Session
                      </button>
                    )}

                    {app.appointmentStatus === "completed" && (
                      <span className="text-xs text-green-600 font-black uppercase tracking-wider flex items-center justify-start md:justify-end gap-1">
                        ✨ Session Complete
                      </span>
                    )}

                    {(app.appointmentStatus === "cancelled" || app.appointmentStatus === "rejected") && (
                      <span className="text-xs text-slate-400 font-black uppercase tracking-wider flex items-center justify-start md:justify-end gap-1">
                        ❌ Appointment Closed
                      </span>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Decline Reason Modal */}
      {rejectingApp && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[200000]">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRejectingApp(null)} />
          
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-[200001] animate-in zoom-in duration-150">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Decline Appointment</h3>
            <p className="text-slate-400 text-xs font-medium mb-4">Please provide a reason to the client for rejecting Dr. {rejectingApp.vetName}&apos;s appointment request.</p>

            <form onSubmit={handleSubmitRejection} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Reason for Rejection</label>
                <textarea
                  required
                  placeholder="e.g. Doctor is unavailable at this specific slot / Clinic is closed on this day..."
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-xs outline-none focus:border-red-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingApp(null)}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors disabled:bg-slate-300"
                >
                  {isSubmittingReject ? "Declining..." : "Decline & Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Configuration Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[200000]">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPricingModal(false)} />
          
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative z-[200001] animate-in zoom-in duration-150">
            <h3 className="text-xl font-black text-slate-800 mb-1">Pricing & Services</h3>
            <p className="text-slate-500 text-xs font-semibold mb-6">Configure your fees and service settings for bookings.</p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingPricing(true);
              try {
                await updateDoc(doc(db, "vets_web", user.uid), {
                  consultationFee: Number(consultationFee) || 0,
                  emergencyFee: Number(emergencyFee) || null,
                  willingToTravel,
                  availability,
                  pricingConfigured: true,
                  updatedAt: serverTimestamp()
                });
                alert("Settings saved successfully!");
                setShowPricingModal(false);
              } catch (err) {
                console.error("Failed to save pricing config:", err);
                alert("Failed to save settings. Please try again.");
              } finally {
                setIsSavingPricing(false);
              }
            }} className="space-y-4">
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Base Consultation Fee (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 500"
                  value={consultationFee || ""}
                  onChange={(ev) => setConsultationFee(Number(ev.target.value))}
                  className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500 font-bold text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-normal">Fee charged for clinic visits and remote video consultations.</p>
              </div>

              <div>
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="willingToTravel"
                    checked={willingToTravel}
                    onChange={(ev) => setWillingToTravel(ev.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <label htmlFor="willingToTravel" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Willing to travel for emergency appointments</label>
                </div>
              </div>

              {willingToTravel && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Emergency / House Call Fee (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 1000"
                    value={emergencyFee || ""}
                    onChange={(ev) => setEmergencyFee(Number(ev.target.value))}
                    className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500 font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-normal">Fee charged when traveling to patient locations.</p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Hours of Availability</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon-Fri 9:00 AM - 5:00 PM"
                  value={availability}
                  onChange={(ev) => setAvailability(ev.target.value)}
                  className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500 font-bold text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPricing}
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors disabled:bg-slate-300"
                >
                  {isSavingPricing ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
