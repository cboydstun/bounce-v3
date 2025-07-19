import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db/mongoose";
import { getLandingPagePerformance } from "@/utils/optimizedVisitorAnalytics";

/**
 * GET /api/v1/visitors/analytics/landing-pages
 * Get landing page performance metrics
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

    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const landingPages = await getLandingPagePerformance(limit, dateRange);

    return NextResponse.json({
      success: true,
      data: landingPages,
    });
  } catch (error) {
    console.error("Error fetching landing page performance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch landing page performance" },
      { status: 500 },
    );
  }
}
