import crypto from "crypto";
import { ReportCard } from "@/types/reportCard";

/**
 * Generate a consistent hash for report card data to detect changes
 * @param reportCard Report card data
 * @returns SHA-256 hash string
 */
export function generateReportCardHash(reportCard: ReportCard): string {
  // Create a normalized object with only the data that matters for insights
  const normalizedData = {
    overallScore: reportCard.overallScore,
    totalKeywords: reportCard.totalKeywords,
    period: reportCard.period,
    metrics: {
      averagePosition: reportCard.metrics.averagePosition,
      visibilityScore: reportCard.metrics.visibilityScore,
      competitiveScore: reportCard.metrics.competitiveScore,
      consistencyScore: reportCard.metrics.consistencyScore,
      growthScore: reportCard.metrics.growthScore,
    },
    keywordBreakdown: reportCard.keywordBreakdown,
    trends: reportCard.trends,
    // Only include keyword names and positions for top performers
    topPerformers: reportCard.topPerformers.map((p) => ({
      keyword: p.keyword,
      position: p.position,
      trend: p.trend,
    })),
    // Only include keyword names and issues for needs attention
    needsAttention: reportCard.needsAttention.map((k) => ({
      keyword: k.keyword,
      position: k.position,
      issue: k.issue,
      trend: k.trend,
    })),
    // Include competitive analysis summary
    competitorAnalysis: {
      totalCompetitors: reportCard.competitorAnalysis.totalCompetitors,
      outrankedPercentage: reportCard.competitorAnalysis.outrankedPercentage,
      // Only include top 5 opportunities for hash consistency
      opportunities: reportCard.competitorAnalysis.opportunities
        .slice(0, 5)
        .map((o) => ({
          keyword: o.keyword,
          competitor: o.competitor,
          gap: o.gap,
        })),
    },
  };

  // Convert to JSON string with sorted keys for consistency
  const jsonString = JSON.stringify(
    normalizedData,
    Object.keys(normalizedData).sort(),
  );

  // Generate SHA-256 hash
  return crypto.createHash("sha256").update(jsonString).digest("hex");
}

/**
 * Check if two report cards are significantly different
 * @param hash1 First report card hash
 * @param hash2 Second report card hash
 * @returns True if they are different
 */
export function hasSignificantChange(hash1: string, hash2: string): boolean {
  return hash1 !== hash2;
}

/**
 * Generate a shorter hash for display purposes
 * @param fullHash Full SHA-256 hash
 * @returns First 8 characters of hash
 */
export function getShortHash(fullHash: string): string {
  return fullHash.substring(0, 8);
}

/**
 * Check if report card data should trigger new insights generation
 * @param currentReportCard Current report card
 * @param lastSessionHash Hash from last insight session
 * @returns True if new insights should be generated
 */
export function shouldGenerateNewInsights(
  currentReportCard: ReportCard,
  lastSessionHash?: string,
): boolean {
  if (!lastSessionHash) {
    return true; // No previous session, generate insights
  }

  const currentHash = generateReportCardHash(currentReportCard);

  // Generate new insights if data has changed
  return hasSignificantChange(currentHash, lastSessionHash);
}

/**
 * Calculate similarity score between two report cards (0-1)
 * @param reportCard1 First report card
 * @param reportCard2 Second report card
 * @returns Similarity score (1 = identical, 0 = completely different)
 */
export function calculateSimilarityScore(
  reportCard1: ReportCard,
  reportCard2: ReportCard,
): number {
  let totalScore = 0;
  let maxScore = 0;

  // Compare overall scores (weight: 30%)
  const scoreDiff = Math.abs(
    reportCard1.overallScore - reportCard2.overallScore,
  );
  totalScore += Math.max(0, 100 - scoreDiff) * 0.3;
  maxScore += 100 * 0.3;

  // Compare keyword counts (weight: 20%)
  const keywordDiff = Math.abs(
    reportCard1.totalKeywords - reportCard2.totalKeywords,
  );
  totalScore += Math.max(0, 100 - keywordDiff * 10) * 0.2;
  maxScore += 100 * 0.2;

  // Compare visibility scores (weight: 25%)
  const visibilityDiff = Math.abs(
    reportCard1.metrics.visibilityScore - reportCard2.metrics.visibilityScore,
  );
  totalScore += Math.max(0, 100 - visibilityDiff) * 0.25;
  maxScore += 100 * 0.25;

  // Compare competitive scores (weight: 25%)
  const competitiveDiff = Math.abs(
    reportCard1.metrics.competitiveScore - reportCard2.metrics.competitiveScore,
  );
  totalScore += Math.max(0, 100 - competitiveDiff) * 0.25;
  maxScore += 100 * 0.25;

  return totalScore / maxScore;
}
