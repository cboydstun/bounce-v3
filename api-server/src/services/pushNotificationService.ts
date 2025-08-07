import {
  getFirebaseMessaging,
  isFirebaseConfigured,
} from "../config/firebase.js";
import ContractorAuth from "../models/ContractorAuth.js";
import * as admin from "firebase-admin";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface TaskNotificationData {
  taskId: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  compensation: number;
  type: "new_task" | "task_assigned" | "task_completed" | "task_cancelled";
}

/**
 * Push Notification Service
 * Handles sending Firebase Cloud Messages to contractor devices
 */
export class PushNotificationService {
  private messaging: admin.messaging.Messaging | null = null;

  constructor() {
    console.log("🚀 Initializing Push Notification Service...");

    if (isFirebaseConfigured()) {
      console.log(
        "✅ Firebase configuration detected, attempting to initialize messaging...",
      );
      try {
        this.messaging = getFirebaseMessaging();
        console.log("✅ Push Notification Service initialized successfully");
        console.log("🔔 FCM messaging service is ready to send notifications");
      } catch (error: any) {
        console.error(
          "❌ CRITICAL: Failed to initialize Push Notification Service",
        );
        console.error("Error type:", error?.constructor?.name || "Unknown");
        console.error("Error message:", error?.message || "Unknown error");
        console.error("Error stack:", error?.stack || "No stack trace");
        console.error(
          "🔍 This error prevents FCM push notifications from working",
        );
        this.messaging = null;
      }
    } else {
      console.warn(
        "⚠️ Push Notification Service disabled - Firebase not configured",
      );
      console.warn(
        "🔍 Check FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID environment variables",
      );
      this.messaging = null;
    }

    console.log(
      `📊 Push Notification Service status: ${this.messaging ? "ACTIVE" : "DISABLED"}`,
    );
  }

  /**
   * Check if push notifications are available
   */
  public isAvailable(): boolean {
    return this.messaging !== null;
  }

  /**
   * Send push notification to specific device tokens
   */
  public async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ success: number; failure: number; invalidTokens: string[] }> {
    if (!this.messaging) {
      console.warn(
        "Push notifications not available - Firebase not configured",
      );
      return { success: 0, failure: tokens.length, invalidTokens: [] };
    }

    if (tokens.length === 0) {
      console.log("No device tokens to send notifications to");
      return { success: 0, failure: 0, invalidTokens: [] };
    }

    try {
      const notification: admin.messaging.Notification = {
        title: payload.title,
        body: payload.body,
      };

      if (payload.imageUrl) {
        notification.imageUrl = payload.imageUrl;
      }

      const message: admin.messaging.MulticastMessage = {
        tokens: tokens,
        notification,
        data: payload.data || {},
        android: {
          notification: {
            icon: "ic_notification",
            color: "#FF6B35", // Bounce brand color
            sound: "default",
            channelId: "task_notifications",
            priority: "high" as const,
            defaultSound: true,
            defaultVibrateTimings: true,
          },
          priority: "high" as const,
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
              alert: {
                title: payload.title,
                body: payload.body,
              },
              "content-available": 1,
            },
          },
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: "/favicon.png",
            badge: "/favicon.png",
            requireInteraction: true,
            actions: [
              {
                action: "view",
                title: "View Task",
              },
              {
                action: "claim",
                title: "Claim Task",
              },
            ],
          },
          fcmOptions: {
            link: payload.data?.taskId
              ? `${process.env.WEB_BASE_URL || "http://localhost:3000"}/task-details/${payload.data.taskId}`
              : process.env.WEB_BASE_URL || "http://localhost:3000",
          },
        },
      };

      console.log(`📤 Sending push notification to ${tokens.length} devices:`, {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });

      const response = await this.messaging.sendEachForMulticast(message);

      // Process results and identify invalid tokens
      const invalidTokens: string[] = [];
      let successCount = 0;
      let failureCount = 0;

      response.responses.forEach((result, index) => {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          const error = result.error;
          const token = tokens[index];

          // Check if token is invalid and should be removed
          if (
            error &&
            (error.code === "messaging/invalid-registration-token" ||
              error.code === "messaging/registration-token-not-registered")
          ) {
            if (token) {
              invalidTokens.push(token);
              console.log(
                `🗑️ Invalid token detected: ${token.substring(0, 20)}...`,
              );
            }
          } else {
            if (token) {
              console.error(
                `❌ Failed to send to token ${token.substring(0, 20)}...:`,
                error?.message || "Unknown error",
              );
            }
          }
        }
      });

      console.log(
        `✅ Push notification results: ${successCount} success, ${failureCount} failure, ${invalidTokens.length} invalid tokens`,
      );

      // Clean up invalid tokens from database
      if (invalidTokens.length > 0) {
        await this.removeInvalidTokens(invalidTokens);
      }

      return {
        success: successCount,
        failure: failureCount,
        invalidTokens,
      };
    } catch (error) {
      console.error("❌ Failed to send push notifications:", error);
      return { success: 0, failure: tokens.length, invalidTokens: [] };
    }
  }

  /**
   * Send push notification to all active contractors
   */
  public async sendToAllContractors(payload: PushNotificationPayload): Promise<{
    success: number;
    failure: number;
    totalContractors: number;
    totalTokens: number;
  }> {
    try {
      console.log("📢 Sending push notification to all contractors...");

      // Get all contractors with device tokens
      const contractors = await ContractorAuth.find({
        deviceTokens: { $exists: true, $not: { $size: 0 } },
        isActive: true,
      }).select("deviceTokens");

      if (contractors.length === 0) {
        console.log("No contractors with device tokens found");
        return { success: 0, failure: 0, totalContractors: 0, totalTokens: 0 };
      }

      // Collect all device tokens
      const allTokens: string[] = [];
      contractors.forEach((contractor) => {
        if (contractor.deviceTokens && contractor.deviceTokens.length > 0) {
          allTokens.push(...contractor.deviceTokens);
        }
      });

      console.log(
        `📱 Found ${contractors.length} contractors with ${allTokens.length} total device tokens`,
      );

      if (allTokens.length === 0) {
        return {
          success: 0,
          failure: 0,
          totalContractors: contractors.length,
          totalTokens: 0,
        };
      }

      // Send notifications in batches (Firebase has a limit of 500 tokens per request)
      const batchSize = 500;
      let totalSuccess = 0;
      let totalFailure = 0;

      for (let i = 0; i < allTokens.length; i += batchSize) {
        const batch = allTokens.slice(i, i + batchSize);
        const result = await this.sendToTokens(batch, payload);
        totalSuccess += result.success;
        totalFailure += result.failure;
      }

      console.log(
        `✅ Notification broadcast complete: ${totalSuccess} delivered, ${totalFailure} failed`,
      );

      return {
        success: totalSuccess,
        failure: totalFailure,
        totalContractors: contractors.length,
        totalTokens: allTokens.length,
      };
    } catch (error) {
      console.error(
        "❌ Failed to send notifications to all contractors:",
        error,
      );
      throw error;
    }
  }

  /**
   * Send new task notification to all contractors
   */
  public async sendNewTaskNotification(
    taskData: TaskNotificationData,
  ): Promise<void> {
    const priorityEmojis = {
      low: "📋",
      medium: "⚡",
      high: "🔥",
      urgent: "🚨",
    };

    const emoji = priorityEmojis[taskData.priority] || "📋";
    const priorityText =
      taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1);

    const payload: PushNotificationPayload = {
      title: `${emoji} New ${priorityText} Priority Task`,
      body: `${taskData.title} - $${taskData.compensation}`,
      data: {
        taskId: taskData.taskId,
        type: taskData.type,
        priority: taskData.priority,
        compensation: taskData.compensation.toString(),
      },
    };

    await this.sendToAllContractors(payload);
  }

  /**
   * Send task assigned notification to specific contractor
   */
  public async sendTaskAssignedNotification(
    contractorId: string,
    taskData: TaskNotificationData,
  ): Promise<void> {
    try {
      const contractor =
        await ContractorAuth.findById(contractorId).select("deviceTokens");

      if (
        !contractor ||
        !contractor.deviceTokens ||
        contractor.deviceTokens.length === 0
      ) {
        console.log(`No device tokens found for contractor ${contractorId}`);
        return;
      }

      const payload: PushNotificationPayload = {
        title: "✅ Task Assigned",
        body: `You have been assigned: ${taskData.title}`,
        data: {
          taskId: taskData.taskId,
          type: "task_assigned",
          priority: taskData.priority,
          compensation: taskData.compensation.toString(),
        },
      };

      await this.sendToTokens(contractor.deviceTokens, payload);
    } catch (error) {
      console.error("❌ Failed to send task assigned notification:", error);
    }
  }

  /**
   * Remove invalid tokens from all contractors
   */
  private async removeInvalidTokens(invalidTokens: string[]): Promise<void> {
    try {
      console.log(
        `🧹 Cleaning up ${invalidTokens.length} invalid device tokens...`,
      );

      await ContractorAuth.updateMany(
        { deviceTokens: { $in: invalidTokens } },
        { $pullAll: { deviceTokens: invalidTokens } },
      );

      console.log("✅ Invalid tokens removed from database");
    } catch (error) {
      console.error("❌ Failed to remove invalid tokens:", error);
    }
  }

  /**
   * Test push notification functionality
   */
  public async testNotification(): Promise<void> {
    const testPayload: PushNotificationPayload = {
      title: "🧪 Test Notification",
      body: "This is a test notification from the Bounce API server",
      data: {
        type: "test",
        timestamp: new Date().toISOString(),
      },
    };

    const result = await this.sendToAllContractors(testPayload);
    console.log("🧪 Test notification results:", result);
  }
}

// Create singleton instance
export const pushNotificationService = new PushNotificationService();
