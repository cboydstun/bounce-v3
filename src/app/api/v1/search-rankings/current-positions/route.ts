import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import SearchRanking from "@/models/SearchRanking";
import { getToken } from "next-auth/jwt";

/**
 * GET /api/v1/search-rankings/current-positions
 * Get the current (latest) ranking positions for all keywords
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });

    if (!token || token.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Get the latest ranking for each keyword using the existing static method
    const latestRankings = await SearchRanking.findLatestRankings();

    // Transform into keywordId -> position mapping
    const positions: Record<string, number> = {};

    latestRankings.forEach((ranking) => {
      if (ranking.keywordId && ranking.position) {
        positions[ranking.keywordId.toString()] = ranking.position;
      }
    });

    console.log(
      `📊 Fetched current positions for ${Object.keys(positions).length} keywords`,
    );

    return NextResponse.json({
      success: true,
      positions,
      count: Object.keys(positions).length,
    });
  } catch (error) {
    console.error("❌ Error fetching current positions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch current positions",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
