import Task, { ITaskDocument } from "../models/Task.js";
import ContractorAuth from "../models/ContractorAuth.js";
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { RealtimeService } from "./realtimeService.js";

export interface TaskFilters {
  lat?: number;
  lng?: number;
  radius?: number; // in kilometers
  skills?: string[];
  status?: string | string[];
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

export class TaskService {
  /**
   * Get available tasks near a location with skills filtering
   */
  static async getAvailableTasks(
    contractorId: string,
    filters: TaskFilters,
  ): Promise<{
    tasks: ITaskDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      logger.info(
        `[DEBUG] getAvailableTasks called with contractorId: ${contractorId}`,
      );
      logger.info(`[DEBUG] Filters:`, filters);

      const {
        lat,
        lng,
        radius = 50, // Default 50km radius
        skills = [],
        page = 1,
        limit = 20,
      } = filters;

      // Get contractor skills for filtering
      const contractor = await ContractorAuth.findById(contractorId);
      const contractorSkills = contractor?.skills || [];
      logger.info(`[DEBUG] Contractor found:`, contractor ? "Yes" : "No");
      logger.info(`[DEBUG] Contractor skills:`, contractorSkills);

      // Location-based filtering if coordinates provided
      if (lat && lng) {
        const radiusInMeters = radius * 1000; // Convert km to meters

        // Use the Task model's geospatial method with skills filtering
        const tasks = await Task.findAvailableNearLocation(
          lat,
          lng,
          radiusInMeters,
          skills.length > 0 ? skills : contractorSkills,
          contractorId,
        );

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const paginatedTasks = tasks.slice(startIndex, startIndex + limit);

        return {
          tasks: paginatedTasks,
          total: tasks.length,
          page,
          totalPages: Math.ceil(tasks.length / limit),
        };
      }

      // Non-location based filtering
      let query: any = {
        status: "Pending",
        $and: [
          { assignedContractors: { $ne: contractorId } }, // Not assigned to this contractor
          { assignedContractors: { $size: 0 } }, // Not assigned to anyone
        ],
      };

      logger.info(`[DEBUG] Base query:`, JSON.stringify(query, null, 2));

      // Skills matching for non-location queries
      if (skills.length > 0) {
        // Match task types with provided skills (case-insensitive)
        const taskTypes = ["Delivery", "Setup", "Pickup", "Maintenance"];
        const matchingTypes: string[] = [];

        for (const taskType of taskTypes) {
          for (const skill of skills) {
            if (skill && typeof skill === "string") {
              const skillLower = skill.toLowerCase();
              const taskTypeLower = taskType.toLowerCase();
              if (
                taskTypeLower.includes(skillLower) ||
                skillLower.includes(taskTypeLower)
              ) {
                matchingTypes.push(taskType);
                break;
              }
            }
          }
        }

        if (matchingTypes.length > 0) {
          query.type = { $in: matchingTypes };
        } else {
          // No matching types found, return empty result
          return {
            tasks: [],
            total: 0,
            page,
            totalPages: 0,
          };
        }
      }

      logger.info(`[DEBUG] Final query:`, JSON.stringify(query, null, 2));

      const total = await Task.countDocuments(query);
      logger.info(`[DEBUG] Total tasks found:`, total);

      const tasks = await Task.find(query)
        .sort({ priority: -1, scheduledDateTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      logger.info(`[DEBUG] Tasks returned:`, tasks.length);
      logger.info(
        `[DEBUG] Task details:`,
        tasks.map((t) => ({
          id: t._id,
          status: t.status,
          type: t.type,
          assignedContractors: t.assignedContractors,
          description: t.description,
        })),
      );

      return {
        tasks,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("Error getting available tasks:", error);
      throw new Error("Failed to retrieve available tasks");
    }
  }

  /**
   * Get contractor's assigned tasks
   */
  static async getContractorTasks(
    contractorId: string,
    filters: TaskFilters,
  ): Promise<{
    tasks: ITaskDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { status, page = 1, limit = 20 } = filters;

      // Support both assignedContractors array and assignedTo field
      // Handle both ObjectId and string formats
      const query: any = {
        $or: [
          { assignedContractors: contractorId },
          { assignedTo: contractorId },
          // Also try ObjectId conversion in case of type mismatch
          ...(mongoose.Types.ObjectId.isValid(contractorId)
            ? [
                {
                  assignedContractors: new mongoose.Types.ObjectId(
                    contractorId,
                  ),
                },
                { assignedTo: new mongoose.Types.ObjectId(contractorId) },
              ]
            : []),
        ],
      };

      if (status) {
        if (Array.isArray(status)) {
          // Handle multiple statuses
          query.status = { $in: status };
        } else {
          // Handle single status
          query.status = status;
        }
      }

      const total = await Task.countDocuments(query);
      const tasks = await Task.find(query)
        .sort({ scheduledDateTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      return {
        tasks,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("Error getting contractor tasks:", error);
      throw new Error("Failed to retrieve contractor tasks");
    }
  }

  /**
   * Claim a task atomically
   */
  static async claimTask(
    taskId: string,
    contractorId: string,
  ): Promise<TaskClaimResult> {
    try {
      // Verify contractor exists and is active
      const contractor = await ContractorAuth.findById(contractorId);
      if (!contractor || !contractor.isActive || !contractor.isVerified) {
        return {
          success: false,
          message: "Contractor not found or not authorized",
        };
      }

      // Find the task first to check if it exists and is available
      const existingTask = await Task.findById(taskId);
      if (!existingTask) {
        return {
          success: false,
          message: "Task not found",
        };
      }

      if (existingTask.status !== "Pending") {
        return {
          success: false,
          message: "Task is already assigned or not available",
        };
      }

      if (existingTask.assignedContractors.includes(contractorId)) {
        return {
          success: false,
          message: "Task is already assigned to you",
        };
      }

      // Verify contractor has required skills if task has skill requirements
      // Make skills matching more flexible - allow contractors to claim tasks if they have any relevant skills
      if (contractor.skills && contractor.skills.length > 0) {
        const taskType = existingTask.type.toLowerCase();
        const hasMatchingSkill = contractor.skills.some((skill: string) => {
          const skillLower = skill.toLowerCase();
          // More flexible matching - allow partial matches and common skill variations
          return (
            skillLower.includes(taskType) ||
            taskType.includes(skillLower) ||
            // Allow "delivery" contractors to do "setup" and vice versa
            (taskType === "setup" &&
              (skillLower.includes("delivery") ||
                skillLower.includes("install"))) ||
            (taskType === "delivery" &&
              (skillLower.includes("setup") ||
                skillLower.includes("transport"))) ||
            // Allow "maintenance" contractors to do any task
            skillLower.includes("maintenance") ||
            // Allow "general" or "all" skills to match any task
            skillLower.includes("general") ||
            skillLower.includes("all") ||
            // Allow common skill variations
            (taskType === "pickup" && skillLower.includes("delivery")) ||
            (taskType === "delivery" && skillLower.includes("pickup"))
          );
        });

        if (!hasMatchingSkill) {
          logger.warn(
            `Contractor ${contractorId} with skills [${contractor.skills.join(", ")}] attempted to claim ${taskType} task ${taskId}`,
          );
          return {
            success: false,
            message: `You do not have the required skills for this ${existingTask.type} task. Your skills: [${contractor.skills.join(", ")}]`,
          };
        }
      } else {
        // If contractor has no skills defined, allow them to claim any task
        logger.info(
          `Contractor ${contractorId} has no skills defined, allowing task claim`,
        );
      }

      // Attempt to claim the task atomically
      const task = await Task.findOneAndUpdate(
        {
          _id: taskId,
          status: "Pending",
          assignedContractors: { $ne: contractorId },
        },
        {
          $push: { assignedContractors: contractorId },
          $set: {
            status: "Assigned",
            assignedTo: contractorId, // For backward compatibility with tests
          },
        },
        {
          new: true,
        },
      );

      if (!task) {
        return {
          success: false,
          message: "Task not available for claiming (may already be assigned)",
        };
      }

      logger.info(`Task ${taskId} claimed by contractor ${contractorId}`);

      // Broadcast real-time event for task claimed
      if (RealtimeService.isInitialized()) {
        await RealtimeService.broadcastTaskClaimed(task, contractorId);
      }

      return {
        success: true,
        task,
        message: "Task claimed successfully",
      };
    } catch (error) {
      logger.error("Error claiming task:", error);
      return {
        success: false,
        message: "Failed to claim task due to server error",
      };
    }
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(
    taskId: string,
    contractorId: string,
    newStatus: string,
  ): Promise<TaskUpdateResult> {
    try {
      // First, find the task to check if it exists
      const task = await Task.findById(taskId);

      if (!task) {
        return {
          success: false,
          message: "Task not found",
        };
      }

      // Check if contractor is assigned to this task (support both assignedTo and assignedContractors)
      const isAssigned =
        task.assignedContractors.includes(contractorId) ||
        task.assignedTo === contractorId;

      if (!isAssigned) {
        return {
          success: false,
          message: "Task not assigned to you",
        };
      }

      // Validate status transition
      const validStatuses = [
        "Assigned",
        "In Progress",
        "Completed",
        "Cancelled",
      ];
      if (!validStatuses.includes(newStatus)) {
        return {
          success: false,
          message: "Invalid status value",
        };
      }

      // Store previous status for real-time broadcasting
      const previousStatus = task.status;

      // Update the task status
      task.status = newStatus as any;
      const updatedTask = await task.save();

      logger.info(
        `Task ${taskId} status updated to ${newStatus} by contractor ${contractorId}`,
      );

      // Broadcast real-time event for status update
      if (RealtimeService.isInitialized()) {
        await RealtimeService.broadcastTaskStatusUpdate(
          updatedTask,
          previousStatus,
          contractorId,
        );
      }

      return {
        success: true,
        task: updatedTask,
        message: "Task status updated successfully",
      };
    } catch (error) {
      logger.error("Error updating task status:", error);

      if (
        error instanceof Error &&
        error.message.includes("Invalid status transition")
      ) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: "Failed to update task status",
      };
    }
  }

  /**
   * Complete a task with photos and notes
   */
  static async completeTask(
    taskId: string,
    contractorId: string,
    completionData: TaskCompletionData,
  ): Promise<TaskUpdateResult> {
    try {
      // First, find the task to check if it exists
      const task = await Task.findById(taskId);

      if (!task) {
        return {
          success: false,
          message: "Task not found",
        };
      }

      // Check if contractor is assigned to this task (support both assignedTo and assignedContractors)
      const isAssigned =
        task.assignedContractors.includes(contractorId) ||
        task.assignedTo === contractorId;

      if (!isAssigned) {
        return {
          success: false,
          message: "not assigned to you",
        };
      }

      // Verify task can be completed (only from In Progress status)
      if (task.status !== "In Progress") {
        return {
          success: false,
          message: "Task must be in progress to be completed",
        };
      }

      // Update task with completion data
      task.status = "Completed";
      task.completedAt = new Date();

      if (completionData.notes) {
        task.completionNotes = completionData.notes;
      }

      if (completionData.photos && completionData.photos.length > 0) {
        // Validate photo count (max 5 as per model validation)
        if (completionData.photos.length > 5) {
          return {
            success: false,
            message: "Maximum 5 photos allowed per task completion",
          };
        }
        task.completionPhotos = completionData.photos;
      }

      const updatedTask = await task.save();

      logger.info(`Task ${taskId} completed by contractor ${contractorId}`);

      // Broadcast real-time event for task completion
      if (RealtimeService.isInitialized()) {
        await RealtimeService.broadcastTaskCompleted(updatedTask, contractorId);
      }

      return {
        success: true,
        task: updatedTask,
        message: "Task completed successfully",
      };
    } catch (error) {
      logger.error("Error completing task:", error);
      return {
        success: false,
        message: "Failed to complete task",
      };
    }
  }

  /**
   * Get task by ID (with contractor verification)
   */
  static async getTaskById(
    taskId: string,
    contractorId?: string,
  ): Promise<{
    task: ITaskDocument | null;
    hasAccess: boolean;
    exists: boolean;
  }> {
    try {
      console.log(`🔍 [TaskService.getTaskById] Starting lookup:`, {
        taskId,
        contractorId,
        taskIdType: typeof taskId,
        contractorIdType: typeof contractorId,
      });

      // Validate taskId format
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        console.log(
          `❌ [TaskService.getTaskById] Invalid taskId format: ${taskId}`,
        );
        return {
          task: null,
          hasAccess: false,
          exists: false,
        };
      }

      // First, check if the task exists at all
      const task = await Task.findById(taskId);

      if (!task) {
        console.log(
          `❌ [TaskService.getTaskById] Task not found in database: ${taskId}`,
        );

        // Additional debugging - check if task exists with different query
        const taskCount = await Task.countDocuments({ _id: taskId });
        const allTasksCount = await Task.countDocuments({});
        console.log(`🔍 [TaskService.getTaskById] Database debug:`, {
          taskCount,
          allTasksCount,
          searchedId: taskId,
        });

        return {
          task: null,
          hasAccess: false,
          exists: false,
        };
      }

      console.log(`✅ [TaskService.getTaskById] Task found:`, {
        taskId: task._id?.toString(),
        status: task.status,
        assignedContractors: task.assignedContractors,
        assignedTo: task.assignedTo,
        type: task.type,
        title: task.title,
        address: task.address,
        paymentAmount: task.paymentAmount,
        hasLocation: !!task.location,
        locationCoords: task.location?.coordinates,
      });

      // If no contractor ID provided, return the task (admin access)
      if (!contractorId) {
        console.log(
          `🔓 [TaskService.getTaskById] Admin access granted (no contractor ID)`,
        );
        return {
          task,
          hasAccess: true,
          exists: true,
        };
      }

      // Verify contractor exists and is active
      const contractor = await ContractorAuth.findById(contractorId);
      if (!contractor) {
        console.log(
          `🚫 [TaskService.getTaskById] Contractor not found: ${contractorId}`,
        );
        return {
          task: null,
          hasAccess: false,
          exists: true,
        };
      }

      if (!contractor.isActive) {
        console.log(
          `🚫 [TaskService.getTaskById] Contractor not active: ${contractorId}`,
        );
        return {
          task: null,
          hasAccess: false,
          exists: true,
        };
      }

      if (!contractor.isVerified) {
        console.log(
          `🚫 [TaskService.getTaskById] Contractor not verified: ${contractorId}`,
        );
        return {
          task: null,
          hasAccess: false,
          exists: true,
        };
      }

      console.log(`✅ [TaskService.getTaskById] Contractor verified:`, {
        contractorId,
        email: contractor.email,
        name: contractor.name,
        isActive: contractor.isActive,
        isVerified: contractor.isVerified,
      });

      // Check if contractor has access to this task
      const isPending = task.status === "Pending";
      const inAssignedContractors =
        task.assignedContractors.includes(contractorId);
      const matchesAssignedTo = task.assignedTo === contractorId;

      // Try string comparison for assignedTo field
      const assignedToString = task.assignedTo
        ? task.assignedTo.toString()
        : null;
      const matchesAssignedToString = assignedToString === contractorId;

      // Try string comparison for assignedContractors array
      const assignedContractorsStrings = task.assignedContractors.map((id) =>
        id.toString(),
      );
      const inAssignedContractorsString =
        assignedContractorsStrings.includes(contractorId);

      console.log(`🔐 [TaskService.getTaskById] Access control check:`, {
        contractorId,
        taskStatus: task.status,
        isPending,
        inAssignedContractors,
        matchesAssignedTo,
        inAssignedContractorsString,
        matchesAssignedToString,
        assignedContractorsArray: task.assignedContractors,
        assignedContractorsStrings,
        assignedTo: task.assignedTo,
        assignedToString,
      });

      // CRITICAL FIX: For available (Pending) tasks, any authenticated contractor should have access
      // For assigned tasks, only the assigned contractor should have access
      const hasAccess =
        isPending || // Any authenticated contractor can view available tasks
        inAssignedContractors ||
        matchesAssignedTo ||
        inAssignedContractorsString ||
        matchesAssignedToString;

      console.log(`📋 [TaskService.getTaskById] Final access decision:`, {
        hasAccess,
        reason: hasAccess
          ? isPending
            ? "Task is available (Pending) - accessible to all contractors"
            : inAssignedContractors || inAssignedContractorsString
              ? "Contractor is in assignedContractors array"
              : "Contractor matches assignedTo field"
          : "No access criteria met - this should not happen for Pending tasks!",
      });

      // ADDITIONAL DEBUG: If this is a Pending task but access is denied, something is wrong
      if (isPending && !hasAccess) {
        console.error(
          `🚨 [TaskService.getTaskById] CRITICAL ERROR: Pending task denied access!`,
          {
            taskId,
            contractorId,
            taskStatus: task.status,
            isPending,
            contractorExists: !!contractor,
            contractorActive: contractor.isActive,
            contractorVerified: contractor.isVerified,
          },
        );
      }

      return {
        task: hasAccess ? task : null,
        hasAccess,
        exists: true,
      };
    } catch (error) {
      logger.error("Error getting task by ID:", error);
      console.log(`💥 [TaskService.getTaskById] Error:`, error);
      return {
        task: null,
        hasAccess: false,
        exists: false,
      };
    }
  }

  /**
   * Convert radius from miles to kilometers
   */
  static milesToKilometers(miles: number): number {
    return miles * 1.60934;
  }

  /**
   * Convert radius from kilometers to meters
   */
  static kilometersToMeters(kilometers: number): number {
    return kilometers * 1000;
  }

  /**
   * Debug method to get all tasks without any filtering
   */
  static async getAllTasksDebug(): Promise<{
    tasks: ITaskDocument[];
    total: number;
    collectionName: string;
    dbName: string;
  }> {
    try {
      logger.info(`[DEBUG] getAllTasksDebug called`);

      // Get database and collection info
      const dbName = Task.db.name;
      const collectionName = Task.collection.name;

      logger.info(`[DEBUG] Database name: ${dbName}`);
      logger.info(`[DEBUG] Collection name: ${collectionName}`);

      // Get all tasks without any filtering
      const tasks = await Task.find({}).exec();
      const total = await Task.countDocuments({});

      logger.info(`[DEBUG] Total tasks in database: ${total}`);
      logger.info(
        `[DEBUG] Tasks found:`,
        tasks.map((t) => ({
          id: t._id,
          status: t.status,
          type: t.type,
          assignedContractors: t.assignedContractors,
          description: t.description,
          createdAt: t.createdAt,
        })),
      );

      return {
        tasks,
        total,
        collectionName,
        dbName,
      };
    } catch (error) {
      logger.error("Error in getAllTasksDebug:", error);
      throw new Error("Failed to retrieve debug tasks");
    }
  }
  /**
   * Check if a task is a consolidated route task
   */
  static isRouteTask(task: ITaskDocument): boolean {
    // Check title patterns
    const titlePatterns = [
      /Delivery Route - Driver \d+ - \d+ Stops?/i,
      /Route - Driver \d+/i,
      /Multi-stop/i,
      /\d+ Stops?/i,
    ];

    const hasRouteTitle = titlePatterns.some(
      (pattern) => task.title && pattern.test(task.title),
    );

    // Check description for route metadata markers
    const hasRouteMetadata =
      task.description &&
      (task.description.includes("--- Route Metadata ---") ||
        task.description.includes("Route Session:") ||
        task.description.includes("Customers:") ||
        task.description.includes("Route Summary:"));

    // Check for multiple customer pattern
    const hasMultipleCustomers = task.description
      ? /\d+\.\s+.+\(BB-\d{4}-\d{4}\)/g.test(task.description)
      : false;

    return hasRouteTitle || hasRouteMetadata || hasMultipleCustomers;
  }

  /**
   * Parse route metadata from task description
   */
  static parseRouteMetadata(description: string): {
    routeSessionId?: string;
    totalStops?: number;
    totalDistance?: string;
    estimatedDuration?: string;
    driverNumber?: number;
    startTime?: string;
    endTime?: string;
    customers: Array<{
      name: string;
      orderNumber: string;
      stopNumber?: number;
    }>;
  } {
    const result: {
      routeSessionId?: string;
      totalStops?: number;
      totalDistance?: string;
      estimatedDuration?: string;
      driverNumber?: number;
      startTime?: string;
      endTime?: string;
      customers: Array<{
        name: string;
        orderNumber: string;
        stopNumber?: number;
      }>;
    } = {
      customers: [],
    };

    // Extract route session ID
    const sessionMatch = description.match(/Route Session:\s*([^\n\r]+)/i);
    if (sessionMatch && sessionMatch[1]) {
      result.routeSessionId = sessionMatch[1].trim();
    }

    // Extract stops count
    const stopsMatch = description.match(/Stops?:\s*(\d+)/i);
    if (stopsMatch && stopsMatch[1]) {
      result.totalStops = parseInt(stopsMatch[1], 10);
    }

    // Extract distance
    const distanceMatch = description.match(/Distance:\s*([0-9.]+\s*km)/i);
    if (distanceMatch && distanceMatch[1]) {
      result.totalDistance = distanceMatch[1];
    }

    // Extract duration
    const durationMatch = description.match(
      /Duration:\s*([0-9h\s]+[0-9m\s]*)/i,
    );
    if (durationMatch && durationMatch[1]) {
      result.estimatedDuration = durationMatch[1].trim();
    }

    // Extract driver number
    const driverMatch = description.match(/Driver\s+(\d+)/i);
    if (driverMatch && driverMatch[1]) {
      result.driverNumber = parseInt(driverMatch[1], 10);
    }

    // Extract start/end times
    const startTimeMatch = description.match(/Start Time:\s*([0-9:]+)/i);
    if (startTimeMatch && startTimeMatch[1]) {
      result.startTime = startTimeMatch[1];
    }

    const endTimeMatch = description.match(/End Time:\s*([0-9:]+)/i);
    if (endTimeMatch && endTimeMatch[1]) {
      result.endTime = endTimeMatch[1];
    }

    // Extract customers list
    const customerMatches = description.matchAll(
      /(\d+)\.\s*([^(]+)\s*\(([^)]+)\)/g,
    );
    for (const match of customerMatches) {
      if (match[1] && match[2] && match[3]) {
        const stopNumber = parseInt(match[1], 10);
        const customerName = match[2].trim();
        const orderNumber = match[3].trim();

        result.customers.push({
          stopNumber,
          name: customerName,
          orderNumber,
        });
      }
    }

    // If no numbered customers found, try alternative pattern
    if (result.customers.length === 0) {
      const altCustomerMatches = description.matchAll(
        /([^,\n]+)\s*\(([^)]+)\)/g,
      );
      for (const match of altCustomerMatches) {
        if (match[1] && match[2]) {
          const customerName = match[1].trim();
          const orderNumber = match[2].trim();

          // Only include if it looks like an order number
          if (/BB-\d{4}-\d{4}/.test(orderNumber)) {
            result.customers.push({
              name: customerName,
              orderNumber,
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * Transform a route task for mobile-friendly display
   * PRESERVES original description for parsing while adding mobile enhancements
   */
  static transformRouteTaskForMobile(task: ITaskDocument): any {
    const routeData = this.parseRouteMetadata(task.description);
    const customerCount = routeData.customers.length;

    // Create mobile-friendly title
    let mobileTitle = task.title || `${task.type} Task`;
    if (customerCount > 1) {
      mobileTitle = `Multi-Stop Route (${customerCount} customers)`;
    } else if (routeData.driverNumber) {
      mobileTitle = `Route - Driver ${routeData.driverNumber}`;
    }

    // Create concise mobile summary (NOT replacing description)
    let mobileSummary = task.description;
    if (customerCount > 1) {
      mobileSummary = `Delivery route covering ${customerCount} locations in San Antonio area`;

      if (routeData.totalDistance && routeData.estimatedDuration) {
        mobileSummary += ` • ${routeData.totalDistance} • ${routeData.estimatedDuration}`;
      }
    }

    // Create mobile-friendly instructions
    const instructions = [];
    if (customerCount > 1) {
      instructions.push(`Visit ${customerCount} customers in order`);
    }
    if (routeData.estimatedDuration) {
      instructions.push(`Total route: ~${routeData.estimatedDuration}`);
    }
    if (routeData.startTime && routeData.endTime) {
      instructions.push(
        `Schedule: ${routeData.startTime} - ${routeData.endTime}`,
      );
    }
    instructions.push("Return to depot after completion");

    // Create route-specific equipment list
    const equipment = [
      { name: "Route manifest", required: true },
      { name: "GPS device", required: true },
    ];

    if (customerCount > 2) {
      equipment.push({ name: "Customer contact list", required: true });
    }

    return {
      // CRITICAL: Keep original description intact for parsing
      // description: task.description, // DON'T override - let controller handle this

      // Add mobile-friendly fields alongside original data
      mobileTitle,
      mobileSummary,

      // Add route-specific data
      isRouteTask: true,
      routeDetails: {
        totalStops: routeData.totalStops || customerCount,
        estimatedDistance: routeData.totalDistance,
        estimatedDuration: routeData.estimatedDuration,
        driverNumber: routeData.driverNumber,
        routeSessionId: routeData.routeSessionId,
        startTime: routeData.startTime,
        endTime: routeData.endTime,
      },

      // Enhanced customer list for mobile
      customers: routeData.customers,

      // Mobile-optimized instructions
      instructions,

      // Route-specific equipment
      equipment,
    };
  }
}

export default TaskService;
