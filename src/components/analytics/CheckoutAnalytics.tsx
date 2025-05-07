"use client";

import React, { useState } from "react";
import { IVisitor } from "@/types/visitor";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  getBookingCounts,
  getAverageCheckoutTime,
  getCheckoutFunnelData,
  getStepAbandonmentData,
  getFieldFrictionData,
  getCheckoutDeviceData,
  getVisitorCheckoutJourneys,
} from "@/utils/checkoutAnalytics";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);

interface CheckoutAnalyticsProps {
  visitors: IVisitor[];
}

export default function CheckoutAnalytics({
  visitors,
}: CheckoutAnalyticsProps) {
  const [showAllJourneys, setShowAllJourneys] = useState(false);

  // Get analytics data
  const bookingCounts = getBookingCounts(visitors);
  const averageCheckoutTime = getAverageCheckoutTime(visitors);
  const funnelData = getCheckoutFunnelData(visitors);
  const abandonmentData = getStepAbandonmentData(visitors);
  const fieldFrictionData = getFieldFrictionData(visitors);
  const deviceData = getCheckoutDeviceData(visitors);
  const journeys = getVisitorCheckoutJourneys(
    visitors,
    showAllJourneys ? 50 : 10,
  );

  // Format time for display
  const formatTime = (minutes: number) => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)} sec`;
    }
    return `${Math.round(minutes)} min`;
  };

  // Format step name for display
  const formatStepName = (step: string) => {
    return step.charAt(0).toUpperCase() + step.slice(1);
  };

  // Get color based on completion rate
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 70) return "text-green-600";
    if (rate >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* 1. Overview Metrics Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Bookings Started
          </h3>
          <p className="text-2xl font-bold">{bookingCounts.bookingStarted}</p>
          <p className="text-xs text-gray-500">
            Total booking processes initiated
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Bookings Completed
          </h3>
          <p className="text-2xl font-bold">{bookingCounts.bookingCompleted}</p>
          <p className="text-xs text-gray-500">
            Successfully completed bookings
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
          <p
            className={`text-2xl font-bold ${getCompletionRateColor(bookingCounts.completionRate)}`}
          >
            {bookingCounts.completionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">
            Percentage of started bookings completed
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Avg. Checkout Time
          </h3>
          <p className="text-2xl font-bold">
            {formatTime(averageCheckoutTime)}
          </p>
          <p className="text-xs text-gray-500">
            Average time to complete checkout
          </p>
        </div>
      </div>

      {/* 2. Checkout Funnel Visualization */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Checkout Funnel</h3>
        <div className="h-80">
          <Bar
            data={funnelData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: true,
                  text: "Checkout Funnel Visualization",
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      return `Count: ${context.raw}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Number of Visitors",
                  },
                },
              },
            }}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            This funnel shows how many visitors progress through each step of
            the checkout process.
          </p>
          <p className="mt-1">
            The largest drop-offs occur at:
            <span className="font-medium">
              {funnelData.datasets[0].data[0] - funnelData.datasets[0].data[1] >
              funnelData.datasets[0].data[2] - funnelData.datasets[0].data[3]
                ? " Booking Started → Delivery View"
                : " Delivery Complete → Details View"}
            </span>
          </p>
        </div>
      </div>

      {/* 3. Step-Specific Abandonment Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Step Abandonment Analysis
        </h3>
        <div className="h-64">
          <Bar
            data={abandonmentData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: true,
                  text: "Abandonment & Error Rates by Step",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Rate (%)",
                  },
                  max: 100,
                },
              },
            }}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            This chart shows the percentage of users who abandon the checkout
            process at each step, as well as the error rate.
          </p>
          <p className="mt-1">
            Steps with high error rates often lead to abandonment. Focus on
            improving form validation and user guidance at these steps.
          </p>
        </div>
      </div>

      {/* 4. Field Friction Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Form Field Friction Analysis
        </h3>
        <div className="h-64">
          <Bar
            data={fieldFrictionData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              plugins: {
                legend: {
                  display: false,
                },
                title: {
                  display: true,
                  text: "Error Rate by Form Field",
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Error Rate (%)",
                  },
                  max: 100,
                },
              },
            }}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            This chart highlights form fields that cause the most friction for
            users, based on error rates.
          </p>
          <p className="mt-1">
            Fields with high error rates may need clearer instructions,
            different validation rules, or UI improvements.
          </p>
        </div>
      </div>

      {/* 5. Device Behavior Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Checkout Starts by Device
          </h3>
          <div className="h-64">
            <Doughnut
              data={deviceData.starts}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || "";
                        const value = context.raw as number;
                        const total = (
                          context.chart.data.datasets[0].data as number[]
                        ).reduce((a, b) => (a as number) + (b as number), 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Checkout Completions by Device
          </h3>
          <div className="h-64">
            <Doughnut
              data={deviceData.completions}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || "";
                        const value = context.raw as number;
                        const total = (
                          context.chart.data.datasets[0].data as number[]
                        ).reduce((a, b) => (a as number) + (b as number), 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Device Completion Rates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Mobile</h4>
              <p
                className={`text-2xl font-bold ${getCompletionRateColor(deviceData.completionRates.Mobile)}`}
              >
                {deviceData.completionRates.Mobile.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                Mobile checkout completion rate
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Desktop</h4>
              <p
                className={`text-2xl font-bold ${getCompletionRateColor(deviceData.completionRates.Desktop)}`}
              >
                {deviceData.completionRates.Desktop.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                Desktop checkout completion rate
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Tablet</h4>
              <p
                className={`text-2xl font-bold ${getCompletionRateColor(deviceData.completionRates.Tablet)}`}
              >
                {deviceData.completionRates.Tablet.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                Tablet checkout completion rate
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              {deviceData.completionRates.Mobile <
              deviceData.completionRates.Desktop
                ? "Mobile users have a lower completion rate than desktop users. Consider optimizing the mobile checkout experience."
                : "Mobile users have a higher completion rate than desktop users. Your mobile checkout experience is performing well."}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Detailed Visitor Journeys */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Visitor Checkout Journeys</h3>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
            onClick={() => setShowAllJourneys(!showAllJourneys)}
          >
            {showAllJourneys ? "Show Less" : "View More Journeys"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visitor ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Steps Viewed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Steps Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outcome
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {journeys.length > 0 ? (
                journeys.map((journey, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {journey.visitorId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {journey.stepsViewed.map(formatStepName).join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {journey.stepsCompleted.map(formatStepName).join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {journey.errors.length > 0
                        ? journey.errors.join(", ")
                        : "None"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {journey.device || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {journey.outcome === "Completed" ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      ) : journey.outcome === "Started" ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Started
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Abandoned
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No checkout journeys found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Checkout Optimization Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Checkout Optimization Recommendations
        </h3>

        <div className="space-y-4">
          {/* Completion Rate Recommendation */}
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium">Checkout Completion Rate</p>
            <p className="text-sm text-gray-600 mt-1">
              {bookingCounts.completionRate < 40
                ? "Your checkout completion rate is low. Consider simplifying the checkout process and reducing the number of required fields."
                : bookingCounts.completionRate < 70
                  ? "Your checkout completion rate is average. Look for specific steps where users drop off and focus on improving those areas."
                  : "Your checkout completion rate is good. Continue monitoring for any changes in user behavior."}
            </p>
          </div>

          {/* Device-Specific Recommendation */}
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <p className="font-medium">Device Optimization</p>
            <p className="text-sm text-gray-600 mt-1">
              {deviceData.completionRates.Mobile <
              deviceData.completionRates.Desktop
                ? `Mobile users have a ${(deviceData.completionRates.Desktop - deviceData.completionRates.Mobile).toFixed(1)}% lower completion rate than desktop users. Optimize the mobile checkout experience by simplifying forms and improving touch interactions.`
                : deviceData.completionRates.Desktop <
                    deviceData.completionRates.Mobile
                  ? `Desktop users have a ${(deviceData.completionRates.Mobile - deviceData.completionRates.Desktop).toFixed(1)}% lower completion rate than mobile users. Review the desktop checkout flow for potential usability issues.`
                  : "Your checkout performs similarly across devices. Continue to ensure a consistent experience across all platforms."}
            </p>
          </div>

          {/* Form Field Recommendation */}
          {fieldFrictionData.datasets[0].data.length > 0 && (
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <p className="font-medium">Form Field Improvements</p>
              <p className="text-sm text-gray-600 mt-1">
                The "{fieldFrictionData.labels[0]}" field has the highest error
                rate at {fieldFrictionData.datasets[0].data[0].toFixed(1)}%.
                Consider providing clearer instructions, examples, or validation
                feedback for this field.
              </p>
            </div>
          )}

          {/* Checkout Time Recommendation */}
          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <p className="font-medium">Checkout Time</p>
            <p className="text-sm text-gray-600 mt-1">
              {averageCheckoutTime > 5
                ? `Your average checkout time of ${formatTime(averageCheckoutTime)} is relatively long. Look for ways to streamline the process and reduce the number of steps.`
                : `Your average checkout time of ${formatTime(averageCheckoutTime)} is good. Continue to monitor for any increases that might indicate new friction points.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
