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

    // Add geographic bounds for San Antonio/Bexar County area to prevent geocoding to wrong locations
    const sanAntonioBounds = {
      min_lon: -98.8, // West boundary
      max_lon: -98.2, // East boundary
      min_lat: 29.2, // South boundary
      max_lat: 29.7, // North boundary
    };

    const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodedAddress}&size=5&boundary.rect.min_lon=${sanAntonioBounds.min_lon}&boundary.rect.max_lon=${sanAntonioBounds.max_lon}&boundary.rect.min_lat=${sanAntonioBounds.min_lat}&boundary.rect.max_lat=${sanAntonioBounds.max_lat}&focus.point.lon=-98.4936&focus.point.lat=29.4241`;

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
      // Log all results for debugging
      console.log(
        `Geocoding results for "${address}":`,
        data.features.map((f: any) => ({
          label: f.properties.label,
          coordinates: f.geometry.coordinates,
          confidence: f.properties.confidence,
        })),
      );

      const feature = data.features[0];
      const [longitude, latitude] = feature.geometry.coordinates;

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
          min_lon: -98.8,
          max_lon: -98.2,
          min_lat: 29.2,
          max_lat: 29.7,
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
          for (let i = 1; i < data.features.length; i++) {
            const altFeature = data.features[i];
            const [altLon, altLat] = altFeature.geometry.coordinates;

            const altIsWithinSanAntonio =
              altLon >= sanAntonioBounds.min_lon &&
              altLon <= sanAntonioBounds.max_lon &&
              altLat >= sanAntonioBounds.min_lat &&
              altLat <= sanAntonioBounds.max_lat;

            if (altIsWithinSanAntonio) {
              console.log(
                `Using alternative result within San Antonio bounds: [${altLon}, ${altLat}]`,
              );
              return NextResponse.json({
                coordinates: [altLon, altLat],
                label: altFeature.properties.label,
                confidence: altFeature.properties.confidence,
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
          `Successfully geocoded "${address}" to [${longitude}, ${latitude}] within San Antonio bounds`,
        );

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
