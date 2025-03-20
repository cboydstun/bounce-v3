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

        // Calculate revenue data
        const revenueData = calculateRevenueData(contacts, products, period);

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
