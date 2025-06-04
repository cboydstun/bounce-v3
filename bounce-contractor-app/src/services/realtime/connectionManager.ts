import { websocketService, ConnectionStatus } from "./websocketService";
import { AuthTokens } from "../../types/auth.types";

export interface ConnectionManagerConfig {
  autoConnect: boolean;
  autoReconnect: boolean;
  connectionTimeout: number;
}

export interface ConnectionManagerStatus {
  isInitialized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  lastError?: string;
  connectionAttempts: number;
}

class ConnectionManager {
  private config: ConnectionManagerConfig = {
    autoConnect: true,
    autoReconnect: true,
    connectionTimeout: 10000,
  };
  private status: ConnectionManagerStatus = {
    isInitialized: false,
    isConnecting: false,
    isConnected: false,
    connectionAttempts: 0,
  };

  private authTokens: AuthTokens | null = null;
  private statusListeners: Set<(status: ConnectionManagerStatus) => void> =
    new Set();
  private connectionStatusUnsubscribe?: () => void;

  constructor(config?: Partial<ConnectionManagerConfig>) {
    this.config = { ...this.config, ...config };
    this.initialize();
  }

  /**
   * Initialize the connection manager
   */
  private initialize(): void {
    // Listen to WebSocket connection status changes
    this.connectionStatusUnsubscribe = websocketService.on(
      "connection:status-changed",
      (event) => {
        this.handleConnectionStatusChange(event.payload);
      },
    );

    this.updateStatus({ isInitialized: true });
  }

  /**
   * Set authentication tokens and optionally connect
   */
  public async setAuthTokens(
    tokens: AuthTokens,
    autoConnect = true,
  ): Promise<void> {
    this.authTokens = tokens;
    websocketService.updateAuthTokens(tokens);

    if (autoConnect && this.config.autoConnect) {
      await this.connect();
    }
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (!this.authTokens) {
      throw new Error("Authentication tokens not set");
    }

    if (this.status.isConnecting || this.status.isConnected) {
      return;
    }

    this.updateStatus({
      isConnecting: true,
      lastError: undefined,
      connectionAttempts: this.status.connectionAttempts + 1,
    });

    try {
      await websocketService.connect(this.authTokens);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      this.updateStatus({
        isConnecting: false,
        lastError: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    websocketService.disconnect();
    this.updateStatus({
      isConnecting: false,
      isConnected: false,
    });
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return websocketService.isConnected();
  }

  /**
   * Get current status
   */
  public getStatus(): ConnectionManagerStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to status changes
   */
  public onStatusChange(
    listener: (status: ConnectionManagerStatus) => void,
  ): () => void {
    this.statusListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Update contractor location
   */
  public updateLocation(latitude: number, longitude: number): void {
    if (this.isConnected()) {
      websocketService.updateLocation(latitude, longitude);
    }
  }

  /**
   * Join contractor room for targeted notifications
   */
  public joinContractorRoom(contractorId: string): void {
    if (this.isConnected()) {
      websocketService.joinContractorRoom(contractorId);
    }
  }

  /**
   * Leave contractor room
   */
  public leaveContractorRoom(contractorId: string): void {
    if (this.isConnected()) {
      websocketService.leaveContractorRoom(contractorId);
    }
  }

  /**
   * Handle WebSocket connection status changes
   */
  private handleConnectionStatusChange(
    connectionStatus: ConnectionStatus,
  ): void {
    this.updateStatus({
      isConnecting: connectionStatus.isConnecting,
      isConnected: connectionStatus.isConnected,
      lastError: connectionStatus.error,
    });
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(updates: Partial<ConnectionManagerStatus>): void {
    this.status = { ...this.status, ...updates };

    // Notify all listeners
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.status);
      } catch (error) {
        console.error("Error in connection status listener:", error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.disconnect();
    this.statusListeners.clear();
    if (this.connectionStatusUnsubscribe) {
      this.connectionStatusUnsubscribe();
    }
  }

  /**
   * Get WebSocket service for direct access
   */
  public getWebSocketService() {
    return websocketService;
  }
}

// Create singleton instance
export const connectionManager = new ConnectionManager();

// Export class for testing
export { ConnectionManager };
