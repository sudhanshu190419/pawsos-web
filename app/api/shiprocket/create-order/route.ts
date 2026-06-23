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
  // Log payload with PII redacted
  const sanitizedPayload = {
    ...payload,
    billing_customer_name: payload.billing_customer_name
      ? payload.billing_customer_name.slice(0, 1) + "..." + payload.billing_customer_name.slice(-1)
      : "[empty]",
    billing_email: payload.billing_email
      ? payload.billing_email.slice(0, 2) + "...@..."
      : "[empty]",
    billing_phone: payload.billing_phone
      ? "***" + payload.billing_phone.slice(-4)
      : "[empty]",
    billing_address: payload.billing_address
      ? payload.billing_address.slice(0, 8) + "..."
      : "[empty]",
    billing_address_2: payload.billing_address_2
      ? payload.billing_address_2.slice(0, 8) + "..."
      : "[empty]",
  };
console.log(
  "SHIPROCKET PAYLOAD:",
  JSON.stringify(sanitizedPayload, null, 2)
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
  console.log("\n══════════ AWB ASSIGNMENT DEBUG ══════════");
  console.log("[AWB-1] Preparing request for shipment_id:", shipmentId);

  const awbPayload = {
    shipment_id: shipmentId,
    courier_id: "",
    is_return: 0,
  };
  console.log("[AWB-2] Request payload:", JSON.stringify(awbPayload, null, 2));

  try {
    console.log("[AWB-3] Sending POST to /courier/assign/awb...");
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
      awbPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("[AWB-4] HTTP status:", response.status);
    console.log("[AWB-5] Full Shiprocket response:", JSON.stringify(response.data, null, 2));
    console.log("[AWB-6] awb_code from response:", response.data?.awb_code);
    console.log("[AWB-7] courier_name from response:", response.data?.courier_name);
    console.log("══════════ END AWB DEBUG ══════════\n");

    return response.data;
  } catch (error: any) {
    console.log("[AWB-ERROR] Request FAILED:");
    console.log("  HTTP status:", error.response?.status);
    console.log("  Response body:", JSON.stringify(error.response?.data, null, 2));
    console.log("  Error message:", error.message);
    console.log("══════════ END AWB DEBUG (FAILED) ══════════\n");
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ENABLE_SHIPROCKET =
  process.env.NEXT_PUBLIC_ENABLE_SHIPROCKET === "true";

if (!ENABLE_SHIPROCKET) {
  console.log("🧪 TEST MODE: Shiprocket disabled");

  return Response.json({
    success: true,
    mock: true,
    data: {
      brandId: "TEST_BRAND",
      brandName: "Test Brand",
      shiprocketOrderId: "TEST_ORDER_123",
      shipmentId: "TEST_SHIPMENT_123",
      awbCode: "TESTAWB123456",
      courierName: "Test Courier",
      trackingUrl: "https://example.com/tracking",
      shipmentStatus: "NEW",
      createdAt: Date.now(),
    },
  });
}
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
    console.log("  customerName:", customerName ? customerName.slice(0, 1) + "..." + customerName.slice(-1) : "[empty]");
    console.log("  customerPhone (last 4 digits):", rawPhone ? "***" + rawPhone.replace(/\D/g, "").slice(-4) : "[empty]");
    console.log("  pincode:", pincode ? pincode.slice(0, 3) + "***" : "[empty]");

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
    console.log("[3/7] Phone sanitization result:", customerPhone ? "valid" : "invalid");

    if (!customerPhone) {
      console.warn("[4/7] VALIDATION FAILED: phone could not be sanitized to a valid 10-digit Indian number");
      console.log("  Raw input (redacted):", rawPhone ? "***" + rawPhone.replace(/\D/g, "").slice(-4) : "[empty]");
      console.log("══════════ END DEBUG ══════════\n");
      return Response.json({
        success: false,
        error: `Invalid phone number format. Must be a valid 10-digit Indian mobile number. Received: ${JSON.stringify(rawPhone)}`,
      });
    }
    console.log("[4/7] PHONE VALID: ready for Shiprocket payload");

    const token = await getShiprocketToken();
    console.log(
  "[Shiprocket] Password configured:",
  !!process.env.SHIPROCKET_PASSWORD
);

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

    // ── LOG FULL ORDER CREATION RESPONSE ──
    console.log("\n══════════ ORDER CREATION RESPONSE DEBUG ══════════");
    const orderResult = await createShiprocketOrder(token, orderInput);
    console.log("[ORDER-RESP-1] Full response from createShiprocketOrder:", JSON.stringify(orderResult, null, 2));
    console.log("[ORDER-RESP-2] Has order_id?:", !!orderResult?.order_id);
    console.log("[ORDER-RESP-3] Has shipment_id?:", !!orderResult?.shipment_id);
    console.log("[ORDER-RESP-4] Has awb_code DIRECTLY from create?:", !!orderResult?.awb_code);
    console.log("[ORDER-RESP-5] awb_code value:", orderResult?.awb_code);
    console.log("[ORDER-RESP-6] status:", orderResult?.status);
    console.log("[ORDER-RESP-7] All keys in response:", Object.keys(orderResult || {}));
    console.log("══════════ END ORDER RESPONSE DEBUG ══════════\n");

    const shiprocketOrderId = orderResult?.order_id || null;
    const shipmentId = orderResult?.shipment_id || null;
    console.log("[6/7] Extracted: order_id=", shiprocketOrderId, "shipment_id=", shipmentId);

    // Generate AWB (only if not already returned with order creation)
    let awbCode = orderResult?.awb_code || null;
    let courierName = orderResult?.courier_name || null;

    console.log("\n══════════ AWB DECISION DEBUG ══════════");
    console.log("[AWB-DECISION-1] shipmentId:", shipmentId);
    console.log("[AWB-DECISION-2] awbCode from orderResult:", awbCode);
    console.log("[AWB-DECISION-3] Should call generateAWB?:", shipmentId && !awbCode ? "YES" : "NO");

    if (shipmentId && !awbCode) {
      console.log("[AWB-DECISION-4] Calling generateAWB(shipmentId=", shipmentId, ")...");
      const awbResult = await generateAWB(token, shipmentId);
      console.log("[AWB-DECISION-5] generateAWB returned:", awbResult ? "truthy" : "falsy/null");
      console.log("[AWB-DECISION-6] Full awbResult:", JSON.stringify(awbResult, null, 2));
      console.log("[AWB-DECISION-7] awbResult?.awb_code:", awbResult?.awb_code);
      console.log("[AWB-DECISION-8] awbResult?.courier_name:", awbResult?.courier_name);

      if (awbResult) {
        awbCode = awbResult.awb_code || awbCode;
        courierName = awbResult.courier_name || courierName;
        console.log("[AWB-DECISION-9] After assignment - awbCode:", awbCode, "courierName:", courierName);
      } else {
        console.log("[AWB-DECISION-9] awbResult was falsy, awbCode remains:", awbCode);
      }
    }
    console.log("══════════ END AWB DECISION DEBUG ══════════\n");

    const trackingUrl = awbCode
      ? `https://shiprocket.co/tracking/${awbCode}`
      : null;

    // ── Fetch actual shipping cost from Shiprocket order details API ──
    let actualShippingCost: number | null = null;
    if (shiprocketOrderId) {
      try {
        console.log("\n══════════ SHIPPING COST FETCH DEBUG ══════════");
        console.log("[COST-1] Fetching order details for Shiprocket order ID:", shiprocketOrderId);
        const orderDetailsRes = await axios.get(
          `https://apiv2.shiprocket.in/v1/external/orders/show/${shiprocketOrderId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("[COST-2] Order details response keys:", Object.keys(orderDetailsRes.data || {}));

        // Try to extract freight/courier cost from the response
        // Shiprocket may return it in various fields
        const data = orderDetailsRes.data;
        if (data) {
          // Check common cost-related fields
          const possibleCostFields = [
            "freight_charge",
            "courier_cost",
            "shipping_charge",
            "courier_charges",
            "freight",
          ];
          for (const field of possibleCostFields) {
            const val = data[field];
            if (val !== undefined && val !== null && !isNaN(Number(val))) {
              actualShippingCost = Number(val);
              console.log(`[COST-3] Found cost in field "${field}":`, actualShippingCost);
              break;
            }
          }

          // Also check nested objects like "data" or "order"
          if (actualShippingCost === null && data.data) {
            for (const field of possibleCostFields) {
              const val = data.data[field];
              if (val !== undefined && val !== null && !isNaN(Number(val))) {
                actualShippingCost = Number(val);
                console.log(`[COST-4] Found cost in data."${field}":`, actualShippingCost);
                break;
              }
            }
          }
        }

        if (actualShippingCost === null) {
          console.log("[COST-5] No shipping cost field found in Shiprocket response. Will retry later.");
        }
        console.log("══════════ END COST DEBUG ══════════\n");
      } catch (err: any) {
        console.warn("[COST-ERROR] Failed to fetch order details from Shiprocket:", err.message);
        // Non-blocking — cost stays null, can be fetched later
      }
    }

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
      actualShippingCost,
    };

    console.log("══════════ FINAL SHIPMENT RESULT ══════════");
    console.log(JSON.stringify(shipmentResult, null, 2));
    console.log("[FINAL] awbCode:", awbCode, "(null means AWB assignment failed)");
    console.log("══════════ END FINAL SHIPMENT RESULT ══════════\n");

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
