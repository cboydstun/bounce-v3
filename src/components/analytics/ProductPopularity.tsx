"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { getContacts, getProducts } from "@/utils/api";
import {
  calculateProductPopularity,
  getDateRangeForPeriod,
} from "@/utils/analytics";
import { Contact } from "@/types/contact";
import { ProductWithId } from "@/types/product";
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

interface ProductPopularityProps {
  period: string;
}

export default function ProductPopularity({ period }: ProductPopularityProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get date range for the selected period
        const dateRange = getDateRangeForPeriod(period);

        // Fetch contacts and products
        const contactsData = await getContacts({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 1000, // Fetch a large number to ensure we get all data
        });

        const productsData = await getProducts();

        // Extract contacts and products from API response
        const contacts = contactsData.contacts as Contact[];
        const products = productsData.products as ProductWithId[];

        // Calculate product popularity
        const popularityData = calculateProductPopularity(contacts, products);

        setChartData(popularityData);
      } catch (error) {
        console.error("Error fetching product popularity data:", error);
        setError("Failed to load product popularity data");
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

  if (!chartData || chartData.labels.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Product Popularity
        </h3>
        <div className="text-gray-500 text-center py-8">
          No data available for this period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Product Popularity
      </h3>
      <Bar
        data={chartData}
        options={{
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            x: {
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
            tooltip: {
              callbacks: {
                label: (context) => `${context.parsed.x} bookings`,
              },
            },
          },
        }}
      />
    </div>
  );
}
