"use client";

import React from "react";

interface EngagementMetrics {
  averagePagesPerVisit: number;
  averageVisitCount: number;
  returningRate: number;
  totalVisitors: number;
  returningVisitors: number;
  averageReturnTime?: number;
}

interface VisitorEngagementMetricsProps {
  metrics: EngagementMetrics;
}

const VisitorEngagementMetrics: React.FC<VisitorEngagementMetricsProps> = ({
  metrics,
}) => {
  // Helper function to determine engagement level
  const getEngagementLevel = (pagesPerVisit: number) => {
    if (pagesPerVisit >= 4) return { level: "High", color: "green" };
    if (pagesPerVisit >= 2) return { level: "Medium", color: "yellow" };
    return { level: "Low", color: "red" };
  };

  // Helper function to determine return rate quality
  const getReturnRateQuality = (rate: number) => {
    if (rate >= 30) return { quality: "Excellent", color: "green" };
    if (rate >= 15) return { quality: "Good", color: "blue" };
    if (rate >= 5) return { quality: "Average", color: "yellow" };
    return { quality: "Needs Improvement", color: "red" };
  };

  const engagementLevel = getEngagementLevel(metrics.averagePagesPerVisit);
  const returnRateQuality = getReturnRateQuality(metrics.returningRate);

  // Format average return time in days
  const formattedReturnTime = metrics.averageReturnTime
    ? metrics.averageReturnTime < 1
      ? `${Math.round(metrics.averageReturnTime * 24)} hours`
      : `${metrics.averageReturnTime.toFixed(1)} days`
    : "N/A";

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Visitor Engagement</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 uppercase">Total Visitors</p>
          <p className="text-2xl font-bold">{metrics.totalVisitors}</p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 uppercase">Returning Visitors</p>
          <p className="text-2xl font-bold">{metrics.returningVisitors}</p>
          <p className="text-xs text-gray-500">
            {metrics.returningRate.toFixed(1)}% return rate
          </p>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 uppercase">Avg. Pages/Visit</p>
          <p className="text-2xl font-bold">
            {metrics.averagePagesPerVisit.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">
            <span className={`font-medium text-${engagementLevel.color}-600`}>
              {engagementLevel.level}
            </span>{" "}
            engagement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-medium">Return Rate Quality</p>
          <div className="flex items-center mt-2">
            <div
              className={`w-16 h-4 rounded-full bg-${returnRateQuality.color}-100 mr-3 relative`}
            >
              <div
                className={`absolute top-0 left-0 h-4 rounded-full bg-${returnRateQuality.color}-500`}
                style={{
                  width: `${Math.min(100, metrics.returningRate * 2)}%`,
                }}
              ></div>
            </div>
            <span
              className={`text-sm font-medium text-${returnRateQuality.color}-600`}
            >
              {returnRateQuality.quality}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.returningRate.toFixed(1)}% of visitors return to your site
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-medium">Average Return Time</p>
          <p className="text-xl font-bold mt-1">{formattedReturnTime}</p>
          <p className="text-xs text-gray-500 mt-1">
            Time between first and return visits
          </p>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p className="font-medium">Business Insights:</p>
        <ul className="list-disc list-inside mt-2 space-y-2">
          {metrics.returningRate < 10 && (
            <li>
              Your return rate is low. Consider implementing a follow-up email
              campaign for rental inquiries.
            </li>
          )}

          {metrics.averagePagesPerVisit < 2 && (
            <li>
              Visitors aren't exploring much of your site. Improve internal
              linking between related rental products.
            </li>
          )}

          {metrics.averageReturnTime && metrics.averageReturnTime > 30 && (
            <li>
              Long gap between return visits. Consider monthly promotions to
              encourage more frequent bookings.
            </li>
          )}

          {metrics.averageReturnTime &&
            metrics.averageReturnTime < 2 &&
            metrics.returningRate > 20 && (
              <li>
                Visitors return quickly! They may be comparing options. Add a
                comparison feature to your rental products.
              </li>
            )}

          {metrics.averagePagesPerVisit >= 4 && (
            <li>
              High page views per visit. Your visitors are engaged! Ensure your
              booking process is streamlined to convert this interest.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default VisitorEngagementMetrics;
