"use client";

import React, { useState } from "react";
import { Line } from "react-chartjs-2";
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
  Filler,
);

interface VisitorTimePatternsProps {
  hourlyData: number[];
  dailyData: number[];
}

const VisitorTimePatterns: React.FC<VisitorTimePatternsProps> = ({
  hourlyData,
  dailyData,
}) => {
  const [activeTab, setActiveTab] = useState<"hourly" | "daily">("hourly");

  // Prepare hourly data
  const hourLabels = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const ampm = i < 12 ? "AM" : "PM";
    return `${hour}${ampm}`;
  });

  const hourlyChartData = {
    labels: hourLabels,
    datasets: [
      {
        label: "Visitor Activity",
        data: hourlyData,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Prepare daily data
  const dayLabels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const dailyChartData = {
    labels: dayLabels,
    datasets: [
      {
        label: "Visitor Activity",
        data: dailyData,
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Visits: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Page Views",
        },
      },
    },
  };

  // Get peak times
  const getPeakHour = () => {
    let maxValue = 0;
    let maxIndex = 0;

    hourlyData.forEach((value, index) => {
      if (value > maxValue) {
        maxValue = value;
        maxIndex = index;
      }
    });

    return {
      hour: maxIndex,
      value: maxValue,
      formatted: hourLabels[maxIndex],
    };
  };

  const getPeakDay = () => {
    let maxValue = 0;
    let maxIndex = 0;

    dailyData.forEach((value, index) => {
      if (value > maxValue) {
        maxValue = value;
        maxIndex = index;
      }
    });

    return {
      day: maxIndex,
      value: maxValue,
      formatted: dayLabels[maxIndex],
    };
  };

  const peakHour = getPeakHour();
  const peakDay = getPeakDay();

  // Get business insights
  const getHourlyInsight = () => {
    if (peakHour.hour >= 9 && peakHour.hour <= 17) {
      return "Your peak traffic is during business hours. Consider offering special business hour promotions for your rental products.";
    } else if (peakHour.hour >= 18 && peakHour.hour <= 22) {
      return "Your peak traffic is in the evening. Many visitors may be browsing after work, suggesting working professionals are interested in your rentals.";
    } else if (peakHour.hour >= 23 || peakHour.hour <= 5) {
      return "Your peak traffic is late night/early morning. Consider if you have international visitors or night owls interested in your rental products.";
    } else {
      return "Your peak traffic is in the morning. Consider scheduling social media posts during this time to maximize engagement.";
    }
  };

  const getDailyInsight = () => {
    if (peakDay.day === 0 || peakDay.day === 6) {
      return "Your peak traffic is on the weekend. Consider running weekend promotions for your rental products.";
    } else if (peakDay.day === 1) {
      return "Monday is your busiest day. Visitors may be planning their rentals for upcoming events at the start of the week.";
    } else if (peakDay.day === 5) {
      return "Friday is your busiest day. Visitors may be planning last-minute weekend rentals.";
    } else {
      return `${dayLabels[peakDay.day]} is your busiest day. Schedule your inventory updates and promotions to align with this pattern.`;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Visitor Timing Patterns</h3>

      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "hourly"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("hourly")}
        >
          Time of Day
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "daily"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("daily")}
        >
          Day of Week
        </button>
      </div>

      <div className="h-64 mb-6">
        {activeTab === "hourly" ? (
          <Line data={hourlyChartData} options={chartOptions} />
        ) : (
          <Line data={dailyChartData} options={chartOptions} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 uppercase">Peak Hour</p>
          <p className="text-xl font-bold">{peakHour.formatted}</p>
          <p className="text-sm text-gray-600">{peakHour.value} page views</p>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 uppercase">Peak Day</p>
          <p className="text-xl font-bold">{peakDay.formatted}</p>
          <p className="text-sm text-gray-600">{peakDay.value} page views</p>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium">Business Insight:</p>
        <p className="mt-1">
          {activeTab === "hourly" ? getHourlyInsight() : getDailyInsight()}
        </p>

        <div className="mt-4 bg-yellow-50 p-3 rounded-lg">
          <p className="font-medium text-yellow-800">
            Rental Business Recommendation:
          </p>
          <p className="mt-1 text-yellow-700">
            {activeTab === "hourly" ? (
              <>
                Schedule your customer service availability to align with peak
                hours ({peakHour.formatted}) to quickly respond to rental
                inquiries.
              </>
            ) : (
              <>
                Consider adjusting your inventory preparation and maintenance
                schedule to ensure maximum availability on {peakDay.formatted}s.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisitorTimePatterns;
