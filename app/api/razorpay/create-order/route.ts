import Razorpay from "razorpay";

export const runtime = "nodejs";

/**
 * POST /api/razorpay/create-order
 *
 * Creates a Razorpay order for online payments.
 * Amount should be in paise (₹1 = 100 paise).
 *
 * Request body:
 *   { amount: number, currency?: string }
 *
 * Response:
 *   { success: true, orderId: string, amount: number, currency: string }
 *   or
 *   { success: false, error: string }
 */
export async function POST(req: Request) {
  try {
    const { amount, currency } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return Response.json(
        { success: false, error: "Invalid amount. Must be a positive number in paise." },
        { status: 400 }
      );
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET env vars");
      return Response.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: currency || "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        platform: "AnimalSathi",
      },
    });

    console.log("[Razorpay] Order created:", order.id, "amount:", order.amount, "currency:", order.currency);

    return Response.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("[Razorpay] Create order error:", error?.response?.data || error?.message || error);
    return Response.json(
      {
        success: false,
        error: error?.response?.data?.description || error?.message || "Failed to create Razorpay order",
      },
      { status: 500 }
    );
  }
}
