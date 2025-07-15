import { useMemo, useState, useEffect } from "react";
import { SearchRanking } from "@/types/searchRanking";

interface RankingHistoryProps {
  rankings: SearchRanking[];
}

interface TooltipData {
  x: number;
  y: number;
  position: number;
  date: string;
  url: string;
  metadata?: SearchRanking["metadata"];
  trend?: "up" | "down" | "stable";
  change?: number;
}

export default function RankingHistory({ rankings }: RankingHistoryProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [chartDimensions, setChartDimensions] = useState({
    width: 800,
    height: 400,
  });

  // Handle responsive chart sizing
  useEffect(() => {
    const handleResize = () => {
      const container = document.querySelector(".chart-container");
      if (container) {
        const containerWidth = container.clientWidth;
        const isMobile = window.innerWidth < 768;

        setChartDimensions({
          width: Math.min(containerWidth - 32, isMobile ? 600 : 800),
          height: isMobile ? 300 : 400,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Sort rankings by date
  const sortedRankings = useMemo(() => {
    return [...rankings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [rankings]);

  // Prepare data for chart with trend analysis
  const chartData = useMemo(() => {
    // Filter out rankings where position is <= 0 (not found)
    const validRankings = sortedRankings.filter(
      (ranking) => ranking.position > 0,
    );

    if (validRankings.length === 0) {
      return { dates: [], positions: [], rankings: [], trends: [] };
    }

    const dates = validRankings.map((ranking) => {
      const date = new Date(ranking.date);
      const isMobile = window.innerWidth < 768;
      return isMobile
        ? `${date.getMonth() + 1}/${date.getDate()}`
        : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    });

    const positions = validRankings.map((ranking) => ranking.position);

    // Calculate trends between consecutive points
    const trends = positions.map((position, i) => {
      if (i === 0) return "stable";
      const previousPosition = positions[i - 1];
      const change = previousPosition - position;

      if (change > 0) return "up"; // Improved ranking (lower number)
      if (change < 0) return "down"; // Worse ranking (higher number)
      return "stable";
    });

    return { dates, positions, rankings: validRankings, trends };
  }, [sortedRankings]);

  // Calculate responsive chart dimensions
  const chartWidth = chartDimensions.width;
  const chartHeight = chartDimensions.height;
  const isMobile = window.innerWidth < 768;
  const padding = {
    top: 20,
    right: 30,
    bottom: isMobile ? 40 : 50,
    left: isMobile ? 40 : 50,
  };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Calculate scales
  const xScale = (index: number) =>
    (graphWidth * index) / Math.max(chartData.dates.length - 1, 1);
  const yScale = (position: number) => {
    if (chartData.positions.length === 0) return 0;
    const maxPosition = Math.max(...chartData.positions, 10);
    // Lower position numbers (better rankings) should appear higher on the graph
    return (graphHeight * position) / maxPosition;
  };

  // Calculate overall trend
  const overallTrend = useMemo(() => {
    if (chartData.positions.length < 2) return "stable";
    const firstPosition = chartData.positions[0];
    const lastPosition = chartData.positions[chartData.positions.length - 1];
    const change = firstPosition - lastPosition;

    if (change > 0) return "up";
    if (change < 0) return "down";
    return "stable";
  }, [chartData.positions]);

  // Handle tooltip
  const handleMouseEnter = (event: React.MouseEvent, index: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ranking = chartData.rankings[index];
    const position = chartData.positions[index];
    const trend = chartData.trends[index];

    let change = 0;
    if (index > 0) {
      change = chartData.positions[index - 1] - position;
    }

    setTooltip({
      x: event.clientX,
      y: event.clientY - 10,
      position,
      date: new Date(ranking.date).toLocaleString(),
      url: ranking.url,
      metadata: ranking.metadata,
      trend,
      change,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // Generate colored line segments based on trends
  const generateTrendSegments = () => {
    if (chartData.positions.length < 2) return [];

    const segments = [];
    for (let i = 0; i < chartData.positions.length - 1; i++) {
      const x1 = xScale(i);
      const y1 = yScale(chartData.positions[i]);
      const x2 = xScale(i + 1);
      const y2 = yScale(chartData.positions[i + 1]);

      const trend = chartData.trends[i + 1];
      let color = "#4F46E5"; // default blue

      if (trend === "up")
        color = "#10B981"; // green
      else if (trend === "down") color = "#EF4444"; // red

      segments.push({
        path: `M ${x1} ${y1} L ${x2} ${y2}`,
        color,
        trend,
      });
    }

    return segments;
  };

  const trendSegments = generateTrendSegments();

  // Generate path for the line
  const linePath =
    chartData.positions.length > 0
      ? chartData.positions
          .map((position, i) => {
            const x = xScale(i);
            const y = yScale(position);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ")
      : "";

  // Generate area under the line
  const areaPath =
    chartData.positions.length > 0
      ? `${linePath} L ${xScale(chartData.positions.length - 1)} ${graphHeight} L ${xScale(0)} ${graphHeight} Z`
      : "";

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Ranking History
      </h3>

      {rankings.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="mb-2">📊 No ranking data available</div>
          <div className="text-sm">
            Start by checking a keyword ranking to see your search performance
            over time.
          </div>
        </div>
      ) : chartData.positions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="mb-2">🔍 No valid ranking positions found</div>
          <div className="text-sm">
            Your site may not be appearing in search results yet, or all recent
            checks returned "not found".
          </div>
          <div className="text-sm mt-2">
            Try checking with a deeper search or different keywords.
          </div>
        </div>
      ) : chartData.positions.length === 1 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="mb-2">📈 Single data point available</div>
          <div className="text-sm">
            Position: #{chartData.positions[0]} on {chartData.dates[0]}
          </div>
          <div className="text-sm mt-2">
            Check rankings again to see trends over time.
          </div>
        </div>
      ) : (
        <div className="chart-container overflow-x-auto">
          <svg
            width={chartWidth}
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="mx-auto"
          >
            {/* Area under the line */}
            <path
              d={areaPath}
              fill="rgba(79, 70, 229, 0.1)"
              stroke="none"
              transform={`translate(${padding.left}, ${padding.top})`}
            />

            {/* Trend-colored line segments */}
            {trendSegments.map((segment, i) => (
              <path
                key={i}
                d={segment.path}
                fill="none"
                stroke={segment.color}
                strokeWidth="3"
                transform={`translate(${padding.left}, ${padding.top})`}
              />
            ))}

            {/* Data points with hover interaction */}
            {chartData.positions.map((position, i) => {
              const trend = chartData.trends[i];
              let pointColor = "#4F46E5";
              if (trend === "up") pointColor = "#10B981";
              else if (trend === "down") pointColor = "#EF4444";

              return (
                <circle
                  key={i}
                  cx={xScale(i) + padding.left}
                  cy={yScale(position) + padding.top}
                  r="5"
                  fill={pointColor}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-6 transition-all duration-200"
                  onMouseEnter={(e) => handleMouseEnter(e, i)}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })}

            {/* Trend indicators (small arrows) */}
            {chartData.trends.map((trend, i) => {
              if (i === 0 || trend === "stable") return null;

              const x = xScale(i) + padding.left;
              const y = yScale(chartData.positions[i]) + padding.top;

              return (
                <g key={`trend-${i}`}>
                  {trend === "up" && (
                    <polygon
                      points={`${x - 3},${y - 8} ${x + 3},${y - 8} ${x},${y - 12}`}
                      fill="#10B981"
                    />
                  )}
                  {trend === "down" && (
                    <polygon
                      points={`${x - 3},${y + 8} ${x + 3},${y + 8} ${x},${y + 12}`}
                      fill="#EF4444"
                    />
                  )}
                </g>
              );
            })}

            {/* X-axis */}
            <line
              x1={padding.left}
              y1={graphHeight + padding.top}
              x2={graphWidth + padding.left}
              y2={graphHeight + padding.top}
              stroke="#E5E7EB"
            />

            {/* X-axis labels (dates) */}
            {chartData.dates.map((date, i) => {
              // Only show every nth label to avoid overcrowding
              const n = Math.ceil(chartData.dates.length / 10);
              if (i % n !== 0 && i !== chartData.dates.length - 1) return null;

              return (
                <text
                  key={i}
                  x={xScale(i) + padding.left}
                  y={graphHeight + padding.top + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6B7280"
                >
                  {date}
                </text>
              );
            })}

            {/* Y-axis */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={graphHeight + padding.top}
              stroke="#E5E7EB"
            />

            {/* Y-axis labels (positions) */}
            {[1, 3, 5, 10].map((position) => (
              <g key={position}>
                <text
                  x={padding.left - 10}
                  y={yScale(position) + padding.top + 5}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6B7280"
                >
                  {position}
                </text>
                <line
                  x1={padding.left}
                  y1={yScale(position) + padding.top}
                  x2={graphWidth + padding.left}
                  y2={yScale(position) + padding.top}
                  stroke="#E5E7EB"
                  strokeDasharray="4"
                />
              </g>
            ))}

            {/* Axis labels */}
            <text
              x={chartWidth / 2}
              y={chartHeight - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#4B5563"
            >
              Date
            </text>
            <text
              x={-chartHeight / 2}
              y="15"
              textAnchor="middle"
              fontSize="14"
              fill="#4B5563"
              transform="rotate(-90)"
            >
              Position
            </text>
          </svg>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg pointer-events-none max-w-xs"
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 300),
            top: Math.max(tooltip.y - 100, 10),
          }}
        >
          <div className="font-semibold mb-1">Position #{tooltip.position}</div>
          <div className="text-xs text-gray-300 mb-2">{tooltip.date}</div>

          {tooltip.change !== undefined && tooltip.change !== 0 && (
            <div
              className={`text-xs mb-1 ${
                tooltip.change > 0
                  ? "text-green-400"
                  : tooltip.change < 0
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {tooltip.change > 0 ? "↗" : tooltip.change < 0 ? "↘" : "→"}
              {tooltip.change > 0 ? `+${tooltip.change}` : tooltip.change}{" "}
              positions
            </div>
          )}

          <div className="text-xs text-gray-300 mb-1 truncate">
            URL: {tooltip.url}
          </div>

          {tooltip.metadata && (
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-1 mt-1">
              <div>
                Search depth:{" "}
                {tooltip.metadata.searchDepth || tooltip.metadata.resultCount}
              </div>
              {tooltip.metadata.apiCallsUsed && (
                <div>API calls: {tooltip.metadata.apiCallsUsed}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div>
          <span className="text-gray-600">Stable</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Improving</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Declining</span>
        </div>
        {chartData.positions.length > 1 && (
          <div className="flex items-center">
            <span
              className={`text-sm font-medium ${
                overallTrend === "up"
                  ? "text-green-600"
                  : overallTrend === "down"
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              Overall:{" "}
              {overallTrend === "up"
                ? "↗ Improving"
                : overallTrend === "down"
                  ? "↘ Declining"
                  : "→ Stable"}
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Note */}
      <div className="mt-2 text-center text-xs text-gray-500">
        Lower position numbers are better (1 = top result). Hover over data
        points for details.
      </div>
    </div>
  );
}
