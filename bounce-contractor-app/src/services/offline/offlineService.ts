import { Preferences } from "@capacitor/preferences";
import { Network } from "@capacitor/network";
import {
  QueuedRequest,
  ApiRequestConfig,
  SyncResult,
  ApiError,
  NetworkStatus,
} from "../../types/api.types";
import { apiClient } from "../api/apiClient";

export interface OfflineAction {
  id: string;
  type:
    | "task_claim"
    | "task_status_update"
    | "task_complete"
    | "profile_update"
    | "photo_upload"
    | "location_update";
  payload: any;
  timestamp: string;
  retryCount: number;
  priority: "low" | "medium" | "high";
  status: "pending" | "processing" | "failed" | "completed";
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  requiresAuth: boolean;
}

export interface OfflineData {
  tasks: any[];
  profile: any;
  lastSync: string;
  version: number;
}

class OfflineService {
  private static instance: OfflineService;
  private queue: OfflineAction[] = [];
  private isProcessing = false;
  private networkStatus: NetworkStatus = {
    isOnline: true,
    connectionType: "unknown",
    isSlowConnection: false,
  };
  private syncListeners: ((result: SyncResult) => void)[] = [];
  private networkListeners: ((status: NetworkStatus) => void)[] = [];

  private constructor() {
    this.initializeNetworkMonitoring();
    this.loadQueue();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      // Get initial network status
      const status = await Network.getStatus();
      this.updateNetworkStatus({
        isOnline: status.connected,
        connectionType: status.connectionType as any,
        isSlowConnection: status.connectionType === "cellular",
      });

      // Listen for network changes
      Network.addListener("networkStatusChange", (status) => {
        const newStatus: NetworkStatus = {
          isOnline: status.connected,
          connectionType: status.connectionType as any,
          isSlowConnection: status.connectionType === "cellular",
        };
        this.updateNetworkStatus(newStatus);
      });
    } catch (error) {
      console.warn("Network monitoring not available:", error);
      // Fallback to browser network detection
      this.initializeBrowserNetworkMonitoring();
    }
  }

  private initializeBrowserNetworkMonitoring(): void {
    const updateOnlineStatus = () => {
      this.updateNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: "unknown",
        isSlowConnection: false,
      });
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
  }

  private updateNetworkStatus(status: NetworkStatus): void {
    const wasOffline = !this.networkStatus.isOnline;
    this.networkStatus = status;

    // Notify listeners
    this.networkListeners.forEach((listener) => listener(status));

    // If we just came back online, process the queue
    if (wasOffline && status.isOnline) {
      console.log("Network restored, processing offline queue");
      this.processQueue();
    }

    // Update API client network status
    apiClient.setNetworkStatus(status);
  }

  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  public onNetworkChange(
    listener: (status: NetworkStatus) => void,
  ): () => void {
    this.networkListeners.push(listener);
    return () => {
      const index = this.networkListeners.indexOf(listener);
      if (index > -1) {
        this.networkListeners.splice(index, 1);
      }
    };
  }

  public onSync(listener: (result: SyncResult) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private async loadQueue(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: "offline_queue" });
      if (value) {
        this.queue = JSON.parse(value);
        console.log(`Loaded ${this.queue.length} items from offline queue`);
      }
    } catch (error) {
      console.error("Failed to load offline queue:", error);
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await Preferences.set({
        key: "offline_queue",
        value: JSON.stringify(this.queue),
      });
    } catch (error) {
      console.error("Failed to save offline queue:", error);
    }
  }

  public async queueAction(
    action: Omit<OfflineAction, "id" | "timestamp" | "retryCount" | "status">,
  ): Promise<string> {
    const queuedAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending",
    };

    this.queue.push(queuedAction);
    await this.saveQueue();

    console.log(`Queued action: ${action.type}`, queuedAction);

    // If online, try to process immediately
    if (this.networkStatus.isOnline) {
      this.processQueue();
    }

    return queuedAction.id;
  }

  public async processQueue(): Promise<SyncResult> {
    if (this.isProcessing || !this.networkStatus.isOnline) {
      return { successful: 0, failed: 0, total: 0, errors: [] };
    }

    this.isProcessing = true;
    const result: SyncResult = {
      successful: 0,
      failed: 0,
      total: this.queue.filter((action) => action.status === "pending").length,
      errors: [],
    };

    console.log(`Processing ${result.total} queued actions`);

    // Sort by priority and timestamp
    const pendingActions = this.queue
      .filter((action) => action.status === "pending")
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

    for (const action of pendingActions) {
      try {
        action.status = "processing";
        await this.executeAction(action);
        action.status = "completed";
        result.successful++;
        console.log(`Successfully processed action: ${action.type}`);
      } catch (error) {
        action.retryCount++;
        const apiError = error as ApiError;

        // Determine if we should retry
        if (this.shouldRetry(action, apiError)) {
          action.status = "pending";
          console.log(
            `Will retry action: ${action.type} (attempt ${action.retryCount})`,
          );
        } else {
          action.status = "failed";
          result.failed++;
          result.errors.push(apiError);
          console.error(`Failed to process action: ${action.type}`, error);
        }
      }
    }

    // Remove completed actions
    this.queue = this.queue.filter((action) => action.status !== "completed");
    await this.saveQueue();

    this.isProcessing = false;

    // Notify listeners
    this.syncListeners.forEach((listener) => listener(result));

    console.log(
      `Sync completed: ${result.successful} successful, ${result.failed} failed`,
    );
    return result;
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    const config: ApiRequestConfig = {
      method: action.method,
      url: action.endpoint,
      data: action.payload,
      requiresAuth: action.requiresAuth,
    };

    await apiClient.request(config);
  }

  private shouldRetry(action: OfflineAction, error: ApiError): boolean {
    // Don't retry if we've exceeded max attempts
    if (action.retryCount >= 3) {
      return false;
    }

    // Don't retry client errors (4xx) except for auth errors
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return error.statusCode === 401 || error.statusCode === 403;
    }

    // Retry server errors (5xx) and network errors
    return true;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getQueueStatus(): {
    pending: number;
    processing: number;
    failed: number;
    total: number;
  } {
    const pending = this.queue.filter((a) => a.status === "pending").length;
    const processing = this.queue.filter(
      (a) => a.status === "processing",
    ).length;
    const failed = this.queue.filter((a) => a.status === "failed").length;

    return {
      pending,
      processing,
      failed,
      total: this.queue.length,
    };
  }

  public async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  public async clearFailedActions(): Promise<void> {
    this.queue = this.queue.filter((action) => action.status !== "failed");
    await this.saveQueue();
  }

  public async retryFailedActions(): Promise<void> {
    this.queue.forEach((action) => {
      if (action.status === "failed") {
        action.status = "pending";
        action.retryCount = 0;
      }
    });
    await this.saveQueue();

    if (this.networkStatus.isOnline) {
      this.processQueue();
    }
  }

  // Cache management for offline data
  public async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    const cacheEntry = {
      data,
      timestamp: new Date().toISOString(),
      expiresAt: ttl ? new Date(Date.now() + ttl).toISOString() : undefined,
    };

    await Preferences.set({
      key: `cache_${key}`,
      value: JSON.stringify(cacheEntry),
    });
  }

  public async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key: `cache_${key}` });
      if (!value) return null;

      const cacheEntry = JSON.parse(value);

      // Check if expired
      if (cacheEntry.expiresAt && new Date() > new Date(cacheEntry.expiresAt)) {
        await this.clearCachedData(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error(`Failed to get cached data for key: ${key}`, error);
      return null;
    }
  }

  public async clearCachedData(key: string): Promise<void> {
    await Preferences.remove({ key: `cache_${key}` });
  }

  public async clearAllCache(): Promise<void> {
    try {
      const { keys } = await Preferences.keys();
      const cacheKeys = keys.filter((key) => key.startsWith("cache_"));

      for (const key of cacheKeys) {
        await Preferences.remove({ key });
      }
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();
