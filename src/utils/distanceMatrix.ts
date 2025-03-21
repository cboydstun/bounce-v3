import axios from "axios";

/**
 * Location interface for distance matrix calculation
 */
export interface Location {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Distance matrix response interface
 */
export interface DistanceMatrixResponse {
  distances: number[][];
  durations: number[][];
  destinations: { location: [number, number] }[];
  sources: { location: [number, number] }[];
}

/**
 * Calculates a distance matrix between multiple locations
 * @param locations Array of locations with coordinates
 * @returns Promise resolving to distance matrix response
 */
export async function getDistanceMatrix(
  locations: Location[],
): Promise<DistanceMatrixResponse> {
  try {
    // Extract just the coordinates for the API call
    const coordinates = locations.map((loc) => loc.coordinates);

    // Use our API route instead of calling OpenRouteService directly
    const response = await axios.post("/api/v1/matrix", {
      locations: coordinates,
    });

    return response.data;
  } catch (error) {
    console.error("Distance matrix error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("API response:", error.response.data);
    }
    throw new Error(
      `Distance matrix calculation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
