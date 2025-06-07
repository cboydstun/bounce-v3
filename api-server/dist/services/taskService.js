import Task from "../models/Task.js";
import ContractorAuth from "../models/ContractorAuth.js";
import { logger } from "../utils/logger.js";
import { RealtimeService } from "./realtimeService.js";
export class TaskService {
  /**
   * Get available tasks near a location with skills filtering
   */
  static async getAvailableTasks(contractorId, filters) {
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
      let query = {
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
        const matchingTypes = [];
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
  static async getContractorTasks(contractorId, filters) {
    try {
      const { status, page = 1, limit = 20 } = filters;
      // Support both assignedContractors array and assignedTo field
      const query = {
        $or: [
          { assignedContractors: contractorId },
          { assignedTo: contractorId },
        ],
      };
      if (status) {
        query.status = status;
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
  static async claimTask(taskId, contractorId) {
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
        const hasMatchingSkill = contractor.skills.some((skill) => {
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
  static async updateTaskStatus(taskId, contractorId, newStatus) {
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
      task.status = newStatus;
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
  static async completeTask(taskId, contractorId, completionData) {
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
  static async getTaskById(taskId, contractorId) {
    try {
      // First, check if the task exists at all
      const task = await Task.findById(taskId);
      if (!task) {
        return {
          task: null,
          hasAccess: false,
          exists: false,
        };
      }
      // If no contractor ID provided, return the task (admin access)
      if (!contractorId) {
        return {
          task,
          hasAccess: true,
          exists: true,
        };
      }
      // Check if contractor has access to this task
      const hasAccess =
        task.status === "Pending" || // Available tasks
        task.assignedContractors.includes(contractorId) || // Assigned tasks (array)
        task.assignedTo === contractorId; // Assigned tasks (single field)
      return {
        task: hasAccess ? task : null,
        hasAccess,
        exists: true,
      };
    } catch (error) {
      logger.error("Error getting task by ID:", error);
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
  static milesToKilometers(miles) {
    return miles * 1.60934;
  }
  /**
   * Convert radius from kilometers to meters
   */
  static kilometersToMeters(kilometers) {
    return kilometers * 1000;
  }
  /**
   * Debug method to get all tasks without any filtering
   */
  static async getAllTasksDebug() {
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
}
export default TaskService;
//# sourceMappingURL=taskService.js.map
