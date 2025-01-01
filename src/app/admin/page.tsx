"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import { API_BASE_URL, API_ROUTES } from "../../config/constants";

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    { name: "Total Blogs", stat: "...", href: "/admin/blogs" },
    { name: "Total Products", stat: "...", href: "/admin/products" },
    { name: "Contact Requests", stat: "...", href: "/admin/contacts" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [blogsRes, productsRes, contactsRes] = await Promise.all([
          api.get(`${API_BASE_URL}${API_ROUTES.BLOGS}`),
          api.get(`${API_BASE_URL}${API_ROUTES.PRODUCTS}`),
          api.get(`${API_BASE_URL}${API_ROUTES.CONTACTS}`),
        ]);

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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
          </div>
        </div>

        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p>New contact request received</p>
              <p className="text-xs text-gray-400">2 hours ago</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>Product &quot;Bounce House XL&quot; updated</p>
              <p className="text-xs text-gray-400">5 hours ago</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>New blog post published</p>
              <p className="text-xs text-gray-400">1 day ago</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                85% Free
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
