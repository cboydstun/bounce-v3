"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

interface VisitorPage {
  url: string;
  timestamp: string;
}

interface Visitor {
  _id: string;
  visitorId: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  visitedPages: VisitorPage[];
  referrer: string;
  userAgent: string;
  device: string;
  ipAddress?: string;
  location?: {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  browser: {
    name: string;
    version: string;
    engine: string;
    isIncognito?: boolean;
  };
  os: {
    name: string;
    version: string;
  };
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };
  timezone: {
    name: string;
    offset: number;
  };
  language: string;
  hardware: {
    cpuCores?: number;
    memory?: number;
    gpuVendor?: string;
    gpuRenderer?: string;
  };
  network: {
    connectionType?: string;
    downlink?: number;
    effectiveType?: string;
  };
}

export default function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Use React.use() to unwrap the params Promise for Next.js 15+ compatibility
  const resolvedParams = React.use(params);
  const visitorId = resolvedParams.id;

  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        setLoading(true);
        // Use the API utility instead of fetch to automatically include auth headers
        const response = await api.get(`/api/v1/visitors/${visitorId}`);
        const data = response.data;

        if (data.success) {
          setVisitor(data.visitor);
        } else {
          throw new Error(data.error || "Failed to fetch visitor data");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        console.error("Error fetching visitor:", err);
      } finally {
        setLoading(false);
      }
    };

    if (visitorId) {
      fetchVisitor();
    }
  }, [visitorId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center p-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Back to Visitors
        </button>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Visitor not found</p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Back to Visitors
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Visitor Details</h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Back to Visitors
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Visitor ID</p>
              <p className="font-mono">{visitor.visitorId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">First Visit</p>
              <p>{new Date(visitor.firstVisit).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Visit</p>
              <p>{new Date(visitor.lastVisit).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Visit Count</p>
              <p>{visitor.visitCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Referrer</p>
              <p>{visitor.referrer}</p>
            </div>
            {visitor.ipAddress && (
              <div>
                <p className="text-sm text-gray-500">IP Address</p>
                <p>{visitor.ipAddress}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Device Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Device Type</p>
              <p>{visitor.device}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Browser</p>
              <p>
                {visitor.browser.name} {visitor.browser.version}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Browser Engine</p>
              <p>{visitor.browser.engine}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Operating System</p>
              <p>
                {visitor.os.name} {visitor.os.version}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Screen Resolution</p>
              <p>
                {visitor.screen.width} x {visitor.screen.height} (
                {visitor.screen.colorDepth}-bit)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Language</p>
              <p>{visitor.language}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
          <div className="space-y-3">
            {visitor.location && (
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p>
                  {[
                    visitor.location.city,
                    visitor.location.region,
                    visitor.location.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {visitor.location.latitude && visitor.location.longitude && (
                  <p className="text-xs text-gray-500 mt-1">
                    {visitor.location.latitude.toFixed(4)},{" "}
                    {visitor.location.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Timezone</p>
              <p>
                {visitor.timezone.name} (UTC
                {visitor.timezone.offset >= 0 ? "+" : ""}
                {visitor.timezone.offset})
              </p>
            </div>
            {visitor.hardware && Object.keys(visitor.hardware).length > 0 && (
              <div>
                <p className="text-sm text-gray-500">Hardware</p>
                <ul className="list-disc list-inside text-sm">
                  {visitor.hardware.cpuCores && (
                    <li>CPU Cores: {visitor.hardware.cpuCores}</li>
                  )}
                  {visitor.hardware.memory && (
                    <li>Memory: {visitor.hardware.memory} GB</li>
                  )}
                  {visitor.hardware.gpuVendor && (
                    <li>
                      GPU: {visitor.hardware.gpuVendor}{" "}
                      {visitor.hardware.gpuRenderer}
                    </li>
                  )}
                </ul>
              </div>
            )}
            {visitor.network && Object.keys(visitor.network).length > 0 && (
              <div>
                <p className="text-sm text-gray-500">Network</p>
                <ul className="list-disc list-inside text-sm">
                  {visitor.network.connectionType && (
                    <li>Connection: {visitor.network.connectionType}</li>
                  )}
                  {visitor.network.downlink && (
                    <li>Downlink: {visitor.network.downlink} Mbps</li>
                  )}
                  {visitor.network.effectiveType && (
                    <li>Effective Type: {visitor.network.effectiveType}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Page Visits</h2>
        {visitor.visitedPages.length === 0 ? (
          <p className="text-gray-500">No page visits recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visitor.visitedPages.map((page, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {page.url}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(page.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {visitor.userAgent && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">User Agent</h2>
          <div className="bg-gray-100 p-4 rounded overflow-x-auto">
            <code className="text-sm font-mono break-all">
              {visitor.userAgent}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
