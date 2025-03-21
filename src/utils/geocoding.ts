import axios from "axios";

/**
 * Converts an address string to geographic coordinates [longitude, latitude]
 * @param address The address to geocode
 * @returns Promise resolving to [longitude, latitude] coordinates
 */
export async function geocodeAddress(
  address: string,
): Promise<[number, number]> {
  try {
    // Use our API route instead of calling OpenRouteService directly
    const response = await axios.get(
      `/api/v1/geocode?address=${encodeURIComponent(address)}`,
    );

    if (response.data.features && response.data.features.length > 0) {
      // Return [longitude, latitude]
      const coordinates = response.data.features[0].geometry.coordinates;

      // Log the result for debugging
      console.log(`Geocoded "${address}" to coordinates:`, coordinates);

      return coordinates;
    }

    throw new Error(
      `Could not find "${address}" in the San Antonio area. Please check the address and try again.`,
    );
  } catch (error) {
    console.error("Geocoding error:", error);

    // Provide more specific error messages based on the error type
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(
          `Address "${address}" not found in San Antonio area. Please verify the address.`,
        );
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid address format: ${address}`);
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Geocoding service timed out. Please try again later.");
      }
    }

    throw new Error(
      `Geocoding failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
