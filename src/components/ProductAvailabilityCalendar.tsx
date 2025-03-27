"use client";

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { checkProductAvailability } from "@/utils/api";
import { LoadingSpinner } from "./ui/LoadingSpinner";

// Create a date localizer
const moment = require("moment");
moment.parseZone = true;
const localizer = momentLocalizer(moment);

interface AvailabilityEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  available: boolean;
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
  const [checkedDates, setCheckedDates] = useState<Record<string, boolean>>({});
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);

  // Calculate visible dates for the current month view
  useEffect(() => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
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
    let pendingChecks = 0;
    let hasError = false;
    
    // Start with loading state
    setIsLoading(true);
    setError(null);
    
    // Filter dates that haven't been checked yet
    const uncheckedDates = visibleDates.filter(date => {
      const dateStr = date.toISOString().split('T')[0];
      return checkedDates[dateStr] === undefined;
    });
    
    // If all dates are already checked, just create events from cache
    if (uncheckedDates.length === 0) {
      visibleDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const available = checkedDates[dateStr];
        
        newEvents.push({
          id: dateStr,
          title: available ? "Available" : "Unavailable",
          start: date,
          end: date,
          allDay: true,
          available,
        });
      });
      
      setEvents(newEvents.sort((a, b) => a.start.getTime() - b.start.getTime()));
      setIsLoading(false);
      return;
    }
    
    // Prepare to collect all new availability data
    const newCheckedDates: Record<string, boolean> = {};
    pendingChecks = uncheckedDates.length;
    
    // Check each unchecked date
    uncheckedDates.forEach(async (date) => {
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        // Check availability for this date
        const result = await checkProductAvailability(productSlug, dateStr);
        
        // Store the result (but don't update state yet)
        newCheckedDates[dateStr] = result.available;
      } catch (err) {
        console.error(`Error checking availability for ${dateStr}:`, err);
        hasError = true;
      } finally {
        pendingChecks--;
        
        // When all checks are complete, update state once
        if (pendingChecks === 0) {
          // Update checkedDates state once with all new data
          setCheckedDates(prev => ({
            ...prev,
            ...newCheckedDates
          }));
          
          // Create events from both cached and new data
          visibleDates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const available = newCheckedDates[dateStr] !== undefined 
              ? newCheckedDates[dateStr] 
              : checkedDates[dateStr];
            
            if (available !== undefined) {
              newEvents.push({
                id: dateStr,
                title: available ? "Available" : "Unavailable",
                start: date,
                end: date,
                allDay: true,
                available,
              });
            }
          });
          
          if (hasError) {
            setError("Failed to load some availability data. Please try again.");
          }
          
          setEvents(newEvents.sort((a, b) => a.start.getTime() - b.start.getTime()));
          setIsLoading(false);
        }
      }
    });
  }, [visibleDates, productSlug]); // Remove checkedDates from dependencies

  // Custom event styling based on availability
  const eventStyleGetter = (event: AvailabilityEvent) => {
    const backgroundColor = event.available ? "#10B981" : "#EF4444"; // Green if available, red if not
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
    const dateStr = date.toISOString().split('T')[0];
    const event = events.find(e => e.id === dateStr);
    
    if (!event) return {};
    
    return {
      className: event.available ? 'available-day' : 'unavailable-day',
      style: {
        backgroundColor: event.available ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      },
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
        case 'PREV':
          newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
          break;
        case 'NEXT':
          newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
          break;
        case 'TODAY':
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
          <button type="button" onClick={() => navigate('PREV')}>
            Previous
          </button>
          <button type="button" onClick={() => navigate('TODAY')}>
            Today
          </button>
          <button type="button" onClick={() => navigate('NEXT')}>
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
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="h-[500px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            views={['month']}
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
              `${productName} is ${event.available ? 'available' : 'not available'} on this date`
            }
          />
        </div>
      )}
      
      {selectedDate && (
        <div className={`mt-4 p-4 rounded-lg ${
          events.find(e => e.id === selectedDate.toISOString().split('T')[0])?.available
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}>
          <p className="font-medium">
            {productName} is {events.find(e => e.id === selectedDate.toISOString().split('T')[0])?.available
              ? "available"
              : "not available"
            } on {selectedDate.toLocaleDateString()}.
          </p>
          {!events.find(e => e.id === selectedDate.toISOString().split('T')[0])?.available && (
            <p className="text-sm mt-1">
              This date is already booked or the product is unavailable.
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
      `}</style>
    </div>
  );
}
