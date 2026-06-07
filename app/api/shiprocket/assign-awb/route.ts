import axios from "axios";
import { getShiprocketToken } from "@/app/lib/shiprocket";

export const runtime = "nodejs";

/**
 * Assign AWB code for a Shiprocket shipment.
 *
 * Endpoint: POST /v1/external/courier/assign/awb
 * This retries AWB assignment for shipments where awbCode was null
 * (typically due to insufficient Shiprocket wallet balance at checkout).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ENABLE_SHIPROCKET =
      process.env.NEXT_PUBLIC_ENABLE_SHIPROCKET === "true";

    if (!ENABLE_SHIPROCKET) {
      console.log("🧪 TEST MODE: Shiprocket AWB assignment skipped");

      return Response.json({
        success: true,
        mock: true,
        data: {
          awbCode: "TESTAWB123456",
          courierName: "Test Courier",
          trackingUrl: "https://shiprocket.co/tracking/TESTAWB123456",
        },
      });
    }

    const { shipment_id } = body;

    if (!shipment_id || typeof shipment_id !== "number") {
      return Response.json({
        success: false,
        error: "Missing required field: shipment_id must be a number",
      });
    }

    console.log("══════════ SHIPROCKET AWB RETRY ══════════");
    console.log("[1/3] Shipment ID:", shipment_id);

    const token = await getShiprocketToken();
    console.log("[2/3] Token acquired:", !!token);

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
      {
        shipment_id,
        courier_id: "",
        is_return: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data;
    console.log("[3/3] AWB response:", JSON.stringify(result, null, 2));
    console.log("    awb_code:", result?.awb_code);
    console.log("    courier_name:", result?.courier_name);
    console.log("══════════ END ══════════\n");

    if (!result?.awb_code) {
      return Response.json({
        success: false,
        error: "Shiprocket returned no AWB code. Wallet may be insufficient.",
        details: result,
      });
    }

    return Response.json({
      success: true,
      data: {
        awbCode: result.awb_code,
        courierName: result.courier_name || null,
        trackingUrl: `https://shiprocket.co/tracking/${result.awb_code}`,
      },
    });
  } catch (error: any) {
    console.log("------ SHIPROCKET AWB RETRY DEBUG ------");
    console.log("HTTP STATUS:", error.response?.status);
    console.log("DATA:", JSON.stringify(error.response?.data, null, 2));
    console.log("MESSAGE:", error.message);

    // Extract meaningful error from Shiprocket
    const shiprocketErr = error.response?.data;
    const errorMessage =
      typeof shiprocketErr === "object"
        ? shiprocketErr?.message || shiprocketErr?.error || JSON.stringify(shiprocketErr)
        : shiprocketErr || error.message;

    return Response.json({
      success: false,
      error: errorMessage,
    });
  }
}
