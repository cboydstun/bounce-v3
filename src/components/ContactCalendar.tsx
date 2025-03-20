"use client";

import { useState, useCallback, useEffect } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Contact } from "@/types/contact";

// Create a date localizer
const moment = require("moment");
// Ensure moment doesn't apply timezone offset for date display
moment.parseZone = true;
const localizer = momentLocalizer(moment);

interface ContactEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Contact;
}

interface ContactCalendarProps {
  contacts: Contact[];
  initialDate?: Date;
}

const ContactCalendar: React.FC<ContactCalendarProps> = ({
  contacts,
  initialDate = new Date(),
}) => {
  const router = useRouter();
  const [view, setView] = useState<any>(Views.MONTH);
  const [date, setDate] = useState(initialDate);

  // Update date when initialDate changes
  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  // Convert contacts to calendar events
  const events: ContactEvent[] = contacts.map((contact) => {
    // Get the original date
    const originalDate = new Date(contact.partyDate);

    // Create a new date with one day added to fix the timezone issue
    const partyDate = new Date(originalDate);
    partyDate.setDate(originalDate.getDate() + 1);

    // Create an end date 2 hours after the start date
    const endDate = new Date(partyDate);
    endDate.setHours(endDate.getHours() + 2);

    return {
      id: contact._id,
      title: `${contact.bouncer} - ${contact.partyZipCode}`,
      start: partyDate,
      end: endDate,
      allDay: false,
      resource: contact,
    };
  });

  // Custom event styling based on confirmation status
  const eventStyleGetter = (event: ContactEvent) => {
    const status = event.resource.confirmed;
    console.log("Status type:", typeof status, "Value:", status); // Debug log

    // Define colors for different statuses
    let backgroundColor = "#FBBF24"; // Default yellow for Pending
    let textColor = "black";

    // Handle both boolean and string values
    if (typeof status === "boolean") {
      // Handle legacy boolean values
      backgroundColor = status ? "#10B981" : "#FBBF24"; // Green if true, yellow if false
      textColor = status ? "white" : "black";
    } else {
      // Handle new string enum values
      switch (status) {
        case "Confirmed":
          backgroundColor = "#10B981"; // Green
          textColor = "white";
          break;
        case "Called / Texted":
          backgroundColor = "#3B82F6"; // Blue
          textColor = "white";
          break;
        case "Declined":
          backgroundColor = "#EF4444"; // Red
          textColor = "white";
          break;
        case "Cancelled":
          backgroundColor = "#6B7280"; // Gray
          textColor = "white";
          break;
        // Pending is the default yellow
      }
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
    (event: ContactEvent) => {
      router.push(`/admin/contacts/${event.id}/edit`);
    },
    [router]
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span className="text-xs">Confirmed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
            <span className="text-xs">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span className="text-xs">Called / Texted</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span className="text-xs">Declined</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full mr-1"></div>
            <span className="text-xs">Cancelled</span>
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
        tooltipAccessor={(event: ContactEvent) => {
          const contact = event.resource;
          // Handle both boolean and string values for status display
          let status = contact.confirmed;
          if (typeof status === "boolean") {
            status = status ? "Confirmed" : "Pending";
          }
          return `${contact.bouncer}\nEmail: ${contact.email}\nPhone: ${contact.phone || "N/A"}\nZip: ${contact.partyZipCode}\nStatus: ${status}`;
        }}
      />
    </div>
  );
};

export default ContactCalendar;
