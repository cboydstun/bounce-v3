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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { keywordId, searchDepth } = await req.json();

    if (!keywordId) {
      return NextResponse.json(
        { message: "Keyword ID is required" },
        { status: 400 },
      );
    }

    const keyword = await SearchKeyword.findById(keywordId);

    if (!keyword) {
      return NextResponse.json(
        { message: "Keyword not found" },
        { status: 404 },
      );
    }

    const targetDomain = process.env.TARGET_DOMAIN;

    if (!targetDomain) {
      return NextResponse.json(
        { message: "TARGET_DOMAIN environment variable is not set" },
        { status: 500 },
      );
    }

    const result = await checkKeywordRanking(
      keyword.keyword,
      targetDomain,
      searchDepth,
    );

    // Ensure we have a valid URL even if the site wasn't found in search results
    let rankingUrl = result.url;
    if (!rankingUrl) {
      // Create a default URL using the target domain
      rankingUrl = targetDomain.startsWith("http")
        ? targetDomain
        : `https://${targetDomain}`;
    }

    const rankingData = {
      keywordId: keyword._id,
      keyword: keyword.keyword,
      date: new Date(),
      position: result.position,
      url: rankingUrl,
      competitors: result.competitors,
      // Store enhanced metadata for future analysis
      metadata: {
        totalResults: result.metadata.totalResults,
        searchTime: result.metadata.searchTime,
        resultCount: result.metadata.resultCount,
        isValidationPassed: result.metadata.isValidationPassed,
        validationWarnings: result.metadata.validationWarnings,
        apiCallsUsed: result.metadata.apiCallsUsed,
        searchDepth: result.metadata.searchDepth,
        maxPositionSearched: result.metadata.maxPositionSearched,
      },
    };

    const newRanking = await SearchRanking.create(rankingData);

    // Return ranking with validation status
    return NextResponse.json({
      ranking: newRanking,
      validation: {
        isValid: result.metadata.isValidationPassed,
        warnings: result.metadata.validationWarnings,
      },
    });
  } catch (error) {
    console.error("Error checking keyword ranking:", error);
    return NextResponse.json(
      { message: "Failed to check keyword ranking" },
      { status: 500 },
    );
  }
}
