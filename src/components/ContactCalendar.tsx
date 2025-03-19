"use client";

import { useState, useCallback, useEffect } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Contact } from "@/types/contact";

// Create a date localizer
const localizer = momentLocalizer(require("moment"));

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
    const partyDate = new Date(contact.partyDate);

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
    const isConfirmed = event.resource.confirmed;

    return {
      style: {
        backgroundColor: isConfirmed ? "#10B981" : "#FBBF24", // Green for confirmed, yellow for pending
        borderRadius: "4px",
        opacity: 0.8,
        color: isConfirmed ? "white" : "black",
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
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span className="text-xs">Confirmed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
            <span className="text-xs">Pending</span>
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
          return `${contact.bouncer}\nEmail: ${contact.email}\nPhone: ${contact.phone || "N/A"}\nZip: ${contact.partyZipCode}\nStatus: ${contact.confirmed ? "Confirmed" : "Pending"}`;
        }}
      />
    </div>
  );
};

export default ContactCalendar;
