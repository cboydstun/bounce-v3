import express from "express";
import {
  authenticateInternalAPI,
  InternalAuthRequest,
} from "../middleware/internalAuth.js";
import { SocketHandlers } from "../websocket/socketHandlers.js";
import { NotificationService } from "../services/notificationService.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Global reference to socket handlers (will be set when server starts)
let socketHandlers: SocketHandlers | null = null;

/**
 * Transform MongoDB notification document to API response format
 */
function transformNotification(notification: any) {
  // Debug logging to trace ID transformation
  logger.info("🔍 Transforming notification:", {
    originalId: notification._id,
    originalIdType: typeof notification._id,
    hasId: !!notification._id,
    title: notification.title,
  });

  const transformed = {
    id: notification._id.toString(),
    contractorId: notification.contractorId.toString(),
    type: notification.type,
    priority: notification.priority,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    isRead: notification.read,
    isDelivered: notification.delivered,
    createdAt: notification.createdAt,
    deliveredAt: notification.deliveredAt,
    readAt: notification.readAt,
    expiresAt: notification.expiresAt,
  };

  logger.info("✅ Transformed notification:", {
    transformedId: transformed.id,
    transformedIdType: typeof transformed.id,
    title: transformed.title,
  });

  return transformed;
}

/**
 * Set socket handlers instance
 */
export function setSocketHandlers(handlers: SocketHandlers): void {
  socketHandlers = handlers;
}

/**
 * GET /api/notifications
 * Get notifications for a contractor
 */
router.get("/", async (req, res) => {
  try {
    const {
      contractorId,
      type,
      priority,
      read,
      delivered,
      page = 1,
      limit = 20,
    } = req.query;

    if (!contractorId) {
      res.status(400).json({
        success: false,
        message: "contractorId is required",
      });
      return;
    }

    const filters: any = {
      contractorId: contractorId as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    // Only add optional filters if they are provided and valid
    if (type && ["task", "system", "personal"].includes(type as string)) {
      filters.type = type as "task" | "system" | "personal";
    }
    if (
      priority &&
      ["critical", "high", "normal", "low"].includes(priority as string)
    ) {
      filters.priority = priority as "critical" | "high" | "normal" | "low";
    }
    if (read === "true") {
      filters.read = true;
    } else if (read === "false") {
      filters.read = false;
    }
    if (delivered === "true") {
      filters.delivered = true;
    } else if (delivered === "false") {
      filters.delivered = false;
    }

    const result = await NotificationService.getNotifications(filters);

    // Transform notifications to match mobile app expectations
    const transformedResult = {
      ...result,
      notifications: result.notifications.map(transformNotification),
    };

    res.json({
      success: true,
      data: transformedResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics for a contractor
 */
router.get("/stats", async (req, res) => {
  try {
    const { contractorId } = req.query;

    if (!contractorId) {
      res.status(400).json({
        success: false,
        message: "contractorId is required",
      });
      return;
    }

    const stats = await NotificationService.getNotificationStats(
      contractorId as string,
    );

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting notification stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notification stats",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const { contractorId } = req.body;

    if (!contractorId) {
      res.status(400).json({
        success: false,
        message: "contractorId is required",
      });
      return;
    }

    const success = await NotificationService.markAsRead(id, contractorId);

    if (success) {
      res.json({
        success: true,
        message: "Notification marked as read",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Notification not found or already read",
      });
    }
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * PUT /api/notifications/read-multiple
 * Mark multiple notifications as read
 */
router.put("/read-multiple", async (req, res) => {
  try {
    const { notificationIds, contractorId } = req.body;

    if (!contractorId || !notificationIds || !Array.isArray(notificationIds)) {
      res.status(400).json({
        success: false,
        message: "contractorId and notificationIds array are required",
      });
      return;
    }

    const modifiedCount = await NotificationService.markMultipleAsRead(
      notificationIds,
      contractorId,
    );

    res.json({
      success: true,
      message: `${modifiedCount} notifications marked as read`,
      modifiedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error marking multiple notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { contractorId } = req.body;

    if (!contractorId) {
      res.status(400).json({
        success: false,
        message: "contractorId is required",
      });
      return;
    }

    const success = await NotificationService.deleteNotification(
      id,
      contractorId,
    );

    if (success) {
      res.json({
        success: true,
        message: "Notification deleted",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
  } catch (error) {
    logger.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification (for testing/development)
 */
router.post("/", async (req, res) => {
  try {
    const {
      contractorId,
      type,
      priority,
      title,
      message,
      data,
      expiresInHours,
    } = req.body;

    if (!contractorId || !type || !title || !message) {
      res.status(400).json({
        success: false,
        message: "contractorId, type, title, and message are required",
      });
      return;
    }

    const notificationData = {
      contractorId,
      type,
      priority: priority || "normal",
      title,
      message,
      data,
      expiresInHours,
    };

    const notification =
      await NotificationService.createNotification(notificationData);

    // Broadcast the new notification via WebSocket if available
    if (socketHandlers) {
      try {
        await socketHandlers.broadcastSystemNotification(
          {
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            data: notification.data,
          },
          {
            targetContractor: contractorId,
          },
        );
      } catch (wsError) {
        logger.warn("Failed to broadcast notification via WebSocket:", wsError);
      }
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: "Notification created successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Transform CRM task data format to mobile app format
 */
function transformTaskDataForMobileApp(crmTaskData: any): any {
  // Map CRM priority to mobile app priority format
  const priorityMap: Record<string, string> = {
    High: "high",
    Medium: "medium",
    Low: "low",
  };

  // Map CRM task type to mobile app task type format
  const typeMap: Record<string, string> = {
    Delivery: "delivery_and_setup",
    Setup: "delivery_and_setup",
    Pickup: "pickup",
    Maintenance: "maintenance",
  };

  // Transform location from GeoJSON to mobile app format
  let transformedLocation;
  if (crmTaskData.location && crmTaskData.location.coordinates) {
    transformedLocation = {
      coordinates: {
        latitude: crmTaskData.location.coordinates[1], // GeoJSON is [lng, lat]
        longitude: crmTaskData.location.coordinates[0],
      },
      address: crmTaskData.address
        ? {
            formattedAddress: crmTaskData.address,
            street: crmTaskData.address.split(",")[0] || "",
            city: crmTaskData.address.split(",")[1]?.trim() || "",
            state: "TX", // Default for now
            zipCode: "",
            country: "US",
          }
        : undefined,
    };
  }

  // Create mobile app compatible task data
  const transformedData = {
    id: crmTaskData.id,
    orderId: crmTaskData.orderId,
    title: crmTaskData.title || `${crmTaskData.type} Task`,
    description: crmTaskData.description,
    type: typeMap[crmTaskData.type] || "delivery_and_setup",
    category: "bounce_house", // Default category
    priority: priorityMap[crmTaskData.priority] || "medium",
    status: "published", // Mobile app expects "published" for available tasks
    requiredSkills: [crmTaskData.type.toLowerCase()],
    estimatedDuration: 120, // Default 2 hours
    scheduledDate: crmTaskData.scheduledDateTime,
    scheduledTimeSlot: {
      startTime: crmTaskData.scheduledDateTime,
      endTime: new Date(
        new Date(crmTaskData.scheduledDateTime).getTime() + 2 * 60 * 60 * 1000,
      ).toISOString(),
      isFlexible: false,
    },
    location: transformedLocation,
    customer: {
      id: "crm-customer",
      firstName: "CRM",
      lastName: "Customer",
      email: "customer@example.com",
      phone: "555-0123",
      preferredContactMethod: "phone",
    },
    equipment: [],
    instructions: [],
    compensation: {
      baseAmount: crmTaskData.paymentAmount || 50,
      bonuses: [],
      totalAmount: crmTaskData.paymentAmount || 50,
      currency: "USD",
      paymentMethod: "direct_deposit",
      paymentSchedule: "weekly",
    },
    createdAt: crmTaskData.timestamp || new Date().toISOString(),
    updatedAt: crmTaskData.timestamp || new Date().toISOString(),
  };

  logger.info("🔄 Transformed CRM task data for mobile app:", {
    originalId: crmTaskData.id,
    originalType: crmTaskData.type,
    originalPriority: crmTaskData.priority,
    transformedType: transformedData.type,
    transformedPriority: transformedData.priority,
    transformedStatus: transformedData.status,
    hasLocation: !!transformedData.location,
    compensation: transformedData.compensation.totalAmount,
  });

  return transformedData;
}

/**
 * POST /api/notifications/broadcast
 * Broadcast WebSocket events from CRM
 */
router.post(
  "/broadcast",
  authenticateInternalAPI,
  async (req: InternalAuthRequest, res) => {
    try {
      const {
        eventType,
        taskData,
        notification,
        contractorIds,
        targetContractor,
        metadata,
      } = req.body;

      if (!socketHandlers) {
        logger.error("Socket handlers not initialized");
        res.status(500).json({
          success: false,
          message: "WebSocket service not available",
        });
        return;
      }

      logger.info("📡 Received broadcast request from CRM", {
        eventType,
        contractorIds: contractorIds?.length || 0,
        targetContractor,
        source: metadata?.source,
        originalTaskData: taskData
          ? {
              id: taskData.id,
              type: taskData.type,
              priority: taskData.priority,
            }
          : undefined,
      });

      switch (eventType) {
        case "task:new":
          if (!taskData) {
            res.status(400).json({
              success: false,
              message: "Task data required for task:new event",
            });
            return;
          }

          // Transform CRM data format to mobile app format
          const transformedTaskData = transformTaskDataForMobileApp(taskData);

          // Broadcast to all contractors with transformed data
          await socketHandlers.broadcastTaskEvent(
            "task:new",
            transformedTaskData,
            {
              // If contractorIds provided, broadcast to all but exclude none
              // Otherwise broadcast globally
            },
          );

          logger.info(
            `✅ Broadcasted task:new event for task ${taskData.id} to all contractors with mobile app format`,
          );
          break;

        case "task:assigned":
          if (!taskData || !targetContractor) {
            res.status(400).json({
              success: false,
              message:
                "Task data and target contractor required for task:assigned event",
            });
            return;
          }

          await socketHandlers.broadcastTaskEvent("task:assigned", taskData, {
            targetContractor,
          });

          logger.info(
            `Broadcasted task:assigned event for task ${taskData.id} to contractor ${targetContractor}`,
          );
          break;

        case "notification:system":
          if (!notification) {
            res.status(400).json({
              success: false,
              message:
                "Notification data required for notification:system event",
            });
            return;
          }

          await socketHandlers.broadcastSystemNotification(notification, {
            targetContractor,
          });

          logger.info(`Broadcasted system notification: ${notification.title}`);
          break;

        case "connection:test":
          // Test connection - just log and respond
          logger.info("WebSocket connection test from CRM");
          break;

        default:
          res.status(400).json({
            success: false,
            message: `Unknown event type: ${eventType}`,
          });
          return;
      }

      res.json({
        success: true,
        message: `Successfully broadcasted ${eventType} event`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error broadcasting WebSocket event:", error);
      res.status(500).json({
        success: false,
        message: "Failed to broadcast WebSocket event",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * POST /api/notifications/test
 * Test WebSocket connection from CRM
 */
router.post(
  "/test",
  authenticateInternalAPI,
  async (req: InternalAuthRequest, res) => {
    try {
      logger.info("WebSocket connection test from CRM", {
        body: req.body,
        timestamp: new Date().toISOString(),
      });

      // Check if socket handlers are available
      if (!socketHandlers) {
        res.status(500).json({
          success: false,
          message: "WebSocket service not available",
        });
        return;
      }

      // Get connection stats
      const stats = socketHandlers.getConnectionStats();

      res.json({
        success: true,
        message: "WebSocket service is available",
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error testing WebSocket connection:", error);
      res.status(500).json({
        success: false,
        message: "WebSocket connection test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * GET /api/notifications/status
 * Get WebSocket service status
 */
router.get(
  "/status",
  authenticateInternalAPI,
  async (req: InternalAuthRequest, res) => {
    try {
      if (!socketHandlers) {
        res.json({
          success: false,
          message: "WebSocket service not initialized",
          status: "unavailable",
        });
        return;
      }

      const stats = socketHandlers.getConnectionStats();

      res.json({
        success: true,
        message: "WebSocket service is running",
        status: "available",
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting WebSocket status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get WebSocket status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
