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

    // Log validation results for debugging
    if (!result.metadata.isValidationPassed) {
      console.log(`⚠️ Validation failed for keyword "${keyword.keyword}":`);
      result.metadata.validationWarnings.forEach((warning) =>
        console.log(`   - ${warning}`),
      );
    }

    // Ensure we have a valid URL even if the site wasn't found in search results
    let rankingUrl = result.url;
    if (!rankingUrl) {
      // Create a default URL using the target domain
      rankingUrl = targetDomain.startsWith("http")
        ? targetDomain
        : `https://${targetDomain}`;
    }

    // Save the ranking result with enhanced metadata
    console.log(
      `💾 Saving ranking to database for keyword "${keyword.keyword}"`,
    );
    console.log(`📊 Position: ${result.position}, URL: ${rankingUrl}`);
    console.log(`🔑 Keyword ID: ${keyword._id}`);
    console.log(`📅 Current date: ${new Date().toISOString()}`);

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

    console.log(
      `📋 Ranking data to save:`,
      JSON.stringify(rankingData, null, 2),
    );

    const newRanking = await SearchRanking.create(rankingData);

    console.log(`✅ Successfully saved ranking with ID: ${newRanking._id}`);
    console.log(`📅 Saved at: ${newRanking.date}`);
    console.log(
      `🔍 Saved ranking object:`,
      JSON.stringify(newRanking.toObject(), null, 2),
    );

    // Verify the ranking was actually saved by querying it back
    const verifyRanking = await SearchRanking.findById(newRanking._id);
    if (verifyRanking) {
      console.log(
        `✅ Verification: Ranking successfully retrieved from database`,
      );
    } else {
      console.log(`❌ Verification: Failed to retrieve ranking from database`);
    }

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
