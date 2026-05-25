import axios from "axios";
import { getShiprocketToken, sanitizeIndianPhone, extractPincodeState } from "@/app/lib/shiprocket";

export const runtime = "nodejs";

interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: string;
  discount: string;
  tax: string;
  hsn: string;
}

interface CreateOrderInput {
  orderId: string;
  brandId: string;
  brandName: string;
  pickupLocationName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingAddress2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  paymentMethod: string;
  subtotal: number;
  items: ShiprocketOrderItem[];
  totalWeight: number;
  totalLength: number;
  totalBreadth: number;
  totalHeight: number;
}

/**
 * Generate a unique Shiprocket-compliant order ID for a vendor group.
 */
function generateOrderId(orderId: string, brandId: string): string {
  const suffix = brandId.slice(0, 6).toUpperCase();
  return `AS${orderId.slice(0, 6).toUpperCase()}${suffix}`;
}

/**
 * Format the current date for Shiprocket's order_date field.
 */
function formatShiprocketDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Send a single Shiprocket create-order request.
 */
async function createShiprocketOrder(
  token: string,
  input: CreateOrderInput
): Promise<any> {
  const payload = {
    order_id: generateOrderId(input.orderId, input.brandId),
    order_date: formatShiprocketDate(),
    pickup_location: input.pickupLocationName,
    billing_customer_name: input.customerName,
    billing_last_name: "",
    billing_address: input.shippingAddress,
    billing_address_2: input.shippingAddress2,
    billing_city: input.city,
    billing_pincode: input.pincode,
    billing_state: input.state,
    billing_country: input.country || "India",
    billing_email: input.customerEmail,
    billing_phone: input.customerPhone,
    shipping_is_billing: true,
    order_items: input.items,
    payment_method: input.paymentMethod,
    sub_total: input.subtotal,
    length: Math.max(input.totalLength, 10),
    breadth: Math.max(input.totalBreadth, 10),
    height: Math.max(input.totalHeight, 10),
    weight: Math.max(input.totalWeight, 0.5),
  };
console.log(
  "SHIPROCKET PAYLOAD:",
  JSON.stringify(payload, null, 2)
);
  const response = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}


/**
 * Generate AWB for a shipment. Leaving courier_id empty lets Shiprocket auto-assign.
 */
async function generateAWB(
  token: string,
  shipmentId: number
): Promise<any> {
  try {
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
      {
        shipment_id: shipmentId,
        courier_id: "",
        is_return: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    // AWB generation may fail silently if auto-assign is not available
    console.warn("AWB auto-assign skipped:", error.response?.data || error.message);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      brandId,
      brandName,
      pickupLocationName,
      customerName,
      customerEmail,
      customerPhone: rawPhone,
      shippingAddress,
      city,
      state,
      pincode,
      items,
      paymentMethod,
      subtotal,
      totalWeight,
      totalLength,
      totalBreadth,
      totalHeight,
      orderId,
    } = body;

    console.log("\n══════════ SHIPROCKET ORDER DEBUG ══════════");
    console.log("[1/7] RAW request body fields:");
    console.log("  brandId:", brandId);
    console.log("  pickupLocationName:", pickupLocationName);
    console.log("  customerName:", customerName);
    console.log("  customerPhone (RAW from body):", JSON.stringify(rawPhone));
    console.log("  pincode:", pincode);

    if (!brandId || !pickupLocationName || !customerName || !rawPhone || !pincode) {
      console.warn("[2/7] VALIDATION FAILED: missing required field");
      console.log("══════════ END DEBUG ══════════\n");
      return Response.json({
        success: false,
        error: "Missing required fields: brandId, pickupLocationName, customerName, customerPhone, pincode",
      });
    }

    // ── SANITIZE phone ──
    const customerPhone = sanitizeIndianPhone(rawPhone);
    console.log("[3/7] SANITIZED phone:", JSON.stringify(customerPhone));

    if (!customerPhone) {
      console.warn("[4/7] VALIDATION FAILED: phone could not be sanitized to a valid 10-digit Indian number");
      console.log("  Raw input was:", JSON.stringify(rawPhone));
      console.log("══════════ END DEBUG ══════════\n");
      return Response.json({
        success: false,
        error: `Invalid phone number format. Must be a valid 10-digit Indian mobile number. Received: ${JSON.stringify(rawPhone)}`,
      });
    }
    console.log("[4/7] PHONE VALID: ready for Shiprocket payload");

    const token = await getShiprocketToken();

    const shippingParts = (shippingAddress || "").split(", ");
    const shippingLine1 = shippingParts[0] || shippingAddress || "";
    const shippingLine2 = shippingParts.slice(1).join(", ") || "";

    const shiprocketPaymentMethod = paymentMethod === "cod" ? "COD" : "Prepaid";

    const shiprocketItems = items.map((item: any, idx: number) => ({
      name: item.productName || "Item",
      sku: item.productId || `SKU${idx}`,
      units: item.quantity || 1,
      selling_price: String(item.price || 0),
      discount: "",
      tax: "",
      hsn: "",
    }));

    // Fallback: derive state from pincode if not provided
    const resolvedState = state || extractPincodeState(pincode || "");

    if (!resolvedState) {
      console.warn("[4.5/7] VALIDATION: state is empty and could not be derived from pincode");
    } else {
      console.log("[4.5/7] STATE resolved:", resolvedState, "(from:", state ? "body.state" : "pincode lookup", ")");
    }

    const orderInput: CreateOrderInput = {
      orderId,
      brandId,
      brandName,
      pickupLocationName,
      customerName,
      customerEmail: customerEmail || "",
      customerPhone,
      shippingAddress: shippingLine1,
      shippingAddress2: shippingLine2,
      city: city || "",
      state: resolvedState,
      pincode,
      country: "India",
      paymentMethod: shiprocketPaymentMethod,
      subtotal: Math.round(subtotal),
      items: shiprocketItems,
      totalWeight: Math.max(totalWeight || 0.5, 0.5),
      totalLength: Math.max(totalLength || 10, 10),
      totalBreadth: Math.max(totalBreadth || 10, 10),
      totalHeight: Math.max(totalHeight || 10, 10),
    };

    // Create the Shiprocket order
    console.log("[5/7] Sending to Shiprocket API...");
    const orderResult = await createShiprocketOrder(token, orderInput);
    console.log("[5/7] SHIPROCKET RESPONSE:", JSON.stringify(orderResult, null, 2));

    const shiprocketOrderId = orderResult?.order_id || null;
    const shipmentId = orderResult?.shipment_id || null;
    console.log("[6/7] Extracted: order_id=", shiprocketOrderId, "shipment_id=", shipmentId);

    // Generate AWB
    let awbCode = orderResult?.awb_code || null;
    let courierName = orderResult?.courier_name || null;

    if (shipmentId && !awbCode) {
      const awbResult = await generateAWB(token, shipmentId);
      if (awbResult) {
        awbCode = awbResult.awb_code || awbCode;
        courierName = awbResult.courier_name || courierName;
      }
    }

    const trackingUrl = awbCode
      ? `https://shiprocket.co/tracking/${awbCode}`
      : null;

    const shipmentResult = {
      brandId,
      brandName,
      shiprocketOrderId,
      shipmentId,
      awbCode,
      courierName,
      trackingUrl,
      shipmentStatus: orderResult?.status || "NEW",
      createdAt: Date.now(),
    };

    console.log("[7/7] SUCCESS! Shipment result:");
    console.log(JSON.stringify(shipmentResult, null, 2));
    console.log("══════════ END DEBUG ══════════\n");

    return Response.json({
      success: true,
      data: shipmentResult,
      shiprocketResponse: orderResult,
    });
  } catch (error: any) {
    console.log("------ SHIPROCKET CREATE ORDER DEBUG ------");
    console.log("HTTP STATUS:", error.response?.status);
    console.log("DATA:", JSON.stringify(error.response?.data, null, 2));
    console.log("MESSAGE:", error.message);

    return Response.json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
