import { doc, getDoc } from "firebase/firestore";

import { db } from "./firebase";

export type VetVerificationStatus = "pending_review" | "approved" | "rejected";

export interface VetProfile {
  uid?: string;
  fullName?: string;
  clinicName?: string;
  verificationStatus?: VetVerificationStatus;
  shiprocketPickupId?: number;
  shiprocketPickupName?: string;
}

export async function fetchVetVerificationStatus(uid: string): Promise<VetVerificationStatus | null> {
  const snap = await getDoc(doc(db, "vets_web", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as VetProfile;
  return data.verificationStatus ?? null;
}

export async function fetchVetProfile(uid: string): Promise<VetProfile | null> {
  const snap = await getDoc(doc(db, "vets_web", uid));
  if (!snap.exists()) return null;
  return snap.data() as VetProfile;
}
