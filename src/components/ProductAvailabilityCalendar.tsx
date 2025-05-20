"use client";

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  checkProductAvailability,
  checkBatchProductAvailability,
} from "@/utils/api";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import {
  formatDateCT,
  parseDateCT,
  getFirstDayOfMonthCT,
  getLastDayOfMonthCT,
  debugDate,
  CENTRAL_TIMEZONE,
} from "@/utils/dateUtils";

// Create a date localizer with Central Time zone
const moment = require("moment-timezone");
// Set the default timezone to Central Time
moment.tz.setDefault(CENTRAL_TIMEZONE);
moment.parseZone = true;
const localizer = momentLocalizer(moment);

interface AvailabilityEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  available: boolean;
  reason?: string;
  isBlackoutDate?: boolean;
}

interface ProductAvailabilityCalendarProps {
  productSlug: string;
  productName: string;
}

export default function ProductAvailabilityCalendar({
  productSlug,
  productName,
}: ProductAvailabilityCalendarProps) {
  const [events, setEvents] = useState<AvailabilityEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [checkedDates, setCheckedDates] = useState<
    Record<
      string,
      {
        available: boolean;
        reason?: string;
        isBlackoutDate?: boolean;
      }
    >
  >({});
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);

  // We're now using the centralized date utility functions from dateUtils.ts

  // Calculate visible dates for the current month view
  useEffect(() => {
    // Create dates in Central Time using our utility functions
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Month is 1-12 in our utility

    // First day of month in Central Time
    const start = getFirstDayOfMonthCT(year, month);
    // Last day of month in Central Time
    const end = getLastDayOfMonthCT(year, month);

    debugDate("First day of month", start);
    debugDate("Last day of month", end);

    const dates: Date[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setVisibleDates(dates);
    setIsLoading(true);
  }, [date]);

  // Check availability for visible dates
  useEffect(() => {
    if (visibleDates.length === 0) return;

    const newEvents: AvailabilityEvent[] = [];
    let hasError = false;

    // Start with loading state
    setIsLoading(true);
    setError(null);

    // Filter dates that haven't been checked yet
    const uncheckedDates = visibleDates.filter((date) => {
      const dateStr = formatDateCT(date);
      return checkedDates[dateStr] === undefined;
    });

    // If all dates are already checked, just create events from cache
    if (uncheckedDates.length === 0) {
      visibleDates.forEach((date) => {
        const dateStr = formatDateCT(date);
        const dateInfo = checkedDates[dateStr];

        if (dateInfo) {
          newEvents.push({
            id: dateStr,
            title: dateInfo.available
              ? "Available"
              : dateInfo.isBlackoutDate
                ? "Blackout Date"
                : "Unavailable",
            start: date,
            end: date,
            allDay: true,
            available: dateInfo.available,
            reason: dateInfo.reason,
            isBlackoutDate: dateInfo.isBlackoutDate,
          });
        }
      });

      setEvents(
        newEvents.sort((a, b) => a.start.getTime() - b.start.getTime()),
      );
      setIsLoading(false);
      return;
    }

    // Check each unchecked date one at a time using the batch endpoint
    // This is still checking one date at a time, but using the batch endpoint
    // which provides more metadata about the date
    const checkDates = async () => {
      const newCheckedDates: Record<
        string,
        {
          available: boolean;
          reason?: string;
          isBlackoutDate?: boolean;
        }
      > = {};

      for (const date of uncheckedDates) {
        const dateStr = formatDateCT(date);

        try {
          // Check availability for this date using the batch endpoint
          const result = await checkBatchProductAvailability(
            productSlug,
            dateStr,
          );

          // The result contains data for our product ID and metadata about the date
          // We need to find the product result by looking for an entry with our slug
          // The response keys are MongoDB ObjectIDs, so we need to find the right entry
          const productEntries = Object.entries(result).filter(
            ([key, value]) =>
              key !== "_meta" &&
              "product" in value &&
              value.product.slug === productSlug,
          );

          const productResult =
            productEntries.length > 0 ? productEntries[0][1] : null;
          const meta = result["_meta"];

          if (productResult && "available" in productResult) {
            // Store the result with additional metadata
            newCheckedDates[dateStr] = {
              available: productResult.available,
              reason: productResult.reason,
              isBlackoutDate:
                meta && "isBlackoutDate" in meta ? meta.isBlackoutDate : false,
            };
          }
        } catch (err) {
          console.error(`Error checking availability for ${dateStr}:`, err);
          hasError = true;
        }
      }

      // Update checkedDates state once with all new data
      setCheckedDates((prev) => ({
        ...prev,
        ...newCheckedDates,
      }));

      // Create events from both cached and new data
      visibleDates.forEach((date) => {
        const dateStr = formatDateCT(date);
        const dateInfo =
          newCheckedDates[dateStr] !== undefined
            ? newCheckedDates[dateStr]
            : checkedDates[dateStr];

        if (dateInfo) {
          // Create a new date object for the event to ensure it's properly set
          // This is crucial for correct date display in the calendar
          const eventDate = new Date(date);

          const title = dateInfo.isBlackoutDate
            ? "Blackout Date"
            : dateInfo.available
              ? "Available"
              : "Unavailable";

          newEvents.push({
            id: dateStr,
            title,
            start: eventDate,
            end: eventDate,
            allDay: true,
            available: dateInfo.available,
            reason: dateInfo.reason,
            isBlackoutDate: dateInfo.isBlackoutDate,
          });
        }
      });

      if (hasError) {
        setError("Failed to load some availability data. Please try again.");
      }

      setEvents(
        newEvents.sort((a, b) => a.start.getTime() - b.start.getTime()),
      );
      setIsLoading(false);
    };

    // Start the checking process
    checkDates();
  }, [visibleDates, productSlug, checkedDates]);

  // Custom event styling based on availability
  const eventStyleGetter = (event: AvailabilityEvent) => {
    // Different colors for different unavailability reasons
    let backgroundColor;
    if (event.available) {
      backgroundColor = "#10B981"; // Green if available
    } else if (event.isBlackoutDate) {
      backgroundColor = "#6B21A8"; // Purple for blackout dates
    } else {
      backgroundColor = "#EF4444"; // Red for other unavailability reasons
    }

    const textColor = "white";

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: textColor,
        border: "0px",
        display: "block",
      },
    };
  };

  // Custom day styling to show availability
  const dayPropGetter = (date: Date) => {
    const dateStr = formatDateCT(date);
    const event = events.find((e) => e.id === dateStr);

    if (!event) return {};

    // Apply different styling based on availability and blackout status
    let className = "unavailable-day";
    let backgroundColor = "rgba(239, 68, 68, 0.1)"; // Default red for unavailable

    if (event.available) {
      className = "available-day";
      backgroundColor = "rgba(16, 185, 129, 0.1)"; // Green for available
    } else if (event.isBlackoutDate) {
      className = "blackout-day";
      backgroundColor = "rgba(107, 33, 168, 0.1)"; // Purple for blackout dates
    }

    return {
      className,
      style: { backgroundColor },
    };
  };

  // Handle date selection
  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
  };

  // Custom toolbar component
  const CustomToolbar = ({ label, onNavigate, date: calendarDate }: any) => {
    const navigate = (action: string) => {
      let newDate = new Date(calendarDate);

      switch (action) {
        case "PREV":
          newDate = new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() - 1,
            1,
          );
          break;
        case "NEXT":
          newDate = new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() + 1,
            1,
          );
          break;
        case "TODAY":
          newDate = new Date();
          break;
      }

      // Call the original onNavigate function
      onNavigate(action);

      // Also update our component's date state
      setDate(newDate);
    };

    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => navigate("PREV")}>
            Previous
          </button>
          <button type="button" onClick={() => navigate("TODAY")}>
            Today
          </button>
          <button type="button" onClick={() => navigate("NEXT")}>
            Next
          </button>
        </span>
        <span className="rbc-toolbar-label">{label}</span>
        <span className="rbc-btn-group">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span className="text-xs">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span className="text-xs">Unavailable</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-700 rounded-full mr-1"></div>
              <span className="text-xs">Blackout Date</span>
            </div>
          </div>
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-primary-purple mb-4">
        {productName} Availability
      </h2>

      {isLoading && (
        <div className="flex justify-center items-center h-[400px]">
          <LoadingSpinner className="w-8 h-8 text-primary-blue" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      {!isLoading && !error && (
        <div className="h-[500px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            views={["month"]}
            defaultView="month"
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
            onSelectSlot={handleSelectSlot}
            selectable
            components={{
              toolbar: CustomToolbar,
            }}
            tooltipAccessor={(event: AvailabilityEvent) =>
              `${productName} is ${event.available ? "available" : "not available"} on this date`
            }
          />
        </div>
      )}

      {selectedDate && (
        <div
          className={`mt-4 p-4 rounded-lg ${(() => {
            const event = events.find(
              (e) => e.id === formatDateCT(selectedDate),
            );
            if (!event) return "bg-gray-100 text-gray-700";
            if (event.available) return "bg-green-100 text-green-700";
            if (event.isBlackoutDate) return "bg-purple-100 text-purple-700";
            return "bg-red-100 text-red-700";
          })()}`}
        >
          <p className="font-medium">
            {productName} is{" "}
            {events.find((e) => e.id === formatDateCT(selectedDate))?.available
              ? "available"
              : "not available"}{" "}
            on {selectedDate.toLocaleDateString()}.
          </p>
          {!events.find((e) => e.id === formatDateCT(selectedDate))
            ?.available && (
            <p className="text-sm mt-1">
              {(() => {
                const event = events.find(
                  (e) => e.id === formatDateCT(selectedDate),
                );
                if (!event) return "Information not available for this date.";
                if (event.isBlackoutDate)
                  return "This date is marked as a blackout date and is unavailable for booking.";
                if (event.reason) return event.reason;
                return "This date is already booked or the product is unavailable.";
              })()}
            </p>
          )}
        </div>
      )}

      <style jsx global>{`
        .available-day {
          background-color: rgba(16, 185, 129, 0.1);
        }
        .unavailable-day {
          background-color: rgba(239, 68, 68, 0.1);
        }
        .blackout-day {
          background-color: rgba(107, 33, 168, 0.1);
        }
        .rbc-event.rbc-selected {
          background-color: #4338ca;
        }
      `}</style>
    </div>
  );
}
