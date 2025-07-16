import { NextRequest, NextResponse } from "next/server";
import { SearchKeyword, SearchRanking, Competitor } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/v1/search-rankings/report-card
 * Get aggregated search ranking metrics across all keywords
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "last30Days";

    // Get date range based on period
    const { startDate, endDate } = getDateRangeForPeriod(period);

    // Get all active keywords
    const keywords = await SearchKeyword.find({ isActive: true });
    const keywordIds = keywords.map((k) => k._id);

    if (keywordIds.length === 0) {
      return NextResponse.json({
        reportCard: {
          overallGrade: "N/A",
          overallScore: 0,
          totalKeywords: 0,
          metrics: {
            averagePosition: "N/A",
            visibilityScore: 0,
            competitiveScore: 0,
            consistencyScore: 0,
            growthScore: 0,
          },
          keywordBreakdown: {
            top3: 0,
            top10: 0,
            top20: 0,
            notFound: 0,
          },
          trends: {
            positionTrend: "stable",
            visibilityTrend: "stable",
            competitiveTrend: "stable",
          },
          topPerformers: [],
          needsAttention: [],
          competitorAnalysis: {
            totalCompetitors: 0,
            outrankedPercentage: 0,
            opportunities: [],
          },
        },
      });
    }

    // Get latest rankings for each keyword
    const latestRankings = await SearchRanking.aggregate([
      {
        $match: {
          keywordId: { $in: keywordIds },
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $group: {
          _id: "$keywordId",
          latestRanking: { $first: "$$ROOT" },
        },
      },
    ]);

    // Get historical data for trend analysis
    const historicalRankings = await SearchRanking.find({
      keywordId: { $in: keywordIds },
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }).sort({ date: -1 });

    // Get managed competitors
    const managedCompetitors = await Competitor.find({ isActive: true });

    // Calculate metrics
    const metrics = calculateReportCardMetrics(
      keywords,
      latestRankings,
      historicalRankings,
      managedCompetitors,
      period,
    );

    return NextResponse.json({ reportCard: metrics });
  } catch (error) {
    console.error("Error generating report card:", error);
    return NextResponse.json(
      { message: "Failed to generate report card" },
      { status: 500 },
    );
  }
}

// Helper function to get date range based on period
function getDateRangeForPeriod(period: string) {
  const now = new Date();
  let startDate = new Date(now);
  let endDate = new Date(now);

  // Set end date to end of current day
  endDate.setHours(23, 59, 59, 999);

  switch (period) {
    case "last7Days":
      startDate.setDate(now.getDate() - 7);
      break;
    case "last30Days":
      startDate.setDate(now.getDate() - 30);
      break;
    case "last90Days":
      startDate.setDate(now.getDate() - 90);
      break;
    case "lastYear":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "all":
    default:
      startDate = new Date(2000, 0, 1); // Far in the past
      break;
  }

  startDate.setHours(0, 0, 0, 0);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

// Main calculation function
function calculateReportCardMetrics(
  keywords: any[],
  latestRankings: any[],
  historicalRankings: any[],
  managedCompetitors: any[],
  period: string,
) {
  const totalKeywords = keywords.length;
  const rankingsMap = new Map(
    latestRankings.map((r) => [r._id.toString(), r.latestRanking]),
  );

  // Calculate keyword breakdown
  let top3 = 0,
    top10 = 0,
    top20 = 0,
    notFound = 0;
  let totalValidPositions = 0;
  let positionSum = 0;
  let visibleKeywords = 0;

  const keywordPerformance = keywords.map((keyword) => {
    const ranking = rankingsMap.get(keyword._id.toString());
    const position = ranking?.position || 0;

    if (position > 0) {
      visibleKeywords++;
      totalValidPositions++;
      positionSum += position;

      if (position <= 3) top3++;
      else if (position <= 10) top10++;
      else if (position <= 20) top20++;
    } else {
      notFound++;
    }

    return {
      keyword: keyword.keyword,
      position,
      ranking: ranking || null,
    };
  });

  // Calculate core metrics
  const averagePosition =
    totalValidPositions > 0
      ? (positionSum / totalValidPositions).toFixed(1)
      : "N/A";

  const visibilityScore = Math.round((visibleKeywords / totalKeywords) * 100);

  // Calculate consistency score (percentage of keywords with stable rankings)
  const consistencyScore = calculateConsistencyScore(
    historicalRankings,
    keywords,
  );

  // Calculate growth score (trend analysis)
  const growthScore = calculateGrowthScore(historicalRankings, period);

  // Calculate competitive score
  const competitiveScore = calculateCompetitiveScore(
    latestRankings,
    managedCompetitors,
  );

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    visibilityScore * 0.3 +
      getPositionScore(averagePosition) * 0.25 +
      consistencyScore * 0.2 +
      growthScore * 0.15 +
      competitiveScore * 0.1,
  );

  // Determine overall grade
  const overallGrade = getGradeFromScore(overallScore);

  // Get top performers and keywords needing attention
  const sortedByPosition = keywordPerformance
    .filter((k) => k.position > 0)
    .sort((a, b) => a.position - b.position);

  const topPerformers = sortedByPosition.slice(0, 5).map((k) => ({
    keyword: k.keyword,
    position: k.position,
    trend: calculateKeywordTrend(k.keyword, historicalRankings),
  }));

  const needsAttention = keywordPerformance
    .filter((k) => k.position === 0 || k.position > 20)
    .slice(0, 5)
    .map((k) => ({
      keyword: k.keyword,
      position: k.position || "Not Found",
      issue: k.position === 0 ? "Not ranking" : "Low position",
      trend: calculateKeywordTrend(k.keyword, historicalRankings),
    }));

  // Calculate trends
  const trends = calculateTrends(historicalRankings, period);

  // Competitor analysis
  const competitorAnalysis = analyzeCompetitors(
    latestRankings,
    managedCompetitors,
  );

  return {
    overallGrade,
    overallScore,
    totalKeywords,
    metrics: {
      averagePosition,
      visibilityScore,
      competitiveScore,
      consistencyScore,
      growthScore,
    },
    keywordBreakdown: {
      top3,
      top10,
      top20,
      notFound,
    },
    trends,
    topPerformers,
    needsAttention,
    competitorAnalysis,
    generatedAt: new Date().toISOString(),
    period,
  };
}

// Helper functions
function getPositionScore(averagePosition: string | number): number {
  if (averagePosition === "N/A") return 0;
  const pos =
    typeof averagePosition === "string"
      ? parseFloat(averagePosition)
      : averagePosition;

  if (pos <= 3) return 100;
  if (pos <= 5) return 90;
  if (pos <= 10) return 75;
  if (pos <= 15) return 60;
  if (pos <= 20) return 45;
  return 30;
}

function getGradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function calculateConsistencyScore(
  historicalRankings: any[],
  keywords: any[],
): number {
  if (historicalRankings.length === 0) return 0;

  const keywordConsistency = keywords.map((keyword) => {
    const keywordRankings = historicalRankings.filter(
      (r) => r.keywordId.toString() === keyword._id.toString(),
    );

    if (keywordRankings.length < 2) return 0;

    const positions = keywordRankings
      .filter((r) => r.position > 0)
      .map((r) => r.position);

    if (positions.length === 0) return 0;

    // Calculate standard deviation
    const avg = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    const variance =
      positions.reduce((sum, pos) => sum + Math.pow(pos - avg, 2), 0) /
      positions.length;
    const stdDev = Math.sqrt(variance);

    // Convert to consistency score (lower std dev = higher consistency)
    return Math.max(0, 100 - stdDev * 10);
  });

  return Math.round(
    keywordConsistency.reduce((sum, score) => sum + score, 0) / keywords.length,
  );
}

function calculateGrowthScore(
  historicalRankings: any[],
  period: string,
): number {
  if (historicalRankings.length === 0) return 50; // Neutral score

  // Group by keyword and calculate trend
  const keywordTrends = new Map();

  historicalRankings.forEach((ranking) => {
    const keywordId = ranking.keywordId.toString();
    if (!keywordTrends.has(keywordId)) {
      keywordTrends.set(keywordId, []);
    }
    keywordTrends.get(keywordId).push({
      date: ranking.date,
      position: ranking.position,
    });
  });

  let totalTrendScore = 0;
  let keywordCount = 0;

  keywordTrends.forEach((rankings) => {
    if (rankings.length < 2) return;

    // Sort by date
    rankings.sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const validRankings = rankings.filter((r: any) => r.position > 0);
    if (validRankings.length < 2) return;

    const firstPosition = validRankings[0].position;
    const lastPosition = validRankings[validRankings.length - 1].position;

    // Calculate improvement (negative change is good)
    const improvement = firstPosition - lastPosition;

    // Convert to score (0-100)
    let trendScore = 50; // Neutral
    if (improvement > 0) {
      trendScore = Math.min(100, 50 + improvement * 5);
    } else if (improvement < 0) {
      trendScore = Math.max(0, 50 + improvement * 5);
    }

    totalTrendScore += trendScore;
    keywordCount++;
  });

  return keywordCount > 0 ? Math.round(totalTrendScore / keywordCount) : 50;
}

function calculateCompetitiveScore(
  latestRankings: any[],
  managedCompetitors: any[],
): number {
  if (managedCompetitors.length === 0 || latestRankings.length === 0) return 50;

  let totalComparisons = 0;
  let wins = 0;

  latestRankings.forEach((rankingData) => {
    const ranking = rankingData.latestRanking;
    if (!ranking || ranking.position <= 0) return;

    managedCompetitors.forEach((competitor) => {
      const competitorInResults = ranking.competitors.find((c: any) => {
        const normalizedCompetitorUrl = competitor.url
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");

        const normalizedResultUrl = c.url
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");

        return normalizedResultUrl.includes(normalizedCompetitorUrl);
      });

      if (competitorInResults) {
        totalComparisons++;
        if (ranking.position < competitorInResults.position) {
          wins++;
        }
      }
    });
  });

  return totalComparisons > 0
    ? Math.round((wins / totalComparisons) * 100)
    : 50;
}

function calculateKeywordTrend(
  keyword: string,
  historicalRankings: any[],
): string {
  const keywordRankings = historicalRankings
    .filter((r: any) => r.keyword === keyword && r.position > 0)
    .sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

  if (keywordRankings.length < 2) return "stable";

  const firstPosition = keywordRankings[0].position;
  const lastPosition = keywordRankings[keywordRankings.length - 1].position;
  const change = firstPosition - lastPosition;

  if (change > 2) return "improving";
  if (change < -2) return "declining";
  return "stable";
}

function calculateTrends(historicalRankings: any[], period: string) {
  // This is a simplified trend calculation
  // In a real implementation, you'd want more sophisticated trend analysis

  const recentRankings = historicalRankings.slice(
    0,
    Math.floor(historicalRankings.length / 2),
  );
  const olderRankings = historicalRankings.slice(
    Math.floor(historicalRankings.length / 2),
  );

  const recentAvg = calculateAveragePosition(recentRankings);
  const olderAvg = calculateAveragePosition(olderRankings);

  const positionTrend =
    recentAvg < olderAvg
      ? "improving"
      : recentAvg > olderAvg
        ? "declining"
        : "stable";

  return {
    positionTrend,
    visibilityTrend: "stable", // Simplified for now
    competitiveTrend: "stable", // Simplified for now
  };
}

function calculateAveragePosition(rankings: any[]): number {
  const validPositions = rankings
    .filter((r: any) => r.position > 0)
    .map((r: any) => r.position);
  return validPositions.length > 0
    ? validPositions.reduce((sum, pos) => sum + pos, 0) / validPositions.length
    : 0;
}

function analyzeCompetitors(latestRankings: any[], managedCompetitors: any[]) {
  const totalCompetitors = managedCompetitors.length;
  let totalComparisons = 0;
  let outranked = 0;
  const allOpportunities: Array<{
    keyword: string;
    competitor: string;
    yourPosition: number;
    competitorPosition: number;
    gap: number;
  }> = [];

  // First pass: collect all opportunities and calculate outranked percentage
  latestRankings.forEach((rankingData) => {
    const ranking = rankingData.latestRanking;
    if (!ranking || ranking.position <= 0) return;

    managedCompetitors.forEach((competitor) => {
      const competitorInResults = ranking.competitors.find((c: any) => {
        const normalizedCompetitorUrl = competitor.url
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");

        const normalizedResultUrl = c.url
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");

        return normalizedResultUrl.includes(normalizedCompetitorUrl);
      });

      if (competitorInResults) {
        totalComparisons++;
        if (ranking.position < competitorInResults.position) {
          outranked++;
        } else {
          // This is an opportunity (competitor outranks us)
          allOpportunities.push({
            keyword: ranking.keyword,
            competitor: competitor.name,
            yourPosition: ranking.position,
            competitorPosition: competitorInResults.position,
            gap: competitorInResults.position - ranking.position,
          });
        }
      }
    });
  });

  const outrankedPercentage =
    totalComparisons > 0 ? Math.round((outranked / totalComparisons) * 100) : 0;

  // Second pass: diversify opportunities across keywords
  const keywordOpportunities = new Map<
    string,
    Array<{
      keyword: string;
      competitor: string;
      yourPosition: number;
      competitorPosition: number;
      gap: number;
    }>
  >();

  // Group opportunities by keyword
  allOpportunities.forEach((opportunity) => {
    if (!keywordOpportunities.has(opportunity.keyword)) {
      keywordOpportunities.set(opportunity.keyword, []);
    }
    keywordOpportunities.get(opportunity.keyword)!.push(opportunity);
  });

  // For each keyword, sort by gap and take the best opportunity (smallest gap = easiest win)
  const diversifiedOpportunities: Array<{
    keyword: string;
    competitor: string;
    yourPosition: number;
    competitorPosition: number;
    gap: number;
  }> = [];

  keywordOpportunities.forEach((opportunities, keyword) => {
    // Sort by gap (smallest first = easiest wins)
    opportunities.sort((a, b) => a.gap - b.gap);

    // Take the best opportunity for this keyword (smallest gap)
    if (opportunities.length > 0) {
      diversifiedOpportunities.push(opportunities[0]);
    }
  });

  // Sort the diversified opportunities by gap (easiest wins across all keywords first)
  diversifiedOpportunities.sort((a, b) => a.gap - b.gap);

  return {
    totalCompetitors,
    outrankedPercentage,
    opportunities: diversifiedOpportunities.slice(0, 10), // Top 10 diversified opportunities
  };
}
