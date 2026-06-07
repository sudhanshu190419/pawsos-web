import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

export type SellerVerificationStatus = "pending" | "approved" | "rejected";

export interface BrandProfile {
  uid: string;
  brandName: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber: string;
  pickupAddress: string;
  city: string;
  state: string;
  pincode: string;
  logoURL: string;
  businessDocumentURL: string;
  website: string;
  instagram: string;
  description: string;
  verificationStatus: SellerVerificationStatus;
  shiprocketPickupCreated: boolean;
  shiprocketPickupId: number | null;
  shiprocketPickupName: string | null;
  shiprocketPickupCreatedAt?: any;
  shiprocketPickupStatus?: "active" | "inactive";
  createdAt?: any;
}

export async function fetchSellerVerificationStatus(uid: string): Promise<SellerVerificationStatus | null> {
  const snap = await getDoc(doc(db, "brands", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as BrandProfile;
  return data.verificationStatus ?? null;
}

export async function fetchBrandProfile(uid: string): Promise<BrandProfile | null> {
  const snap = await getDoc(doc(db, "brands", uid));
  if (!snap.exists()) return null;
  return snap.data() as BrandProfile;
}

export async function createBrandApplication(
  uid: string,
  data: Omit<BrandProfile, "uid" | "verificationStatus" | "shiprocketPickupCreated" | "shiprocketPickupId" | "shiprocketPickupName" | "shiprocketPickupCreatedAt" | "shiprocketPickupStatus" | "createdAt">
) {
  await setDoc(doc(db, "brands", uid), {
    ...data,
    uid,
    verificationStatus: "pending",
    shiprocketPickupCreated: false,
    shiprocketPickupId: null,
    shiprocketPickupName: null,
    createdAt: serverTimestamp(),
  } satisfies Omit<BrandProfile, "createdAt"> & { createdAt: ReturnType<typeof serverTimestamp> });
}

export interface BrandFormData {
  brandName: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber: string;
  pickupAddress: string;
  city: string;
  state: string;
  pincode: string;
  website: string;
  instagram: string;
  description: string;
}

export function validateBrandForm(data: BrandFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.brandName.trim()) errors.brandName = "Brand name is required";
  if (!data.ownerName.trim()) errors.ownerName = "Owner name is required";
  if (!data.email.trim()) errors.email = "Business email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address";
  if (!data.phone.trim()) errors.phone = "Phone number is required";
  else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, ""))) errors.phone = "Enter a valid 10-digit Indian phone number";
  if (data.gstNumber && !/^[0-9A-Z]{15}$/.test(data.gstNumber.trim().toUpperCase())) {
    errors.gstNumber = "Enter a valid 15-character GST number";
  }
  if (!data.pickupAddress.trim()) errors.pickupAddress = "Pickup address is required";
  else if (!/\d/.test(data.pickupAddress)) errors.pickupAddress = "Address must include a house/shop number for Shiprocket";
  if (!data.city.trim()) errors.city = "City is required";
  if (!data.state) errors.state = "Please select a state";
  if (!data.pincode.trim()) errors.pincode = "Pincode is required";
  else if (!/^[1-9]\d{5}$/.test(data.pincode.trim())) errors.pincode = "Enter a valid 6-digit pincode";

  return errors;
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

export async function uploadBrandFile(
  uid: string,
  file: File,
  type: "logo" | "document"
): Promise<string> {
  const prefix = type === "logo" ? "logos" : "documents";
  const fileRef = ref(storage, `brands/${prefix}/${uid}_${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(fileRef, file);
  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      null,
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}
