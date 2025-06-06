import mongoose, { Document } from "mongoose";
export interface INotification extends Document {
  contractorId: mongoose.Types.ObjectId;
  type: "task" | "system" | "personal";
  priority: "critical" | "high" | "normal" | "low";
  title: string;
  message: string;
  data?: any;
  read: boolean;
  delivered: boolean;
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
}
declare const Notification: mongoose.Model<
  INotification,
  {},
  {},
  {},
  mongoose.Document<unknown, {}, INotification, {}> &
    INotification &
    Required<{
      _id: unknown;
    }> & {
      __v: number;
    },
  any
>;
export interface CreateNotificationData {
  contractorId: string;
  type: "task" | "system" | "personal";
  priority?: "critical" | "high" | "normal" | "low";
  title: string;
  message: string;
  data?: any;
  expiresInHours?: number;
}
export interface NotificationFilters {
  contractorId?: string;
  type?: "task" | "system" | "personal";
  priority?: "critical" | "high" | "normal" | "low";
  read?: boolean;
  delivered?: boolean;
  page?: number;
  limit?: number;
}
export interface NotificationStats {
  total: number;
  unread: number;
  undelivered: number;
  byType: {
    task: number;
    system: number;
    personal: number;
  };
  byPriority: {
    critical: number;
    high: number;
    normal: number;
    low: number;
  };
}
/**
 * Service for managing notifications with persistence and delivery tracking
 */
export declare class NotificationService {
  /**
   * Create a new notification
   */
  static createNotification(
    data: CreateNotificationData,
  ): Promise<INotification>;
  /**
   * Create multiple notifications for different contractors
   */
  static createBulkNotifications(
    contractorIds: string[],
    notificationData: Omit<CreateNotificationData, "contractorId">,
  ): Promise<INotification[]>;
  /**
   * Get notifications for a contractor
   */
  static getNotifications(filters: NotificationFilters): Promise<{
    notifications: INotification[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  /**
   * Mark notification as delivered
   */
  static markAsDelivered(
    notificationId: string,
    contractorId?: string,
  ): Promise<boolean>;
  /**
   * Mark notification as read
   */
  static markAsRead(
    notificationId: string,
    contractorId: string,
  ): Promise<boolean>;
  /**
   * Mark multiple notifications as read
   */
  static markMultipleAsRead(
    notificationIds: string[],
    contractorId: string,
  ): Promise<number>;
  /**
   * Get undelivered notifications for offline contractors
   */
  static getUndeliveredNotifications(
    contractorId: string,
  ): Promise<INotification[]>;
  /**
   * Get notification statistics for a contractor
   */
  static getNotificationStats(contractorId: string): Promise<NotificationStats>;
  /**
   * Delete old notifications (cleanup)
   */
  static cleanupOldNotifications(daysOld?: number): Promise<number>;
  /**
   * Delete notification
   */
  static deleteNotification(
    notificationId: string,
    contractorId: string,
  ): Promise<boolean>;
}
export { Notification };
export default NotificationService;
//# sourceMappingURL=notificationService.d.ts.map
