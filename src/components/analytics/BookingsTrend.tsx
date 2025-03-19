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
  Legend
);

interface BookingsTrendProps {
  period: string;
}

export default function BookingsTrend({ period }: BookingsTrendProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [confirmedBookings, setConfirmedBookings] = useState<number>(0);
  const [pendingBookings, setPendingBookings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get date range for the selected period
        const dateRange = getDateRangeForPeriod(period);

        // Fetch contacts
        const contactsData = await getContacts({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 1000, // Fetch a large number to ensure we get all data
        });

        // Extract contacts from API response
        const contacts = contactsData.contacts as Contact[];

        // Calculate bookings data
        const bookingsData = groupContactsByPeriod(contacts, period);

        // Count confirmed and pending bookings
        const confirmed = contacts.filter(
          (contact) => contact.confirmed
        ).length;
        const pending = contacts.length - confirmed;

        setChartData(bookingsData.chartData);
        setTotalBookings(contacts.length);
        setConfirmedBookings(confirmed);
        setPendingBookings(pending);
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Bookings Trend</h3>
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {totalBookings}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {confirmedBookings}
            </div>
            <div className="text-xs text-gray-500">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500">
              {pendingBookings}
            </div>
            <div className="text-xs text-gray-500">Pending</div>
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
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0, // Only show whole numbers
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
      )}
    </div>
  );
}
