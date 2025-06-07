import mongoose, { Schema } from "mongoose";
import { logger } from "../utils/logger.js";
const NotificationSchema = new Schema({
  contractorId: {
    type: Schema.Types.ObjectId,
    ref: "ContractorAuth",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["task", "system", "personal"],
    required: true,
    index: true,
  },
  priority: {
    type: String,
    enum: ["critical", "high", "normal", "low"],
    required: true,
    default: "normal",
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  data: {
    type: Schema.Types.Mixed,
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  delivered: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  readAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
    index: { expireAfterSeconds: 0 },
  },
});
// Compound indexes for efficient queries
NotificationSchema.index({ contractorId: 1, createdAt: -1 });
NotificationSchema.index({ contractorId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ contractorId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ priority: 1, delivered: 1, createdAt: 1 });
const Notification = mongoose.model("Notification", NotificationSchema);
/**
 * Service for managing notifications with persistence and delivery tracking
 */
export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data) {
    try {
      const expiresAt = data.expiresInHours
        ? new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000)
        : undefined;
      const notification = new Notification({
        contractorId: new mongoose.Types.ObjectId(data.contractorId),
        type: data.type,
        priority: data.priority || "normal",
        title: data.title,
        message: data.message,
        data: data.data,
        expiresAt,
      });
      const savedNotification = await notification.save();
      logger.info(`Notification created:`, {
        id: savedNotification._id,
        contractorId: data.contractorId,
        type: data.type,
        priority: data.priority || "normal",
      });
      return savedNotification;
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }
  /**
   * Create multiple notifications for different contractors
   */
  static async createBulkNotifications(contractorIds, notificationData) {
    try {
      const notifications = contractorIds.map((contractorId) => ({
        contractorId: new mongoose.Types.ObjectId(contractorId),
        type: notificationData.type,
        priority: notificationData.priority || "normal",
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        expiresAt: notificationData.expiresInHours
          ? new Date(
              Date.now() + notificationData.expiresInHours * 60 * 60 * 1000,
            )
          : null,
      }));
      const savedNotifications = await Notification.insertMany(notifications);
      logger.info(`Bulk notifications created:`, {
        count: savedNotifications.length,
        contractorIds,
        type: notificationData.type,
        priority: notificationData.priority || "normal",
      });
      return savedNotifications;
    } catch (error) {
      logger.error("Error creating bulk notifications:", error);
      throw new Error("Failed to create bulk notifications");
    }
  }
  /**
   * Get notifications for a contractor
   */
  static async getNotifications(filters) {
    try {
      const {
        contractorId,
        type,
        priority,
        read,
        delivered,
        page = 1,
        limit = 20,
      } = filters;
      const query = {};
      if (contractorId) {
        query.contractorId = new mongoose.Types.ObjectId(contractorId);
      }
      if (type) {
        query.type = type;
      }
      if (priority) {
        query.priority = priority;
      }
      if (read !== undefined) {
        query.read = read;
      }
      if (delivered !== undefined) {
        query.delivered = delivered;
      }
      const total = await Notification.countDocuments(query);
      const notifications = await Notification.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("Error getting notifications:", error);
      throw new Error("Failed to retrieve notifications");
    }
  }
  /**
   * Mark notification as delivered
   */
  static async markAsDelivered(notificationId, contractorId) {
    try {
      const query = { _id: notificationId };
      if (contractorId) {
        query.contractorId = new mongoose.Types.ObjectId(contractorId);
      }
      const result = await Notification.updateOne(query, {
        $set: {
          delivered: true,
          deliveredAt: new Date(),
        },
      });
      if (result.modifiedCount > 0) {
        logger.info(`Notification marked as delivered: ${notificationId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error("Error marking notification as delivered:", error);
      return false;
    }
  }
  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, contractorId) {
    try {
      const result = await Notification.updateOne(
        {
          _id: notificationId,
          contractorId: new mongoose.Types.ObjectId(contractorId),
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
          },
        },
      );
      if (result.modifiedCount > 0) {
        logger.info(
          `Notification marked as read: ${notificationId} by contractor: ${contractorId}`,
        );
        return true;
      }
      return false;
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      return false;
    }
  }
  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(notificationIds, contractorId) {
    try {
      const result = await Notification.updateMany(
        {
          _id: {
            $in: notificationIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
          contractorId: new mongoose.Types.ObjectId(contractorId),
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
          },
        },
      );
      logger.info(
        `${result.modifiedCount} notifications marked as read by contractor: ${contractorId}`,
      );
      return result.modifiedCount;
    } catch (error) {
      logger.error("Error marking multiple notifications as read:", error);
      return 0;
    }
  }
  /**
   * Get undelivered notifications for offline contractors
   */
  static async getUndeliveredNotifications(contractorId) {
    try {
      const notifications = await Notification.find({
        contractorId: new mongoose.Types.ObjectId(contractorId),
        delivered: false,
      })
        .sort({ priority: -1, createdAt: -1 })
        .limit(50) // Limit to prevent overwhelming returning contractors
        .exec();
      logger.info(
        `Retrieved ${notifications.length} undelivered notifications for contractor: ${contractorId}`,
      );
      return notifications;
    } catch (error) {
      logger.error("Error getting undelivered notifications:", error);
      return [];
    }
  }
  /**
   * Get notification statistics for a contractor
   */
  static async getNotificationStats(contractorId) {
    try {
      const pipeline = [
        {
          $match: {
            contractorId: new mongoose.Types.ObjectId(contractorId),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [{ $eq: ["$read", false] }, 1, 0],
              },
            },
            undelivered: {
              $sum: {
                $cond: [{ $eq: ["$delivered", false] }, 1, 0],
              },
            },
            taskNotifications: {
              $sum: {
                $cond: [{ $eq: ["$type", "task"] }, 1, 0],
              },
            },
            systemNotifications: {
              $sum: {
                $cond: [{ $eq: ["$type", "system"] }, 1, 0],
              },
            },
            personalNotifications: {
              $sum: {
                $cond: [{ $eq: ["$type", "personal"] }, 1, 0],
              },
            },
            criticalNotifications: {
              $sum: {
                $cond: [{ $eq: ["$priority", "critical"] }, 1, 0],
              },
            },
            highNotifications: {
              $sum: {
                $cond: [{ $eq: ["$priority", "high"] }, 1, 0],
              },
            },
            normalNotifications: {
              $sum: {
                $cond: [{ $eq: ["$priority", "normal"] }, 1, 0],
              },
            },
            lowNotifications: {
              $sum: {
                $cond: [{ $eq: ["$priority", "low"] }, 1, 0],
              },
            },
          },
        },
      ];
      const result = await Notification.aggregate(pipeline);
      const stats = result[0] || {
        total: 0,
        unread: 0,
        undelivered: 0,
        taskNotifications: 0,
        systemNotifications: 0,
        personalNotifications: 0,
        criticalNotifications: 0,
        highNotifications: 0,
        normalNotifications: 0,
        lowNotifications: 0,
      };
      return {
        total: stats.total,
        unread: stats.unread,
        undelivered: stats.undelivered,
        byType: {
          task: stats.taskNotifications,
          system: stats.systemNotifications,
          personal: stats.personalNotifications,
        },
        byPriority: {
          critical: stats.criticalNotifications,
          high: stats.highNotifications,
          normal: stats.normalNotifications,
          low: stats.lowNotifications,
        },
      };
    } catch (error) {
      logger.error("Error getting notification stats:", error);
      return {
        total: 0,
        unread: 0,
        undelivered: 0,
        byType: { task: 0, system: 0, personal: 0 },
        byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
      };
    }
  }
  /**
   * Delete old notifications (cleanup)
   */
  static async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        read: true,
      });
      logger.info(
        `Cleaned up ${result.deletedCount} old notifications older than ${daysOld} days`,
      );
      return result.deletedCount;
    } catch (error) {
      logger.error("Error cleaning up old notifications:", error);
      return 0;
    }
  }
  /**
   * Delete notification
   */
  static async deleteNotification(notificationId, contractorId) {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        contractorId: new mongoose.Types.ObjectId(contractorId),
      });
      if (result.deletedCount > 0) {
        logger.info(
          `Notification deleted: ${notificationId} by contractor: ${contractorId}`,
        );
        return true;
      }
      return false;
    } catch (error) {
      logger.error("Error deleting notification:", error);
      return false;
    }
  }
}
export { Notification };
export default NotificationService;
//# sourceMappingURL=notificationService.js.map
