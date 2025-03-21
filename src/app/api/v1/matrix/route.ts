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

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
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
    return NextResponse.json(
      { error: "Failed to calculate distance matrix" },
      { status: 500 },
    );
  }
}
