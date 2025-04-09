import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Visitor from "@/models/Visitor";
import { getLocationFromIp } from "@/utils/geolocation";

/**
 * POST /api/v1/visitors/update-locations
 * Update location data for all visitors without location data
 * This is an admin-only endpoint
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Only allow this endpoint in development or with proper authentication
    // In production, you would add authentication middleware here
    if (process.env.NODE_ENV !== "development") {
      // Check for authentication
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }

      // Verify token logic would go here
      // const token = authHeader.split(" ")[1];
      // const isValid = verifyToken(token);
      // if (!isValid) {
      //     return NextResponse.json(
      //         { success: false, error: "Unauthorized" },
      //         { status: 401 }
      //     );
      // }
    }

    // Get all visitors without location data
    const visitors = await Visitor.find({
      ipAddress: { $exists: true, $ne: null },
      $or: [
        { location: { $exists: false } },
        { location: null },
        { "location.country": { $exists: false } },
        { "location.country": null },
      ],
    });

    // Process visitors in batches to avoid rate limits (45 requests per minute for IP-API)
    const batchSize = 40;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each visitor
    for (let i = 0; i < visitors.length; i += batchSize) {
      const batch = visitors.slice(i, i + batchSize);

      // Process each visitor in the batch
      const promises = batch.map(async (visitor) => {
        try {
          const ipAddress = visitor.ipAddress;

          if (!ipAddress || ipAddress === "unknown") {
            skippedCount++;
            return;
          }

          const locationData = await getLocationFromIp(ipAddress);

          if (locationData) {
            visitor.location = locationData;
            await visitor.save();
            updatedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error(`Error updating visitor ${visitor._id}:`, error);
          errorCount++;
        }
      });

      // Wait for all promises in the batch to resolve
      await Promise.all(promises);

      // If there are more batches to process, wait before continuing
      if (i + batchSize < visitors.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Visitor locations updated",
      stats: {
        total: visitors.length,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("Error updating visitor locations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update visitor locations" },
      { status: 500 },
    );
  }
}
