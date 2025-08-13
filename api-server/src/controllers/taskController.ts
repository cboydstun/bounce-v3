import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import TaskService, {
  TaskFilters,
  TaskCompletionData,
} from "../services/taskService.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";

export class TaskController {
  /**
   * GET /api/tasks/available
   * Get available tasks with location and skills filtering
   */
  static async getAvailableTasks(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.contractor) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const contractorId = req.contractor.contractorId;

      // Parse query parameters
      const { lat, lng, radius, skills, page = "1", limit = "20" } = req.query;

      // Build filters object
      const filters: TaskFilters = {
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 50), // Max 50 items per page
      };

      // Parse location parameters
      if (lat && lng) {
        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lng as string);

        if (isNaN(latitude) || isNaN(longitude)) {
          return res.status(400).json({
            error: "Invalid latitude or longitude values",
          });
        }

        if (
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          return res.status(400).json({
            error:
              "Latitude must be between -90 and 90, longitude between -180 and 180",
          });
        }

        filters.lat = latitude;
        filters.lng = longitude;

        // Parse radius (optional, defaults to 50km in service)
        if (radius) {
          const radiusValue = parseFloat(radius as string);
          if (!isNaN(radiusValue) && radiusValue > 0) {
            filters.radius = radiusValue;
          }
        }
      }

      // Parse skills filter
      if (skills) {
        if (typeof skills === "string") {
          filters.skills = skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        } else if (Array.isArray(skills)) {
          filters.skills = skills
            .map((s) => String(s).trim())
            .filter((s) => s.length > 0);
        }
      }

      // Get available tasks
      const result = await TaskService.getAvailableTasks(contractorId, filters);

      // Transform tasks to include all fields expected by mobile app
      const transformedTasks = result.tasks.map((task) => {
        const taskObj = task.toObject();

        // Check if this is a route task and apply mobile transformation
        const isRouteTask = TaskService.isRouteTask(task);
        let routeTransformation = {};

        if (isRouteTask) {
          routeTransformation = TaskService.transformRouteTaskForMobile(task);
        }

        // Map CRM status to mobile app status
        const statusMap: Record<string, string> = {
          Pending: "published",
          Assigned: "assigned",
          "In Progress": "in_progress",
          Completed: "completed",
          Cancelled: "cancelled",
        };

        // Map CRM priority to mobile app priority
        const priorityMap: Record<string, string> = {
          High: "high",
          Medium: "medium",
          Low: "low",
        };

        // Extract coordinates from location if available
        let coordinates = {
          latitude: 29.4241, // Default San Antonio coords
          longitude: -98.4936,
        };

        if (taskObj.location && taskObj.location.coordinates) {
          coordinates = {
            longitude: taskObj.location.coordinates[0],
            latitude: taskObj.location.coordinates[1],
          };
        }

        // Base task transformation
        const baseTask = {
          id: taskObj._id.toString(),
          orderId: taskObj.orderId,
          title: taskObj.title || `${taskObj.type} Task`,
          description: taskObj.description,
          type: taskObj.type.toLowerCase().replace(" ", "_"), // "Delivery" -> "delivery"
          category: "bounce_house", // Default category
          priority: priorityMap[taskObj.priority] || "medium",
          status: statusMap[taskObj.status] || "published",
          requiredSkills: [], // Default empty array
          estimatedDuration: 120, // Default 2 hours in minutes
          scheduledDate: taskObj.scheduledDateTime,
          scheduledTimeSlot: {
            startTime: taskObj.scheduledDateTime,
            endTime: new Date(
              new Date(taskObj.scheduledDateTime).getTime() +
                2 * 60 * 60 * 1000,
            ).toISOString(), // +2 hours
            isFlexible: true,
          },
          location: {
            coordinates,
            address: {
              street: taskObj.address || "Address not specified",
              city: "San Antonio",
              state: "TX",
              zipCode: "78201",
              country: "USA",
              formattedAddress: taskObj.address || "San Antonio, TX",
            },
            contactOnArrival: true,
          },
          customer: {
            id: "customer-1",
            firstName: "Customer",
            lastName: "Name",
            email: "customer@example.com",
            phone: "(555) 123-4567",
            preferredContactMethod: "phone" as const,
          },
          equipment: [], // Default empty array
          instructions: [], // Default empty array
          compensation: {
            baseAmount: taskObj.paymentAmount || 50,
            bonuses: [],
            totalAmount: taskObj.paymentAmount || 50,
            currency: "USD",
            paymentMethod: "direct_deposit" as const,
            paymentSchedule: "weekly" as const,
          },
          contractor:
            taskObj.assignedContractors.length > 0
              ? {
                  contractorId: taskObj.assignedContractors[0],
                  contractor: {} as any, // Will be populated by mobile app if needed
                  assignedAt: taskObj.createdAt,
                }
              : undefined,
          createdAt: taskObj.createdAt,
          updatedAt: taskObj.updatedAt,
          completedAt: taskObj.completedAt,
        };

        // Apply route-specific transformations if this is a route task
        if (isRouteTask && routeTransformation) {
          return {
            ...baseTask,
            ...routeTransformation, // Override with mobile-friendly route data
          };
        }

        return baseTask;
      });

      return res.json({
        success: true,
        data: {
          tasks: transformedTasks,
          pagination: {
            page: result.page,
            limit: filters.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      logger.error("Error in getAvailableTasks:", error);
      return res.status(500).json({
        error: "Failed to retrieve available tasks",
      });
    }
  }

  /**
   * GET /api/tasks/my-tasks
   * Get contractor's assigned tasks
   */
  static async getMyTasks(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.contractor) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const contractorId = req.contractor.contractorId;

      const { status, page = "1", limit = "20" } = req.query;

      const filters: TaskFilters = {
        page: parseInt(page as string, 10),
        limit: Math.min(parseInt(limit as string, 10), 50),
      };

      if (status && typeof status === "string") {
        // Convert API underscore format to database space format
        const convertApiStatusToDbStatus = (apiStatus: string): string => {
          return apiStatus === "In_Progress" ? "In Progress" : apiStatus;
        };

        // Handle comma-separated statuses
        const requestedStatuses = status.split(",").map((s) => s.trim());

        // Convert API format to database format for service layer
        const dbStatuses = requestedStatuses.map(convertApiStatusToDbStatus);

        // Pass converted statuses to the service
        filters.status = dbStatuses;
      }

      const result = await TaskService.getContractorTasks(
        contractorId,
        filters,
      );

      // Transform tasks using the same logic as getAvailableTasks
      const transformedTasks = result.tasks.map((task) => {
        const taskObj = task.toObject();

        // Check if this is a route task and apply mobile transformation
        const isRouteTask = TaskService.isRouteTask(task);
        let routeTransformation = {};

        if (isRouteTask) {
          routeTransformation = TaskService.transformRouteTaskForMobile(task);
        }

        // Map CRM status to mobile app status
        const statusMap: Record<string, string> = {
          Pending: "published",
          Assigned: "assigned",
          "In Progress": "in_progress",
          Completed: "completed",
          Cancelled: "cancelled",
        };

        // Map CRM priority to mobile app priority
        const priorityMap: Record<string, string> = {
          High: "high",
          Medium: "medium",
          Low: "low",
        };

        // Extract coordinates from location if available
        let coordinates = {
          latitude: 29.4241, // Default San Antonio coords
          longitude: -98.4936,
        };

        if (taskObj.location && taskObj.location.coordinates) {
          coordinates = {
            longitude: taskObj.location.coordinates[0],
            latitude: taskObj.location.coordinates[1],
          };
        }

        // Base task transformation
        const baseTask = {
          id: taskObj._id.toString(),
          orderId: taskObj.orderId,
          title: taskObj.title || `${taskObj.type} Task`,
          description: taskObj.description,
          type: taskObj.type.toLowerCase().replace(" ", "_"),
          category: "bounce_house",
          priority: priorityMap[taskObj.priority] || "medium",
          status: statusMap[taskObj.status] || "assigned",
          requiredSkills: [],
          estimatedDuration: 120,
          scheduledDate: taskObj.scheduledDateTime,
          scheduledTimeSlot: {
            startTime: taskObj.scheduledDateTime,
            endTime: new Date(
              new Date(taskObj.scheduledDateTime).getTime() +
                2 * 60 * 60 * 1000,
            ).toISOString(),
            isFlexible: true,
          },
          location: {
            coordinates,
            address: {
              street: taskObj.address || "Address not specified",
              city: "San Antonio",
              state: "TX",
              zipCode: "78201",
              country: "USA",
              formattedAddress: taskObj.address || "San Antonio, TX",
            },
            contactOnArrival: true,
          },
          customer: {
            id: "customer-1",
            firstName: "Customer",
            lastName: "Name",
            email: "customer@example.com",
            phone: "(555) 123-4567",
            preferredContactMethod: "phone" as const,
          },
          equipment: [],
          instructions: [],
          compensation: {
            baseAmount: taskObj.paymentAmount || 50,
            bonuses: [],
            totalAmount: taskObj.paymentAmount || 50,
            currency: "USD",
            paymentMethod: "direct_deposit" as const,
            paymentSchedule: "weekly" as const,
          },
          contractor:
            taskObj.assignedContractors.length > 0
              ? {
                  contractorId: taskObj.assignedContractors[0],
                  contractor: {} as any,
                  assignedAt: taskObj.createdAt,
                }
              : undefined,
          createdAt: taskObj.createdAt,
          updatedAt: taskObj.updatedAt,
          completedAt: taskObj.completedAt,
        };

        // Apply route-specific transformations if this is a route task
        if (isRouteTask && routeTransformation) {
          return {
            ...baseTask,
            ...routeTransformation, // Override with mobile-friendly route data
          };
        }

        return baseTask;
      });

      return res.json({
        success: true,
        data: {
          tasks: transformedTasks,
          pagination: {
            page: result.page,
            limit: filters.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      logger.error("Error in getMyTasks:", error);
      return res.status(500).json({
        error: "Failed to retrieve your tasks",
      });
    }
  }

  /**
   * POST /api/tasks/:id/claim
   * Claim an available task
   */
  static async claimTask(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.contractor) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { id: taskId } = req.params;
      const contractorId = req.contractor.contractorId;

      // Validate task ID
      if (
        typeof taskId !== "string" ||
        !mongoose.Types.ObjectId.isValid(taskId)
      ) {
        return res.status(400).json({
          error: "Invalid task ID format",
        });
      }

      const result = await TaskService.claimTask(taskId, contractorId);

      if (result.success) {
        return res.json({
          success: true,
          data: result.task,
          message: result.message,
        });
      } else {
        // Determine appropriate status code based on error type
        let statusCode = 400;
        if (
          result.message.includes("not found") ||
          result.message.includes("not authorized")
        ) {
          statusCode = 404;
        } else if (result.message.includes("already assigned")) {
          statusCode = 409; // Conflict
        }

        return res.status(statusCode).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      logger.error("Error in claimTask:", error);
      return res.status(500).json({
        error: "Failed to claim task",
      });
    }
  }

  /**
   * PUT /api/tasks/:id/status
   * Update task status
   */
  static async updateTaskStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.contractor) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { id: taskId } = req.params;
      const { status } = req.body;
      const contractorId = req.contractor.contractorId;

      // Validate task ID
      if (
        typeof taskId !== "string" ||
        !mongoose.Types.ObjectId.isValid(taskId)
      ) {
        return res.status(400).json({
          error: "Invalid task ID format",
        });
      }

      // Validate status
      if (!status || typeof status !== "string") {
        return res.status(400).json({
          error: "Status is required and must be a string",
        });
      }

      // Convert API underscore format to database space format
      const convertApiStatusToDbStatus = (apiStatus: string): string => {
        return apiStatus === "In_Progress" ? "In Progress" : apiStatus;
      };

      const dbStatus = convertApiStatusToDbStatus(status);

      const result = await TaskService.updateTaskStatus(
        taskId,
        contractorId,
        dbStatus,
      );

      if (result.success) {
        return res.json({
          success: true,
          data: result.task,
          message: result.message,
        });
      } else {
        let statusCode = 400;
        if (result.message.includes("not found")) {
          statusCode = 404;
        } else if (result.message.includes("not assigned")) {
          statusCode = 403; // Forbidden - task exists but not authorized
        } else if (result.message.includes("Invalid status transition")) {
          statusCode = 422; // Unprocessable Entity
        }

        return res.status(statusCode).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      logger.error("Error in updateTaskStatus:", error);
      return res.status(500).json({
        error: "Failed to update task status",
      });
    }
  }

  /**
   * POST /api/tasks/:id/complete
   * Complete a task with optional photos and notes
   */
  static async completeTask(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.contractor) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { id: taskId } = req.params;
      const { notes, photos } = req.body;
      const contractorId = req.contractor.contractorId;

      // Validate task ID
      if (
        typeof taskId !== "string" ||
        !mongoose.Types.ObjectId.isValid(taskId)
      ) {
        return res.status(400).json({
          error: "Invalid task ID format",
        });
      }

      // Validate completion data
      const completionData: TaskCompletionData = {};

      if (notes) {
        if (typeof notes !== "string") {
          return res.status(400).json({
            error: "Notes must be a string",
          });
        }
        if (notes.length > 2000) {
          return res.status(400).json({
            error: "Notes cannot exceed 2000 characters",
          });
        }
        completionData.notes = notes;
      }

      if (photos) {
        if (!Array.isArray(photos)) {
          return res.status(400).json({
            error: "Photos must be an array of URLs",
          });
        }
        if (photos.length > 5) {
          return res.status(400).json({
            error: "Maximum 5 photos allowed",
          });
        }

        // Validate photo URLs
        const validPhotos = photos.filter(
          (photo) => typeof photo === "string" && photo.trim().length > 0,
        );

        if (validPhotos.length !== photos.length) {
          return res.status(400).json({
            error: "All photos must be valid URL strings",
          });
        }

        completionData.photos = validPhotos;
      }

      const result = await TaskService.completeTask(
        taskId,
        contractorId,
        completionData,
      );

      if (result.success) {
        return res.json({
          success: true,
          data: result.task,
          message: result.message,
        });
      } else {
        let statusCode = 400;
        if (result.message.includes("not found")) {
          statusCode = 404;
        } else if (result.message.includes("not assigned")) {
          statusCode = 403; // Forbidden - task exists but not authorized
        } else if (result.message.includes("must be in progress")) {
          statusCode = 400;
        }

        return res.status(statusCode).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      logger.error("Error in completeTask:", error);
      return res.status(500).json({
        error: "Failed to complete task",
      });
    }
  }

  /**
   * GET /api/tasks/:id
   * Get task details by ID
   */
  static async getTaskById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.contractor) {
        console.log(`❌ [getTaskById] No contractor in request`);
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }
      const { id: taskId } = req.params;
      const contractorId = req.contractor.contractorId;

      // Validate task ID
      if (
        typeof taskId !== "string" ||
        !mongoose.Types.ObjectId.isValid(taskId)
      ) {
        console.log(`❌ [getTaskById] Invalid task ID format: ${taskId}`);
        return res.status(400).json({
          success: false,
          error: "Invalid task ID format",
        });
      }

      console.log(`🔍 [getTaskById] Debug Info:`, {
        taskId,
        contractorId,
        requestHeaders: req.headers.authorization ? "Present" : "Missing",
        contractorData: {
          id: req.contractor.contractorId,
          email: req.contractor.email,
          name: req.contractor.name,
          isVerified: req.contractor.isVerified,
        },
      });

      const result = await TaskService.getTaskById(taskId, contractorId);

      console.log(`📊 [getTaskById] Access Check Result:`, {
        exists: result.exists,
        hasAccess: result.hasAccess,
        taskFound: !!result.task,
        taskId,
        contractorId,
      });

      if (!result.exists) {
        console.log(`❌ [getTaskById] Task not found: ${taskId}`);
        return res.status(404).json({
          success: false,
          error: "Task not found",
          message: "The requested task does not exist in the database",
        });
      }

      if (!result.hasAccess) {
        console.log(
          `🚫 [getTaskById] Access denied for contractor ${contractorId} to task ${taskId}`,
        );
        return res.status(403).json({
          success: false,
          error: "Access denied",
          message: "You do not have permission to view this task",
        });
      }

      if (!result.task) {
        console.log(
          `⚠️ [getTaskById] Task data unavailable for task ${taskId}`,
        );
        return res.status(500).json({
          success: false,
          error: "Task data unavailable",
          message: "Task exists but data could not be retrieved",
        });
      }

      // Transform the task to match mobile app format
      const taskObj = result.task.toObject();

      console.log(`✅ [getTaskById] Successfully retrieved task:`, {
        taskId: taskObj._id.toString(),
        status: taskObj.status,
        type: taskObj.type,
        title: taskObj.title,
      });

      // Check if this is a route task and apply mobile transformation
      const isRouteTask = TaskService.isRouteTask(result.task);
      let routeTransformation = {};

      if (isRouteTask) {
        routeTransformation = TaskService.transformRouteTaskForMobile(
          result.task,
        );
      }

      // Map CRM status to mobile app status
      const statusMap: Record<string, string> = {
        Pending: "published",
        Assigned: "assigned",
        "In Progress": "in_progress",
        Completed: "completed",
        Cancelled: "cancelled",
      };

      // Map CRM priority to mobile app priority
      const priorityMap: Record<string, string> = {
        High: "high",
        Medium: "medium",
        Low: "low",
      };

      // Extract coordinates from location if available
      let coordinates = {
        latitude: 29.4241, // Default San Antonio coords
        longitude: -98.4936,
      };

      if (taskObj.location && taskObj.location.coordinates) {
        coordinates = {
          longitude: taskObj.location.coordinates[0],
          latitude: taskObj.location.coordinates[1],
        };
      }

      // Base task transformation
      const baseTask = {
        id: taskObj._id.toString(),
        orderId: taskObj.orderId,
        title: taskObj.title || `${taskObj.type} Task`,
        description: taskObj.description,
        type: taskObj.type.toLowerCase().replace(" ", "_"),
        category: "bounce_house",
        priority: priorityMap[taskObj.priority] || "medium",
        status: statusMap[taskObj.status] || "published",
        requiredSkills: [],
        estimatedDuration: 120,
        scheduledDate: taskObj.scheduledDateTime,
        scheduledTimeSlot: {
          startTime: taskObj.scheduledDateTime,
          endTime: new Date(
            new Date(taskObj.scheduledDateTime).getTime() + 2 * 60 * 60 * 1000,
          ).toISOString(),
          isFlexible: true,
        },
        location: {
          coordinates,
          address: {
            street: taskObj.address || "Address not specified",
            city: "San Antonio",
            state: "TX",
            zipCode: "78201",
            country: "USA",
            formattedAddress: taskObj.address || "San Antonio, TX",
          },
          contactOnArrival: true,
        },
        customer: {
          id: "customer-1",
          firstName: "Customer",
          lastName: "Name",
          email: "customer@example.com",
          phone: "(555) 123-4567",
          preferredContactMethod: "phone" as const,
        },
        equipment: [],
        instructions: [],
        compensation: {
          baseAmount: taskObj.paymentAmount || 50,
          bonuses: [],
          totalAmount: taskObj.paymentAmount || 50,
          currency: "USD",
          paymentMethod: "direct_deposit" as const,
          paymentSchedule: "weekly" as const,
        },
        contractor:
          taskObj.assignedContractors.length > 0
            ? {
                contractorId: taskObj.assignedContractors[0],
                contractor: {} as any,
                assignedAt: taskObj.createdAt,
              }
            : undefined,
        createdAt: taskObj.createdAt,
        updatedAt: taskObj.updatedAt,
        completedAt: taskObj.completedAt,
      };

      // Apply route-specific transformations if this is a route task
      let transformedTask = baseTask;

      if (isRouteTask && routeTransformation) {
        transformedTask = {
          ...baseTask,
          // CRITICAL: Preserve original description for parsing
          description: taskObj.description,
          // Add mobile enhancements alongside original data
          ...routeTransformation,
        };
      }

      return res.json({
        success: true,
        data: transformedTask,
      });
    } catch (error) {
      logger.error("Error in getTaskById:", error);
      console.log(`💥 [getTaskById] Unexpected error:`, error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve task details",
      });
    }
  }
}

export default TaskController;
