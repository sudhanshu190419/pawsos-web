import crypto from "crypto";

export const runtime = "nodejs";

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

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

    return Response.json({
      success: true,
      razorpay_order_id,
      razorpay_payment_id,
    });
  } catch (error: any) {
    console.error("[Razorpay] Verify payment error:", error?.message || error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Payment verification failed",
      },
      { status: 500 }
    );
  }
}
