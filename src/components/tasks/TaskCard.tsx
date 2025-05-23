"use client";

import React from "react";
import { Task } from "@/types/task";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isLoading?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  isLoading = false,
}: TaskCardProps) {
  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const { date, time } = formatDateTime(task.scheduledDateTime);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Delivery":
        return "🚚";
      case "Setup":
        return "🔧";
      case "Pickup":
        return "📦";
      case "Maintenance":
        return "⚙️";
      default:
        return "📋";
    }
  };

  const canDelete = task.status === "Pending";

  const handleEdit = () => {
    if (!isLoading) {
      onEdit(task);
    }
  };

  const handleDelete = () => {
    if (!isLoading && canDelete) {
      if (window.confirm("Are you sure you want to delete this task?")) {
        onDelete(task._id);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Type and Priority */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTypeIcon(task.type)}</span>
          <span className="font-medium text-gray-900">{task.type}</span>
        </div>
        <StatusBadge priority={task.priority} />
      </div>

      {/* Description */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 leading-relaxed">
          {task.description}
        </p>
      </div>

      {/* Scheduled Date/Time */}
      <div className="flex items-center space-x-1 mb-2">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-sm text-gray-600">
          {date} at {time}
        </span>
      </div>

      {/* Assigned To */}
      {task.assignedTo && (
        <div className="flex items-center space-x-1 mb-3">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-sm text-gray-600">{task.assignedTo}</span>
        </div>
      )}

      {/* Status and Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <StatusBadge status={task.status} />

        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Edit
          </button>

          {canDelete && (
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
