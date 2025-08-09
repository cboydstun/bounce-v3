import { TaskLocation } from "../types/task";

/**
 * Google Maps geocoding utility
 * Converts addresses to coordinates using Google Maps Geocoding API
 */

interface GoogleGeocodingResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
    };
    place_id: string;
    types: string[];
  }>;
}

/**
 * Geocode an address using Google Maps API and return TaskLocation format
 * @param address The address to geocode
 * @returns Promise resolving to TaskLocation or null if geocoding fails
 */
export async function geocodeAddressToTaskLocationGoogle(
  address: string,
): Promise<TaskLocation | null> {
  try {
    const coordinates = await geocodeAddressGoogle(address);
    return {
      type: "Point",
      coordinates,
    };
  } catch (error) {
    console.error(
      "Error geocoding address to TaskLocation with Google:",
      error,
    );
    return null;
  }
}

/**
 * Geocode an address using Google Maps API
 * @param address The address to geocode
 * @returns Promise resolving to [longitude, latitude] coordinates
 */
export async function geocodeAddressGoogle(
  address: string,
): Promise<[number, number]> {
  try {
    // Use our Google Maps API route
    const response = await fetch("/api/v1/google-geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      throw new Error(`Google geocoding failed: ${errorMessage}`);
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

    throw new Error(
      `Invalid coordinates received from Google for address: ${address}`,
    );
  } catch (error) {
    console.error("Error geocoding address with Google:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown Google geocoding error");
  }
}

/**
 * Enhanced geocoding function that tries Google Maps first, then falls back to OpenRouteService
 * @param address The address to geocode
 * @returns Promise resolving to [longitude, latitude] coordinates
 */
export async function geocodeAddressEnhanced(
  address: string,
): Promise<[number, number]> {
  try {
    // First try Google Maps geocoding
    console.log(`Attempting Google Maps geocoding for: ${address}`);
    const googleResult = await geocodeAddressGoogle(address);
    console.log(
      `Google Maps geocoding successful: [${googleResult[0]}, ${googleResult[1]}]`,
    );
    return googleResult;
  } catch (googleError) {
    console.warn(`Google Maps geocoding failed for "${address}":`, googleError);

    try {
      // Fallback to OpenRouteService
      console.log(`Falling back to OpenRouteService geocoding for: ${address}`);
      const { geocodeAddress } = await import("./geocoding");
      const openRouteResult = await geocodeAddress(address);
      console.log(
        `OpenRouteService geocoding successful: [${openRouteResult[0]}, ${openRouteResult[1]}]`,
      );
      return openRouteResult;
    } catch (openRouteError) {
      console.error(
        `Both Google Maps and OpenRouteService geocoding failed for "${address}"`,
      );
      console.error("Google error:", googleError);
      console.error("OpenRoute error:", openRouteError);
      throw new Error(
        `Failed to geocode address "${address}" with both services`,
      );
    }
  }
}

/**
 * Reverse geocode coordinates to get an address using Google Maps API
 * @param longitude Longitude coordinate
 * @param latitude Latitude coordinate
 * @returns Promise resolving to address string or null if reverse geocoding fails
 */
export async function reverseGeocodeGoogle(
  longitude: number,
  latitude: number,
): Promise<string | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error(
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set",
      );
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `Google Maps reverse geocoding API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    console.warn(
      `No address found for coordinates: [${longitude}, ${latitude}]`,
    );
    return null;
  } catch (error) {
    console.error("Error reverse geocoding coordinates with Google:", error);
    return null;
  }
}

/**
 * Validate if coordinates are within San Antonio bounds
 * @param longitude Longitude to validate
 * @param latitude Latitude to validate
 * @returns True if coordinates are within San Antonio area
 */
export function validateSanAntonioCoordinates(
  longitude: number,
  latitude: number,
): boolean {
  const sanAntonioBounds = {
    min_lon: -98.8,
    max_lon: -98.2,
    min_lat: 29.2,
    max_lat: 29.7,
  };

  return (
    longitude >= sanAntonioBounds.min_lon &&
    longitude <= sanAntonioBounds.max_lon &&
    latitude >= sanAntonioBounds.min_lat &&
    latitude <= sanAntonioBounds.max_lat
  );
}
