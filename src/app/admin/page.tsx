"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { getSession } from "next-auth/react";
import api, { getReviews, getProducts, getContacts } from "@/utils/api";
import { API_ROUTES } from "../../config/constants";
import { Review } from "@/types/review";
import RevenueChart from "@/components/analytics/RevenueChart";
import BookingsTrend from "@/components/analytics/BookingsTrend";
import ProductPopularity from "@/components/analytics/ProductPopularity";

interface ReviewStats {
  averageRating: number;
  recentReviews: number;
  pendingReviews: number;
  totalReviews: number;
}

export default function AdminDashboard() {
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    recentReviews: 0,
    pendingReviews: 0,
    totalReviews: 0,
  });
  const [maxDailyBookings, setMaxDailyBookings] = useState(6);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState<string>("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [settingsUpdateSuccess, setSettingsUpdateSuccess] = useState(false);
  const [stats, setStats] = useState([
    { name: "Total Blogs", stat: "...", href: "/admin/blogs" },
    { name: "Total Products", stat: "...", href: "/admin/products" },
    { name: "Contact Requests", stat: "...", href: "/admin/contacts" },
    { name: "Customer Reviews", stat: "...", href: "/admin/reviews" },
    { name: "Promo Opt-ins", stat: "...", href: "/admin/promo-optins" },
  ]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("currentMonth");

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch settings
      try {
        const settingsRes = await api.get("/api/v1/settings");
        setMaxDailyBookings(settingsRes.data.maxDailyBookings);
        
        // Format blackout dates as YYYY-MM-DD strings for the date input
        // Use the date directly from the ISO string to avoid timezone issues
        const formattedDates = settingsRes.data.blackoutDates.map(
          (date: string) => {
            // Parse the date and ensure we're using the date in the correct timezone
            const parsedDate = new Date(date);
            // Format as YYYY-MM-DD using the date in the ISO string
            return parsedDate.toISOString().split('T')[0];
          }
        );
        setBlackoutDates(formattedDates);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
      // Initialize default values
      let blogsCount = 0;
      let productsCount = 0;
      let contactsCount = 0;
      let reviewsData = { reviews: [], pagination: { total: 0 } };

      // Fetch blogs count
      try {
        const blogsRes = await api.get(`${API_ROUTES.BLOGS}`);
        // Extract blogs array and pagination from the response
        const blogsData = blogsRes.data;
        // Get the total count from pagination.total or fall back to array length
        blogsCount =
          blogsData.pagination?.total || blogsData.blogs?.length || 0;
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      }

      // Fetch products count
      try {
        const productsData = await getProducts();
        // Extract products array from the response
        const products = productsData.products || [];
        // Get the total count from pagination.total or fall back to array length
        productsCount = productsData.pagination?.total || products.length || 0;
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }

      // Fetch contacts count
      try {
        const contactsData = await getContacts();
        // Extract contacts array from the response
        const contacts = contactsData.contacts || [];
        // Get the total count from pagination.total or fall back to array length
        contactsCount = contactsData.pagination?.total || contacts.length || 0;
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }

      // Fetch reviews count - this is the one we really care about
      try {
        reviewsData = await getReviews();
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      }

      // Extract reviews from the new response format
      const reviews = reviewsData.reviews || [];

      // Get the total count from pagination.total
      const totalReviews = reviewsData.pagination?.total || reviews.length || 0;

      // Calculate review statistics
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const recentReviews = reviews.filter(
        (review: Review) => new Date(review.createdAt || 0) > last24Hours,
      ).length;

      const averageRating = reviews.length
        ? reviews.reduce(
            (acc: number, review: Review) => acc + review.rating,
            0,
          ) / reviews.length
        : 0;

      // For this example, we'll consider reviews without a reviewId as pending
      const pendingReviews = reviews.filter(
        (review: Review) => !review.reviewId,
      ).length;

      setReviewStats({
        averageRating,
        recentReviews,
        pendingReviews,
        totalReviews,
      });

      // Fetch promo opt-ins count
      let promoOptinsCount = 0;
      try {
        const promoOptinsRes = await api.get("/api/v1/promo-optins");
        const promoOptinsData = promoOptinsRes.data;
        promoOptinsCount =
          promoOptinsData.pagination?.total ||
          promoOptinsData.promoOptins?.length ||
          0;
      } catch (error) {
        console.error("Failed to fetch promo opt-ins:", error);
      }

      setStats([
        {
          name: "Total Blogs",
          stat: String(blogsCount),
          href: "/admin/blogs",
        },
        {
          name: "Total Products",
          stat: String(productsCount),
          href: "/admin/products",
        },
        {
          name: "Contact Requests",
          stat: String(contactsCount),
          href: "/admin/contacts",
        },
        {
          name: "Customer Reviews",
          stat: String(totalReviews),
          href: "/admin/reviews",
        },
        {
          name: "Promo Opt-ins",
          stat: String(promoOptinsCount),
          href: "/admin/promo-optins",
        },
      ]);
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight mb-8">
        Dashboard Overview
      </h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        {stats.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 hover:shadow-lg transition-shadow"
          >
            <dt className="truncate text-sm font-medium text-gray-500">
              {item.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {item.stat}
            </dd>
          </Link>
        ))}
      </div>

      {/* Analytics Period Selector */}
      <div className="mt-8 mb-4">
        <label
          htmlFor="period-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Analytics Period
        </label>
        <select
          id="period-select"
          value={analyticsPeriod}
          onChange={(e) => setAnalyticsPeriod(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="nextMonth">Next Month (Based on Last Year)</option>
          <option value="currentMonth">Current Month</option>
          <option value="last30Days">Last 30 Days</option>
          <option value="yearToDate">Year to Date</option>
          <option value="lastYear">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Analytics Charts */}
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RevenueChart period={analyticsPeriod} />
        <BookingsTrend period={analyticsPeriod} />
      </div>

      <div className="mt-5 mb-8">
        <ProductPopularity period={analyticsPeriod} />
      </div>

      {/* Booking Settings */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Booking Settings
        </h3>
        
        <div className="space-y-6">
          {/* Maximum Bookings Per Day */}
          <div>
            <label htmlFor="maxDailyBookings" className="block text-sm font-medium text-gray-700">
              Maximum Bookings Per Day
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                name="maxDailyBookings"
                id="maxDailyBookings"
                min="1"
                value={maxDailyBookings}
                onChange={(e) => setMaxDailyBookings(parseInt(e.target.value) || 1)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              This limits the number of bookings that can be made on a single day.
            </p>
          </div>
          
          {/* Blackout Dates */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-base font-medium text-gray-700 mb-3">Blackout Dates</h4>
            
            {/* Add new blackout date */}
            <div>
              <label htmlFor="blackoutDate" className="block text-sm font-medium text-gray-700">
                Add Blackout Date
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="date"
                  name="blackoutDate"
                  id="blackoutDate"
                  value={newBlackoutDate}
                  onChange={(e) => setNewBlackoutDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newBlackoutDate) return;
                    
                    setIsUpdatingSettings(true);
                    setSettingsUpdateSuccess(false);
                    
                    try {
                      // Force a session refresh before making the request
                      const session = await getSession();
                      console.log("Current session before adding blackout date:", session);
                      
                      if (!session || !session.user) {
                        // Redirect to login page if no session
                        alert("Your session has expired. Please log in again.");
                        window.location.href = "/login";
                        return;
                      }
                      
                      const response = await api.patch("/api/v1/settings", {
                        addBlackoutDate: newBlackoutDate
                      });
                      
                      console.log("Blackout date added successfully:", response.data);
                      
                      // Add to local state
                      if (!blackoutDates.includes(newBlackoutDate)) {
                        setBlackoutDates([...blackoutDates, newBlackoutDate]);
                      }
                      
                      // Clear input
                      setNewBlackoutDate("");
                      setSettingsUpdateSuccess(true);
                    } catch (error) {
                      console.error("Failed to add blackout date:", error);
                      
                      // Add better error handling with alert
                      if (axios.isAxiosError(error)) {
                        const status = error.response?.status;
                        const message = error.response?.data?.message || (error as Error).message;
                        
                        if (status === 401) {
                          // Redirect to login page on authentication error
                          alert("Your session has expired. Please log in again.");
                          window.location.href = "/login";
                        } else {
                          alert(`Failed to add blackout date: ${message} (${status})`);
                        }
                      } else {
                        alert(`Failed to add blackout date: ${error instanceof Error ? error.message : String(error)}`);
                      }
                    } finally {
                      setIsUpdatingSettings(false);
                    }
                  }}
                  disabled={!newBlackoutDate || isUpdatingSettings}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Add dates when you're unavailable (vacation, sick days, etc.)
              </p>
            </div>
            
            {/* List of blackout dates */}
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Current Blackout Dates</h5>
              {blackoutDates.length === 0 ? (
                <p className="text-sm text-gray-500">No blackout dates set</p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {blackoutDates.sort().map((date, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md">
                      <span className="text-sm">
                        {/* Use the date string directly to create a date object in the local timezone */}
                        {(() => {
                          const [year, month, day] = date.split('-').map(Number);
                          // Create date using local timezone (not UTC)
                          const displayDate = new Date(year, month - 1, day);
                          return displayDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        })()}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsUpdatingSettings(true);
                          
                          try {
                            // Force a session refresh before making the request
                            const session = await getSession();
                            
                            if (!session || !session.user) {
                              // Redirect to login page if no session
                              alert("Your session has expired. Please log in again.");
                              window.location.href = "/login";
                              return;
                            }
                            
                            const response = await api.patch("/api/v1/settings", {
                              removeBlackoutDate: date
                            });
                            
                            console.log("Blackout date removed successfully:", response.data);
                            
                            // Remove from local state
                            setBlackoutDates(blackoutDates.filter(d => d !== date));
                            setSettingsUpdateSuccess(true);
                          } catch (error) {
                            console.error("Failed to remove blackout date:", error);
                            
                            // Add better error handling with alert
                            if (axios.isAxiosError(error)) {
                              const status = error.response?.status;
                              const message = error.response?.data?.message || (error as Error).message;
                              
                              if (status === 401) {
                                // Redirect to login page on authentication error
                                alert("Your session has expired. Please log in again.");
                                window.location.href = "/login";
                              } else {
                                alert(`Failed to remove blackout date: ${message} (${status})`);
                              }
                            } else {
                              alert(`Failed to remove blackout date: ${error instanceof Error ? error.message : String(error)}`);
                            }
                          } finally {
                            setIsUpdatingSettings(false);
                          }
                        }}
                        disabled={isUpdatingSettings}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                      >
                        <span className="sr-only">Remove</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Save button for all settings */}
          <div className="flex items-center border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={async () => {
                setIsUpdatingSettings(true);
                setSettingsUpdateSuccess(false);
                
                try {
                  // Force a session refresh before making the request
                  const session = await getSession();
                  
                  if (!session || !session.user) {
                    // Redirect to login page if no session
                    alert("Your session has expired. Please log in again.");
                    window.location.href = "/login";
                    return;
                  }
                  
                  await api.patch("/api/v1/settings", {
                    maxDailyBookings: parseInt(maxDailyBookings.toString(), 10)
                  });
                  setSettingsUpdateSuccess(true);
                } catch (error) {
                  console.error("Failed to update settings:", error);
                  
                  // Add better error handling with alert
                  if (axios.isAxiosError(error)) {
                    const status = error.response?.status;
                    
                    if (status === 401) {
                      // Redirect to login page on authentication error
                      alert("Your session has expired. Please log in again.");
                      window.location.href = "/login";
                    }
                  }
                } finally {
                  setIsUpdatingSettings(false);
                }
              }}
              disabled={isUpdatingSettings}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
            </button>
            
            {settingsUpdateSuccess && (
              <span className="ml-3 text-sm text-green-600">
                Settings updated successfully!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/admin/blogs/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center"
            >
              Create New Blog
            </Link>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center"
            >
              Add New Product
            </Link>
            <Link
              href="/admin/reviews/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center"
            >
              Add New Review
            </Link>
            <Link
              href="/admin/promo-optins/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 w-full justify-center"
            >
              Add Promo Opt-in
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p>New customer review added</p>
              <p className="text-xs text-gray-400">1 hour ago</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>New contact request received</p>
              <p className="text-xs text-gray-400">2 hours ago</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>Product &quot;Bounce House XL&quot; updated</p>
              <p className="text-xs text-gray-400">5 hours ago</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Reviews Overview
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Rating</span>
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                {reviewStats.averageRating.toFixed(1)}/5.0
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recent Reviews</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Last 24h: {reviewStats.recentReviews}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Reviews</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {reviewStats.pendingReviews} to moderate
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Reviews</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                {reviewStats.totalReviews}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
