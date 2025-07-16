"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  ReportCard as ReportCardType,
  GRADE_COLORS,
  TREND_COLORS,
  SCORE_THRESHOLDS,
} from "@/types/reportCard";
import AIInsightsPanel from "./AIInsightsPanel";

interface ReportCardProps {
  period?: string;
  onPeriodChange?: (period: string) => void;
}

export default function ReportCard({
  period = "last30Days",
  onPeriodChange,
}: ReportCardProps) {
  const [reportCard, setReportCard] = useState<ReportCardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch report card data
  useEffect(() => {
    const fetchReportCard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get("/api/v1/search-rankings/report-card", {
          params: { period },
        });

        setReportCard(response.data.reportCard);
      } catch (error: any) {
        console.error("Error fetching report card:", error);
        setError("Failed to load report card data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportCard();
  }, [period]);

  // Helper function to get score color
  const getScoreColor = (score: number) => {
    if (score >= SCORE_THRESHOLDS.excellent) return "text-green-600";
    if (score >= SCORE_THRESHOLDS.good) return "text-blue-600";
    if (score >= SCORE_THRESHOLDS.fair) return "text-yellow-600";
    if (score >= SCORE_THRESHOLDS.poor) return "text-orange-600";
    return "text-red-600";
  };

  // Helper function to get score background
  const getScoreBg = (score: number) => {
    if (score >= SCORE_THRESHOLDS.excellent) return "bg-green-50";
    if (score >= SCORE_THRESHOLDS.good) return "bg-blue-50";
    if (score >= SCORE_THRESHOLDS.fair) return "bg-yellow-50";
    if (score >= SCORE_THRESHOLDS.poor) return "bg-orange-50";
    return "bg-red-50";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }

  if (error || !reportCard) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-2">Error</h2>
        <p>{error || "Failed to load report card"}</p>
      </div>
    );
  }

  const gradeColors =
    GRADE_COLORS[reportCard.overallGrade as keyof typeof GRADE_COLORS] ||
    GRADE_COLORS["N/A"];

  return (
    <div className="space-y-6">
      {/* Header with Overall Grade */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              SEO Performance Report Card
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Generated on{" "}
              {new Date(reportCard.generatedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Period Selector */}
          {onPeriodChange && (
            <div className="flex items-center">
              <label
                htmlFor="period-select"
                className="mr-2 text-sm font-medium text-gray-700"
              >
                Period:
              </label>
              <select
                id="period-select"
                value={period}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="last7Days">Last 7 Days</option>
                <option value="last30Days">Last 30 Days</option>
                <option value="last90Days">Last 90 Days</option>
                <option value="lastYear">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          )}
        </div>

        {/* Overall Grade Display */}
        <div className="flex items-center justify-center mb-8">
          <div
            className={`${gradeColors.bg} ${gradeColors.border} border-2 rounded-full w-32 h-32 flex items-center justify-center`}
          >
            <div className="text-center">
              <div className={`text-4xl font-bold ${gradeColors.text}`}>
                {reportCard.overallGrade}
              </div>
              <div className={`text-sm font-medium ${gradeColors.text}`}>
                {reportCard.overallScore}/100
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {reportCard.totalKeywords}
            </div>
            <div className="text-sm text-gray-500">Total Keywords</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {reportCard.metrics.averagePosition}
            </div>
            <div className="text-sm text-gray-500">Avg Position</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {reportCard.metrics.visibilityScore}%
            </div>
            <div className="text-sm text-gray-500">Visibility</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {reportCard.competitorAnalysis.outrankedPercentage}%
            </div>
            <div className="text-sm text-gray-500">Outranked</div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Visibility Score */}
        <div
          className={`${getScoreBg(reportCard.metrics.visibilityScore)} rounded-lg p-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Visibility
            </span>
            <span className="text-lg">👁️</span>
          </div>
          <div
            className={`text-2xl font-bold ${getScoreColor(reportCard.metrics.visibilityScore)}`}
          >
            {reportCard.metrics.visibilityScore}
          </div>
          <div className="text-xs text-gray-500 mt-1">Keywords ranking</div>
        </div>

        {/* Position Quality */}
        <div
          className={`${getScoreBg(
            typeof reportCard.metrics.averagePosition === "number"
              ? reportCard.metrics.averagePosition <= 3
                ? 100
                : reportCard.metrics.averagePosition <= 10
                  ? 75
                  : 50
              : 0,
          )} rounded-lg p-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Position</span>
            <span className="text-lg">📍</span>
          </div>
          <div
            className={`text-2xl font-bold ${getScoreColor(
              typeof reportCard.metrics.averagePosition === "number"
                ? reportCard.metrics.averagePosition <= 3
                  ? 100
                  : reportCard.metrics.averagePosition <= 10
                    ? 75
                    : 50
                : 0,
            )}`}
          >
            {reportCard.metrics.averagePosition}
          </div>
          <div className="text-xs text-gray-500 mt-1">Average ranking</div>
        </div>

        {/* Consistency Score */}
        <div
          className={`${getScoreBg(reportCard.metrics.consistencyScore)} rounded-lg p-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Consistency
            </span>
            <span className="text-lg">🎯</span>
          </div>
          <div
            className={`text-2xl font-bold ${getScoreColor(reportCard.metrics.consistencyScore)}`}
          >
            {reportCard.metrics.consistencyScore}
          </div>
          <div className="text-xs text-gray-500 mt-1">Ranking stability</div>
        </div>

        {/* Growth Score */}
        <div
          className={`${getScoreBg(reportCard.metrics.growthScore)} rounded-lg p-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Growth</span>
            <span className="text-lg">📈</span>
          </div>
          <div
            className={`text-2xl font-bold ${getScoreColor(reportCard.metrics.growthScore)}`}
          >
            {reportCard.metrics.growthScore}
          </div>
          <div className="text-xs text-gray-500 mt-1">Improvement trend</div>
        </div>

        {/* Competitive Score */}
        <div
          className={`${getScoreBg(reportCard.metrics.competitiveScore)} rounded-lg p-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Competitive
            </span>
            <span className="text-lg">⚔️</span>
          </div>
          <div
            className={`text-2xl font-bold ${getScoreColor(reportCard.metrics.competitiveScore)}`}
          >
            {reportCard.metrics.competitiveScore}
          </div>
          <div className="text-xs text-gray-500 mt-1">vs competitors</div>
        </div>
      </div>

      {/* Keyword Breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Keyword Performance Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {reportCard.keywordBreakdown.top3}
            </div>
            <div className="text-sm text-gray-600">Top 3 Positions</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reportCard.keywordBreakdown.top10}
            </div>
            <div className="text-sm text-gray-600">Top 10 Positions</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {reportCard.keywordBreakdown.top20}
            </div>
            <div className="text-sm text-gray-600">Top 20 Positions</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {reportCard.keywordBreakdown.notFound}
            </div>
            <div className="text-sm text-gray-600">Not Ranking</div>
          </div>
        </div>
      </div>

      {/* Top Performers and Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🏆 Top Performers
          </h3>
          {reportCard.topPerformers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No ranking keywords found
            </p>
          ) : (
            <div className="space-y-3">
              {reportCard.topPerformers.map((performer, index) => {
                const trendColors = TREND_COLORS[performer.trend];
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {performer.keyword}
                      </div>
                      <div className="text-sm text-gray-500">
                        Position #{performer.position}
                      </div>
                    </div>
                    <div
                      className={`${trendColors.bg} ${trendColors.text} px-2 py-1 rounded-full text-xs font-medium`}
                    >
                      {trendColors.icon} {performer.trend}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Needs Attention */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            ⚠️ Needs Attention
          </h3>
          {reportCard.needsAttention.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              All keywords performing well!
            </p>
          ) : (
            <div className="space-y-3">
              {reportCard.needsAttention.map((keyword, index) => {
                const trendColors = TREND_COLORS[keyword.trend];
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {keyword.keyword}
                      </div>
                      <div className="text-sm text-red-600">
                        {keyword.issue} - Position: {keyword.position}
                      </div>
                    </div>
                    <div
                      className={`${trendColors.bg} ${trendColors.text} px-2 py-1 rounded-full text-xs font-medium`}
                    >
                      {trendColors.icon} {keyword.trend}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Competitor Opportunities */}
      {reportCard.competitorAnalysis.opportunities.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🎯 Competitive Opportunities
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Their Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gap
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportCard.competitorAnalysis.opportunities
                  .slice(0, 5)
                  .map((opportunity, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {opportunity.keyword}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {opportunity.competitor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{opportunity.yourPosition}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{opportunity.competitorPosition}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            opportunity.gap <= 3
                              ? "bg-green-100 text-green-800"
                              : opportunity.gap <= 5
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {opportunity.gap} positions
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📊 Trend Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div
              className={`${TREND_COLORS[reportCard.trends.positionTrend].bg} rounded-lg p-4`}
            >
              <div
                className={`text-2xl ${TREND_COLORS[reportCard.trends.positionTrend].text}`}
              >
                {TREND_COLORS[reportCard.trends.positionTrend].icon}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-2">
                Position Trend
              </div>
              <div
                className={`text-sm ${TREND_COLORS[reportCard.trends.positionTrend].text} capitalize`}
              >
                {reportCard.trends.positionTrend}
              </div>
            </div>
          </div>
          <div className="text-center">
            <div
              className={`${TREND_COLORS[reportCard.trends.visibilityTrend].bg} rounded-lg p-4`}
            >
              <div
                className={`text-2xl ${TREND_COLORS[reportCard.trends.visibilityTrend].text}`}
              >
                {TREND_COLORS[reportCard.trends.visibilityTrend].icon}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-2">
                Visibility Trend
              </div>
              <div
                className={`text-sm ${TREND_COLORS[reportCard.trends.visibilityTrend].text} capitalize`}
              >
                {reportCard.trends.visibilityTrend}
              </div>
            </div>
          </div>
          <div className="text-center">
            <div
              className={`${TREND_COLORS[reportCard.trends.competitiveTrend].bg} rounded-lg p-4`}
            >
              <div
                className={`text-2xl ${TREND_COLORS[reportCard.trends.competitiveTrend].text}`}
              >
                {TREND_COLORS[reportCard.trends.competitiveTrend].icon}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-2">
                Competitive Trend
              </div>
              <div
                className={`text-sm ${TREND_COLORS[reportCard.trends.competitiveTrend].text} capitalize`}
              >
                {reportCard.trends.competitiveTrend}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel reportCard={reportCard} />
    </div>
  );
}
