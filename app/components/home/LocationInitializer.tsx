"use client";

import { useEffect } from "react";

/**
 * Requests the user's geolocation on first visit and stores it in localStorage.
 * Extracted from page.tsx so the page can remain a server component.
 */
export default function LocationInitializer() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      const storedLocation = localStorage.getItem("userLocation");
      if (!storedLocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();
              const location = {
                latitude,
                longitude,
                address:
                  data.address?.city ||
                  data.address?.county ||
                  `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
              };
              localStorage.setItem("userLocation", JSON.stringify(location));
            } catch {
              const location = { latitude, longitude, address: undefined };
              localStorage.setItem("userLocation", JSON.stringify(location));
            }
          },
          (error) => {
            console.warn("Location permission denied or unavailable:", error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      }
    }
  }, []);

  return null;
}
