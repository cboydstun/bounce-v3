"use client";

import React, { useState, useEffect } from "react";
import { Task, TaskFormData } from "@/types/task";
import { TaskForm } from "./TaskForm";
import { TaskCard } from "./TaskCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface TaskSectionProps {
  orderId: string;
  orderAddress?: string; // Optional order address to pre-populate tasks
}

export function TaskSection({ orderId, orderAddress }: TaskSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks for the order
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/orders/${orderId}/tasks`);

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const tasksData = await response.json();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch tasks",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [orderId]);

  // Handle creating a new task
  const handleCreateTask = async (taskData: TaskFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/v1/orders/${orderId}/tasks`, {
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

      const newTask = await response.json();
      setTasks((prev) => [...prev, newTask]);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error creating task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create task",
      );
      throw error; // Re-throw to let TaskForm handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating an existing task
  const handleUpdateTask = async (taskData: TaskFormData) => {
    if (!editingTask) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/v1/tasks/${editingTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }

      const updatedTask = await response.json();
      setTasks((prev) =>
        prev.map((task) => (task._id === updatedTask._id ? updatedTask : task)),
      );
      setEditingTask(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error updating task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update task",
      );
      throw error; // Re-throw to let TaskForm handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete task");
      }

      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete task",
      );
    }
  };

  // Handle opening edit form
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // Handle closing form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    setError(null);
  };

  // Handle opening new task form
  const handleAddTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  // Sort tasks by scheduled date and priority
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.scheduledDateTime).getTime();
    const dateB = new Date(b.scheduledDateTime).getTime();

    if (dateA !== dateB) {
      return dateA - dateB; // Earlier dates first
    }

    // If dates are the same, sort by priority (High > Medium > Low)
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Tasks</h2>
        <button
          onClick={handleAddTask}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          Add Task
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-xs underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner className="w-6 h-6" />
          <span className="ml-2 text-gray-600">Loading tasks...</span>
        </div>
      ) : (
        <>
          {/* Tasks List */}
          {sortedTasks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  isLoading={isSubmitting}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                No tasks assigned to this order.
              </p>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add First Task
              </button>
            </div>
          )}
        </>
      )}

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        isLoading={isSubmitting}
        orderAddress={orderAddress}
      />
    </div>
  );
}
