import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coordinates } = body;

    if (!coordinates || !Array.isArray(coordinates)) {
      return NextResponse.json(
        { error: "Coordinates array is required" },
        { status: 400 },
      );
    }

    // Validate coordinates array
    if (coordinates.length < 2) {
      return NextResponse.json(
        { error: "At least 2 coordinates are required for directions" },
        { status: 400 },
      );
    }

    // Validate coordinate format
    for (let i = 0; i < coordinates.length; i++) {
      const coordinate = coordinates[i];
      if (!Array.isArray(coordinate) || coordinate.length !== 2) {
        return NextResponse.json(
          {
            error: `Invalid coordinate format at index ${i}. Expected [longitude, latitude]`,
          },
          { status: 400 },
        );
      }
      const [lng, lat] = coordinate;
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

    console.log(
      `Making directions request for ${coordinates.length} coordinates`,
    );

    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      { coordinates },
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Route geometry error:", error);

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
      { error: "Failed to get route geometry" },
      { status: 500 },
    );
  }
}
