import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import SearchRanking from "@/models/SearchRanking";
import { SearchKeyword } from "@/models";
import { getToken } from "next-auth/jwt";

/**
 * GET /api/v1/search-rankings/current-positions
 * Get the current (latest) ranking positions for active keywords only
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

    // Get all active keywords first
    const activeKeywords = await SearchKeyword.findActiveKeywords();
    const activeKeywordIds = activeKeywords.map((k) => k._id?.toString() || "");

    console.log(`📋 Found ${activeKeywords.length} active keywords`);

    // Get the latest ranking for each keyword using the existing static method
    const latestRankings = await SearchRanking.findLatestRankings();

    // Transform into keywordId -> position mapping, but only for active keywords
    const positions: Record<string, number> = {};

    latestRankings.forEach((ranking) => {
      if (ranking.keywordId && ranking.position) {
        const keywordIdStr = ranking.keywordId.toString();
        // Only include positions for active keywords
        if (activeKeywordIds.includes(keywordIdStr)) {
          positions[keywordIdStr] = ranking.position;
        }
      }
    });

    console.log(
      `📊 Fetched current positions for ${Object.keys(positions).length} active keywords (filtered from ${latestRankings.length} total rankings)`,
    );

    return NextResponse.json({
      success: true,
      positions,
      count: Object.keys(positions).length,
      totalRankings: latestRankings.length,
      activeKeywords: activeKeywords.length,
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
