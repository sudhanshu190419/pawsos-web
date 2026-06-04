import { getShiprocketToken } from "@/app/lib/shiprocket";

export async function GET() {
  try {
    // Authenticate with Shiprocket and verify the token can be obtained.
    // The token is cached internally by getShiprocketToken() and never
    // exposed to the caller. Server-side routes (create-order, create-pickup)
    // use getShiprocketToken() directly for their own requests.
    await getShiprocketToken();

    return Response.json({
      success: true,
    });
  } catch (error: any) {
    console.error("[Shiprocket] Auth check failed:", error.message);

    return Response.json({
      success: false,
      error: "Shiprocket authentication failed. Check server credentials.",
    });
  }
}