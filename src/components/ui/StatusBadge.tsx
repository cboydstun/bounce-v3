import React from "react";
import { TaskStatus, TaskPriority } from "@/types/task";

interface StatusBadgeProps {
  status?: TaskStatus;
  priority?: TaskPriority;
  className?: string;
}

export function StatusBadge({
  status,
  priority,
  className = "",
}: StatusBadgeProps) {
  if (status) {
    return (
      <span
        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
          status,
        )} ${className}`}
      >
        {status}
      </span>
    );
  }

  if (priority) {
    return (
      <span
        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
          priority,
        )} ${className}`}
      >
        {priority}
      </span>
    );
  }

  return null;
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Assigned":
      return "bg-blue-100 text-blue-800";
    case "In Progress":
      return "bg-purple-100 text-purple-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "Low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
