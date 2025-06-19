import React from "react";
import { TaskPriority } from "@/types/task";

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export default function PriorityBadge({
  priority,
  className = "",
}: PriorityBadgeProps) {
  const getPriorityStyles = (priority: TaskPriority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "High":
        return "⚠️";
      case "Medium":
        return "📋";
      case "Low":
        return "✅";
      default:
        return "📋";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityStyles(
        priority,
      )} ${className}`}
    >
      <span className="mr-1" role="img" aria-label={`${priority} priority`}>
        {getPriorityIcon(priority)}
      </span>
      {priority}
    </span>
  );
}
