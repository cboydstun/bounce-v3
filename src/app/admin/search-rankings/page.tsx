"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import KeywordManager from "@/components/search-rankings/KeywordManager";
import RankingHistory from "@/components/search-rankings/RankingHistory";
import RankingMetrics from "@/components/search-rankings/RankingMetrics";
import CompetitorAnalysis from "@/components/search-rankings/CompetitorAnalysis";
import ValidationPanel from "@/components/search-rankings/ValidationPanel";
import ReportCardSummary from "@/components/search-rankings/ReportCardSummary";
import BatchProgressTracker from "@/components/search-rankings/BatchProgressTracker";
import {
  getCurrentDateCT,
  formatDateCT,
  createDateCT,
} from "@/utils/dateUtils";
import {
  SearchKeyword,
  SearchRanking,
  ManagedCompetitor,
  RankingValidationStatus,
  JobQueueStatus,
  JobProcessResult,
  JobCreationResult,
} from "@/types/searchRanking";

// Type for the rankings cache
interface RankingsCacheItem {
  rankings: SearchRanking[];
  period: string;
  lastFetched: Date;
}

type RankingsCache = Record<string, RankingsCacheItem>;

export default function SearchRankingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<SearchKeyword[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [rankings, setRankings] = useState<SearchRanking[]>([]);
  const [lastRankingDates, setLastRankingDates] = useState<
    Record<string, Date>
  >({});
  const [period, setPeriod] = useState("last30Days");
  const [isCheckingRanking, setIsCheckingRanking] = useState(false);
  const [competitors, setCompetitors] = useState<ManagedCompetitor[]>([]);
  const [validationStatus, setValidationStatus] = useState<
    RankingValidationStatus | undefined
  >(undefined);

  // Bulk checking state
  const [isBulkChecking, setIsBulkChecking] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<string>("");
  const [bulkResults, setBulkResults] = useState<any>(null);

  // Job queue status
  const [queueStatus, setQueueStatus] = useState<JobQueueStatus | null>(null);
  const [showQueueStatus, setShowQueueStatus] = useState(false);
  const [queuePollingInterval, setQueuePollingInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Current positions for all keywords
  const [currentPositions, setCurrentPositions] = useState<
    Record<string, number>
  >({});

  // Cache to store rankings by keyword ID and period
  const [rankingsCache, setRankingsCache] = useState<RankingsCache>({});

  // Fetch keywords and competitors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch keywords
        const keywordsResponse = await api.get(
          "/api/v1/search-rankings/keywords",
        );
        setKeywords(keywordsResponse.data.keywords);

        // Select the first keyword by default if available
        if (keywordsResponse.data.keywords.length > 0) {
          setSelectedKeyword(keywordsResponse.data.keywords[0]._id);
        }

        // Fetch competitors
        try {
          const competitorsResponse = await api.get("/api/v1/competitors");
          setCompetitors(competitorsResponse.data.competitors);
        } catch (competitorError) {
          console.error("Error fetching competitors:", competitorError);
          // Don't set an error for competitors, as it's not critical
        }
      } catch (error: any) {
        console.error("Error fetching keywords:", error);
        setError("Failed to fetch keywords. Please try again later.");

        // Handle authentication errors
        if (error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Fetch last ranking dates and current positions when keywords change
  useEffect(() => {
    const fetchLastRankingDates = async () => {
      if (keywords.length === 0) return;

      try {
        // Fetch latest rankings for all keywords
        const response = await api.get("/api/v1/search-rankings/latest");

        // Convert ISO strings back to Date objects
        const dateMap: Record<string, Date> = {};
        Object.entries(response.data.lastRankingDates || {}).forEach(
          ([keywordId, dateStr]) => {
            dateMap[keywordId] = new Date(dateStr as string);
          },
        );

        setLastRankingDates(dateMap);
        console.log(
          `📅 Fetched last ranking dates for ${Object.keys(dateMap).length} keywords`,
        );
      } catch (error) {
        console.error("Failed to fetch last ranking dates:", error);
        // Don't set error state for this, as it's not critical
      }
    };

    const fetchData = async () => {
      await Promise.all([fetchLastRankingDates(), fetchCurrentPositions()]);
    };

    fetchData();
  }, [keywords]);

  // Fetch rankings when selected keyword changes
  useEffect(() => {
    const fetchRankings = async () => {
      if (!selectedKeyword) return;

      try {
        setIsLoading(true);

        // Check if we have cached rankings for this keyword and period
        const cacheKey = selectedKeyword;
        const cachedData = rankingsCache[cacheKey];

        if (cachedData && cachedData.period === period) {
          // Use cached rankings if available for this period
          setRankings(cachedData.rankings);

          // Extract validation status from the latest ranking
          if (cachedData.rankings.length > 0) {
            const latestRanking = cachedData.rankings[0];
            if (latestRanking.metadata) {
              setValidationStatus({
                isValid: latestRanking.metadata.isValidationPassed,
                warnings: latestRanking.metadata.validationWarnings,
              });
            }
          }

          setIsLoading(false);
          return;
        }

        // Get date range based on selected period
        const { startDate, endDate } = getDateRangeForPeriod(period);

        console.log(
          `🔍 Fetching rankings for keyword ${selectedKeyword}, period ${period}`,
        );
        console.log(`📅 Date range: ${startDate} to ${endDate}`);
        console.log(
          `📅 Today's date: ${new Date().toISOString().split("T")[0]}`,
        );
        console.log(`📅 Current time: ${new Date().toISOString()}`);

        const response = await api.get("/api/v1/search-rankings/history", {
          params: {
            keywordId: selectedKeyword,
            startDate,
            endDate,
          },
        });

        const newRankings = response.data.rankings;
        console.log(`📊 Fetched ${newRankings.length} rankings from database`);

        // Update the rankings state
        setRankings(newRankings);

        // Extract validation status from the latest ranking
        if (newRankings.length > 0) {
          const latestRanking = newRankings[0];
          if (latestRanking.metadata) {
            setValidationStatus({
              isValid: latestRanking.metadata.isValidationPassed,
              warnings: latestRanking.metadata.validationWarnings,
            });
          }
        } else {
          setValidationStatus(undefined);
        }

        // Update the cache
        setRankingsCache((prevCache) => ({
          ...prevCache,
          [cacheKey]: {
            rankings: newRankings,
            period,
            lastFetched: new Date(),
          },
        }));
      } catch (error) {
        console.error("Error fetching rankings:", error);
        setError("Failed to fetch ranking history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [selectedKeyword, period]); // Removed rankingsCache from dependencies to prevent circular updates

  // Helper function to get date range based on period using Central Time
  function getDateRangeForPeriod(period: string) {
    const nowCT = getCurrentDateCT();
    let startDate = new Date(nowCT);
    let endDate = new Date(nowCT);

    // Set end date to end of current day in Central Time (23:59:59)
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case "last30Days": {
        startDate.setDate(nowCT.getDate() - 30);
        break;
      }
      case "last90Days": {
        startDate.setDate(nowCT.getDate() - 90);
        break;
      }
      case "lastYear": {
        startDate.setFullYear(nowCT.getFullYear() - 1);
        break;
      }
      case "all":
      default: {
        startDate = createDateCT(2000, 1, 1); // Far in the past
        break;
      }
    }

    // Set start date to beginning of day (00:00:00)
    startDate.setHours(0, 0, 0, 0);

    console.log(`🕐 Central Time date calculation:`);
    console.log(`   Current CT: ${nowCT.toISOString()}`);
    console.log(`   Start date: ${startDate.toISOString()}`);
    console.log(`   End date: ${endDate.toISOString()}`);
    console.log(`   Start formatted: ${formatDateCT(startDate)}`);
    console.log(`   End formatted: ${formatDateCT(endDate)}`);

    return {
      startDate: formatDateCT(startDate),
      endDate: endDate.toISOString(), // Use full timestamp for end date to include entire day
    };
  }

  // Handle keyword selection
  const handleKeywordSelect = (keywordId: string) => {
    setSelectedKeyword(keywordId);
  };

  // Handle keyword addition
  const handleAddKeyword = async (keyword: string) => {
    try {
      const response = await api.post("/api/v1/search-rankings/keywords", {
        keyword,
      });

      // Add the new keyword to the list
      setKeywords([...keywords, response.data.keyword]);

      // Select the new keyword
      setSelectedKeyword(response.data.keyword._id);

      return { success: true };
    } catch (error: any) {
      console.error("Error adding keyword:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to add keyword",
      };
    }
  };

  // Handle keyword deletion
  const handleDeleteKeyword = async (keywordId: string) => {
    try {
      await api.delete(`/api/v1/search-rankings/keywords/${keywordId}`);

      // Remove the keyword from the list
      const updatedKeywords = keywords.filter((k) => k._id !== keywordId);
      setKeywords(updatedKeywords);

      // If the deleted keyword was selected, select the first available keyword
      if (selectedKeyword === keywordId) {
        setSelectedKeyword(
          updatedKeywords.length > 0 ? updatedKeywords[0]._id : null,
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error deleting keyword:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete keyword",
      };
    }
  };

  // Handle keyword toggle (active/inactive)
  const handleToggleKeyword = async (keywordId: string, isActive: boolean) => {
    try {
      const response = await api.patch(
        `/api/v1/search-rankings/keywords/${keywordId}`,
        {
          isActive,
        },
      );

      // Update the keyword in the list
      const updatedKeywords = keywords.map((k) =>
        k._id === keywordId ? response.data.keyword : k,
      );

      setKeywords(updatedKeywords);

      return { success: true };
    } catch (error: any) {
      console.error("Error toggling keyword:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update keyword",
      };
    }
  };

  // Handle manual ranking check
  const handleCheckRanking = async (
    keywordId: string,
    searchDepth?: number,
  ) => {
    try {
      setIsCheckingRanking(true);

      console.log(
        `🚀 Starting ranking check for keyword ${keywordId}, depth: ${searchDepth || "default"}`,
      );

      const response = await api.post("/api/v1/search-rankings/check", {
        keywordId,
        searchDepth,
      });

      const newRanking = response.data.ranking;
      console.log(`✅ Received new ranking:`, newRanking);

      // Clear cache for this keyword to force fresh data fetch
      setRankingsCache((prevCache) => {
        const newCache = { ...prevCache };
        delete newCache[keywordId];
        console.log(`🗑️ Cleared cache for keyword ${keywordId}`);
        return newCache;
      });

      // Add the new ranking to the current rankings list
      const updatedRankings = [newRanking, ...rankings];
      setRankings(updatedRankings);

      // Update validation status from the new ranking
      if (newRanking.metadata) {
        setValidationStatus({
          isValid: newRanking.metadata.isValidationPassed,
          warnings: newRanking.metadata.validationWarnings,
        });
      }

      // Update the cache with the fresh data
      const cacheKey = keywordId;
      setRankingsCache((prevCache) => ({
        ...prevCache,
        [cacheKey]: {
          rankings: updatedRankings,
          period,
          lastFetched: new Date(),
        },
      }));

      console.log(`💾 Updated cache with ${updatedRankings.length} rankings`);

      // Update the last ranking dates with the new ranking
      setLastRankingDates((prevDates) => ({
        ...prevDates,
        [keywordId]: newRanking.date,
      }));

      // Update current positions with the new ranking
      setCurrentPositions((prevPositions) => ({
        ...prevPositions,
        [keywordId]: newRanking.position,
      }));

      return { success: true };
    } catch (error: any) {
      console.error("Error checking ranking:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to check ranking",
      };
    } finally {
      setIsCheckingRanking(false);
    }
  };

  // Fetch current positions for all keywords
  const fetchCurrentPositions = async () => {
    try {
      const response = await api.get(
        "/api/v1/search-rankings/current-positions",
      );
      setCurrentPositions(response.data.positions || {});
      console.log(
        `📊 Fetched current positions for ${Object.keys(response.data.positions || {}).length} keywords`,
      );
    } catch (error) {
      console.error("Error fetching current positions:", error);
      // Don't set error state for this, as it's not critical
    }
  };

  // Fetch job queue status
  const fetchQueueStatus = async () => {
    try {
      const response = await api.get(
        "/api/v1/search-rankings/cron?action=status",
      );
      setQueueStatus(response.data.result);
    } catch (error) {
      console.error("Error fetching queue status:", error);
    }
  };

  // Start polling queue status
  const startQueuePolling = () => {
    if (queuePollingInterval) {
      clearInterval(queuePollingInterval);
    }

    const interval = setInterval(async () => {
      if (!isBulkChecking) {
        clearInterval(interval);
        setQueuePollingInterval(null);
        return;
      }
      await fetchQueueStatus();
    }, 2000); // Poll every 2 seconds

    setQueuePollingInterval(interval);
  };

  // Stop polling queue status
  const stopQueuePolling = () => {
    if (queuePollingInterval) {
      clearInterval(queuePollingInterval);
      setQueuePollingInterval(null);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (queuePollingInterval) {
        clearInterval(queuePollingInterval);
      }
    };
  }, [queuePollingInterval]);

  // Handle bulk ranking check using new batch processing system
  const handleCheckAllKeywords = async () => {
    try {
      setIsBulkChecking(true);
      setBulkProgress("Starting batch processing for all keywords...");
      setBulkResults(null);

      console.log(`🚀 Starting batch processing for all keywords`);

      // Show initial progress - no job queue polling needed for batch processing
      setBulkProgress("Processing keywords directly (bypassing job queue)...");

      // Run batch processing (processes all keywords in one go)
      const batchResponse = await api.get(
        "/api/v1/search-rankings/cron?action=batch",
      );

      if (!batchResponse.data.result.success) {
        throw new Error(
          batchResponse.data.result.message || "Batch processing failed",
        );
      }

      const batchResult = batchResponse.data.result;
      console.log(`📦 Batch processing completed:`, batchResult);

      // Show completion status with details
      const completionMessage =
        batchResult.processedKeywords === batchResult.totalKeywords
          ? `✅ Batch processing completed! Processed all ${batchResult.processedKeywords} keywords in ${Math.round(batchResult.duration / 1000)}s`
          : `⚠️ Batch processing completed with timeout! Processed ${batchResult.processedKeywords}/${batchResult.totalKeywords} keywords in ${Math.round(batchResult.duration / 1000)}s`;

      setBulkProgress(completionMessage);

      setBulkResults({
        checkedCount: batchResult.processedKeywords,
        errorCount: batchResult.errors,
        significantChanges: batchResult.significantChanges,
        notificationsSent: batchResult.notifications,
        totalKeywords: batchResult.totalKeywords,
        timedOut: batchResult.processedKeywords < batchResult.totalKeywords,
      });

      // Clear all caches to force fresh data
      setRankingsCache({});
      console.log(`🗑️ Cleared all ranking caches`);

      // Refresh current keyword data if one is selected
      if (selectedKeyword) {
        try {
          const { startDate, endDate } = getDateRangeForPeriod(period);
          const historyResponse = await api.get(
            "/api/v1/search-rankings/history",
            {
              params: {
                keywordId: selectedKeyword,
                startDate,
                endDate,
              },
            },
          );

          const newRankings = historyResponse.data.rankings;
          setRankings(newRankings);

          // Update validation status from the latest ranking
          if (newRankings.length > 0) {
            const latestRanking = newRankings[0];
            if (latestRanking.metadata) {
              setValidationStatus({
                isValid: latestRanking.metadata.isValidationPassed,
                warnings: latestRanking.metadata.validationWarnings,
              });
            }
          }

          console.log(
            `🔄 Refreshed current keyword data with ${newRankings.length} rankings`,
          );
        } catch (refreshError) {
          console.error("Error refreshing current keyword data:", refreshError);
        }
      }

      // Refresh last ranking dates and current positions after batch operation
      try {
        const latestResponse = await api.get("/api/v1/search-rankings/latest");
        const dateMap: Record<string, Date> = {};
        Object.entries(latestResponse.data.lastRankingDates || {}).forEach(
          ([keywordId, dateStr]) => {
            dateMap[keywordId] = new Date(dateStr as string);
          },
        );
        setLastRankingDates(dateMap);
        console.log(
          `📅 Refreshed last ranking dates for ${Object.keys(dateMap).length} keywords after batch operation`,
        );
      } catch (refreshError) {
        console.error("Error refreshing last ranking dates:", refreshError);
      }

      // Refresh current positions after batch operation
      try {
        await fetchCurrentPositions();
      } catch (refreshError) {
        console.error("Error refreshing current positions:", refreshError);
      }

      // Auto-hide progress after 15 seconds (longer for timeout cases)
      setTimeout(() => {
        setBulkProgress("");
      }, 15000);
    } catch (error: any) {
      console.error("Error in batch processing:", error);
      setBulkProgress(
        `❌ Error: ${error.response?.data?.message || error.message}`,
      );

      // Auto-hide error after 15 seconds
      setTimeout(() => {
        setBulkProgress("");
      }, 15000);
    } finally {
      setIsBulkChecking(false);
    }
  };

  if (isLoading && keywords.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }

  if (error && keywords.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Search Rankings
          </h2>
          <div className="mt-1 flex items-center space-x-4">
            <a
              href="/admin/search-rankings/report-card"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              📊 View Report Card
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="/admin/competitors"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Manage Competitors →
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Job Queue Status Button */}
          <button
            onClick={() => {
              setShowQueueStatus(!showQueueStatus);
              if (!showQueueStatus) {
                fetchQueueStatus();
              }
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
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
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Queue Status
          </button>

          {/* Check All Keywords Button */}
          <button
            onClick={handleCheckAllKeywords}
            disabled={isBulkChecking || keywords.length === 0}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isBulkChecking || keywords.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            }`}
          >
            {isBulkChecking ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Checking...
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Check All Keywords
              </>
            )}
          </button>

          {/* Period Selector */}
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
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="last30Days">Last 30 Days</option>
              <option value="last90Days">Last 90 Days</option>
              <option value="lastYear">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Queue Status Dashboard - Hide during batch processing */}
      {showQueueStatus && !isBulkChecking && (
        <div className="mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Job Queue Status
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchQueueStatus}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={() => setShowQueueStatus(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {queueStatus ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {queueStatus.pending}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {queueStatus.processing}
                    </div>
                    <div className="text-sm text-gray-600">Processing</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {queueStatus.completed}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {queueStatus.failed}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                {queueStatus.total > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {Math.round(
                          ((queueStatus.completed + queueStatus.failed) /
                            queueStatus.total) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round(((queueStatus.completed + queueStatus.failed) / queueStatus.total) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Total Jobs:
                    </span>
                    <span className="ml-2">{queueStatus.total}</span>
                  </div>
                  {queueStatus.estimatedTimeRemaining && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Est. Time Remaining:
                      </span>
                      <span className="ml-2">
                        {Math.round(queueStatus.estimatedTimeRemaining / 60000)}{" "}
                        minutes
                      </span>
                    </div>
                  )}
                  {queueStatus.oldestPendingJob && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Oldest Pending:
                      </span>
                      <span className="ml-2">
                        {new Date(
                          queueStatus.oldestPendingJob,
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {queueStatus.newestCompletedJob && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Last Completed:
                      </span>
                      <span className="ml-2">
                        {new Date(
                          queueStatus.newestCompletedJob,
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Show different messages based on context */}
                {isBulkChecking && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span className="text-sm text-green-800">
                        <strong>Batch processing active:</strong> Old jobs are
                        being cleaned up and keywords processed directly. Queue
                        will be empty when complete.
                      </span>
                    </div>
                  </div>
                )}

                {!isBulkChecking && queueStatus.total === 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-gray-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">
                        Queue is clean. Use "Check All Keywords" for batch
                        processing or individual keyword checks.
                      </span>
                    </div>
                  </div>
                )}

                {!isBulkChecking &&
                  (queueStatus.pending > 0 || queueStatus.processing > 0) && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-blue-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm text-blue-800">
                          Jobs are processed automatically every 2 minutes by
                          the cron system.
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-4">
                <LoadingSpinner className="w-6 h-6 mx-auto mb-2" />
                <p className="text-gray-500">Loading queue status...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simple Batch Progress Display */}
      {isBulkChecking && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-blue-900">
                Batch Processing Active
              </h3>
              <div className="flex items-center">
                <LoadingSpinner className="w-5 h-5 mr-2 text-blue-600" />
                <span className="text-sm text-blue-700">Processing...</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-blue-800">Status:</span>
                <span className="font-medium text-blue-900">
                  Processing all keywords directly (bypassing job queue)
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-blue-800">Expected Duration:</span>
                <span className="font-medium text-blue-900">
                  ~50-60 seconds for all keywords
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-blue-800">Progress:</span>
                <span className="font-medium text-blue-900">
                  Processing in background - results will appear when complete
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-100 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Batch processing runs as a single
                operation. Progress updates will appear in the console logs and
                final results will be displayed when processing completes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Progress Display (fallback) */}
      {(bulkProgress || bulkResults) && !isBulkChecking && (
        <div className="mb-6">
          {bulkProgress && (
            <div
              className={`rounded-md p-4 ${
                bulkProgress.includes("❌")
                  ? "bg-red-50 border border-red-200"
                  : bulkProgress.includes("✅")
                    ? "bg-green-50 border border-green-200"
                    : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div className="flex items-center">
                <p
                  className={`text-sm font-medium ${
                    bulkProgress.includes("❌")
                      ? "text-red-800"
                      : bulkProgress.includes("✅")
                        ? "text-green-800"
                        : "text-blue-800"
                  }`}
                >
                  {bulkProgress}
                </p>
              </div>
            </div>
          )}

          {bulkResults && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Final Results:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Keywords Checked:
                  </span>
                  <span className="ml-2 text-green-600">
                    {bulkResults.checkedCount}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Errors:</span>
                  <span className="ml-2 text-red-600">
                    {bulkResults.errorCount || 0}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Significant Changes:
                  </span>
                  <span className="ml-2 text-orange-600">
                    {bulkResults.significantChanges || 0}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Notifications:
                  </span>
                  <span className="ml-2 text-blue-600">
                    {bulkResults.notificationsSent || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Keyword Manager */}
        <div className="lg:col-span-1">
          <KeywordManager
            keywords={keywords}
            selectedKeywordId={selectedKeyword}
            onSelectKeyword={handleKeywordSelect}
            onAddKeyword={handleAddKeyword}
            onDeleteKeyword={handleDeleteKeyword}
            onToggleKeyword={handleToggleKeyword}
            onCheckRanking={handleCheckRanking}
            isCheckingRanking={isCheckingRanking}
            lastRankingDates={lastRankingDates}
            currentPositions={currentPositions}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Report Card Summary - Always show */}
          <ReportCardSummary period={period} />

          {selectedKeyword ? (
            <>
              {/* Validation Panel - Show at top if there are validation issues */}
              {validationStatus &&
                (!validationStatus.isValid ||
                  validationStatus.warnings.length > 0) && (
                  <ValidationPanel validationStatus={validationStatus} />
                )}

              {/* Ranking Metrics */}
              <RankingMetrics rankings={rankings} />

              {/* Ranking History Chart */}
              <RankingHistory rankings={rankings} />

              {/* Competitor Analysis */}
              <CompetitorAnalysis
                rankings={rankings}
                managedCompetitors={competitors}
              />

              {/* Validation Panel - Show at bottom if no issues (for diagnostics) */}
              {(!validationStatus ||
                (validationStatus.isValid &&
                  validationStatus.warnings.length === 0)) && (
                <ValidationPanel validationStatus={validationStatus} />
              )}
            </>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">
                Select a keyword to view ranking data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
