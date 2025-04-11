"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IVisitor } from "@/types/visitor";
import api from "@/utils/api";
import {
  calculateReturningRate,
  calculateAverageReturnTime,
  getDeviceBreakdown,
  getReferrerBreakdown,
  getMostVisitedPages,
  getHighIntentVisitors,
  getSuspiciousVisitors,
  getEngagementMetrics,
  getTimePatterns,
} from "@/utils/visitorAnalytics";

// Import analytics components
import VisitorDeviceChart from "@/components/analytics/VisitorDeviceChart";
import ReferrerSourceChart from "@/components/analytics/ReferrerSourceChart";
import PopularPagesChart from "@/components/analytics/PopularPagesChart";
import VisitorEngagementMetrics from "@/components/analytics/VisitorEngagementMetrics";
import HighIntentVisitors from "@/components/analytics/HighIntentVisitors";
import SuspiciousActivityAlert from "@/components/analytics/SuspiciousActivityAlert";
import VisitorTimePatterns from "@/components/analytics/VisitorTimePatterns";
import ConversionFunnelAnalytics from "@/components/analytics/ConversionFunnelAnalytics";
import MarketingAttributionAnalytics from "@/components/analytics/MarketingAttributionAnalytics";
import FormEngagementAnalytics from "@/components/analytics/FormEngagementAnalytics";

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<IVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [activeTab, setActiveTab] = useState<
    "overview" | "visitors" | "insights" | "formEngagement"
  >("overview");
  const router = useRouter();

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        setLoading(true);
        // Use the API utility instead of fetch to automatically include auth headers
        const response = await api.get(
          `/api/v1/visitors?page=${pagination.page}&limit=${pagination.limit}&includeAdmin=false`,
        );
        const data = response.data;

        if (data.success) {
          setVisitors(data.visitors);
          setPagination(data.pagination);
        } else {
          throw new Error(data.error || "Failed to fetch visitors");
        }
      } catch (err) {
        // Handle authentication errors
        if (
          err instanceof Error &&
          (err.message.includes("401") ||
            err.message.includes("Authentication failed"))
        ) {
          console.error("Authentication error in fetchVisitors:", err);
          // Redirect to login page
          router.push("/login");
          return;
        }

        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        console.error("Error fetching visitors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitors();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Calculate analytics data
  const deviceData = getDeviceBreakdown(visitors);
  const referrerData = getReferrerBreakdown(visitors);
  const popularPages = getMostVisitedPages(visitors);
  const highIntentVisitors = getHighIntentVisitors(visitors);
  const suspiciousVisitors = getSuspiciousVisitors(visitors);
  const timePatterns = getTimePatterns(visitors);
  const returningVisitors = visitors.filter((v) => v.visitCount > 1);

  const engagementMetrics = {
    ...getEngagementMetrics(visitors),
    totalVisitors: pagination.total,
    returningVisitors: returningVisitors.length,
    averageReturnTime: calculateAverageReturnTime(visitors),
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Visitor Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <a
            href="/admin/visitors/update-locations"
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            Update Locations
          </a>
          <div className="text-sm text-gray-500">
            Total visitors: {pagination.total}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "insights"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("insights")}
        >
          Business Insights
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "formEngagement"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("formEngagement")}
        >
          Form Engagement
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "visitors"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("visitors")}
        >
          Visitor List
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : visitors.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">
            No visitor data available yet
          </h3>
          <p className="text-gray-500">
            As visitors browse your site, their data will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <VisitorEngagementMetrics metrics={engagementMetrics} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VisitorDeviceChart deviceData={deviceData} />
                <ReferrerSourceChart referrerData={referrerData} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PopularPagesChart pagesData={popularPages} />
                <VisitorTimePatterns
                  hourlyData={timePatterns.hourOfDay}
                  dailyData={timePatterns.dayOfWeek}
                />
              </div>
              <ConversionFunnelAnalytics visitors={visitors} />

              <MarketingAttributionAnalytics visitors={visitors} />
            </div>
          )}

          {/* Business Insights Tab */}
          {activeTab === "insights" && (
            <div className="space-y-6">
              <SuspiciousActivityAlert visitors={suspiciousVisitors} />
              <HighIntentVisitors visitors={highIntentVisitors} />

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">
                  Rental Business Recommendations
                </h3>

                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium">
                      Optimize for{" "}
                      {deviceData.percentages.Mobile > 50
                        ? "Mobile"
                        : "Desktop"}{" "}
                      Users
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {deviceData.percentages.Mobile > 50
                        ? "Most of your visitors use mobile devices. Ensure your rental booking process is optimized for small screens."
                        : "Most of your visitors use desktop computers. Consider showcasing detailed product galleries and information."}
                    </p>
                  </div>

                  {highIntentVisitors.length > 0 && (
                    <div className="border-l-4 border-green-500 pl-4 py-2">
                      <p className="font-medium">
                        Follow Up with High-Intent Visitors
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        You have {highIntentVisitors.length} high-intent
                        visitors who have viewed the same products multiple
                        times. Consider implementing a follow-up strategy for
                        these potential customers.
                      </p>
                    </div>
                  )}

                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <p className="font-medium">Focus on Popular Products</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {popularPages.some((page) =>
                        page.page.includes("/products/"),
                      )
                        ? `Your most viewed product page is "${popularPages
                            .find((page) => page.page.includes("/products/"))
                            ?.page.split("/")
                            .pop()
                            ?.replace(/-/g, " ")}". 
                                                   Ensure you have sufficient inventory and consider featuring it prominently.`
                        : "Focus on driving traffic to your product pages to increase rental conversions."}
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4 py-2">
                    <p className="font-medium">Optimize Marketing Channels</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {Object.entries(referrerData).length > 0
                        ? `Your top traffic source is ${Object.entries(referrerData).sort((a, b) => b[1] - a[1])[0][0]}. 
                                                   Consider increasing your marketing efforts on this platform.`
                        : "Most of your traffic is direct. Consider investing in referral channels to expand your reach."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Engagement Tab */}
          {activeTab === "formEngagement" && (
            <FormEngagementAnalytics visitors={visitors} />
          )}

          {/* Visitor List Tab */}
          {activeTab === "visitors" && (
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Visitor List</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visitor ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Visit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visit Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Browser
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visitors.map((visitor) => (
                      <tr
                        key={String(visitor._id)}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          router.push(`/admin/visitors/${visitor._id}`)
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {String(visitor.visitorId).substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(visitor.lastVisit).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.visitCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.device}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.browser?.name} {visitor.browser?.version}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.location
                            ? `${visitor.location.city || ""}, ${visitor.location.country || ""}`
                            : "Unknown"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: pagination.pages },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          page === pagination.page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === pagination.pages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
