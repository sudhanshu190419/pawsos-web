import axios from "axios";
import { getShiprocketToken } from "@/app/lib/shiprocket";

export const runtime = "nodejs";

/**
 * Schedule a pickup with Shiprocket for one or more shipment IDs.
 *
 * Endpoint: POST /v1/external/courier/generate/pickup
 * This triggers Shiprocket to actually start processing the shipment —
 * the courier will be notified to pick up the package.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ENABLE_SHIPROCKET =
      process.env.NEXT_PUBLIC_ENABLE_SHIPROCKET === "true";

    if (!ENABLE_SHIPROCKET) {
      console.log("🧪 TEST MODE: Shiprocket pickup scheduling skipped");

      return Response.json({
        success: true,
        mock: true,
        data: {
          message: "Pickup scheduled (mock)",
          pickup_status: "scheduled",
        },
      });
    }

    const { shipment_ids } = body;

    if (!shipment_ids || !Array.isArray(shipment_ids) || shipment_ids.length === 0) {
      return Response.json({
        success: false,
        error: "Missing required field: shipment_ids must be a non-empty array",
      });
    }

    // Validate all shipment IDs are numbers
    const validIds = shipment_ids.filter(
      (id: any) => typeof id === "number" || (typeof id === "string" && !isNaN(Number(id)))
    ).map((id: any) => Number(id));

    if (validIds.length === 0) {
      return Response.json({
        success: false,
        error: "No valid shipment IDs provided",
      });
    }

    console.log("══════════ SHIPROCKET SCHEDULE PICKUP ══════════");
    console.log("[1/3] Shipment IDs:", JSON.stringify(validIds));

    const token = await getShiprocketToken();
    console.log("[2/3] Token acquired:", !!token);

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/courier/generate/pickup",
      {
        shipment_id: validIds,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("[3/3] Pickup scheduled successfully:", JSON.stringify(response.data));
    console.log("══════════ END ══════════\n");

    return Response.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.log("------ SHIPROCKET SCHEDULE PICKUP DEBUG ------");
    console.log("HTTP STATUS:", error.response?.status);
    console.log("DATA:", JSON.stringify(error.response?.data, null, 2));
    console.log("MESSAGE:", error.message);

    return Response.json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
