"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { TaskTemplate, TaskTemplateStats } from "@/types/taskTemplate";
import TaskTemplateCreateModal from "@/components/admin/TaskTemplateCreateModal";

interface TaskTemplatesResponse {
  templates: TaskTemplate[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTemplates: number;
    limit: number;
  };
  stats: TaskTemplateStats;
}

export default function TaskTemplatesAdminPage() {
  const { data: session, status } = useSession();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [stats, setStats] = useState<TaskTemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    includeSystem: true,
    includeInactive: false,
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTemplates: 0,
    limit: 20,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect if not authenticated
  if (status === "loading") return <div>Loading...</div>;
  if (!session) redirect("/login");

  useEffect(() => {
    fetchTemplates();
  }, [filters, pagination.currentPage]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (!filters.includeSystem) queryParams.append("includeSystem", "false");
      if (filters.includeInactive)
        queryParams.append("includeInactive", "true");
      if (filters.search) queryParams.append("search", filters.search);
      queryParams.append("page", pagination.currentPage.toString());
      queryParams.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/v1/task-templates?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data: TaskTemplatesResponse = await response.json();
      setTemplates(data.templates || []);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateSystemTemplates = async () => {
    if (
      !confirm(
        "Create system templates for backward compatibility? This will create templates for Delivery, Setup, Pickup, and Maintenance.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/v1/task-templates/migrate-system", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create system templates");
      }

      const data = await response.json();
      alert(`Successfully created ${data.count} system templates`);

      // Refresh templates
      await fetchTemplates();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create system templates",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (template: TaskTemplate) => {
    if (template.isSystemTemplate) {
      alert("System templates cannot be deleted");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete the template "${template.name}"?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/task-templates/${template._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete template");
      }

      // Refresh templates
      await fetchTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete template",
      );
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPaymentRules = (rules: any) => {
    switch (rules.type) {
      case "fixed":
        return `Fixed: $${rules.baseAmount?.toFixed(2) || "0.00"}`;
      case "percentage":
        return `${rules.percentage || 0}% of order total`;
      case "formula":
        return `$${rules.baseAmount?.toFixed(2) || "0.00"} + ${rules.percentage || 0}%`;
      default:
        return "Unknown";
    }
  };

  const formatSchedulingRules = (rules: any) => {
    const offsetText =
      rules.offsetDays === 0
        ? "same day"
        : rules.offsetDays > 0
          ? `${rules.offsetDays} day${rules.offsetDays > 1 ? "s" : ""} after`
          : `${Math.abs(rules.offsetDays)} day${Math.abs(rules.offsetDays) > 1 ? "s" : ""} before`;

    const referenceText =
      rules.relativeTo === "eventDate"
        ? "event"
        : rules.relativeTo === "deliveryDate"
          ? "delivery"
          : "manual";

    if (rules.relativeTo === "manual") {
      return "Manual scheduling";
    }

    return `${offsetText} ${referenceText} at ${rules.defaultTime}`;
  };

  const handleTemplateCreated = () => {
    fetchTemplates();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Task Templates
          </h1>
          <p className="text-gray-600">
            Create and manage dynamic task templates for automated task
            generation
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleMigrateSystemTemplates}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Create System Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Template
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Active</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalActive}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              System Templates
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalSystem}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Custom Templates
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {stats.totalCustom}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Usage</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalUsage}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Search templates..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.includeSystem}
                onChange={(e) =>
                  setFilters({ ...filters, includeSystem: e.target.checked })
                }
                className="mr-2"
              />
              Include System Templates
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.includeInactive}
                onChange={(e) =>
                  setFilters({ ...filters, includeInactive: e.target.checked })
                }
                className="mr-2"
              />
              Include Inactive
            </label>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Templates ({templates.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No templates found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Rules
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template._id} className="hover:bg-gray-50">
                    {/* Template */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {template.name}
                          {template.isSystemTemplate && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              System
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {template.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Created {formatDate(template.createdAt)} by{" "}
                          {template.createdByName}
                        </div>
                      </div>
                    </td>

                    {/* Type & Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {template.defaultPriority} Priority
                        </span>
                        <div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              template.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Payment Rules */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatPaymentRules(template.paymentRules)}
                      </div>
                      {template.paymentRules.minimumAmount && (
                        <div className="text-xs text-gray-500">
                          Min: ${template.paymentRules.minimumAmount.toFixed(2)}
                        </div>
                      )}
                      {template.paymentRules.maximumAmount && (
                        <div className="text-xs text-gray-500">
                          Max: ${template.paymentRules.maximumAmount.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Scheduling */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatSchedulingRules(template.schedulingRules)}
                      </div>
                      {template.schedulingRules.businessHoursOnly && (
                        <div className="text-xs text-gray-500">
                          Business hours only
                        </div>
                      )}
                    </td>

                    {/* Usage */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {template.usageCount}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">tasks</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            /* TODO: Open preview modal */
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Preview
                        </button>
                        {!template.isSystemTemplate && (
                          <>
                            <button
                              onClick={() => {
                                /* TODO: Open edit modal */
                              }}
                              className="text-indigo-600 hover:text-indigo-900 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalTemplates,
              )}{" "}
              of {pagination.totalTemplates} templates
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    currentPage: pagination.currentPage - 1,
                  })
                }
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    currentPage: pagination.currentPage + 1,
                  })
                }
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <TaskTemplateCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTemplateCreated={handleTemplateCreated}
      />
    </div>
  );
}
