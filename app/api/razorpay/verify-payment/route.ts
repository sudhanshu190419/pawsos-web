import crypto from "crypto";
import Razorpay from "razorpay";
import {
  ApiError,
  createVetAppointment,
  getBearerToken,
  type VetAppointmentInput,
} from "../firestore-rest";

export const runtime = "nodejs";

type VerifyPaymentRequest = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  purpose?: string;
  appointment?: VetAppointmentInput;
};

type RazorpayOrderData = {
  amount?: number | string;
  currency?: string;
  notes?: Record<string, unknown>;
};

function readOrderAmount(order: RazorpayOrderData) {
  const amount = Number(order.amount);
  return Number.isFinite(amount) ? amount : 0;
}

function validateAppointmentOrderNotes(
  order: RazorpayOrderData,
  appointment: VetAppointmentInput
) {
  const notes = order.notes ?? {};

  if (
    notes.purpose !== "vet_appointment" ||
    notes.userId !== appointment.userId ||
    notes.vetId !== appointment.vetId ||
    notes.consultationType !== appointment.consultationType
  ) {
    throw new ApiError("Payment order details do not match this appointment", 400);
  }
}

/**
 * POST /api/razorpay/verify-payment
 *
 * Verifies the Razorpay payment signature using HMAC SHA256.
 * Only creates valid orders after successful verification.
 *
 * Request body:
 *   { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }
 *
 * Response:
 *   { success: true, razorpay_order_id: string, razorpay_payment_id: string }
 *   or
 *   { success: false, error: string }
 */
export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      purpose,
      appointment,
    } = (await req.json()) as VerifyPaymentRequest;

    // Validate all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json(
        {
          success: false,
          error: "Missing required payment verification fields",
        },
        { status: 400 }
      );
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error("[Razorpay] Missing RAZORPAY_KEY_SECRET env var");
      return Response.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Generate expected signature using HMAC SHA256
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      console.warn("[Razorpay] Signature mismatch for order:", razorpay_order_id);
      return Response.json(
        { success: false, error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    console.log("[Razorpay] Payment verified:", razorpay_payment_id, "for order:", razorpay_order_id);

    if (purpose === "vet_appointment") {
      const firebaseIdToken = getBearerToken(req.headers.get("authorization"));

      if (!firebaseIdToken) {
        return Response.json(
          { success: false, error: "Please sign in before booking an appointment" },
          { status: 401 }
        );
      }

      if (!appointment) {
        return Response.json(
          { success: false, error: "Missing appointment details" },
          { status: 400 }
        );
      }

      if (!key_id) {
        console.error("[Razorpay] Missing RAZORPAY_KEY_ID env var");
        return Response.json(
          { success: false, error: "Payment gateway not configured" },
          { status: 500 }
        );
      }

      const razorpay = new Razorpay({ key_id, key_secret });
      const order = (await razorpay.orders.fetch(
        razorpay_order_id
      )) as RazorpayOrderData;

      validateAppointmentOrderNotes(order, appointment);

      const amountInPaise = readOrderAmount(order);
      if (amountInPaise <= 0) {
        throw new ApiError("Payment order amount is invalid", 400);
      }

      const appointmentId = await createVetAppointment({
        firebaseIdToken,
        documentId: `vetappt_${razorpay_payment_id}`,
        appointment,
        amount: Math.round(amountInPaise) / 100,
        currency: order.currency || "INR",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      return Response.json({
        success: true,
        razorpay_order_id,
        razorpay_payment_id,
        appointmentId,
      });
    }

    return Response.json({
      success: true,
      razorpay_order_id,
      razorpay_payment_id,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    const err = error as { message?: string };
    console.error("[Razorpay] Verify payment error:", err?.message || error);
    return Response.json(
      {
        success: false,
        error: err?.message || "Payment verification failed",
      },
      { status: 500 }
    );
  }
}
