"use client";

import React from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { VIEW_MODES } from "./utils/orderConstants";
import { useOrdersData } from "./hooks/useOrdersData";
import { useOrderFilters } from "./hooks/useOrderFilters";
import { useOrderStats } from "./hooks/useOrderStats";
import { OrderSummaryStats } from "./components/OrderSummaryStats";
import { OrderFilters } from "./components/OrderFilters";
import { OrderTable } from "./components/OrderTable";
import { OrderMobileCards } from "./components/OrderMobileCards";
import { OrderTimeline } from "./components/OrderTimeline";
import { PaginationControls } from "./components/PaginationControls";

export default function OrdersPage() {
  const ordersData = useOrdersData();
  const orderFilters = useOrderFilters();
  const orderStats = useOrderStats(ordersData.orders);

  const {
    orders,
    pagination,
    isLoading,
    isDeleting,
    isSyncingAll,
    error,
    syncResults,
    authStatus,
    fetchOrders,
    handlePageChange,
    handlePageSizeChange,
    handleDelete,
    handleSyncAll,
    clearSyncResults,
  } = ordersData;

  const {
    filters,
    dateRange,
    updateFilter,
    resetFilters,
    buildApiFilters,
    dateRangeActions,
  } = orderFilters;

  // Handle filter submission
  const handleFilterSubmit = (overrideDates?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const apiFilters = buildApiFilters(1, pagination.pageSize, overrideDates);
    fetchOrders(1, apiFilters);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    resetFilters();
    setTimeout(() => {
      fetchOrders(1);
    }, 0);
  };

  // Handle page reset (used by filters)
  const handlePageReset = () => {
    // This is handled internally by the pagination logic
  };

  // Handle date range changes
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    dateRangeActions.setCustomDateRange(startDate, endDate);
  };

  // Handle page changes with current filters
  const handlePageChangeWithFilters = (page: number) => {
    const apiFilters = buildApiFilters(page, pagination.pageSize);
    handlePageChange(page, apiFilters);
  };

  // Handle page size changes with current filters
  const handlePageSizeChangeWithFilters = (newSize: number) => {
    const apiFilters = buildApiFilters(1, newSize);
    handlePageSizeChange(newSize, apiFilters);
  };

  // Handle agreement sent callback
  const handleAgreementSent = () => {
    const apiFilters = buildApiFilters(
      pagination.currentPage,
      pagination.pageSize,
    );
    fetchOrders(pagination.currentPage, apiFilters);
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
      {/* Header */}
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
      <OrderFilters
        filters={filters}
        dateRange={dateRange}
        onFilterChange={updateFilter}
        onDateRangeChange={handleDateRangeChange}
        onDateRangePreset={dateRangeActions}
        onReset={handleFilterReset}
        onSubmit={handleFilterSubmit}
        onPageReset={handlePageReset}
      />

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
              onClick={clearSyncResults}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <OrderSummaryStats stats={orderStats} />

      {/* Orders display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filters.viewMode === VIEW_MODES.TIMELINE ? (
          <OrderTimeline
            orders={orders}
            onAgreementSent={handleAgreementSent}
          />
        ) : (
          <>
            <OrderTable
              orders={orders}
              isDeleting={isDeleting}
              onDelete={handleDelete}
              onAgreementSent={handleAgreementSent}
            />
            <OrderMobileCards
              orders={orders}
              isDeleting={isDeleting}
              onDelete={handleDelete}
              onAgreementSent={handleAgreementSent}
            />
          </>
        )}

        {/* Pagination */}
        <PaginationControls
          pagination={pagination}
          onPageChange={handlePageChangeWithFilters}
          onPageSizeChange={handlePageSizeChangeWithFilters}
        />
      </div>
    </div>
  );
}
