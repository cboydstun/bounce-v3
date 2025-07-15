import { useState, useCallback } from "react";
import { ViewMode, VIEW_MODES } from "../utils/orderConstants";
import { useDateRangeFilters, DateRangeState } from "./useDateRangeFilters";

export interface OrderFilters {
  status: string;
  paymentStatus: string;
  orderNumber: string;
  customerSearch: string;
  taskStatus: string;
  viewMode: ViewMode;
}

export const useOrderFilters = () => {
  const dateRangeFilters = useDateRangeFilters();

  const [filters, setFilters] = useState<OrderFilters>({
    status: "",
    paymentStatus: "",
    orderNumber: "",
    customerSearch: "",
    taskStatus: "",
    viewMode: VIEW_MODES.TABLE,
  });

  const updateFilter = useCallback(
    (key: keyof OrderFilters, value: string | ViewMode) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters({
      status: "",
      paymentStatus: "",
      orderNumber: "",
      customerSearch: "",
      taskStatus: "",
      viewMode: VIEW_MODES.TABLE,
    });
    dateRangeFilters.resetDateRange();
  }, [dateRangeFilters]);

  // Build API filters object
  const buildApiFilters = useCallback(
    (
      page: number,
      pageSize: number,
      overrideDates?: { startDate?: string; endDate?: string },
    ) => {
      const apiFilters: Record<string, string | number> = {
        page,
        limit: pageSize,
      };

      // Add date filters - use override dates if provided, otherwise use current state
      const startDate =
        overrideDates?.startDate ?? dateRangeFilters.dateRange.startDate;
      const endDate =
        overrideDates?.endDate ?? dateRangeFilters.dateRange.endDate;

      if (startDate) {
        apiFilters.startDate = startDate;
      }
      if (endDate) {
        apiFilters.endDate = endDate;
      }

      // Add other filters
      if (filters.status) apiFilters.status = filters.status;
      if (filters.paymentStatus)
        apiFilters.paymentStatus = filters.paymentStatus;
      if (filters.orderNumber) apiFilters.orderNumber = filters.orderNumber;
      if (filters.customerSearch) apiFilters.customer = filters.customerSearch;
      if (filters.taskStatus) apiFilters.taskStatus = filters.taskStatus;

      return apiFilters;
    },
    [filters, dateRangeFilters.dateRange],
  );

  return {
    filters,
    dateRange: dateRangeFilters.dateRange,
    updateFilter,
    resetFilters,
    buildApiFilters,
    dateRangeActions: {
      setThisWeek: dateRangeFilters.setThisWeek,
      setThisSaturday: dateRangeFilters.setThisSaturday,
      setThisWeekend: dateRangeFilters.setThisWeekend,
      setThisMonth: dateRangeFilters.setThisMonth,
      setThisYear: dateRangeFilters.setThisYear,
      setCustomDateRange: dateRangeFilters.setCustomDateRange,
    },
  };
};
