<<<<<<< HEAD
import { io, Socket } from "socket.io-client";
import { APP_CONFIG } from "../../config/app.config";
import { AuthTokens } from "../../types/auth.types";
=======
import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '../../config/app.config';
import { AuthTokens } from '../../types/auth.types';
>>>>>>> 5772b46b8 (notifications)

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
<<<<<<< HEAD
      console.log("WebSocket already connected");
=======
      console.log('WebSocket already connected');
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
        transports: ["websocket", "polling"],
=======
        transports: ['websocket', 'polling'],
>>>>>>> 5772b46b8 (notifications)
        timeout: 10000,
        reconnection: false, // We'll handle reconnection manually
      });

      this.setupEventListeners();
<<<<<<< HEAD

      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 10000);

        this.socket!.on("connect", () => {
=======
      
      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket!.on('connect', () => {
>>>>>>> 5772b46b8 (notifications)
          clearTimeout(timeout);
          resolve();
        });

<<<<<<< HEAD
        this.socket!.on("connect_error", (error) => {
=======
        this.socket!.on('connect_error', (error) => {
>>>>>>> 5772b46b8 (notifications)
          clearTimeout(timeout);
          reject(error);
        });
      });
<<<<<<< HEAD
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      this.updateConnectionStatus({
        isConnecting: false,
        error: error instanceof Error ? error.message : "Connection failed",
=======

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.updateConnectionStatus({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD

=======
    
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
      console.warn("Cannot emit event: WebSocket not connected");
=======
      console.warn('Cannot emit event: WebSocket not connected');
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
    this.emit("contractor:location-update", {
      location: {
        type: "Point",
=======
    this.emit('contractor:location-update', {
      location: {
        type: 'Point',
>>>>>>> 5772b46b8 (notifications)
        coordinates: [longitude, latitude],
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Join contractor-specific room
   */
  public joinContractorRoom(contractorId: string): void {
<<<<<<< HEAD
    this.emit("contractor:join-room", { contractorId });
=======
    this.emit('contractor:join-room', { contractorId });
>>>>>>> 5772b46b8 (notifications)
  }

  /**
   * Leave contractor-specific room
   */
  public leaveContractorRoom(contractorId: string): void {
<<<<<<< HEAD
    this.emit("contractor:leave-room", { contractorId });
=======
    this.emit('contractor:leave-room', { contractorId });
>>>>>>> 5772b46b8 (notifications)
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
<<<<<<< HEAD
    this.socket.on("connect", () => {
      console.log("WebSocket connected");
=======
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
>>>>>>> 5772b46b8 (notifications)
      this.updateConnectionStatus({
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastConnectedAt: new Date(),
        error: undefined,
      });
      this.startHeartbeat();
    });

<<<<<<< HEAD
    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
=======
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
>>>>>>> 5772b46b8 (notifications)
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

<<<<<<< HEAD
    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
=======
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
>>>>>>> 5772b46b8 (notifications)
      this.updateConnectionStatus({
        isConnecting: false,
        error: error.message,
      });
      this.scheduleReconnect();
    });

    // Heartbeat events
<<<<<<< HEAD
    this.socket.on("ping", () => {
      this.socket?.emit("pong");
    });

    this.socket.on("pong", () => {
=======
    this.socket.on('ping', () => {
      this.socket?.emit('pong');
    });

    this.socket.on('pong', () => {
>>>>>>> 5772b46b8 (notifications)
      // Server acknowledged our ping
    });

    // Task events
<<<<<<< HEAD
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
    this.socket.on("notification:system", (data) => {
      this.handleEvent("notification:system", data);
    });

    this.socket.on("notification:personal", (data) => {
      this.handleEvent("notification:personal", data);
    });

    // Connection confirmation
    this.socket.on("connection:established", (data) => {
      this.handleEvent("connection:established", data);
=======
    this.socket.on('task:new', (data) => {
      this.handleEvent('task:new', data);
    });

    this.socket.on('task:assigned', (data) => {
      this.handleEvent('task:assigned', data);
    });

    this.socket.on('task:updated', (data) => {
      this.handleEvent('task:updated', data);
    });

    this.socket.on('task:claimed', (data) => {
      this.handleEvent('task:claimed', data);
    });

    this.socket.on('task:completed', (data) => {
      this.handleEvent('task:completed', data);
    });

    this.socket.on('task:cancelled', (data) => {
      this.handleEvent('task:cancelled', data);
    });

    // Notification events
    this.socket.on('notification:system', (data) => {
      this.handleEvent('notification:system', data);
    });

    this.socket.on('notification:personal', (data) => {
      this.handleEvent('notification:personal', data);
    });

    // Connection confirmation
    this.socket.on('connection:established', (data) => {
      this.handleEvent('connection:established', data);
>>>>>>> 5772b46b8 (notifications)
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

    // Notify all handlers for this event type
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
<<<<<<< HEAD
      handlers.forEach((handler) => {
        try {
          handler(eventData);
        } catch (error) {
          console.error(
            `Error in WebSocket event handler for ${eventType}:`,
            error,
          );
=======
      handlers.forEach(handler => {
        try {
          handler(eventData);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${eventType}:`, error);
>>>>>>> 5772b46b8 (notifications)
        }
      });
    }

    // Also notify wildcard handlers
<<<<<<< HEAD
    const wildcardHandlers = this.eventHandlers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(eventData);
        } catch (error) {
          console.error("Error in WebSocket wildcard event handler:", error);
=======
    const wildcardHandlers = this.eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(eventData);
        } catch (error) {
          console.error('Error in WebSocket wildcard event handler:', error);
>>>>>>> 5772b46b8 (notifications)
        }
      });
    }
  }

  /**
   * Update connection status and notify listeners
   */
  private updateConnectionStatus(updates: Partial<ConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...updates };
<<<<<<< HEAD

    // Emit connection status change event
    this.handleEvent("connection:status-changed", this.connectionStatus);
=======
    
    // Emit connection status change event
    this.handleEvent('connection:status-changed', this.connectionStatus);
>>>>>>> 5772b46b8 (notifications)
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.isManualDisconnect) return;
<<<<<<< HEAD
    if (
      this.connectionStatus.reconnectAttempts >=
      this.config.maxReconnectAttempts
    ) {
      console.error("Max reconnection attempts reached");
      this.updateConnectionStatus({
        error: "Max reconnection attempts reached",
=======
    if (this.connectionStatus.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateConnectionStatus({
        error: 'Max reconnection attempts reached',
>>>>>>> 5772b46b8 (notifications)
      });
      return;
    }

    this.clearReconnectTimer();
<<<<<<< HEAD

    const delay =
      this.config.reconnectInterval *
      Math.pow(2, this.connectionStatus.reconnectAttempts);
    console.log(
      `Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts + 1})`,
    );
=======
    
    const delay = this.config.reconnectInterval * Math.pow(2, this.connectionStatus.reconnectAttempts);
    console.log(`Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts + 1})`);
>>>>>>> 5772b46b8 (notifications)

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
<<<<<<< HEAD
      console.error("Reconnection attempt failed:", error);
=======
      console.error('Reconnection attempt failed:', error);
>>>>>>> 5772b46b8 (notifications)
      this.scheduleReconnect();
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.clearHeartbeatTimer();
<<<<<<< HEAD

    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping");
=======
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD

=======
    
>>>>>>> 5772b46b8 (notifications)
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
