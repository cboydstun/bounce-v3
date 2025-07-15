import React from "react";
import { OrderFilters as OrderFiltersType } from "../hooks/useOrderFilters";
import { DateRangeState } from "../hooks/useDateRangeFilters";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  TASK_STATUSES,
  VIEW_MODES,
  DateRangeFilter,
  DATE_RANGE_FILTERS,
} from "../utils/orderConstants";

interface OrderFiltersProps {
  filters: OrderFiltersType;
  dateRange: DateRangeState;
  onFilterChange: (key: keyof OrderFiltersType, value: string) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onDateRangePreset: {
    setThisWeek: () => { startDate: string; endDate: string };
    setThisSaturday: () => { startDate: string; endDate: string };
    setThisWeekend: () => { startDate: string; endDate: string };
    setThisMonth: () => { startDate: string; endDate: string };
    setThisYear: () => { startDate: string; endDate: string };
  };
  onReset: () => void;
  onSubmit: (overrideDates?: { startDate?: string; endDate?: string }) => void;
  onPageReset: () => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  dateRange,
  onFilterChange,
  onDateRangeChange,
  onDateRangePreset,
  onReset,
  onSubmit,
  onPageReset,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleDateRangePreset = (
    presetFn: () => { startDate: string; endDate: string },
  ) => {
    const { startDate, endDate } = presetFn();
    onPageReset();
    // Use the returned dates directly instead of relying on state
    onDateRangeChange(startDate, endDate);
    // Pass the dates directly to onSubmit to avoid state timing issues
    onSubmit({ startDate, endDate });
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    const newStartDate = field === "startDate" ? value : dateRange.startDate;
    const newEndDate = field === "endDate" ? value : dateRange.endDate;
    onDateRangeChange(newStartDate, newEndDate);
    onPageReset();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-medium mb-4">Filter Orders</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search and Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Search by Order Number
              <input
                type="text"
                value={filters.orderNumber}
                onChange={(e) => onFilterChange("orderNumber", e.target.value)}
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
                value={filters.customerSearch}
                onChange={(e) =>
                  onFilterChange("customerSearch", e.target.value)
                }
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
              value={dateRange.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
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
              value={dateRange.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                handleDateRangePreset(onDateRangePreset.setThisSaturday)
              }
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                dateRange.dateRangeFilter === DATE_RANGE_FILTERS.SATURDAY
                  ? "bg-green-600 text-white ring-green-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              This Saturday
            </button>
            <button
              type="button"
              onClick={() =>
                handleDateRangePreset(onDateRangePreset.setThisWeekend)
              }
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                dateRange.dateRangeFilter === DATE_RANGE_FILTERS.WEEKEND
                  ? "bg-purple-600 text-white ring-purple-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              This Weekend
            </button>
            <button
              type="button"
              onClick={() =>
                handleDateRangePreset(onDateRangePreset.setThisWeek)
              }
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                dateRange.dateRangeFilter === DATE_RANGE_FILTERS.WEEK
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() =>
                handleDateRangePreset(onDateRangePreset.setThisMonth)
              }
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                dateRange.dateRangeFilter === DATE_RANGE_FILTERS.MONTH
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() =>
                handleDateRangePreset(onDateRangePreset.setThisYear)
              }
              className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                dateRange.dateRangeFilter === DATE_RANGE_FILTERS.YEAR
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
                value={filters.status}
                onChange={(e) => onFilterChange("status", e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Status
              <select
                value={filters.paymentStatus}
                onChange={(e) =>
                  onFilterChange("paymentStatus", e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Payment Statuses</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Task Status
              <select
                value={filters.taskStatus}
                onChange={(e) => onFilterChange("taskStatus", e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Task Statuses</option>
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <select
                value={filters.viewMode}
                onChange={(e) => onFilterChange("viewMode", e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value={VIEW_MODES.TABLE}>Table View</option>
                <option value={VIEW_MODES.TIMELINE}>Timeline View</option>
              </select>
            </label>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onReset}
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
  );
};
