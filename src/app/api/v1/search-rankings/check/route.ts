import { NextRequest, NextResponse } from "next/server";
import { SearchKeyword, SearchRanking } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkKeywordRanking } from "@/utils/googleSearchApi";

/**
 * POST /api/v1/search-rankings/check
 * Manually check ranking for a keyword
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { keywordId } = await req.json();
    
    if (!keywordId) {
      return NextResponse.json(
        { message: "Keyword ID is required" },
        { status: 400 }
      );
    }

    const keyword = await SearchKeyword.findById(keywordId);
    
    if (!keyword) {
      return NextResponse.json(
        { message: "Keyword not found" },
        { status: 404 }
      );
    }

    const targetDomain = process.env.TARGET_DOMAIN;
    
    if (!targetDomain) {
      return NextResponse.json(
        { message: "TARGET_DOMAIN environment variable is not set" },
        { status: 500 }
      );
    }

    const result = await checkKeywordRanking(keyword.keyword, targetDomain);
    
    // Save the ranking result
    const newRanking = await SearchRanking.create({
      keywordId: keyword._id,
      keyword: keyword.keyword,
      date: new Date(),
      position: result.position,
      url: result.url,
      competitors: result.competitors,
    });
    
    return NextResponse.json({ ranking: newRanking });
  } catch (error) {
    console.error("Error checking keyword ranking:", error);
    return NextResponse.json(
      { message: "Failed to check keyword ranking" },
      { status: 500 }
    );
  }
}
