"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import KeywordManager from "@/components/search-rankings/KeywordManager";
import RankingHistory from "@/components/search-rankings/RankingHistory";
import RankingMetrics from "@/components/search-rankings/RankingMetrics";
import CompetitorAnalysis from "@/components/search-rankings/CompetitorAnalysis";
import {
  SearchKeyword,
  SearchRanking,
  ManagedCompetitor,
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
          setIsLoading(false);
          return;
        }

        // Get date range based on selected period
        const { startDate, endDate } = getDateRangeForPeriod(period);

        const response = await api.get("/api/v1/search-rankings/history", {
          params: {
            keywordId: selectedKeyword,
            startDate,
            endDate,
          },
        });

        const newRankings = response.data.rankings;

        // Update the rankings state
        setRankings(newRankings);

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
  }, [selectedKeyword, period, rankingsCache]);

  // Helper function to get date range based on period
  function getDateRangeForPeriod(period: string) {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case "last30Days": {
        startDate.setDate(now.getDate() - 30);
        break;
      }
      case "last90Days": {
        startDate.setDate(now.getDate() - 90);
        break;
      }
      case "lastYear": {
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      }
      case "all":
      default: {
        startDate.setFullYear(2000, 0, 1); // Far in the past
        break;
      }
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
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
  const handleCheckRanking = async (keywordId: string) => {
    try {
      setIsCheckingRanking(true);

      const response = await api.post("/api/v1/search-rankings/check", {
        keywordId,
      });

      const newRanking = response.data.ranking;

      // Add the new ranking to the current rankings list
      const updatedRankings = [newRanking, ...rankings];
      setRankings(updatedRankings);

      // Update the cache with the new ranking
      const cacheKey = keywordId;
      setRankingsCache((prevCache) => {
        // If we have cached data for this keyword, update it
        if (prevCache[cacheKey]) {
          return {
            ...prevCache,
            [cacheKey]: {
              ...prevCache[cacheKey],
              rankings: [newRanking, ...prevCache[cacheKey].rankings],
              lastFetched: new Date(),
            },
          };
        }

        // Otherwise, create a new cache entry
        return {
          ...prevCache,
          [cacheKey]: {
            rankings: updatedRankings,
            period,
            lastFetched: new Date(),
          },
        };
      });

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
              {/* Ranking Metrics */}
              <RankingMetrics rankings={rankings} />

              {/* Ranking History Chart */}
              <RankingHistory rankings={rankings} />

              {/* Competitor Analysis */}
              <CompetitorAnalysis
                rankings={rankings}
                managedCompetitors={competitors}
              />
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
