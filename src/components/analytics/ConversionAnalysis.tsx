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

interface ConversionAnalysisProps {
  totalContacts: number;
  confirmedContacts: number;
  conversionRate: number;
  statusCounts?: Record<string, number>;
  conversionByMonth?: Record<
    string,
    { total: number; statuses: Record<string, number> }
  >;
}

const ConversionAnalysis: React.FC<ConversionAnalysisProps> = ({
  totalContacts,
  confirmedContacts,
  conversionRate,
  statusCounts = {},
  conversionByMonth,
}) => {
  const [chartView, setChartView] = useState<"funnel" | "trend">("funnel");

  // Status colors mapping
  const statusColors = {
    Confirmed: "#10B981", // Green
    Pending: "#FBBF24", // Yellow
    "Called / Texted": "#3B82F6", // Blue
    Declined: "#EF4444", // Red
    Cancelled: "#6B7280", // Gray
  };

  // Funnel chart data with all statuses
  const funnelData = {
    labels: ["Total Contacts", ...Object.keys(statusCounts)],
    datasets: [
      {
        label: "Contacts",
        data: [totalContacts, ...Object.values(statusCounts)],
        backgroundColor: [
          "#3B82F6", // Blue for total
          ...Object.keys(statusCounts).map(
            (status) =>
              statusColors[status as keyof typeof statusColors] || "#9CA3AF",
          ),
        ],
      },
    ],
  };

  // Trend chart data (if available)
  const trendData = conversionByMonth
    ? {
        labels: Object.keys(conversionByMonth).map((monthKey) => {
          // Format month key (e.g., "2025-03" to "Mar 2025")
          const [year, monthNum] = monthKey.split("-");
          const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
          return date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          });
        }),
        datasets: [
          {
            label: "Total Contacts",
            data: Object.values(conversionByMonth).map((data) => data.total),
            backgroundColor: "#3B82F6",
          },
          // Create a dataset for each status
          ...Object.keys(statusColors).map((status) => {
            return {
              label: status,
              data: Object.values(conversionByMonth).map(
                (data) => data.statuses[status] || 0,
              ),
              backgroundColor:
                statusColors[status as keyof typeof statusColors],
            };
          }),
        ],
      }
    : null;

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
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  // Calculate conversion rates by month if data is available
  const conversionRatesByMonth = conversionByMonth
    ? Object.entries(conversionByMonth).map(([month, data]) => {
        // Use the "Confirmed" status count for the rate calculation
        const confirmedCount = data.statuses["Confirmed"] || 0;
        const rate = data.total > 0 ? (confirmedCount / data.total) * 100 : 0;
        // Format month key (e.g., "2025-03" to "Mar 2025")
        const [year, monthNum] = month.split("-");
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const formattedMonth = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        return { month: formattedMonth, rate };
      })
    : [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Conversion Analysis
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartView("funnel")}
            className={`px-3 py-1 text-sm rounded-md ${
              chartView === "funnel"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Funnel
          </button>
          <button
            onClick={() => setChartView("trend")}
            className={`px-3 py-1 text-sm rounded-md ${
              chartView === "trend"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
            disabled={!conversionByMonth}
          >
            Trend
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          {chartView === "funnel" ? (
            <div>
              <Bar data={funnelData} options={options} />
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Overall Conversion Rate:{" "}
                  <span className="font-semibold text-blue-600">
                    {conversionRate.toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
          ) : (
            trendData && <Bar data={trendData} options={options} />
          )}
        </div>

        {chartView === "trend" && conversionRatesByMonth.length > 0 && (
          <div className="w-full md:w-64 flex-shrink-0">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Monthly Conversion Rates
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {conversionRatesByMonth.map(({ month, rate }) => (
                <div
                  key={month}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-600">{month}</span>
                  <span
                    className={`font-medium ${
                      rate >= conversionRate ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {rate.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversionAnalysis;
