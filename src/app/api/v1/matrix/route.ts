import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locations } = body;

    if (!locations || !Array.isArray(locations)) {
      return NextResponse.json(
        { error: "Locations array is required" },
        { status: 400 },
      );
    }

    // Validate locations array
    if (locations.length === 0) {
      return NextResponse.json(
        { error: "At least one location is required" },
        { status: 400 },
      );
    }

    // Check for matrix size limits (OpenRouteService typically allows up to 50x50)
    if (locations.length > 50) {
      return NextResponse.json(
        { error: "Too many locations. Maximum 50 locations allowed." },
        { status: 400 },
      );
    }

    // Validate coordinate format
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      if (!Array.isArray(location) || location.length !== 2) {
        return NextResponse.json(
          {
            error: `Invalid location format at index ${i}. Expected [longitude, latitude]`,
          },
          { status: 400 },
        );
      }
      const [lng, lat] = location;
      if (
        typeof lng !== "number" ||
        typeof lat !== "number" ||
        lng < -180 ||
        lng > 180 ||
        lat < -90 ||
        lat > 90
      ) {
        return NextResponse.json(
          { error: `Invalid coordinates at index ${i}: [${lng}, ${lat}]` },
          { status: 400 },
        );
      }
    }

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTESERVICE_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 },
      );
    }

    console.log(`Making matrix request for ${locations.length} locations`);

    const response = await axios.post(
      "https://api.openrouteservice.org/v2/matrix/driving-car",
      {
        locations,
        metrics: ["distance", "duration"],
      },
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Distance matrix error:", error);

    if (axios.isAxiosError(error)) {
      console.error("API response status:", error.response?.status);
      console.error("API response data:", error.response?.data);

      // Return more specific error information
      if (error.response?.status === 400) {
        return NextResponse.json(
          {
            error: "Invalid request to OpenRouteService API",
            details: error.response.data,
          },
          { status: 400 },
        );
      } else if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key for OpenRouteService" },
          { status: 500 },
        );
      } else if (error.response?.status === 403) {
        return NextResponse.json(
          { error: "API quota exceeded or access denied" },
          { status: 500 },
        );
      } else if (error.response?.status === 500) {
        return NextResponse.json(
          { error: "OpenRouteService server error" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to calculate distance matrix" },
      { status: 500 },
    );
  }
}
