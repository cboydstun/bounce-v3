"use client";

import React, { useEffect, useState } from "react";
import {
  getOptimizedEngagementMetrics,
  getLandingPagePerformance,
  getGeographicInsights,
  getPageCategoryPerformance,
  type OptimizedEngagementMetrics,
  type LandingPagePerformance,
  type GeographicInsights,
} from "@/utils/optimizedVisitorAnalytics";

interface LandingPageAnalyticsProps {
  dateRange?: { start: Date; end: Date };
}

export default function LandingPageAnalytics({
  dateRange,
}: LandingPageAnalyticsProps) {
  const [metrics, setMetrics] = useState<OptimizedEngagementMetrics | null>(
    null,
  );
  const [pagePerformance, setPagePerformance] = useState<
    LandingPagePerformance[]
  >([]);
  const [geoInsights, setGeoInsights] = useState<GeographicInsights | null>(
    null,
  );
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [metricsData, pageData, geoData, categoryData] =
          await Promise.all([
            getOptimizedEngagementMetrics(dateRange),
            getLandingPagePerformance(20, dateRange),
            getGeographicInsights(dateRange),
            getPageCategoryPerformance(dateRange),
          ]);

        setMetrics(metricsData);
        setPagePerformance(pageData);
        setGeoInsights(geoData);
        setCategoryPerformance(categoryData);
      } catch (err) {
        console.error("Error fetching landing page analytics:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Error loading analytics: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Total Visitors
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.totalVisitors.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Returning Visitors
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.returningVisitors.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              {metrics.totalVisitors > 0
                ? (
                    (metrics.returningVisitors / metrics.totalVisitors) *
                    100
                  ).toFixed(1)
                : 0}
              % return rate
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Avg. Pages/Visit
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.averagePagesPerVisit.toFixed(1)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Bounce Rate</h3>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.bounceRate.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Page Category Performance */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Landing Page Category Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Visitors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bounce Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryPerformance.map((category, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {category.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.visits.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.uniqueVisitors.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.conversionRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.bounceRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Landing Pages */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Top Landing Pages Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Visitors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bounce Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagePerformance.slice(0, 10).map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {page.url}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        page.category === "location"
                          ? "bg-green-100 text-green-800"
                          : page.category === "event"
                            ? "bg-purple-100 text-purple-800"
                            : page.category === "product"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {page.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.visits.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.uniqueVisitors.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.bounceRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.conversionRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(page.averageTimeOnPage)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geographic Insights */}
      {geoInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Interests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              Location Interest Analysis
            </h3>
            <div className="space-y-3">
              {geoInsights.locationInterests
                .slice(0, 8)
                .map((location, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {location.location.replace("-", " ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {location.visitors} visitors
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {location.conversionRate.toFixed(1)}% conversion
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Event Type Interests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              Event Type Interest Analysis
            </h3>
            <div className="space-y-3">
              {geoInsights.eventTypeInterests
                .slice(0, 8)
                .map((eventType, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {eventType.eventType.replace("-", " ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {eventType.visitors} visitors
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {eventType.conversionRate.toFixed(1)}% conversion
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Landing Pages by Category */}
      {metrics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Top Landing Pages by Visitors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.topLandingPages.map((page, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900">{page.page}</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      page.category === "location"
                        ? "bg-green-100 text-green-800"
                        : page.category === "event"
                          ? "bg-purple-100 text-purple-800"
                          : page.category === "product"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {page.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {page.visitors}
                  </p>
                  <p className="text-sm text-gray-600">visitors</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Landing Page Optimization Insights
        </h3>
        <div className="space-y-4">
          {categoryPerformance.length > 0 && (
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="font-medium">Top Performing Category</p>
              <p className="text-sm text-gray-600 mt-1">
                Your <strong>{categoryPerformance[0]?.category}</strong> pages
                are performing best with{" "}
                {categoryPerformance[0]?.visits.toLocaleString()} visits and{" "}
                {categoryPerformance[0]?.conversionRate.toFixed(1)}% conversion
                rate.
              </p>
            </div>
          )}

          {geoInsights && geoInsights.locationInterests.length > 0 && (
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <p className="font-medium">Geographic Opportunity</p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>
                  {geoInsights.locationInterests[0]?.location.replace("-", " ")}
                </strong>{" "}
                shows the highest interest with{" "}
                {geoInsights.locationInterests[0]?.visitors} visitors. Consider
                expanding marketing in this area.
              </p>
            </div>
          )}

          {pagePerformance.length > 0 && (
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-medium">Conversion Optimization</p>
              <p className="text-sm text-gray-600 mt-1">
                Your highest converting page is{" "}
                <strong>
                  {pagePerformance.find((p) => p.conversionRate > 0)?.url ||
                    "N/A"}
                </strong>{" "}
                with{" "}
                {pagePerformance
                  .find((p) => p.conversionRate > 0)
                  ?.conversionRate.toFixed(1) || 0}
                % conversion rate. Apply similar strategies to other pages.
              </p>
            </div>
          )}

          <div className="border-l-4 border-yellow-500 pl-4 py-2">
            <p className="font-medium">Landing Page Strategy</p>
            <p className="text-sm text-gray-600 mt-1">
              With {pagePerformance.length} active landing pages, focus on
              optimizing the top 5 performers and consider A/B testing different
              approaches for underperforming pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
