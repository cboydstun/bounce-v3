"use client";

import { useState } from "react";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "@/utils/analytics";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ForecastChartProps {
  historicalData: {
    dates: string[];
    values: number[];
  };
  forecastData: {
    dates: string[];
    values: number[];
  };
  type: "revenue" | "bookings";
}

const ForecastChart: React.FC<ForecastChartProps> = ({
  historicalData,
  forecastData,
  type,
}) => {
  const [forecastPeriods, setForecastPeriods] = useState<number>(3);

  // Format dates for display
  const formatDate = (dateStr: string) => {
    // Handle different date formats (YYYY-MM or YYYY-MM-DD)
    const parts = dateStr.split("-");
    if (parts.length === 2) {
      // YYYY-MM format
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      return date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
    } else if (parts.length === 3) {
      // YYYY-MM-DD format
      const date = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2])
      );
      return date.toLocaleString("default", { month: "short", day: "numeric" });
    }
    return dateStr;
  };

  // Combine historical and forecast data
  const combinedDates = [
    ...historicalData.dates,
    ...forecastData.dates.slice(0, forecastPeriods),
  ];

  const combinedValues = [
    ...historicalData.values,
    ...forecastData.values.slice(0, forecastPeriods),
  ];

  // Format labels
  const labels = combinedDates.map(formatDate);

  // Determine the index where forecast data starts
  const forecastStartIndex = historicalData.dates.length;

  // Create chart data
  const chartData = {
    labels,
    datasets: [
      {
        label: "Historical",
        data: combinedValues.map((value, index) =>
          index < forecastStartIndex ? value : null
        ),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        pointBackgroundColor: "#3B82F6",
        tension: 0.3,
        fill: false,
      },
      {
        label: "Forecast",
        data: combinedValues.map((value, index) =>
          index >= forecastStartIndex ? value : null
        ),
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: "#8B5CF6",
        tension: 0.3,
        fill: false,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (this: any, value: string | number) {
            const numValue =
              typeof value === "string" ? parseFloat(value) : value;
            return type === "revenue"
              ? formatCurrency(numValue)
              : numValue.toLocaleString();
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            const formattedValue =
              type === "revenue"
                ? formatCurrency(value)
                : value.toLocaleString();
            return `${label}: ${formattedValue}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          {type === "revenue" ? "Revenue Forecast" : "Bookings Forecast"}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Forecast periods:</span>
          <select
            value={forecastPeriods}
            onChange={(e) => setForecastPeriods(parseInt(e.target.value))}
            className="rounded-md border-gray-300 text-sm py-1"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={6}>6</option>
            <option value={12}>12</option>
          </select>
        </div>
      </div>

      <Line data={chartData} options={options} />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-1">
            Historical Average
          </h4>
          <p className="text-lg font-semibold text-blue-900">
            {type === "revenue"
              ? formatCurrency(
                  historicalData.values.reduce((sum, val) => sum + val, 0) /
                    historicalData.values.length || 0
                )
              : (
                  historicalData.values.reduce((sum, val) => sum + val, 0) /
                    historicalData.values.length || 0
                ).toFixed(1)}
            {type === "bookings" ? " bookings/period" : ""}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-purple-800 mb-1">
            Forecast Average
          </h4>
          <p className="text-lg font-semibold text-purple-900">
            {type === "revenue"
              ? formatCurrency(
                  forecastData.values
                    .slice(0, forecastPeriods)
                    .reduce((sum, val) => sum + val, 0) / forecastPeriods || 0
                )
              : (
                  forecastData.values
                    .slice(0, forecastPeriods)
                    .reduce((sum, val) => sum + val, 0) / forecastPeriods || 0
                ).toFixed(1)}
            {type === "bookings" ? " bookings/period" : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          * Forecast is based on a simple moving average of historical data.
          Actual results may vary.
        </p>
      </div>
    </div>
  );
};

export default ForecastChart;
