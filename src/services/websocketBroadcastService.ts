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
