import { FirebaseStorage } from "firebase/storage";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/* ─────────────── Constants ─────────────── */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const UPLOAD_TIMEOUT_MS = 30000; // 30 seconds (changed from 60s per user request)

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

export const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp";
export const ACCEPT_DOCUMENTS = ".pdf,.jpg,.jpeg,.png";

/* ─────────────── Helpers ─────────────── */

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
}

export const FORMATTED_MAX_SIZE = formatFileSize(MAX_FILE_SIZE);

/**
 * Validates a file against size and optional type constraints.
 * Returns an error message string, or null if the file is valid.
 */
export function validateFile(
  file: File,
  allowedTypes?: string[],
  maxSize: number = MAX_FILE_SIZE
): string | null {
  if (!file || file.size === 0) {
    return "Empty file selected.";
  }
  if (file.size > maxSize) {
    return `File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxSize)}.`;
  }
  if (allowedTypes && allowedTypes.length > 0) {
    const accepted = allowedTypes.map((t) => t.split("/").pop()).join(", ");
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type "${file.type}". Accepted formats: ${accepted}`;
    }
  }
  return null;
}

/**
 * Uploads a single file to Firebase Storage with:
 * - Resumable upload for network resilience
 * - 60-second timeout that cancels the upload task
 * - Progress logging to the console
 * - Per-file error isolation
 *
 * @returns The download URL string
 */
export function uploadFileWithTimeout(
  storage: FirebaseStorage,
  file: File,
  path: string,
  label: string,
  timeoutMs: number = UPLOAD_TIMEOUT_MS
): Promise<string> {
  console.log(`[Upload] ${label}: starting upload to "${path}" (${formatFileSize(file.size)})`);

  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise<string>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      task.cancel();
      const msg = `${label} upload timed out after ${timeoutMs / 1000}s. Please check your internet connection and try again.`;
      console.error(`[Upload] ${label}: TIMED OUT after ${timeoutMs}ms`);
      reject(new Error(msg));
    }, timeoutMs);

    task.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(
          `[Upload] ${label}: ${pct.toFixed(1)}% (${formatFileSize(snapshot.bytesTransferred)} / ${formatFileSize(snapshot.totalBytes)})`
        );
      },
      (error: any) => {
        clearTimeout(timeoutId);
        const code = error?.code || "storage/unknown";
        console.error(`[Upload] ${label}: FAILED — ${code} ${error?.message || ""}`);
        reject(error);
      },
      async () => {
        clearTimeout(timeoutId);
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          console.log(`[Upload] ${label}: completed successfully`);
          resolve(url);
        } catch (urlError: any) {
          console.error(`[Upload] ${label}: upload OK but getDownloadURL failed — ${urlError?.message || urlError}`);
          reject(new Error(`${label} upload succeeded but failed to generate a download URL.`));
        }
      }
    );
  });
}
