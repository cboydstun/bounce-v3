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

  // Handle bulk ranking check for all keywords
  const handleCheckAllKeywords = async () => {
    try {
      setIsBulkChecking(true);
      setBulkProgress("Initializing bulk ranking check...");
      setBulkResults(null);

      console.log(`🚀 Starting bulk ranking check for all keywords`);

      // Call the cron endpoint to trigger bulk checking
      const response = await api.get("/api/v1/search-rankings/cron");

      if (response.data.result) {
        setBulkResults(response.data.result);
        setBulkProgress(
          `✅ Completed! Checked ${response.data.result.checkedCount} keywords`,
        );

        // Clear all caches to force fresh data
        setRankingsCache({});
        console.log(`🗑️ Cleared all ranking caches`);

        // Refresh current keyword data if one is selected
        if (selectedKeyword) {
          // Trigger a refresh of the current keyword's data
          const { startDate, endDate } = getDateRangeForPeriod(period);

          try {
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
            console.error(
              "Error refreshing current keyword data:",
              refreshError,
            );
          }
        }
      } else {
        setBulkProgress("❌ Bulk check completed but no results returned");
      }

      // Auto-hide progress after 5 seconds
      setTimeout(() => {
        setBulkProgress("");
      }, 5000);
    } catch (error: any) {
      console.error("Error in bulk ranking check:", error);
      setBulkProgress(
        `❌ Error: ${error.response?.data?.message || error.message}`,
      );

      // Auto-hide error after 10 seconds
      setTimeout(() => {
        setBulkProgress("");
      }, 10000);
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
          <div className="mt-1">
            <a
              href="/admin/competitors"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Manage Competitors →
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
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

      {/* Bulk Progress Display */}
      {(bulkProgress || bulkResults) && (
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
                {isBulkChecking && <LoadingSpinner className="w-5 h-5 mr-3" />}
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

          {bulkResults && !isBulkChecking && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Bulk Check Results:
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
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
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
