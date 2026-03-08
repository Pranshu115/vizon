'use client'

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import { useEffect } from "react";

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  const defaultIconProto = L.Icon.Default.prototype as any
  if ('_getIconUrl' in defaultIconProto) {
    delete defaultIconProto._getIconUrl
  }
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -34],
  shadowSize: [41, 41],
});

const locations = [
  {
    name: "Mumbai",
    coordinates: [19.076, 72.8777] as [number, number],
    landmark: "Marine Drive",
  },
  {
    name: "Delhi",
    coordinates: [28.7041, 77.1025] as [number, number],
    landmark: "India Gate",
  },
  {
    name: "Delhi NCR",
    coordinates: [28.5355, 77.3910] as [number, number],
    landmark: "Noida",
  },
  {
    name: "Gurugram",
    coordinates: [28.4089, 77.0378] as [number, number],
    landmark: "Cyber City",
  },
  {
    name: "Kanpur",
    coordinates: [26.4499, 80.3319] as [number, number],
    landmark: "JK Temple",
  },
  {
    name: "Lucknow",
    coordinates: [26.8467, 80.9462] as [number, number],
    landmark: "Rumi Darwaza",
  },
  {
    name: "Chandigarh",
    coordinates: [30.7333, 76.7794] as [number, number],
    landmark: "Rock Garden",
  },
  {
    name: "Pune",
    coordinates: [18.5204, 73.8567] as [number, number],
    landmark: "Shaniwar Wada",
  },
];

const Map = () => {
  const center = useMemo<[number, number]>(() => {
    const lat = locations.reduce((sum, loc) => sum + loc.coordinates[0], 0) / locations.length;
    const lng = locations.reduce((sum, loc) => sum + loc.coordinates[1], 0) / locations.length;
    return [lat, lng];
  }, []);

  const indiaBounds = useMemo(() => {
    const southWest: [number, number] = [6.5546, 68.1114];
    const northEast: [number, number] = [37.097, 97.3953];
    return [southWest, northEast] as L.LatLngBoundsExpression;
  }, []);

  return (
    <div className="w-full h-[400px] overflow-hidden rounded-lg">
      <MapContainer
        center={center}
        zoom={5}
        minZoom={4}
        maxBounds={indiaBounds}
        maxBoundsViscosity={0.8}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((location) => (
          <Marker key={location.name} position={location.coordinates} icon={markerIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{location.name}</p>
                <p className="text-xs text-muted-foreground">Nearby: {location.landmark}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;


