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
export type TaskStatus = "Pending" | "Assigned" | "In Progress" | "Completed" | "Cancelled";
/**
 * GeoJSON Point interface for location data
 */
export interface TaskLocation {
    type: "Point";
    coordinates: [number, number];
}
/**
 * Main Task interface - aligned with CRM system
 */
export interface Task {
    _id: string;
    orderId: string;
    type: TaskType;
    title?: string;
    description: string;
    scheduledDateTime: Date;
    priority: TaskPriority;
    status: TaskStatus;
    assignedContractors: string[];
    assignedTo?: string;
    location?: TaskLocation;
    address?: string;
    paymentAmount?: number;
    completionPhotos?: string[];
    completionNotes?: string;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Form data interface for creating/updating tasks
 */
export interface TaskFormData {
    type: TaskType;
    title?: string;
    description: string;
    scheduledDateTime: Date | string;
    priority: TaskPriority;
    status?: TaskStatus;
    assignedContractors?: string[];
    assignedTo?: string;
    address?: string;
    location?: TaskLocation;
    paymentAmount?: number;
    completionPhotos?: string[];
    completionNotes?: string;
}
/**
 * Mongoose document interface for Task
 */
export interface ITaskDocument extends Omit<Task, "_id">, Document {
}
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
    findAvailableNearLocation(lat: number, lng: number, radiusInMeters: number, contractorSkills: string[], excludeContractorId?: string): Promise<ITaskDocument[]>;
    /**
     * Find all tasks assigned to a specific contractor
     * @param contractorId The contractor ID
     * @param status Optional status filter
     * @returns Promise resolving to an array of tasks
     */
    findByContractor(contractorId: string, status?: TaskStatus): Promise<ITaskDocument[]>;
}
//# sourceMappingURL=task.d.ts.map