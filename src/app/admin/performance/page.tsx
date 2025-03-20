"use client";

import { useState, useEffect } from "react";
import { getContacts, getProducts } from "@/utils/api";
import {
  calculateConversionRate,
  calculateAOV,
  identifyRepeatCustomers,
  generateRevenueForecast,
  analyzeSeasonalTrends,
  calculateYoYGrowth,
} from "@/utils/analytics";
import KpiCards from "@/components/analytics/KpiCards";
import ConversionAnalysis from "@/components/analytics/ConversionAnalysis";
import ForecastChart from "@/components/analytics/ForecastChart";
import SeasonalTrends from "@/components/analytics/SeasonalTrends";
import { Contact } from "@/types/contact";
import { ProductWithId } from "@/types/product";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function PerformanceDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("currentMonth");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [previousPeriodContacts, setPreviousPeriodContacts] = useState<
    Contact[]
  >([]);
  const [metrics, setMetrics] = useState({
    conversionRate: 0,
    previousConversionRate: 0,
    averageOrderValue: 0,
    previousAOV: 0,
    repeatBookingRate: 0,
    previousRepeatRate: 0,
    totalRevenue: 0,
    previousRevenue: 0,
    totalBookings: 0,
    previousBookings: 0,
    yoyGrowth: 0,
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [conversionByMonth, setConversionByMonth] = useState<
    Record<string, { total: number; statuses: Record<string, number> }>
  >({});
  const [revenueForecast, setRevenueForecast] = useState<{
    dates: string[];
    values: number[];
  }>({ dates: [], values: [] });
  const [bookingsForecast, setBookingsForecast] = useState<{
    dates: string[];
    values: number[];
  }>({ dates: [], values: [] });
  const [seasonalData, setSeasonalData] = useState<{
    monthly: Record<string, number>;
    quarterly?: Record<string, number>;
  }>({ monthly: {} });

  // Period options
  const periodOptions = [
    { value: "nextMonth", label: "Next Month (Based on Last Year)" },
    { value: "currentMonth", label: "Current Month" },
    { value: "last30Days", label: "Last 30 Days" },
    { value: "yearToDate", label: "Year to Date" },
    { value: "lastYear", label: "Last Year" },
    { value: "all", label: "All Time" },
  ];

  // Helper function to get date range for previous period
  const getPreviousPeriodRange = (
    period: string,
    currentStartDate: string,
    currentEndDate: string,
  ) => {
    const currentStart = new Date(currentStartDate);
    const currentEnd = new Date(currentEndDate);
    const previousStart = new Date(currentStart);
    const previousEnd = new Date(currentEnd);

    switch (period) {
      case "currentMonth": {
        // Previous month
        previousStart.setMonth(previousStart.getMonth() - 1);
        previousEnd.setMonth(previousEnd.getMonth() - 1);
        break;
      }
      case "last30Days": {
        // Previous 30 days
        previousStart.setDate(previousStart.getDate() - 30);
        previousEnd.setDate(previousEnd.getDate() - 30);
        break;
      }
      case "yearToDate": {
        // Same period last year
        previousStart.setFullYear(previousStart.getFullYear() - 1);
        previousEnd.setFullYear(previousEnd.getFullYear() - 1);
        break;
      }
      case "lastYear": {
        // Year before last year
        previousStart.setFullYear(previousStart.getFullYear() - 1);
        previousEnd.setFullYear(previousEnd.getFullYear() - 1);
        break;
      }
      default:
        // For other periods, use same length of time but shifted back
        const currentDuration = currentEnd.getTime() - currentStart.getTime();
        previousEnd.setTime(currentStart.getTime() - 1); // End just before current start
        previousStart.setTime(previousEnd.getTime() - currentDuration); // Same duration
    }

    return {
      startDate: previousStart.toISOString().split("T")[0],
      endDate: previousEnd.toISOString().split("T")[0],
    };
  };

  // Fetch data when period changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get date range for the selected period
        const dateRange = getDateRangeForPeriod(period);

        // Get date range for the previous period
        const previousDateRange = getPreviousPeriodRange(
          period,
          dateRange.startDate,
          dateRange.endDate,
        );

        // Fetch contacts for current period
        const contactsData = await getContacts({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 1000, // Fetch a large number to ensure we get all data
        });

        // Fetch contacts for previous period
        const previousContactsData = await getContacts({
          startDate: previousDateRange.startDate,
          endDate: previousDateRange.endDate,
          limit: 1000,
        });

        // Fetch all contacts for seasonal analysis
        const allContactsData = await getContacts({
          limit: 1000,
        });

        // Fetch products
        const productsData = await getProducts();

        // Extract data from API responses
        const currentContacts = contactsData.contacts as Contact[];
        const previousContacts = previousContactsData.contacts as Contact[];
        const allContacts = allContactsData.contacts as Contact[];
        const productsList = productsData.products as ProductWithId[];

        // Store the fetched data
        setContacts(currentContacts);
        setPreviousPeriodContacts(previousContacts);
        setProducts(productsList);

        // Calculate metrics
        const confirmedContacts = currentContacts.filter(
          (contact) => contact.confirmed === "Confirmed",
        );
        const previousConfirmedContacts = previousContacts.filter(
          (contact) => contact.confirmed === "Confirmed",
        );

        const conversionRate = calculateConversionRate(
          currentContacts,
          confirmedContacts,
        );
        const previousConversionRate = calculateConversionRate(
          previousContacts,
          previousConfirmedContacts,
        );

        const aov = calculateAOV(currentContacts, productsList);
        const previousAOV = calculateAOV(previousContacts, productsList);

        const { repeatRate } = identifyRepeatCustomers(currentContacts);
        const { repeatRate: previousRepeatRate } =
          identifyRepeatCustomers(previousContacts);

        const totalRevenue = currentContacts.reduce((total, contact) => {
          const product = productsList.find((p) => p.name === contact.bouncer);
          return total + (product?.price.base || 0);
        }, 0);

        const previousRevenue = previousContacts.reduce((total, contact) => {
          const product = productsList.find((p) => p.name === contact.bouncer);
          return total + (product?.price.base || 0);
        }, 0);

        const yoyGrowth = calculateYoYGrowth(
          currentContacts,
          previousContacts,
          productsList,
        );

        // Update metrics state
        setMetrics({
          conversionRate,
          previousConversionRate,
          averageOrderValue: aov,
          previousAOV,
          repeatBookingRate: repeatRate,
          previousRepeatRate,
          totalRevenue,
          previousRevenue,
          totalBookings: currentContacts.length,
          previousBookings: previousContacts.length,
          yoyGrowth,
        });

        // Calculate status counts for current period
        const statusCountsMap: Record<string, number> = {};
        currentContacts.forEach((contact) => {
          const status = contact.confirmed;
          statusCountsMap[status] = (statusCountsMap[status] || 0) + 1;
        });
        setStatusCounts(statusCountsMap);

        // Calculate conversion by month with all statuses
        const conversionMonthly: Record<
          string,
          { total: number; statuses: Record<string, number> }
        > = {};

        // Group all contacts by month
        allContacts.forEach((contact) => {
          const date = new Date(contact.partyDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

          if (!conversionMonthly[monthKey]) {
            conversionMonthly[monthKey] = {
              total: 0,
              statuses: {},
            };
          }

          conversionMonthly[monthKey].total++;

          // Count by status
          const status = contact.confirmed;
          conversionMonthly[monthKey].statuses[status] =
            (conversionMonthly[monthKey].statuses[status] || 0) + 1;
        });

        setConversionByMonth(conversionMonthly);

        // Generate forecasts
        const revenueData = generateRevenueForecast(
          allContacts,
          productsList,
          6,
        );
        setRevenueForecast(revenueData);

        // Generate bookings forecast
        // Group contacts by month for bookings forecast
        const bookingsByMonth: Record<string, number> = {};
        allContacts.forEach((contact) => {
          const date = new Date(contact.partyDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

          if (!bookingsByMonth[monthKey]) {
            bookingsByMonth[monthKey] = 0;
          }

          bookingsByMonth[monthKey]++;
        });

        // Convert to arrays for forecasting
        const sortedMonths = Object.keys(bookingsByMonth).sort();
        const bookingCounts = sortedMonths.map(
          (month) => bookingsByMonth[month],
        );

        // Simple forecasting (similar to revenue forecast)
        const forecastMonths = [];
        const forecastValues = [];

        if (sortedMonths.length >= 3) {
          const windowSize = 3;
          const lastValues = bookingCounts.slice(-windowSize);
          const average =
            lastValues.reduce((sum, val) => sum + val, 0) / windowSize;

          const lastDate = new Date(
            sortedMonths[sortedMonths.length - 1] + "-01",
          );

          for (let i = 1; i <= 6; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setMonth(forecastDate.getMonth() + i);
            const forecastMonthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`;

            forecastMonths.push(forecastMonthKey);
            forecastValues.push(average);
          }
        }

        setBookingsForecast({
          dates: [...sortedMonths, ...forecastMonths],
          values: [...bookingCounts, ...forecastValues],
        });

        // Analyze seasonal trends
        const monthlyTrends = analyzeSeasonalTrends(allContacts, "monthly");
        const quarterlyTrends = analyzeSeasonalTrends(allContacts, "quarterly");

        setSeasonalData({
          monthly: monthlyTrends,
          quarterly: quarterlyTrends,
        });
      } catch (error) {
        console.error("Error fetching performance data:", error);
        setError("Failed to load performance data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Helper function to get date range based on period
  function getDateRangeForPeriod(period: string) {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case "nextMonth": {
        // Next month based on previous year's data
        const lastYear = now.getFullYear() - 1;
        const nextMonth = now.getMonth() + 1;
        startDate.setFullYear(lastYear, nextMonth, 1);
        endDate.setFullYear(lastYear, nextMonth + 1, 0);
        break;
      }
      case "currentMonth": {
        startDate.setDate(1);
        endDate.setMonth(now.getMonth() + 1, 0);
        break;
      }
      case "last30Days": {
        startDate.setDate(now.getDate() - 30);
        break;
      }
      case "yearToDate": {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case "lastYear": {
        startDate.setFullYear(now.getFullYear() - 1, 0, 1);
        endDate.setFullYear(now.getFullYear() - 1, 11, 31);
        break;
      }
      case "all":
      default: {
        startDate.setFullYear(2000, 0, 1); // Far in the past
        break;
      }
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Business Performance
        </h2>
        <div className="flex items-center">
          <label
            htmlFor="period-select"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Period:
          </label>
          <select
            id="period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Cards */}
        <KpiCards metrics={metrics} />

        {/* Conversion Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionAnalysis
            totalContacts={contacts.length}
            confirmedContacts={
              contacts.filter((c) => c.confirmed === "Confirmed").length
            }
            conversionRate={metrics.conversionRate}
            statusCounts={statusCounts}
            conversionByMonth={conversionByMonth}
          />

          <ForecastChart
            historicalData={{
              dates: revenueForecast.dates.slice(0, -6),
              values: revenueForecast.values.slice(0, -6),
            }}
            forecastData={{
              dates: revenueForecast.dates.slice(-6),
              values: revenueForecast.values.slice(-6),
            }}
            type="revenue"
          />
        </div>

        {/* Bookings Forecast and Seasonal Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ForecastChart
            historicalData={{
              dates: bookingsForecast.dates.slice(0, -6),
              values: bookingsForecast.values.slice(0, -6),
            }}
            forecastData={{
              dates: bookingsForecast.dates.slice(-6),
              values: bookingsForecast.values.slice(-6),
            }}
            type="bookings"
          />

          <SeasonalTrends
            monthlyData={seasonalData.monthly}
            quarterlyData={seasonalData.quarterly}
          />
        </div>
      </div>
    </div>
  );
}
