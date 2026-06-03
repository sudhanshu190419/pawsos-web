"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../lib/AuthContext";
import { useUserPets } from "../playdate/hooks/usePlaydates";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  Search, 
  MapPin, 
  Star, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  ShieldCheck,
  CheckCircle,
  Activity,
  SlidersHorizontal,
  Filter
} from "lucide-react";

interface VetProfile {
  uid: string;
  fullName: string;
  clinicName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  clinicAddress: string;
  serviceArea: string;
  availability: string | string[];
  willingToTravel: boolean;
  profilePhotoURL?: string;
  latitude?: number;
  longitude?: number;
  consultationFee?: number;
  followUpFee?: number;
  emergencyFee?: number;
  currency?: string;
  ratingAverage?: number;
  ratingCount?: number;
  status?: string;
}

const TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
  "06:00 PM - 07:00 PM"
];

const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23fff4e6' rx='8'/%3E%3Cpath d='M30 18h4v14h14v4H34v14h-4V36H16v-4h14V18z' fill='%23ea580c' opacity='0.6'/%3E%3C/svg%3E";

// Helper to load Razorpay script
const loadRazorpayScript = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as typeof window & { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// ── Filter content shared between desktop sidebar and mobile drawer ──
function FilterContent({
  consultationTypeFilter,
  setConsultationTypeFilter,
  maxPrice,
  setMaxPrice,
  minRating,
  setMinRating,
  uniqueCities,
  cityFilter,
  setCityFilter,
}: {
  consultationTypeFilter: string;
  setConsultationTypeFilter: (v: string) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  uniqueCities: string[];
  cityFilter: string;
  setCityFilter: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* City Filter */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
          City
        </label>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none font-bold text-xs text-slate-700 cursor-pointer"
        >
          <option value="all">📍 All Cities</option>
          {uniqueCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Consultation Type */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
          Consultation Type
        </label>
        <div className="flex flex-col gap-2">
          {[
            { value: "all", label: "Any Type" },
            { value: "clinic", label: "Clinic Visit" },
            { value: "remote", label: "Online Consultation" },
            { value: "emergency", label: "Emergency / On-Site" }
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setConsultationTypeFilter(item.value)}
              className={`text-left text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all ${
                consultationTypeFilter === item.value
                  ? "border-orange-500 bg-orange-50/50 text-orange-600 font-bold"
                  : "border-slate-100 hover:border-slate-200 text-slate-600 bg-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Consultation Price</label>
          <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">₹{maxPrice}</span>
        </div>
        <input
          type="range"
          min="200"
          max="3000"
          step="50"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
          <span>₹200</span>
          <span>₹3000</span>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">Minimum Rating</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 3, 4, 4.5].map((stars) => (
            <button
              key={stars}
              onClick={() => setMinRating(stars)}
              className={`py-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                minRating === stars
                  ? "border-orange-500 bg-orange-50 text-orange-600"
                  : "border-slate-100 hover:border-slate-200 text-slate-500 bg-white"
              }`}
            >
              {stars === 0 ? "All" : (
                <>
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VetAppointmentsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { pets, loading: petsLoading } = useUserPets(currentUser);
  const router = useRouter();

  // State for vet listings
  const [vets, setVets] = useState<VetProfile[]>([]);
  const [loadingVets, setLoadingVets] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [consultationTypeFilter, setConsultationTypeFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [minRating, setMinRating] = useState<number>(0);

  // Mobile filter drawer state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterOpen]);

  // Booking Modal state
  const [selectedVet, setSelectedVet] = useState<VetProfile | null>(null);
  const [bookingPetId, setBookingPetId] = useState("");
  const [bookingPetType, setBookingPetType] = useState("dog");
  const [bookingPetName, setBookingPetName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingReason, setBookingReason] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingConsultType, setBookingConsultType] = useState<"clinic_visit" | "remote_consultation" | "emergency">("clinic_visit");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch approved/active vets
  useEffect(() => {
    setLoadingVets(true);
    const q = query(
      collection(db, "vets_web"),
      where("verificationStatus", "==", "approved")
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetchedVets = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          ...data
        } as VetProfile;
      });

      const activeVets = fetchedVets.filter(
        (v: VetProfile) => v.status === undefined || v.status === "active"
      );

      setVets(activeVets);
      setLoadingVets(false);
    }, (error) => {
      console.error("Error fetching vets:", error);
      setErrorMessage("Could not load veterinary profiles. Please try again.");
      setLoadingVets(false);
    });

    return () => unsub();
  }, []);

  // Set user's phone number if available when vet selected
  useEffect(() => {
    if (selectedVet && currentUser) {
      const fetchUserPhone = async () => {
        try {
          const userSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (userSnap.exists() && userSnap.data().phone) {
            setBookingPhone(userSnap.data().phone);
          }
        } catch {
          console.warn("Could not fetch user phone number");
        }
      };
      fetchUserPhone();
    }
  }, [selectedVet, currentUser]);

  // Gate check
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, authLoading, router]);

  // Normalize string for city comparison
  const normalizeCity = (s: string) => s.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();

  // Active filter count (for mobile badge)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (cityFilter !== "all") count++;
    if (consultationTypeFilter !== "all") count++;
    if (maxPrice < 3000) count++;
    if (minRating > 0) count++;
    return count;
  }, [cityFilter, consultationTypeFilter, maxPrice, minRating]);

  // Derived filters data
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    vets.forEach(v => {
      if (v.city) cities.add(v.city.trim());
    });
    return Array.from(cities);
  }, [vets]);

  // Filter listings
  const filteredVets = useMemo(() => {
    return vets.filter(v => {
      const queryLower = searchQuery.toLowerCase();
      const matchesSearch = 
        v.fullName.toLowerCase().includes(queryLower) ||
        (v.clinicName && v.clinicName.toLowerCase().includes(queryLower)) ||
        (v.serviceArea && v.serviceArea.toLowerCase().includes(queryLower)) ||
        (v.clinicAddress && v.clinicAddress.toLowerCase().includes(queryLower));

      if (!matchesSearch) return false;

      if (cityFilter !== "all" && normalizeCity(v.city || '') !== normalizeCity(cityFilter)) {
        return false;
      }

      if (consultationTypeFilter === "remote" && !v.consultationFee) return false;
      if (consultationTypeFilter === "clinic" && !v.consultationFee) return false;
      if (consultationTypeFilter === "emergency" && !v.willingToTravel) return false;

      const fee = v.consultationFee || 0;
      if (fee > maxPrice) return false;

      const rating = v.ratingAverage || 0;
      if (rating < minRating) return false;

      return true;
    });
  }, [vets, searchQuery, cityFilter, consultationTypeFilter, maxPrice, minRating]);

  // Calculate pricing for currently selected booking config
  const bookingAmount = useMemo(() => {
    if (!selectedVet) return 0;
    if (bookingConsultType === "clinic_visit" || bookingConsultType === "remote_consultation") {
      return selectedVet.consultationFee || 0;
    } else if (bookingConsultType === "emergency") {
      return selectedVet.emergencyFee || selectedVet.consultationFee || 0;
    }
    return 0;
  }, [selectedVet, bookingConsultType]);

  // Handle booking form submit with Razorpay payment
  const handlePayAndBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    if (!currentUser) return;
    if (!selectedVet) return;

    if (!bookingPhone.trim()) {
      setBookingError("Please provide a contact phone number.");
      return;
    }
    if (!bookingDate) {
      setBookingError("Please select a date for the appointment.");
      return;
    }
    if (!bookingTime) {
      setBookingError("Please select a time slot.");
      return;
    }
    if (!bookingReason.trim()) {
      setBookingError("Please provide a reason for the consultation.");
      return;
    }

    if (bookingPetId === "manual") {
      if (!bookingPetName.trim()) {
        setBookingError("Please enter the pet name.");
        return;
      }
    } else if (!bookingPetId && pets.length > 0) {
      setBookingError("Please select one of your pets or enter manually.");
      return;
    }

    setIsSubmittingBooking(true);

    try {
      const firebaseIdToken = await currentUser.getIdToken();

      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firebaseIdToken}`,
        },
        body: JSON.stringify({
          purpose: "vet_appointment",
          vetId: selectedVet.uid,
          consultationType: bookingConsultType,
          userId: currentUser.uid,
          amount: bookingAmount * 100,
          currency: "INR"
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initialize booking order.");
      }

      const orderData = await response.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order.");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load Razorpay. Please check your internet connection.");
      }

      const keyId = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Razorpay client key is not configured.");
      }

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "PawSOS Veterinary Services",
        description: `Consultation with Dr. ${selectedVet.fullName}`,
        order_id: orderData.orderId,
        prefill: {
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          contact: bookingPhone
        },
        theme: {
          color: "#F97316"
        },
        handler: async (paymentResponse: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            setIsSubmittingBooking(true);
            setBookingError("Verifying payment...");

            let petNameResult = bookingPetName;
            let petTypeResult = bookingPetType;
            let petIdResult = bookingPetId;

            if (bookingPetId && bookingPetId !== "manual") {
              const matchedPet = pets.find(p => p.id === bookingPetId);
              if (matchedPet) {
                petNameResult = matchedPet.name;
                petTypeResult = matchedPet.type;
              }
            } else {
              petIdResult = "manual";
            }

            const appointment = {
              userId: currentUser.uid,
              userName: currentUser.displayName || "Anonymous",
              userEmail: currentUser.email || "",
              userPhone: bookingPhone,
              vetId: selectedVet.uid,
              vetName: selectedVet.fullName,
              clinicName: selectedVet.clinicName || "",
              petId: petIdResult,
              petName: petNameResult,
              petType: petTypeResult,
              appointmentDate: bookingDate,
              appointmentTime: bookingTime,
              consultationType: bookingConsultType,
              reason: bookingReason,
              notes: bookingNotes || ""
            };

            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${firebaseIdToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                purpose: "vet_appointment",
                appointment
              })
            });

            if (!verifyRes.ok) {
              const errData = await verifyRes.json().catch(() => ({}));
              throw new Error(errData.error || "Signature verification failed.");
            }

            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
              throw new Error("Signature verification failed.");
            }

            setBookingSuccess(true);
            setIsSubmittingBooking(false);
          } catch (e: unknown) {
            console.error("Firestore creation / verification error:", e);
            setBookingError((e as Error).message || "Failed to book appointment. Please contact support with payment details.");
            setIsSubmittingBooking(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBookingError("Payment cancelled. The appointment was not booked.");
            setIsSubmittingBooking(false);
          }
        }
      };

      const rzp = new (window as typeof window & { Razorpay: new (options: unknown) => { on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void; open: () => void } }).Razorpay(options);
      rzp.on("payment.failed", (failResponse: { error?: { description?: string } }) => {
        setBookingError(failResponse.error?.description || "Payment failed. Please try again.");
        setIsSubmittingBooking(false);
      });
      rzp.open();

    } catch (err: unknown) {
      console.error(err);
      setBookingError((err as Error).message || "Could not launch payment gateway. Please try again.");
      setIsSubmittingBooking(false);
    }
  };

  const closeBookingModal = () => {
    setSelectedVet(null);
    setBookingPetId("");
    setBookingPetName("");
    setBookingPetType("dog");
    setBookingDate("");
    setBookingTime("");
    setBookingReason("");
    setBookingNotes("");
    setBookingPhone("");
    setBookingConsultType("clinic_visit");
    setBookingError("");
    setBookingSuccess(false);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setCityFilter("all");
    setConsultationTypeFilter("all");
    setMaxPrice(3000);
    setMinRating(0);
  };

  // Render Full Screen Loading
  if (authLoading || (currentUser && petsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="w-14 h-14 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 md:pb-8 text-slate-800">
      
      {/* ── Hero / Search Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50/50 to-white pt-6 pb-7 md:pt-14 md:pb-16 px-4 border-b border-slate-100">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-48 h-48 md:w-80 md:h-80 bg-orange-200/30 rounded-full blur-[80px] -mr-24 -mt-16 md:-mr-40" />
          <div className="absolute bottom-0 left-0 w-36 h-36 md:w-64 md:h-64 bg-amber-200/30 rounded-full blur-[60px] -ml-20 -mb-16 md:-ml-32" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-100 px-3 py-1 md:px-4 md:py-1.5 rounded-full mb-3 md:mb-4 shadow-sm">
              <span className="text-base md:text-lg">🩺</span>
              <span className="text-orange-600 font-bold text-[10px] md:text-xs uppercase tracking-wider">
                Veterinary Services
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-3 md:mb-4 leading-tight">
              Book Verified <span className="text-orange-500">Veterinarians</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium px-2">
              Connect with top-rated, certified vets for online consultations or clinic visits. Professional medical advice for your furry companion is just a tap away.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto bg-white p-2.5 md:p-3 rounded-2xl md:rounded-3xl shadow-xl shadow-orange-900/5 border border-slate-100 flex flex-col md:flex-row gap-2 md:gap-2.5">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 rounded-xl">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by vet name, clinic, service area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none font-medium placeholder:font-normal text-slate-800 text-sm py-1.5"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="flex-1 md:flex-initial bg-slate-50 border-0 rounded-xl px-3 py-2.5 md:px-4 md:py-3 outline-none font-bold text-xs text-slate-700 cursor-pointer min-w-0 md:min-w-[120px] appearance-auto"
              >
                <option value="all">📍 All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content & Filters ── */}
      <div className="max-w-6xl mx-auto px-3 md:px-4 mt-6 md:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">

          {/* ── Desktop Side Filters Panel ── */}
          <aside className="hidden lg:block lg:col-span-1 bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-md h-fit lg:sticky lg:top-24">
            <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
              <span>Filters</span>
              <Activity className="w-4 h-4 text-orange-500" />
            </h3>
            <FilterContent
              consultationTypeFilter={consultationTypeFilter}
              setConsultationTypeFilter={setConsultationTypeFilter}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              minRating={minRating}
              setMinRating={setMinRating}
              uniqueCities={uniqueCities}
              cityFilter={cityFilter}
              setCityFilter={setCityFilter}
            />
          </aside>

          {/* ── Listings Area ── */}
          <main className="lg:col-span-3">

            {/* Mobile filter bar + results count */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <p className="text-xs font-bold text-slate-500">
                {filteredVets.length} {filteredVets.length === 1 ? "vet" : "vets"} found
              </p>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm active:scale-95 transition-all"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[9px] font-black ml-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active filter chips (mobile) */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4 lg:hidden">
                {cityFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200">
                    📍 {cityFilter}
                    <button onClick={() => setCityFilter("all")} className="ml-0.5 hover:text-orange-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {consultationTypeFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200">
                    {consultationTypeFilter === "clinic" ? "🏢 Clinic" : consultationTypeFilter === "remote" ? "💻 Online" : "🚨 Emergency"}
                    <button onClick={() => setConsultationTypeFilter("all")} className="ml-0.5 hover:text-orange-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {maxPrice < 3000 && (
                  <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200">
                    ₹{maxPrice} max
                    <button onClick={() => setMaxPrice(3000)} className="ml-0.5 hover:text-orange-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200">
                    ⭐ {minRating}+
                    <button onClick={() => setMinRating(0)} className="ml-0.5 hover:text-orange-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline underline-offset-2 ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {loadingVets ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium text-sm">Searching for veterinarians...</p>
              </div>
            ) : errorMessage ? (
              <div className="bg-red-50 text-red-700 p-4 md:p-5 rounded-2xl flex items-start gap-3 border border-red-100 font-medium text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            ) : filteredVets.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 md:p-16 border border-slate-100 shadow-md text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-5 md:mb-6">
                  <Search className="w-6 h-6 md:w-8 md:h-8 text-slate-300" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">No verified Vets found</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  We couldn&apos;t find any approved veterinarians matching your active filters. Try loosening your filter choices or search term.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {filteredVets.map((vet) => {
                  const hasPricing = vet.consultationFee && vet.consultationFee > 0;
                  const averageRating = vet.ratingAverage || 0;
                  const reviewCount = vet.ratingCount || 0;

                  return (
                    <div
                      key={vet.uid}
                      className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
                    >
                      {/* Card Header */}
                      <div className="p-4 md:p-6 flex-1">
                        <div className="flex gap-3 md:gap-4 items-start">
                          <div className="relative w-12 h-12 md:w-16 md:h-16 shrink-0 overflow-hidden rounded-xl md:rounded-2xl border shadow-inner bg-gradient-to-br from-orange-50 to-amber-50">
                            <Image
                              src={vet.profilePhotoURL || FALLBACK_AVATAR}
                              alt={vet.fullName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 48px, 64px"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 flex-wrap mb-1">
                              <span className="bg-blue-50 text-blue-600 font-extrabold text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3" /> Verified
                              </span>
                              {vet.willingToTravel && (
                                <span className="bg-emerald-50 text-emerald-600 font-extrabold text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  🚗 House Calls
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm md:text-base font-extrabold text-slate-800 truncate leading-snug">
                              Dr. {vet.fullName}
                            </h4>
                            <p className="text-[11px] md:text-xs font-semibold text-slate-500 truncate mt-0.5">
                              {vet.clinicName || "Independent Veterinary Practitioner"}
                            </p>
                          </div>
                        </div>

                        {/* Location Details */}
                        <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2 border-t border-slate-50 pt-3 md:pt-4 text-[11px] md:text-xs font-semibold text-slate-600">
                          <div className="flex items-start gap-1.5 md:gap-2">
                            <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate leading-normal">
                              {vet.clinicAddress || `${vet.city}, ${vet.state}`}
                            </span>
                          </div>
                          {vet.serviceArea && (
                            <div className="flex items-start gap-1.5 md:gap-2 pl-4 md:pl-5">
                              <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">Area:</span>
                              <span className="truncate">{vet.serviceArea}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-1.5 md:gap-2">
                            <span className="text-xs md:text-sm shrink-0">📅</span>
                            <span>{typeof vet.availability === "string" ? vet.availability : (vet.availability || []).join(", ")}</span>
                          </div>
                        </div>

                        {/* Ratings & Price Bar */}
                        <div className="mt-3 md:mt-5 bg-slate-50/50 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Star className={`w-3.5 h-3.5 md:w-4 md:h-4 ${averageRating > 0 ? "fill-orange-500 text-orange-500" : "text-slate-300"}`} />
                            <span className="text-[11px] md:text-xs font-black text-slate-800">{averageRating > 0 ? averageRating.toFixed(1) : "New"}</span>
                            <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">({reviewCount})</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase">Cons. Fee</p>
                            <p className="text-xs md:text-sm font-black text-orange-600">
                              {hasPricing ? `₹${vet.consultationFee}` : "Price unavailable"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CTA Booking Button */}
                      <div className="px-4 pb-4 md:px-6 md:pb-6 pt-0 border-t border-slate-50 bg-white">
                        <button
                          onClick={() => setSelectedVet(vet)}
                          disabled={!hasPricing}
                          className={`w-full py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md min-h-[44px] ${
                            hasPricing
                              ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                          }`}
                        >
                          <span>{hasPricing ? "Book Appointment" : "Unavailable (No Price)"}</span>
                          {hasPricing && <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile Filter Bottom Sheet ── */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[99999] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                  <h3 className="text-base font-extrabold text-slate-800">Filters</h3>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline underline-offset-2"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <FilterContent
                consultationTypeFilter={consultationTypeFilter}
                setConsultationTypeFilter={setConsultationTypeFilter}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                minRating={minRating}
                setMinRating={setMinRating}
                uniqueCities={uniqueCities}
                cityFilter={cityFilter}
                setCityFilter={setCityFilter}
              />

              {/* Apply button */}
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
              >
                Show {filteredVets.length} {filteredVets.length === 1 ? "Vet" : "Vets"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Form Modal ── */}
      {selectedVet && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[99999]">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeBookingModal} />
          
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-8 shadow-2xl relative z-[100000] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 md:mb-6">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-lg md:text-2xl font-black text-slate-800 leading-snug truncate">Book Appointment</h3>
                <p className="text-slate-500 text-[11px] md:text-xs font-semibold mt-0.5 truncate">
                  Dr. {selectedVet.fullName} • {selectedVet.clinicName || "Vet clinic"}
                </p>
              </div>
              <button 
                onClick={closeBookingModal} 
                className="text-slate-400 hover:text-slate-600 p-1.5 md:p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-6 md:py-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                  <CheckCircle className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-2">Booking Requested!</h4>
                <p className="text-slate-500 text-xs md:text-sm max-w-sm mx-auto mb-6">
                  Your payment of ₹{bookingAmount} was successful. We have sent the request to Dr. {selectedVet.fullName} for confirmation.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/dashboard?tab=my-appointments"
                    onClick={closeBookingModal}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition-colors shadow-md"
                  >
                    View My Appointments
                  </Link>
                  <button
                    onClick={closeBookingModal}
                    className="text-slate-500 hover:text-slate-700 font-bold py-3 text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePayAndBook} className="space-y-3.5 md:space-y-4">
                
                {/* Pet Selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Select Patient Pet</label>
                  {pets.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {pets.map(p => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setBookingPetId(p.id)}
                          className={`text-left p-2.5 md:p-3 rounded-xl border-2 flex items-center gap-2 md:gap-3 transition-colors ${
                            bookingPetId === p.id 
                              ? "border-orange-500 bg-orange-50/30 text-orange-700 font-bold" 
                              : "border-slate-100 bg-slate-50 hover:bg-slate-100/50 text-slate-700"
                          }`}
                        >
                          <span className="text-lg md:text-xl">
                            {p.type === "dog" ? "🐕" : p.type === "cat" ? "🐱" : p.type === "bird" ? "🐦" : "🐾"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] md:text-xs font-extrabold truncate">{p.name}</p>
                            <p className="text-[9px] md:text-[10px] text-slate-400 capitalize truncate">{p.breed}</p>
                          </div>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setBookingPetId("manual")}
                        className={`text-left p-2.5 md:p-3 rounded-xl border-2 flex items-center gap-2 md:gap-3 transition-colors ${
                          bookingPetId === "manual" 
                            ? "border-orange-500 bg-orange-50/30 text-orange-700 font-bold" 
                            : "border-slate-100 bg-slate-50 hover:bg-slate-100/50 text-slate-700"
                        }`}
                      >
                        <span className="text-lg md:text-xl">➕</span>
                        <div>
                          <p className="text-[11px] md:text-xs font-extrabold">Enter custom pet</p>
                          <p className="text-[9px] md:text-[10px] text-slate-400">Not registered</p>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-200 mb-2">
                      <p className="text-[11px] text-slate-500 mb-2 font-medium">You don&apos;t have any registered pets. Enter details manually:</p>
                      <button
                        type="button"
                        onClick={() => setBookingPetId("manual")}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Add Custom Pet Info
                      </button>
                    </div>
                  )}

                  {/* Manual Pet details inputs */}
                  {bookingPetId === "manual" && (
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 md:p-3.5 rounded-2xl border mt-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Pet Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Buddy"
                          value={bookingPetName}
                          onChange={(e) => setBookingPetName(e.target.value)}
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-500 font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Pet Type</label>
                        <select
                          value={bookingPetType}
                          onChange={(e) => setBookingPetType(e.target.value)}
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-500 font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="dog">🐕 Dog</option>
                          <option value="cat">🐱 Cat</option>
                          <option value="bird">🐦 Bird</option>
                          <option value="rabbit">🐰 Rabbit</option>
                          <option value="other">🐾 Other</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Phone & Consult Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit phone number"
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      className="w-full bg-slate-50 border rounded-xl px-3 md:px-4 py-2.5 text-xs outline-none focus:border-orange-500 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Consultation Type</label>
                    <select
                      value={bookingConsultType}
                      onChange={(e) => setBookingConsultType(e.target.value as "clinic_visit" | "remote_consultation" | "emergency")}
                      className="w-full bg-slate-50 border rounded-xl px-3 md:px-4 py-2.5 text-xs outline-none focus:border-orange-500 font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="clinic_visit">🏢 Clinic Visit</option>
                      <option value="remote_consultation">💻 Remote (Online)</option>
                      {selectedVet.willingToTravel && (
                        <option value="emergency">🚨 House Call / Emergency</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Date & Time Slot Selection */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Select Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-slate-50 border rounded-xl px-3 md:px-4 py-2.5 text-xs outline-none focus:border-orange-500 font-bold text-slate-800 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Select Time Slot</label>
                    <select
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-slate-50 border rounded-xl px-3 md:px-4 py-2.5 text-xs outline-none focus:border-orange-500 font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="">Choose a slot</option>
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reason & Notes */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Reason for Consultation</label>
                  <textarea
                    required
                    placeholder="Describe symptoms, behavior, or reason for booking..."
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border rounded-xl px-3 md:px-4 py-2.5 text-xs outline-none focus:border-orange-500 font-bold text-slate-800 placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1 mb-1.5">Additional Notes (Optional)</label>
                  <textarea
                    placeholder="Any medications, past history, or details to share..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    rows={1}
                    className="w-full bg-slate-50 border rounded-xl px-3 md:px-4 py-2.5 text-xs outline-none focus:border-orange-500 font-bold text-slate-800 placeholder:font-normal"
                  />
                </div>

                {/* Booking Pricing Breakdown */}
                <div className="bg-slate-50 rounded-2xl p-3.5 md:p-4 border border-slate-100 space-y-1.5 md:space-y-2">
                  <div className="flex justify-between text-[11px] md:text-xs font-semibold text-slate-500">
                    <span>Consultation Fee</span>
                    <span>₹{bookingAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] md:text-xs font-semibold text-slate-500">
                    <span>Platform Fee (Incl.)</span>
                    <span>₹{(bookingAmount * 0.10).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base font-black text-slate-800 pt-2 border-t border-slate-200">
                    <span>Total Payable</span>
                    <span className="text-orange-600">₹{bookingAmount.toFixed(2)}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="bg-red-50 text-red-700 p-3 md:p-3.5 rounded-xl border border-red-100 flex items-start gap-2 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Submit Action buttons */}
                <div className="flex gap-3 pt-2 md:pt-3">
                  <button
                    type="button"
                    onClick={closeBookingModal}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all text-xs min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl text-xs active:scale-95 transition-all disabled:bg-slate-300 shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {isSubmittingBooking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay &amp; Book Appointment</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
