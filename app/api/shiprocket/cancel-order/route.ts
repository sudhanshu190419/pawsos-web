import axios from "axios";
import { getShiprocketToken } from "@/app/lib/shiprocket";

export const runtime = "nodejs";

/**
 * Cancel one or more Shiprocket orders by their Shiprocket order IDs.
 *
 * Endpoint: POST /v1/external/orders/cancel
 * Only works if the order has NOT been picked up or shipped yet.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const ENABLE_SHIPROCKET =
      process.env.NEXT_PUBLIC_ENABLE_SHIPROCKET === "true";

    if (!ENABLE_SHIPROCKET) {
      console.log("🧪 TEST MODE: Shiprocket order cancellation skipped");

      return Response.json({
        success: true,
        mock: true,
        data: {
          message: "Order cancelled (mock)",
          cancelled_ids: body.order_ids || [],
        },
      });
    }

    const { order_ids } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return Response.json({
        success: false,
        error: "Missing required field: order_ids must be a non-empty array",
      });
    }

    // Validate all IDs are numbers
    const validIds = order_ids
      .filter(
        (id: any) =>
          typeof id === "number" ||
          (typeof id === "string" && !isNaN(Number(id)))
      )
      .map((id: any) => Number(id));

    if (validIds.length === 0) {
      return Response.json({
        success: false,
        error: "No valid Shiprocket order IDs provided",
      });
    }

    console.log("══════════ SHIPROCKET CANCEL ORDER ══════════");
    console.log("[1/3] Shiprocket Order IDs:", JSON.stringify(validIds));

    const token = await getShiprocketToken();
    console.log("[2/3] Token acquired:", !!token);

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/cancel",
      { ids: validIds },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      "[3/3] Cancellation response:",
      JSON.stringify(response.data)
    );
    console.log("══════════ END ══════════\n");

    return Response.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.log("------ SHIPROCKET CANCEL ORDER DEBUG ------");
    console.log("HTTP STATUS:", error.response?.status);
    console.log("DATA:", JSON.stringify(error.response?.data, null, 2));
    console.log("MESSAGE:", error.message);

    return Response.json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}
