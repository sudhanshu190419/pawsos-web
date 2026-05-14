"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon paths in Next.js
const defaultIconPrototype = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown };
delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function HQMapPicker({
  hqCoords,
  setHqCoords,
}: {
  hqCoords: { latitude: number; longitude: number } | null;
  setHqCoords: (next: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click: (event) => {
      setHqCoords({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });

  if (!hqCoords) return null;

  return <Marker position={[hqCoords.latitude, hqCoords.longitude]} />;
}

function HQMapView({ hqCoords }: { hqCoords: { latitude: number; longitude: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!hqCoords) return;
    map.setView([hqCoords.latitude, hqCoords.longitude], 14, { animate: false });
  }, [hqCoords, map]);
  return null;
}

export default function HQMapClient({
  hqCoords,
  setHqCoords,
}: {
  hqCoords: { latitude: number; longitude: number } | null;
  setHqCoords: (next: { latitude: number; longitude: number }) => void;
}) {
  return (
    <MapContainer
      center={hqCoords ? [hqCoords.latitude, hqCoords.longitude] : [28.6139, 77.209]}
      zoom={hqCoords ? 14 : 5}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <HQMapPicker hqCoords={hqCoords} setHqCoords={setHqCoords} />
      <HQMapView hqCoords={hqCoords} />
    </MapContainer>
  );
}
