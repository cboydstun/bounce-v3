<<<<<<< HEAD
import { websocketService, ConnectionStatus } from "./websocketService";
import { AuthTokens } from "../../types/auth.types";
=======
import { websocketService, ConnectionStatus } from './websocketService';
import { AuthTokens } from '../../types/auth.types';
>>>>>>> 5772b46b8 (notifications)

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
<<<<<<< HEAD

=======
  
>>>>>>> 5772b46b8 (notifications)
  private status: ConnectionManagerStatus = {
    isInitialized: false,
    isConnecting: false,
    isConnected: false,
    connectionAttempts: 0,
  };

  private authTokens: AuthTokens | null = null;
<<<<<<< HEAD
  private statusListeners: Set<(status: ConnectionManagerStatus) => void> =
    new Set();
=======
  private statusListeners: Set<(status: ConnectionManagerStatus) => void> = new Set();
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
      "connection:status-changed",
      (event) => {
        this.handleConnectionStatusChange(event.payload);
      },
=======
      'connection:status-changed',
      (event) => {
        this.handleConnectionStatusChange(event.payload);
      }
>>>>>>> 5772b46b8 (notifications)
    );

    this.updateStatus({ isInitialized: true });
  }

  /**
   * Set authentication tokens and optionally connect
   */
<<<<<<< HEAD
  public async setAuthTokens(
    tokens: AuthTokens,
    autoConnect = true,
  ): Promise<void> {
=======
  public async setAuthTokens(tokens: AuthTokens, autoConnect = true): Promise<void> {
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
      throw new Error("Authentication tokens not set");
=======
      throw new Error('Authentication tokens not set');
>>>>>>> 5772b46b8 (notifications)
    }

    if (this.status.isConnecting || this.status.isConnected) {
      return;
    }

<<<<<<< HEAD
    this.updateStatus({
      isConnecting: true,
=======
    this.updateStatus({ 
      isConnecting: true, 
>>>>>>> 5772b46b8 (notifications)
      lastError: undefined,
      connectionAttempts: this.status.connectionAttempts + 1,
    });

    try {
      await websocketService.connect(this.authTokens);
    } catch (error) {
<<<<<<< HEAD
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      this.updateStatus({
        isConnecting: false,
=======
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.updateStatus({ 
        isConnecting: false, 
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
    this.updateStatus({
      isConnecting: false,
=======
    this.updateStatus({ 
      isConnecting: false, 
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
  public onStatusChange(
    listener: (status: ConnectionManagerStatus) => void,
  ): () => void {
    this.statusListeners.add(listener);

=======
  public onStatusChange(listener: (status: ConnectionManagerStatus) => void): () => void {
    this.statusListeners.add(listener);
    
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
  private handleConnectionStatusChange(
    connectionStatus: ConnectionStatus,
  ): void {
=======
  private handleConnectionStatusChange(connectionStatus: ConnectionStatus): void {
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD

    // Notify all listeners
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.status);
      } catch (error) {
        console.error("Error in connection status listener:", error);
=======
    
    // Notify all listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
>>>>>>> 5772b46b8 (notifications)
      }
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.disconnect();
    this.statusListeners.clear();
<<<<<<< HEAD

=======
    
>>>>>>> 5772b46b8 (notifications)
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
