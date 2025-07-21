"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Tooltip from "@/components/ui/Tooltip";
import {
  ReportCard as ReportCardType,
  GRADE_COLORS,
  TREND_COLORS,
  SCORE_THRESHOLDS,
} from "@/types/reportCard";
import AIInsightsPanel from "./AIInsightsPanel";
import { TOOLTIP_CONTENT } from "./tooltipContent";

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
          <Tooltip content={TOOLTIP_CONTENT.overallGrade}>
            <div
              className={`${gradeColors.bg} ${gradeColors.border} border-2 rounded-full w-32 h-32 flex items-center justify-center cursor-help`}
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
          </Tooltip>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Tooltip content={TOOLTIP_CONTENT.totalKeywords}>
            <div className="cursor-help">
              <div className="text-2xl font-bold text-gray-900">
                {reportCard.totalKeywords}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                Total Keywords
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Tooltip>
          <Tooltip content={TOOLTIP_CONTENT.averagePosition}>
            <div className="cursor-help">
              <div className="text-2xl font-bold text-gray-900">
                {reportCard.metrics.averagePosition}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                Avg Position
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Tooltip>
          <Tooltip content={TOOLTIP_CONTENT.visibilityScore}>
            <div className="cursor-help">
              <div className="text-2xl font-bold text-gray-900">
                {reportCard.metrics.visibilityScore}%
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                Visibility
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Tooltip>
          <Tooltip content={TOOLTIP_CONTENT.outrankedPercentage}>
            <div className="cursor-help">
              <div className="text-2xl font-bold text-gray-900">
                {reportCard.competitorAnalysis.outrankedPercentage}%
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                Outranked
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Visibility Score */}
        <Tooltip content={TOOLTIP_CONTENT.visibility}>
          <div
            className={`${getScoreBg(reportCard.metrics.visibilityScore)} rounded-lg p-4 cursor-help`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                Visibility
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
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
        </Tooltip>

        {/* Position Quality */}
        <Tooltip content={TOOLTIP_CONTENT.position}>
          <div
            className={`${getScoreBg(
              typeof reportCard.metrics.averagePosition === "number"
                ? reportCard.metrics.averagePosition <= 3
                  ? 100
                  : reportCard.metrics.averagePosition <= 10
                    ? 75
                    : 50
                : 0,
            )} rounded-lg p-4 cursor-help`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                Position
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
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
        </Tooltip>

        {/* Consistency Score */}
        <Tooltip content={TOOLTIP_CONTENT.consistency}>
          <div
            className={`${getScoreBg(reportCard.metrics.consistencyScore)} rounded-lg p-4 cursor-help`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                Consistency
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
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
        </Tooltip>

        {/* Growth Score */}
        <Tooltip content={TOOLTIP_CONTENT.growth}>
          <div
            className={`${getScoreBg(reportCard.metrics.growthScore)} rounded-lg p-4 cursor-help`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                Growth
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-lg">📈</span>
            </div>
            <div
              className={`text-2xl font-bold ${getScoreColor(reportCard.metrics.growthScore)}`}
            >
              {reportCard.metrics.growthScore}
            </div>
            <div className="text-xs text-gray-500 mt-1">Improvement trend</div>
          </div>
        </Tooltip>

        {/* Competitive Score */}
        <Tooltip content={TOOLTIP_CONTENT.competitive}>
          <div
            className={`${getScoreBg(reportCard.metrics.competitiveScore)} rounded-lg p-4 cursor-help`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                Competitive
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
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
        </Tooltip>
      </div>

      {/* Keyword Breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Keyword Performance Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tooltip content={TOOLTIP_CONTENT.top3Positions}>
            <div className="bg-green-50 rounded-lg p-4 text-center cursor-help">
              <div className="text-2xl font-bold text-green-600">
                {reportCard.keywordBreakdown.top3}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                Top 3 Positions
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Tooltip>
          <Tooltip content={TOOLTIP_CONTENT.top10Positions}>
            <div className="bg-blue-50 rounded-lg p-4 text-center cursor-help">
              <div className="text-2xl font-bold text-blue-600">
                {reportCard.keywordBreakdown.top10}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                Top 10 Positions
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Tooltip>
          <Tooltip content={TOOLTIP_CONTENT.top20Positions}>
            <div className="bg-yellow-50 rounded-lg p-4 text-center cursor-help">
              <div className="text-2xl font-bold text-yellow-600">
                {reportCard.keywordBreakdown.top20}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                Top 20 Positions
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Tooltip>
          <Tooltip content={TOOLTIP_CONTENT.notRanking}>
            <div className="bg-red-50 rounded-lg p-4 text-center cursor-help">
              <div className="text-2xl font-bold text-red-600">
                {reportCard.keywordBreakdown.notFound}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                Not Ranking
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Top Performers and Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              🏆 Top Performers
            </h3>
            <Tooltip content={TOOLTIP_CONTENT.topPerformers}>
              <svg
                className="w-4 h-4 text-gray-400 cursor-help"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </Tooltip>
          </div>
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
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              ⚠️ Needs Attention
            </h3>
            <Tooltip content={TOOLTIP_CONTENT.needsAttention}>
              <svg
                className="w-4 h-4 text-gray-400 cursor-help"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </Tooltip>
          </div>
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
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              🎯 Competitive Opportunities
            </h3>
            <Tooltip content={TOOLTIP_CONTENT.competitiveOpportunities}>
              <svg
                className="w-4 h-4 text-gray-400 cursor-help"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </Tooltip>
          </div>
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
          <Tooltip content={TOOLTIP_CONTENT.positionTrend}>
            <div className="text-center cursor-help">
              <div
                className={`${TREND_COLORS[reportCard.trends.positionTrend].bg} rounded-lg p-4`}
              >
                <div
                  className={`text-2xl ${TREND_COLORS[reportCard.trends.positionTrend].text}`}
                >
                  {TREND_COLORS[reportCard.trends.positionTrend].icon}
                </div>
                <div className="text-sm font-medium text-gray-900 mt-2 flex items-center justify-center gap-1">
                  Position Trend
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div
                  className={`text-sm ${TREND_COLORS[reportCard.trends.positionTrend].text} capitalize`}
                >
                  {reportCard.trends.positionTrend}
                </div>
              </div>
            </div>
          </Tooltip>
          <Tooltip content={TOOLTIP_CONTENT.visibilityTrend}>
            <div className="text-center cursor-help">
              <div
                className={`${TREND_COLORS[reportCard.trends.visibilityTrend].bg} rounded-lg p-4`}
              >
                <div
                  className={`text-2xl ${TREND_COLORS[reportCard.trends.visibilityTrend].text}`}
                >
                  {TREND_COLORS[reportCard.trends.visibilityTrend].icon}
                </div>
                <div className="text-sm font-medium text-gray-900 mt-2 flex items-center justify-center gap-1">
                  Visibility Trend
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div
                  className={`text-sm ${TREND_COLORS[reportCard.trends.visibilityTrend].text} capitalize`}
                >
                  {reportCard.trends.visibilityTrend}
                </div>
              </div>
            </div>
          </Tooltip>
          <Tooltip content={TOOLTIP_CONTENT.competitiveTrend}>
            <div className="text-center cursor-help">
              <div
                className={`${TREND_COLORS[reportCard.trends.competitiveTrend].bg} rounded-lg p-4`}
              >
                <div
                  className={`text-2xl ${TREND_COLORS[reportCard.trends.competitiveTrend].text}`}
                >
                  {TREND_COLORS[reportCard.trends.competitiveTrend].icon}
                </div>
                <div className="text-sm font-medium text-gray-900 mt-2 flex items-center justify-center gap-1">
                  Competitive Trend
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div
                  className={`text-sm ${TREND_COLORS[reportCard.trends.competitiveTrend].text} capitalize`}
                >
                  {reportCard.trends.competitiveTrend}
                </div>
              </div>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel reportCard={reportCard} />
    </div>
  );
}
