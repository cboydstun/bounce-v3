"use client";

import React, { useState } from "react";
import { IVisitor } from "@/types/visitor";

interface SuspiciousActivityAlertProps {
  visitors: IVisitor[];
}

const SuspiciousActivityAlert: React.FC<SuspiciousActivityAlertProps> = ({
  visitors,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Format date for display
  const formatDate = (dateString: Date | string) => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  // Group suspicious visitors by fingerprint
  const groupByFingerprint = () => {
    const groups: { [key: string]: IVisitor[] } = {};

    visitors.forEach((visitor) => {
      const fingerprint = String(visitor.visitorId);
      if (!groups[fingerprint]) {
        groups[fingerprint] = [];
      }
      groups[fingerprint].push(visitor);
    });

    // Only keep groups with multiple visitors (suspicious)
    return Object.entries(groups)
      .filter(([_, group]) => group.length > 1)
      .map(([fingerprint, group]) => ({
        fingerprint,
        visitors: group,
        locations: [
          ...new Set(
            group.map((v) =>
              v.location
                ? `${v.location.city || ""}, ${v.location.country || ""}`
                : "Unknown",
            ),
          ),
        ],
        ips: [...new Set(group.map((v) => v.ipAddress).filter(Boolean))],
        lastActivity: new Date(
          Math.max(...group.map((v) => new Date(v.lastVisit).getTime())),
        ),
      }))
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  };

  const suspiciousGroups = groupByFingerprint();
  const hasSuspiciousActivity = suspiciousGroups.length > 0;

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow ${hasSuspiciousActivity ? "border-l-4 border-red-500" : ""}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Security Alerts</h3>
        {hasSuspiciousActivity && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            {suspiciousGroups.length} Alert
            {suspiciousGroups.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!hasSuspiciousActivity ? (
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-green-700">No suspicious activity detected</p>
          </div>
          <p className="text-sm text-green-600 mt-2">
            All visitor fingerprints are associated with consistent location and
            IP data.
          </p>
        </div>
      ) : (
        <div>
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mr-2 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-red-700 font-medium">
                  Suspicious activity detected
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {suspiciousGroups.length} fingerprint
                  {suspiciousGroups.length !== 1 ? "s" : ""} associated with
                  multiple locations or IP addresses. This may indicate fake
                  leads, competitor research, or automated bots.
                </p>
              </div>
            </div>
            <button
              className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 flex items-center"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Hide details" : "Show details"}
              <svg
                className={`w-4 h-4 ml-1 transition-transform ${expanded ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {expanded && (
            <div className="space-y-4">
              {suspiciousGroups.map((group, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 p-3 border-b border-gray-200">
                    <p className="font-medium">
                      Fingerprint: {group.fingerprint.substring(0, 8)}...
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        {group.visitors.length} instances
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {group.locations.length} locations
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                        {group.ips.length} IP addresses
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-medium mb-2">Locations:</h4>
                    <ul className="text-sm space-y-1 mb-3">
                      {group.locations.map((location, i) => (
                        <li key={i} className="flex items-center">
                          <svg
                            className="w-4 h-4 text-gray-400 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {location}
                        </li>
                      ))}
                    </ul>

                    {group.ips.length > 0 && (
                      <>
                        <h4 className="text-sm font-medium mb-2">
                          IP Addresses:
                        </h4>
                        <ul className="text-sm space-y-1 mb-3">
                          {group.ips.map((ip, i) => (
                            <li key={i} className="flex items-center">
                              <svg
                                className="w-4 h-4 text-gray-400 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                                />
                              </svg>
                              {ip}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    <p className="text-xs text-gray-500">
                      Last activity: {formatDate(group.lastActivity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p className="font-medium">Why This Matters:</p>
        <p className="mt-1">
          For a rental business, suspicious activity could indicate:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Competitors researching your pricing and inventory</li>
          <li>Automated bots scraping your product information</li>
          <li>Potential fraudulent rental inquiries</li>
          <li>VPN or proxy usage (which may be legitimate but worth noting)</li>
        </ul>
        <p className="mt-2">
          Consider implementing CAPTCHA for contact forms if suspicious activity
          is frequent.
        </p>
      </div>
    </div>
  );
};

export default SuspiciousActivityAlert;
