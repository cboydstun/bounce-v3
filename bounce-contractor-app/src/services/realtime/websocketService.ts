import { io, Socket } from "socket.io-client";
import { APP_CONFIG } from "../../config/app.config";
import { AuthTokens } from "../../types/auth.types";
import { audioService } from "../audio/audioService";
import { TaskPriority } from "../../types/task.types";
import {
  getSoundTypeFromPriority,
  getVibrationPatternFromPriority,
} from "../../hooks/audio/useAudioAlerts";

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  error?: string;
}

export interface WebSocketEventData {
  type: string;
  payload: any;
  timestamp: Date;
  id: string;
}

export type WebSocketEventHandler = (data: WebSocketEventData) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private authTokens: AuthTokens | null = null;
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
  };
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      url: APP_CONFIG.WEBSOCKET_URL,
      reconnectInterval: APP_CONFIG.WEBSOCKET_RECONNECT_INTERVAL,
      maxReconnectAttempts: APP_CONFIG.WEBSOCKET_MAX_RECONNECT_ATTEMPTS,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(authTokens: AuthTokens): Promise<void> {
    if (this.socket?.connected) {
      console.log("WebSocket already connected");
      return;
    }

    this.authTokens = authTokens;
    this.isManualDisconnect = false;
    this.updateConnectionStatus({ isConnecting: true, error: undefined });

    try {
      this.socket = io(this.config.url, {
        auth: {
          token: authTokens.accessToken,
        },
        transports: ["websocket", "polling"],
        timeout: 10000,
        reconnection: false, // We'll handle reconnection manually
      });

      this.setupEventListeners();

      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 10000);

        this.socket!.on("connect", () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket!.on("connect_error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      this.updateConnectionStatus({
        isConnecting: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.isManualDisconnect = true;
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.updateConnectionStatus({
      isConnected: false,
      isConnecting: false,
      lastDisconnectedAt: new Date(),
    });
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Subscribe to WebSocket events
   */
  public on(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Unsubscribe from WebSocket events
   */
  public off(eventType: string, handler?: WebSocketEventHandler): void {
    if (!handler) {
      this.eventHandlers.delete(eventType);
    } else {
      this.eventHandlers.get(eventType)?.delete(handler);
    }
  }

  /**
   * Emit event to server
   */
  public emit(eventType: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn("Cannot emit event: WebSocket not connected");
      return;
    }

    this.socket.emit(eventType, {
      ...data,
      timestamp: new Date().toISOString(),
      id: this.generateEventId(),
    });
  }

  /**
   * Update contractor location
   */
  public updateLocation(latitude: number, longitude: number): void {
    this.emit("contractor:location-update", {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Join contractor-specific room
   */
  public joinContractorRoom(contractorId: string): void {
    this.emit("contractor:join-room", { contractorId });
  }

  /**
   * Leave contractor-specific room
   */
  public leaveContractorRoom(contractorId: string): void {
    this.emit("contractor:leave-room", { contractorId });
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.updateConnectionStatus({
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastConnectedAt: new Date(),
        error: undefined,
      });
      this.startHeartbeat();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.updateConnectionStatus({
        isConnected: false,
        isConnecting: false,
        lastDisconnectedAt: new Date(),
      });
      this.clearHeartbeatTimer();

      // Only attempt reconnection if not manually disconnected
      if (!this.isManualDisconnect) {
        this.scheduleReconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.updateConnectionStatus({
        isConnecting: false,
        error: error.message,
      });
      this.scheduleReconnect();
    });

    // Heartbeat events
    this.socket.on("ping", () => {
      this.socket?.emit("pong");
    });

    this.socket.on("pong", () => {
      // Server acknowledged our ping
    });

    // Task events
    this.socket.on("task:new", (data) => {
      this.handleEvent("task:new", data);
    });

    this.socket.on("task:assigned", (data) => {
      this.handleEvent("task:assigned", data);
    });

    this.socket.on("task:updated", (data) => {
      this.handleEvent("task:updated", data);
    });

    this.socket.on("task:claimed", (data) => {
      this.handleEvent("task:claimed", data);
    });

    this.socket.on("task:completed", (data) => {
      this.handleEvent("task:completed", data);
    });

    this.socket.on("task:cancelled", (data) => {
      this.handleEvent("task:cancelled", data);
    });

    // Notification events
    this.socket.on("notification:new", (data) => {
      this.handleEvent("notification:new", data);
    });

    this.socket.on("notification:update", (data) => {
      this.handleEvent("notification:update", data);
    });

    this.socket.on("notification:system", (data) => {
      this.handleEvent("notification:system", data);
    });

    this.socket.on("notification:personal", (data) => {
      this.handleEvent("notification:personal", data);
    });

    // Connection confirmation
    this.socket.on("connection:established", (data) => {
      this.handleEvent("connection:established", data);
    });
  }

  /**
   * Handle incoming WebSocket events
   */
  private handleEvent(eventType: string, data: any): void {
    const eventData: WebSocketEventData = {
      type: eventType,
      payload: data,
      timestamp: new Date(),
      id: this.generateEventId(),
    };

    // Handle audio alerts for specific events
    this.handleAudioAlerts(eventType, data);

    // Notify all handlers for this event type
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(eventData);
        } catch (error) {
          console.error(
            `Error in WebSocket event handler for ${eventType}:`,
            error,
          );
        }
      });
    }

    // Also notify wildcard handlers
    const wildcardHandlers = this.eventHandlers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(eventData);
        } catch (error) {
          console.error("Error in WebSocket wildcard event handler:", error);
        }
      });
    }
  }

  /**
   * Handle audio alerts for WebSocket events
   */
  private async handleAudioAlerts(eventType: string, data: any): Promise<void> {
    try {
      switch (eventType) {
        case "task:new":
          await this.playNewTaskAlert(data);
          break;
        case "task:assigned":
          await this.playTaskAssignedAlert(data);
          break;
        case "task:completed":
          await this.playTaskCompletedAlert(data);
          break;
        case "notification:new":
          await this.playNewNotificationAlert(data);
          break;
        case "notification:system":
        case "notification:personal":
          await this.playNotificationAlert(data);
          break;
        default:
          // No audio alert for this event type
          break;
      }
    } catch (error) {
      console.error(`Failed to play audio alert for ${eventType}:`, error);
    }
  }

  /**
   * Play audio alert for new task
   */
  private async playNewTaskAlert(taskData: any): Promise<void> {
    if (!audioService.getStatus().isInitialized) {
      console.warn("Audio service not initialized, skipping new task alert");
      return;
    }

    const priority: TaskPriority = taskData.priority || "medium";
    const soundType = getSoundTypeFromPriority(priority);
    const vibrationPattern = getVibrationPatternFromPriority(priority);

    await audioService.playAlert({
      soundType,
      vibrationPattern,
      fadeIn: priority === "urgent",
      repeat: priority === "urgent" ? 2 : 1,
    });

    console.log(`Played new task alert for priority: ${priority}`);
  }

  /**
   * Play audio alert for task assigned
   */
  private async playTaskAssignedAlert(taskData: any): Promise<void> {
    if (!audioService.getStatus().isInitialized) {
      return;
    }

    await audioService.playAlert({
      soundType: "task_assigned",
      vibrationPattern: [300, 100, 300],
    });

    console.log("Played task assigned alert");
  }

  /**
   * Play audio alert for task completed
   */
  private async playTaskCompletedAlert(taskData: any): Promise<void> {
    if (!audioService.getStatus().isInitialized) {
      return;
    }

    await audioService.playAlert({
      soundType: "task_completed",
      vibrationPattern: [200],
    });

    console.log("Played task completed alert");
  }

  /**
   * Play audio alert for new notifications
   */
  private async playNewNotificationAlert(notificationData: any): Promise<void> {
    if (!audioService.getStatus().isInitialized) {
      console.log("🔊 Initializing audio service for new notification...");
      try {
        await audioService.initialize();
      } catch (error) {
        console.error("Failed to initialize audio service:", error);
        return;
      }
    }

    // Determine sound type based on notification type and priority
    let soundType = "notification_general";
    let vibrationPattern = [200, 100, 200];

    if (notificationData.type === "task") {
      // Task notifications get priority-based sounds
      const priority = notificationData.priority || "normal";
      const priorityMap: Record<string, string> = {
        low: "new_task_low",
        normal: "new_task_medium",
        high: "new_task_high",
        critical: "new_task_urgent",
      };
      soundType = priorityMap[priority] || "new_task_medium";

      // Priority-based vibration patterns
      const vibrationMap: Record<string, number[]> = {
        low: [200],
        normal: [200, 100, 200],
        high: [300, 100, 300, 100, 300],
        critical: [500, 100, 500, 100, 500, 100, 500],
      };
      vibrationPattern = vibrationMap[priority] || [200, 100, 200];
    }

    const isUrgent =
      notificationData.priority === "critical" ||
      notificationData.priority === "high";

    await audioService.playAlert({
      soundType: soundType as any,
      vibrationPattern,
      volume: isUrgent ? 1.0 : 0.8,
      fadeIn: isUrgent,
    });

    console.log(`🔊 Played new notification alert:`, {
      type: notificationData.type,
      priority: notificationData.priority,
      soundType,
      isUrgent,
    });
  }

  /**
   * Play audio alert for general notifications
   */
  private async playNotificationAlert(notificationData: any): Promise<void> {
    if (!audioService.getStatus().isInitialized) {
      return;
    }

    const isUrgent =
      notificationData.priority === "high" ||
      notificationData.priority === "urgent";

    await audioService.playAlert({
      soundType: isUrgent ? "alert_critical" : "notification_general",
      vibrationPattern: isUrgent ? [400, 100, 400, 100, 400] : [200],
    });

    console.log(`Played notification alert (urgent: ${isUrgent})`);
  }

  /**
   * Update connection status and notify listeners
   */
  private updateConnectionStatus(updates: Partial<ConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...updates };

    // Emit connection status change event
    this.handleEvent("connection:status-changed", this.connectionStatus);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.isManualDisconnect) return;
    if (
      this.connectionStatus.reconnectAttempts >=
      this.config.maxReconnectAttempts
    ) {
      console.error("Max reconnection attempts reached");
      this.updateConnectionStatus({
        error: "Max reconnection attempts reached",
      });
      return;
    }

    this.clearReconnectTimer();

    const delay =
      this.config.reconnectInterval *
      Math.pow(2, this.connectionStatus.reconnectAttempts);
    console.log(
      `Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts + 1})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnect();
    }, delay);
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    if (this.isManualDisconnect || !this.authTokens) return;

    this.updateConnectionStatus({
      reconnectAttempts: this.connectionStatus.reconnectAttempts + 1,
    });

    try {
      await this.connect(this.authTokens);
    } catch (error) {
      console.error("Reconnection attempt failed:", error);
      this.scheduleReconnect();
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.clearHeartbeatTimer();

    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping");
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clear heartbeat timer
   */
  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update authentication tokens
   */
  public updateAuthTokens(tokens: AuthTokens): void {
    this.authTokens = tokens;
    // If connected, update the socket auth
    if (this.socket?.connected) {
      this.socket.auth = {
        token: tokens.accessToken,
      };
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Export class for testing
export { WebSocketService };
