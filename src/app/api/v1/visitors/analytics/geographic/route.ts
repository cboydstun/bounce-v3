import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db/mongoose";
import { getGeographicInsights } from "@/utils/optimizedVisitorAnalytics";

/**
 * GET /api/v1/visitors/analytics/geographic
 * Get geographic insights for visitors
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

    const insights = await getGeographicInsights(dateRange);

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("Error fetching geographic insights:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch geographic insights" },
      { status: 500 },
    );
  }
}
