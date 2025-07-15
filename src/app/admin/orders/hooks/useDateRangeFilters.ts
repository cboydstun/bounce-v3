import { useState, useCallback } from "react";
import {
  formatDateCT,
  getCurrentDateCT,
  getFirstDayOfMonthCT,
  getLastDayOfMonthCT,
} from "@/utils/dateUtils";
import { DateRangeFilter, DATE_RANGE_FILTERS } from "../utils/orderConstants";

export interface DateRangeState {
  startDate: string;
  endDate: string;
  dateRangeFilter: DateRangeFilter;
}

export const useDateRangeFilters = () => {
  const [dateRange, setDateRange] = useState<DateRangeState>({
    startDate: "",
    endDate: "",
    dateRangeFilter: DATE_RANGE_FILTERS.NONE,
  });

  // Get the current month date range
  const getThisMonthDates = useCallback(() => {
    const now = getCurrentDateCT();
    const year = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Start and end of current month only
    const start = getFirstDayOfMonthCT(year, currentMonth);
    const end = getLastDayOfMonthCT(year, currentMonth);

    return {
      startDate: formatDateCT(start),
      endDate: formatDateCT(end),
    };
  }, []);

  const setThisWeek = useCallback(() => {
    const now = getCurrentDateCT();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    const end = new Date(now);
    end.setDate(now.getDate() + (6 - now.getDay())); // End of week (Saturday)

    const startDateStr = formatDateCT(start);
    const endDateStr = formatDateCT(end);

    console.log("🗓️ This Week calculation:", {
      today: now.toDateString(),
      todayISO: now.toISOString(),
      currentDay: now.getDay(),
      start: start.toDateString(),
      startISO: start.toISOString(),
      end: end.toDateString(),
      endISO: end.toISOString(),
      startDateStr,
      endDateStr,
    });

    setDateRange({
      startDate: startDateStr,
      endDate: endDateStr,
      dateRangeFilter: DATE_RANGE_FILTERS.WEEK,
    });

    return { startDate: startDateStr, endDate: endDateStr };
  }, []);

  const setThisSaturday = useCallback(() => {
    const now = getCurrentDateCT();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    let daysUntilSaturday;
    if (currentDay === 6) {
      // Today is Saturday, use today
      daysUntilSaturday = 0;
    } else if (currentDay === 0) {
      // Today is Sunday, next Saturday is 6 days away
      daysUntilSaturday = 6;
    } else {
      // Monday-Friday, calculate days until Saturday
      daysUntilSaturday = 6 - currentDay;
    }

    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);

    const saturdayStr = formatDateCT(saturday);

    console.log("This Saturday calculation:", {
      today: now.toDateString(),
      currentDay,
      daysUntilSaturday,
      saturday: saturday.toDateString(),
      saturdayStr,
    });

    setDateRange({
      startDate: saturdayStr,
      endDate: saturdayStr,
      dateRangeFilter: DATE_RANGE_FILTERS.SATURDAY,
    });

    return { startDate: saturdayStr, endDate: saturdayStr };
  }, []);

  const setThisWeekend = useCallback(() => {
    const now = getCurrentDateCT();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    let daysUntilSaturday;
    if (currentDay === 6) {
      // Today is Saturday, use today and tomorrow
      daysUntilSaturday = 0;
    } else if (currentDay === 0) {
      // Today is Sunday, next Saturday is 6 days away
      daysUntilSaturday = 6;
    } else {
      // Monday-Friday, calculate days until Saturday
      daysUntilSaturday = 6 - currentDay;
    }

    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);

    const saturdayStr = formatDateCT(saturday);
    const sundayStr = formatDateCT(sunday);

    setDateRange({
      startDate: saturdayStr,
      endDate: sundayStr,
      dateRangeFilter: DATE_RANGE_FILTERS.WEEKEND,
    });

    return { startDate: saturdayStr, endDate: sundayStr };
  }, []);

  const setThisMonth = useCallback(() => {
    const { startDate: monthStart, endDate: monthEnd } = getThisMonthDates();

    setDateRange({
      startDate: monthStart,
      endDate: monthEnd,
      dateRangeFilter: DATE_RANGE_FILTERS.MONTH,
    });

    return { startDate: monthStart, endDate: monthEnd };
  }, [getThisMonthDates]);

  const setThisYear = useCallback(() => {
    const now = getCurrentDateCT();
    const year = now.getFullYear();

    const start = getFirstDayOfMonthCT(year, 1); // January 1st
    const end = getLastDayOfMonthCT(year, 12); // December 31st

    const startDateStr = formatDateCT(start);
    const endDateStr = formatDateCT(end);

    setDateRange({
      startDate: startDateStr,
      endDate: endDateStr,
      dateRangeFilter: DATE_RANGE_FILTERS.YEAR,
    });

    return { startDate: startDateStr, endDate: endDateStr };
  }, []);

  const setCustomDateRange = useCallback(
    (startDate: string, endDate: string) => {
      setDateRange({
        startDate,
        endDate,
        dateRangeFilter: DATE_RANGE_FILTERS.NONE,
      });
    },
    [],
  );

  const resetDateRange = useCallback(() => {
    setDateRange({
      startDate: "",
      endDate: "",
      dateRangeFilter: DATE_RANGE_FILTERS.NONE,
    });
  }, []);

  return {
    dateRange,
    setThisWeek,
    setThisSaturday,
    setThisWeekend,
    setThisMonth,
    setThisYear,
    setCustomDateRange,
    resetDateRange,
  };
};
