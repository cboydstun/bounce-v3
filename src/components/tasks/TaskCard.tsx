"use client";

import React, { useState, useEffect } from "react";
import { Task } from "@/types/task";
import { Contractor } from "@/types/contractor";
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
  const [assignedContractorNames, setAssignedContractorNames] = useState<
    string[]
  >([]);
  const [loadingContractors, setLoadingContractors] = useState(false);

  // Load contractor names when component mounts or task changes
  useEffect(() => {
    if (task.assignedContractors && task.assignedContractors.length > 0) {
      loadContractorNames();
    } else {
      setAssignedContractorNames([]);
    }
  }, [task.assignedContractors]);

  const loadContractorNames = async () => {
    if (!task.assignedContractors || task.assignedContractors.length === 0) {
      return;
    }

    setLoadingContractors(true);
    try {
      const response = await fetch("/api/v1/contractors");
      if (response.ok) {
        const contractors: Contractor[] = await response.json();
        const assignedContractors = contractors.filter((contractor) =>
          task.assignedContractors?.includes(contractor._id),
        );
        setAssignedContractorNames(assignedContractors.map((c) => c.name));
      } else {
        console.error("Failed to load contractors");
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
    } finally {
      setLoadingContractors(false);
    }
  };

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

      {/* Assigned Contractors */}
      {(assignedContractorNames.length > 0 || loadingContractors) && (
        <div className="flex items-start space-x-1 mb-2">
          <svg
            className="w-4 h-4 text-gray-400 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <div className="flex-1">
            {loadingContractors ? (
              <span className="text-sm text-gray-500">
                Loading contractors...
              </span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {assignedContractorNames.map((name, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy Assigned To (if no contractors assigned) */}
      {task.assignedTo &&
        assignedContractorNames.length === 0 &&
        !loadingContractors && (
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
