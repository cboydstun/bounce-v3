import Notification, { INotification } from "@/models/Notification";
import mongoose from "mongoose";

export interface CreateNotificationData {
  contractorId: string;
  type: "task" | "system" | "personal";
  priority?: "critical" | "high" | "normal" | "low";
  title: string;
  message: string;
  data?: any;
  expiresInHours?: number;
}

export class NotificationService {
  /**
   * Create multiple notifications for different contractors
   */
  static async createBulkNotifications(
    contractorIds: string[],
    notificationData: Omit<CreateNotificationData, "contractorId">,
  ): Promise<INotification[]> {
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

      console.log(
        `Created ${savedNotifications.length} notifications for new task`,
      );
      return savedNotifications as INotification[];
    } catch (error) {
      console.error("Error creating bulk notifications:", error);
      throw new Error("Failed to create bulk notifications");
    }
  }

  /**
   * Create a single notification
   */
  static async createNotification(
    data: CreateNotificationData,
  ): Promise<INotification> {
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
      console.log(`Notification created: ${savedNotification._id}`);
      return savedNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }
}
