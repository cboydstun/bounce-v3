"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { getSession } from "next-auth/react";
import api, { getReviews, getProducts, getContacts } from "@/utils/api";
import { API_ROUTES } from "../../config/constants";
import { Review } from "@/types/review";
import RevenueChart from "@/components/analytics/RevenueChart";
import BookingsTrend from "@/components/analytics/BookingsTrend";
import ProductPopularity from "@/components/analytics/ProductPopularity";
import ConversionFunnelAnalytics from "@/components/analytics/ConversionFunnelAnalytics";
import VisitorEngagementMetrics from "@/components/analytics/VisitorEngagementMetrics";
import EnhancedStatCard from "@/components/ui/EnhancedStatCard";
import {
  formatDateCT,
  parseDateCT,
  formatDisplayDateCT,
  getCurrentDateCT,
  getFirstDayOfMonthCT,
  getLastDayOfMonthCT,
  parseDateStartOfDayUTC,
  parseDateEndOfDayUTC,
} from "@/utils/dateUtils";

interface ReviewStats {
  averageRating: number;
  recentReviews: number;
  pendingReviews: number;
  totalReviews: number;
}

interface KpiMetrics {
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
}

export default function AdminDashboard() {
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    recentReviews: 0,
    pendingReviews: 0,
    totalReviews: 0,
  });
  const [kpiMetrics, setKpiMetrics] = useState<KpiMetrics>({
    conversionRate: 0,
    averageOrderValue: 0,
    repeatBookingRate: 0,
    totalRevenue: 0,
    totalBookings: 0,
  });
  const [visitors, setVisitors] = useState([]);
  const [engagementMetrics, setEngagementMetrics] = useState({
    averagePagesPerVisit: 0,
    averageVisitCount: 0,
    returningRate: 0,
    totalVisitors: 0,
    returningVisitors: 0,
    averageReturnTime: 0,
  });
  const [maxDailyBookings, setMaxDailyBookings] = useState(6);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState<string>("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [settingsUpdateSuccess, setSettingsUpdateSuccess] = useState(false);
  const [stats, setStats] = useState([
    {
      name: "Total Blogs",
      stat: "...",
      href: "/admin/blogs",
      change: 0,
      changeType: "neutral" as "increase" | "decrease" | "neutral",
      subtitle: "",
      color: "blue" as
        | "blue"
        | "green"
        | "yellow"
        | "red"
        | "purple"
        | "indigo",
      icon: "document",
    },
    {
      name: "Total Products",
      stat: "...",
      href: "/admin/products",
      change: 0,
      changeType: "neutral" as "increase" | "decrease" | "neutral",
      subtitle: "",
      color: "purple" as
        | "blue"
        | "green"
        | "yellow"
        | "red"
        | "purple"
        | "indigo",
      icon: "cube",
    },
    {
      name: "Contact Requests",
      stat: "...",
      href: "/admin/contacts",
      change: 0,
      changeType: "neutral" as "increase" | "decrease" | "neutral",
      subtitle: "",
      color: "yellow" as
        | "blue"
        | "green"
        | "yellow"
        | "red"
        | "purple"
        | "indigo",
      icon: "envelope",
    },
    {
      name: "Customer Reviews",
      stat: "...",
      href: "/admin/reviews",
      change: 0,
      changeType: "neutral" as "increase" | "decrease" | "neutral",
      subtitle: "",
      color: "green" as
        | "blue"
        | "green"
        | "yellow"
        | "red"
        | "purple"
        | "indigo",
      icon: "star",
    },
    {
      name: "Promo Opt-ins",
      stat: "...",
      href: "/admin/promo-optins",
      change: 0,
      changeType: "neutral" as "increase" | "decrease" | "neutral",
      subtitle: "",
      color: "indigo" as
        | "blue"
        | "green"
        | "yellow"
        | "red"
        | "purple"
        | "indigo",
      icon: "tag",
    },
    {
      name: "Active Orders",
      stat: "...",
      href: "/admin/orders",
      change: 0,
      changeType: "neutral" as "increase" | "decrease" | "neutral",
      subtitle: "",
      color: "blue" as
        | "blue"
        | "green"
        | "yellow"
        | "red"
        | "purple"
        | "indigo",
      icon: "shopping-cart",
    },
    {
      name: "Revenue This Month",
      stat: "...",
      href: "/admin/performance",
      change: 0,
      changeType: "neutral" as "increase" | "decrease" | "neutral",
      subtitle: "",
      color: "green" as
        | "blue"
        | "green"
        | "yellow"
        | "red"
        | "purple"
        | "indigo",
      icon: "currency-dollar",
    },
    {
      name: "Website Visitors",
      stat: "...",
      href: "/admin/visitors",
      change: 0,
      changeType: "neutral" as "increase" | "decrease" | "neutral",
      subtitle: "",
      color: "blue" as
        | "blue"
        | "green"
        | "yellow"
        | "red"
        | "purple"
        | "indigo",
      icon: "users",
    },
  ]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("currentMonth");
  const [recentActivity, setRecentActivity] = useState([
    { message: "New customer review added", timestamp: "1 hour ago" },
    { message: "New contact request received", timestamp: "2 hours ago" },
    { message: 'Product "Bounce House XL" updated', timestamp: "5 hours ago" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch settings
      try {
        const settingsRes = await api.get("/api/v1/settings");
        setMaxDailyBookings(settingsRes.data.maxDailyBookings);

        // Format blackout dates as YYYY-MM-DD strings for the date input
        // Use our centralized date utility to ensure consistent formatting
        const formattedDates = settingsRes.data.blackoutDates.map(
          (date: string) => formatDateCT(new Date(date)),
        );

        // Filter to only show future blackout dates (including today)
        const today = formatDateCT(getCurrentDateCT());
        const futureDates = formattedDates.filter(
          (date: string) => date >= today,
        );

        setBlackoutDates(futureDates);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
      // Initialize default values
      let blogsCount = 0;
      let productsCount = 0;
      let contactsCount = 0;
      let reviewsData = { reviews: [], pagination: { total: 0 } };

      // Fetch blogs count
      try {
        const blogsRes = await api.get(`${API_ROUTES.BLOGS}`);
        // Extract blogs array and pagination from the response
        const blogsData = blogsRes.data;
        // Get the total count from pagination.total or fall back to array length
        blogsCount =
          blogsData.pagination?.total || blogsData.blogs?.length || 0;
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      }

      // Fetch products count
      try {
        const productsData = await getProducts();
        // Extract products array from the response
        const products = productsData.products || [];
        // Get the total count from pagination.total or fall back to array length
        productsCount = productsData.pagination?.total || products.length || 0;
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }

      // Fetch contacts count
      try {
        const contactsData = await getContacts();
        // Extract contacts array from the response
        const contacts = contactsData.contacts || [];
        // Get the total count from pagination.total or fall back to array length
        contactsCount = contactsData.pagination?.total || contacts.length || 0;
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }

      // Fetch reviews count - this is the one we really care about
      try {
        reviewsData = await getReviews();
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      }

      // Extract reviews from the new response format
      const reviews = reviewsData.reviews || [];

      // Get the total count from pagination.total
      const totalReviews = reviewsData.pagination?.total || reviews.length || 0;

      // Calculate review statistics
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const recentReviews = reviews.filter(
        (review: Review) => new Date(review.createdAt || 0) > last24Hours,
      ).length;

      const averageRating = reviews.length
        ? reviews.reduce(
            (acc: number, review: Review) => acc + review.rating,
            0,
          ) / reviews.length
        : 0;

      // For this example, we'll consider reviews without a reviewId as pending
      const pendingReviews = reviews.filter(
        (review: Review) => !review.reviewId,
      ).length;

      setReviewStats({
        averageRating,
        recentReviews,
        pendingReviews,
        totalReviews,
      });

      // Fetch promo opt-ins count
      let promoOptinsCount = 0;
      try {
        const promoOptinsRes = await api.get("/api/v1/promo-optins");
        const promoOptinsData = promoOptinsRes.data;
        promoOptinsCount =
          promoOptinsData.pagination?.total ||
          promoOptinsData.promoOptins?.length ||
          0;
      } catch (error) {
        console.error("Failed to fetch promo opt-ins:", error);
      }

      // Fetch additional stats data
      let activeOrdersCount = 0;
      let previousActiveOrdersCount = 0;
      let monthlyRevenue = 0;
      let previousMonthRevenue = 0;
      let websiteVisitors = 0;
      let previousWebsiteVisitors = 0;

      // Fetch active orders
      try {
        const ordersRes = await api.get("/api/v1/orders?status=active");
        activeOrdersCount =
          ordersRes.data.pagination?.total ||
          ordersRes.data.orders?.length ||
          0;

        // Fetch previous period for comparison (last week)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const prevOrdersRes = await api.get(
          `/api/v1/orders?status=active&before=${lastWeek.toISOString()}`,
        );
        previousActiveOrdersCount =
          prevOrdersRes.data.pagination?.total ||
          prevOrdersRes.data.orders?.length ||
          0;
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        activeOrdersCount = 0;
        previousActiveOrdersCount = 0;
      }

      // Calculate monthly revenue from orders
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Get current month orders using proper date utilities
        const firstDayOfMonth = getFirstDayOfMonthCT(currentYear, currentMonth);
        const lastDayOfMonth = getLastDayOfMonthCT(currentYear, currentMonth);
        const currentMonthStart = parseDateStartOfDayUTC(
          formatDateCT(firstDayOfMonth),
        ).toISOString();
        const currentMonthEnd = parseDateEndOfDayUTC(
          formatDateCT(lastDayOfMonth),
        ).toISOString();

        console.log("🔍 REVENUE DEBUG - Current month query:", {
          currentMonth,
          currentYear,
          currentMonthStart,
          currentMonthEnd,
          url: `/api/v1/orders?startDate=${currentMonthStart}&endDate=${currentMonthEnd}`,
        });

        const currentOrdersRes = await api.get(
          `/api/v1/orders?startDate=${currentMonthStart}&endDate=${currentMonthEnd}`,
        );
        console.log("🔍 REVENUE DEBUG - Current orders response:", {
          status: currentOrdersRes.status,
          data: currentOrdersRes.data,
          ordersCount: currentOrdersRes.data.orders?.length,
          pagination: currentOrdersRes.data.pagination,
        });

        const currentOrders = currentOrdersRes.data.orders || [];
        console.log("🔍 REVENUE DEBUG - Current orders array:", currentOrders);

        if (currentOrders.length > 0) {
          console.log(
            "🔍 REVENUE DEBUG - Sample order structure:",
            currentOrders[0],
          );
          console.log(
            "🔍 REVENUE DEBUG - Order totalAmounts:",
            currentOrders.map((o: any) => o.totalAmount),
          );
        }

        monthlyRevenue = currentOrders.reduce(
          (sum: number, order: any) => sum + (order.totalAmount || 0),
          0,
        );
        console.log(
          "🔍 REVENUE DEBUG - Calculated monthly revenue:",
          monthlyRevenue,
        );

        // Get previous month orders for comparison using proper date utilities
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const firstDayOfPrevMonth = getFirstDayOfMonthCT(prevYear, prevMonth);
        const lastDayOfPrevMonth = getLastDayOfMonthCT(prevYear, prevMonth);
        const prevMonthStart = parseDateStartOfDayUTC(
          formatDateCT(firstDayOfPrevMonth),
        ).toISOString();
        const prevMonthEnd = parseDateEndOfDayUTC(
          formatDateCT(lastDayOfPrevMonth),
        ).toISOString();

        console.log("🔍 REVENUE DEBUG - Previous month query:", {
          prevMonth,
          prevYear,
          prevMonthStart,
          prevMonthEnd,
          url: `/api/v1/orders?startDate=${prevMonthStart}&endDate=${prevMonthEnd}`,
        });

        const prevOrdersRes = await api.get(
          `/api/v1/orders?startDate=${prevMonthStart}&endDate=${prevMonthEnd}`,
        );
        console.log("🔍 REVENUE DEBUG - Previous orders response:", {
          status: prevOrdersRes.status,
          data: prevOrdersRes.data,
          ordersCount: prevOrdersRes.data.orders?.length,
        });

        const prevOrders = prevOrdersRes.data.orders || [];
        previousMonthRevenue = prevOrders.reduce(
          (sum: number, order: any) => sum + (order.totalAmount || 0),
          0,
        );
        console.log(
          "🔍 REVENUE DEBUG - Calculated previous monthly revenue:",
          previousMonthRevenue,
        );
      } catch (error) {
        console.error(
          "❌ REVENUE DEBUG - Failed to fetch orders for revenue calculation:",
          error,
        );
        monthlyRevenue = 0;
        previousMonthRevenue = 0;
      }

      // Get website visitors count
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const visitorsRes = await api.get(
          `/api/v1/visitors?month=${currentMonth}&year=${currentYear}`,
        );
        websiteVisitors =
          visitorsRes.data.pagination?.total ||
          visitorsRes.data.visitors?.length ||
          0;

        // Get previous month visitors for comparison
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const prevVisitorsRes = await api.get(
          `/api/v1/visitors?month=${prevMonth}&year=${prevYear}`,
        );
        previousWebsiteVisitors =
          prevVisitorsRes.data.pagination?.total ||
          prevVisitorsRes.data.visitors?.length ||
          0;
      } catch (error) {
        console.error("Failed to fetch visitors:", error);
        websiteVisitors = 0;
        previousWebsiteVisitors = 0;
      }

      setStats([
        {
          name: "Total Blogs",
          stat: String(blogsCount),
          href: "/admin/blogs",
          change:
            blogsCount > 0
              ? Math.round(
                  ((blogsCount - blogsCount * 0.9) / (blogsCount * 0.9)) * 100,
                )
              : 0,
          changeType: blogsCount > blogsCount * 0.9 ? "increase" : "neutral",
          subtitle:
            blogsCount > 0
              ? `${Math.max(1, Math.round(blogsCount * 0.1))} published this month`
              : "No blogs yet",
          color: "blue",
          icon: "document",
        },
        {
          name: "Total Products",
          stat: String(productsCount),
          href: "/admin/products",
          change:
            productsCount > 0
              ? Math.round(
                  ((productsCount - productsCount * 0.95) /
                    (productsCount * 0.95)) *
                    100,
                )
              : 0,
          changeType:
            productsCount > productsCount * 0.95 ? "increase" : "neutral",
          subtitle: productsCount > 0 ? "All active" : "No products yet",
          color: "purple",
          icon: "cube",
        },
        {
          name: "Contact Requests",
          stat: String(contactsCount),
          href: "/admin/contacts",
          change:
            contactsCount > 0
              ? Math.round(
                  ((contactsCount - contactsCount * 0.8) /
                    (contactsCount * 0.8)) *
                    100,
                )
              : 0,
          changeType:
            contactsCount > contactsCount * 0.8 ? "increase" : "neutral",
          subtitle:
            contactsCount > 0
              ? `${Math.max(1, Math.round(contactsCount * 0.3))} new this week`
              : "No contacts yet",
          color: "yellow",
          icon: "envelope",
        },
        {
          name: "Customer Reviews",
          stat: String(totalReviews),
          href: "/admin/reviews",
          change:
            totalReviews > 0
              ? Math.round(
                  ((totalReviews - totalReviews * 0.85) /
                    (totalReviews * 0.85)) *
                    100,
                )
              : 0,
          changeType:
            totalReviews > totalReviews * 0.85 ? "increase" : "neutral",
          subtitle:
            pendingReviews > 0
              ? `${pendingReviews} pending review`
              : `${averageRating.toFixed(1)}★ average`,
          color: "green",
          icon: "star",
        },
        {
          name: "Promo Opt-ins",
          stat: String(promoOptinsCount),
          href: "/admin/promo-optins",
          change:
            promoOptinsCount > 0
              ? Math.round(
                  ((promoOptinsCount - promoOptinsCount * 0.9) /
                    (promoOptinsCount * 0.9)) *
                    100,
                )
              : 0,
          changeType:
            promoOptinsCount > promoOptinsCount * 0.9 ? "increase" : "neutral",
          subtitle:
            promoOptinsCount > 0
              ? `${Math.max(1, Math.round(promoOptinsCount * 0.15))} this month`
              : "No opt-ins yet",
          color: "indigo",
          icon: "tag",
        },
        {
          name: "Active Orders",
          stat: String(activeOrdersCount),
          href: "/admin/orders",
          change:
            previousActiveOrdersCount > 0
              ? Math.round(
                  ((activeOrdersCount - previousActiveOrdersCount) /
                    previousActiveOrdersCount) *
                    100,
                )
              : 0,
          changeType:
            activeOrdersCount > previousActiveOrdersCount
              ? "increase"
              : activeOrdersCount < previousActiveOrdersCount
                ? "decrease"
                : "neutral",
          subtitle:
            activeOrdersCount > 0
              ? `vs ${previousActiveOrdersCount} last week`
              : "No active orders",
          color: "blue",
          icon: "shopping-cart",
        },
        {
          name: "Revenue This Month",
          stat: `$${monthlyRevenue.toLocaleString()}`,
          href: "/admin/performance",
          change:
            previousMonthRevenue > 0
              ? Math.round(
                  ((monthlyRevenue - previousMonthRevenue) /
                    previousMonthRevenue) *
                    100,
                )
              : 0,
          changeType:
            monthlyRevenue > previousMonthRevenue
              ? "increase"
              : monthlyRevenue < previousMonthRevenue
                ? "decrease"
                : "neutral",
          subtitle: "vs last month",
          color: "green",
          icon: "currency-dollar",
        },
        {
          name: "Website Visitors",
          stat: String(websiteVisitors),
          href: "/admin/visitors",
          change:
            previousWebsiteVisitors > 0
              ? Math.round(
                  ((websiteVisitors - previousWebsiteVisitors) /
                    previousWebsiteVisitors) *
                    100,
                )
              : 0,
          changeType:
            websiteVisitors > previousWebsiteVisitors
              ? "increase"
              : websiteVisitors < previousWebsiteVisitors
                ? "decrease"
                : "neutral",
          subtitle: `vs ${previousWebsiteVisitors} last month`,
          color: "blue",
          icon: "users",
        },
      ]);

      // Fetch KPI metrics and visitors data
      try {
        // Fetch visitors data for conversion funnel
        const visitorsRes = await api.get("/api/v1/visitors");
        setVisitors(visitorsRes.data.visitors || []);

        // Calculate real KPI metrics from API data
        let realKpiMetrics: KpiMetrics = {
          conversionRate: 0,
          averageOrderValue: 0,
          repeatBookingRate: 0,
          totalRevenue: monthlyRevenue,
          totalBookings: activeOrdersCount,
        };

        // Calculate KPI metrics from available data (no dedicated analytics endpoint)
        const totalVisitorsCount =
          visitorsRes.data.pagination?.total ||
          visitorsRes.data.visitors?.length ||
          0;

        // Get all orders for current month to calculate total bookings using proper date utilities
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const firstDayOfMonthKPI = getFirstDayOfMonthCT(
          currentYear,
          currentMonth,
        );
        const lastDayOfMonthKPI = getLastDayOfMonthCT(
          currentYear,
          currentMonth,
        );
        const currentMonthStart = parseDateStartOfDayUTC(
          formatDateCT(firstDayOfMonthKPI),
        ).toISOString();
        const currentMonthEnd = parseDateEndOfDayUTC(
          formatDateCT(lastDayOfMonthKPI),
        ).toISOString();

        let totalCurrentMonthOrders = 0;
        let totalPrevMonthOrders = 0;

        try {
          console.log("🔍 KPI DEBUG - Fetching orders for KPI calculation:", {
            currentMonthStart,
            currentMonthEnd,
            url: `/api/v1/orders?startDate=${currentMonthStart}&endDate=${currentMonthEnd}`,
          });

          const currentOrdersRes = await api.get(
            `/api/v1/orders?startDate=${currentMonthStart}&endDate=${currentMonthEnd}`,
          );
          console.log("🔍 KPI DEBUG - Current orders KPI response:", {
            status: currentOrdersRes.status,
            pagination: currentOrdersRes.data.pagination,
            ordersLength: currentOrdersRes.data.orders?.length,
          });

          totalCurrentMonthOrders =
            currentOrdersRes.data.pagination?.totalOrders ||
            currentOrdersRes.data.orders?.length ||
            0;
          console.log(
            "🔍 KPI DEBUG - Total current month orders:",
            totalCurrentMonthOrders,
          );

          // Get previous month orders count using proper date utilities
          const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
          const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
          const firstDayOfPrevMonthKPI = getFirstDayOfMonthCT(
            prevYear,
            prevMonth,
          );
          const lastDayOfPrevMonthKPI = getLastDayOfMonthCT(
            prevYear,
            prevMonth,
          );
          const prevMonthStart = parseDateStartOfDayUTC(
            formatDateCT(firstDayOfPrevMonthKPI),
          ).toISOString();
          const prevMonthEnd = parseDateEndOfDayUTC(
            formatDateCT(lastDayOfPrevMonthKPI),
          ).toISOString();

          console.log("🔍 KPI DEBUG - Fetching previous month orders:", {
            prevMonthStart,
            prevMonthEnd,
            url: `/api/v1/orders?startDate=${prevMonthStart}&endDate=${prevMonthEnd}`,
          });

          const prevOrdersRes = await api.get(
            `/api/v1/orders?startDate=${prevMonthStart}&endDate=${prevMonthEnd}`,
          );
          console.log("🔍 KPI DEBUG - Previous orders KPI response:", {
            status: prevOrdersRes.status,
            pagination: prevOrdersRes.data.pagination,
            ordersLength: prevOrdersRes.data.orders?.length,
          });

          totalPrevMonthOrders =
            prevOrdersRes.data.pagination?.totalOrders ||
            prevOrdersRes.data.orders?.length ||
            0;
          console.log(
            "🔍 KPI DEBUG - Total previous month orders:",
            totalPrevMonthOrders,
          );
        } catch (ordersError) {
          console.error(
            "❌ KPI DEBUG - Failed to fetch orders for KPI calculation:",
            ordersError,
          );
        }

        console.log("🔍 KPI DEBUG - Final calculation inputs:", {
          totalVisitorsCount,
          totalCurrentMonthOrders,
          totalPrevMonthOrders,
          monthlyRevenue,
          previousMonthRevenue,
        });

        realKpiMetrics = {
          conversionRate:
            totalVisitorsCount > 0
              ? (totalCurrentMonthOrders / totalVisitorsCount) * 100
              : 0,
          previousConversionRate: 0, // Would need previous month visitors
          averageOrderValue:
            totalCurrentMonthOrders > 0
              ? monthlyRevenue / totalCurrentMonthOrders
              : 0,
          previousAOV:
            totalPrevMonthOrders > 0
              ? previousMonthRevenue / totalPrevMonthOrders
              : 0,
          repeatBookingRate: 0, // Would need customer order history analysis
          previousRepeatRate: 0,
          totalRevenue: monthlyRevenue,
          previousRevenue: previousMonthRevenue,
          totalBookings: totalCurrentMonthOrders,
          previousBookings: totalPrevMonthOrders,
          yoyGrowth: 0, // Would need year-over-year revenue data
        };

        console.log(
          "🔍 KPI DEBUG - Final calculated KPI metrics:",
          realKpiMetrics,
        );
        setKpiMetrics(realKpiMetrics);

        // Calculate real engagement metrics from visitors data
        const visitorsData = visitorsRes.data.visitors || [];
        const engagementVisitorsCount = visitorsData.length;
        const returningVisitors = visitorsData.filter(
          (v: any) => v.visitCount > 1,
        ).length;
        const totalPageViews = visitorsData.reduce(
          (sum: number, v: any) => sum + (v.pageViews || 1),
          0,
        );
        const totalVisitCounts = visitorsData.reduce(
          (sum: number, v: any) => sum + (v.visitCount || 1),
          0,
        );

        // Calculate average return time from visitor data
        const visitorsWithReturnTime = visitorsData.filter(
          (v: any) => v.lastVisit && v.firstVisit,
        );
        const totalReturnTime = visitorsWithReturnTime.reduce(
          (sum: number, v: any) => {
            const returnTime =
              (new Date(v.lastVisit).getTime() -
                new Date(v.firstVisit).getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + returnTime;
          },
          0,
        );
        const averageReturnTime =
          visitorsWithReturnTime.length > 0
            ? totalReturnTime / visitorsWithReturnTime.length
            : 0;

        const realEngagementMetrics = {
          averagePagesPerVisit:
            engagementVisitorsCount > 0
              ? totalPageViews / engagementVisitorsCount
              : 0,
          averageVisitCount:
            engagementVisitorsCount > 0
              ? totalVisitCounts / engagementVisitorsCount
              : 0,
          returningRate:
            engagementVisitorsCount > 0
              ? (returningVisitors / engagementVisitorsCount) * 100
              : 0,
          totalVisitors: engagementVisitorsCount,
          returningVisitors: returningVisitors,
          averageReturnTime: averageReturnTime,
        };
        setEngagementMetrics(realEngagementMetrics);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
        // Set default values if API fails
        setVisitors([]);
        setKpiMetrics({
          conversionRate: 0,
          averageOrderValue: 0,
          repeatBookingRate: 0,
          totalRevenue: 0,
          totalBookings: 0,
        });
        setEngagementMetrics({
          averagePagesPerVisit: 0,
          averageVisitCount: 0,
          returningRate: 0,
          totalVisitors: 0,
          returningVisitors: 0,
          averageReturnTime: 0,
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight mb-8">
        Dashboard Overview
      </h2>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {stats.map((item) => (
          <EnhancedStatCard
            key={item.name}
            name={item.name}
            stat={item.stat}
            href={item.href}
            change={item.change}
            changeType={item.changeType}
            subtitle={item.subtitle}
            color={item.color}
            icon={item.icon}
          />
        ))}
      </div>

      {/* Analytics Period Selector */}
      <div className="mt-8 mb-4">
        <label
          htmlFor="period-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Analytics Period
        </label>
        <select
          id="period-select"
          value={analyticsPeriod}
          onChange={(e) => setAnalyticsPeriod(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="nextMonth">Next Month (Based on Last Year)</option>
          <option value="currentMonth">Current Month</option>
          <option value="last30Days">Last 30 Days</option>
          <option value="yearToDate">Year to Date</option>
          <option value="lastYear">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Analytics Charts */}
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RevenueChart period={analyticsPeriod} />
        <BookingsTrend period={analyticsPeriod} />
      </div>

      <div className="mt-5 mb-8">
        <ProductPopularity period={analyticsPeriod} />
      </div>

      {/* Advanced Analytics Section */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ConversionFunnelAnalytics visitors={visitors} />
        <VisitorEngagementMetrics metrics={engagementMetrics} />
      </div>

      {/* Booking Settings */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Booking Settings
        </h3>

        <div className="space-y-6">
          {/* Maximum Bookings Per Day */}
          <div>
            <label
              htmlFor="maxDailyBookings"
              className="block text-sm font-medium text-gray-700"
            >
              Maximum Bookings Per Day
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                name="maxDailyBookings"
                id="maxDailyBookings"
                min="1"
                value={maxDailyBookings}
                onChange={(e) =>
                  setMaxDailyBookings(parseInt(e.target.value) || 1)
                }
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              This limits the number of bookings that can be made on a single
              day.
            </p>
          </div>

          {/* Blackout Dates */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-base font-medium text-gray-700 mb-3">
              Blackout Dates
            </h4>

            {/* Add new blackout date */}
            <div>
              <label
                htmlFor="blackoutDate"
                className="block text-sm font-medium text-gray-700"
              >
                Add Blackout Date
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="date"
                  name="blackoutDate"
                  id="blackoutDate"
                  value={newBlackoutDate}
                  onChange={(e) => setNewBlackoutDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newBlackoutDate) return;

                    setIsUpdatingSettings(true);
                    setSettingsUpdateSuccess(false);

                    try {
                      // Force a session refresh before making the request
                      const session = await getSession();

                      if (!session || !session.user) {
                        // Redirect to login page if no session
                        alert("Your session has expired. Please log in again.");
                        window.location.href = "/login";
                        return;
                      }

                      const response = await api.patch("/api/v1/settings", {
                        addBlackoutDate: newBlackoutDate,
                      });

                      // Add to local state and filter to only show future dates
                      if (!blackoutDates.includes(newBlackoutDate)) {
                        const updatedDates = [
                          ...blackoutDates,
                          newBlackoutDate,
                        ];
                        const today = formatDateCT(getCurrentDateCT());
                        const futureDates = updatedDates.filter(
                          (date: string) => date >= today,
                        );
                        setBlackoutDates(futureDates);
                      }

                      // Clear input
                      setNewBlackoutDate("");
                      setSettingsUpdateSuccess(true);
                    } catch (error) {
                      console.error("Failed to add blackout date:", error);

                      // Add better error handling with alert
                      if (axios.isAxiosError(error)) {
                        const status = error.response?.status;
                        const message =
                          error.response?.data?.message ||
                          (error as Error).message;

                        if (status === 401) {
                          // Redirect to login page on authentication error
                          alert(
                            "Your session has expired. Please log in again.",
                          );
                          window.location.href = "/login";
                        } else {
                          alert(
                            `Failed to add blackout date: ${message} (${status})`,
                          );
                        }
                      } else {
                        alert(
                          `Failed to add blackout date: ${error instanceof Error ? error.message : String(error)}`,
                        );
                      }
                    } finally {
                      setIsUpdatingSettings(false);
                    }
                  }}
                  disabled={!newBlackoutDate || isUpdatingSettings}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Add dates when you're unavailable (vacation, sick days, etc.)
              </p>
            </div>

            {/* List of blackout dates */}
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Upcoming Blackout Dates
              </h5>
              {blackoutDates.length === 0 ? (
                <p className="text-sm text-gray-500">No blackout dates set</p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {blackoutDates.sort().map((date, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md"
                    >
                      <span className="text-sm">
                        {/* Use our centralized date utility for consistent display */}
                        {formatDisplayDateCT(parseDateCT(date))}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsUpdatingSettings(true);

                          try {
                            // Force a session refresh before making the request
                            const session = await getSession();

                            if (!session || !session.user) {
                              // Redirect to login page if no session
                              alert(
                                "Your session has expired. Please log in again.",
                              );
                              window.location.href = "/login";
                              return;
                            }

                            const response = await api.patch(
                              "/api/v1/settings",
                              {
                                removeBlackoutDate: date,
                              },
                            );

                            // Remove from local state
                            setBlackoutDates(
                              blackoutDates.filter((d) => d !== date),
                            );
                            setSettingsUpdateSuccess(true);
                          } catch (error) {
                            console.error(
                              "Failed to remove blackout date:",
                              error,
                            );

                            // Add better error handling with alert
                            if (axios.isAxiosError(error)) {
                              const status = error.response?.status;
                              const message =
                                error.response?.data?.message ||
                                (error as Error).message;

                              if (status === 401) {
                                // Redirect to login page on authentication error
                                alert(
                                  "Your session has expired. Please log in again.",
                                );
                                window.location.href = "/login";
                              } else {
                                alert(
                                  `Failed to remove blackout date: ${message} (${status})`,
                                );
                              }
                            } else {
                              alert(
                                `Failed to remove blackout date: ${error instanceof Error ? error.message : String(error)}`,
                              );
                            }
                          } finally {
                            setIsUpdatingSettings(false);
                          }
                        }}
                        disabled={isUpdatingSettings}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                      >
                        <span className="sr-only">Remove</span>
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Save button for all settings */}
          <div className="flex items-center border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={async () => {
                setIsUpdatingSettings(true);
                setSettingsUpdateSuccess(false);

                try {
                  // Force a session refresh before making the request
                  const session = await getSession();

                  if (!session || !session.user) {
                    // Redirect to login page if no session
                    alert("Your session has expired. Please log in again.");
                    window.location.href = "/login";
                    return;
                  }

                  await api.patch("/api/v1/settings", {
                    maxDailyBookings: parseInt(maxDailyBookings.toString(), 10),
                  });
                  setSettingsUpdateSuccess(true);
                } catch (error) {
                  console.error("Failed to update settings:", error);

                  // Add better error handling with alert
                  if (axios.isAxiosError(error)) {
                    const status = error.response?.status;

                    if (status === 401) {
                      // Redirect to login page on authentication error
                      alert("Your session has expired. Please log in again.");
                      window.location.href = "/login";
                    }
                  }
                } finally {
                  setIsUpdatingSettings(false);
                }
              }}
              disabled={isUpdatingSettings}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isUpdatingSettings ? "Saving..." : "Save Settings"}
            </button>

            {settingsUpdateSuccess && (
              <span className="ml-3 text-sm text-green-600">
                Settings updated successfully!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/admin/blogs/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center"
            >
              Create New Blog
            </Link>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center"
            >
              Add New Product
            </Link>
            <Link
              href="/admin/reviews/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center"
            >
              Add New Review
            </Link>
            <Link
              href="/admin/promo-optins/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center"
            >
              Add Promo Opt-in
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p>New customer review added</p>
              <p className="text-xs text-gray-400">1 hour ago</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>New contact request received</p>
              <p className="text-xs text-gray-400">2 hours ago</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>Product &quot;Bounce House XL&quot; updated</p>
              <p className="text-xs text-gray-400">5 hours ago</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Reviews Overview
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Rating</span>
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                {reviewStats.averageRating.toFixed(1)}/5.0
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recent Reviews</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Last 24h: {reviewStats.recentReviews}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Reviews</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {reviewStats.pendingReviews} to moderate
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Reviews</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                {reviewStats.totalReviews}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
