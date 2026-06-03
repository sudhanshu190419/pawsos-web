import Razorpay from "razorpay";

export const runtime = "nodejs";

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
};

type FirestoreDocument = {
  fields?: Record<string, FirestoreValue>;
};

type VetPricingData = {
  verificationStatus?: string;
  consultationFee?: number;
  emergencyFee?: number;
  willingToTravel?: boolean;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(authorizationHeader: string | null) {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function readFirestoreNumber(value: FirestoreValue | undefined) {
  if (!value) return undefined;

  if (typeof value.doubleValue === "number") {
    return value.doubleValue;
  }

  if (value.integerValue !== undefined) {
    const parsed = Number(value.integerValue);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (value.stringValue !== undefined) {
    const parsed = Number(value.stringValue);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function mapVetPricingData(document: FirestoreDocument): VetPricingData {
  const fields = document.fields ?? {};

  return {
    verificationStatus: fields.verificationStatus?.stringValue,
    consultationFee: readFirestoreNumber(fields.consultationFee),
    emergencyFee: readFirestoreNumber(fields.emergencyFee),
    willingToTravel: fields.willingToTravel?.booleanValue,
  };
}

async function getVetPricingData(vetId: string, firebaseIdToken: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new ApiError("Firebase project ID is not configured", 500);
  }

  const encodedVetId = encodeURIComponent(vetId);
  const firestoreUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/vets_web/${encodedVetId}`;

  let response: Response;
  try {
    response = await fetch(firestoreUrl, {
      headers: {
        Authorization: `Bearer ${firebaseIdToken}`,
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("[Razorpay] Firestore vet lookup network error:", error);
    throw new ApiError("Could not reach Firestore to validate vet pricing", 503);
  }

  if (response.status === 404) {
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    throw new ApiError("Please sign in again before booking this appointment", 401);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("[Razorpay] Firestore vet lookup failed:", response.status, body);
    throw new ApiError("Could not validate vet pricing", 502);
  }

  const firestoreDocument = (await response.json()) as FirestoreDocument;
  return mapVetPricingData(firestoreDocument);
}

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
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    const err = error as { response?: { data?: { description?: string } }; message?: string };
    console.error("[Razorpay] Create order error:", err?.response?.data || err?.message || error);
    return Response.json(
      {
        success: false,
        error: err?.response?.data?.description || err?.message || "Failed to create Razorpay order",
      },
      { status: 500 }
    );
  }
}
