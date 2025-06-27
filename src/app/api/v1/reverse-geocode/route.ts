import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { longitude, latitude } = body;

    if (typeof longitude !== "number" || typeof latitude !== "number") {
      return NextResponse.json(
        { error: "Longitude and latitude numbers are required" },
        { status: 400 },
      );
    }

    // Validate coordinate ranges
    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return NextResponse.json(
        { error: `Invalid coordinates: [${longitude}, ${latitude}]` },
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

    console.log(
      `Making reverse geocoding request for coordinates: [${longitude}, ${latitude}]`,
    );

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
        { error: `Reverse geocoding API error: ${response.status}` },
        { status: 500 },
      );
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return NextResponse.json({
        address: feature.properties.label,
        confidence: feature.properties.confidence,
      });
    }

    console.warn(
      `No address found for coordinates: [${longitude}, ${latitude}]`,
    );
    return NextResponse.json(
      {
        error: `No address found for coordinates: [${longitude}, ${latitude}]`,
      },
      { status: 404 },
    );
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to reverse geocode coordinates" },
      { status: 500 },
    );
  }
}
