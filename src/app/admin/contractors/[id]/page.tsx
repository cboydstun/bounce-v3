"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Contractor } from "@/types/contractor";

export default function ContractorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractorId = params.id as string;

  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractorId) {
      loadContractor();
    }
  }, [contractorId]);

  const loadContractor = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/contractors/${contractorId}`);
      if (response.ok) {
        const data = await response.json();
        setContractor(data);
      } else if (response.status === 404) {
        setError("Contractor not found");
      } else {
        setError("Failed to load contractor details");
      }
    } catch (error) {
      console.error("Error loading contractor:", error);
      setError("Failed to load contractor details");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/admin/contractors");
  };

  const handleEdit = () => {
    // For now, redirect back to main page - could implement inline editing later
    router.push("/admin/contractors");
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Contractors
          </button>
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-4">Contractor not found</div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Contractors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Contractor Details
            </h1>
            <p className="text-gray-600">
              Complete information for {contractor.name}
            </p>
          </div>
        </div>
        <button
          onClick={handleEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Edit Contractor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                {contractor.profileImage ? (
                  <img
                    src={contractor.profileImage}
                    alt={`${contractor.name} profile`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center border-2 border-gray-200">
                    <span className="text-xl font-medium text-gray-600">
                      {contractor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {contractor.name}
                  </h2>
                  {contractor.businessName && (
                    <p className="text-gray-600">{contractor.businessName}</p>
                  )}
                  <div className="flex space-x-2 mt-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        contractor.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {contractor.isActive ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        contractor.isVerified
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {contractor.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-16">Email:</span>
                    <a
                      href={`mailto:${contractor.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {contractor.email}
                    </a>
                  </div>
                  {contractor.phone && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-16">Phone:</span>
                      <a
                        href={`tel:${contractor.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {contractor.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Account Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">Created:</span>
                    <span className="text-gray-900">
                      {formatDate(contractor.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">Updated:</span>
                    <span className="text-gray-900">
                      {formatDate(contractor.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Card */}
          {contractor.skills && contractor.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Skills & Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {contractor.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Contact Card */}
          {contractor.emergencyContact?.name && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-24">Name:</span>
                      <span className="text-gray-900">
                        {contractor.emergencyContact.name}
                      </span>
                    </div>
                    {contractor.emergencyContact.relationship && (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-24">
                          Relationship:
                        </span>
                        <span className="text-gray-900">
                          {contractor.emergencyContact.relationship}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    {contractor.emergencyContact.phone && (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-16">Phone:</span>
                        <a
                          href={`tel:${contractor.emergencyContact.phone}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {contractor.emergencyContact.phone}
                        </a>
                      </div>
                    )}
                    {contractor.emergencyContact.email && (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-16">Email:</span>
                        <a
                          href={`mailto:${contractor.emergencyContact.email}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {contractor.emergencyContact.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Card */}
          {contractor.notes && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notes
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {contractor.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Information
              </button>
              <a
                href={`mailto:${contractor.email}`}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-center block"
              >
                Send Email
              </a>
              {contractor.phone && (
                <a
                  href={`tel:${contractor.phone}`}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-center block"
                >
                  Call Phone
                </a>
              )}
            </div>
          </div>

          {/* Integration Status Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Integration Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">QuickBooks</span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                  Not Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">W-9 Form</span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                  Not Submitted
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mobile App</span>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Registered
                </span>
              </div>
            </div>
          </div>

          {/* Statistics Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="text-lg font-semibold text-gray-900">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-lg font-semibold text-green-600">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-lg font-semibold text-gray-900">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Earnings</span>
                <span className="text-lg font-semibold text-gray-900">
                  $0.00
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
