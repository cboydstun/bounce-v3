/**
 * Checks availability for multiple products on a specific date
 * @param products Array of product objects to check
 * @param date Date string in YYYY-MM-DD format
 * @returns Object mapping product IDs to availability results
 */
export const checkAvailabilityForProducts = async (
  products: Array<{ _id: string; name: string }>,
  date: string,
): Promise<Record<string, { available: boolean; reason?: string }>> => {
  try {
    // Extract product IDs
    const productIds = products.map((product) => product._id);

    // Make a single API call to the batch endpoint
    const response = await fetch("/api/v1/products/batch-availability", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productIds,
        date,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to check availability");
    }

    // Parse the response
    const data = await response.json();

    // Format the results to match the expected return type
    const results: Record<string, { available: boolean; reason?: string }> = {};

    // Process each product result
    Object.keys(data).forEach((productId) => {
      results[productId] = {
        available: data[productId].available,
        reason: data[productId].reason,
      };
    });

    return results;
  } catch (error) {
    console.error("Error checking product availability:", error);
    throw error;
  }
};
