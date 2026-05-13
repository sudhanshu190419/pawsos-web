"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface Coords {
  latitude: number;
  longitude: number;
}

interface UserLocation extends Coords {
  address?: string;
}

interface LocationContextType {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: (options?: { showToast?: boolean }) => Promise<UserLocation | null>;
  setLocationManually: (loc: UserLocation) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setLocationWithCache = useCallback((loc: UserLocation | null) => {
    setLocation(loc);
    if (loc) {
      localStorage.setItem("userLocation", JSON.stringify(loc));
    } else {
      localStorage.removeItem("userLocation");
    }
  }, []);

  const fetchAddress = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      const locality = data.address?.city || data.address?.town || data.address?.village || "";
      const district = data.address?.state_district || data.address?.county || data.address?.state || "";
      const address = locality && district && locality !== district ? `${locality}, ${district}` : locality || district || data.display_name;
      return address || "Unknown Location";
    } catch {
      return "Location found (Address lookup failed)";
    }
  };

  const requestLocation = useCallback(async (options: { showToast?: boolean } = {}): Promise<UserLocation | null> => {
    setIsLoading(true);
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await fetchAddress(latitude, longitude);
          const nextLoc = { latitude, longitude, address };
          setLocationWithCache(nextLoc);
          setIsLoading(false);
          resolve(nextLoc);
        },
        (err) => {
          console.error("Location error:", err);
          setError("Location permission denied or unavailable.");
          setIsLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [setLocationWithCache]);

  const setLocationManually = useCallback((loc: UserLocation) => {
    setLocationWithCache(loc);
  }, [setLocationWithCache]);

  // Initial load
  useEffect(() => {
    const stored = localStorage.getItem("userLocation");
    if (stored) {
      try {
        setLocation(JSON.parse(stored));
        setIsLoading(false);
      } catch {
        localStorage.removeItem("userLocation");
      }
    }

    // Auto-request if not already set (this triggers the permission prompt automatically)
    // The user asked to update as soon as the user gives location permission.
    // We check if permission was already granted in a previous session or trigger it now.
    const checkPermissionAndRequest = async () => {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        if (result.state === "granted") {
          await requestLocation();
        } else if (result.state === "prompt") {
          // If it's a new user, we can prompt automatically or wait for their first interaction.
          // The requirement says "as soon as the user gives location permission".
          // Most browsers don't allow triggering permission prompt without interaction,
          // but we can try calling it and see.
          await requestLocation();
        }
      } catch (err) {
        // Fallback for browsers that don't support permissions.query
        await requestLocation();
      }
      setIsLoading(false);
    };

    checkPermissionAndRequest();
  }, [requestLocation]);

  return (
    <LocationContext.Provider value={{ location, isLoading, error, requestLocation, setLocationManually }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
