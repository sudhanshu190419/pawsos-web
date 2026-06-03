"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { 
  Calendar, 
  Clock, 
  Video, 
  Building, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Star, 
  MessageSquare,
  MessageCircle,
  HelpCircle,
  FileText
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
  reviewSubmitted?: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

interface MyAppointmentsContentProps {
  user: User;
}

export default function MyAppointmentsContent({ user }: MyAppointmentsContentProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Fetch appointments for this user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "vet_appointments"),
      where("userId", "==", user.uid)
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
      console.error("Error fetching user appointments:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Handle Cancel Appointment (allowed before accept)
  const handleCancel = async (appId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment request? Your payment will be refunded shortly.")) {
      return;
    }

    try {
      await updateDoc(doc(db, "vet_appointments", appId), {
        appointmentStatus: "cancelled",
        updatedAt: serverTimestamp()
      });
      alert("Appointment cancelled successfully.");
    } catch (e) {
      console.error("Error cancelling appointment:", e);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewAppointment) return;

    setIsSubmittingReview(true);
    setReviewError("");

    try {
      const reviewData = {
        appointmentId: reviewAppointment.id,
        vetId: reviewAppointment.vetId,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        rating,
        reviewText: reviewText.trim(),
        createdAt: serverTimestamp()
      };

      // Use a Firestore transaction to post the review and update vet average rating
      const vetRef = doc(db, "vets_web", reviewAppointment.vetId);
      const appRef = doc(db, "vet_appointments", reviewAppointment.id);
      const reviewsCollRef = collection(db, "vet_reviews");

      await runTransaction(db, async (transaction) => {
        // Read the current vet data
        const vetSnap = await transaction.get(vetRef);
        if (!vetSnap.exists()) {
          throw new Error("Vet profile not found.");
        }

        const vetData = vetSnap.data();
        const currentAvg = vetData.ratingAverage || 0;
        const currentCount = vetData.ratingCount || 0;

        const newCount = currentCount + 1;
        const newAvg = ((currentAvg * currentCount) + rating) / newCount;

        // Create the review
        const newReviewDocRef = doc(reviewsCollRef);
        transaction.set(newReviewDocRef, reviewData);

        // Update vet aggregates
        transaction.update(vetRef, {
          ratingAverage: Math.round(newAvg * 10) / 10,
          ratingCount: newCount
        });

        // Mark appointment as reviewed
        transaction.update(appRef, {
          reviewSubmitted: true,
          updatedAt: serverTimestamp()
        });
      });

      alert("Review submitted successfully! Thank you.");
      setReviewAppointment(null);
      setRating(5);
      setReviewText("");
    } catch (e: unknown) {
      console.error("Error submitting review:", e);
      setReviewError((e as Error).message || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: Appointment["appointmentStatus"]) => {
    switch (status) {
      case "payment_pending":
        return <span className="bg-amber-100 text-amber-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">Payment Pending</span>;
      case "requested":
        return <span className="bg-blue-100 text-blue-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">Requested</span>;
      case "accepted":
        return <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">Accepted / Scheduled</span>;
      case "completed":
        return <span className="bg-green-100 text-green-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">Completed</span>;
      case "cancelled":
        return <span className="bg-slate-100 text-slate-500 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">Cancelled</span>;
      case "rejected":
        return <span className="bg-red-100 text-red-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">{status}</span>;
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
    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-slate-100 min-h-[400px]">
      <div className="mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-slate-800">My Appointments</h3>
        <p className="text-slate-500 text-sm mt-0.5">View and manage your vet consultations.</p>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 inline-block">🩺</div>
          <h4 className="text-lg font-extrabold text-slate-800 mb-2">No appointments yet</h4>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm">
            Book certified veterinarians for custom clinic visits or online video consultations.
          </p>
          <Link
            href="/vet-appointments"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
          >
            🩺 Browse Verified Vets
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => {
            const isCancelable = app.appointmentStatus === "requested" || app.appointmentStatus === "payment_pending";
            const canReview = app.appointmentStatus === "completed" && !app.reviewSubmitted;

            return (
              <div 
                key={app.id} 
                className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-all flex flex-col md:flex-row justify-between gap-4 bg-slate-50/30"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-slate-800 text-base">Dr. {app.vetName}</h4>
                    <span className="text-xs text-slate-400 font-semibold">• {app.clinicName || "Vet Clinic"}</span>
                    {getStatusBadge(app.appointmentStatus)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{app.appointmentDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{app.appointmentTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🐾</span>
                      <span>Patient: <strong className="text-slate-800">{app.petName}</strong> ({app.petType})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.consultationType === "remote_consultation" ? (
                        <>
                          <Video className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Online / Video Call</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{app.consultationType === "emergency" ? "House Call (Emergency)" : "Clinic Visit"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-xs border-t border-slate-100 pt-3 bg-white p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Reason for consultation</p>
                    <p className="text-slate-700 font-medium">{app.reason}</p>
                    {app.notes && (
                      <p className="text-slate-400 mt-1 italic text-[11px]">Notes: {app.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end gap-3 shrink-0 text-right min-w-[120px]">
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase">Amount Paid</p>
                    <p className="text-base font-black text-slate-800">₹{app.amount}</p>
                    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-100">{app.paymentStatus}</span>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {isCancelable && (
                      <button
                        onClick={() => handleCancel(app.id)}
                        className="w-full md:w-auto px-4 py-2 border-2 border-red-100 hover:border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}

                    {canReview && (
                      <button
                        onClick={() => setReviewAppointment(app)}
                        className="w-full md:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                      >
                        ⭐️ Leave Review
                      </button>
                    )}

                    {app.reviewSubmitted && (
                      <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
                        ✔️ Review Submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review & Rating Modal */}
      {reviewAppointment && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[200000]">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setReviewAppointment(null)} />
          
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative z-[200001] animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Rate Veterinarian</h3>
            <p className="text-slate-500 text-xs font-semibold mb-6">How was your consultation experience with Dr. {reviewAppointment.vetName}?</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              
              {/* Star Selection */}
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = hoverRating ? star <= hoverRating : star <= rating;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform active:scale-125"
                    >
                      <Star 
                        className={`w-10 h-10 transition-colors ${
                          filled ? "fill-orange-500 text-orange-500" : "text-slate-200"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Text review */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Review Text (Optional)</label>
                <textarea
                  placeholder="Share details about the doctor's service, clinic, or remote consultation..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border rounded-2xl px-4 py-3 text-xs outline-none focus:border-orange-500 font-medium text-slate-800"
                />
              </div>

              {reviewError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setReviewAppointment(null)}
                  className="flex-1 py-3 border rounded-xl font-bold text-slate-500 hover:bg-slate-50 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
