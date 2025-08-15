"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import TaskCreateModal from "@/components/admin/TaskCreateModal";
import TaskEditModal from "@/components/admin/TaskEditModal";
import TaskActionButtons from "@/components/admin/TaskActionButtons";
import PriorityBadge from "@/components/admin/PriorityBadge";
import TaskTemplateCreateModal from "@/components/admin/TaskTemplateCreateModal";
import TaskTemplateEditModal from "@/components/admin/TaskTemplateEditModal";
import TaskTemplatePreviewModal from "@/components/admin/TaskTemplatePreviewModal";
import { Task, TaskPriority } from "@/types/task";
import { TaskTemplate, TaskTemplateStats } from "@/types/taskTemplate";

interface EnhancedTask extends Task {
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  eventDate?: string;
  contractorNames?: string[];
}

interface PaymentStats {
  totalAmount: number;
  averageAmount: number;
  taskCount: number;
  paidTasks: number;
  unpaidTasks: number;
}

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

export default function TasksAdminPage() {
  const { data: session, status } = useSession();

  // Tab state
  const [activeTab, setActiveTab] = useState<"tasks" | "templates">("tasks");

  // Tasks state
  const [tasks, setTasks] = useState<EnhancedTask[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentReason, setPaymentReason] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    taskType: "",
    priority: "",
    contractorId: "",
    search: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
  });

  // Templates state
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [templateStats, setTemplateStats] = useState<TaskTemplateStats | null>(
    null,
  );
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateFilters, setTemplateFilters] = useState({
    includeSystem: true,
    includeInactive: false,
    search: "",
  });
  const [templatePagination, setTemplatePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTemplates: 0,
    limit: 20,
  });
  const [showTemplateCreateModal, setShowTemplateCreateModal] = useState(false);
  const [showTemplateEditModal, setShowTemplateEditModal] = useState(false);
  const [showTemplatePreviewModal, setShowTemplatePreviewModal] =
    useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(
    null,
  );
  const [previewingTemplate, setPreviewingTemplate] =
    useState<TaskTemplate | null>(null);

  // Redirect if not authenticated
  if (status === "loading") return <div>Loading...</div>;
  if (!session) redirect("/login");

  useEffect(() => {
    if (activeTab === "tasks") {
      fetchTasks();
      fetchPaymentStats();
    } else if (activeTab === "templates") {
      fetchTemplates();
    }
  }, [filters, templateFilters, templatePagination.currentPage, activeTab]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.status) queryParams.append("status", filters.status);
      if (filters.taskType) queryParams.append("taskType", filters.taskType);
      if (filters.priority) queryParams.append("priority", filters.priority);
      if (filters.contractorId)
        queryParams.append("contractorId", filters.contractorId);
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.minAmount) queryParams.append("minAmount", filters.minAmount);
      if (filters.maxAmount) queryParams.append("maxAmount", filters.maxAmount);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);

      const response = await fetch(`/api/v1/tasks?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("type", "summary");

      if (filters.status) queryParams.append("status", filters.status);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);

      const response = await fetch(
        `/api/v1/tasks/payment-reports?${queryParams}`,
      );
      if (!response.ok) throw new Error("Failed to fetch payment stats");

      const data = await response.json();
      setPaymentStats(data.summary);
    } catch (err) {
      console.error("Failed to fetch payment stats:", err);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedTask) return;

    try {
      const amount = paymentAmount ? parseFloat(paymentAmount) : null;

      const response = await fetch(
        `/api/v1/tasks/${selectedTask._id}/payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentAmount: amount,
            reason: paymentReason || undefined,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update payment");
      }

      // Refresh tasks and stats
      await fetchTasks();
      await fetchPaymentStats();

      // Close modal and reset form
      setShowPaymentModal(false);
      setSelectedTask(null);
      setPaymentAmount("");
      setPaymentReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment");
    }
  };

  const handleClearPayment = async (task: Task) => {
    if (
      !confirm(
        "Are you sure you want to clear the payment amount for this task?",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/tasks/${task._id}/payment`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Payment amount cleared by admin",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clear payment");
      }

      // Refresh tasks and stats
      await fetchTasks();
      await fetchPaymentStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear payment");
    }
  };

  const openPaymentModal = (task: Task) => {
    setSelectedTask(task);
    setPaymentAmount(task.paymentAmount?.toString() || "");
    setPaymentReason("");
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "Not set";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // New CRUD handlers
  const handleTaskCreated = () => {
    fetchTasks();
    fetchPaymentStats();
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    fetchPaymentStats();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleDeleteTask = async (task: Task) => {
    if (task.status !== "Pending") {
      alert("Only tasks with 'Pending' status can be deleted");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete this task: ${task.title || task.description}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/tasks/${task._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete task");
      }

      // Refresh tasks and stats
      await fetchTasks();
      await fetchPaymentStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  // Template functions
  const fetchTemplates = async () => {
    try {
      setTemplateLoading(true);
      const queryParams = new URLSearchParams();

      if (!templateFilters.includeSystem)
        queryParams.append("includeSystem", "false");
      if (templateFilters.includeInactive)
        queryParams.append("includeInactive", "true");
      if (templateFilters.search)
        queryParams.append("search", templateFilters.search);
      queryParams.append("page", templatePagination.currentPage.toString());
      queryParams.append("limit", templatePagination.limit.toString());

      const response = await fetch(`/api/v1/task-templates?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data: TaskTemplatesResponse = await response.json();
      setTemplates(data.templates || []);
      setTemplateStats(data.stats);
      setTemplatePagination(data.pagination);
    } catch (err) {
      setTemplateError(
        err instanceof Error ? err.message : "Failed to fetch templates",
      );
    } finally {
      setTemplateLoading(false);
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
      setTemplateLoading(true);
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
      setTemplateError(
        err instanceof Error
          ? err.message
          : "Failed to create system templates",
      );
    } finally {
      setTemplateLoading(false);
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
      setTemplateError(
        err instanceof Error ? err.message : "Failed to delete template",
      );
    }
  };

  const handleTemplateCreated = () => {
    fetchTemplates();
  };

  const handleTemplateUpdated = () => {
    fetchTemplates();
  };

  const handleEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setShowTemplateEditModal(true);
  };

  const handlePreviewTemplate = (template: TaskTemplate) => {
    setPreviewingTemplate(template);
    setShowTemplatePreviewModal(true);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Task Management
          </h1>
          <p className="text-gray-600">
            Manage tasks and templates with full CRUD operations and payment
            tracking
          </p>
        </div>
        <button
          onClick={() => {
            if (activeTab === "tasks") {
              setShowCreateModal(true);
            } else {
              setShowTemplateCreateModal(true);
            }
          }}
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
          {activeTab === "tasks" ? "Add Task" : "Create Template"}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "tasks"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "templates"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("templates")}
        >
          Templates
        </button>
      </div>

      {/* Tasks Tab Content */}
      {activeTab === "tasks" && (
        <>
          {/* Payment Statistics */}
          {paymentStats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Tasks
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentStats.taskCount}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Paid Tasks
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {paymentStats.paidTasks}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Unpaid Tasks
                </h3>
                <p className="text-2xl font-bold text-red-600">
                  {paymentStats.unpaidTasks}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Amount
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(paymentStats.totalAmount)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Average Amount
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(paymentStats.averageAmount)}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minAmount}
                  onChange={(e) =>
                    setFilters({ ...filters, minAmount: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxAmount}
                  onChange={(e) =>
                    setFilters({ ...filters, maxAmount: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="999999.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() =>
                  setFilters({
                    status: "",
                    taskType: "",
                    priority: "",
                    contractorId: "",
                    search: "",
                    minAmount: "",
                    maxAmount: "",
                    startDate: "",
                    endDate: "",
                  })
                }
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Tasks Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Tasks ({tasks.length})</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tasks found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task & Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type & Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduled
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contractors
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task._id} className="hover:bg-gray-50">
                        {/* Task & Order */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {task.title || `Task ${task._id.slice(-6)}`}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs mb-1">
                              {task.description}
                            </div>
                            {task.orderNumber && (
                              <div className="text-xs text-blue-600">
                                Order: {task.orderNumber}
                                {task.customerName && ` • ${task.customerName}`}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Type & Priority */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {task.type}
                            </span>
                            <div>
                              <PriorityBadge
                                priority={task.priority as TaskPriority}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              task.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "In Progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : task.status === "Assigned"
                                    ? "bg-blue-100 text-blue-800"
                                    : task.status === "Cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>

                        {/* Scheduled */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(task.scheduledDateTime)}
                        </td>

                        {/* Contractors */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {task.contractorNames &&
                            task.contractorNames.length > 0 ? (
                              <div className="space-y-1">
                                {task.contractorNames
                                  .slice(0, 2)
                                  .map((name, index) => (
                                    <div
                                      key={index}
                                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                                    >
                                      {name}
                                    </div>
                                  ))}
                                {task.contractorNames.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{task.contractorNames.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Not assigned
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Payment */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${
                              task.paymentAmount
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            {formatCurrency(task.paymentAmount)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TaskActionButtons
                            task={task}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            onPaymentEdit={openPaymentModal}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Templates Tab Content */}
      {activeTab === "templates" && (
        <>
          {/* Template Statistics */}
          {templateStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Active
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {templateStats.totalActive}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  System Templates
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {templateStats.totalSystem}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Custom Templates
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {templateStats.totalCustom}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Usage
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {templateStats.totalUsage}
                </p>
              </div>
            </div>
          )}

          {/* Template Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={handleMigrateSystemTemplates}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={templateFilters.search}
                  onChange={(e) =>
                    setTemplateFilters({
                      ...templateFilters,
                      search: e.target.value,
                    })
                  }
                  placeholder="Search templates..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={templateFilters.includeSystem}
                    onChange={(e) =>
                      setTemplateFilters({
                        ...templateFilters,
                        includeSystem: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  Include System Templates
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={templateFilters.includeInactive}
                    onChange={(e) =>
                      setTemplateFilters({
                        ...templateFilters,
                        includeInactive: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  Include Inactive
                </label>
              </div>
            </div>
          </div>

          {/* Template Error Message */}
          {templateError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {templateError}
            </div>
          )}

          {/* Templates Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                Templates ({templates.length})
              </h2>
            </div>

            {templateLoading ? (
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
                              Min: $
                              {template.paymentRules.minimumAmount.toFixed(2)}
                            </div>
                          )}
                          {template.paymentRules.maximumAmount && (
                            <div className="text-xs text-gray-500">
                              Max: $
                              {template.paymentRules.maximumAmount.toFixed(2)}
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
                          <span className="text-xs text-gray-500 ml-1">
                            tasks
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePreviewTemplate(template)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleEditTemplate(template)}
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Template Pagination */}
            {templatePagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing{" "}
                  {(templatePagination.currentPage - 1) *
                    templatePagination.limit +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    templatePagination.currentPage * templatePagination.limit,
                    templatePagination.totalTemplates,
                  )}{" "}
                  of {templatePagination.totalTemplates} templates
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setTemplatePagination({
                        ...templatePagination,
                        currentPage: templatePagination.currentPage - 1,
                      })
                    }
                    disabled={templatePagination.currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setTemplatePagination({
                        ...templatePagination,
                        currentPage: templatePagination.currentPage + 1,
                      })
                    }
                    disabled={
                      templatePagination.currentPage ===
                      templatePagination.totalPages
                    }
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Payment Amount
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Task:{" "}
                  {selectedTask.title || `Task ${selectedTask._id.slice(-6)}`}
                </p>
                <p className="text-sm text-gray-600">
                  Current Amount: {formatCurrency(selectedTask.paymentAmount)}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  max="999999.99"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Reason for payment change..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePayment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Update Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={showEditModal}
        task={editingTask}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Task Template Create Modal */}
      <TaskTemplateCreateModal
        isOpen={showTemplateCreateModal}
        onClose={() => setShowTemplateCreateModal(false)}
        onTemplateCreated={handleTemplateCreated}
      />

      {/* Task Template Edit Modal */}
      <TaskTemplateEditModal
        isOpen={showTemplateEditModal}
        template={editingTemplate}
        onClose={() => {
          setShowTemplateEditModal(false);
          setEditingTemplate(null);
        }}
        onTemplateUpdated={handleTemplateUpdated}
      />

      {/* Task Template Preview Modal */}
      <TaskTemplatePreviewModal
        isOpen={showTemplatePreviewModal}
        template={previewingTemplate}
        onClose={() => {
          setShowTemplatePreviewModal(false);
          setPreviewingTemplate(null);
        }}
      />
    </div>
  );
}
