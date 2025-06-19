"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getOrders, deleteOrder, syncAllAgreementStatuses } from "@/utils/api";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { formatDisplayDateCT } from "@/utils/dateUtils";
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

  // Filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [taskStatus, setTaskStatus] = useState<string>("");

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
  const fetchOrders = async (page = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: Record<string, string | number> = {
        page,
        limit: pageSize,
      };

      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (status) filters.status = status;
      if (paymentStatus) filters.paymentStatus = paymentStatus;
      if (orderNumber) filters.orderNumber = orderNumber;
      if (customerSearch) filters.customer = customerSearch;
      if (taskStatus) filters.taskStatus = taskStatus;

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
    // Reset filters and fetch all orders
    setTimeout(() => {
      fetchOrders(1); // Reset to first page when clearing filters
    }, 0);
  };

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

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>
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
          <div className="flex justify-end space-x-4">
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

      {/* Orders table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Desktop Table */}
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
                            ? new Date(order.deliveryDate)
                            : undefined
                        }
                        eventDate={
                          order.eventDate
                            ? new Date(order.eventDate)
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

                    {/* Customer Details Column */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {order.customerName ||
                            order.customerEmail ||
                            `Contact ID: ${order.contactId}`}
                        </div>
                        {order.customerPhone && (
                          <div className="text-xs text-gray-500">
                            📞 {order.customerPhone}
                          </div>
                        )}
                        {(order.customerAddress || order.customerCity) && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
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

        {/* Mobile Card Layout */}
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
                          ? new Date(order.deliveryDate)
                          : undefined
                      }
                      eventDate={
                        order.eventDate ? new Date(order.eventDate) : undefined
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
