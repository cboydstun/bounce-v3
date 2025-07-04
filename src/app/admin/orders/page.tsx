"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getOrders, deleteOrder, syncAllAgreementStatuses } from "@/utils/api";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import {
  formatDateCT,
  parseDateCT,
  formatDisplayDateCT,
  getFirstDayOfMonthCT,
  getLastDayOfMonthCT,
  getCurrentDateCT,
} from "@/utils/dateUtils";
import AgreementStatusBadge from "@/components/AgreementStatusBadge";
import DeliveryCountdown from "@/components/DeliveryCountdown";
import AgreementActions from "@/components/AgreementActions";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<string | null>(null);

  // Initialize with empty date filters to show all orders by default
  const getCurrentMonthDates = () => {
    const now = getCurrentDateCT();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, but our utility expects 1-12

    const start = getFirstDayOfMonthCT(year, month);
    const end = getLastDayOfMonthCT(year, month);

    return {
      startDate: formatDateCT(start),
      endDate: formatDateCT(end),
    };
  };

  // Get a broader date range for "This Month" that includes upcoming orders
  const getThisMonthDates = () => {
    const now = getCurrentDateCT();
    const year = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Start from current month
    const start = getFirstDayOfMonthCT(year, currentMonth);

    // End 3 months from now to capture upcoming orders
    let endMonth = currentMonth + 3;
    let endYear = year;

    // Handle year rollover
    if (endMonth > 12) {
      endMonth = endMonth - 12;
      endYear = year + 1;
    }

    const end = getLastDayOfMonthCT(endYear, endMonth);

    return {
      startDate: formatDateCT(start),
      endDate: formatDateCT(end),
    };
  };

  // Filter states - Initialize with empty strings to show all orders by default
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [taskStatus, setTaskStatus] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    "none" | "week" | "month" | "year" | "saturday" | "weekend"
  >("week");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  // Date range helper functions using centralized date utilities
  const setThisWeek = () => {
    const now = getCurrentDateCT();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    const end = new Date(now);
    end.setDate(now.getDate() + (6 - now.getDay())); // End of week (Saturday)

    const startDateStr = formatDateCT(start);
    const endDateStr = formatDateCT(end);

    // Set state
    setStartDate(startDateStr);
    setEndDate(endDateStr);
    setDateRangeFilter("week");
    setCurrentPage(1);

    // Immediately fetch with new filters
    fetchOrders(1, {
      startDate: startDateStr,
      endDate: endDateStr,
    });
  };

  const setThisSaturday = () => {
    const now = getCurrentDateCT();
    const daysUntilSaturday = (6 - now.getDay()) % 7; // 0 if today is Saturday
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);

    const saturdayStr = formatDateCT(saturday);

    // Set state
    setStartDate(saturdayStr);
    setEndDate(saturdayStr);
    setDateRangeFilter("saturday");
    setCurrentPage(1);

    // Immediately fetch with new filters
    fetchOrders(1, {
      startDate: saturdayStr,
      endDate: saturdayStr,
    });
  };

  const setThisWeekend = () => {
    const now = getCurrentDateCT();
    const daysUntilSaturday = (6 - now.getDay()) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);

    const saturdayStr = formatDateCT(saturday);
    const sundayStr = formatDateCT(sunday);

    // Set state
    setStartDate(saturdayStr);
    setEndDate(sundayStr);
    setDateRangeFilter("weekend");
    setCurrentPage(1);

    // Immediately fetch with new filters
    fetchOrders(1, {
      startDate: saturdayStr,
      endDate: sundayStr,
    });
  };

  const setThisMonth = () => {
    const { startDate: monthStart, endDate: monthEnd } = getThisMonthDates();

    // Set state
    setStartDate(monthStart);
    setEndDate(monthEnd);
    setDateRangeFilter("month");
    setCurrentPage(1);

    // Immediately fetch with new filters
    fetchOrders(1, {
      startDate: monthStart,
      endDate: monthEnd,
    });
  };

  const setThisYear = () => {
    const now = getCurrentDateCT();
    const year = now.getFullYear();

    const start = getFirstDayOfMonthCT(year, 1); // January 1st
    const end = getLastDayOfMonthCT(year, 12); // December 31st

    const startDateStr = formatDateCT(start);
    const endDateStr = formatDateCT(end);

    // Set state
    setStartDate(startDateStr);
    setEndDate(endDateStr);
    setDateRangeFilter("year");
    setCurrentPage(1);

    // Immediately fetch with new filters
    fetchOrders(1, {
      startDate: startDateStr,
      endDate: endDateStr,
    });
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Get the NextAuth session
  const { data: session, status: authStatus } = useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  // Fetch orders with current filters and pagination
  const fetchOrders = async (
    page = currentPage,
    overrideFilters?: {
      startDate?: string;
      endDate?: string;
      status?: string;
      paymentStatus?: string;
      orderNumber?: string;
      customerSearch?: string;
      taskStatus?: string;
    },
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: Record<string, string | number> = {
        page,
        limit: pageSize,
      };

      // Use override filters if provided, otherwise use current state
      const effectiveStartDate = overrideFilters?.startDate ?? startDate;
      const effectiveEndDate = overrideFilters?.endDate ?? endDate;
      const effectiveStatus = overrideFilters?.status ?? status;
      const effectivePaymentStatus =
        overrideFilters?.paymentStatus ?? paymentStatus;
      const effectiveOrderNumber = overrideFilters?.orderNumber ?? orderNumber;
      const effectiveCustomerSearch =
        overrideFilters?.customerSearch ?? customerSearch;
      const effectiveTaskStatus = overrideFilters?.taskStatus ?? taskStatus;

      if (effectiveStartDate) filters.startDate = effectiveStartDate;
      if (effectiveEndDate) filters.endDate = effectiveEndDate;
      if (effectiveStatus) filters.status = effectiveStatus;
      if (effectivePaymentStatus)
        filters.paymentStatus = effectivePaymentStatus;
      if (effectiveOrderNumber) filters.orderNumber = effectiveOrderNumber;
      if (effectiveCustomerSearch) filters.customer = effectiveCustomerSearch;
      if (effectiveTaskStatus) filters.taskStatus = effectiveTaskStatus;

      const data = await getOrders(filters);
      setOrders(data.orders || []);

      // Update pagination information
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setCurrentPage(data.pagination.currentPage || 1);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch orders",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchOrders(page);
  };

  // Initial fetch
  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchOrders();
    }
  }, [authStatus]);

  // Handle filter submission
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1); // Reset to first page when applying filters
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setStartDate("");
    setEndDate("");
    setStatus("");
    setPaymentStatus("");
    setOrderNumber("");
    setCustomerSearch("");
    setTaskStatus("");
    setDateRangeFilter("none");
    setViewMode("table");
    // Reset filters and fetch all orders
    setTimeout(() => {
      fetchOrders(1); // Reset to first page when clearing filters
    }, 0);
  };

  // Group orders by delivery date and time for timeline view
  const groupOrdersByDeliveryTime = (orders: Order[]) => {
    const grouped: { [key: string]: Order[] } = {};

    orders.forEach((order) => {
      let timeSlot = "No Delivery Time";

      if (order.deliveryDate) {
        const deliveryDate = new Date(order.deliveryDate);
        const dateKey = formatDateCT(deliveryDate);

        // Extract time from notes if available, otherwise use default slots
        let timeKey = "All Day";
        if (order.notes) {
          const timeMatch = order.notes.match(/(\d{1,2}:\d{2})/);
          if (timeMatch) {
            timeKey = timeMatch[1];
          }
        }

        timeSlot = `${dateKey} - ${timeKey}`;
      }

      if (!grouped[timeSlot]) {
        grouped[timeSlot] = [];
      }
      grouped[timeSlot].push(order);
    });

    // Sort time slots
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === "No Delivery Time") return 1;
      if (b === "No Delivery Time") return -1;
      return a.localeCompare(b);
    });

    const result: { [key: string]: Order[] } = {};
    sortedKeys.forEach((key) => {
      result[key] = grouped[key].sort((a, b) => {
        // Sort by delivery time within each slot
        if (a.deliveryDate && b.deliveryDate) {
          return (
            new Date(a.deliveryDate).getTime() -
            new Date(b.deliveryDate).getTime()
          );
        }
        return 0;
      });
    });

    return result;
  };

  // Calculate summary stats for current orders
  const calculateSummaryStats = (orders: Order[]) => {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const agreementStats = {
      signed: orders.filter((o) => o.agreementStatus === "signed").length,
      sent: orders.filter(
        (o) =>
          o.agreementStatus === "pending" || o.agreementStatus === "viewed",
      ).length,
      notSent: orders.filter((o) => o.agreementStatus === "not_sent").length,
    };

    return {
      totalOrders: orders.length,
      totalRevenue,
      agreementStats,
    };
  };

  const summaryStats = calculateSummaryStats(orders);
  const groupedOrders = groupOrdersByDeliveryTime(orders);

  // Format date for display using our centralized date utility
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return formatDisplayDateCT(date);
  };

  // Handle sync all agreements
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    setError(null);
    setSyncResults(null);

    try {
      const result = await syncAllAgreementStatuses();

      const { results } = result;
      const summary = `✅ ${results.updated} updated, ℹ️ ${results.alreadyCurrent} already current, ❌ ${results.failed} failed (${results.total} total)`;

      setSyncResults(summary);

      // Refresh the orders list to show updated statuses
      fetchOrders(currentPage);

      // Show detailed errors if any
      if (results.errors && results.errors.length > 0) {
        console.error("Sync errors:", results.errors);
      }
    } catch (err) {
      console.error("Error syncing all agreements:", err);
      setError(
        err instanceof Error ? err.message : "Failed to sync agreements",
      );
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Handle order deletion
  const handleDelete = async (id: string) => {
    // Check if authenticated
    if (authStatus !== "authenticated") {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this order? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);

      // Use the deleteOrder function from the API client
      await deleteOrder(id);

      // Update the local state
      setOrders(orders.filter((order) => order._id !== id));

      // Show success message
      alert("Order deleted successfully");
    } catch (error) {
      // Handle authentication errors
      if (
        error instanceof Error &&
        error.message.includes("Authentication failed")
      ) {
        setError("Your session has expired. Please log in again to continue.");

        // Force refresh the session by redirecting to login
        setTimeout(() => {
          const returnUrl = encodeURIComponent(window.location.pathname);
          router.push(`/login?returnUrl=${returnUrl}`);
        }, 2000);
        return;
      }

      setError(
        error instanceof Error ? error.message : "Failed to delete order",
      );
      console.error("Error deleting order:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Confirmed":
        return "bg-purple-100 text-purple-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get payment status color
  const getPaymentStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Authorized":
        return "bg-blue-100 text-blue-800";
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-gray-100 text-gray-800";
      case "Partially Refunded":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading spinner when session is loading
  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect in useEffect)
  if (authStatus !== "authenticated") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Please log in to access this page...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sync all agreement statuses with DocuSeal"
          >
            {isSyncingAll && <LoadingSpinner className="w-4 h-4 mr-2" />}
            {isSyncingAll ? "Syncing..." : "🔄 Sync All Agreements"}
          </button>
          <Link
            href="/admin/orders/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Order
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-4">Filter Orders</h2>
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          {/* Search and Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Search by Order Number
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Enter order number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Search by Customer
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Name, email, or phone"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label
                htmlFor="start-date"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRangeFilter("none");
                  setCurrentPage(1);
                }}
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="end-date"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRangeFilter("none");
                  setCurrentPage(1);
                }}
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={setThisSaturday}
                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                  dateRangeFilter === "saturday"
                    ? "bg-green-600 text-white ring-green-600"
                    : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
                }`}
              >
                This Saturday
              </button>
              <button
                type="button"
                onClick={setThisWeekend}
                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                  dateRangeFilter === "weekend"
                    ? "bg-purple-600 text-white ring-purple-600"
                    : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
                }`}
              >
                This Weekend
              </button>
              <button
                type="button"
                onClick={setThisWeek}
                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                  dateRangeFilter === "week"
                    ? "bg-blue-600 text-white ring-blue-600"
                    : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={setThisMonth}
                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                  dateRangeFilter === "month"
                    ? "bg-blue-600 text-white ring-blue-600"
                    : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={setThisYear}
                className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                  dateRangeFilter === "year"
                    ? "bg-blue-600 text-white ring-blue-600"
                    : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
                }`}
              >
                This Year
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Order Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Paid">Paid</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Status
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Authorized">Authorized</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Partially Refunded">Partially Refunded</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Task Status
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Task Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <select
                  value={viewMode}
                  onChange={(e) =>
                    setViewMode(e.target.value as "table" | "timeline")
                  }
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="table">Table View</option>
                  <option value="timeline">Timeline View</option>
                </select>
              </label>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleFilterReset}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Sync results message */}
      {syncResults && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
          <div className="flex items-center">
            <span className="mr-2">🔄</span>
            <span>Sync completed: {syncResults}</span>
            <button
              onClick={() => setSyncResults(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {orders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {summaryStats.totalOrders}
              </div>
              <div className="text-sm text-gray-500">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${summaryStats.totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {summaryStats.agreementStats.signed}
                  </div>
                  <div className="text-xs text-gray-500">Signed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {summaryStats.agreementStats.sent}
                  </div>
                  <div className="text-xs text-gray-500">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {summaryStats.agreementStats.notSent}
                  </div>
                  <div className="text-xs text-gray-500">Not Sent</div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">Agreements</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {summaryStats.agreementStats.signed +
                  summaryStats.agreementStats.sent}
                /{summaryStats.totalOrders}
              </div>
              <div className="text-sm text-gray-500">Ready for Delivery</div>
            </div>
          </div>
        </div>
      )}

      {/* Orders display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div className="p-6">
            {Object.keys(groupedOrders).length === 0 ? (
              <div className="text-center text-sm text-gray-500">
                No orders found
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedOrders).map(([timeSlot, timeOrders]) => (
                  <div
                    key={timeSlot}
                    className="border-l-4 border-blue-500 pl-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {timeSlot}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {timeOrders.length} order
                        {timeOrders.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {timeOrders.map((order) => (
                        <div
                          key={order._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Order Header */}
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {order.orderNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                ${order.totalAmount.toFixed(2)}
                              </div>
                            </div>
                            <AgreementStatusBadge
                              status={order.agreementStatus || "not_sent"}
                              deliveryDate={
                                order.deliveryDate
                                  ? new Date(order.deliveryDate)
                                  : undefined
                              }
                            />
                          </div>

                          {/* Customer Info - Prominent */}
                          <div className="bg-blue-50 p-3 rounded-lg mb-3">
                            <div className="font-medium text-gray-900 mb-2">
                              {order.customerName ||
                                order.customerEmail ||
                                `Contact ID: ${order.contactId}`}
                            </div>
                            {order.customerPhone && (
                              <div className="text-sm text-gray-700 mb-1">
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  className="flex items-center hover:text-blue-600"
                                >
                                  📞 {order.customerPhone}
                                </a>
                              </div>
                            )}
                            {(order.customerAddress || order.customerCity) && (
                              <div className="text-sm text-gray-700">
                                📍{" "}
                                {[
                                  order.customerAddress,
                                  order.customerCity,
                                  order.customerState,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/orders/${order._id}/edit`}
                              className="flex-1 text-center text-blue-600 hover:text-blue-900 text-sm py-2 px-3 rounded border border-blue-200 hover:bg-blue-50"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/admin/orders/${order._id}`}
                              className="flex-1 text-center text-gray-600 hover:text-gray-900 text-sm py-2 px-3 rounded border border-gray-200 hover:bg-gray-50"
                            >
                              View
                            </Link>
                          </div>

                          {/* Agreement Actions */}
                          <div className="mt-2">
                            <AgreementActions
                              order={order}
                              onAgreementSent={() => fetchOrders(currentPage)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop Table */}
        {viewMode === "table" && (
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Delivery Date
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Order Info
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Customer Details
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Agreement Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      {/* Delivery Date Column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <DeliveryCountdown
                          deliveryDate={
                            order.deliveryDate
                              ? parseDateCT(
                                  order.deliveryDate.toString().split("T")[0],
                                )
                              : undefined
                          }
                          eventDate={
                            order.eventDate
                              ? parseDateCT(
                                  order.eventDate.toString().split("T")[0],
                                )
                              : undefined
                          }
                          notes={order.notes}
                        />
                      </td>

                      {/* Order Info Column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(order.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ${order.totalAmount.toFixed(2)} • {order.status} •{" "}
                            {order.paymentStatus}
                          </div>
                        </div>
                      </td>

                      {/* Customer Details Column - Enhanced */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col space-y-2">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {order.customerName ||
                              order.customerEmail ||
                              `Contact ID: ${order.contactId}`}
                          </div>
                          {order.customerPhone && (
                            <div className="text-sm text-gray-700">
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="flex items-center hover:text-blue-600"
                              >
                                📞{" "}
                                <span className="ml-1 font-medium">
                                  {order.customerPhone}
                                </span>
                              </a>
                            </div>
                          )}
                          {(order.customerAddress || order.customerCity) && (
                            <div className="text-sm text-gray-700">
                              <div className="flex items-start">
                                <span className="mr-1">📍</span>
                                <span className="font-medium">
                                  {[
                                    order.customerAddress,
                                    order.customerCity,
                                    order.customerState,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Agreement Status Column */}
                      <td className=" ">
                        <AgreementStatusBadge
                          status={order.agreementStatus || "not_sent"}
                          deliveryDate={
                            order.deliveryDate
                              ? new Date(order.deliveryDate)
                              : undefined
                          }
                        />
                        {/* Agreement Actions */}
                        <AgreementActions
                          order={order}
                          onAgreementSent={() => fetchOrders(currentPage)}
                        />
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex flex-col space-y-2 items-end">
                          {/* Standard Actions */}
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/orders/${order._id}/edit`}
                              className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/admin/orders/${order._id}`}
                              className="text-gray-600 hover:text-gray-900 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                            >
                              View
                            </Link>
                            {order.status !== "Paid" &&
                              order.status !== "Confirmed" && (
                                <button
                                  onClick={() => handleDelete(order._id)}
                                  className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <LoadingSpinner className="w-3 h-3" />
                                  ) : (
                                    "Delete"
                                  )}
                                </button>
                              )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Card Layout */}
        {viewMode === "table" && (
          <div className="md:hidden">
            {orders.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No orders found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <div key={order._id} className="p-4 hover:bg-gray-50">
                    {/* Card Header - Delivery Date */}
                    <div className="mb-3">
                      <DeliveryCountdown
                        deliveryDate={
                          order.deliveryDate
                            ? parseDateCT(
                                order.deliveryDate.toString().split("T")[0],
                              )
                            : undefined
                        }
                        eventDate={
                          order.eventDate
                            ? parseDateCT(
                                order.eventDate.toString().split("T")[0],
                              )
                            : undefined
                        }
                        notes={order.notes}
                      />
                    </div>

                    {/* Card Body - Order Info and Customer */}
                    <div className="grid grid-cols-1 gap-3 mb-3">
                      {/* Order Info */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Order Date: {formatDate(order.createdAt)}</div>
                          <div>Total: ${order.totalAmount.toFixed(2)}</div>
                          <div className="flex space-x-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}
                            >
                              {order.status}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {order.customerName ||
                            order.customerEmail ||
                            `Contact ID: ${order.contactId}`}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {order.customerPhone && (
                            <div>📞 {order.customerPhone}</div>
                          )}
                          {(order.customerAddress || order.customerCity) && (
                            <div>
                              📍{" "}
                              {[
                                order.customerAddress,
                                order.customerCity,
                                order.customerState,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer - Agreement and Actions */}
                    <div className="space-y-3">
                      {/* Agreement Status */}
                      <div>
                        <AgreementStatusBadge
                          status={order.agreementStatus || "not_sent"}
                          deliveryDate={
                            order.deliveryDate
                              ? new Date(order.deliveryDate)
                              : undefined
                          }
                        />
                      </div>

                      {/* Agreement Actions */}
                      <div>
                        <AgreementActions
                          order={order}
                          onAgreementSent={() => fetchOrders(currentPage)}
                        />
                      </div>

                      {/* Standard Actions */}
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/orders/${order._id}/edit`}
                          className="flex-1 text-center text-blue-600 hover:text-blue-900 text-sm py-2 px-3 rounded border border-blue-200 hover:bg-blue-50"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="flex-1 text-center text-gray-600 hover:text-gray-900 text-sm py-2 px-3 rounded border border-gray-200 hover:bg-gray-50"
                        >
                          View
                        </Link>
                        {order.status !== "Paid" &&
                          order.status !== "Confirmed" && (
                            <button
                              onClick={() => handleDelete(order._id)}
                              className="flex-1 text-red-600 hover:text-red-900 text-sm py-2 px-3 rounded border border-red-200 hover:bg-red-50"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <LoadingSpinner className="w-4 h-4 mx-auto" />
                              ) : (
                                "Delete"
                              )}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination and Page Size Controls */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            {/* Page size selector */}
            <div className="mb-4 sm:mb-0">
              <label className="text-sm text-gray-700 flex items-center">
                <span className="mr-2">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value);
                    setPageSize(newSize);
                    setCurrentPage(1); // Reset to first page when changing page size
                    setTimeout(() => {
                      fetchOrders(1);
                    }, 0);
                  }}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="ml-2">per page</span>
              </label>
            </div>

            {/* Pagination controls - only show if we have more than 1 page */}
            {totalPages > 1 && (
              <div className="flex-1 flex justify-between sm:justify-end">
                {/* Mobile pagination controls */}
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>

                {/* Desktop pagination controls */}
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page{" "}
                      <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">First</span>
                        <span className="h-5 w-5 flex justify-center items-center">
                          «
                        </span>
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <span className="h-5 w-5 flex justify-center items-center">
                          ‹
                        </span>
                      </button>

                      {/* Page numbers */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          // Calculate page numbers to show
                          let pageNum;
                          if (totalPages <= 5) {
                            // Show all pages if 5 or fewer
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // Show first 5 pages
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            // Show last 5 pages
                            pageNum = totalPages - 4 + i;
                          } else {
                            // Show current page and 2 pages on each side
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === pageNum
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <span className="h-5 w-5 flex justify-center items-center">
                          ›
                        </span>
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Last</span>
                        <span className="h-5 w-5 flex justify-center items-center">
                          »
                        </span>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
