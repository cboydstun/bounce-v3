"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { getContacts } from "@/utils/api";
import {
  groupContactsByPeriod,
  getDateRangeForPeriod,
} from "@/utils/analytics";
import { Contact } from "@/types/contact";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface BookingsTrendProps {
  period: string;
}

export default function BookingsTrend({ period }: BookingsTrendProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [confirmedBookings, setConfirmedBookings] = useState<number>(0);
  const [pendingBookings, setPendingBookings] = useState<number>(0);
  const [calledTextedBookings, setCalledTextedBookings] = useState<number>(0);
  const [declinedBookings, setDeclinedBookings] = useState<number>(0);
  const [cancelledBookings, setCancelledBookings] = useState<number>(0);
  const [convertedBookings, setConvertedBookings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get date range for the selected period
        const dateRange = getDateRangeForPeriod(period);

        // Fetch contacts with pagination handling
        let allContacts: Contact[] = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
          const contactsData = await getContacts({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            limit: 1000,
            page: currentPage,
            includeAllStatuses: true, // Include all confirmation statuses
          });

          // Add contacts from current page to our collection
          allContacts = [
            ...allContacts,
            ...(contactsData.contacts as Contact[]),
          ];

          // Update pagination info
          totalPages = contactsData.pagination?.totalPages || 1;
          currentPage++;
        } while (currentPage <= totalPages);

        // Calculate bookings data
        const bookingsData = groupContactsByPeriod(allContacts, period);

        // Count bookings by status, handling both string and boolean values
        const confirmed = allContacts.filter((contact: Contact) => {
          if (typeof contact.confirmed === "boolean") {
            return contact.confirmed === true;
          } else {
            return contact.confirmed === "Confirmed";
          }
        }).length;

        const pending = allContacts.filter((contact: Contact) => {
          if (typeof contact.confirmed === "boolean") {
            return contact.confirmed === false;
          } else {
            return contact.confirmed === "Pending";
          }
        }).length;

        const calledTexted = allContacts.filter(
          (contact: Contact) => contact.confirmed === "Called / Texted",
        ).length;

        const declined = allContacts.filter(
          (contact: Contact) => contact.confirmed === "Declined",
        ).length;

        const cancelled = allContacts.filter(
          (contact: Contact) => contact.confirmed === "Cancelled",
        ).length;

        const converted = allContacts.filter(
          (contact: Contact) => contact.confirmed === "Converted",
        ).length;

        setChartData(bookingsData.chartData);
        setTotalBookings(allContacts.length);
        setConfirmedBookings(confirmed);
        setPendingBookings(pending);
        setCalledTextedBookings(calledTexted);
        setDeclinedBookings(declined);
        setCancelledBookings(cancelled);
        setConvertedBookings(converted);
      } catch (error) {
        console.error("Error fetching bookings data:", error);
        setError("Failed to load bookings data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-64">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-900">Bookings Trend</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {totalBookings}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          <div className="text-center p-2 bg-purple-50 rounded-md">
            <div className="text-xl font-bold text-purple-600">
              {convertedBookings}
            </div>
            <div className="text-xs text-gray-500">Converted</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-md">
            <div className="text-xl font-bold text-green-600">
              {confirmedBookings}
            </div>
            <div className="text-xs text-gray-500">Confirmed</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded-md">
            <div className="text-xl font-bold text-yellow-500">
              {pendingBookings}
            </div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-md">
            <div className="text-xl font-bold text-blue-500">
              {calledTextedBookings}
            </div>
            <div className="text-xs text-gray-500">Called/Texted</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-md">
            <div className="text-xl font-bold text-red-500">
              {declinedBookings}
            </div>
            <div className="text-xs text-gray-500">Declined</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-md">
            <div className="text-xl font-bold text-gray-500">
              {cancelledBookings}
            </div>
            <div className="text-xs text-gray-500">Cancelled</div>
          </div>
        </div>
      </div>
      {chartData && (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              x: {
                stacked: true,
              },
              y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                  precision: 0, // Only show whole numbers
                },
              },
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
                labels: {
                  boxWidth: 12,
                  font: {
                    size: 11,
                  },
                },
              },
              tooltip: {
                callbacks: {
                  label: (context: any) => {
                    const label = context.dataset.label || "";
                    const value = context.parsed.y;
                    return `${label}: ${value}`;
                  },
                },
              },
            },
          }}
        />
      )}
    </div>
  );
}
