import { ITaskDocument } from "../models/Task.js";
export interface TaskFilters {
    lat?: number;
    lng?: number;
    radius?: number;
    skills?: string[];
    status?: string;
    page?: number;
    limit?: number;
}
export interface TaskClaimResult {
    success: boolean;
    task?: ITaskDocument;
    message: string;
}
export interface TaskUpdateResult {
    success: boolean;
    task?: ITaskDocument;
    message: string;
}
export interface TaskCompletionData {
    notes?: string;
    photos?: string[];
}
export declare class TaskService {
    /**
     * Get available tasks near a location with skills filtering
     */
    static getAvailableTasks(contractorId: string, filters: TaskFilters): Promise<{
        tasks: ITaskDocument[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Get contractor's assigned tasks
     */
    static getContractorTasks(contractorId: string, filters: TaskFilters): Promise<{
        tasks: ITaskDocument[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Claim a task atomically
     */
    static claimTask(taskId: string, contractorId: string): Promise<TaskClaimResult>;
    /**
     * Update task status
     */
    static updateTaskStatus(taskId: string, contractorId: string, newStatus: string): Promise<TaskUpdateResult>;
    /**
     * Complete a task with photos and notes
     */
    static completeTask(taskId: string, contractorId: string, completionData: TaskCompletionData): Promise<TaskUpdateResult>;
    /**
     * Get task by ID (with contractor verification)
     */
    static getTaskById(taskId: string, contractorId?: string): Promise<{
        task: ITaskDocument | null;
        hasAccess: boolean;
        exists: boolean;
    }>;
    /**
     * Convert radius from miles to kilometers
     */
    static milesToKilometers(miles: number): number;
    /**
     * Convert radius from kilometers to meters
     */
    static kilometersToMeters(kilometers: number): number;
    /**
     * Debug method to get all tasks without any filtering
     */
    static getAllTasksDebug(): Promise<{
        tasks: ITaskDocument[];
        total: number;
        collectionName: string;
        dbName: string;
    }>;
}
export default TaskService;
//# sourceMappingURL=taskService.d.ts.map