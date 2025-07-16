"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ReportCard as ReportCardType, GRADE_COLORS } from "@/types/reportCard";

interface ReportCardSummaryProps {
  period?: string;
}

export default function ReportCardSummary({
  period = "last30Days",
}: ReportCardSummaryProps) {
  const router = useRouter();
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
        console.error("Error fetching report card summary:", error);
        setError("Failed to load report card data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportCard();
  }, [period]);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (error || !reportCard) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">Unable to load report card</p>
          <button
            onClick={() => router.push("/admin/search-rankings/report-card")}
            className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm"
          >
            View Full Report →
          </button>
        </div>
      </div>
    );
  }

  const gradeColors =
    GRADE_COLORS[reportCard.overallGrade as keyof typeof GRADE_COLORS] ||
    GRADE_COLORS["N/A"];

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Performance Overview
        </h3>
        <button
          onClick={() => router.push("/admin/search-rankings/report-card")}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          View Full Report →
        </button>
      </div>

      <div className="flex items-center space-x-6">
        {/* Overall Grade Circle */}
        <div
          className={`${gradeColors.bg} ${gradeColors.border} border-2 rounded-full w-20 h-20 flex items-center justify-center flex-shrink-0`}
        >
          <div className="text-center">
            <div className={`text-2xl font-bold ${gradeColors.text}`}>
              {reportCard.overallGrade}
            </div>
            <div className={`text-xs font-medium ${gradeColors.text}`}>
              {reportCard.overallScore}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {reportCard.metrics.visibilityScore}%
            </div>
            <div className="text-xs text-gray-500">Visibility</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {reportCard.metrics.averagePosition}
            </div>
            <div className="text-xs text-gray-500">Avg Position</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {reportCard.keywordBreakdown.top10}
            </div>
            <div className="text-xs text-gray-500">Top 10</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {reportCard.competitorAnalysis.outrankedPercentage}%
            </div>
            <div className="text-xs text-gray-500">Outranked</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-500">
              {reportCard.totalKeywords} keywords tracked
            </span>
            <span className="text-gray-300">•</span>
            <span
              className={`${
                reportCard.trends.positionTrend === "improving"
                  ? "text-green-600"
                  : reportCard.trends.positionTrend === "declining"
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {reportCard.trends.positionTrend === "improving"
                ? "↗"
                : reportCard.trends.positionTrend === "declining"
                  ? "↘"
                  : "→"}
              {reportCard.trends.positionTrend}
            </span>
          </div>
          <div className="text-gray-500">
            {new Date(reportCard.generatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Top Issues (if any) */}
      {reportCard.needsAttention.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Needs Attention:</div>
          <div className="space-y-1">
            {reportCard.needsAttention.slice(0, 2).map((keyword, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-700 truncate">
                  {keyword.keyword}
                </span>
                <span className="text-red-600 ml-2 flex-shrink-0">
                  {keyword.position === "Not Found"
                    ? "Not ranking"
                    : `#${keyword.position}`}
                </span>
              </div>
            ))}
            {reportCard.needsAttention.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{reportCard.needsAttention.length - 2} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
