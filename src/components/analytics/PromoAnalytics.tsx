"use client";

import React, { useEffect, useState } from "react";
import { IVisitor } from "@/types/visitor";

interface PromoAnalyticsProps {
  visitors: IVisitor[];
}

interface PromoMetrics {
  totalImpressions: number;
  totalConversions: number;
  conversionRate: number;
  averageViewDuration: number;
  topPerformingPromos: Array<{
    name: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    averageViewDuration: number;
  }>;
  dismissalReasons: {
    [key: string]: number;
  };
  devicePerformance: {
    mobile: { impressions: number; conversions: number };
    tablet: { impressions: number; conversions: number };
    desktop: { impressions: number; conversions: number };
  };
  seasonalTrends: Array<{
    promoType: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
  }>;
}

export default function PromoAnalytics({ visitors }: PromoAnalyticsProps) {
  const [metrics, setMetrics] = useState<PromoMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculatePromoMetrics = () => {
      setLoading(true);

      // Extract all promo-related interactions
      const promoInteractions = visitors.flatMap((visitor) =>
        (visitor.interactions || [])
          .filter(
            (interaction) =>
              interaction.type.includes("promo_modal") ||
              interaction.type.includes("promo_"),
          )
          .map((interaction) => ({
            ...interaction,
            visitorId: visitor.visitorId,
            device: visitor.device,
          })),
      );

      // Group by promo name
      const promoGroups: { [key: string]: any[] } = {};
      promoInteractions.forEach((interaction) => {
        const promoName =
          interaction.data?.promo_name ||
          interaction.data?.promo_campaign ||
          "Unknown";
        if (!promoGroups[promoName]) {
          promoGroups[promoName] = [];
        }
        promoGroups[promoName].push(interaction);
      });

      // Calculate metrics for each promo
      const promoMetrics = Object.entries(promoGroups)
        .map(([promoName, interactions]) => {
          const impressions = interactions.filter(
            (i) => i.type === "promo_modal_displayed",
          ).length;
          const conversions = interactions.filter(
            (i) => i.type === "promo_modal_converted",
          ).length;
          const viewDurations = interactions
            .filter((i) => i.data?.view_duration_seconds)
            .map((i) => i.data!.view_duration_seconds);

          return {
            name: promoName,
            impressions,
            conversions,
            conversionRate:
              impressions > 0 ? (conversions / impressions) * 100 : 0,
            averageViewDuration:
              viewDurations.length > 0
                ? viewDurations.reduce((a, b) => a + b, 0) /
                  viewDurations.length
                : 0,
          };
        })
        .sort((a, b) => b.conversionRate - a.conversionRate);

      // Calculate dismissal reasons
      const dismissalReasons: { [key: string]: number } = {};
      promoInteractions
        .filter((i) => i.type === "promo_modal_closed")
        .forEach((interaction) => {
          const reason = interaction.data?.close_method || "unknown";
          dismissalReasons[reason] = (dismissalReasons[reason] || 0) + 1;
        });

      // Calculate device performance
      const devicePerformance = {
        mobile: { impressions: 0, conversions: 0 },
        tablet: { impressions: 0, conversions: 0 },
        desktop: { impressions: 0, conversions: 0 },
      };

      promoInteractions.forEach((interaction) => {
        const device = interaction.device?.toLowerCase() || "desktop";
        if (interaction.type === "promo_modal_displayed") {
          if (device === "mobile") devicePerformance.mobile.impressions++;
          else if (device === "tablet") devicePerformance.tablet.impressions++;
          else devicePerformance.desktop.impressions++;
        } else if (interaction.type === "promo_modal_converted") {
          if (device === "mobile") devicePerformance.mobile.conversions++;
          else if (device === "tablet") devicePerformance.tablet.conversions++;
          else devicePerformance.desktop.conversions++;
        }
      });

      // Calculate seasonal trends
      const seasonalGroups: {
        [key: string]: { impressions: number; conversions: number };
      } = {};
      promoInteractions.forEach((interaction) => {
        const promoType = interaction.data?.promo_type || "general";
        if (!seasonalGroups[promoType]) {
          seasonalGroups[promoType] = { impressions: 0, conversions: 0 };
        }
        if (interaction.type === "promo_modal_displayed") {
          seasonalGroups[promoType].impressions++;
        } else if (interaction.type === "promo_modal_converted") {
          seasonalGroups[promoType].conversions++;
        }
      });

      const seasonalTrends = Object.entries(seasonalGroups)
        .map(([promoType, data]) => ({
          promoType,
          impressions: data.impressions,
          conversions: data.conversions,
          conversionRate:
            data.impressions > 0
              ? (data.conversions / data.impressions) * 100
              : 0,
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate);

      // Calculate totals
      const totalImpressions = promoInteractions.filter(
        (i) => i.type === "promo_modal_displayed",
      ).length;
      const totalConversions = promoInteractions.filter(
        (i) => i.type === "promo_modal_converted",
      ).length;
      const allViewDurations = promoInteractions
        .filter((i) => i.data?.view_duration_seconds)
        .map((i) => i.data!.view_duration_seconds);

      setMetrics({
        totalImpressions,
        totalConversions,
        conversionRate:
          totalImpressions > 0
            ? (totalConversions / totalImpressions) * 100
            : 0,
        averageViewDuration:
          allViewDurations.length > 0
            ? allViewDurations.reduce((a, b) => a + b, 0) /
              allViewDurations.length
            : 0,
        topPerformingPromos: promoMetrics.slice(0, 5),
        dismissalReasons,
        devicePerformance,
        seasonalTrends,
      });

      setLoading(false);
    };

    calculatePromoMetrics();
  }, [visitors]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!metrics || metrics.totalImpressions === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Promo Modal Analytics</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No promo modal data available yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Promo modal interactions will appear here once visitors start seeing
            your promotional offers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Total Impressions
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.totalImpressions.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Total Conversions
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.totalConversions.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.conversionRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg. View Time</h3>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.averageViewDuration.toFixed(1)}s
          </p>
        </div>
      </div>

      {/* Top Performing Promos */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top Performing Promos</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promo Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. View Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.topPerformingPromos.map((promo, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {promo.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {promo.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {promo.conversions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        promo.conversionRate > 10
                          ? "bg-green-100 text-green-800"
                          : promo.conversionRate > 5
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {promo.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {promo.averageViewDuration.toFixed(1)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Performance and Seasonal Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Device Performance</h3>
          <div className="space-y-4">
            {Object.entries(metrics.devicePerformance).map(([device, data]) => {
              const conversionRate =
                data.impressions > 0
                  ? (data.conversions / data.impressions) * 100
                  : 0;
              return (
                <div
                  key={device}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {device}
                    </p>
                    <p className="text-sm text-gray-600">
                      {data.impressions} impressions, {data.conversions}{" "}
                      conversions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {conversionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">conversion rate</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seasonal Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Promo Type Performance</h3>
          <div className="space-y-4">
            {metrics.seasonalTrends.slice(0, 5).map((trend, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {trend.promoType.replace("_", " ")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {trend.impressions} impressions, {trend.conversions}{" "}
                    conversions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {trend.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">conversion rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dismissal Reasons */}
      {Object.keys(metrics.dismissalReasons).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Modal Dismissal Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(metrics.dismissalReasons).map(([reason, count]) => (
              <div key={reason} className="text-center p-4 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {reason.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Promo Optimization Insights
        </h3>
        <div className="space-y-4">
          {metrics.conversionRate > 0 && (
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <p className="font-medium">Strong Promo Performance</p>
              <p className="text-sm text-gray-600 mt-1">
                Your promo modals have a {metrics.conversionRate.toFixed(1)}%
                conversion rate, which is
                {metrics.conversionRate > 5
                  ? " excellent"
                  : metrics.conversionRate > 2
                    ? " good"
                    : " below average"}
                for promotional campaigns.
              </p>
            </div>
          )}

          {metrics.topPerformingPromos.length > 0 && (
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="font-medium">Best Performing Promo</p>
              <p className="text-sm text-gray-600 mt-1">
                "{metrics.topPerformingPromos[0].name}" is your top performer
                with a{" "}
                {metrics.topPerformingPromos[0].conversionRate.toFixed(1)}%
                conversion rate. Consider using similar messaging and timing for
                future promos.
              </p>
            </div>
          )}

          {metrics.averageViewDuration > 0 && (
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-medium">Engagement Analysis</p>
              <p className="text-sm text-gray-600 mt-1">
                Visitors spend an average of{" "}
                {metrics.averageViewDuration.toFixed(1)} seconds viewing your
                promos.
                {metrics.averageViewDuration < 3
                  ? " Consider making your offers more compelling or reducing text."
                  : metrics.averageViewDuration > 10
                    ? " Great engagement! Your promos are capturing attention effectively."
                    : " This is a healthy engagement time for promotional content."}
              </p>
            </div>
          )}

          <div className="border-l-4 border-yellow-500 pl-4 py-2">
            <p className="font-medium">Optimization Recommendations</p>
            <p className="text-sm text-gray-600 mt-1">
              {metrics.totalImpressions < 100
                ? "Increase promo visibility by adjusting display timing or targeting more visitors."
                : "Focus on improving conversion rates by A/B testing different promo designs and offers."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
