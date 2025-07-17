import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateSEOInsights } from "@/utils/claudeService";
import { AIAnalysisRequest } from "@/types/aiInsights";
import { AIInsight, AIInsightSession } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import {
  generateReportCardHash,
  shouldGenerateNewInsights,
} from "@/utils/hashUtils";
import { IAIInsightSessionDocument } from "@/models/AIInsightSession";

/**
 * Transform MongoDB insight document to frontend format
 */
function transformInsight(insight: any) {
  return {
    id: insight._id.toString(),
    type: insight.type,
    priority: insight.priority,
    title: insight.title,
    message: insight.message,
    affectedKeywords: insight.affectedKeywords,
    actionItems: insight.actionItems,
    confidenceScore: insight.confidenceScore,
    generatedAt: insight.generatedAt,
    category: insight.category,
    status: insight.status,
    notes: insight.notes,
    sessionId: insight.sessionId?.toString(),
    completedAt: insight.completedAt,
    dismissedAt: insight.dismissedAt,
    completedBy: insight.completedBy?.toString(),
    dismissedBy: insight.dismissedBy?.toString(),
  };
}

// Allow up to 60 seconds for Claude API calls to prevent Vercel timeout
export const maxDuration = 60;

/**
 * POST /api/v1/search-rankings/ai-insights
 * Generate and persist AI-powered SEO insights from report card data
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      reportCard,
      analysisType = "insights",
      focusAreas,
      forceRegenerate = false,
    } = body;

    if (!reportCard) {
      return NextResponse.json(
        { message: "Report card data is required" },
        { status: 400 },
      );
    }

    // Validate analysis type
    const validAnalysisTypes = [
      "insights",
      "summary",
      "competitive",
      "predictive",
      "anomalies",
    ];
    if (!validAnalysisTypes.includes(analysisType)) {
      return NextResponse.json(
        { message: "Invalid analysis type" },
        { status: 400 },
      );
    }

    const startTime = Date.now();
    const sourceDataHash = generateReportCardHash(reportCard);

    // Check for existing session with same data hash
    if (!forceRegenerate) {
      const existingSession = (await AIInsightSession.findActiveSession(
        sourceDataHash,
      )) as IAIInsightSessionDocument | null;

      if (existingSession) {
        // Return existing insights
        const existingInsights = await AIInsight.findBySession(
          (existingSession as any)._id.toString(),
        );

        return NextResponse.json({
          success: true,
          insights: existingInsights.map(transformInsight),
          summary: existingSession.executiveSummary,
          generatedAt: existingSession.generatedAt,
          analysisType: analysisType,
          cached: true,
          sessionId: (existingSession as any)._id.toString(),
        });
      }
    }

    // Generate new insights using Claude
    const analysisRequest: AIAnalysisRequest = {
      reportCard,
      analysisType,
      focusAreas,
    };

    const aiResponse = await generateSEOInsights(analysisRequest);
    const generationTime = Date.now() - startTime;

    // Create new insight session
    const newSession = await AIInsightSession.create({
      reportCardSnapshot: reportCard,
      period: reportCard.period,
      totalInsights: aiResponse.insights.length,
      insightIds: [], // Will be populated after creating insights
      executiveSummary: aiResponse.executiveSummary,
      status: "active",
      generatedAt: new Date(),
      sourceDataHash,
      metadata: {
        claudeModel: "claude-sonnet-4-20250514",
        totalApiCalls: 1,
        generationTimeMs: generationTime,
        cacheHit: false,
      },
    });

    // Create individual insights and link to session
    const createdInsights = [];
    const insightIds = [];

    for (const insight of aiResponse.insights) {
      const createdInsight = await AIInsight.create({
        sessionId: newSession._id,
        type: insight.type,
        priority: insight.priority,
        title: insight.title,
        message: insight.message,
        affectedKeywords: insight.affectedKeywords,
        actionItems: insight.actionItems,
        confidenceScore: insight.confidenceScore,
        category: insight.category,
        status: "new",
        generatedAt: new Date(),
        metadata: {
          reportCardPeriod: reportCard.period,
          reportCardScore: reportCard.overallScore,
          sourceDataHash,
          claudeModel: "claude-sonnet-4-20250514",
        },
      });

      createdInsights.push(createdInsight);
      insightIds.push(createdInsight._id);
    }

    // Update session with insight IDs
    await AIInsightSession.findByIdAndUpdate(newSession._id, {
      insightIds: insightIds,
    });

    return NextResponse.json({
      success: true,
      insights: createdInsights.map(transformInsight),
      summary: aiResponse.summary,
      executiveSummary: aiResponse.executiveSummary,
      generatedAt: newSession.generatedAt,
      analysisType: analysisType,
      cached: false,
      sessionId: newSession._id,
      generationTimeMs: generationTime,
    });
  } catch (error) {
    console.error("Error generating AI insights:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Claude API key")) {
        return NextResponse.json(
          { message: "AI service is not configured" },
          { status: 503 },
        );
      }

      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          {
            message: "AI service rate limit exceeded. Please try again later.",
          },
          { status: 429 },
        );
      }
    }

    return NextResponse.json(
      {
        message: "Failed to generate AI insights",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/v1/search-rankings/ai-insights
 * Get cached AI insights or return empty response
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // For now, return empty response since we don't have persistent storage for insights
    // In a production app, you might want to store insights in the database
    return NextResponse.json({
      insights: [],
      message:
        "No cached insights available. Generate new insights using POST request.",
    });
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return NextResponse.json(
      { message: "Failed to fetch AI insights" },
      { status: 500 },
    );
  }
}
