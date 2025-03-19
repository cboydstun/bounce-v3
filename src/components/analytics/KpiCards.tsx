"use client";

import { formatCurrency } from "@/utils/analytics";

interface KpiCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  format?: "currency" | "percentage" | "number";
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  previousValue,
  format = "number",
  trend,
  trendValue,
}) => {
  // Format the value based on the format type
  const formattedValue = (() => {
    if (typeof value === "string") return value;

    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "number":
      default:
        return value.toLocaleString();
    }
  })();

  // Format the previous value if provided
  const formattedPreviousValue = (() => {
    if (!previousValue) return null;
    if (typeof previousValue === "string") return previousValue;

    switch (format) {
      case "currency":
        return formatCurrency(previousValue);
      case "percentage":
        return `${previousValue.toFixed(1)}%`;
      case "number":
      default:
        return previousValue.toLocaleString();
    }
  })();

  // Determine trend color
  const trendColor = (() => {
    if (!trend) return "text-gray-500";

    switch (trend) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      case "neutral":
      default:
        return "text-gray-500";
    }
  })();

  // Trend arrow
  const trendArrow = (() => {
    if (!trend) return null;

    switch (trend) {
      case "up":
        return "↑";
      case "down":
        return "↓";
      case "neutral":
      default:
        return "→";
    }
  })();

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-1 flex items-baseline justify-between">
        <p className="text-2xl font-semibold text-gray-900">{formattedValue}</p>
        {trendValue !== undefined && (
          <p className={`flex items-center text-sm ${trendColor}`}>
            <span className="mr-1">{trendArrow}</span>
            {trendValue > 0 ? "+" : ""}
            {trendValue.toFixed(1)}%
          </p>
        )}
      </div>
      {formattedPreviousValue && (
        <p className="mt-1 text-xs text-gray-500">
          Previous: {formattedPreviousValue}
        </p>
      )}
    </div>
  );
};

interface KpiCardsProps {
  metrics: {
    conversionRate: number;
    previousConversionRate?: number;
    averageOrderValue: number;
    previousAOV?: number;
    repeatBookingRate: number;
    previousRepeatRate?: number;
    totalRevenue: number;
    previousRevenue?: number;
    totalBookings: number;
    previousBookings?: number;
    yoyGrowth?: number;
  };
}

const KpiCards: React.FC<KpiCardsProps> = ({ metrics }) => {
  // Calculate trends
  const conversionTrend = metrics.previousConversionRate
    ? metrics.conversionRate > metrics.previousConversionRate
      ? "up"
      : metrics.conversionRate < metrics.previousConversionRate
        ? "down"
        : "neutral"
    : undefined;

  const aovTrend = metrics.previousAOV
    ? metrics.averageOrderValue > metrics.previousAOV
      ? "up"
      : metrics.averageOrderValue < metrics.previousAOV
        ? "down"
        : "neutral"
    : undefined;

  const repeatRateTrend = metrics.previousRepeatRate
    ? metrics.repeatBookingRate > metrics.previousRepeatRate
      ? "up"
      : metrics.repeatBookingRate < metrics.previousRepeatRate
        ? "down"
        : "neutral"
    : undefined;

  const revenueTrend = metrics.previousRevenue
    ? metrics.totalRevenue > metrics.previousRevenue
      ? "up"
      : metrics.totalRevenue < metrics.previousRevenue
        ? "down"
        : "neutral"
    : undefined;

  const bookingsTrend = metrics.previousBookings
    ? metrics.totalBookings > metrics.previousBookings
      ? "up"
      : metrics.totalBookings < metrics.previousBookings
        ? "down"
        : "neutral"
    : undefined;

  // Calculate percentage changes
  const conversionChange = metrics.previousConversionRate
    ? ((metrics.conversionRate - metrics.previousConversionRate) /
        metrics.previousConversionRate) *
      100
    : undefined;

  const aovChange = metrics.previousAOV
    ? ((metrics.averageOrderValue - metrics.previousAOV) /
        metrics.previousAOV) *
      100
    : undefined;

  const repeatRateChange = metrics.previousRepeatRate
    ? ((metrics.repeatBookingRate - metrics.previousRepeatRate) /
        metrics.previousRepeatRate) *
      100
    : undefined;

  const revenueChange = metrics.previousRevenue
    ? ((metrics.totalRevenue - metrics.previousRevenue) /
        metrics.previousRevenue) *
      100
    : undefined;

  const bookingsChange = metrics.previousBookings
    ? ((metrics.totalBookings - metrics.previousBookings) /
        metrics.previousBookings) *
      100
    : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <KpiCard
        title="Conversion Rate"
        value={metrics.conversionRate}
        previousValue={metrics.previousConversionRate}
        format="percentage"
        trend={conversionTrend}
        trendValue={conversionChange}
      />
      <KpiCard
        title="Average Order Value"
        value={metrics.averageOrderValue}
        previousValue={metrics.previousAOV}
        format="currency"
        trend={aovTrend}
        trendValue={aovChange}
      />
      <KpiCard
        title="Repeat Booking Rate"
        value={metrics.repeatBookingRate}
        previousValue={metrics.previousRepeatRate}
        format="percentage"
        trend={repeatRateTrend}
        trendValue={repeatRateChange}
      />
      <KpiCard
        title="Total Revenue"
        value={metrics.totalRevenue}
        previousValue={metrics.previousRevenue}
        format="currency"
        trend={revenueTrend}
        trendValue={revenueChange}
      />
      <KpiCard
        title="Total Bookings"
        value={metrics.totalBookings}
        previousValue={metrics.previousBookings}
        format="number"
        trend={bookingsTrend}
        trendValue={bookingsChange}
      />
      {metrics.yoyGrowth !== undefined && (
        <KpiCard
          title="Year-over-Year Growth"
          value={metrics.yoyGrowth}
          format="percentage"
          trend={
            metrics.yoyGrowth > 0
              ? "up"
              : metrics.yoyGrowth < 0
                ? "down"
                : "neutral"
          }
        />
      )}
    </div>
  );
};

export default KpiCards;
