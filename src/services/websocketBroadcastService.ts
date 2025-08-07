import { API_CONFIG, validateApiConfig } from "@/config/api";

export interface TaskBroadcastData {
  taskId: string;
  orderId: string;
  type: "Delivery" | "Setup" | "Pickup" | "Maintenance";
  title?: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  scheduledDateTime: Date;
  address?: string;
  paymentAmount?: number;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface BroadcastResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Service to trigger WebSocket broadcasts via API server
 */
export class WebSocketBroadcastService {
  private static async makeRequest(
    endpoint: string,
    data: any,
    retryCount = 0,
  ): Promise<BroadcastResponse> {
    const config = validateApiConfig();
    if (!config.isValid) {
      console.error("Invalid API configuration:", config.errors);
      return {
        success: false,
        message: "Invalid API configuration",
        error: config.errors.join(", "),
      };
    }

    const url = `${API_CONFIG.API_SERVER_URL}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.REQUEST_TIMEOUT,
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_CONFIG.API_SERVER_SECRET}`,
          "X-Internal-API-Key": API_CONFIG.API_SERVER_SECRET,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || "Broadcast successful",
      };
    } catch (error) {
      console.error(
        `WebSocket broadcast failed (attempt ${retryCount + 1}):`,
        error,
      );

      // Retry logic
      if (retryCount < API_CONFIG.MAX_RETRIES) {
        console.log(
          `Retrying WebSocket broadcast in ${API_CONFIG.RETRY_DELAY}ms...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY),
        );
        return this.makeRequest(endpoint, data, retryCount + 1);
      }

      return {
        success: false,
        message: "Failed to broadcast WebSocket event",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Broadcast new task event to all contractors
   */
  static async broadcastNewTask(
    taskData: TaskBroadcastData,
    contractorIds: string[],
  ): Promise<BroadcastResponse> {
    console.log(
      `Broadcasting new task ${taskData.taskId} to ${contractorIds.length} contractors`,
    );

    const broadcastData = {
      eventType: "task:new",
      taskData: {
        id: taskData.taskId,
        orderId: taskData.orderId,
        type: taskData.type,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        scheduledDateTime: taskData.scheduledDateTime,
        address: taskData.address,
        paymentAmount: taskData.paymentAmount,
        location: taskData.location,
        status: "Pending",
        timestamp: new Date().toISOString(),
      },
      contractorIds,
      metadata: {
        source: "crm",
        timestamp: new Date().toISOString(),
      },
    };

    return this.makeRequest("/api/notifications/broadcast", broadcastData);
  }

  /**
   * Broadcast new task with BOTH WebSocket AND FCM push notifications
   * This ensures contractors get notified whether the app is open or closed
   */
  static async broadcastNewTaskWithPush(
    taskData: TaskBroadcastData,
    contractorIds: string[],
  ): Promise<BroadcastResponse> {
    console.log(
      `🚨 MISSION CRITICAL: Broadcasting new task ${taskData.taskId} with WebSocket + FCM push to ${contractorIds.length} contractors`,
    );

    try {
      // 1. Send WebSocket broadcast (for open apps - real-time audio alerts)
      console.log("📡 Sending WebSocket broadcast for real-time alerts...");
      const wsResult = await this.broadcastNewTask(taskData, contractorIds);

      // 2. Send FCM push notifications (for background apps - system notifications)
      console.log("📲 Sending FCM push notifications for background alerts...");
      const pushResult = await this.sendFCMPushNotification(
        taskData,
        contractorIds,
      );

      // Combine results
      const combinedSuccess = wsResult.success && pushResult.success;
      const combinedMessage = `WebSocket: ${wsResult.message} | FCM: ${pushResult.message}`;
      const combinedError = wsResult.error || pushResult.error;

      console.log(`✅ Combined broadcast result:`, {
        success: combinedSuccess,
        websocketSuccess: wsResult.success,
        fcmSuccess: pushResult.success,
        message: combinedMessage,
      });

      return {
        success: combinedSuccess,
        message: combinedMessage,
        error: combinedError,
      };
    } catch (error) {
      console.error("❌ Critical error in broadcastNewTaskWithPush:", error);
      return {
        success: false,
        message: "Failed to broadcast task notifications",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send FCM push notifications via API server
   * This handles background notifications when the app is closed
   */
  static async sendFCMPushNotification(
    taskData: TaskBroadcastData,
    contractorIds: string[],
  ): Promise<BroadcastResponse> {
    console.log(
      `📲 Sending FCM push notifications for task ${taskData.taskId} to ${contractorIds.length} contractors`,
    );

    // Map CRM priority to notification priority
    const priorityMap: Record<string, string> = {
      High: "high",
      Medium: "normal",
      Low: "low",
    };

    const pushData = {
      title: `🔥 New ${taskData.type} Task Available`,
      message: `${taskData.description}${taskData.paymentAmount ? ` - $${taskData.paymentAmount}` : ""}${taskData.address ? ` in ${taskData.address}` : ""}`,
      priority: priorityMap[taskData.priority] || "normal",
      data: {
        taskId: taskData.taskId,
        orderId: taskData.orderId,
        type: "new_task",
        taskType: taskData.type,
        priority: taskData.priority,
        paymentAmount: taskData.paymentAmount,
        address: taskData.address,
        scheduledDateTime: taskData.scheduledDateTime.toISOString(),
        // Add action buttons for the notification
        actions: JSON.stringify([
          { action: "view", title: "View Task" },
          { action: "dismiss", title: "Dismiss" },
        ]),
      },
      contractorIds,
      metadata: {
        source: "crm",
        timestamp: new Date().toISOString(),
        critical: true, // Mark as critical for background delivery
      },
    };

    return this.makeRequest(
      "/api/contractors/send-push-notification",
      pushData,
    );
  }

  /**
   * Broadcast task assigned event
   */
  static async broadcastTaskAssigned(
    taskData: TaskBroadcastData,
    contractorId: string,
  ): Promise<BroadcastResponse> {
    console.log(
      `Broadcasting task assigned ${taskData.taskId} to contractor ${contractorId}`,
    );

    const broadcastData = {
      eventType: "task:assigned",
      taskData: {
        id: taskData.taskId,
        orderId: taskData.orderId,
        type: taskData.type,
        description: taskData.description,
        status: "Assigned",
        timestamp: new Date().toISOString(),
      },
      targetContractor: contractorId,
      metadata: {
        source: "crm",
        timestamp: new Date().toISOString(),
      },
    };

    return this.makeRequest("/api/notifications/broadcast", broadcastData);
  }

  /**
   * Broadcast system notification
   */
  static async broadcastSystemNotification(
    notification: {
      title: string;
      message: string;
      priority: "critical" | "high" | "normal" | "low";
      data?: any;
    },
    options?: {
      targetContractor?: string;
      contractorIds?: string[];
    },
  ): Promise<BroadcastResponse> {
    console.log("Broadcasting system notification:", notification.title);

    const broadcastData = {
      eventType: "notification:system",
      notification,
      targetContractor: options?.targetContractor,
      contractorIds: options?.contractorIds,
      metadata: {
        source: "crm",
        timestamp: new Date().toISOString(),
      },
    };

    return this.makeRequest("/api/notifications/broadcast", broadcastData);
  }

  /**
   * Test WebSocket connection
   */
  static async testConnection(): Promise<BroadcastResponse> {
    console.log("Testing WebSocket broadcast connection...");

    const testData = {
      eventType: "connection:test",
      message: "Test connection from CRM",
      timestamp: new Date().toISOString(),
    };

    return this.makeRequest("/api/notifications/test", testData);
  }
}

export default WebSocketBroadcastService;
