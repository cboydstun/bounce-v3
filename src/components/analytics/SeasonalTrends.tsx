"use client";

import { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface SeasonalTrendsProps {
  weeklyData?: Record<string, number>;
  monthlyData: Record<string, number>;
  quarterlyData?: Record<string, number>;
}

const SeasonalTrends: React.FC<SeasonalTrendsProps> = ({
  weeklyData,
  monthlyData,
  quarterlyData,
}) => {
  const [periodType, setPeriodType] = useState<
    "weekly" | "monthly" | "quarterly"
  >("monthly");

  // Determine which data to use based on the selected period type
  const currentData = (() => {
    switch (periodType) {
      case "weekly":
        return weeklyData || {};
      case "monthly":
        return monthlyData;
      case "quarterly":
        return quarterlyData || {};
      default:
        return monthlyData;
    }
  })();

  // Sort data for display
  const sortedData = (() => {
    if (periodType === "monthly") {
      // Sort months in calendar order
      const monthOrder = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      return Object.entries(currentData)
        .sort(([monthA], [monthB]) => {
          return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
        })
        .reduce(
          (acc, [month, count]) => {
            acc.labels.push(month);
            acc.values.push(count);
            return acc;
          },
          { labels: [] as string[], values: [] as number[] },
        );
    } else if (periodType === "quarterly") {
      // Sort quarters in order
      const quarterOrder = ["Q1", "Q2", "Q3", "Q4"];

      return Object.entries(currentData)
        .sort(([quarterA], [quarterB]) => {
          return (
            quarterOrder.indexOf(quarterA) - quarterOrder.indexOf(quarterB)
          );
        })
        .reduce(
          (acc, [quarter, count]) => {
            acc.labels.push(quarter);
            acc.values.push(count);
            return acc;
          },
          { labels: [] as string[], values: [] as number[] },
        );
    } else {
      // Sort weeks numerically
      return Object.entries(currentData)
        .sort(([weekA], [weekB]) => {
          const numA = parseInt(weekA.replace("Week ", ""));
          const numB = parseInt(weekB.replace("Week ", ""));
          return numA - numB;
        })
        .reduce(
          (acc, [week, count]) => {
            acc.labels.push(week);
            acc.values.push(count);
            return acc;
          },
          { labels: [] as string[], values: [] as number[] },
        );
    }
  })();

  // Find peak and low periods
  const maxValue = Math.max(...sortedData.values);
  const minValue = Math.min(...sortedData.values);
  const peakPeriods = sortedData.labels.filter(
    (_, index) => sortedData.values[index] === maxValue,
  );
  const lowPeriods = sortedData.labels.filter(
    (_, index) => sortedData.values[index] === minValue,
  );

  // Calculate average bookings per period
  const averageBookings =
    sortedData.values.reduce((sum, val) => sum + val, 0) /
      sortedData.values.length || 0;

  // Chart data
  const chartData = {
    labels: sortedData.labels,
    datasets: [
      {
        label: "Bookings",
        data: sortedData.values,
        backgroundColor: sortedData.values.map((value) => {
          if (value === maxValue) return "rgba(16, 185, 129, 0.8)"; // Peak (green)
          if (value === minValue) return "rgba(239, 68, 68, 0.8)"; // Low (red)
          return "rgba(59, 130, 246, 0.8)"; // Normal (blue)
        }),
        borderWidth: 1,
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
          precision: 0, // Only show whole numbers
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            const percent = ((value / averageBookings) * 100 - 100).toFixed(1);
            const sign = percent.startsWith("-") ? "" : "+";
            return `${label}: ${value} (${sign}${percent}% vs avg)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Seasonal Trends</h3>
        <div className="flex space-x-2">
          {weeklyData && (
            <button
              onClick={() => setPeriodType("weekly")}
              className={`px-3 py-1 text-sm rounded-md ${
                periodType === "weekly"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              Weekly
            </button>
          )}
          <button
            onClick={() => setPeriodType("monthly")}
            className={`px-3 py-1 text-sm rounded-md ${
              periodType === "monthly"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Monthly
          </button>
          {quarterlyData && (
            <button
              onClick={() => setPeriodType("quarterly")}
              className={`px-3 py-1 text-sm rounded-md ${
                periodType === "quarterly"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              Quarterly
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <Bar data={chartData} options={options} />
        </div>

        <div className="w-full md:w-64 flex-shrink-0 space-y-4">
          <div className="bg-green-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-green-800 mb-1">
              Peak{" "}
              {periodType === "weekly"
                ? "Weeks"
                : periodType === "monthly"
                  ? "Months"
                  : "Quarters"}
            </h4>
            <p className="text-sm text-green-700">
              {peakPeriods.join(", ")} ({maxValue} bookings)
            </p>
          </div>

          <div className="bg-red-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-red-800 mb-1">
              Low{" "}
              {periodType === "weekly"
                ? "Weeks"
                : periodType === "monthly"
                  ? "Months"
                  : "Quarters"}
            </h4>
            <p className="text-sm text-red-700">
              {lowPeriods.join(", ")} ({minValue} bookings)
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Average Bookings
            </h4>
            <p className="text-sm text-blue-700">
              {averageBookings.toFixed(1)} per {periodType.slice(0, -2)}
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-800 mb-1">
              Business Insights
            </h4>
            <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
              <li>
                Consider promotions during {lowPeriods.join(", ")} to boost
                bookings
              </li>
              <li>Ensure adequate inventory for {peakPeriods.join(", ")}</li>
              <li>
                {maxValue > averageBookings * 1.5
                  ? "Significant seasonal variation detected"
                  : "Relatively stable booking pattern throughout the year"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalTrends;
