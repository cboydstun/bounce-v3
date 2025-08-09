"use client";

import { useEffect, useRef, useState } from "react";
import { Contact } from "../types/contact";
import { Loader } from "@googlemaps/js-api-loader";

// Extended Contact type with coordinates (added during route optimization)
interface ContactWithCoordinates extends Contact {
  coordinates?: [number, number];
}

interface GoogleRouteMapProps {
  contacts: Contact[];
  optimizedOrder: ContactWithCoordinates[];
  routeGeometry: any;
  startAddress: string;
  startCoordinates: [number, number];
}

export default function GoogleRouteMap({
  contacts,
  optimizedOrder,
  routeGeometry,
  startAddress,
  startCoordinates,
}: GoogleRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error("Google Maps API key is not configured");
        }

        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places", "geometry"],
        });

        await loader.load();
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load Google Maps",
        );
      }
    };

    initializeMap();
  }, []);

  // Create and update map when loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      // Initialize map
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: startCoordinates[1], lng: startCoordinates[0] },
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      mapInstanceRef.current = map;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // Clear existing directions
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }

      // Add start marker
      const startMarker = new google.maps.Marker({
        position: { lat: startCoordinates[1], lng: startCoordinates[0] },
        map,
        title: "Start Location",
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#10B981" stroke="#ffffff" stroke-width="3"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
      });

      const startInfoWindow = new google.maps.InfoWindow({
        content: `<div><strong>Start:</strong><br>${startAddress}</div>`,
      });

      startMarker.addListener("click", () => {
        startInfoWindow.open(map, startMarker);
      });

      markersRef.current.push(startMarker);

      // Add markers for each delivery location
      optimizedOrder.forEach((contact, index) => {
        if (contact.coordinates) {
          const [lng, lat] = contact.coordinates;

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            title: `${index + 1}. ${contact.bouncer}`,
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="#ffffff" stroke-width="3"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${index + 1}</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div>
                <strong>${index + 1}. ${contact.bouncer}</strong><br>
                ${contact.streetAddress || ""}<br>
                ${contact.city || ""}, ${contact.state || ""} ${contact.partyZipCode || ""}<br>
                Phone: ${contact.phone || "N/A"}
              </div>
            `,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
        }
      });

      // Draw route if geometry is available
      if (routeGeometry && optimizedOrder.length > 0) {
        try {
          // If we have GeoJSON route geometry, convert it to Google Maps format
          if (
            routeGeometry.type === "FeatureCollection" ||
            routeGeometry.type === "Feature"
          ) {
            const coordinates = extractCoordinatesFromGeoJSON(routeGeometry);
            if (coordinates.length > 0) {
              const path = coordinates.map((coord) => ({
                lat: coord[1],
                lng: coord[0],
              }));

              const polyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: "#3B82F6",
                strokeOpacity: 1.0,
                strokeWeight: 4,
              });

              polyline.setMap(map);
            }
          } else {
            // Use Google Directions Service for better route rendering
            renderDirectionsRoute(map);
          }
        } catch (error) {
          console.error("Error drawing route:", error);
          // Fallback to directions service
          renderDirectionsRoute(map);
        }
      }

      // Fit map bounds to show all markers
      if (markersRef.current.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markersRef.current.forEach((marker) => {
          const position = marker.getPosition();
          if (position) {
            bounds.extend(position);
          }
        });
        map.fitBounds(bounds);

        // Ensure minimum zoom level
        const listener = google.maps.event.addListener(map, "idle", () => {
          if (map.getZoom() && map.getZoom()! > 15) {
            map.setZoom(15);
          }
          google.maps.event.removeListener(listener);
        });
      }
    } catch (error) {
      console.error("Error creating map:", error);
      setError("Failed to create map");
    }
  }, [
    isLoaded,
    contacts,
    optimizedOrder,
    routeGeometry,
    startAddress,
    startCoordinates,
  ]);

  // Function to render route using Google Directions Service
  const renderDirectionsRoute = (map: google.maps.Map) => {
    if (optimizedOrder.length === 0) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true, // We're using custom markers
      polylineOptions: {
        strokeColor: "#3B82F6",
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });

    directionsRenderer.setMap(map);
    directionsRendererRef.current = directionsRenderer;

    // Create waypoints from optimized order
    const waypoints = optimizedOrder
      .slice(1, -1)
      .map((contact) => {
        if (contact.coordinates) {
          const [lng, lat] = contact.coordinates;
          return {
            location: new google.maps.LatLng(lat, lng),
            stopover: true,
          };
        }
        return null;
      })
      .filter(Boolean) as google.maps.DirectionsWaypoint[];

    const origin = new google.maps.LatLng(
      startCoordinates[1],
      startCoordinates[0],
    );
    const destination =
      optimizedOrder.length > 0 &&
      optimizedOrder[optimizedOrder.length - 1].coordinates
        ? new google.maps.LatLng(
            optimizedOrder[optimizedOrder.length - 1].coordinates![1],
            optimizedOrder[optimizedOrder.length - 1].coordinates![0],
          )
        : origin;

    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false, // We've already optimized the route
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
      } else {
        console.error("Directions request failed:", status);
      }
    });
  };

  // Helper function to extract coordinates from GeoJSON
  const extractCoordinatesFromGeoJSON = (geoJson: any): number[][] => {
    if (geoJson.type === "FeatureCollection") {
      const coordinates: number[][] = [];
      geoJson.features.forEach((feature: any) => {
        if (feature.geometry && feature.geometry.coordinates) {
          if (feature.geometry.type === "LineString") {
            coordinates.push(...feature.geometry.coordinates);
          }
        }
      });
      return coordinates;
    } else if (geoJson.type === "Feature" && geoJson.geometry) {
      if (geoJson.geometry.type === "LineString") {
        return geoJson.geometry.coordinates;
      }
    }
    return [];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, []);

  if (error) {
    return (
      <div
        style={{ height: "500px", width: "100%", borderRadius: "8px" }}
        className="border border-red-300 shadow-sm flex items-center justify-center bg-red-50"
      >
        <div className="text-center text-red-600">
          <p className="font-semibold">Map Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={{ height: "500px", width: "100%", borderRadius: "8px" }}
        className="border border-gray-300 shadow-sm flex items-center justify-center bg-gray-50"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height: "500px", width: "100%", borderRadius: "8px" }}
      className="border border-gray-300 shadow-sm"
    />
  );
}
