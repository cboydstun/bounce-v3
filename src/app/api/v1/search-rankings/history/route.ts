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
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const rankings = await SearchRanking.find(query)
      .sort({ date: -1 })
      .populate("keywordId", "keyword");

    return NextResponse.json({ rankings });
  } catch (error) {
    console.error("Error fetching ranking history:", error);
    return NextResponse.json(
      { message: "Failed to fetch ranking history" },
      { status: 500 },
    );
  }
}
