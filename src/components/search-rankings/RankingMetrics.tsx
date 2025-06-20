import { useMemo } from "react";
import { SearchRanking } from "@/types/searchRanking";

interface RankingMetricsProps {
  rankings: SearchRanking[];
}

export default function RankingMetrics({ rankings }: RankingMetricsProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    if (rankings.length === 0) {
      return {
        currentPosition: "N/A",
        averagePosition: "N/A",
        bestPosition: "N/A",
        positionChange: null,
        positionChangeText: "N/A",
        positionChangeColor: "text-gray-500",
      };
    }

    // Sort rankings by date (newest first)
    const sortedRankings = [...rankings].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Current position (most recent)
    const currentPosition = sortedRankings[0].position;
    const displayCurrentPosition =
      currentPosition > 0 ? currentPosition : "Not Found";

    // Average position
    const validPositions = sortedRankings
      .map((r) => r.position)
      .filter((p) => p > 0);
    const averagePosition =
      validPositions.length > 0
        ? (
            validPositions.reduce((sum, pos) => sum + pos, 0) /
            validPositions.length
          ).toFixed(1)
        : "N/A";

    // Best position
    const bestPosition =
      validPositions.length > 0 ? Math.min(...validPositions) : "N/A";

    // Position change (compared to previous check)
    let positionChange = null;
    let positionChangeText = "N/A";
    let positionChangeColor = "text-gray-500";

    if (sortedRankings.length >= 2) {
      const previousPosition = sortedRankings[1].position;

      if (previousPosition > 0 && currentPosition > 0) {
        positionChange = previousPosition - currentPosition;

        // Positive change means improvement (moving up in rankings)
        if (positionChange > 0) {
          positionChangeText = `↑ ${positionChange}`;
          positionChangeColor = "text-green-600";
        } else if (positionChange < 0) {
          positionChangeText = `↓ ${Math.abs(positionChange)}`;
          positionChangeColor = "text-red-600";
        } else {
          positionChangeText = "No change";
          positionChangeColor = "text-gray-500";
        }
      }
    }

    return {
      currentPosition,
      displayCurrentPosition,
      averagePosition,
      bestPosition,
      positionChange,
      positionChangeText,
      positionChangeColor,
    };
  }, [rankings]);

  // Format date for last check
  const lastCheckDate = useMemo(() => {
    if (rankings.length === 0) return "Never";

    // Sort rankings by date (newest first)
    const sortedRankings = [...rankings].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Format the date
    const date = new Date(sortedRankings[0].date);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [rankings]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Ranking Metrics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Position */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">
            Current Position
          </div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {metrics.displayCurrentPosition}
          </div>
          <div className={`mt-1 text-sm ${metrics.positionChangeColor}`}>
            {metrics.positionChangeText}
          </div>
        </div>

        {/* Average Position */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">
            Average Position
          </div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {metrics.averagePosition}
          </div>
        </div>

        {/* Best Position */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Best Position</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {metrics.bestPosition}
          </div>
        </div>

        {/* Last Check */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Last Check</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">
            {lastCheckDate}
          </div>
        </div>
      </div>

      {/* Enhanced Search Information */}
      {rankings.length > 0 && rankings[0].metadata && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Latest Search Details
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Search Depth:</span>
              <span className="ml-2 font-medium">
                {rankings[0].metadata.searchDepth ||
                  rankings[0].metadata.resultCount}{" "}
                positions
              </span>
            </div>
            <div>
              <span className="text-gray-500">API Calls:</span>
              <span className="ml-2 font-medium">
                {rankings[0].metadata.apiCallsUsed || 1}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Results:</span>
              <span className="ml-2 font-medium">
                {parseInt(rankings[0].metadata.totalResults).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Search Time:</span>
              <span className="ml-2 font-medium">
                {rankings[0].metadata.searchTime}s
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500 text-center">
        Position refers to where your website appears in Google search results
        (1 = top result). Enhanced search now checks up to 50 positions by
        default.
      </div>
    </div>
  );
}
