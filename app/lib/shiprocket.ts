import axios from "axios";

export async function getShiprocketToken() {
  try {
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
      
    );

    return response.data.token;
  } catch (error: any) {
    console.error("Shiprocket Auth Error:", error.response?.data || error.message);
    throw new Error("Failed to authenticate Shiprocket");
  }
}