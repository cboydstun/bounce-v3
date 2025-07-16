"use client";

import { useState } from "react";
import api from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AIInsight } from "@/types/aiInsights";
import { ReportCard } from "@/types/reportCard";

interface AIInsightsPanelProps {
  reportCard: ReportCard;
  className?: string;
}

export default function AIInsightsPanel({
  reportCard,
  className = "",
}: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const generateInsights = async (forceRegenerate = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/v1/search-rankings/ai-insights", {
        reportCard,
        analysisType: "insights",
        forceRegenerate,
      });

      setInsights(response.data.insights);
      setLastGenerated(response.data.generatedAt);
      setIsCached(response.data.cached || false);
      setSessionId(response.data.sessionId);
    } catch (error: any) {
      console.error("Error generating insights:", error);
      setError(error.response?.data?.message || "Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  const updateInsightStatus = async (
    insightId: string,
    status: "new" | "in_progress" | "completed" | "dismissed",
    notes?: string,
  ) => {
    try {
      const response = await api.patch(
        `/api/v1/search-rankings/ai-insights/${insightId}`,
        {
          status,
          notes,
        },
      );

      // Update the insight in the local state
      setInsights((prevInsights) =>
        prevInsights.map((insight) =>
          insight.id === insightId ? { ...insight, status, notes } : insight,
        ),
      );

      return response.data.insight;
    } catch (error: any) {
      console.error("Error updating insight status:", error);
      throw error;
    }
  };

  const deleteInsight = async (insightId: string) => {
    try {
      await api.delete(`/api/v1/search-rankings/ai-insights/${insightId}`);

      // Remove the insight from local state
      setInsights((prevInsights) =>
        prevInsights.filter((insight) => insight.id !== insightId),
      );
    } catch (error: any) {
      console.error("Error deleting insight:", error);
      throw error;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 border-red-200 text-red-800";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "low":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return "🎯";
      case "warning":
        return "⚠️";
      case "trend":
        return "📈";
      case "recommendation":
        return "💡";
      default:
        return "📊";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ranking":
        return "bg-green-100 text-green-800";
      case "competitive":
        return "bg-purple-100 text-purple-800";
      case "technical":
        return "bg-orange-100 text-orange-800";
      case "content":
        return "bg-blue-100 text-blue-800";
      case "performance":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      case "new":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "in_progress":
        return "🔄";
      case "dismissed":
        return "❌";
      case "new":
      default:
        return "🆕";
    }
  };

  // Filter out dismissed insights for display
  const visibleInsights = insights.filter(
    (insight) => insight.status !== "dismissed",
  );

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              🤖 AI-Powered Insights
              {isCached && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Cached
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get intelligent analysis and recommendations for your SEO
              performance
            </p>
          </div>
          <div className="flex space-x-2">
            {insights.length > 0 && (
              <button
                onClick={() => generateInsights(true)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                🔄 Refresh
              </button>
            )}
            <button
              onClick={() => generateInsights()}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }`}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {insights.length > 0 ? "Generate New" : "Generate Insights"}
                </>
              )}
            </button>
          </div>
        </div>

        {lastGenerated && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>
              Last generated: {new Date(lastGenerated).toLocaleString()}
            </span>
            {sessionId && <span>Session: {sessionId.substring(0, 8)}...</span>}
          </div>
        )}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 mr-2 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="font-medium">Error generating insights</h4>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {visibleInsights.length === 0 && !isLoading && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to analyze your SEO performance
            </h3>
            <p className="text-gray-500 mb-4">
              Click "Generate Insights" to get AI-powered recommendations and
              analysis
            </p>
            <div className="text-sm text-gray-400">
              <p>AI insights include:</p>
              <ul className="mt-2 space-y-1">
                <li>• Competitive opportunities</li>
                <li>• Ranking trend analysis</li>
                <li>• Content recommendations</li>
                <li>• Technical SEO suggestions</li>
              </ul>
            </div>
          </div>
        )}

        {visibleInsights.length > 0 && (
          <div className="space-y-4">
            {visibleInsights.map((insight) => (
              <div
                key={insight.id}
                className={`border rounded-lg p-4 ${getPriorityColor(insight.priority)} ${
                  insight.status === "completed" ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">
                      {getTypeIcon(insight.type)}
                    </span>
                    <div>
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <div className="flex items-center mt-1 space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(insight.category)}`}
                        >
                          {insight.category}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(insight.status)}`}
                        >
                          {getStatusIcon(insight.status)}{" "}
                          {insight.status.replace("_", " ")}
                        </span>
                        <span className="text-xs opacity-75">
                          {insight.priority} priority
                        </span>
                        <span className="text-xs opacity-75">
                          {Math.round(insight.confidenceScore * 100)}%
                          confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-1">
                    {insight.status === "new" && (
                      <button
                        onClick={() =>
                          updateInsightStatus(insight.id, "in_progress")
                        }
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                        title="Mark as in progress"
                      >
                        Start
                      </button>
                    )}
                    {insight.status === "in_progress" && (
                      <button
                        onClick={() =>
                          updateInsightStatus(insight.id, "completed")
                        }
                        className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded hover:bg-green-50"
                        title="Mark as completed"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => deleteInsight(insight.id)}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                      title="Dismiss insight"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                <p className="text-sm mb-3 leading-relaxed">
                  {insight.message}
                </p>

                {insight.affectedKeywords.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">
                      Affected Keywords:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {insight.affectedKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white bg-opacity-50"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {insight.actionItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2">
                      Recommended Actions:
                    </p>
                    <ul className="space-y-1">
                      {insight.actionItems.map((action, index) => (
                        <li key={index} className="text-xs flex items-start">
                          <span className="mr-2 mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insight.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 border-opacity-50">
                    <p className="text-xs font-medium mb-1">Notes:</p>
                    <p className="text-xs italic">{insight.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        {visibleInsights.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="font-medium text-gray-900">
                  {visibleInsights.length}
                </div>
                <div className="text-gray-500">Total Insights</div>
              </div>
              <div>
                <div className="font-medium text-red-600">
                  {visibleInsights.filter((i) => i.priority === "high").length}
                </div>
                <div className="text-gray-500">High Priority</div>
              </div>
              <div>
                <div className="font-medium text-green-600">
                  {
                    visibleInsights.filter((i) => i.status === "completed")
                      .length
                  }
                </div>
                <div className="text-gray-500">Completed</div>
              </div>
              <div>
                <div className="font-medium text-blue-600">
                  {
                    visibleInsights.filter((i) => i.status === "in_progress")
                      .length
                  }
                </div>
                <div className="text-gray-500">In Progress</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
