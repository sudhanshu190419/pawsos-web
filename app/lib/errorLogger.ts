import { db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/* ─────────────── Types ─────────────── */

export type FormType = "vet" | "ngo" | "hospital" | "volunteer";
export type ErrorStep = "upload" | "firestore" | "validation" | "submit" | "global";

export interface ErrorLogPayload {
  formType: FormType;
  step: ErrorStep;
  /** Descriptive message (e.g. "Profile photo upload started", "Upload timed out", etc.) */
  errorMessage: string;
  /** Error stack trace if available */
  stackTrace?: string;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  /** True if this log represents a failure (vs a checkpoint log) */
  isError?: boolean;
}

/* ─────────────── Safe Logger ─────────────── */

let globalHandlersInstalled = false;

/**
 * Log an event or error to the `error_logs` Firestore collection.
 * This function NEVER throws — it swallows its own errors so it cannot
 * block the user experience.
 */
export async function logError(payload: ErrorLogPayload): Promise<void> {
  try {
    await addDoc(collection(db, "error_logs"), {
      formType: payload.formType,
      step: payload.step,
      errorMessage: payload.errorMessage,
      stackTrace: payload.stackTrace ?? null,
      fileName: payload.fileName ?? null,
      fileSize: payload.fileSize ?? null,
      fileType: payload.fileType ?? null,
      isError: payload.isError ?? false,
      userAgent: navigator.userAgent,
      pageUrl: window.location.href,
      timestamp: serverTimestamp(),
    });
  } catch (loggingError) {
    // Never let logging failures affect the user experience
    console.warn("[ErrorLogger] Failed to write error log:", loggingError);
  }
}

/**
 * Build a partial ErrorLogPayload from a File object (or null).
 */
export function filePayload(
  file: File | null
): Pick<ErrorLogPayload, "fileName" | "fileSize" | "fileType"> {
  return {
    fileName: file?.name ?? null,
    fileSize: file?.size ?? null,
    fileType: file?.type ?? null,
  };
}

/**
 * Install global `window.onerror` and `window.onunhandledrejection`
 * handlers that automatically log uncaught client-side errors to
 * Firestore. Safe to call multiple times — only installs once.
 */
export function setupGlobalErrorHandling(formType: FormType): void {
  if (globalHandlersInstalled) return;
  globalHandlersInstalled = true;

  if (typeof window === "undefined") return;

  // Capture window.onerror (syntax errors, runtime exceptions, etc.)
  window.onerror = (message, source, lineno, colno, error) => {
    const msg = error?.message || String(message);
    const stack = error?.stack || "";
    logError({
      formType,
      step: "global",
      errorMessage: `window.onerror: ${msg}`,
      stackTrace: stack || `at ${source}:${lineno}:${colno}`,
      isError: true,
    });
    // Return false to let default browser handler also run
    return false;
  };

  // Capture unhandled promise rejections
  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason);
    const stack = reason?.stack || "";
    logError({
      formType,
      step: "global",
      errorMessage: `Unhandled promise rejection: ${msg}`,
      stackTrace: stack,
      isError: true,
    });
  };
}
