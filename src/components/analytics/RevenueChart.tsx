"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { getContacts, getProducts } from "@/utils/api";
import {
  calculateRevenueData,
  formatCurrency,
  getDateRangeForPeriod,
} from "@/utils/analytics";
import { Contact } from "@/types/contact";
import { ProductWithId } from "@/types/product";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface RevenueChartProps {
  period: string;
}

export default function RevenueChart({ period }: RevenueChartProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get date range for the selected period
        const dateRange = getDateRangeForPeriod(period);

        // Fetch products first
        const productsData = await getProducts();
        const products = productsData.products as ProductWithId[];

        // Fetch all contacts with pagination handling
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

        // Debug: Log contacts by month to see distribution
        const contactsByMonth = allContacts.reduce(
          (acc, contact) => {
            const date = new Date(contact.partyDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            if (!acc[monthKey]) {
              acc[monthKey] = [];
            }

            acc[monthKey].push(contact);
            return acc;
          },
          {} as Record<string, Contact[]>,
        );

        // Specifically check for April 2025
        const april2025Key = "2025-04";
        const april2025Contacts = contactsByMonth[april2025Key] || [];

        if (april2025Contacts.length > 0) {
          const statusCounts: Record<string, number> = {};

          april2025Contacts.forEach((contact) => {
            const status =
              typeof contact.confirmed === "boolean"
                ? contact.confirmed
                  ? "true"
                  : "false" // Handle boolean values
                : contact.confirmed || "undefined"; // Handle string values or undefined

            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
        }

        // Calculate revenue data with all contacts
        const revenueData = calculateRevenueData(allContacts, products, period);

        setChartData(revenueData.chartData);
        setTotalRevenue(revenueData.total);
      } catch (error) {
        console.error("Error fetching revenue data:", error);
        setError("Failed to load revenue data");
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
        <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
        <div className="text-3xl font-bold text-gray-900">
          {formatCurrency(totalRevenue)}
        </div>
      </div>
      {chartData && (
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => formatCurrency(value as number),
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (context) => formatCurrency(context.parsed.y),
                },
              },
            },
          }}
        />
      )}
    </div>
  );
}
