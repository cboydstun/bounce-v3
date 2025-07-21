import { NextResponse } from "next/server";
import SearchRanking from "@/models/SearchRanking";
import dbConnect from "@/lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/v1/search-rankings/latest
 * Get the latest ranking date for each keyword
 */
export async function GET() {
  try {
    await dbConnect();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Use the existing findLatestRankings method to get the most recent ranking for each keyword
    const latestRankings = await SearchRanking.findLatestRankings();

    // Create a map of keywordId -> most recent ranking date
    const lastRankingDates: Record<string, string> = {};
    latestRankings.forEach((ranking) => {
      lastRankingDates[ranking.keywordId.toString()] =
        ranking.date.toISOString();
    });

    console.log(
      `📅 Found latest rankings for ${latestRankings.length} keywords`,
    );

    return NextResponse.json({
      lastRankingDates,
      count: latestRankings.length,
    });
  } catch (error) {
    console.error("Error fetching latest rankings:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest rankings" },
      { status: 500 },
    );
  }
}
