"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import TaskCreateModal from "@/components/admin/TaskCreateModal";
import TaskEditModal from "@/components/admin/TaskEditModal";
import TaskActionButtons from "@/components/admin/TaskActionButtons";
import PriorityBadge from "@/components/admin/PriorityBadge";
import { Task, TaskPriority } from "@/types/task";

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

export default function TasksAdminPage() {
  const { data: session, status } = useSession();
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

  // Redirect if not authenticated
  if (status === "loading") return <div>Loading...</div>;
  if (!session) redirect("/login");

  useEffect(() => {
    fetchTasks();
    fetchPaymentStats();
  }, [filters]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced Task Management
          </h1>
          <p className="text-gray-600">
            Create, manage, and track tasks with full CRUD operations and
            payment management
          </p>
        </div>
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
          Add Task
        </button>
      </div>

      {/* Payment Statistics */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
            <p className="text-2xl font-bold text-gray-900">
              {paymentStats.taskCount}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Paid Tasks</h3>
            <p className="text-2xl font-bold text-green-600">
              {paymentStats.paidTasks}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Unpaid Tasks</h3>
            <p className="text-2xl font-bold text-red-600">
              {paymentStats.unpaidTasks}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
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
          <div className="p-8 text-center text-gray-500">No tasks found</div>
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
    </div>
  );
}
