import { NextRequest, NextResponse } from "next/server";
import { SearchKeyword } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { diagnoseCseConfiguration } from "@/utils/googleSearchApi";

/**
 * POST /api/v1/search-rankings/validate
 * Diagnose CSE configuration issues
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const targetDomain = process.env.TARGET_DOMAIN;

    if (!targetDomain) {
      return NextResponse.json(
        { message: "TARGET_DOMAIN environment variable is not set" },
        { status: 500 },
      );
    }

    // Get test keywords from request body or use default test keywords
    const { testKeywords } = await req.json();

    let keywordsToTest: string[] = testKeywords || [];

    // If no test keywords provided, use some from the database or defaults
    if (keywordsToTest.length === 0) {
      const existingKeywords = await SearchKeyword.find({ isActive: true })
        .limit(3)
        .select("keyword");

      if (existingKeywords.length > 0) {
        keywordsToTest = existingKeywords.map((k) => k.keyword);
      } else {
        // Use generic test keywords if no keywords exist in database
        keywordsToTest = [
          "bounce house rental",
          "party rental services",
          "inflatable rentals",
        ];
      }
    }

    console.log(
      `🔬 Starting CSE validation with keywords: ${keywordsToTest.join(", ")}`,
    );

    const diagnosticResult = await diagnoseCseConfiguration(
      keywordsToTest,
      targetDomain,
    );

    // Log the diagnostic results
    console.log(`🔬 CSE Diagnostic Results:`);
    console.log(
      `   Health Status: ${diagnosticResult.isHealthy ? "HEALTHY" : "ISSUES DETECTED"}`,
    );
    console.log(`   Issues Found: ${diagnosticResult.issues.length}`);
    console.log(
      `   Recommendations: ${diagnosticResult.recommendations.length}`,
    );

    return NextResponse.json({
      success: true,
      diagnostic: diagnosticResult,
      testedKeywords: keywordsToTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error validating CSE configuration:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to validate CSE configuration",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/v1/search-rankings/validate
 * Get validation status and recommendations
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Return CSE configuration guidance
    const guidance = {
      checklistItems: [
        {
          id: "cse_web_search",
          title: "Verify 'Search the entire web' is enabled",
          description:
            "In Google Programmable Search Engine, ensure 'Search the entire web' option is selected",
          priority: "high",
        },
        {
          id: "cse_site_restrictions",
          title: "Remove site restrictions",
          description:
            "Check 'Sites to search' section and remove any specific site restrictions",
          priority: "high",
        },
        {
          id: "api_quotas",
          title: "Check API quotas",
          description:
            "Verify Google Custom Search API quotas are not exceeded",
          priority: "medium",
        },
        {
          id: "test_keywords",
          title: "Test with diverse keywords",
          description:
            "Run validation with keywords that should have diverse results",
          priority: "medium",
        },
      ],
      commonIssues: [
        {
          issue: "Target domain consistently ranks #1-2",
          cause: "CSE is likely restricted to specific sites",
          solution: "Enable 'Search the entire web' in CSE settings",
        },
        {
          issue: "Low competitor diversity",
          cause: "CSE may be searching limited domains",
          solution: "Remove site restrictions in CSE configuration",
        },
        {
          issue: "All results from target domain",
          cause: "CSE is restricted to target domain only",
          solution: "Reconfigure CSE to search entire web",
        },
      ],
      cseConfigurationSteps: [
        "Go to Google Programmable Search Engine (https://cse.google.com/)",
        "Select your search engine",
        "Click 'Setup' in the left sidebar",
        "In 'Sites to search' section, select 'Search the entire web'",
        "Remove any specific sites from the list",
        "Save changes and test",
      ],
    };

    return NextResponse.json({
      success: true,
      guidance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting validation guidance:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get validation guidance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
