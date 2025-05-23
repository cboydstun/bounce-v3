import { Document, Model } from "mongoose";

/**
 * Defines the possible task types
 */
export type TaskType = "Delivery" | "Setup" | "Pickup" | "Maintenance";

/**
 * Defines the possible task priorities
 */
export type TaskPriority = "High" | "Medium" | "Low";

/**
 * Defines the possible task statuses
 */
export type TaskStatus =
  | "Pending" // Initial state when task is created
  | "Assigned" // Task has been assigned to a contractor
  | "In Progress" // Task is being worked on
  | "Completed" // Task has been completed
  | "Cancelled"; // Task has been cancelled

/**
 * Main Task interface
 */
export interface Task {
  _id: string; // MongoDB document ID
  orderId: string; // Reference to the Order
  type: TaskType; // Type of task
  description: string; // Task description/notes
  scheduledDateTime: Date; // When the task is scheduled
  priority: TaskPriority; // Task priority level
  status: TaskStatus; // Current task status
  assignedTo?: string; // Optional: contractor name/company
  createdAt: Date; // Task creation date
  updatedAt: Date; // Task last update date
}

/**
 * Form data interface for creating/updating tasks
 */
export interface TaskFormData {
  type: TaskType; // Type of task
  description: string; // Task description/notes
  scheduledDateTime: Date | string; // When the task is scheduled
  priority: TaskPriority; // Task priority level
  status?: TaskStatus; // Optional: defaults to "Pending"
  assignedTo?: string; // Optional: contractor name/company
}

/**
 * Mongoose document interface for Task
 */
export interface ITaskDocument extends Omit<Task, "_id">, Document {}

/**
 * Mongoose model interface for Task with static methods
 */
export interface ITaskModel extends Model<ITaskDocument> {
  /**
   * Find all tasks for a specific order
   * @param orderId The order ID to search for
   * @returns Promise resolving to an array of tasks
   */
  findByOrderId(orderId: string): Promise<ITaskDocument[]>;

  /**
   * Find all tasks with a specific status
   * @param status The task status to search for
   * @returns Promise resolving to an array of tasks
   */
  findByStatus(status: TaskStatus): Promise<ITaskDocument[]>;

  /**
   * Find all tasks scheduled within a date range
   * @param startDate Start date in ISO format (YYYY-MM-DD)
   * @param endDate End date in ISO format (YYYY-MM-DD)
   * @returns Promise resolving to an array of tasks
   */
  findByDateRange(startDate: string, endDate: string): Promise<ITaskDocument[]>;

  /**
   * Find all tasks assigned to a specific contractor
   * @param assignedTo The contractor name/company
   * @returns Promise resolving to an array of tasks
   */
  findByAssignee(assignedTo: string): Promise<ITaskDocument[]>;
}
