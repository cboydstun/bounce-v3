"use client";

import { useState, useEffect } from "react";
import { getContacts } from "@/utils/api";
import ContactCalendar from "@/components/ContactCalendar";
import { Contact } from "@/types/contact";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function CalendarPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Helper functions for date ranges
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const setMonth = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };

  const setPreviousMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
    setMonth(prevMonth);
  };

  const setNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
    setMonth(nextMonth);
  };

  const setThisMonth = () => {
    const now = new Date();
    setCurrentDate(now);
    setMonth(now);
  };

  const setThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };

  // Set default date range to current month on component mount
  useEffect(() => {
    setThisMonth();
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare query parameters for API call
        const params: {
          startDate?: string;
          endDate?: string;
          limit?: number;
        } = {
          limit: 100, // Fetch more contacts for the calendar view
        };

        // Add date filters if set
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        // Call the API with filters
        const data = await getContacts(params);

        // Map the contacts from the API response
        const mappedContacts = data.contacts.map((contact: any) => ({
          _id: contact._id,
          bouncer: contact.bouncer,
          email: contact.email,
          phone: contact.phone,
          partyDate: contact.partyDate,
          partyZipCode: contact.partyZipCode,
          message: contact.message,
          confirmed: contact.confirmed,
          createdAt: contact.createdAt,
          tablesChairs: contact.tablesChairs,
          generator: contact.generator,
          popcornMachine: contact.popcornMachine,
          cottonCandyMachine: contact.cottonCandyMachine,
          snowConeMachine: contact.snowConeMachine,
          basketballShoot: contact.basketballShoot,
          slushyMachine: contact.slushyMachine,
          overnight: contact.overnight,
          sourcePage: contact.sourcePage,
        }));

        setContacts(mappedContacts);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching contacts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchContacts();
    }
  }, [startDate, endDate]);

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Contact Calendar
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Calendar view of all contact requests. Yellow events are pending,
            green events are confirmed.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={setPreviousMonth}
              className="rounded-md px-3 py-2 text-sm font-semibold bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Previous Month
            </button>
            <button
              onClick={setThisMonth}
              className="rounded-md px-3 py-2 text-sm font-semibold bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Current Month
            </button>
            <button
              onClick={setNextMonth}
              className="rounded-md px-3 py-2 text-sm font-semibold bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Next Month
            </button>
            <button
              onClick={setThisYear}
              className="rounded-md px-3 py-2 text-sm font-semibold bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Full Year
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="start-date"
              className="text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label
              htmlFor="end-date"
              className="text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      ) : (
        <ContactCalendar contacts={contacts} initialDate={currentDate} />
      )}
    </div>
  );
}
