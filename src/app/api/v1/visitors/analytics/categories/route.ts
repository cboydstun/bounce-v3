import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db/mongoose";
import { getPageCategoryPerformance } from "@/utils/optimizedVisitorAnalytics";

/**
 * GET /api/v1/visitors/analytics/categories
 * Get page category performance metrics
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Parse query parameters for date range
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const categories = await getPageCategoryPerformance(dateRange);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching page category performance:", error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Return more detailed error for debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch page category performance",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
