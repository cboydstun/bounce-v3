import { useMemo } from "react";
import { SearchRanking } from "@/types/searchRanking";

interface RankingMetricsProps {
  rankings: SearchRanking[];
}

// Helper function to get position color and context
const getPositionContext = (position: number | string) => {
  if (position === "N/A" || position === "Not Found") {
    return {
      bgColor: "bg-gray-50",
      textColor: "text-gray-900",
      borderColor: "border-gray-200",
      icon: "🔍",
      context: "Not ranking",
    };
  }

  const pos = typeof position === "string" ? parseInt(position) : position;

  if (pos <= 3) {
    return {
      bgColor: "bg-green-50",
      textColor: "text-green-900",
      borderColor: "border-green-200",
      icon: "🏆",
      context: "Excellent",
    };
  } else if (pos <= 10) {
    return {
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-900",
      borderColor: "border-yellow-200",
      icon: "📈",
      context: "Good",
    };
  } else {
    return {
      bgColor: "bg-red-50",
      textColor: "text-red-900",
      borderColor: "border-red-200",
      icon: "📉",
      context: "Needs improvement",
    };
  }
};

// Helper function to generate sparkline data
const generateSparklineData = (rankings: SearchRanking[]) => {
  if (rankings.length < 2) return [];

  const sortedRankings = [...rankings]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10); // Last 10 data points

  return sortedRankings.filter((r) => r.position > 0).map((r) => r.position);
};

// Simple Sparkline component
const Sparkline = ({
  data,
  width = 60,
  height = 20,
}: {
  data: number[];
  width?: number;
  height?: number;
}) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  // Determine line color based on trend
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const isImproving = lastValue < firstValue; // Lower position is better
  const lineColor = isImproving
    ? "#10B981"
    : lastValue > firstValue
      ? "#EF4444"
      : "#6B7280";

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function RankingMetrics({ rankings }: RankingMetricsProps) {
  // Calculate enhanced metrics
  const metrics = useMemo(() => {
    if (rankings.length === 0) {
      return {
        currentPosition: "N/A",
        averagePosition: "N/A",
        bestPosition: "N/A",
        worstPosition: "N/A",
        positionChange: null,
        positionChangeText: "N/A",
        positionChangeColor: "text-gray-500",
        volatility: "N/A",
        consistency: "N/A",
        trend: "stable",
        daysSinceBest: "N/A",
        sparklineData: [],
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

    // Valid positions only
    const validPositions = sortedRankings
      .map((r) => r.position)
      .filter((p) => p > 0);

    // Basic metrics
    const averagePosition =
      validPositions.length > 0
        ? (
            validPositions.reduce((sum, pos) => sum + pos, 0) /
            validPositions.length
          ).toFixed(1)
        : "N/A";

    const bestPosition =
      validPositions.length > 0 ? Math.min(...validPositions) : "N/A";

    const worstPosition =
      validPositions.length > 0 ? Math.max(...validPositions) : "N/A";

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

    // Advanced metrics
    let volatility = "N/A";
    let consistency = "N/A";
    let trend = "stable";
    let daysSinceBest = "N/A";

    if (validPositions.length > 1) {
      // Volatility (standard deviation)
      const avg = parseFloat(averagePosition);
      const variance =
        validPositions.reduce((sum, pos) => sum + Math.pow(pos - avg, 2), 0) /
        validPositions.length;
      volatility = Math.sqrt(variance).toFixed(1);

      // Consistency (percentage of time in results)
      consistency =
        ((validPositions.length / sortedRankings.length) * 100).toFixed(0) +
        "%";

      // Overall trend (first vs last position)
      if (validPositions.length >= 3) {
        const firstPos = validPositions[validPositions.length - 1];
        const lastPos = validPositions[0];
        const change = firstPos - lastPos;

        if (change > 2) trend = "improving";
        else if (change < -2) trend = "declining";
        else trend = "stable";
      }

      // Days since best position
      if (bestPosition !== "N/A" && typeof bestPosition === "number") {
        const bestRanking = sortedRankings.find(
          (r) => r.position === bestPosition,
        );
        if (bestRanking) {
          const daysDiff = Math.floor(
            (Date.now() - new Date(bestRanking.date).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          daysSinceBest = daysDiff === 0 ? "Today" : `${daysDiff} days ago`;
        }
      }
    }

    // Sparkline data
    const sparklineData = generateSparklineData(rankings);

    return {
      currentPosition,
      displayCurrentPosition,
      averagePosition,
      bestPosition,
      worstPosition,
      positionChange,
      positionChangeText,
      positionChangeColor,
      volatility,
      consistency,
      trend,
      daysSinceBest,
      sparklineData,
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

  // Get context for current position
  const currentContext = getPositionContext(
    metrics.displayCurrentPosition || "N/A",
  );
  const averageContext = getPositionContext(metrics.averagePosition || "N/A");
  const bestContext = getPositionContext(metrics.bestPosition || "N/A");

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Ranking Metrics</h3>
        {metrics.trend !== "stable" && (
          <div
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              metrics.trend === "improving"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {metrics.trend === "improving"
              ? "↗ Trending Up"
              : "↘ Trending Down"}
          </div>
        )}
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Current Position */}
        <div
          className={`${currentContext.bgColor} ${currentContext.borderColor} border rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">
              Current Position
            </div>
            <span className="text-lg">{currentContext.icon}</span>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-semibold ${currentContext.textColor} mb-1`}
          >
            {metrics.displayCurrentPosition}
          </div>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${metrics.positionChangeColor}`}>
              {metrics.positionChangeText}
            </div>
            {metrics.sparklineData.length > 0 && (
              <Sparkline data={metrics.sparklineData} width={50} height={16} />
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentContext.context}
          </div>
        </div>

        {/* Average Position */}
        <div
          className={`${averageContext.bgColor} ${averageContext.borderColor} border rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">
              Average Position
            </div>
            <span className="text-lg">📊</span>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-semibold ${averageContext.textColor} mb-1`}
          >
            {metrics.averagePosition}
          </div>
          <div className="text-sm text-gray-600">
            Volatility: {metrics.volatility}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {averageContext.context}
          </div>
        </div>

        {/* Best Position */}
        <div
          className={`${bestContext.bgColor} ${bestContext.borderColor} border rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">
              Best Position
            </div>
            <span className="text-lg">⭐</span>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-semibold ${bestContext.textColor} mb-1`}
          >
            {metrics.bestPosition}
          </div>
          <div className="text-sm text-gray-600">{metrics.daysSinceBest}</div>
          <div className="text-xs text-gray-500 mt-1">
            {bestContext.context}
          </div>
        </div>

        {/* Consistency & Last Check */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-500">Consistency</div>
            <span className="text-lg">🎯</span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-blue-900 mb-1">
            {metrics.consistency}
          </div>
          <div className="text-sm text-gray-600">
            Last: {lastCheckDate.split(",")[0]} {/* Show just date on mobile */}
          </div>
          <div className="text-xs text-gray-500 mt-1">Ranking frequency</div>
        </div>
      </div>

      {/* Advanced Metrics Row - Hidden on mobile, shown on larger screens */}
      {rankings.length > 2 && (
        <div className="hidden sm:grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-500 mb-1">Worst Position</div>
            <div className="text-xl font-semibold text-gray-900">
              {metrics.worstPosition}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-500 mb-1">Volatility</div>
            <div className="text-xl font-semibold text-gray-900">
              {metrics.volatility}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-500 mb-1">Data Points</div>
            <div className="text-xl font-semibold text-gray-900">
              {rankings.length}
            </div>
          </div>
        </div>
      )}

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
