import axios from "axios";
import { getShiprocketToken } from "@/app/lib/shiprocket";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const token = await getShiprocketToken();

    console.log(
  "Shiprocket token generated:",
  token.substring(0, 15) + "..."
);
if (
  !body.clinicName ||
  !body.fullName ||
  !body.email ||
  !body.phone ||
  !body.clinicAddress ||
  !body.city ||
  !body.state ||
  !body.pincode
) {
  return Response.json({
    success: false,
    error: "Missing required fields",
  });
}

const sanitizedPhone = body.phone.replace(/\D/g, "");
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/settings/company/addpickup",
      {
  pickup_location:
`${body.clinicName.replace(/\s+/g, "")}_${body.vetId.slice(0,6)}_${Date.now()}`,

  name: body.fullName,

  email: body.email,

  phone: sanitizedPhone,

  address: body.clinicAddress.trim(),

  address_2: "",

  city: body.city.trim(),
state: body.state.trim(),

  country: "India",

  pin_code: body.pincode,
},
      {
        headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
      }
    );

    return Response.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {

  console.log("------ SHIPROCKET DEBUG ------");

  console.log("HTTP STATUS:", error.response?.status);

  console.log("HEADERS:", error.response?.headers);

  console.log("DATA:", error.response?.data);

  console.log("MESSAGE:", error.message);

  return Response.json({
    success: false,
    error: error.response?.data || error.message,
  });
}
}