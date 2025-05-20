import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    const response = await axios.get(
      "https://api.openrouteservice.org/geocode/search",
      {
        params: {
          text: address,
          // San Antonio bounding box
          "boundary.rect.min_lon": -98.7,
          "boundary.rect.min_lat": 29.2,
          "boundary.rect.max_lon": -98.2,
          "boundary.rect.max_lat": 29.8,
          // San Antonio center point for focusing results
          "focus.point.lon": -98.4936,
          "focus.point.lat": 29.4241,
          // Restrict to USA
          "boundary.country": "USA",
          // Limit to 5 results
          size: 5,
        },
        headers: { Authorization: apiKey },
      },
    );

    // Additional validation - if no results found
    if (!response.data.features || response.data.features.length === 0) {
      return NextResponse.json(
        { error: "No locations found in San Antonio area" },
        { status: 404 },
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 },
    );
  }
}
