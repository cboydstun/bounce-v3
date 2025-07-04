import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Address string is required" },
        { status: 400 },
      );
    }

    if (address.trim().length === 0) {
      return NextResponse.json(
        { error: "Address cannot be empty" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTESERVICE_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 },
      );
    }

    console.log(`Making geocoding request for address: ${address}`);

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

      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key for OpenRouteService" },
          { status: 500 },
        );
      } else if (response.status === 403) {
        return NextResponse.json(
          { error: "API quota exceeded or access denied" },
          { status: 500 },
        );
      } else if (response.status === 500) {
        return NextResponse.json(
          { error: "OpenRouteService server error" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: `Geocoding API error: ${response.status}` },
        { status: 500 },
      );
    }

    const data = await response.json();

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
        return NextResponse.json({
          coordinates: [longitude, latitude],
          label: feature.properties.label,
          confidence: feature.properties.confidence,
        });
      }
    }

    console.warn(`No valid coordinates found for address: ${address}`);
    return NextResponse.json(
      { error: `Could not geocode address: ${address}` },
      { status: 404 },
    );
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 },
    );
  }
}
