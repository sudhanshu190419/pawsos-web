type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
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

export type VetAppointmentInput = {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  vetId: string;
  vetName: string;
  clinicName: string;
  petId: string;
  petName: string;
  petType: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationType: string;
  reason: string;
  notes: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getBearerToken(authorizationHeader: string | null) {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function getProjectId() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new ApiError("Firebase project ID is not configured", 500);
  }

  return projectId;
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

function stringField(value: string | undefined): FirestoreValue {
  return { stringValue: value ?? "" };
}

function numberField(value: number): FirestoreValue {
  return Number.isInteger(value)
    ? { integerValue: String(value) }
    : { doubleValue: value };
}

function timestampField(date: Date): FirestoreValue {
  return { timestampValue: date.toISOString() };
}

async function firestoreFetch(
  url: string,
  firebaseIdToken: string,
  init?: RequestInit
) {
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${firebaseIdToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("[Razorpay] Firestore REST network error:", error);
    throw new ApiError("Could not reach Firestore", 503);
  }
}

export async function getVetPricingData(
  vetId: string,
  firebaseIdToken: string
) {
  const projectId = getProjectId();
  const encodedVetId = encodeURIComponent(vetId);
  const firestoreUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/vets_web/${encodedVetId}`;

  const response = await firestoreFetch(firestoreUrl, firebaseIdToken);

  if (response.status === 404) {
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    throw new ApiError("Please sign in again before booking this appointment", 401);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("[Razorpay] Firestore vet lookup failed:", response.status, body ? "[response body redacted]" : "empty");
    throw new ApiError("Could not validate vet pricing", 502);
  }

  const firestoreDocument = (await response.json()) as FirestoreDocument;
  return mapVetPricingData(firestoreDocument);
}

export async function createVetAppointment(params: {
  firebaseIdToken: string;
  documentId: string;
  appointment: VetAppointmentInput;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}) {
  const {
    firebaseIdToken,
    documentId,
    appointment,
    amount,
    currency,
    razorpayOrderId,
    razorpayPaymentId,
  } = params;

  const projectId = getProjectId();
  const encodedDocumentId = encodeURIComponent(documentId);
  const firestoreUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/vet_appointments?documentId=${encodedDocumentId}`;

  const now = new Date();
  const platformFee = Math.round(amount * 10) / 100;
  const vetPayoutAmount = Math.round((amount - platformFee) * 100) / 100;

  const response = await firestoreFetch(firestoreUrl, firebaseIdToken, {
    method: "POST",
    body: JSON.stringify({
      fields: {
        userId: stringField(appointment.userId),
        userName: stringField(appointment.userName),
        userEmail: stringField(appointment.userEmail),
        userPhone: stringField(appointment.userPhone),
        vetId: stringField(appointment.vetId),
        vetName: stringField(appointment.vetName),
        clinicName: stringField(appointment.clinicName),
        petId: stringField(appointment.petId),
        petName: stringField(appointment.petName),
        petType: stringField(appointment.petType),
        appointmentDate: stringField(appointment.appointmentDate),
        appointmentTime: stringField(appointment.appointmentTime),
        consultationType: stringField(appointment.consultationType),
        reason: stringField(appointment.reason),
        notes: stringField(appointment.notes),
        amount: numberField(amount),
        currency: stringField(currency),
        platformFee: numberField(platformFee),
        vetPayoutAmount: numberField(vetPayoutAmount),
        paymentStatus: stringField("paid"),
        appointmentStatus: stringField("requested"),
        razorpayOrderId: stringField(razorpayOrderId),
        razorpayPaymentId: stringField(razorpayPaymentId),
        createdAt: timestampField(now),
        updatedAt: timestampField(now),
      },
    }),
  });

  if (response.ok) {
    return documentId;
  }

  if (response.status === 409) {
    return documentId;
  }

  const body = await response.text().catch(() => "");
  console.error(
    "[Razorpay] Firestore appointment creation failed:",
    response.status,
    body ? "[response body redacted]" : "empty"
  );

  if (response.status === 401 || response.status === 403) {
    throw new ApiError(
      "Firestore denied appointment creation. Deploy the latest Firestore rules and sign in again.",
      403
    );
  }

  throw new ApiError("Could not create appointment record", 502);
}
