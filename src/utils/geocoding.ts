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
 * Geocode an address using OpenRoute Service and return TaskLocation format
 * @param address The address to geocode
 * @returns Promise resolving to TaskLocation or null if geocoding fails
 */
export async function geocodeAddressToTaskLocation(
  address: string,
): Promise<TaskLocation | null> {
  try {
    const coordinates = await geocodeAddress(address);
    return {
      type: "Point",
      coordinates,
    };
  } catch (error) {
    console.error("Error geocoding address to TaskLocation:", error);
    return null;
  }
}

/**
 * Get the base URL for API calls
 * @returns Base URL for the current environment
 */
function getBaseUrl(): string {
  // Check if we're running on the server side
  if (typeof window === "undefined") {
    // Server-side: use environment variable or default
    return (
      process.env.NEXTAUTH_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000"
    );
  }
  // Client-side: use current origin
  return window.location.origin;
}

/**
 * Geocode an address using OpenRoute Service
 * @param address The address to geocode
 * @returns Promise resolving to [longitude, latitude] coordinates
 */
export async function geocodeAddress(
  address: string,
): Promise<[number, number]> {
  try {
    // Get the appropriate base URL for the current environment
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/v1/geocode`;

    // Use our API route instead of calling OpenRouteService directly
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      throw new Error(`Geocoding failed: ${errorMessage}`);
    }

    const data = await response.json();

    if (
      data.coordinates &&
      Array.isArray(data.coordinates) &&
      data.coordinates.length === 2
    ) {
      const [longitude, latitude] = data.coordinates;

      // Validate coordinates
      if (
        typeof longitude === "number" &&
        typeof latitude === "number" &&
        longitude >= -180 &&
        longitude <= 180 &&
        latitude >= -90 &&
        latitude <= 90
      ) {
        return [longitude, latitude];
      }
    }

    throw new Error(`Invalid coordinates received for address: ${address}`);
  } catch (error) {
    console.error("Error geocoding address:", error);
    throw error instanceof Error ? error : new Error("Unknown geocoding error");
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
    // Get the appropriate base URL for the current environment
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/v1/reverse-geocode`;

    // Use our API route instead of calling OpenRouteService directly
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ longitude, latitude }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Reverse geocoding failed:",
        errorData.error || `HTTP ${response.status}`,
      );
      return null;
    }

    const data = await response.json();

    if (data.address && typeof data.address === "string") {
      return data.address;
    }

    console.warn(
      `No address found for coordinates: [${longitude}, ${latitude}]`,
    );
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
