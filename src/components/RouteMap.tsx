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
  // Multi-route support
  multipleRoutes?: {
    routes: Array<{
      contacts: Contact[];
      routeGeometry: any;
      color: string;
      driverIndex: number;
      visible?: boolean;
    }>;
  };
}

export default function RouteMap({
  contacts,
  optimizedOrder,
  routeGeometry,
  startAddress,
  startCoordinates,
  multipleRoutes,
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
    const startIcon = L.divIcon({
      html: `<div style="background-color: #10B981; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">S</div>`,
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([startCoordinates[1], startCoordinates[0]], { icon: startIcon })
      .addTo(map)
      .bindPopup(`<b>Start:</b> ${startAddress}`)
      .openPopup();

    // Handle multi-route or single route rendering
    if (multipleRoutes && multipleRoutes.routes.length > 0) {
      // Multi-route rendering
      multipleRoutes.routes.forEach((route, routeIndex) => {
        if (route.visible === false) return; // Skip hidden routes

        // Add markers for this route
        route.contacts.forEach((contact: any, contactIndex: number) => {
          if (contact.coordinates) {
            const [lng, lat] = contact.coordinates;

            // Create custom colored marker
            const markerIcon = L.divIcon({
              html: `<div style="background-color: ${route.color}; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${route.driverIndex + 1}-${contactIndex + 1}</div>`,
              className: "custom-div-icon",
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            L.marker([lat, lng], { icon: markerIcon })
              .addTo(map)
              .bindPopup(
                `<b>Driver ${route.driverIndex + 1} - Stop ${contactIndex + 1}</b><br>
                <b>${contact.bouncer}</b><br>
                ${contact.streetAddress || ""}<br>
                ${contact.city || ""}, ${contact.state || ""} ${contact.partyZipCode || ""}<br>
                Phone: ${contact.phone || "N/A"}`,
              );
          }
        });

        // Draw route line if geometry is available
        if (route.routeGeometry) {
          try {
            const routeLayer = L.geoJSON(route.routeGeometry, {
              style: {
                color: route.color,
                weight: 4,
                opacity: 0.8,
              },
            }).addTo(map);
          } catch (error) {
            console.error("Error drawing multi-route:", error);
          }
        }
      });

      // Fit map to show all markers
      const group = new L.FeatureGroup();
      multipleRoutes.routes.forEach((route) => {
        if (route.visible === false) return;
        route.contacts.forEach((contact: any) => {
          if (contact.coordinates) {
            const [lng, lat] = contact.coordinates;
            group.addLayer(L.marker([lat, lng]));
          }
        });
      });

      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds().pad(0.1));
      }
    } else {
      // Single route rendering (original logic)
      optimizedOrder.forEach((contact: any, index: number) => {
        if (contact.coordinates) {
          const [lng, lat] = contact.coordinates;

          const markerIcon = L.divIcon({
            html: `<div style="background-color: #3B82F6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
            className: "custom-div-icon",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          L.marker([lat, lng], { icon: markerIcon })
            .addTo(map)
            .bindPopup(
              `<b>${index + 1}. ${contact.bouncer}</b><br>
              ${contact.streetAddress || ""}<br>
              ${contact.city || ""}, ${contact.state || ""} ${contact.partyZipCode || ""}<br>
              Phone: ${contact.phone || "N/A"}`,
            );
        }
      });

      // Draw single route line if geometry is available
      if (routeGeometry) {
        try {
          const routeLayer = L.geoJSON(routeGeometry, {
            style: {
              color: "#3B82F6",
              weight: 4,
              opacity: 1.0,
            },
          }).addTo(map);
          map.fitBounds(routeLayer.getBounds());
        } catch (error) {
          console.error("Error drawing route:", error);
        }
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
