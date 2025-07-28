import { NextRequest, NextResponse } from "next/server";
import { getBatchStatus } from "@/utils/batchProcessor";
import dbConnect from "@/lib/db/mongoose";
import { getToken } from "next-auth/jwt";

/**
 * GET /api/v1/search-rankings/batch-status
 * Get the current status of ranking batch processing
 * Requires admin authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication - admin only
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });

    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    // Connect to the database
    await dbConnect();

    // Get batch status
    const status = await getBatchStatus();

    return NextResponse.json({
      message: "Batch status retrieved successfully",
      timestamp: new Date().toISOString(),
      status,
    });
  } catch (error) {
    console.error("❌ Error getting batch status:", error);

    return NextResponse.json(
      {
        message: "Failed to get batch status",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
