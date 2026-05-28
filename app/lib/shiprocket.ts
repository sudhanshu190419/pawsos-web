import axios from "axios";

/* ═══════════════════════════════════════════════════
   SHIPROCKET TOKEN CACHE (server-side only)
   ═══════════════════════════════════════════════════
   Caches the Shiprocket auth token in memory to avoid
   repeated authentication requests. The token is refreshed
   after 23 hours (Shiprocket tokens last ~240 hours).
   ═══════════════════════════════════════════════════ */

let cachedToken: string | null = null;
let tokenExpiry = 0;
const TOKEN_REFRESH_MS = 23 * 60 * 60 * 1000; // 23 hours in milliseconds

/* ═══════════════════════════════════════════════════
   PINCODE TO STATE MAPPING (India)
   ═══════════════════════════════════════════════════
   Maps first-2-digit pincode prefixes to state names.
   Specific 3-digit exceptions (Goa 403, etc.) are
   checked first for accuracy.
   ═══════════════════════════════════════════════════ */

/**
 * Specific 3-digit pincode exceptions that don't follow
 * the broad state-level 2-digit grouping.
 */
const PINCODE_EXCEPTIONS: Record<string, string> = {
  "403": "Goa",
  "605": "Puducherry",
  "682": "Lakshadweep",
  "737": "Sikkim",
  "744": "Andaman and Nicobar Islands",
  "396": "Dadra and Nagar Haveli and Daman and Diu",
};

/**
 * Broad 2-digit pincode prefix → state(s).
 * Some prefixes cover multiple states; we pick the most likely one.
 */
const PINCODE_STATE_MAP: Record<string, string> = {
  "11": "Delhi",
  "12": "Haryana",
  "13": "Haryana",
  "14": "Punjab",
  "15": "Punjab",
  "16": "Chandigarh",
  "17": "Himachal Pradesh",
  "18": "Jammu and Kashmir",
  "19": "Jammu and Kashmir",
  "20": "Uttar Pradesh",
  "21": "Uttar Pradesh",
  "22": "Uttar Pradesh",
  "23": "Uttar Pradesh",
  "24": "Uttar Pradesh",
  "25": "Uttar Pradesh",
  "26": "Uttar Pradesh",
  "27": "Uttar Pradesh",
  "28": "Uttar Pradesh",
  "30": "Rajasthan",
  "31": "Rajasthan",
  "32": "Rajasthan",
  "33": "Rajasthan",
  "34": "Rajasthan",
  "36": "Gujarat",
  "37": "Gujarat",
  "38": "Gujarat",
  "39": "Gujarat",
  "40": "Maharashtra",
  "41": "Maharashtra",
  "42": "Maharashtra",
  "43": "Maharashtra",
  "44": "Maharashtra",
  "45": "Madhya Pradesh",
  "46": "Madhya Pradesh",
  "47": "Madhya Pradesh",
  "48": "Madhya Pradesh",
  "49": "Chhattisgarh",
  "50": "Telangana",
  "51": "Andhra Pradesh",
  "52": "Andhra Pradesh",
  "53": "Andhra Pradesh",
  "56": "Karnataka",
  "57": "Karnataka",
  "58": "Karnataka",
  "59": "Karnataka",
  "60": "Tamil Nadu",
  "61": "Tamil Nadu",
  "62": "Tamil Nadu",
  "63": "Tamil Nadu",
  "64": "Tamil Nadu",
  "65": "Tamil Nadu",
  "66": "Tamil Nadu",
  "67": "Kerala",
  "68": "Kerala",
  "69": "Kerala",
  "70": "West Bengal",
  "71": "West Bengal",
  "72": "West Bengal",
  "73": "West Bengal",
  "74": "West Bengal",
  "75": "Odisha",
  "76": "Odisha",
  "77": "Odisha",
  "78": "Assam",
  "79": "Assam",
  "80": "Bihar",
  "81": "Bihar",
  "82": "Jharkhand",
  "83": "Jharkhand",
  "84": "Bihar",
  "85": "Jharkhand",
  "86": "Uttar Pradesh",
  "87": "Uttar Pradesh",
  "88": "Uttar Pradesh",
  "89": "Uttar Pradesh",
};

/**
 * Extract the Indian state name from a 6-digit pincode.
 * Checks 3-digit exceptions first, then falls back to 2-digit prefix.
 * Returns empty string if the pincode is invalid or unrecognized.
 */
export function extractPincodeState(pincode: string): string {
  const cleaned = pincode.replace(/\D/g, "");
  if (cleaned.length !== 6) return "";

  const threePrefix = cleaned.slice(0, 3);
  if (PINCODE_EXCEPTIONS[threePrefix]) {
    return PINCODE_EXCEPTIONS[threePrefix];
  }

  const twoPrefix = cleaned.slice(0, 2);
  return PINCODE_STATE_MAP[twoPrefix] || "";
}

/* ═══════════════════════════════════════════════════
   SANITIZE INDIAN PHONE NUMBER
   ═══════════════════════════════════════════════════

   Removes all non-digits, strips country code (91),
   keeps last 10 digits, validates starts with 6/7/8/9.

   Returns a valid 10-digit Indian phone number,
   or empty string if the input could not produce one.

   Examples:
     "+91 88609-79255" → "8860979255"
     "08860979255"     → "8860979255"
     "8860979255"      → "8860979255"
     "9999999999"      → "9999999999"
     "12345"           → ""  (too short, invalid prefix)
   ═══════════════════════════════════════════════════ */

export function sanitizeIndianPhone(raw: string): string {
  console.log("[sanitizeIndianPhone] INPUT(raw):", JSON.stringify(raw));

  // Step 1: strip everything except digits
  const digitsOnly = raw.replace(/\D/g, "");
  console.log("[sanitizeIndianPhone] STEP1(digitsOnly):", JSON.stringify(digitsOnly));

  if (!digitsOnly) {
    console.warn("[sanitizeIndianPhone] FAILED: no digits found");
    return "";
  }

  // Step 2: if the number starts with 91 and is >10 digits, strip the country code
  let trimmed = digitsOnly;
  if (trimmed.length > 10 && trimmed.startsWith("91")) {
    trimmed = trimmed.slice(2);
    console.log("[sanitizeIndianPhone] STEP2(stripped91):", JSON.stringify(trimmed));
  }

  // Step 3: if still more than 10 digits, take only the last 10
  if (trimmed.length > 10) {
    trimmed = trimmed.slice(-10);
    console.log("[sanitizeIndianPhone] STEP3(last10):", JSON.stringify(trimmed));
  }

  // Step 4: if shorter than 10, left-pad with leading zeros would still be invalid
  //         because Indian mobiles must start with 6/7/8/9. So bail.
  if (trimmed.length !== 10) {
    console.warn(
      "[sanitizeIndianPhone] FAILED: expected 10 digits, got",
      trimmed.length,
      JSON.stringify(trimmed)
    );
    return "";
  }

  // Step 5: Indian mobile numbers must start with 6, 7, 8, or 9
  const firstDigit = trimmed[0];
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    console.warn(
      "[sanitizeIndianPhone] FAILED: first digit must be 6/7/8/9, got:",
      firstDigit
    );
    return "";
  }

  console.log("[sanitizeIndianPhone] SUCCESS:", JSON.stringify(trimmed));
  return trimmed;
}

/**
 * Validate that a phone number is a valid 10-digit Indian mobile number.
 */
export function isValidIndianPhone(phone: string): boolean {
  const sanitized = sanitizeIndianPhone(phone);
  return sanitized.length === 10;
}

export async function getShiprocketToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    console.log("[Shiprocket] Using cached token");
    return cachedToken!;
  }

  console.log("[Shiprocket] Refreshing token");

  try {
    console.log("EMAIL:", process.env.SHIPROCKET_EMAIL);
console.log("PASSWORD:", process.env.SHIPROCKET_PASSWORD);
console.log(
  "PASSWORD LENGTH:",
  process.env.SHIPROCKET_PASSWORD?.length
);
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    cachedToken = response.data.token;
    tokenExpiry = Date.now() + TOKEN_REFRESH_MS;

    console.log("[Shiprocket] Token refreshed successfully");
    return cachedToken!;
  } catch (error: any) {
    // Clear cache on auth failure
    cachedToken = null;
    tokenExpiry = 0;
    console.error("Shiprocket Auth Error:", error.response?.data || error.message);
    throw new Error("Failed to authenticate Shiprocket");
  }
}