import { NextRequest, NextResponse } from "next/server";
import { SearchRanking } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/v1/search-rankings/history
 * Get ranking history for keywords
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const keywordId = url.searchParams.get("keywordId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    let query: any = {};

    if (keywordId) {
      query.keywordId = keywordId;
    }

    if (startDate && endDate) {
      // Handle both date strings (YYYY-MM-DD) and full timestamps
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      console.log(`📅 Date parsing:`);
      console.log(`   Start: ${startDate} -> ${startDateTime.toISOString()}`);
      console.log(`   End: ${endDate} -> ${endDateTime.toISOString()}`);

      query.date = {
        $gte: startDateTime,
        $lte: endDateTime,
      };
    }

    console.log(`🔍 Fetching rankings from database with query:`, query);

    // First, let's check if there are ANY rankings for this keyword (ignoring date)
    const allRankingsForKeyword = await SearchRanking.find({
      keywordId: query.keywordId,
    })
      .sort({ date: -1 })
      .limit(5);

    console.log(
      `📊 Total rankings for this keyword (any date): ${allRankingsForKeyword.length}`,
    );
    if (allRankingsForKeyword.length > 0) {
      console.log(`📅 All rankings for keyword:`);
      allRankingsForKeyword.forEach((ranking, index) => {
        console.log(
          `   ${index + 1}. Date: ${ranking.date}, Position: ${ranking.position}`,
        );
      });
    }

    // Now check ALL rankings in the database
    const totalRankings = await SearchRanking.countDocuments({});
    console.log(`🗄️ Total rankings in entire database: ${totalRankings}`);

    // Now run the original query
    const rankings = await SearchRanking.find(query)
      .sort({ date: -1 })
      .populate("keywordId", "keyword");

    console.log(
      `📊 Found ${rankings.length} rankings in database for date range`,
    );
    if (rankings.length > 0) {
      console.log(`📅 Latest ranking date: ${rankings[0].date}`);
      console.log(`🎯 Latest position: ${rankings[0].position}`);
    } else {
      console.log(
        `⚠️ No rankings found in date range: ${query.date?.$gte} to ${query.date?.$lte}`,
      );
    }

    return NextResponse.json({ rankings });
  } catch (error) {
    console.error("Error fetching ranking history:", error);
    return NextResponse.json(
      { message: "Failed to fetch ranking history" },
      { status: 500 },
    );
  }
}
