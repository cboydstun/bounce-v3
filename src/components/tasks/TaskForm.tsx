"use client";

import React, { useState, useEffect } from "react";
import {
  Task,
  TaskFormData,
  TaskType,
  TaskPriority,
  TaskStatus,
} from "@/types/task";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskFormData) => Promise<void>;
  task?: Task | null; // For editing existing tasks
  isLoading?: boolean;
}

export function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  task,
  isLoading = false,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    type: "Delivery",
    description: "",
    scheduledDateTime: "",
    priority: "Medium",
    status: "Pending",
    assignedTo: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Editing existing task
        setFormData({
          type: task.type,
          description: task.description,
          scheduledDateTime: new Date(task.scheduledDateTime)
            .toISOString()
            .slice(0, 16),
          priority: task.priority,
          status: task.status,
          assignedTo: task.assignedTo || "",
        });
      } else {
        // Creating new task
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30); // Default to 30 minutes from now
        setFormData({
          type: "Delivery",
          description: "",
          scheduledDateTime: now.toISOString().slice(0, 16),
          priority: "Medium",
          status: "Pending",
          assignedTo: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, task]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        description: formData.description.trim(),
        assignedTo: formData.assignedTo?.trim() || undefined,
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

          {/* Assigned To */}
          <div>
            <label
              htmlFor="assignedTo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Assigned To
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
              placeholder="Contractor name or company"
              disabled={isLoading}
            />
            {errors.assignedTo && (
              <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>
            )}
          </div>

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
