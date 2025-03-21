"use client";

import { useEffect, useRef } from "react";
import { Contact } from "../types/contact";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet marker icons in Next.js
const fixLeafletIcons = () => {
  // Only run on client side
  if (typeof window !== "undefined") {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }
};

interface RouteMapProps {
  contacts: Contact[];
  optimizedOrder: Contact[];
  routeGeometry: any;
  startAddress: string;
  startCoordinates: [number, number];
}

export default function RouteMap({
  contacts,
  optimizedOrder,
  routeGeometry,
  startAddress,
  startCoordinates,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Fix Leaflet icons
    fixLeafletIcons();

    // Initialize map
    const map = L.map(mapRef.current).setView(
      [startCoordinates[1], startCoordinates[0]], // Leaflet uses [lat, lng]
      10,
    );

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add start marker
    L.marker([startCoordinates[1], startCoordinates[0]])
      .addTo(map)
      .bindPopup(`<b>Start:</b> ${startAddress}`)
      .openPopup();

    // Add markers for each contact in the optimized order
    optimizedOrder.forEach((contact: any, index: number) => {
      if (contact.coordinates) {
        const [lng, lat] = contact.coordinates;
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(
            `<b>${index + 1}. ${contact.bouncer}</b><br>
                        ${contact.streetAddress || ""}<br>
                        ${contact.city || ""}, ${contact.state || ""} ${contact.partyZipCode || ""}<br>
                        Phone: ${contact.phone || "N/A"}`,
          );
      }
    });

    // Draw route line if geometry is available
    if (routeGeometry) {
      try {
        const routeLayer = L.geoJSON(routeGeometry).addTo(map);
        map.fitBounds(routeLayer.getBounds());
      } catch (error) {
        console.error("Error drawing route:", error);
      }
    }

    // Cleanup function
    return () => {
      map.remove();
    };
  }, [contacts, optimizedOrder, routeGeometry, startAddress, startCoordinates]);

  return (
    <div
      ref={mapRef}
      style={{ height: "500px", width: "100%", borderRadius: "8px" }}
      className="border border-gray-300 shadow-sm"
    />
  );
}
