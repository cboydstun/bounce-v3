import { offlineService, OfflineAction } from "./offlineService";
import { apiClient } from "../api/apiClient";
import { SyncResult, ApiError } from "../../types/api.types";

export interface ConflictResolution {
  strategy: "client_wins" | "server_wins" | "merge" | "manual";
  resolvedData?: any;
}

export interface SyncConflict {
  id: string;
  type: "data_conflict" | "version_conflict" | "concurrent_modification";
  localData: any;
  serverData: any;
  timestamp: string;
  action: OfflineAction;
}

export interface SyncOptions {
  batchSize?: number;
  maxRetries?: number;
  conflictResolution?: "auto" | "manual";
  priorityFilter?: ("low" | "medium" | "high")[];
}

class SyncQueue {
  private static instance: SyncQueue;
  private conflicts: SyncConflict[] = [];
  private conflictListeners: ((conflicts: SyncConflict[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): SyncQueue {
    if (!SyncQueue.instance) {
      SyncQueue.instance = new SyncQueue();
    }
    return SyncQueue.instance;
  }

  public async syncWithConflictResolution(
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    const {
      batchSize = 10,
      maxRetries = 3,
      conflictResolution = "auto",
      priorityFilter,
    } = options;

    const queueStatus = offlineService.getQueueStatus();
    if (queueStatus.pending === 0) {
      return { successful: 0, failed: 0, total: 0, errors: [] };
    }

    console.log(
      `Starting sync with conflict resolution for ${queueStatus.pending} actions`,
    );

    const result: SyncResult = {
      successful: 0,
      failed: 0,
      total: queueStatus.pending,
      errors: [],
    };

    // Process actions in batches to avoid overwhelming the server
    const batches = this.createBatches(batchSize, priorityFilter);

    for (const batch of batches) {
      const batchResult = await this.processBatch(batch, conflictResolution);
      result.successful += batchResult.successful;
      result.failed += batchResult.failed;
      result.errors.push(...batchResult.errors);
    }

    return result;
  }

  private createBatches(
    batchSize: number,
    priorityFilter?: ("low" | "medium" | "high")[],
  ): OfflineAction[][] {
    // This would need access to the queue from offlineService
    // For now, we'll return empty batches and let the offlineService handle processing
    return [];
  }

  private async processBatch(
    batch: OfflineAction[],
    conflictResolution: "auto" | "manual",
  ): Promise<SyncResult> {
    const result: SyncResult = {
      successful: 0,
      failed: 0,
      total: batch.length,
      errors: [],
    };

    for (const action of batch) {
      try {
        await this.processActionWithConflictDetection(
          action,
          conflictResolution,
        );
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push(error as ApiError);
      }
    }

    return result;
  }

  private async processActionWithConflictDetection(
    action: OfflineAction,
    conflictResolution: "auto" | "manual",
  ): Promise<void> {
    try {
      // First, try to get the current server state for comparison
      const serverData = await this.fetchServerData(action);

      // Check for conflicts
      const conflict = this.detectConflict(action, serverData);

      if (conflict) {
        if (conflictResolution === "auto") {
          await this.resolveConflictAutomatically(conflict);
        } else {
          this.addConflict(conflict);
          throw new Error(
            `Conflict detected for action ${action.id}, manual resolution required`,
          );
        }
      }

      // Execute the action
      await this.executeAction(action);
    } catch (error) {
      // If it's a conflict error, don't retry
      if (
        error instanceof Error &&
        error.message.includes("Conflict detected")
      ) {
        throw error;
      }

      // For other errors, let the normal retry logic handle it
      throw error;
    }
  }

  private async fetchServerData(action: OfflineAction): Promise<any> {
    try {
      switch (action.type) {
        case "task_claim":
        case "task_status_update":
        case "task_complete":
          // Extract task ID from payload or endpoint
          const taskId = this.extractTaskId(action);
          if (taskId) {
            const response = await apiClient.get(`/tasks/${taskId}`);
            return response.data;
          }
          break;

        case "profile_update":
          const response = await apiClient.get("/contractors/me");
          return response.data;

        default:
          return null;
      }
    } catch (error) {
      // If we can't fetch server data, assume no conflict
      return null;
    }
  }

  private extractTaskId(action: OfflineAction): string | null {
    // Try to extract task ID from endpoint
    const match = action.endpoint.match(/\/tasks\/([^\/]+)/);
    if (match) {
      return match[1];
    }

    // Try to extract from payload
    if (action.payload && action.payload.taskId) {
      return action.payload.taskId;
    }

    return null;
  }

  private detectConflict(
    action: OfflineAction,
    serverData: any,
  ): SyncConflict | null {
    if (!serverData) {
      return null;
    }

    switch (action.type) {
      case "task_claim":
        // Check if task is already claimed by someone else
        if (
          serverData.status === "assigned" &&
          serverData.assignedContractor !== action.payload.contractorId
        ) {
          return {
            id: `conflict_${action.id}`,
            type: "concurrent_modification",
            localData: action.payload,
            serverData,
            timestamp: new Date().toISOString(),
            action,
          };
        }
        break;

      case "task_status_update":
        // Check if server status is different from expected
        const expectedPreviousStatus = this.getExpectedPreviousStatus(
          action.payload.status,
        );
        if (
          serverData.status !== expectedPreviousStatus &&
          serverData.status !== action.payload.status
        ) {
          return {
            id: `conflict_${action.id}`,
            type: "data_conflict",
            localData: action.payload,
            serverData,
            timestamp: new Date().toISOString(),
            action,
          };
        }
        break;

      case "profile_update":
        // Check if profile was modified more recently on server
        const serverModified = new Date(serverData.updatedAt);
        const actionTime = new Date(action.timestamp);
        if (serverModified > actionTime) {
          return {
            id: `conflict_${action.id}`,
            type: "version_conflict",
            localData: action.payload,
            serverData,
            timestamp: new Date().toISOString(),
            action,
          };
        }
        break;
    }

    return null;
  }

  private getExpectedPreviousStatus(newStatus: string): string {
    const statusFlow: Record<string, string> = {
      assigned: "published",
      in_progress: "assigned",
      completed: "in_progress",
      cancelled: "assigned",
    };

    return statusFlow[newStatus] || "published";
  }

  private async resolveConflictAutomatically(
    conflict: SyncConflict,
  ): Promise<void> {
    let resolution: ConflictResolution;

    switch (conflict.type) {
      case "concurrent_modification":
        // For task claims, server wins (task already claimed)
        resolution = { strategy: "server_wins" };
        break;

      case "data_conflict":
        // For status updates, try to merge if possible
        resolution = this.attemptMerge(conflict);
        break;

      case "version_conflict":
        // For profile updates, merge non-conflicting fields
        resolution = this.mergeProfileData(conflict);
        break;

      default:
        resolution = { strategy: "server_wins" };
    }

    await this.applyResolution(conflict, resolution);
  }

  private attemptMerge(conflict: SyncConflict): ConflictResolution {
    // For task status conflicts, check if we can still apply the change
    if (conflict.action.type === "task_status_update") {
      const serverStatus = conflict.serverData.status;
      const localStatus = conflict.localData.status;

      // If server is ahead in the workflow, accept server state
      const statusOrder = [
        "published",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ];
      const serverIndex = statusOrder.indexOf(serverStatus);
      const localIndex = statusOrder.indexOf(localStatus);

      if (serverIndex > localIndex) {
        return { strategy: "server_wins" };
      } else {
        return { strategy: "client_wins" };
      }
    }

    return { strategy: "server_wins" };
  }

  private mergeProfileData(conflict: SyncConflict): ConflictResolution {
    // Merge profile data by taking non-conflicting fields from both
    const merged = { ...conflict.serverData };

    // Apply local changes that don't conflict
    Object.keys(conflict.localData).forEach((key) => {
      if (key !== "updatedAt" && key !== "version") {
        merged[key] = conflict.localData[key];
      }
    });

    return {
      strategy: "merge",
      resolvedData: merged,
    };
  }

  private async applyResolution(
    conflict: SyncConflict,
    resolution: ConflictResolution,
  ): Promise<void> {
    switch (resolution.strategy) {
      case "server_wins":
        // Skip the action, server state is authoritative
        console.log(
          `Conflict resolved: server wins for action ${conflict.action.id}`,
        );
        break;

      case "client_wins":
        // Proceed with the original action
        await this.executeAction(conflict.action);
        console.log(
          `Conflict resolved: client wins for action ${conflict.action.id}`,
        );
        break;

      case "merge":
        // Execute action with merged data
        const mergedAction = {
          ...conflict.action,
          payload: resolution.resolvedData,
        };
        await this.executeAction(mergedAction);
        console.log(
          `Conflict resolved: merged data for action ${conflict.action.id}`,
        );
        break;

      case "manual":
        // Add to conflicts list for manual resolution
        this.addConflict(conflict);
        throw new Error(
          `Manual resolution required for action ${conflict.action.id}`,
        );
    }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    const config = {
      method: action.method,
      url: action.endpoint,
      data: action.payload,
      requiresAuth: action.requiresAuth,
    };

    await apiClient.request(config);
  }

  private addConflict(conflict: SyncConflict): void {
    this.conflicts.push(conflict);
    this.notifyConflictListeners();
  }

  private notifyConflictListeners(): void {
    this.conflictListeners.forEach((listener) => listener([...this.conflicts]));
  }

  public onConflict(listener: (conflicts: SyncConflict[]) => void): () => void {
    this.conflictListeners.push(listener);
    return () => {
      const index = this.conflictListeners.indexOf(listener);
      if (index > -1) {
        this.conflictListeners.splice(index, 1);
      }
    };
  }

  public getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  public async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
  ): Promise<void> {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    await this.applyResolution(conflict, resolution);

    // Remove resolved conflict
    this.conflicts = this.conflicts.filter((c) => c.id !== conflictId);
    this.notifyConflictListeners();
  }

  public clearConflicts(): void {
    this.conflicts = [];
    this.notifyConflictListeners();
  }

  public async retryWithConflictResolution(actionId: string): Promise<void> {
    // This would need to work with the offlineService to retry a specific action
    // For now, we'll trigger a general retry
    await offlineService.retryFailedActions();
  }
}

export const syncQueue = SyncQueue.getInstance();
