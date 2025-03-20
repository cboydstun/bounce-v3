"use client";

import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface ReferrerSourceChartProps {
  referrerData: { [key: string]: number };
}

const ReferrerSourceChart: React.FC<ReferrerSourceChartProps> = ({
  referrerData,
}) => {
  // Convert referrer data to arrays for chart
  const labels = Object.keys(referrerData);
  const values = Object.values(referrerData);
  const total = values.reduce((sum, value) => sum + value, 0);

  // Calculate percentages
  const percentages = values.map((value) => ((value / total) * 100).toFixed(1));

  // Color mapping for common referrers
  const getColor = (label: string, alpha: number = 0.7) => {
    const colorMap: { [key: string]: string } = {
      Google: `rgba(66, 133, 244, ${alpha})`,
      Facebook: `rgba(59, 89, 152, ${alpha})`,
      Instagram: `rgba(193, 53, 132, ${alpha})`,
      Twitter: `rgba(29, 161, 242, ${alpha})`,
      Pinterest: `rgba(189, 8, 28, ${alpha})`,
      Bing: `rgba(0, 120, 215, ${alpha})`,
      Yahoo: `rgba(125, 0, 133, ${alpha})`,
      Direct: `rgba(52, 168, 83, ${alpha})`,
      Other: `rgba(117, 117, 117, ${alpha})`,
    };

    return colorMap[label] || `rgba(117, 117, 117, ${alpha})`;
  };

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((label) => getColor(label)),
        borderColor: labels.map((label) => getColor(label, 1)),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.raw || 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Get top referrer
  let topReferrer = "None";
  let topReferrerValue = 0;

  Object.entries(referrerData).forEach(([source, count]) => {
    if (count > topReferrerValue) {
      topReferrerValue = count;
      topReferrer = source;
    }
  });

  // Calculate direct vs. referral traffic
  const directTraffic = referrerData["Direct"] || 0;
  const referralTraffic = total - directTraffic;
  const directPercentage =
    total > 0 ? ((directTraffic / total) * 100).toFixed(1) : "0";
  const referralPercentage =
    total > 0 ? ((referralTraffic / total) * 100).toFixed(1) : "0";

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
        <div className="bg-green-50 p-2 rounded">
          <p className="font-semibold">Direct Traffic</p>
          <p>{directPercentage}%</p>
        </div>
        <div className="bg-blue-50 p-2 rounded">
          <p className="font-semibold">Referral Traffic</p>
          <p>{referralPercentage}%</p>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium">Business Insight:</p>
        {topReferrer === "Direct" ? (
          <p>
            Most visitors come directly to your site. Consider investing in more
            referral channels to expand your reach.
          </p>
        ) : topReferrer === "Google" ? (
          <p>
            Google is your top traffic source. Ensure your SEO strategy is
            optimized for rental-related keywords.
          </p>
        ) : topReferrer.includes("Facebook") ||
          topReferrer.includes("Instagram") ? (
          <p>
            Social media is driving significant traffic. Consider increasing
            your presence on {topReferrer} with targeted ads for your rental
            business.
          </p>
        ) : (
          <p>
            Your top traffic source is {topReferrer}. Focus marketing efforts on
            this channel to maximize ROI.
          </p>
        )}
      </div>
    </div>
  );
};

export default ReferrerSourceChart;
