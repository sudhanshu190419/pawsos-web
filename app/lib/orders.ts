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
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

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
}

export interface VendorGroup {
  brandId: string;
  brandName: string;
  shiprocketPickupId: number | null;
  shiprocketPickupName: string | null;
  items: OrderItem[];
  subtotal: number;
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
  items: OrderItem[];
  vendorGroups: VendorGroup[];
  shipments: Shipment[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  totalAmount: number;
  shippingAddress: OrderAddress;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  createdAt: Timestamp;
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
 * Uses the vendorGroups array to match items belonging to the seller's brand.
 */
export function listenToSellerOrders(
  brandId: string,
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
      const allOrders = snapshot.docs.map((d) => ({
        orderId: d.id,
        ...d.data(),
      })) as Order[];
      // Filter orders that contain items from this seller's brand
      const filtered = allOrders.filter((order) =>
        order.items?.some((item) => item.brandId === brandId)
      );
      onData(filtered);
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
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ orderId: d.id, ...d.data() }) as Order)
    .filter((order) => order.items?.some((item) => item.brandId === brandId));
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
  const groups = items.reduce<Record<string, VendorGroup>>((acc, item) => {
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
  return Object.values(groups);
}
