"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  updateDoc,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  MapPin,
  CreditCard,
  CheckCircle2,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Truck,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Plus,
  Search,
  Loader2,
  Lock,
  Tag,
  Sparkles,
  Phone,
  Home,
  Briefcase,
  Building2,
  Navigation,
  RefreshCw,
  ArrowRight,
  Wallet,
  Banknote,
  Package,
} from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { fetchBrandProfile } from "@/app/lib/seller";
import { sanitizeIndianPhone, extractPincodeState } from "@/app/lib/shiprocket";
import type { CartItem } from "./cart/cartTypes";
import { calculateCheckoutTotals } from "./cart/cartHelpers";
import type { CheckoutTotals } from "./cart/cartHelpers";
import { PLATFORM_COMMISSION_RATE, createSellerPayout } from "@/app/lib/orders";

type CheckoutItem = CartItem;

export interface CheckoutPanelProps {
  items: CheckoutItem[];
  onBackToCart: () => void;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export interface AddressType {
  id?: string;
  label: string;
  full: string;
  line1: string;
  line2: string;
  pincode: string;
  state?: string;
  lat?: number;
  lng?: number;
}

interface GeoSuggestion {
  place_id: string;
  display_name: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Lakshadweep",
  "Puducherry",
  "Ladakh",
] as const;

export default function CheckoutPanel({
  items,
  onBackToCart,
  onClose,
  onOrderPlaced,
}: CheckoutPanelProps) {
  const router = useRouter();

  // Active step: 1 = Cart Review, 2 = Delivery Address, 3 = Payment Method
  const [activeStep, setActiveStep] = useState<number>(2);
  const [selectedPayment, setSelectedPayment] = useState<"online" | "cod">("online");
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [promoError, setPromoError] = useState<string>("");
  const [isPlacing, setIsPlacing] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string>("");

  // Razorpay online payment state
  const [paymentState, setPaymentState] = useState<
    "idle" | "creating_order" | "processing_payment" | "verifying"
  >("idle");

  // User state
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>("");

  // Address states
  const [addressMode, setAddressMode] = useState<"saved" | "detect" | "manual">("saved");
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectError, setDetectError] = useState<string>("");
  const [savedAddresses, setSavedAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<AddressType | null>(null);

  // Manual address fields
  const [manualLine1, setManualLine1] = useState<string>("");
  const [manualLine2, setManualLine2] = useState<string>("");
  const [manualPincode, setManualPincode] = useState<string>("");
  const [manualState, setManualState] = useState<string>("");
  const [manualLabel, setManualLabel] = useState<string>("Home");
  const [manualSearchQuery, setManualSearchQuery] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<GeoSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const stateManuallySet = useRef(false);

  // Track mounted state for portal
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Listen for Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      setUserName(user?.displayName ?? null);
      if (user?.phoneNumber) {
        setCustomerPhone(user.phoneNumber.replace(/\D/g, "").slice(-10));
      }
    });
    return () => unsub();
  }, []);

  // Listen for Saved Addresses in Firestore
  useEffect(() => {
    if (!userId) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    const q = query(collection(db, "users", userId, "addresses"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const next = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as AddressType),
        }));
        setSavedAddresses(next);
        if (!selectedAddressId && next.length > 0) {
          setSelectedAddressId(next[0].id ?? null);
        }
      },
      (err) => {
        console.error("Error loading user addresses:", err);
      }
    );
    return () => unsub();
  }, [userId, selectedAddressId]);

  // ── Pricing Totals ──
  const totals: CheckoutTotals = calculateCheckoutTotals(items, promoApplied);
  const { subtotal, deliveryFee, discount, total } = totals;

  // ── Firebase Functions: send order confirmation email (non-blocking) ──
  const functions = getFunctions();
  const sendOrderConfirmation = httpsCallable(functions, "sendOrderConfirmation");

  const getCurrentAddress = useCallback((): AddressType | undefined => {
    if (addressMode === "detect" && detectedAddress) return detectedAddress;
    if (addressMode === "manual" && manualLine1.trim()) {
      return {
        label: manualLabel,
        full: `${manualLine1}, ${manualLine2}${manualPincode ? ` - ${manualPincode}` : ""}`,
        line1: manualLine1,
        line2: manualLine2,
        pincode: manualPincode,
        state: manualState || extractPincodeState(manualPincode),
      };
    }
    return savedAddresses.find((addr) => addr.id === selectedAddressId) || savedAddresses[0];
  }, [addressMode, detectedAddress, manualLine1, manualLine2, manualPincode, manualState, manualLabel, savedAddresses, selectedAddressId]);

  const sendOrderEmailAsync = useCallback(
    async (orderId: string) => {
      try {
        const email = auth.currentUser?.email;
        if (!email) return;
        const address = getCurrentAddress();
        await sendOrderConfirmation({
          orderId,
          customerName: userName || "",
          customerEmail: email,
          items: items.map((item) => ({
            productName: item.name,
            quantity: item.qty,
            price: item.price,
          })),
          subtotal,
          deliveryFee,
          totalAmount: total,
          paymentMethod: selectedPayment,
          shippingAddress: address
            ? `${address.line1}, ${address.line2}${address.pincode ? ` - ${address.pincode}` : ""}`
            : "",
          orderDate: new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      } catch (err) {
        console.warn("[ORDER EMAIL] Failed to send (non-blocking):", err);
      }
    },
    [items, userName, subtotal, deliveryFee, total, selectedPayment, getCurrentAddress, sendOrderConfirmation]
  );

  // ── Auto-detect location ──
  const detectCurrentLocation = async () => {
    setIsDetecting(true);
    setDetectError("");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
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

            const detectedState = addr.state || extractPincodeState(addr.postcode || "");
            const detectedPhone = addr.phone || "";
            if (detectedPhone && !customerPhone) {
              setCustomerPhone(detectedPhone.replace(/\D/g, "").slice(-10));
            }
            setDetectedAddress({
              label: "Current Location",
              full: data.display_name || `${line1}, ${line2} - ${addr.postcode || ""}`,
              line1: line1 || "Detected Location",
              line2: line2 || "",
              pincode: addr.postcode || "",
              state: detectedState,
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
        setDetectError(msgs[error.code] || "An error occurred detecting location.");
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // ── Address search with debounce ──
  const searchAddress = async (q: string) => {
    if (q.trim().length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in&addressdetails=1`,
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
    const stateParts = parts.filter((p) => !/\d{6}/.test(p) && !/^India$/i.test(p));
    const possibleState = stateParts[stateParts.length - 1] || "";
    if (possibleState && /^[A-Za-z\s]+$/.test(possibleState)) {
      setManualState(possibleState);
    }
  };

  const handleSaveManualAddress = async () => {
    if (!manualLine1.trim()) return;
    if (!userId) {
      setDetectError("Please sign in to save addresses.");
      return;
    }
    const detectedState = extractPincodeState(manualPincode);
    const newAddr: AddressType = {
      label: manualLabel,
      full: `${manualLine1}, ${manualLine2}${manualPincode ? " - " + manualPincode : ""}`,
      line1: manualLine1,
      line2: manualLine2,
      pincode: manualPincode,
      state: manualState || detectedState,
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
    setManualState("");
    stateManuallySet.current = false;
    setManualSearchQuery("");
    setManualLabel("Home");
  };

  const handleUseDetectedAddress = async () => {
    if (!detectedAddress) return;
    if (userId) {
      const docRef = await addDoc(collection(db, "users", userId, "addresses"), {
        ...detectedAddress,
        createdAt: serverTimestamp(),
      });
      setSelectedAddressId(docRef.id);
      setAddressMode("saved");
      setDetectedAddress(null);
    }
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

  // ── Razorpay Script Loader ──
  const loadRazorpayScript = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // ── Create Firestore Order (Atomic Transaction) ──
  const createFirestoreOrder = useCallback(
    async (params: {
      address: AddressType;
      paymentMethod: string;
      paymentStatus: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      paidAt?: any;
    }): Promise<string> => {
      const { address, paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId, paidAt } = params;

      const orderItems = items.map((item) => ({
        productId: item.id,
        productName: item.name,
        productImage: item.imageUrl || "",
        quantity: item.qty,
        price: item.price,
        weight: item.weight ?? 0.5,
        length: item.length ?? null,
        breadth: item.breadth ?? null,
        height: item.height ?? null,
        brandId: item.brandId,
        brandName: item.brandName || "AnimalSathi Verified",
        shiprocketPickupId: item.shiprocketPickupId ?? null,
      }));

      const vendorGroups = Object.values(
        items.reduce<
          Record<
            string,
            {
              brandId: string;
              brandName: string;
              shiprocketPickupId: number | null;
              shiprocketPickupName: string | null;
              items: typeof orderItems;
              subtotal: number;
              platformFee: number;
              sellerPayoutAmount: number;
            }
          >
        >((acc, item) => {
          const key = item.brandId || "unknown";
          if (!acc[key]) {
            acc[key] = {
              brandId: item.brandId,
              brandName: item.brandName || "AnimalSathi Verified",
              shiprocketPickupId: item.shiprocketPickupId ?? null,
              shiprocketPickupName: null,
              items: [],
              subtotal: 0,
              platformFee: 0,
              sellerPayoutAmount: 0,
            };
          }
          acc[key].items.push({
            productId: item.id,
            productName: item.name,
            productImage: item.imageUrl || "",
            quantity: item.qty,
            price: item.price,
            weight: item.weight ?? 0.5,
            length: item.length ?? null,
            breadth: item.breadth ?? null,
            height: item.height ?? null,
            brandId: item.brandId,
            brandName: item.brandName || "AnimalSathi Verified",
            shiprocketPickupId: item.shiprocketPickupId ?? null,
          });
          acc[key].subtotal += item.price * item.qty;
          return acc;
        }, {})
      ).map((group, _, arr) => {
        const fee = Math.round(group.subtotal * PLATFORM_COMMISSION_RATE);
        const totalSubtotal = arr.reduce((sum, g) => sum + g.subtotal, 0);
        const deliveryShare =
          totalSubtotal > 0
            ? Math.round((deliveryFee * (group.subtotal / totalSubtotal)) * 100) / 100
            : 0;
        return {
          ...group,
          platformFee: fee,
          sellerPayoutAmount: group.subtotal - fee + deliveryShare,
        };
      });

      const totalPlatformFee = vendorGroups.reduce((sum, g) => sum + g.platformFee, 0);
      const totalSellerPayout = vendorGroups.reduce((sum, g) => sum + g.sellerPayoutAmount, 0);

      const orderRef = doc(collection(db, "orders"));
      const orderRefId = orderRef.id;

      await runTransaction(db, async (transaction) => {
        // 1. Read all product docs first
        const productSnapshots = await Promise.all(
          items.map(async (item) => {
            const productRef = doc(db, "products", item.id);
            const snap = await transaction.get(productRef);
            return { item, productRef, snap };
          })
        );

        // 2. Validate stock levels
        const stockValues: number[] = [];
        for (const { item, snap } of productSnapshots) {
          if (!snap.exists()) throw new Error(`Product not found: ${item.name}`);
          const currentStock = Number(snap.data()!.stockQty ?? 0);
          if (currentStock < item.qty) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
          stockValues.push(currentStock);
        }

        // 3. Write updates
        for (let i = 0; i < productSnapshots.length; i++) {
          const { item, productRef } = productSnapshots[i];
          const currentStock = stockValues[i];
          transaction.update(productRef, { stockQty: currentStock - item.qty });
        }

        const vendorIds = [...new Set(orderItems.map((item) => item.brandId).filter(Boolean))];

        transaction.set(orderRef, {
          orderId: orderRef.id,
          userId,
          userName: userName ?? "",
          customerEmail: auth.currentUser?.email || "",
          customerPhone: customerPhone ? sanitizeIndianPhone(customerPhone) : "",
          vendorIds,
          items: orderItems,
          vendorGroups,
          shipments: [],
          subtotal,
          deliveryFee,
          totalAmount: total,
          address,
          paymentMethod,
          paymentStatus,
          razorpayOrderId: razorpayOrderId || null,
          razorpayPaymentId: razorpayPaymentId || null,
          paidAt: paidAt || null,
          orderStatus: "placed",
          createdAt: serverTimestamp(),
          totalPlatformFee,
          totalSellerPayout,
        });
      });

      // 4. Shiprocket order creation per vendor (non-blocking)
      const createShipmentsAsync = async () => {
        const shipmentResults: any[] = [];
        for (const group of vendorGroups) {
          try {
            const brandProfile = await fetchBrandProfile(group.brandId);
            if (!brandProfile?.shiprocketPickupName) {
              continue;
            }
            const totalWeight = group.items.reduce(
              (sum, i) => sum + (i.weight || 0.5) * i.quantity,
              0
            );
            const dims = group.items.map((i) => ({
              length: i.length || null,
              breadth: i.breadth || null,
              height: i.height || null,
            }));
            const avgLength = dims.some((d) => d.length !== null)
              ? Math.max(...dims.filter((d) => d.length !== null).map((d) => d.length!))
              : 10;
            const avgBreadth = dims.some((d) => d.breadth !== null)
              ? Math.max(...dims.filter((d) => d.breadth !== null).map((d) => d.breadth!))
              : 10;
            const avgHeight = dims.some((d) => d.height !== null)
              ? Math.max(...dims.filter((d) => d.height !== null).map((d) => d.height!))
              : 10;

            const lineParts = (address?.line2 || "")
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
            const detectedCity =
              lineParts.length > 1 ? lineParts[lineParts.length - 2] : lineParts[0] || "";
            const detectedState =
              address?.state ||
              extractPincodeState(address?.pincode || "") ||
              (lineParts.length > 1 ? lineParts[lineParts.length - 1] : "");

            const response = await fetch("/api/shiprocket/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderRefId,
                brandId: group.brandId,
                brandName: group.brandName,
                pickupLocationName: brandProfile.shiprocketPickupName,
                customerName: userName || "Customer",
                customerEmail: auth.currentUser?.email || "",
                customerPhone: sanitizeIndianPhone(customerPhone || ""),
                shippingAddress: address?.full || address?.line1 || "",
                city: detectedCity,
                state: detectedState,
                pincode: address?.pincode || "",
                paymentMethod,
                subtotal: group.subtotal,
                items: group.items.map((i) => ({
                  productId: i.productId,
                  productName: i.productName,
                  quantity: i.quantity,
                  price: i.price,
                })),
                totalWeight,
                totalLength: avgLength,
                totalBreadth: avgBreadth,
                totalHeight: avgHeight,
              }),
            });

            const result = await response.json();
            if (result.success && result.data) {
              shipmentResults.push(result.data);
            }
          } catch (err) {
            console.error(`Shiprocket shipment creation error for ${group.brandName}:`, err);
          }
        }

        if (shipmentResults.length > 0) {
          try {
            await updateDoc(doc(db, "orders", orderRefId), {
              shipments: shipmentResults,
            });
          } catch (err) {
            console.error("Failed to update shipment records on order:", err);
          }
        }
      };
      createShipmentsAsync();

      // 5. Seller Payouts (non-blocking)
      const createPayoutsAsync = async () => {
        for (const group of vendorGroups) {
          if (!group.brandId || group.brandId === "unknown") continue;
          try {
            await createSellerPayout({
              sellerId: group.brandId,
              sellerName: group.brandName,
              orderId: orderRefId,
              orderItemCount: group.items.length,
              amount: group.sellerPayoutAmount,
              platformFee: group.platformFee,
            });
          } catch (err) {
            console.error(`Failed to create payout for ${group.brandName}:`, err);
          }
        }
      };
      createPayoutsAsync();

      // 6. Email Confirmation (non-blocking)
      sendOrderEmailAsync(orderRefId);

      return orderRefId;
    },
    [items, userId, userName, subtotal, deliveryFee, total, customerPhone, sendOrderEmailAsync]
  );

  // ── Online Payment via Razorpay ──
  const handleOnlinePayment = useCallback(
    async (address: AddressType) => {
      try {
        setPaymentState("creating_order");
        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: "INR",
          }),
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to initialize payment gateway");
        }

        const orderData = await orderRes.json();
        if (!orderData.success) {
          throw new Error(orderData.error || "Failed to create payment order");
        }

        setPaymentState("processing_payment");
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load payment gateway. Check internet connection.");
        }

        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!keyId) {
          throw new Error("Payment gateway configuration missing");
        }

        const options = {
          key: keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "AnimalSathi",
          description: "Pet Essentials & Pharmacy Checkout",
          order_id: orderData.orderId,
          prefill: {
            name: userName || "",
            email: auth.currentUser?.email || "",
            contact: customerPhone,
          },
          theme: {
            color: "#9c3e23",
          },
          handler: async (response: any) => {
            try {
              setPaymentState("verifying");
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (!verifyRes.ok) {
                const errData = await verifyRes.json().catch(() => ({}));
                throw new Error(errData.error || "Payment verification failed");
              }

              const verifyData = await verifyRes.json();
              if (!verifyData.success) {
                throw new Error("Payment verification rejected");
              }

              const orderRefId = await createFirestoreOrder({
                address,
                paymentMethod: "online",
                paymentStatus: "paid",
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                paidAt: serverTimestamp(),
              });

              onOrderPlaced(orderRefId);
              router.push(`/order-success/${orderRefId}`);
            } catch (err: any) {
              setOrderError(err?.message || "Payment verification failed. Please contact support.");
              setPaymentState("idle");
              setIsPlacing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setOrderError("Payment cancelled. You can try again.");
              setPaymentState("idle");
              setIsPlacing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          setOrderError(response.error?.description || "Payment failed. Please try again.");
          setPaymentState("idle");
          setIsPlacing(false);
        });

        rzp.open();
      } catch (err: any) {
        setOrderError(err?.message || "An error occurred during payment.");
        setPaymentState("idle");
        setIsPlacing(false);
      }
    },
    [total, userName, customerPhone, loadRazorpayScript, createFirestoreOrder, onOrderPlaced, router]
  );

  // ── Place Order Action ──
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
      setOrderError("Please provide a valid delivery address.");
      setActiveStep(2);
      return;
    }
    if (!customerPhone || customerPhone.replace(/\D/g, "").length < 10) {
      setOrderError("Please enter a valid 10-digit phone number for delivery.");
      setActiveStep(2);
      return;
    }

    setIsPlacing(true);

    if (selectedPayment === "cod") {
      try {
        const orderRefId = await createFirestoreOrder({
          address,
          paymentMethod: "cod",
          paymentStatus: "pending",
        });
        onOrderPlaced(orderRefId);
        router.push(`/order-success/${orderRefId}`);
      } catch (err: any) {
        setOrderError(err?.message || "Failed to place COD order. Please try again.");
        setIsPlacing(false);
      }
    } else {
      await handleOnlinePayment(address);
    }
  };

  const handleApplyPromo = () => {
    setPromoError("");
    if (promoCode.trim().toLowerCase() === "save10" || promoCode.trim().toLowerCase() === "pawsome") {
      setPromoApplied(true);
    } else {
      setPromoError("Invalid promo code. Try 'SAVE10' or 'PAWSOME'.");
    }
  };

  const currentAddress = getCurrentAddress();

  const steps = [
    { id: 1, label: "Cart Review", icon: ShoppingCart },
    { id: 2, label: "Delivery Address", icon: MapPin },
    { id: 3, label: "Payment & Place", icon: CreditCard },
  ];

  if (!mounted) return null;

  const panel = (
    <div
      className="fixed inset-0 z-[200000] flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Slide-in Panel */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-10 w-full max-w-xl bg-warm-surface text-on-surface shadow-2xl flex flex-col h-full overflow-hidden border-l border-warm-line"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ════════ HEADER & STEP PROGRESSION ════════ */}
        <div className="bg-white border-b border-warm-line px-5 py-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={activeStep > 1 ? () => setActiveStep((s) => s - 1) : onBackToCart}
                className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-container flex items-center justify-center text-neutral-600 transition-colors border border-warm-line"
                aria-label="Previous step or back to cart"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 id="checkout-modal-title" className="text-base font-black text-neutral-900 tracking-tight">
                  Checkout
                </h2>
                <p className="text-[11px] text-neutral-500 font-medium">
                  {items.length} item{items.length !== 1 ? "s" : ""} • Total ₹{total.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition-colors"
              aria-label="Close checkout modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Progression Bar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {steps.map((st, idx) => {
              const IconComp = st.icon;
              const isPast = st.id < activeStep;
              const isCurrent = st.id === activeStep;

              return (
                <div key={st.id} className="flex-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveStep(st.id)}
                    className="flex items-center gap-2 group text-left cursor-pointer"
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        isPast
                          ? "bg-emerald-600 text-white shadow-sm"
                          : isCurrent
                          ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                          : "bg-surface text-neutral-400 border border-warm-line"
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <IconComp className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={`hidden sm:inline text-xs font-bold transition-colors ${
                        isCurrent
                          ? "text-primary"
                          : isPast
                          ? "text-neutral-800"
                          : "text-neutral-400"
                      }`}
                    >
                      {st.label}
                    </span>
                  </button>

                  {idx < steps.length - 1 && (
                    <div className="flex-1 mx-2 h-0.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-emerald-600 transition-all duration-300 ${
                          activeStep > st.id ? "w-full" : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ════════ SCROLLABLE CONTENT BODY ════════ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* STEP 1: CART REVIEW */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-warm-line shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-warm-line">
                  <h3 className="text-xs font-extrabold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    <span>Review Order Items ({items.length})</span>
                  </h3>
                </div>

                <div className="divide-y divide-warm-line">
                  {items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-warm-line relative overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="56px"
                            unoptimized={
                              typeof item.imageUrl === "string" &&
                              (item.imageUrl.includes("firebasestorage.googleapis.com") ||
                                item.imageUrl.includes("storage.googleapis.com"))
                            }
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-neutral-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-secondary font-medium truncate">
                          {item.brandName || "AnimalSathi Verified"}
                        </p>
                        <p className="text-xs text-neutral-500 font-bold mt-0.5">
                          ₹{Number(item.price).toLocaleString("en-IN")} × {item.qty}
                        </p>
                      </div>

                      <p className="text-sm font-black text-neutral-900 flex-shrink-0">
                        ₹{(Number(item.price) * item.qty).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free shipping banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-900">
                <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 text-xs">
                  {subtotal >= 499 ? (
                    <span className="font-bold">🎉 Congratulations! You unlocked FREE Delivery.</span>
                  ) : (
                    <span>
                      Add <strong className="font-bold">₹{(499 - subtotal).toLocaleString("en-IN")}</strong> more for FREE delivery.
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-container active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Continue to Delivery Address</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: DELIVERY ADDRESS */}
          {activeStep === 2 && (
            <div className="space-y-4">
              {/* Delivery Address Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-warm-line shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-warm-line">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider">
                      Shipping Details
                    </h3>
                  </div>
                </div>

                {/* Tabs: Saved / Auto-Detect / New */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-surface rounded-xl border border-warm-line">
                  {(["saved", "detect", "manual"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setAddressMode(mode);
                        if (mode === "detect" && !detectedAddress && !isDetecting) detectCurrentLocation();
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                        addressMode === mode
                          ? "bg-white text-primary shadow-sm"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      {mode === "saved" ? "Saved" : mode === "detect" ? "Auto-Detect" : "New Address"}
                    </button>
                  ))}
                </div>

                {/* ── MODE 1: SAVED ADDRESSES ── */}
                {addressMode === "saved" && (
                  <div className="space-y-2.5">
                    {savedAddresses.map((addr, idx) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <label
                          key={addr.id ?? idx}
                          className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer border transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-warm-line hover:border-neutral-300 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedAddr"
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id ?? null)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? "border-primary" : "border-neutral-300"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-neutral-900 uppercase">
                                {addr.label}
                              </span>
                              {idx === 0 && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-700 font-medium mt-1 leading-snug">
                              {addr.line1}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {addr.line2}
                              {addr.pincode ? ` - ${addr.pincode}` : ""}
                              {addr.state ? `, ${addr.state}` : ""}
                            </p>
                          </div>

                          {addr.id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!userId || !addr.id) return;
                                deleteDoc(doc(db, "users", userId, "addresses", addr.id));
                              }}
                              className="text-neutral-300 hover:text-rose-500 p-1 transition-colors"
                              title="Delete address"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </label>
                      );
                    })}

                    {savedAddresses.length === 0 && (
                      <div className="text-center py-6 bg-surface rounded-xl border border-dashed border-warm-line">
                        <MapPin className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                        <p className="text-xs text-neutral-500 font-medium">
                          No saved addresses found. Add one with Auto-Detect or New Address!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── MODE 2: AUTO DETECT LOCATION ── */}
                {addressMode === "detect" && (
                  <div className="space-y-3">
                    {isDetecting && (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-xs font-bold text-neutral-700">
                          Detecting your precise address via GPS...
                        </p>
                      </div>
                    )}

                    {detectError && !isDetecting && (
                      <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-rose-800">Location detection failed</p>
                          <p className="text-rose-600 mt-0.5">{detectError}</p>
                          <button
                            type="button"
                            onClick={detectCurrentLocation}
                            className="mt-2 text-xs font-bold text-rose-700 underline"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    )}

                    {detectedAddress && !isDetecting && (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0 text-xs">
                              <p className="font-bold text-emerald-900">Location Found</p>
                              <p className="text-neutral-800 font-semibold mt-1 leading-snug">
                                {detectedAddress.line1}
                              </p>
                              <p className="text-neutral-600 mt-0.5">
                                {detectedAddress.line2}
                                {detectedAddress.pincode ? ` - ${detectedAddress.pincode}` : ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={detectCurrentLocation}
                            className="py-2.5 px-3 rounded-xl border border-warm-line bg-white hover:bg-surface text-xs font-bold text-neutral-700 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Re-detect</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleUseDetectedAddress}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Address</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {!isDetecting && !detectError && !detectedAddress && (
                      <button
                        type="button"
                        onClick={detectCurrentLocation}
                        className="w-full py-6 border-2 border-dashed border-warm-line rounded-2xl hover:border-primary/40 text-neutral-600 hover:text-primary flex flex-col items-center justify-center gap-2 transition-all group bg-white"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Navigation className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold">Use Current GPS Location</span>
                        <span className="text-[10px] text-neutral-400">
                          Detects street, area & postal pincode automatically
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* ── MODE 3: NEW / MANUAL ADDRESS ── */}
                {addressMode === "manual" && (
                  <div className="space-y-3.5">
                    {/* Search bar with autocomplete */}
                    <div ref={searchContainerRef} className="relative">
                      <div className="relative">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={manualSearchQuery}
                          onChange={(e) => handleSearchInput(e.target.value)}
                          onFocus={() => {
                            if (searchSuggestions.length > 0) setShowSuggestions(true);
                          }}
                          placeholder="Search locality, building, street..."
                          className="w-full pl-10 pr-10 py-2.5 bg-surface border border-warm-line rounded-xl text-xs font-medium placeholder:text-neutral-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                        {isSearching && (
                          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                        )}
                      </div>

                      {showSuggestions && searchSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-warm-line rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-warm-line">
                          {searchSuggestions.map((s) => (
                            <button
                              key={s.place_id}
                              type="button"
                              onClick={() => handleSelectSuggestion(s)}
                              className="w-full text-left px-3.5 py-2.5 text-xs text-neutral-700 hover:bg-primary/5 hover:text-primary transition-colors flex items-start gap-2"
                            >
                              <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{s.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                        Flat / House / Building *
                      </label>
                      <input
                        type="text"
                        value={manualLine1}
                        onChange={(e) => setManualLine1(e.target.value)}
                        placeholder="e.g. Flat 402, Block B, Green Heights"
                        className="w-full px-3.5 py-2.5 bg-surface border border-warm-line rounded-xl text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                        Area / Street / Locality
                      </label>
                      <input
                        type="text"
                        value={manualLine2}
                        onChange={(e) => setManualLine2(e.target.value)}
                        placeholder="e.g. Indiranagar, 100 Feet Road"
                        className="w-full px-3.5 py-2.5 bg-surface border border-warm-line rounded-xl text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={manualPincode}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setManualPincode(cleaned);
                            if (!stateManuallySet.current) {
                              const st = extractPincodeState(cleaned);
                              if (st) setManualState(st);
                            }
                          }}
                          placeholder="e.g. 560038"
                          maxLength={6}
                          className="w-full px-3.5 py-2.5 bg-surface border border-warm-line rounded-xl text-xs font-mono font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                          State *
                        </label>
                        <select
                          value={manualState}
                          onChange={(e) => {
                            stateManuallySet.current = true;
                            setManualState(e.target.value);
                          }}
                          className="w-full px-3.5 py-2.5 bg-surface border border-warm-line rounded-xl text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                        >
                          <option value="">Select state...</option>
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block mb-1.5">
                        Address Label
                      </label>
                      <div className="flex gap-2">
                        {["Home", "Work", "Other"].map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setManualLabel(lbl)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                              manualLabel === lbl
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-surface border-warm-line text-neutral-700 hover:border-neutral-300"
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveManualAddress}
                      disabled={!manualLine1.trim()}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        manualLine1.trim()
                          ? "bg-primary hover:bg-primary-container text-white active:scale-95 shadow-primary/20"
                          : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                      }`}
                    >
                      Save Address
                    </button>
                  </div>
                )}

                {/* ── Contact Phone Field (Always Visible) ── */}
                <div className="pt-3 border-t border-warm-line">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full pl-12 pr-4 py-2.5 bg-surface border border-warm-line rounded-xl text-xs font-mono font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-secondary" />
                    <span>Used for Shiprocket courier tracking and delivery alerts</span>
                  </p>
                </div>
              </div>

              {/* Proceed to Payment CTA */}
              <button
                type="button"
                onClick={() => {
                  if (!currentAddress) {
                    setOrderError("Please select or enter a delivery address.");
                    return;
                  }
                  if (!customerPhone || customerPhone.length < 10) {
                    setOrderError("Please enter a valid 10-digit phone number.");
                    return;
                  }
                  setOrderError("");
                  setActiveStep(3);
                }}
                className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-container active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD & FINAL ORDER PLACEMENT */}
          {activeStep === 3 && (
            <div className="space-y-4">
              {/* Selected delivery address summary card */}
              {currentAddress && (
                <div className="bg-white rounded-2xl p-4 border border-warm-line shadow-sm flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-neutral-900 uppercase">
                        Delivering to {currentAddress.label}
                      </p>
                      <p className="text-xs text-neutral-600 font-medium truncate mt-0.5">
                        {currentAddress.line1}, {currentAddress.line2}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {customerPhone ? `+91 ${customerPhone}` : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="text-xs font-bold text-primary hover:underline flex-shrink-0"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-warm-line shadow-sm space-y-3">
                <h3 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-warm-line">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>Choose Payment Method</span>
                </h3>

                {/* Option 1: Online Payment (Razorpay) */}
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer border transition-all ${
                    selectedPayment === "online"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-warm-line hover:border-neutral-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={selectedPayment === "online"}
                    onChange={() => setSelectedPayment("online")}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedPayment === "online" ? "border-primary" : "border-neutral-300"
                    }`}
                  >
                    {selectedPayment === "online" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-extrabold text-neutral-900">
                        Online Payment
                      </p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Instant & Secure
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                      UPI (GPay, PhonePe, Paytm), Credit / Debit Cards, NetBanking
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                </label>

                {/* Option 2: Cash on Delivery */}
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer border transition-all ${
                    selectedPayment === "cod"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-warm-line hover:border-neutral-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={selectedPayment === "cod"}
                    onChange={() => setSelectedPayment("cod")}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedPayment === "cod" ? "border-primary" : "border-neutral-300"
                    }`}
                  >
                    {selectedPayment === "cod" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-neutral-900">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                      Pay via cash or QR scanner directly upon doorstep delivery
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                </label>
              </div>

              {/* Promo Code Box */}
              <div className="bg-white rounded-2xl p-4 border border-warm-line shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span>Promo Code & Coupons</span>
                </div>

                {promoApplied ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-extrabold text-emerald-800">
                        Code applied: ₹{discount.toLocaleString("en-IN")} saved!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoApplied(false);
                        setPromoCode("");
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="e.g. PAWSOME or SAVE10"
                        className="flex-1 px-3.5 py-2 bg-surface border border-warm-line rounded-xl text-xs font-bold uppercase outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[10px] text-rose-600 font-semibold">{promoError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bill Details Breakdown */}
              <div className="bg-white rounded-2xl p-4 border border-warm-line shadow-sm space-y-2.5">
                <h4 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider pb-2 border-b border-warm-line">
                  Bill Summary
                </h4>

                <div className="flex justify-between text-xs font-medium text-neutral-600">
                  <span>Item Subtotal ({items.length} items)</span>
                  <span className="font-bold text-neutral-900">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-xs font-medium text-neutral-600">
                  <span className="flex items-center gap-1.5">
                    <span>Shipping & Handling</span>
                    {deliveryFee === 0 && (
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        FREE
                      </span>
                    )}
                  </span>
                  <span className={deliveryFee === 0 ? "text-neutral-400 line-through font-bold" : "font-bold text-neutral-900"}>
                    ₹{deliveryFee.toLocaleString("en-IN")}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>Discount Applied</span>
                    <span>-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-warm-line flex justify-between items-baseline">
                  <span className="text-sm font-black text-neutral-900">Total Payable</span>
                  <span className="text-xl font-black text-primary">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════════ FIXED BOTTOM CTA FOOTER ════════ */}
        <div className="bg-white border-t border-warm-line p-4 sm:p-5 space-y-3 flex-shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          {orderError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="flex-1">{orderError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
                Total Amount
              </p>
              <p className="text-lg sm:text-xl font-black text-neutral-900 leading-none mt-0.5">
                ₹{total.toLocaleString("en-IN")}
              </p>
            </div>

            <button
              type="button"
              onClick={activeStep === 3 ? handlePlaceOrder : () => setActiveStep((s) => s + 1)}
              disabled={isPlacing || paymentState !== "idle"}
              className={`flex-1 max-w-xs py-3.5 rounded-2xl font-black text-xs sm:text-sm text-white shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                isPlacing || paymentState !== "idle"
                  ? "bg-primary/70 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-container shadow-primary/25"
              }`}
            >
              {paymentState === "creating_order" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initializing Payment...</span>
                </>
              ) : paymentState === "processing_payment" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : paymentState === "verifying" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Payment...</span>
                </>
              ) : isPlacing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : activeStep === 3 ? (
                <>
                  <span>{selectedPayment === "cod" ? "Confirm COD Order" : "Pay & Place Order"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-neutral-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-secondary" />
              <span>256-Bit SSL Encrypted</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>100% Genuine Essentials</span>
            </span>
          </div>
        </div>
      </motion.aside>
    </div>
  );

  return createPortal(panel, document.body);
}