"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import { API_BASE_URL, API_ROUTES } from "../../config/constants";
import { Review } from "@/types/review";

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
  const [stats, setStats] = useState([
    { name: "Total Blogs", stat: "...", href: "/admin/blogs" },
    { name: "Total Products", stat: "...", href: "/admin/products" },
    { name: "Contact Requests", stat: "...", href: "/admin/contacts" },
    { name: "Customer Reviews", stat: "...", href: "/admin/reviews" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [blogsRes, productsRes, contactsRes, reviewsRes] =
          await Promise.all([
            api.get(`${API_BASE_URL}${API_ROUTES.BLOGS}`),
            api.get(`${API_BASE_URL}${API_ROUTES.PRODUCTS}`),
            api.get(`${API_BASE_URL}${API_ROUTES.CONTACTS}`),
            api.get(`${API_BASE_URL}${API_ROUTES.REVIEWS}`),
          ]);

        const reviews = reviewsRes.data as Review[];

        // Calculate review statistics
        const last24Hours = new Date();
        last24Hours.setHours(last24Hours.getHours() - 24);

        const recentReviews = reviews.filter(
          (review) => new Date(review.createdAt || 0) > last24Hours,
        ).length;

        const averageRating = reviews.length
          ? reviews.reduce((acc, review) => acc + review.rating, 0) /
            reviews.length
          : 0;

        // For this example, we'll consider reviews without a reviewId as pending
        const pendingReviews = reviews.filter(
          (review) => !review.reviewId,
        ).length;

        setReviewStats({
          averageRating,
          recentReviews,
          pendingReviews,
          totalReviews: reviews.length,
        });

        setStats([
          {
            name: "Total Blogs",
            stat: String(blogsRes.data.length),
            href: "/admin/blogs",
          },
          {
            name: "Total Products",
            stat: String(productsRes.data.length),
            href: "/admin/products",
          },
          {
            name: "Contact Requests",
            stat: String(contactsRes.data.length),
            href: "/admin/contacts",
          },
          {
            name: "Customer Reviews",
            stat: String(reviewsRes.data.length),
            href: "/admin/reviews",
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
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

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
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
