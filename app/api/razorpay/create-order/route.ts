import Razorpay from "razorpay";
import { ApiError, getBearerToken, getVetPricingData } from "../firestore-rest";

export const runtime = "nodejs";

/**
 * POST /api/razorpay/create-order
 *
 * Creates a Razorpay order for online payments.
 * Amount should be in paise (₹1 = 100 paise).
 *
 * Request body:
 *   { amount: number, currency?: string, purpose?: string, vetId?: string, consultationType?: string, userId?: string }
 *
 * Response:
 *   { success: true, orderId: string, amount: number, currency: string }
 *   or
 *   { success: false, error: string }
 */
export async function POST(req: Request) {
  try {
    const { amount, currency, purpose, vetId, consultationType, userId } = await req.json();

    let finalAmount = amount;

    if (purpose === "vet_appointment") {
      const firebaseIdToken = getBearerToken(req.headers.get("authorization"));

      if (!firebaseIdToken) {
        return Response.json(
          { success: false, error: "Please sign in before booking an appointment" },
          { status: 401 }
        );
      }

      if (!vetId) {
        return Response.json(
          { success: false, error: "Missing vetId for vet appointment" },
          { status: 400 }
        );
      }
      if (!consultationType) {
        return Response.json(
          { success: false, error: "Missing consultationType for vet appointment" },
          { status: 400 }
        );
      }

      // Fetch vet profile from Firestore
      const vetData = await getVetPricingData(vetId, firebaseIdToken);
      if (!vetData) {
        return Response.json(
          { success: false, error: "Vet profile not found" },
          { status: 404 }
        );
      }

      if (vetData.verificationStatus !== "approved") {
        return Response.json(
          { success: false, error: "This vet profile is not approved" },
          { status: 400 }
        );
      }

      let verifiedFee = 0;
      if (consultationType === "clinic_visit" || consultationType === "remote_consultation") {
        verifiedFee = vetData.consultationFee ?? 0;
      } else if (consultationType === "emergency") {
        if (!vetData.willingToTravel) {
          return Response.json(
            { success: false, error: "Vet is not willing to travel for emergency consultations" },
            { status: 400 }
          );
        }
        verifiedFee = vetData.emergencyFee ?? vetData.consultationFee ?? 0;
      } else {
        return Response.json(
          { success: false, error: "Invalid consultationType" },
          { status: 400 }
        );
      }

      if (!verifiedFee || verifiedFee <= 0) {
        return Response.json(
          { success: false, error: "Pricing not configured for this vet" },
          { status: 400 }
        );
      }

      // Overwrite client-provided amount with verified fee in paise (₹1 = 100 paise)
      finalAmount = Math.round(verifiedFee * 100);
    } else {
      if (!finalAmount || typeof finalAmount !== "number" || finalAmount <= 0) {
        return Response.json(
          { success: false, error: "Invalid amount. Must be a positive number in paise." },
          { status: 400 }
        );
      }
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

    const notes: Record<string, string> = {
      platform: "AnimalSathi",
    };
    if (purpose) notes.purpose = purpose;
    if (vetId) notes.vetId = vetId;
    if (userId) notes.userId = userId;
    if (consultationType) notes.consultationType = consultationType;

    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount),
      currency: currency || "INR",
      receipt: `rcpt_${Date.now()}`,
      notes,
    });

    console.log("[Razorpay] Order created:", order.id, "amount:", order.amount, "currency:", order.currency);

    return Response.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    const err = error as { response?: { data?: { description?: string } }; message?: string };
    console.error("[Razorpay] Create order error:", err?.message || "Unknown error");
    return Response.json(
      {
        success: false,
        error: err?.response?.data?.description || err?.message || "Failed to create Razorpay order",
      },
      { status: 500 }
    );
  }
}
