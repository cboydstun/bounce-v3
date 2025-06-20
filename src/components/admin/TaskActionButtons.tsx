import React from "react";
import { Task } from "@/types/task";

interface TaskActionButtonsProps {
  task: Task & {
    orderNumber?: string;
    customerName?: string;
    contractorNames?: string[];
  };
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onPaymentEdit: (task: Task) => void;
  disabled?: boolean;
}

export default function TaskActionButtons({
  task,
  onEdit,
  onDelete,
  onPaymentEdit,
  disabled = false,
}: TaskActionButtonsProps) {
  const canDelete = task.status === "Pending";

  return (
    <div className="flex items-center space-x-2">
      {/* Edit Task Button */}
      <button
        onClick={() => onEdit(task)}
        disabled={disabled}
        className="text-blue-600 hover:text-blue-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        title="Edit task details"
      >
        Edit
      </button>

      {/* Payment Button */}
      <button
        onClick={() => onPaymentEdit(task)}
        disabled={disabled}
        className="text-green-600 hover:text-green-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          task.paymentAmount ? "Edit payment amount" : "Set payment amount"
        }
      >
        {task.paymentAmount ? "Payment" : "Set Pay"}
      </button>

      {/* Delete Button - Only for Pending tasks */}
      {canDelete && (
        <button
          onClick={() => onDelete(task)}
          disabled={disabled}
          className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete task (only available for pending tasks)"
        >
          Delete
        </button>
      )}

      {/* Status indicator for non-deletable tasks */}
      {!canDelete && (
        <span
          className="text-gray-400 text-xs"
          title="Tasks can only be deleted when status is 'Pending'"
        >
          No Delete
        </span>
      )}
    </div>
  );
}
