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
 * GeoJSON Point interface for location data
 */
export interface TaskLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Task Payment History interface for tracking payment changes
 */
export interface TaskPaymentHistory {
  _id: string; // MongoDB document ID
  taskId: string; // Reference to the Task
  orderId: string; // Reference to the Order
  previousAmount?: number; // Previous payment amount (null for initial set)
  newAmount?: number; // New payment amount (null for clearing)
  changedBy: string; // Admin user ID who made the change
  changedByName: string; // Admin user name for display
  reason?: string; // Optional reason for the change
  createdAt: Date; // When the change was made
}

/**
 * Mongoose document interface for TaskPaymentHistory
 */
export interface ITaskPaymentHistoryDocument
  extends Omit<TaskPaymentHistory, "_id">,
    Document {}

/**
 * Mongoose model interface for TaskPaymentHistory
 */
export interface ITaskPaymentHistoryModel
  extends Model<ITaskPaymentHistoryDocument> {
  /**
   * Create a new payment history entry
   * @param data Payment history data
   * @returns Promise resolving to the created history entry
   */
  createPaymentChange(data: {
    taskId: string;
    orderId: string;
    previousAmount?: number;
    newAmount?: number;
    changedBy: string;
    changedByName: string;
    reason?: string;
  }): Promise<ITaskPaymentHistoryDocument>;

  /**
   * Find payment history for a specific task
   * @param taskId The task ID
   * @returns Promise resolving to an array of payment history entries
   */
  findByTaskId(taskId: string): Promise<ITaskPaymentHistoryDocument[]>;

  /**
   * Find payment history for a specific order
   * @param orderId The order ID
   * @returns Promise resolving to an array of payment history entries
   */
  findByOrderId(orderId: string): Promise<ITaskPaymentHistoryDocument[]>;
}

/**
 * Main Task interface - aligned with API server
 */
export interface Task {
  _id: string; // MongoDB document ID
  orderId: string; // Reference to the Order
  templateId?: string; // Reference to the TaskTemplate (optional for backward compatibility)
  type: TaskType; // Type of task (kept for backward compatibility)
  title?: string; // Optional task title
  description: string; // Task description/notes
  scheduledDateTime: Date; // When the task is scheduled
  priority: TaskPriority; // Task priority level
  status: TaskStatus; // Current task status
  assignedContractors: string[]; // Array of contractor IDs
  assignedTo?: string; // Optional: computed field for backward compatibility
  location?: TaskLocation; // GeoJSON Point for geospatial queries (optional)
  address?: string; // Human-readable address (derived from order)
  paymentAmount?: number; // Payment amount for the task in USD
  completionPhotos?: string[]; // Array of photo URLs/paths
  completionNotes?: string; // Notes added upon task completion
  completedAt?: Date; // Timestamp when task was completed
  createdAt: Date; // Task creation date
  updatedAt: Date; // Task last update date
}

/**
 * Form data interface for creating/updating tasks
 */
export interface TaskFormData {
  orderId: string; // Reference to the Order (required for creation)
  templateId?: string; // Reference to the TaskTemplate (optional, for template-based creation)
  type: TaskType; // Type of task (required for backward compatibility)
  title?: string; // Optional task title
  description: string; // Task description/notes
  scheduledDateTime: Date | string; // When the task is scheduled
  priority?: TaskPriority; // Task priority level (optional, defaults to "Medium")
  status?: TaskStatus; // Optional: defaults to "Pending"
  assignedContractors?: string[]; // Optional: array of contractor IDs
  assignedTo?: string; // Optional: contractor name/company (backward compatibility)
  address?: string; // Optional: will be derived from order if not provided
  location?: TaskLocation; // Optional: will be geocoded from order address if not provided
  paymentAmount?: number; // Optional: payment amount for the task in USD
  completionPhotos?: string[]; // Optional: array of photo URLs/paths
  completionNotes?: string; // Optional: completion notes
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

  /**
   * Find available tasks near a specific location
   * @param lat Latitude
   * @param lng Longitude
   * @param radiusInMeters Search radius in meters
   * @param contractorSkills Array of contractor skills
   * @param excludeContractorId Optional contractor ID to exclude
   * @returns Promise resolving to an array of available tasks
   */
  findAvailableNearLocation(
    lat: number,
    lng: number,
    radiusInMeters: number,
    contractorSkills: string[],
    excludeContractorId?: string,
  ): Promise<ITaskDocument[]>;

  /**
   * Find all tasks assigned to a specific contractor
   * @param contractorId The contractor ID
   * @param status Optional status filter
   * @returns Promise resolving to an array of tasks
   */
  findByContractor(
    contractorId: string,
    status?: TaskStatus,
  ): Promise<ITaskDocument[]>;

  /**
   * Find all tasks within a payment amount range
   * @param minAmount Minimum payment amount
   * @param maxAmount Maximum payment amount
   * @returns Promise resolving to an array of tasks
   */
  findByPaymentRange(
    minAmount: number,
    maxAmount: number,
  ): Promise<ITaskDocument[]>;

  /**
   * Get payment statistics for tasks
   * @param filters Optional filters for status, contractor, date range
   * @returns Promise resolving to payment statistics
   */
  getPaymentStats(filters?: {
    status?: TaskStatus;
    contractorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalAmount: number;
    averageAmount: number;
    taskCount: number;
    paidTasks: number;
    unpaidTasks: number;
  }>;
}
