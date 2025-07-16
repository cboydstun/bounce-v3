"use client";

import { useState, useCallback, useEffect } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Order } from "@/types/order";
import { parseDateFromNotes } from "@/utils/dateUtils";

// Create a date localizer
const moment = require("moment");
// Ensure moment doesn't apply timezone offset for date display
moment.parseZone = true;
const localizer = momentLocalizer(moment);

interface OrderEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Order;
}

interface OrderCalendarProps {
  orders: Order[];
  initialDate?: Date;
}

const OrderCalendar: React.FC<OrderCalendarProps> = ({
  orders,
  initialDate = new Date(),
}) => {
  const router = useRouter();
  const [view, setView] = useState<any>(Views.MONTH);
  const [date, setDate] = useState(initialDate);

  // Update date when initialDate changes
  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  // Convert orders to calendar events
  const events: OrderEvent[] = orders.map((order) => {
    // Use proper date precedence: eventDate -> deliveryDate -> notes -> createdAt
    let orderDate: Date;

    if (order.eventDate) {
      orderDate = new Date(order.eventDate);
    } else if (order.deliveryDate) {
      orderDate = new Date(order.deliveryDate);
    } else if (order.notes) {
      // Try to parse date from notes field (e.g., "Delivery: 2025-07-12 13:00")
      const notesDate = parseDateFromNotes(order.notes);
      if (notesDate) {
        orderDate = notesDate;
      } else {
        // Fallback to creation date if no date found in notes
        orderDate = new Date(order.createdAt);
      }
    } else {
      // Final fallback to creation date
      orderDate = new Date(order.createdAt);
    }

    // Fix timezone issue: Instead of adding a day, let's properly handle the date
    // Convert to local date without timezone shifting
    const eventDate = new Date(
      orderDate.getTime() + orderDate.getTimezoneOffset() * 60000,
    );

    // Create an end date 2 hours after the start date
    const endDate = new Date(eventDate);
    endDate.setHours(eventDate.getHours() + 2);

    return {
      id: order._id,
      title: `${order.orderNumber} - ${order.customerName || "Customer"} - $${order.totalAmount}`,
      start: eventDate,
      end: endDate,
      allDay: false,
      resource: order,
    };
  });

  // Custom event styling based on order status
  const eventStyleGetter = (event: OrderEvent) => {
    const status = event.resource.status;

    // Define colors for different order statuses
    let backgroundColor = "#FBBF24"; // Default yellow for Pending
    let textColor = "black";

    switch (status) {
      case "Confirmed":
        backgroundColor = "#10B981"; // Green
        textColor = "white";
        break;
      case "Paid":
        backgroundColor = "#059669"; // Dark green
        textColor = "white";
        break;
      case "Processing":
        backgroundColor = "#3B82F6"; // Blue
        textColor = "white";
        break;
      case "Cancelled":
        backgroundColor = "#EF4444"; // Red
        textColor = "white";
        break;
      case "Refunded":
        backgroundColor = "#6B7280"; // Gray
        textColor = "white";
        break;
      case "Pending":
      default:
        backgroundColor = "#FBBF24"; // Yellow
        textColor = "black";
        break;
    }

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

  // Handle event click
  const handleEventClick = useCallback(
    (event: OrderEvent) => {
      router.push(`/admin/orders/${event.id}`);
    },
    [router],
  );

  // Custom toolbar to add filters if needed in the future
  const CustomToolbar = ({ label }: { label: string }) => (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={() => setView(Views.MONTH)}>
          Month
        </button>
        <button type="button" onClick={() => setView(Views.WEEK)}>
          Week
        </button>
        <button type="button" onClick={() => setView(Views.DAY)}>
          Day
        </button>
      </span>
      <span className="rbc-toolbar-label">{label}</span>
      <span className="rbc-btn-group">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span className="text-xs">Confirmed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-700 rounded-full mr-1"></div>
              <span className="text-xs">Paid</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
              <span className="text-xs">Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
              <span className="text-xs">Processing</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span className="text-xs">Cancelled</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-1"></div>
              <span className="text-xs">Refunded</span>
            </div>
          </div>
        </div>
      </span>
    </div>
  );

  return (
    <div className="h-[700px] bg-white p-4 rounded-lg shadow">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        view={view}
        onView={(newView) => setView(newView)}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleEventClick}
        components={{
          toolbar: CustomToolbar as any,
        }}
        popup
        tooltipAccessor={(event: OrderEvent) => {
          const order = event.resource;
          const itemsList = order.items
            .map((item) => `${item.name} x${item.quantity}`)
            .join(", ");
          return `Order: ${order.orderNumber}\nCustomer: ${order.customerName || "N/A"}\nEmail: ${order.customerEmail || "N/A"}\nPhone: ${order.customerPhone || "N/A"}\nTotal: $${order.totalAmount}\nStatus: ${order.status}\nPayment: ${order.paymentStatus}\nItems: ${itemsList}`;
        }}
      />
    </div>
  );
};

export default OrderCalendar;
