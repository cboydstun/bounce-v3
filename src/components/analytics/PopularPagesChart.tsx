"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
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

interface PageData {
  page: string;
  visits: number;
  percentage: number;
}

interface PopularPagesChartProps {
  pagesData: PageData[];
}

const PopularPagesChart: React.FC<PopularPagesChartProps> = ({ pagesData }) => {
  // Format page URLs for display
  const formatPageUrl = (url: string) => {
    // Remove domain and protocol if present
    let formatted = url.replace(/^https?:\/\/[^\/]+/, "");

    // Handle root path
    if (formatted === "" || formatted === "/") {
      return "Home Page";
    }

    // Remove trailing slash
    formatted = formatted.replace(/\/$/, "");

    // Remove leading slash and split by remaining slashes
    const parts = formatted.replace(/^\//, "").split("/");

    // If it's a product page, format it nicely
    if (parts[0] === "products" && parts.length > 1) {
      return `Product: ${parts[1].replace(/-/g, " ")}`;
    }

    // For other pages, just capitalize and clean up
    return parts
      .map(
        (part) =>
          part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
      )
      .join(" > ");
  };

  // Prepare data for chart
  const labels = pagesData.map((page) => formatPageUrl(page.page));
  const visitCounts = pagesData.map((page) => page.visits);

  const data = {
    labels,
    datasets: [
      {
        label: "Page Visits",
        data: visitCounts,
        backgroundColor: "rgba(75, 192, 192, 0.7)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.raw || 0;
            const percentage =
              pagesData[context.dataIndex].percentage.toFixed(1);
            return `Visits: ${value} (${percentage}% of total)`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Visits",
        },
      },
    },
  };

  // Determine if there are product pages in the top visited pages
  const productPages = pagesData.filter((page) =>
    page.page.includes("/products/"),
  );
  const hasProductPages = productPages.length > 0;

  // Get the most popular product if any
  const mostPopularProduct =
    productPages.length > 0
      ? productPages.reduce((prev, current) =>
          prev.visits > current.visits ? prev : current,
        )
      : null;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Most Visited Pages</h3>
      <div className="h-80">
        <Bar data={data} options={options} />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium">Business Insight:</p>
        {hasProductPages ? (
          <div>
            <p>
              Your most popular rental product is{" "}
              <span className="font-semibold">
                {formatPageUrl(mostPopularProduct!.page).replace(
                  "Product: ",
                  "",
                )}
              </span>{" "}
              with {mostPopularProduct!.visits} views.
            </p>
            <p className="mt-2">
              Consider featuring this product prominently on your homepage and
              ensuring you have sufficient inventory available.
            </p>
          </div>
        ) : (
          <p>
            Your most visited page is{" "}
            <span className="font-semibold">{labels[0]}</span>. Consider
            optimizing this page for conversions and ensuring it showcases your
            best rental products.
          </p>
        )}
      </div>
    </div>
  );
};

export default PopularPagesChart;
