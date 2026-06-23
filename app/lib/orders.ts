import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  addDoc,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

/* ═══════════════════════════════════════════════════
   PLATFORM COMMISSION
   ═══════════════════════════════════════════════════ */

/**
 * Platform commission rate as a decimal (e.g., 0.10 = 10%).
 * Currently 0% - update this when ready to charge commission.
 */
export const PLATFORM_COMMISSION_RATE = 0; // 0% – configurable

/* ═══════════════════════════════════════════════════
   ORDER STATUS
   ═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SHIPMENT STATUS
   ═══════════════════════════════════════════════════ */

export const SHIPMENT_STATUSES = [
  "pending",
  "pickup_scheduled",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rto",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rto: "Return to Origin",
  NEW: "New",
  inTransit: "In Transit",
  deliveredToDestination: "Delivered",
  cancelledByClient: "Cancelled",
  rtoDelivered: "RTO Delivered",
};

export const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  pickup_scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  picked_up: "bg-violet-100 text-violet-700 border-violet-200",
  in_transit: "bg-indigo-100 text-indigo-700 border-indigo-200",
  out_for_delivery: "bg-orange-100 text-orange-700 border-orange-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  rto: "bg-rose-100 text-rose-700 border-rose-200",
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  inTransit: "bg-indigo-100 text-indigo-700 border-indigo-200",
  deliveredToDestination: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

/* ═══════════════════════════════════════════════════
   ORDER STATUS
   ═══════════════════════════════════════════════════ */

export const ORDER_STATUSES = [
  "placed",
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  placed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  packed: "bg-violet-100 text-violet-700 border-violet-200",
  shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "placed",
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  brandId: string;
  brandName: string;
  quantity: number;
  price: number;
  weight: number;
  length: number | null;
  breadth: number | null;
  height: number | null;
  shiprocketPickupId: number | null;
}

/* ═══════════════════════════════════════════════════
   SHIPMENT TYPES
   ═══════════════════════════════════════════════════ */

export interface Shipment {
  brandId: string;
  brandName: string;
  shiprocketOrderId: number | null;
  shipmentId: number | null;
  awbCode: string | null;
  courierName: string | null;
  trackingUrl: string | null;
  shipmentStatus: string | null;
  createdAt: any;
  /** The delivery fee collected from the customer for this shipment (₹) */
  deliveryFeeCollected?: number;
  /** The actual shipping cost charged by Shiprocket (₹). Null until fetched. */
  actualShippingCost?: number | null;
  /** Profit/loss = deliveryFeeCollected - actualShippingCost (₹) */
  shippingMargin?: number | null;
}

export interface VendorGroup {
  brandId: string;
  brandName: string;
  shiprocketPickupId: number | null;
  shiprocketPickupName: string | null;
  items: OrderItem[];
  subtotal: number;
  /** Platform commission charged on this vendor's items (₹) */
  platformFee: number;
  /** Net amount the seller receives after platform fees (₹) */
  sellerPayoutAmount: number;
}

export interface OrderAddress {
  id?: string;
  label: string;
  full: string;
  line1: string;
  line2: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  orderId: string;
  userId: string;
  userName: string;
  customerEmail?: string;
  vendorIds: string[];
  items: OrderItem[];
  vendorGroups: VendorGroup[];
  shipments: Shipment[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  shippingAddress: OrderAddress;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  createdAt: Timestamp;
  /** Sum of platform fees across all vendor groups (₹) */
  totalPlatformFee?: number;
  /** Sum of seller payouts across all vendor groups (₹) */
  totalSellerPayout?: number;
  /** Total delivery fee collected across all shipments (₹) — same as deliveryFee */
  totalDeliveryFeeCollected?: number;
  /** Sum of actual shipping costs across all shipments (₹). Null until data arrives. */
  totalActualShippingCost?: number | null;
  /** Total shipping profit/loss across all shipments (₹) */
  totalShippingMargin?: number | null;
}

/* ═══════════════════════════════════════════════════
   QUERIES
   ═══════════════════════════════════════════════════ */

/**
 * Fetch a single order by its ID.
 */
export async function fetchOrder(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  return { orderId: snap.id, ...snap.data() } as Order;
}

/**
 * Listen to orders for a given user in real-time.
 */
export function listenToUserOrders(
  userId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        orderId: d.id,
        ...d.data(),
      })) as Order[];
      onData(orders);
    },
    onError
  );
}

/**
 * Listen to seller-specific orders (orders containing items from their brand).
 * Uses the vendorIds array on the order document to filter orders belonging to the seller.
 */
export function listenToSellerOrders(
  brandId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "orders"),
    where("vendorIds", "array-contains", brandId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        orderId: d.id,
        ...d.data(),
      })) as Order[];
      onData(orders);
    },
    onError
  );
}

/**
 * Listen to ALL orders (admin view) — no filters, newest first.
 */
export function listenToAllOrders(
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        orderId: d.id,
        ...d.data(),
      })) as Order[];
      onData(orders);
    },
    onError
  );
}

/**
 * Fetch seller-specific orders once (non-reactive).
 */
export async function fetchSellerOrders(brandId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("vendorIds", "array-contains", brandId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ orderId: d.id, ...d.data() }) as Order);
}

/**
 * Extract only the items belonging to a specific seller from an order.
 */
export function getSellerItemsFromOrder(order: Order, brandId: string): OrderItem[] {
  return order.items?.filter((item) => item.brandId === brandId) ?? [];
}

/**
 * Calculate the subtotal for a seller's items within an order.
 */
export function getSellerSubtotalFromOrder(order: Order, brandId: string): number {
  return getSellerItemsFromOrder(order, brandId).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

/* ═══════════════════════════════════════════════════
   SHIPMENT TRACKING HELPERS
   ═══════════════════════════════════════════════════ */

/**
 * Map Shiprocket raw statuses to our internal shipment status keys.
 */
const SHIPROCKET_TO_INTERNAL: Record<string, string> = {
  NEW: "pending",
  pickup_scheduled: "pickup_scheduled",
  picked_up: "picked_up",
  in_transit: "in_transit",
  inTransit: "in_transit",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  deliveredToDestination: "delivered",
  cancelled: "cancelled",
  cancelledByClient: "cancelled",
  rto: "rto",
  rtoDelivered: "rto",
};

/**
 * Get a human-readable shipment status label from any raw status string.
 */
export function getTrackingStatusLabel(status: string | null | undefined): string {
  if (!status) return "Pending";
  const key = SHIPROCKET_TO_INTERNAL[status] || status.toLowerCase();
  return SHIPMENT_STATUS_LABELS[key] || status;
}

/**
 * Get the Tailwind color classes for a shipment status badge.
 */
export function getTrackingStatusColor(status: string | null | undefined): string {
  if (!status) return "bg-slate-100 text-slate-600 border-slate-200";
  const key = SHIPROCKET_TO_INTERNAL[status] || status.toLowerCase();
  return SHIPMENT_STATUS_COLORS[key] || "bg-slate-100 text-slate-600 border-slate-200";
}

/**
 * Get the timeline step index for a shipment status (0-5).
 * Steps: Order Placed → Pickup Scheduled → Picked Up → In Transit → Out For Delivery → Delivered
 */
export function getTrackingStepIndex(status: string | null | undefined): number {
  if (!status) return 0;
  const internal = SHIPROCKET_TO_INTERNAL[status] || status.toLowerCase();
  const steps = ["pending", "pickup_scheduled", "picked_up", "in_transit", "out_for_delivery", "delivered"];
  const idx = steps.indexOf(internal);
  return idx >= 0 ? idx : 0;
}

/**
 * Get the timeline steps array for shipment tracking UI.
 */
export function getTrackingTimelineSteps(): Array<{ key: string; label: string }> {
  return [
    { key: "pending", label: "Order Placed" },
    { key: "pickup_scheduled", label: "Pickup Scheduled" },
    { key: "picked_up", label: "Picked Up" },
    { key: "in_transit", label: "In Transit" },
    { key: "out_for_delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
  ];
}

/**
 * Determine if a status is a terminal/end state.
 */
export function isShipmentTerminal(status: string | null | undefined): boolean {
  if (!status) return false;
  const internal = SHIPROCKET_TO_INTERNAL[status] || status.toLowerCase();
  return ["delivered", "cancelled", "rto"].includes(internal);
}

/* ═══════════════════════════════════════════════════
   STATUS HELPERS
   ═══════════════════════════════════════════════════ */

/**
 * Returns the next available statuses for the given current status.
 */
export function getNextStatuses(current: OrderStatus): OrderStatus[] {
  const idx = ORDER_STATUSES.indexOf(current);
  if (idx === -1 || idx >= ORDER_STATUSES.length - 1) return [];
  const nextIdx = current === "pending" ? 2 : idx + 1; // skip "confirmed" for seller action
  return ORDER_STATUSES.slice(idx + 1, nextIdx + 1);
}

/**
 * Check if a status transition is valid.
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  const fromIdx = ORDER_STATUSES.indexOf(from);
  const toIdx = ORDER_STATUSES.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  if (from === "cancelled" || from === "delivered") return false;
  return toIdx > fromIdx;
}

/* ═══════════════════════════════════════════════════
   SELLER PAYOUT TYPES
   ═══════════════════════════════════════════════════ */

export type SellerPayoutStatus = "pending" | "paid" | "failed";

export interface SellerPayout {
  id?: string;
  sellerId: string;
  /** Brand name of the seller (denormalized for admin view) */
  sellerName: string;
  orderId: string;
  /** Number of items from this seller in the order */
  orderItemCount: number;
  amount: number;
  platformFee: number;
  status: SellerPayoutStatus;
  paidAt?: Timestamp | null;
  paidBy?: string | null;
  paymentNote?: string | null;
  createdAt?: Timestamp;
}

/**
 * Create a seller payout record when an order is placed.
 */
export async function createSellerPayout(params: {
  sellerId: string;
  sellerName: string;
  orderId: string;
  orderItemCount: number;
  amount: number;
  platformFee: number;
}): Promise<string> {
  const docRef = await addDoc(collection(db, "seller_payouts"), {
    sellerId: params.sellerId,
    sellerName: params.sellerName,
    orderId: params.orderId,
    orderItemCount: params.orderItemCount,
    amount: params.amount,
    platformFee: params.platformFee,
    status: "pending",
    paidAt: null,
    paidBy: null,
    paymentNote: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Listen to payouts for a specific seller in real-time.
 */
export function listenToSellerPayouts(
  sellerId: string,
  onData: (payouts: SellerPayout[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "seller_payouts"),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const payouts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SellerPayout[];
      onData(payouts);
    },
    onError
  );
}

/**
 * Listen to all pending seller payouts (admin view).
 */
export function listenToPendingPayouts(
  onData: (payouts: SellerPayout[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "seller_payouts"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const payouts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SellerPayout[];
      onData(payouts);
    },
    onError
  );
}

/**
 * Listen to ALL payouts (admin view - for history tab).
 */
export function listenToAllPayouts(
  onData: (payouts: SellerPayout[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "seller_payouts"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const payouts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SellerPayout[];
      onData(payouts);
    },
    onError
  );
}

/* ═══════════════════════════════════════════════════
   SHIPPING ANALYTICS HELPERS
   ═══════════════════════════════════════════════════ */

export interface ShippingAnalytics {
  totalDeliveryFeesCollected: number;
  totalActualShippingCost: number;
  totalShippingMargin: number;
  /** Number of orders that have at least one shipment with actual cost data */
  ordersWithCostData: number;
  /** Number of shipments that have actual cost data */
  shipmentsWithCostData: number;
  avgShippingCostPerOrder: number | null;
  avgShippingCostPerShipment: number | null;
  avgShippingMarginPerOrder: number | null;
  avgShippingCostPerKg: number | null;
  /** Breakdown by courier name */
  byCourier: Record<string, {
    count: number;
    totalCost: number;
    totalCollected: number;
    totalMargin: number;
  }>;
}

/**
 * Calculate the total weight of items belonging to a specific vendor group in an order.
 */
function getVendorGroupWeight(order: Order, brandId: string): number {
  const group = order.vendorGroups?.find((g) => g.brandId === brandId);
  if (!group) return 0;
  return group.items.reduce((sum, item) => sum + (item.weight || 0.5) * item.quantity, 0);
}

/**
 * Calculate shipping analytics from a list of orders.
 *
 * Delivery fee allocation (Option C):
 * The delivery fee is stored ONLY at the order level (order.deliveryFee).
 * For the per-courier breakdown, the fee is allocated proportionally
 * by shipment weight using:
 *   allocatedFee = order.deliveryFee × (shipmentWeight / totalOrderWeight)
 *
 * Backward compatibility: Old shipments that have deliveryFeeCollected
 * stored directly are also handled.
 */
export function calculateShippingAnalytics(orders: Order[]): ShippingAnalytics {
  let totalDeliveryFeesCollected = 0;
  let totalActualShippingCost = 0;
  let totalWeight = 0;
  let ordersWithCostData = 0;
  let shipmentsWithCostData = 0;
  const byCourier: Record<string, {
    count: number;
    totalCost: number;
    totalCollected: number;
    totalMargin: number;
  }> = {};

  for (const order of orders) {
    totalDeliveryFeesCollected += order.deliveryFee || 0;

    // Calculate total order weight once per order
    const orderWeight = (order.items || []).reduce(
      (sum, item) => sum + (item.weight || 0.5) * item.quantity,
      0
    );
    totalWeight += orderWeight;

    let hasCostData = false;

    for (const shipment of (order.shipments || [])) {
      const cost = shipment.actualShippingCost;
      if (cost !== null && cost !== undefined) {
        totalActualShippingCost += cost;
        shipmentsWithCostData++;
        hasCostData = true;
      }

      // ── Allocate delivery fee for this shipment ──
      // Option C: Use weight-proportional allocation from order.deliveryFee
      let allocatedFee: number;
      if (shipment.deliveryFeeCollected !== undefined && shipment.deliveryFeeCollected !== null) {
        // Backward compatibility: old shipments have the raw fee stored
        allocatedFee = shipment.deliveryFeeCollected;
      } else {
        // New approach: allocate proportionally by weight
        // Get this shipment's weight from vendor groups
        const shipmentWeight = getVendorGroupWeight(order, shipment.brandId);
        if (orderWeight > 0 && shipmentWeight > 0) {
          allocatedFee = Math.round(
            ((order.deliveryFee || 0) * (shipmentWeight / orderWeight)) * 100
          ) / 100;
        } else {
          // Fallback: equal split if no weight data
          const shipmentCount = (order.shipments || []).length;
          allocatedFee = shipmentCount > 0
            ? Math.round(((order.deliveryFee || 0) / shipmentCount) * 100) / 100
            : 0;
        }
      }

      // Calculate margin using allocated fee
      const margin =
        cost !== null && cost !== undefined
          ? Math.round((allocatedFee - cost) * 100) / 100
          : null;

      // Track by courier
      const courier = shipment.courierName || "Unknown";
      if (!byCourier[courier]) {
        byCourier[courier] = { count: 0, totalCost: 0, totalCollected: 0, totalMargin: 0 };
      }
      byCourier[courier].count++;
      if (cost !== null && cost !== undefined) {
        byCourier[courier].totalCost += cost;
      }
      byCourier[courier].totalCollected += allocatedFee;
      if (margin !== null) {
        byCourier[courier].totalMargin += margin;
      }
    }

    if (hasCostData) ordersWithCostData++;
  }

  const totalShippingMargin = totalDeliveryFeesCollected - totalActualShippingCost;

  return {
    totalDeliveryFeesCollected,
    totalActualShippingCost,
    totalShippingMargin,
    ordersWithCostData,
    shipmentsWithCostData,
    avgShippingCostPerOrder:
      ordersWithCostData > 0
        ? Math.round((totalActualShippingCost / ordersWithCostData) * 100) / 100
        : null,
    avgShippingCostPerShipment:
      shipmentsWithCostData > 0
        ? Math.round((totalActualShippingCost / shipmentsWithCostData) * 100) / 100
        : null,
    avgShippingMarginPerOrder:
      ordersWithCostData > 0
        ? Math.round((totalShippingMargin / ordersWithCostData) * 100) / 100
        : null,
    avgShippingCostPerKg:
      totalWeight > 0
        ? Math.round((totalActualShippingCost / totalWeight) * 100) / 100
        : null,
    byCourier,
  };
}

/* ═══════════════════════════════════════════════════
   ORDER ITEM HELPERS
   ═══════════════════════════════════════════════════ */

/**
 * Build order items from cart items for Firestore storage.
 */
export function buildOrderItems(
  cartItems: Array<{
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    qty: number;
    brandId: string;
    brandName: string;
    weight: number;
    length: number | null;
    breadth: number | null;
    height: number | null;
    shiprocketPickupId: number | null;
  }>
): OrderItem[] {
  return cartItems.map((item) => ({
    productId: item.id,
    productName: item.name,
    productImage: item.imageUrl || "",
    brandId: item.brandId,
    brandName: item.brandName || "Verified Store",
    quantity: item.qty,
    price: item.price,
    weight: item.weight ?? 0.5,
    length: item.length ?? null,
    breadth: item.breadth ?? null,
    height: item.height ?? null,
    shiprocketPickupId: item.shiprocketPickupId ?? null,
  }));
}

/**
 * Build vendor groups from order items for grouped shipping.
 */
export function buildVendorGroups(items: OrderItem[]): VendorGroup[] {
  const groups = items.reduce<Record<string, Omit<VendorGroup, "platformFee" | "sellerPayoutAmount">>>((acc, item) => {
    const key = item.brandId || "unknown";
    if (!acc[key]) {
      acc[key] = {
        brandId: item.brandId,
        brandName: item.brandName,
        shiprocketPickupId: item.shiprocketPickupId,
        shiprocketPickupName: null,
        items: [],
        subtotal: 0,
      };
    }
    acc[key].items.push(item);
    acc[key].subtotal += item.price * item.quantity;
    return acc;
  }, {});
  return Object.values(groups).map((group) => {
    const fee = Math.round(group.subtotal * PLATFORM_COMMISSION_RATE);
    return {
      ...group,
      platformFee: fee,
      sellerPayoutAmount: group.subtotal - fee,
    };
  });
}
