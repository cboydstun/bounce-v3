import { useMemo } from "react";
import { SearchRanking } from "@/types/searchRanking";

interface RankingHistoryProps {
  rankings: SearchRanking[];
}

export default function RankingHistory({ rankings }: RankingHistoryProps) {
  // Sort rankings by date
  const sortedRankings = useMemo(() => {
    return [...rankings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rankings]);

  // Prepare data for chart
  const chartData = useMemo(() => {
    const dates = sortedRankings.map((ranking) => {
      const date = new Date(ranking.date);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    });
    
    const positions = sortedRankings.map((ranking) => ranking.position);
    
    return { dates, positions };
  }, [sortedRankings]);

  // Calculate chart dimensions
  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 20, right: 30, bottom: 50, left: 50 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Calculate scales
  const xScale = (index: number) => (graphWidth * index) / Math.max(chartData.dates.length - 1, 1);
  const yScale = (position: number) => {
    const maxPosition = Math.max(...chartData.positions, 10);
    // Invert the scale since lower position numbers are better
    return graphHeight - (graphHeight * position) / maxPosition;
  };

  // Generate path for the line
  const linePath = chartData.positions.length > 0
    ? chartData.positions
        .map((position, i) => {
          const x = xScale(i);
          const y = yScale(position);
          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ")
    : "";

  // Generate area under the line
  const areaPath = chartData.positions.length > 0
    ? `${linePath} L ${xScale(chartData.positions.length - 1)} ${graphHeight} L ${xScale(0)} ${graphHeight} Z`
    : "";

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Ranking History</h3>
      
      {rankings.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No ranking data available
        </div>
      ) : (
        <div className="overflow-x-auto">
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
            
            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2"
              transform={`translate(${padding.left}, ${padding.top})`}
            />
            
            {/* Data points */}
            {chartData.positions.map((position, i) => (
              <circle
                key={i}
                cx={xScale(i) + padding.left}
                cy={yScale(position) + padding.top}
                r="4"
                fill="#4F46E5"
              />
            ))}
            
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
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Position in search results</span>
        </div>
      </div>
      
      {/* Note */}
      <div className="mt-2 text-center text-xs text-gray-500">
        Lower position numbers are better (1 = top result)
      </div>
    </div>
  );
}
