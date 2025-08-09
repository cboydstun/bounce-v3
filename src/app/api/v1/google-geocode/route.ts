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

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error(
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set",
      );
      return NextResponse.json(
        { error: "Google Maps API configuration error" },
        { status: 500 },
      );
    }

    console.log(`Making Google Maps geocoding request for address: ${address}`);

    const encodedAddress = encodeURIComponent(address);

    // Use Google Maps Geocoding API with bias towards San Antonio area
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&bounds=29.2,-98.8|29.7,-98.2&region=us&key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `Google Maps Geocoding API error: ${response.status} ${response.statusText}`,
      );

      if (response.status === 403) {
        return NextResponse.json(
          { error: "Google Maps API quota exceeded or access denied" },
          { status: 500 },
        );
      } else if (response.status === 400) {
        return NextResponse.json(
          { error: "Invalid request to Google Maps API" },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: `Google Maps API error: ${response.status}` },
        { status: 500 },
      );
    }

    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      // Log all results for debugging
      console.log(
        `Google Maps geocoding results for "${address}":`,
        data.results.map((result: any) => ({
          formatted_address: result.formatted_address,
          coordinates: [
            result.geometry.location.lng,
            result.geometry.location.lat,
          ],
          location_type: result.geometry.location_type,
          types: result.types,
        })),
      );

      const result = data.results[0];
      const longitude = result.geometry.location.lng;
      const latitude = result.geometry.location.lat;

      // Validate coordinates are within valid ranges
      if (
        typeof longitude === "number" &&
        typeof latitude === "number" &&
        longitude >= -180 &&
        longitude <= 180 &&
        latitude >= -90 &&
        latitude <= 90
      ) {
        // Additional validation: Check if coordinates are within San Antonio bounds
        const sanAntonioBounds = {
          min_lon: -99, // Slightly expanded west
          max_lon: -98, // Slightly expanded east
          min_lat: 29, // Slightly expanded south
          max_lat: 30, // Expanded north to include 78260 area
        };

        const isWithinSanAntonio =
          longitude >= sanAntonioBounds.min_lon &&
          longitude <= sanAntonioBounds.max_lon &&
          latitude >= sanAntonioBounds.min_lat &&
          latitude <= sanAntonioBounds.max_lat;

        if (!isWithinSanAntonio) {
          console.warn(
            `Address "${address}" geocoded outside San Antonio bounds: [${longitude}, ${latitude}]`,
          );
          console.warn(
            `Expected bounds: lon ${sanAntonioBounds.min_lon} to ${sanAntonioBounds.max_lon}, lat ${sanAntonioBounds.min_lat} to ${sanAntonioBounds.max_lat}`,
          );

          // Try to find a result within bounds from the other results
          for (let i = 1; i < data.results.length; i++) {
            const altResult = data.results[i];
            const altLon = altResult.geometry.location.lng;
            const altLat = altResult.geometry.location.lat;

            const altIsWithinSanAntonio =
              altLon >= sanAntonioBounds.min_lon &&
              altLon <= sanAntonioBounds.max_lon &&
              altLat >= sanAntonioBounds.min_lat &&
              altLat <= sanAntonioBounds.max_lat;

            if (altIsWithinSanAntonio) {
              console.log(
                `Using alternative Google Maps result within San Antonio bounds: [${altLon}, ${altLat}]`,
              );
              return NextResponse.json({
                coordinates: [altLon, altLat],
                formatted_address: altResult.formatted_address,
                location_type: altResult.geometry.location_type,
                place_id: altResult.place_id,
              });
            }
          }

          return NextResponse.json(
            {
              error: `Address "${address}" could not be found within San Antonio area. Please verify the address is in San Antonio, TX.`,
            },
            { status: 404 },
          );
        }

        console.log(
          `Successfully geocoded "${address}" to [${longitude}, ${latitude}] within San Antonio bounds using Google Maps`,
        );

        return NextResponse.json({
          coordinates: [longitude, latitude],
          formatted_address: result.formatted_address,
          location_type: result.geometry.location_type,
          place_id: result.place_id,
        });
      }
    } else if (data.status === "ZERO_RESULTS") {
      console.warn(`No results found for address: ${address}`);
      return NextResponse.json(
        { error: `Could not find address: ${address}` },
        { status: 404 },
      );
    } else if (data.status === "OVER_QUERY_LIMIT") {
      console.error("Google Maps API quota exceeded");
      return NextResponse.json(
        { error: "Geocoding service temporarily unavailable" },
        { status: 503 },
      );
    } else {
      console.error(`Google Maps API returned status: ${data.status}`);
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status}` },
        { status: 500 },
      );
    }

    console.warn(`No valid coordinates found for address: ${address}`);
    return NextResponse.json(
      { error: `Could not geocode address: ${address}` },
      { status: 404 },
    );
  } catch (error) {
    console.error("Google Maps geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 },
    );
  }
}
