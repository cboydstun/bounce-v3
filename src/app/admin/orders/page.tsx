"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getOrders, deleteOrder } from "@/utils/api";
import { Order } from "@/types/order";

interface OrderListItem {
  id: string;
  orderNumber: string;
  contactId?: string;
  customerName?: string;
  customerEmail?: string;
  items: Array<{
    type: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  totalAmount: number;
  balanceDue: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "processing" | "paid" | "confirmed" | "cancelled" | "refunded";
type PaymentStatusFilter = "all" | "pending" | "authorized" | "paid" | "failed" | "refunded" | "partially-refunded";
type DateRangeFilter = "none" | "week" | "month" | "year";

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<"createdAt" | null>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Helper functions for date ranges
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Initialize with first and last day of current month
  const getCurrentMonthDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: formatDateForInput(start),
      endDate: formatDateForInput(end),
    };
  };

  const { startDate: initialStartDate, endDate: initialEndDate } =
    getCurrentMonthDates();

  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("month");

  const setThisWeek = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    const end = new Date(now);
    end.setDate(now.getDate() + (6 - now.getDay())); // End of week (Saturday)

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    setDateRangeFilter("week");
    setCurrentPage(1);
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    setDateRangeFilter("month");
    setCurrentPage(1);
  };

  const setThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    setDateRangeFilter("year");
    setCurrentPage(1);
  };

  // Get the NextAuth session
  const { data: session, status } = useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Only fetch orders if authenticated
    if (status !== "authenticated") return;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare query parameters for API call
        const params: {
          startDate?: string;
          endDate?: string;
          status?: string;
          paymentStatus?: string;
        } = {};

        // Add date filters if set
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        // Add status filter if not "all"
        if (statusFilter !== "all") {
          params.status = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
        }

        // Add payment status filter if not "all"
        if (paymentStatusFilter !== "all") {
          // Convert kebab-case to title case
          if (paymentStatusFilter === "partially-refunded") {
            params.paymentStatus = "Partially Refunded";
          } else {
            params.paymentStatus = paymentStatusFilter.charAt(0).toUpperCase() + paymentStatusFilter.slice(1);
          }
        }

        // Call the API with filters
        const data = await getOrders(params);

        // Map the orders from the API response
        const mappedOrders = data.orders
          ? data.orders.map((order: Order) => ({
              id: order._id,
              orderNumber: order.orderNumber,
              contactId: order.contactId as string,
              customerName: order.customerName || "",
              customerEmail: order.customerEmail || "",
              items: order.items,
              subtotal: order.subtotal,
              totalAmount: order.totalAmount,
              balanceDue: order.balanceDue,
              status: order.status,
              paymentStatus: order.paymentStatus,
              paymentMethod: order.paymentMethod,
              createdAt: order.createdAt,
            }))
          : [];

        setOrders(mappedOrders);
      } catch (error) {
        // Handle authentication errors
        if (
          error instanceof Error &&
          (error.message.includes("401") ||
            error.message.includes("Authentication failed"))
        ) {
          console.error("Authentication error in fetchOrders:", error);
          // Redirect to login page
          router.push("/login");
          return;
        }

        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [router, startDate, endDate, statusFilter, paymentStatusFilter, status]);

  const handleDelete = async (id: string) => {
    // Check if authenticated
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    if (
      !window.confirm("Are you sure you want to delete this order?")
    ) {
      return;
    }

    try {
      setIsLoading(true);

      // Use the deleteOrder function from the API client
      await deleteOrder(id);

      // Update the local state
      setOrders(orders.filter((order) => order.id !== id));
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/login");
        return;
      }

      setError(
        error instanceof Error ? error.message : "Failed to delete order"
      );
      console.error("Error deleting order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Paid":
        return "bg-purple-100 text-purple-800";
      case "Cancelled":
        return "bg-gray-100 text-gray-800";
      case "Refunded":
        return "bg-red-100 text-red-800";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Authorized":
        return "bg-blue-100 text-blue-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-gray-100 text-gray-800";
      case "Partially Refunded":
        return "bg-orange-100 text-orange-800";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setDateRangeFilter("none");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setCurrentPage(1);
  };

  // Filter orders by date range and status
  const filteredOrders = orders.filter((order) => {
    // Date filter - Fix timezone issues by using consistent date handling
    const dateStr = order.createdAt;
    let createdDate;

    // Handle ISO format dates (YYYY-MM-DD)
    if (
      typeof dateStr === "string" &&
      dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      createdDate = new Date(`${dateStr}T12:00:00`);
    } else {
      // For dates with time component, create a date object in local timezone
      const date = new Date(dateStr);
      createdDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // Apply same handling to start/end dates
    let start = null;
    if (startDate) {
      if (startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        start = new Date(`${startDate}T00:00:00`);
      } else {
        const sDate = new Date(startDate);
        start = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
        );
      }
    }

    let end = null;
    if (endDate) {
      if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        end = new Date(`${endDate}T23:59:59`);
      } else {
        const eDate = new Date(endDate);
        end = new Date(
          eDate.getFullYear(),
          eDate.getMonth(),
          eDate.getDate(),
          23,
          59,
          59,
        );
      }
    }

    const meetsDateCriteria =
      start && end
        ? createdDate >= start && createdDate <= end
        : start
          ? createdDate >= start
          : end
            ? createdDate <= end
            : true;

    // Status filter
    let meetsStatusCriteria = true;
    if (statusFilter !== "all") {
      const statusValue = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      meetsStatusCriteria = order.status === statusValue;
    }

    // Payment status filter
    let meetsPaymentStatusCriteria = true;
    if (paymentStatusFilter !== "all") {
      let paymentStatusValue;
      if (paymentStatusFilter === "partially-refunded") {
        paymentStatusValue = "Partially Refunded";
      } else {
        paymentStatusValue = paymentStatusFilter.charAt(0).toUpperCase() + paymentStatusFilter.slice(1);
      }
      meetsPaymentStatusCriteria = order.paymentStatus === paymentStatusValue;
    }

    return meetsDateCriteria && meetsStatusCriteria && meetsPaymentStatusCriteria;
  });

  // Sort orders based on current sort column and direction
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortColumn === "createdAt") {
      // Use consistent date handling for sorting
      const getConsistentDate = (dateStr: string) => {
        // Handle ISO format dates (YYYY-MM-DD)
        if (
          typeof dateStr === "string" &&
          dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          return new Date(`${dateStr}T12:00:00`).getTime();
        } else {
          // For dates with time component or Date objects
          const date = new Date(dateStr);
          return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          ).getTime();
        }
      };

      const dateA = getConsistentDate(a.createdAt);
      const dateB = getConsistentDate(b.createdAt);
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentOrders = sortedOrders.slice(startIndex, endIndex);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Show loading spinner when session is loading or when fetching orders
  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect in useEffect)
  if (status !== "authenticated") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Please log in to access this page...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Orders
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all orders including customer details, items, and status.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <Link
            href="/admin/orders/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            New Order
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
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
          <div className="flex gap-2">
            <button
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

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "all"
                  ? "bg-gray-900 text-white ring-gray-900"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "pending"
                  ? "bg-yellow-500 text-white ring-yellow-500"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setStatusFilter("processing");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "processing"
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => {
                setStatusFilter("paid");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "paid"
                  ? "bg-purple-600 text-white ring-purple-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => {
                setStatusFilter("confirmed");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "confirmed"
                  ? "bg-green-600 text-white ring-green-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => {
                setStatusFilter("cancelled");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "cancelled"
                  ? "bg-gray-600 text-white ring-gray-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Cancelled
            </button>
            <button
              onClick={() => {
                setStatusFilter("refunded");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                statusFilter === "refunded"
                  ? "bg-red-600 text-white ring-red-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Refunded
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setPaymentStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                paymentStatusFilter === "all"
                  ? "bg-gray-900 text-white ring-gray-900"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              All Payment Statuses
            </button>
            <button
              onClick={() => {
                setPaymentStatusFilter("pending");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                paymentStatusFilter === "pending"
                  ? "bg-yellow-500 text-white ring-yellow-500"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setPaymentStatusFilter("authorized");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                paymentStatusFilter === "authorized"
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Authorized
            </button>
            <button
              onClick={() => {
                setPaymentStatusFilter("paid");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                paymentStatusFilter === "paid"
                  ? "bg-green-600 text-white ring-green-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => {
                setPaymentStatusFilter("failed");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                paymentStatusFilter === "failed"
                  ? "bg-red-600 text-white ring-red-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Failed
            </button>
            <button
              onClick={() => {
                setPaymentStatusFilter("refunded");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                paymentStatusFilter === "refunded"
                  ? "bg-gray-600 text-white ring-gray-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Refunded
            </button>
            <button
              onClick={() => {
                setPaymentStatusFilter("partially-refunded");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                paymentStatusFilter === "partially-refunded"
                  ? "bg-orange-600 text-white ring-orange-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              Partially Refunded
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Reset All Filters
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded border-gray-300 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages || 1, currentPage + 1))
              }
              disabled={currentPage === (totalPages || 1)}
              className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 sm:pl-6"
                      onClick={() => {
                        if (sortColumn === "createdAt") {
                          setSortDirection(
                            sortDirection === "asc" ? "desc" : "asc",
                          );
                        } else {
                          setSortColumn("createdAt");
                          setSortDirection("asc");
                        }
                      }}
                    >
                      Date{" "}
                      {sortColumn === "createdAt" && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Order Info
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Items
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Payment
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                        {(() => {
                          // Fix timezone issue by parsing the date and preserving the day
                          const dateStr = order.createdAt;

                          // Handle ISO format dates (YYYY-MM-DD)
                          if (
                            typeof dateStr === "string" &&
                            dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
                          ) {
                            return new Date(
                              `${dateStr}T12:00:00`,
                            ).toLocaleDateString();
                          }

                          // For dates with time component or Date objects
                          const date = new Date(dateStr);
                          return date.toLocaleDateString();
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-gray-500">
                          {order.contactId ? (
                            <Link
                              href={`/admin/contacts/${order.contactId}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Contact
                            </Link>
                          ) : (
                            "No Contact"
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="font-medium">
                          {order.customerName || "N/A"}
                        </div>
                        <div>{order.customerEmail || "N/A"}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <ul className="list-disc pl-5">
                          {order.items.map((item, index) => (
                            <li key={index}>
                              {item.name} ({item.quantity} x ${item.unitPrice.toFixed(2)})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Total:</span> ${order.totalAmount.toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Balance:</span> ${order.balanceDue.toFixed(2)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                            order.status,
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusColor(
                              order.paymentStatus,
                            )}`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                        <div className="mt-1 text-xs">
                          {order.paymentMethod.charAt(0).toUpperCase() +
                            order.paymentMethod.slice(1)}
                        </div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/admin/orders/${order.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <LoadingSpinner className="w-4 h-4" />
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-4 text-sm text-gray-500 text-center"
                      >
                        No orders found matching the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
