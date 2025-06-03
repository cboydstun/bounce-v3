"use client";

import React, { useState, useEffect } from "react";
import {
  Task,
  TaskFormData,
  TaskType,
  TaskPriority,
  TaskStatus,
} from "@/types/task";
import { Contractor } from "@/types/contractor";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskFormData) => Promise<void>;
  task?: Task | null; // For editing existing tasks
  isLoading?: boolean;
  orderAddress?: string; // Pre-populate address from order
}

export function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  task,
  isLoading = false,
  orderAddress,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    type: "Delivery",
    title: "",
    description: "",
    scheduledDateTime: "",
    priority: "Medium",
    status: "Pending",
    assignedContractors: [],
    assignedTo: "",
    paymentAmount: undefined,
    completionPhotos: [],
    completionNotes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loadingContractors, setLoadingContractors] = useState(false);

  // Load contractors when modal opens
  useEffect(() => {
    if (isOpen) {
      loadContractors();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Editing existing task
        setFormData({
          type: task.type,
          title: task.title || "",
          description: task.description,
          scheduledDateTime: new Date(task.scheduledDateTime)
            .toISOString()
            .slice(0, 16),
          priority: task.priority,
          status: task.status,
          assignedContractors: task.assignedContractors || [],
          assignedTo: task.assignedTo || "",
          paymentAmount: task.paymentAmount,
          completionPhotos: task.completionPhotos || [],
          completionNotes: task.completionNotes || "",
        });
      } else {
        // Creating new task
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30); // Default to 30 minutes from now
        setFormData({
          type: "Delivery",
          title: "",
          description: "",
          scheduledDateTime: now.toISOString().slice(0, 16),
          priority: "Medium",
          status: "Pending",
          assignedContractors: [],
          assignedTo: "",
          paymentAmount: undefined,
          completionPhotos: [],
          completionNotes: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, task]);

  const loadContractors = async () => {
    setLoadingContractors(true);
    try {
      const response = await fetch("/api/v1/contractors");
      if (response.ok) {
        const contractorData = await response.json();
        setContractors(contractorData.contractors || []);
      } else {
        console.error("Failed to load contractors");
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
    } finally {
      setLoadingContractors(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleContractorToggle = (contractorId: string) => {
    setFormData((prev) => {
      const currentContractors = prev.assignedContractors || [];
      const isSelected = currentContractors.includes(contractorId);

      if (isSelected) {
        // Remove contractor
        return {
          ...prev,
          assignedContractors: currentContractors.filter(
            (id) => id !== contractorId,
          ),
        };
      } else {
        // Add contractor
        return {
          ...prev,
          assignedContractors: [...currentContractors, contractorId],
        };
      }
    });
  };

  const getSelectedContractorNames = () => {
    if (
      !formData.assignedContractors ||
      formData.assignedContractors.length === 0
    ) {
      return "No contractors assigned";
    }

    const selectedContractors = contractors.filter((contractor) =>
      formData.assignedContractors?.includes(contractor._id),
    );

    return selectedContractors.map((contractor) => contractor.name).join(", ");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = "Task type is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    if (formData.title && formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (formData.completionNotes && formData.completionNotes.length > 2000) {
      newErrors.completionNotes =
        "Completion notes must be less than 2000 characters";
    }

    if (!formData.scheduledDateTime) {
      newErrors.scheduledDateTime = "Scheduled date/time is required";
    } else {
      const scheduledDate = new Date(formData.scheduledDateTime);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      if (scheduledDate.getTime() < now.getTime() - bufferTime) {
        newErrors.scheduledDateTime =
          "Scheduled date/time cannot be in the past";
      }
    }

    if (!formData.priority) {
      newErrors.priority = "Priority is required";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    if (
      formData.assignedTo &&
      typeof formData.assignedTo === "string" &&
      formData.assignedTo.length > 200
    ) {
      newErrors.assignedTo = "Assigned to must be less than 200 characters";
    }

    // Validate payment amount
    if (
      formData.paymentAmount !== undefined &&
      formData.paymentAmount !== null
    ) {
      const paymentAmount = Number(formData.paymentAmount);
      if (isNaN(paymentAmount)) {
        newErrors.paymentAmount = "Payment amount must be a valid number";
      } else if (paymentAmount < 0) {
        newErrors.paymentAmount = "Payment amount cannot be negative";
      } else if (paymentAmount > 10000) {
        newErrors.paymentAmount = "Payment amount cannot exceed $10,000";
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
      // Convert paymentAmount from string to number if it exists
      let paymentAmount: number | undefined = undefined;
      if (
        formData.paymentAmount !== undefined &&
        formData.paymentAmount !== null
      ) {
        const paymentAmountStr = String(formData.paymentAmount).trim();
        if (paymentAmountStr !== "") {
          const convertedAmount = Number(paymentAmountStr);
          if (!isNaN(convertedAmount)) {
            paymentAmount = convertedAmount;
          }
        }
      }

      await onSubmit({
        ...formData,
        title: formData.title?.trim() || undefined,
        description: formData.description.trim(),
        assignedTo: formData.assignedTo?.trim() || undefined,
        completionNotes: formData.completionNotes?.trim() || undefined,
        paymentAmount: paymentAmount,
      });
      onClose();
    } catch (error) {
      console.error("Error submitting task:", error);
      // Error handling is done in the parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {task ? "Edit Task" : "Add New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Task Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            >
              <option value="Delivery">Delivery</option>
              <option value="Setup">Setup</option>
              <option value="Pickup">Pickup</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title (Optional)
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Brief title for the task (optional)"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Describe the task..."
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Address Info (read-only display) */}
          {orderAddress && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Location
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700">
                {orderAddress}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Address will be automatically derived from the order
              </p>
            </div>
          )}

          {/* Scheduled Date/Time */}
          <div>
            <label
              htmlFor="scheduledDateTime"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Scheduled Date/Time *
            </label>
            <input
              type="datetime-local"
              id="scheduledDateTime"
              name="scheduledDateTime"
              value={
                typeof formData.scheduledDateTime === "string"
                  ? formData.scheduledDateTime
                  : formData.scheduledDateTime.toISOString().slice(0, 16)
              }
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.scheduledDateTime ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.scheduledDateTime && (
              <p className="text-red-500 text-xs mt-1">
                {errors.scheduledDateTime}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Priority *
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.priority ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {errors.priority && (
              <p className="text-red-500 text-xs mt-1">{errors.priority}</p>
            )}
          </div>

          {/* Payment Amount */}
          <div>
            <label
              htmlFor="paymentAmount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Payment Amount (USD)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="paymentAmount"
                name="paymentAmount"
                value={formData.paymentAmount || ""}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full pl-7 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.paymentAmount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty if no payment amount is set for this task
            </p>
            {errors.paymentAmount && (
              <p className="text-red-500 text-xs mt-1">
                {errors.paymentAmount}
              </p>
            )}
          </div>

          {/* Status (only show when editing) */}
          {task && (
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              >
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-xs mt-1">{errors.status}</p>
              )}
            </div>
          )}

          {/* Contractor Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Contractors
            </label>
            {loadingContractors ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                Loading contractors...
              </div>
            ) : contractors.length === 0 ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                No contractors available
              </div>
            ) : (
              <div className="space-y-2">
                {/* Selected contractors display */}
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
                  {getSelectedContractorNames()}
                </div>

                {/* Contractor selection list */}
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                  {contractors.map((contractor) => (
                    <label
                      key={contractor._id}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={
                          formData.assignedContractors?.includes(
                            contractor._id,
                          ) || false
                        }
                        onChange={() => handleContractorToggle(contractor._id)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {contractor.name}
                        </div>
                        {contractor.skills && contractor.skills.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Skills: {contractor.skills.join(", ")}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Legacy Assigned To field (for backward compatibility) */}
          <div>
            <label
              htmlFor="assignedTo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Additional Notes (Legacy)
            </label>
            <input
              type="text"
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.assignedTo ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Additional contractor notes (optional)"
              disabled={isLoading}
            />
            {errors.assignedTo && (
              <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>
            )}
          </div>

          {/* Completion Notes (only show when editing and status is Completed) */}
          {task && formData.status === "Completed" && (
            <div>
              <label
                htmlFor="completionNotes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Completion Notes
              </label>
              <textarea
                id="completionNotes"
                name="completionNotes"
                value={formData.completionNotes}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.completionNotes ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Notes about task completion (optional)"
                disabled={isLoading}
              />
              {errors.completionNotes && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.completionNotes}
                </p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
