import axios from "axios";

export async function GET() {
  try {
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    return Response.json({
      success: true,
      token: response.data.token,
    });
  } catch (error: any) {
    console.error(error.response?.data || error.message);

    return Response.json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
}