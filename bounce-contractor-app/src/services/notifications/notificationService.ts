import { apiClient } from "../api/apiClient";
import {
  ApiNotification,
  ApiNotificationResponse,
  ApiNotificationStats,
} from "../../types/notification.types";

export interface NotificationFilters {
  type?: "task" | "system" | "personal";
  priority?: "critical" | "high" | "normal" | "low";
  read?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Service for managing notifications in the mobile app
 */
export class NotificationService {
  /**
   * Get notifications for the current contractor
   */
  static async getNotifications(
    filters: NotificationFilters = {},
  ): Promise<ApiNotificationResponse> {
    try {
      const params = new URLSearchParams();

      // Add contractorId - this should come from auth context
      // Using real contractor ID from database
      params.append("contractorId", "688542f642771ccb99090308"); // TODO: Get from auth context

      if (filters.type) params.append("type", filters.type);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.read !== undefined)
        params.append("read", filters.read.toString());
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await apiClient.get(
        `/notifications?${params.toString()}`,
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch notifications");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      console.log("🔍 NotificationService.markAsRead called with:", {
        notificationId,
        idType: typeof notificationId,
        url: `/notifications/${notificationId}/read`,
      });

      const response = await apiClient.put(
        `/notifications/${notificationId}/read`,
        {
          contractorId: "688542f642771ccb99090308", // TODO: Get from auth context
        },
      );

      console.log("✅ NotificationService.markAsRead response:", response);
      return response.success;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(notificationIds: string[]): Promise<number> {
    try {
      const response = await apiClient.put("/notifications/read-multiple", {
        notificationIds,
        contractorId: "688542f642771ccb99090308", // TODO: Get from auth context
      });

      if (response.success && response.data) {
        return response.data.modifiedCount || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error marking multiple notifications as read:", error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      // For DELETE requests with body, we need to use a different approach
      const response = await apiClient.request({
        method: "DELETE",
        url: `/notifications/${notificationId}`,
        data: {
          contractorId: "688542f642771ccb99090308", // TODO: Get from auth context
        },
      });
      return response.success;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(): Promise<ApiNotificationStats | null> {
    try {
      const params = new URLSearchParams();
      params.append("contractorId", "688542f642771ccb99090308"); // TODO: Get from auth context

      const response = await apiClient.get(
        `/notifications/stats?${params.toString()}`,
      );

      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      return null;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const stats = await this.getNotificationStats();
      return stats?.unread || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }
}

export default NotificationService;
