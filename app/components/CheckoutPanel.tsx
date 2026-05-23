"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";
import type { CartItem } from "./cart/cartTypes";

type CheckoutItem = CartItem;

type CheckoutPanelProps = {
  items: CheckoutItem[];
  total: number;
  onBackToCart: () => void;
  onClose: () => void;
  onOrderPlaced: () => void;
};

type AddressType = {
  id?: string;
  label: string;
  full: string;
  line1: string;
  line2: string;
  pincode: string;
  lat?: number;
  lng?: number;
};

type GeoSuggestion = {
  place_id: string;
  display_name: string;
};

export default function CheckoutPanel({
  items,
  total,
  onBackToCart,
  onClose,
  onOrderPlaced,
}: CheckoutPanelProps) {
  const [activeStep, setActiveStep] = useState(2);
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Address states
  const [addressMode, setAddressMode] = useState<"saved" | "detect" | "manual">("saved");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<AddressType | null>(null);

  // Manual address fields
  const [manualLine1, setManualLine1] = useState("");
  const [manualLine2, setManualLine2] = useState("");
  const [manualPincode, setManualPincode] = useState("");
  const [manualLabel, setManualLabel] = useState("Home");
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<GeoSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      setUserName(user?.displayName ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    const q = query(collection(db, "users", userId, "addresses"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const next = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as AddressType),
      }));
      setSavedAddresses(next);
      if (!selectedAddressId && next.length > 0) {
        setSelectedAddressId(next[0].id ?? null);
      }
    });
    return () => unsub();
  }, [userId, selectedAddressId]);

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1),
    0
  );
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const finalTotal = subtotal + deliveryFee - discount;

  const steps = [
    { id: 0, label: "Cart", icon: "🛒" },
    { id: 1, label: "Address", icon: "📍" },
    { id: 2, label: "Payment", icon: "💳" },
    { id: 3, label: "Confirm", icon: "✅" },
  ];

  const paymentMethods = [
    {
      id: "cod",
      label: "Cash on Delivery",
      desc: "Pay when your order arrives",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
    {
      id: "upi",
      label: "UPI Payment",
      desc: "Google Pay, PhonePe, Paytm",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      ),
    },
    {
      id: "card",
      label: "Credit / Debit Card",
      desc: "Visa, Mastercard, RuPay",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
    },
  ];

  const addressLabels = ["Home", "Work", "Hotel", "Other"];

  // ── Auto-detect location ──
  const detectCurrentLocation = async () => {
    setIsDetecting(true);
    setDetectError("");

    if (!navigator.geolocation) {
      setDetectError("Geolocation is not supported by your browser.");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            const line1 = [addr.house_number, addr.road || addr.neighbourhood || addr.suburb]
              .filter(Boolean)
              .join(" ");
            const line2 = [
              addr.city || addr.town || addr.village || addr.state_district,
              addr.state,
            ]
              .filter(Boolean)
              .join(", ");

            setDetectedAddress({
              label: "Current Location",
              full: data.display_name || `${line1}, ${line2} - ${addr.postcode || ""}`,
              line1: line1 || "Detected Location",
              line2: line2 || "",
              pincode: addr.postcode || "",
              lat: latitude,
              lng: longitude,
            });
            setAddressMode("detect");
          } else {
            setDetectError("Could not determine address from your location.");
          }
        } catch {
          setDetectError("Failed to fetch address. Check your internet connection.");
        }
        setIsDetecting(false);
      },
      (error) => {
        const msgs: Record<number, string> = {
          1: "Location permission denied. Please allow access in browser settings.",
          2: "Location information is unavailable.",
          3: "Location request timed out. Please try again.",
        };
        setDetectError(msgs[error.code] || "An unknown error occurred.");
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // ── Address search with debounce ──
  const searchAddress = async (query: string) => {
    if (query.trim().length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchSuggestions(
          data.map((item: { place_id: number; display_name: string }) => ({
            place_id: String(item.place_id),
            display_name: item.display_name,
          }))
        );
        setShowSuggestions(true);
      }
    } catch {
      setSearchSuggestions([]);
    }
    setIsSearching(false);
  };

  const handleSearchInput = (value: string) => {
    setManualSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchAddress(value), 500);
  };

  const handleSelectSuggestion = (suggestion: GeoSuggestion) => {
    setShowSuggestions(false);
    setManualSearchQuery(suggestion.display_name);
    const parts = suggestion.display_name.split(",").map((s) => s.trim());
    setManualLine1(parts.slice(0, 2).join(", "));
    setManualLine2(parts.slice(2, 4).join(", "));
    const pincodeMatch = suggestion.display_name.match(/\b\d{6}\b/);
    setManualPincode(pincodeMatch ? pincodeMatch[0] : "");
  };

  const handleSaveManualAddress = async () => {
    if (!manualLine1.trim()) return;
    if (!userId) {
      setDetectError("Please sign in to save addresses.");
      return;
    }
    const newAddr: AddressType = {
      label: manualLabel,
      full: `${manualLine1}, ${manualLine2}${manualPincode ? " - " + manualPincode : ""}`,
      line1: manualLine1,
      line2: manualLine2,
      pincode: manualPincode,
    };
    const docRef = await addDoc(collection(db, "users", userId, "addresses"), {
      ...newAddr,
      createdAt: serverTimestamp(),
    });
    setSelectedAddressId(docRef.id);
    setAddressMode("saved");
    setManualLine1("");
    setManualLine2("");
    setManualPincode("");
    setManualSearchQuery("");
    setManualLabel("Home");
  };

  const handleUseDetectedAddress = async () => {
    if (!detectedAddress) return;
    if (!userId) {
      setDetectError("Please sign in to save addresses.");
      return;
    }
    const docRef = await addDoc(collection(db, "users", userId, "addresses"), {
      ...detectedAddress,
      createdAt: serverTimestamp(),
    });
    setSelectedAddressId(docRef.id);
    setAddressMode("saved");
    setDetectedAddress(null);
  };

  const getCurrentAddress = (): AddressType | undefined => {
    if (addressMode === "detect" && detectedAddress) return detectedAddress;
    return savedAddresses.find((addr) => addr.id === selectedAddressId) || savedAddresses[0];
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePlaceOrder = async () => {
    setOrderError("");
    if (!userId) {
      setOrderError("Please sign in to place your order.");
      return;
    }
    if (items.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }
    const address = getCurrentAddress();
    if (!address) {
      setOrderError("Please select a delivery address.");
      return;
    }

    const taxes = Math.round(subtotal * 0.05);
    const totalAmount = finalTotal + taxes;
    const paymentStatus = selectedPayment === "cod" ? "pending" : "pending";

    const orderItems = items.map((item) => ({
      productId: item.id,
      productName: item.name,
      quantity: item.qty,
      price: item.price,
      vetId: item.vetId,
      shiprocketPickupId: item.shiprocketPickupId,
    }));

    const vendorGroups = Object.values(
      items.reduce<Record<string, { vetId: string; shiprocketPickupId: number | null; items: typeof orderItems; subtotal: number }>>(
        (acc, item) => {
          const key = item.vetId || "unknown";
          if (!acc[key]) {
            acc[key] = { vetId: item.vetId, shiprocketPickupId: item.shiprocketPickupId, items: [], subtotal: 0 };
          }
          acc[key].items.push({
            productId: item.id,
            productName: item.name,
            quantity: item.qty,
            price: item.price,
            vetId: item.vetId,
            shiprocketPickupId: item.shiprocketPickupId,
          });
          acc[key].subtotal += item.price * item.qty;
          return acc;
        }, {})
    );

    setIsPlacing(true);
    try {
      const orderRef = doc(collection(db, "orders"));
      await runTransaction(db, async (transaction) => {
        for (const item of items) {
          const productRef = doc(db, "products", item.id);
          const snap = await transaction.get(productRef);
          if (!snap.exists()) throw new Error("Product not found");
          const currentStock = Number(snap.data().stockQty ?? 0);
          if (currentStock < item.qty) throw new Error(`Insufficient stock for ${item.name}`);
          transaction.update(productRef, { stockQty: currentStock - item.qty });
        }
        transaction.set(orderRef, {
          orderId: orderRef.id,
          userId,
          userName: userName ?? "",
          items: orderItems,
          vendorGroups,
          subtotal,
          deliveryFee,
          taxes,
          totalAmount,
          address,
          paymentMethod: selectedPayment,
          paymentStatus,
          orderStatus: "placed",
          createdAt: serverTimestamp(),
        });
      });
      onOrderPlaced();
    } catch (err: any) {
      setOrderError(err?.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toLowerCase() === "save10") {
      setPromoApplied(true);
    }
  };

  const currentAddress = getCurrentAddress();

  return (
    <div
      className="fixed inset-0 z-[100001] bg-black/50 backdrop-blur-sm transition-all duration-300"
      onClick={onClose}
      style={{ animation: "fadeIn 0.3s ease-out" }}
    >
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-lg bg-gradient-to-b from-slate-50 to-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* ════════ HEADER ════════ */}
        <div className="relative bg-white border-b border-slate-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBackToCart}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Back to cart"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Checkout</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {items.length} item{items.length !== 1 ? "s" : ""} in your order
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6 px-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => {
                    if (step.id === 0) onBackToCart();
                    else setActiveStep(step.id);
                  }}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step.id < activeStep
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : step.id === activeStep
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 scale-110"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step.id < activeStep ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <span className="text-xs">{step.icon}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${step.id <= activeStep ? "text-slate-700" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-2 mt-[-18px]">
                    <div className="h-[2px] rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${step.id < activeStep ? "w-full bg-emerald-500" : "w-0 bg-orange-500"}`} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ════════ SCROLLABLE CONTENT ════════ */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">

            {/* ──────── DELIVERY ADDRESS CARD ──────── */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Address</p>
                </div>
              </div>

              {/* Tabs: Saved / Auto-Detect / New */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
                {(["saved", "detect", "manual"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setAddressMode(mode);
                      if (mode === "detect" && !detectedAddress && !isDetecting) detectCurrentLocation();
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      addressMode === mode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {mode === "saved" ? "Saved" : mode === "detect" ? "Auto-Detect" : "New Address"}
                  </button>
                ))}
              </div>

              {/* ── SAVED ADDRESSES ── */}
              {addressMode === "saved" && (
                <div className="space-y-2">
                  {savedAddresses.map((addr, idx) => (
                    <label
                      key={addr.id ?? idx}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                        selectedAddressId === addr.id
                          ? "border-orange-200 bg-orange-50/60 shadow-sm"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedAddressId === addr.id ? "border-orange-500" : "border-slate-300"
                      }`}>
                        {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                      </div>
                      <input
                        type="radio"
                        name="savedAddr"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id ?? null)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 uppercase">{addr.label}</span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">{addr.line1}</p>
                        <p className="text-sm text-slate-500">{addr.line2}{addr.pincode ? ` - ${addr.pincode}` : ""}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!userId || !addr.id) return;
                          deleteDoc(doc(db, "users", userId, "addresses", addr.id));
                        }}
                        className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </label>
                  ))}
                  {savedAddresses.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No saved addresses. Add one below.</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Delivers in 25-30 min
                    </span>
                  </div>
                </div>
              )}

              {/* ── AUTO-DETECT ── */}
              {addressMode === "detect" && (
                <div className="space-y-3">
                  {isDetecting && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-600">Detecting your location...</p>
                      <p className="text-xs text-slate-400">Please allow location access if prompted</p>
                    </div>
                  )}

                  {detectError && !isDetecting && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-700">Detection Failed</p>
                          <p className="text-xs text-red-600 mt-0.5">{detectError}</p>
                        </div>
                      </div>
                      <button
                        onClick={detectCurrentLocation}
                        className="mt-3 w-full py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {detectedAddress && !isDetecting && (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-800">Location Detected!</p>
                            <p className="text-sm text-emerald-700 mt-1 leading-relaxed">{detectedAddress.line1}</p>
                            <p className="text-sm text-emerald-600">{detectedAddress.line2}{detectedAddress.pincode ? ` - ${detectedAddress.pincode}` : ""}</p>
                            {detectedAddress.lat && (
                              <p className="text-[10px] text-emerald-500 mt-1 font-mono">
                                {detectedAddress.lat.toFixed(4)}°N, {detectedAddress.lng?.toFixed(4)}°E
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={detectCurrentLocation}
                          className="py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Re-detect
                        </button>
                        <button
                          onClick={handleUseDetectedAddress}
                          className="py-2.5 text-xs font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors"
                        >
                          Use This Address
                        </button>
                      </div>
                    </div>
                  )}

                  {!isDetecting && !detectError && !detectedAddress && (
                    <button
                      onClick={detectCurrentLocation}
                      className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      Detect My Location
                    </button>
                  )}
                </div>
              )}

              {/* ── MANUAL / NEW ADDRESS ── */}
              {addressMode === "manual" && (
                <div className="space-y-3">
                  {/* Search bar with suggestions */}
                  <div ref={searchContainerRef} className="relative">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      <input
                        type="text"
                        value={manualSearchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true); }}
                        placeholder="Search for area, street, locality..."
                        className="w-full pl-10 pr-10 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-slate-300 bg-slate-50"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
                        </div>
                      )}
                      {manualSearchQuery && !isSearching && (
                        <button
                          onClick={() => {
                            setManualSearchQuery("");
                            setSearchSuggestions([]);
                            setShowSuggestions(false);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Suggestions dropdown */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                        {searchSuggestions.map((s) => (
                          <button
                            key={s.place_id}
                            onClick={() => handleSelectSuggestion(s)}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 border-b border-slate-50 last:border-0 flex items-start gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span className="line-clamp-2">{s.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Use GPS button */}
                  <button
                    onClick={() => {
                      setAddressMode("detect");
                      if (!detectedAddress && !isDetecting) detectCurrentLocation();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:border-orange-300 hover:text-orange-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use current location instead
                  </button>

                  <div className="h-px bg-slate-100" />

                  {/* Address form fields */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      House / Flat / Floor No. *
                    </label>
                    <input
                      type="text"
                      value={manualLine1}
                      onChange={(e) => setManualLine1(e.target.value)}
                      placeholder="e.g. Flat 402, Tower B"
                      className="mt-1 w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Area / Locality / City
                    </label>
                    <input
                      type="text"
                      value={manualLine2}
                      onChange={(e) => setManualLine2(e.target.value)}
                      placeholder="e.g. Koramangala, Bangalore"
                      className="mt-1 w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={manualPincode}
                      onChange={(e) => setManualPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="e.g. 560034"
                      maxLength={6}
                      className="mt-1 w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-slate-300 font-mono"
                    />
                  </div>

                  {/* Label selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Save As</label>
                    <div className="flex gap-2 mt-2">
                      {addressLabels.map((lbl) => (
                        <button
                          key={lbl}
                          onClick={() => setManualLabel(lbl)}
                          className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                            manualLabel === lbl
                              ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveManualAddress}
                    disabled={!manualLine1.trim()}
                    className={`w-full py-3 text-sm font-bold rounded-xl transition-all ${
                      manualLine1.trim()
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Save &amp; Use This Address
                  </button>
                </div>
              )}
            </div>

            {/* ──────── SELECTED ADDRESS BANNER ──────── */}
            {addressMode === "saved" && currentAddress && (
              <div className="flex items-center gap-3 rounded-xl bg-orange-50 border border-orange-100 p-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-orange-700">Delivering to {currentAddress.label}</p>
                  <p className="text-xs text-orange-600 truncate">{currentAddress.line1}, {currentAddress.line2}</p>
                </div>
              </div>
            )}

            {/* ──────── PAYMENT METHOD ──────── */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Method</p>
              </div>
              <div className="space-y-2 ml-1">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                      selectedPayment === method.id
                        ? "border-orange-200 bg-orange-50/60 shadow-sm"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedPayment === method.id ? "border-orange-500" : "border-slate-300"
                    }`}>
                      {selectedPayment === method.id && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                    </div>
                    <input type="radio" name="payment" value={method.id} checked={selectedPayment === method.id} onChange={() => setSelectedPayment(method.id)} className="sr-only" />
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedPayment === method.id ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      {method.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{method.label}</p>
                      <p className="text-xs text-slate-400">{method.desc}</p>
                    </div>
                    {method.id === "upi" && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* ──────── ORDER ITEMS ──────── */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Summary</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">{items.length} item{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-0 ml-1">
                {items.map((item, index) => (
                  <div key={item.id} className={`flex items-center gap-3 py-3 ${index !== items.length - 1 ? "border-b border-slate-100" : ""}`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                      <span className="text-lg">🍽️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">₹{Number(item.price).toLocaleString("en-IN")} × {item.qty || 1}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 flex-shrink-0">₹{((Number(item.price) || 0) * (item.qty || 1)).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ──────── PROMO CODE ──────── */}
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Promo Code</p>
              </div>
              {promoApplied ? (
                <div className="flex items-center gap-2 ml-1 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-700">SAVE10 applied!</p>
                    <p className="text-xs text-emerald-600">You save ₹{discount.toLocaleString("en-IN")}</p>
                  </div>
                  <button onClick={() => { setPromoApplied(false); setPromoCode(""); }} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2 ml-1">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder='Try "SAVE10"'
                    className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-slate-300"
                  />
                  <button onClick={handleApplyPromo} className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* ──────── BILL DETAILS ──────── */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bill Details</p>
              </div>
              <div className="space-y-2.5 ml-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Item Total</span>
                  <span className="text-slate-700 font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1">
                    Delivery Fee
                    {deliveryFee === 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">FREE</span>}
                  </span>
                  <span className={`font-medium ${deliveryFee === 0 ? "line-through text-slate-300" : "text-slate-700"}`}>₹40</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 font-medium">Promo Discount</span>
                    <span className="text-emerald-600 font-semibold">-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Taxes &amp; Charges</span>
                  <span className="text-slate-700 font-medium">₹{Math.round(subtotal * 0.05).toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-2.5 mt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Grand Total</span>
                    <span className="text-lg font-extrabold text-slate-900">₹{(finalTotal + Math.round(subtotal * 0.05)).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-xs font-medium">Secure checkout</span>
              </div>
              <span className="text-slate-200">•</span>
              <div className="flex items-center gap-1.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-xs font-medium">256-bit encrypted</span>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ FIXED BOTTOM CTA ════════ */}
        <div className="border-t border-slate-100 bg-white p-4 space-y-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {orderError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {orderError}
            </div>
          )}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Amount</p>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                ₹{(finalTotal + Math.round(subtotal * 0.05)).toLocaleString("en-IN")}
              </p>
            </div>
            {discount > 0 && (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  🎉 You save ₹{discount.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={onBackToCart}
              className="col-span-1 flex items-center justify-center rounded-2xl border border-slate-200 py-3.5 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
              aria-label="Back to cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className={`col-span-4 relative overflow-hidden rounded-2xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] ${
                isPlacing
                  ? "bg-orange-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
              }`}
            >
              {isPlacing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Placing Order...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Place Order
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              )}
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-300 font-medium">
            By placing this order, you agree to our Terms of Service
          </p>
        </div>
      </aside>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}