import React, { useState } from "react";
import { TaskType, TaskPriority, TaskFormData } from "@/types/task";
import OrderSelector from "./OrderSelector";
import ContractorSelector from "./ContractorSelector";

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fullAddress: string;
  eventDate: string;
  deliveryDate: string;
  status: string;
  totalAmount: number;
  displayText: string;
  displaySubtext: string;
}

export default function TaskCreateModal({
  isOpen,
  onClose,
  onTaskCreated,
}: TaskCreateModalProps) {
  const [formData, setFormData] = useState<Partial<TaskFormData>>({
    type: "Delivery",
    priority: "Medium",
    assignedContractors: [],
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const taskTypes: TaskType[] = ["Delivery", "Setup", "Pickup", "Maintenance"];
  const priorities: TaskPriority[] = ["High", "Medium", "Low"];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleOrderSelect = (order: Order | null) => {
    setSelectedOrder(order);
    setFormData((prev) => ({
      ...prev,
      orderId: order?._id || "",
    }));

    // Clear order error when order is selected
    if (order && errors.orderId) {
      setErrors((prev) => ({
        ...prev,
        orderId: "",
      }));
    }
  };

  const handleContractorsChange = (contractorIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      assignedContractors: contractorIds,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedOrder) {
      newErrors.orderId = "Please select an order";
    }

    if (!formData.type) {
      newErrors.type = "Task type is required";
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.scheduledDateTime) {
      newErrors.scheduledDateTime = "Scheduled date/time is required";
    } else {
      const scheduledDate = new Date(formData.scheduledDateTime);
      if (isNaN(scheduledDate.getTime())) {
        newErrors.scheduledDateTime = "Invalid date/time format";
      } else if (scheduledDate < new Date()) {
        newErrors.scheduledDateTime =
          "Scheduled date/time cannot be in the past";
      }
    }

    if (
      formData.paymentAmount !== undefined &&
      formData.paymentAmount !== null
    ) {
      const amount = Number(formData.paymentAmount);
      if (isNaN(amount) || amount < 0) {
        newErrors.paymentAmount = "Payment amount must be a positive number";
      } else if (amount > 999999.99) {
        newErrors.paymentAmount = "Payment amount cannot exceed $999,999.99";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const taskData: TaskFormData = {
        orderId: selectedOrder!._id,
        type: formData.type as TaskType,
        title: formData.title?.trim() || undefined,
        description: formData.description!.trim(),
        scheduledDateTime: formData.scheduledDateTime!,
        priority: formData.priority as TaskPriority,
        assignedContractors: formData.assignedContractors || [],
        paymentAmount: formData.paymentAmount
          ? Number(formData.paymentAmount)
          : undefined,
      };

      const response = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      // Reset form and close modal
      setFormData({
        type: "Delivery",
        priority: "Medium",
        assignedContractors: [],
      });
      setSelectedOrder(null);
      setErrors({});
      onTaskCreated();
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      setErrors({
        submit:
          error instanceof Error ? error.message : "Failed to create task",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        type: "Delivery",
        priority: "Medium",
        assignedContractors: [],
      });
      setSelectedOrder(null);
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Create New Task
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Order *
              </label>
              <OrderSelector
                selectedOrderId={selectedOrder?._id}
                onOrderSelect={handleOrderSelect}
                error={errors.orderId}
                disabled={loading}
              />
            </div>

            {/* Task Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Type *
                </label>
                <select
                  name="type"
                  value={formData.type || ""}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full border rounded-md px-3 py-2 ${
                    errors.type
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                >
                  {taskTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority || "Medium"}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title (Optional)
              </label>
              <input
                type="text"
                name="title"
                value={formData.title || ""}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="e.g., Deliver bounce house to birthday party"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                disabled={loading}
                rows={3}
                placeholder="Describe the task details, special instructions, etc."
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Scheduled Date/Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                name="scheduledDateTime"
                value={
                  formData.scheduledDateTime
                    ? typeof formData.scheduledDateTime === "string"
                      ? formData.scheduledDateTime
                      : formData.scheduledDateTime.toISOString().slice(0, 16)
                    : ""
                }
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.scheduledDateTime
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
              {errors.scheduledDateTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.scheduledDateTime}
                </p>
              )}
            </div>

            {/* Contractor Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Contractors (Optional)
              </label>
              <ContractorSelector
                selectedContractorIds={formData.assignedContractors || []}
                onContractorsChange={handleContractorsChange}
                disabled={loading}
              />
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="paymentAmount"
                  value={formData.paymentAmount || ""}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  max="999999.99"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full border rounded-md pl-8 pr-3 py-2 ${
                    errors.paymentAmount
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
              </div>
              {errors.paymentAmount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.paymentAmount}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {loading ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
