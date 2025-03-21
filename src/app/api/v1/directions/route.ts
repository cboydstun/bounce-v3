import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { coordinates } = body;

        if (!coordinates || !Array.isArray(coordinates)) {
            return NextResponse.json(
                { error: "Coordinates array is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENROUTESERVICE_API_KEY;
        const response = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
            { coordinates },
            {
                headers: {
                    Authorization: apiKey,
                    "Content-Type": "application/json"
                }
            }
        );

        return NextResponse.json(response.data);
    } catch (error) {
        console.error("Route geometry error:", error);
        return NextResponse.json(
            { error: "Failed to get route geometry" },
            { status: 500 }
        );
    }
}
