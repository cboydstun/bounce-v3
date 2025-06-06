import { TaskLocation } from "../types/task";

/**
 * OpenRoute Service geocoding utility
 * Converts addresses to coordinates using OpenRoute Service API
 */

interface OpenRouteGeocodingResponse {
  features: Array<{
    geometry: {
      coordinates: [number, number]; // [longitude, latitude]
    };
    properties: {
      label: string;
      confidence: number;
    };
  }>;
}

/**
 * Geocode an address using OpenRoute Service
 * @param address The address to geocode
 * @returns Promise resolving to TaskLocation or null if geocoding fails
 */
export async function geocodeAddress(
  address: string,
): Promise<TaskLocation | null> {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTESERVICE_API_KEY environment variable is not set");
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodedAddress}&size=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `OpenRoute Service API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data: OpenRouteGeocodingResponse = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [longitude, latitude] = feature.geometry.coordinates;

      // Validate coordinates
      if (
        typeof longitude === "number" &&
        typeof latitude === "number" &&
        longitude >= -180 &&
        longitude <= 180 &&
        latitude >= -90 &&
        latitude <= 90
      ) {
        return {
          type: "Point",
          coordinates: [longitude, latitude],
        };
      }
    }

    console.warn(`No valid coordinates found for address: ${address}`);
    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get an address
 * @param longitude Longitude coordinate
 * @param latitude Latitude coordinate
 * @returns Promise resolving to address string or null if reverse geocoding fails
 */
export async function reverseGeocode(
  longitude: number,
  latitude: number,
): Promise<string | null> {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTESERVICE_API_KEY environment variable is not set");
      return null;
    }

    const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${apiKey}&point.lon=${longitude}&point.lat=${latitude}&size=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `OpenRoute Service API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data: OpenRouteGeocodingResponse = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].properties.label;
    }

    console.warn(`No address found for coordinates: ${longitude}, ${latitude}`);
    return null;
  } catch (error) {
    console.error("Error reverse geocoding coordinates:", error);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @param degrees Degrees to convert
 * @returns Radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate if coordinates are within valid ranges
 * @param longitude Longitude to validate
 * @param latitude Latitude to validate
 * @returns True if coordinates are valid
 */
export function validateCoordinates(
  longitude: number,
  latitude: number,
): boolean {
  return (
    typeof longitude === "number" &&
    typeof latitude === "number" &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90 &&
    !isNaN(longitude) &&
    !isNaN(latitude)
  );
}
