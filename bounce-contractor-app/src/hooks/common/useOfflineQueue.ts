import { useState, useEffect, useCallback } from "react";
import { SyncResult } from "../../types/api.types";
import { offlineService, OfflineAction } from "../../services/offline/offlineService";
import { syncQueue, SyncConflict } from "../../services/offline/syncQueue";

export interface OfflineQueueStatus {
  pending: number;
  processing: number;
  failed: number;
  total: number;
}

export interface OfflineQueueHookResult {
  queueStatus: OfflineQueueStatus;
  conflicts: SyncConflict[];
  isProcessing: boolean;
  lastSyncResult: SyncResult | null;
  queueAction: (action: Omit<OfflineAction, "id" | "timestamp" | "retryCount" | "status">) => Promise<string>;
  processQueue: () => Promise<SyncResult>;
  clearQueue: () => Promise<void>;
  clearFailedActions: () => Promise<void>;
  retryFailedActions: () => Promise<void>;
  resolveConflict: (conflictId: string, strategy: "client_wins" | "server_wins" | "merge") => Promise<void>;
  clearConflicts: () => void;
}

export function useOfflineQueue(): OfflineQueueHookResult {
  const [queueStatus, setQueueStatus] = useState<OfflineQueueStatus>(
    offlineService.getQueueStatus()
  );
  const [conflicts, setConflicts] = useState<SyncConflict[]>(
    syncQueue.getConflicts()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Update queue status periodically
  useEffect(() => {
    const updateStatus = () => {
      setQueueStatus(offlineService.getQueueStatus());
    };

    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for sync results
  useEffect(() => {
    const unsubscribeSync = offlineService.onSync((result) => {
      setLastSyncResult(result);
      setIsProcessing(false);
      setQueueStatus(offlineService.getQueueStatus());
    });

    return unsubscribeSync;
  }, []);

  // Listen for conflicts
  useEffect(() => {
    const unsubscribeConflicts = syncQueue.onConflict((newConflicts) => {
      setConflicts(newConflicts);
    });

    return unsubscribeConflicts;
  }, []);

  const queueAction = useCallback(
    async (action: Omit<OfflineAction, "id" | "timestamp" | "retryCount" | "status">) => {
      const actionId = await offlineService.queueAction(action);
      setQueueStatus(offlineService.getQueueStatus());
      return actionId;
    },
    []
  );

  const processQueue = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await offlineService.processQueue();
      setLastSyncResult(result);
      return result;
    } finally {
      setIsProcessing(false);
      setQueueStatus(offlineService.getQueueStatus());
    }
  }, []);

  const clearQueue = useCallback(async () => {
    await offlineService.clearQueue();
    setQueueStatus(offlineService.getQueueStatus());
  }, []);

  const clearFailedActions = useCallback(async () => {
    await offlineService.clearFailedActions();
    setQueueStatus(offlineService.getQueueStatus());
  }, []);

  const retryFailedActions = useCallback(async () => {
    await offlineService.retryFailedActions();
    setQueueStatus(offlineService.getQueueStatus());
  }, []);

  const resolveConflict = useCallback(
    async (conflictId: string, strategy: "client_wins" | "server_wins" | "merge") => {
      await syncQueue.resolveConflict(conflictId, { strategy });
      setConflicts(syncQueue.getConflicts());
    },
    []
  );

  const clearConflicts = useCallback(() => {
    syncQueue.clearConflicts();
    setConflicts([]);
  }, []);

  return {
    queueStatus,
    conflicts,
    isProcessing,
    lastSyncResult,
    queueAction,
    processQueue,
    clearQueue,
    clearFailedActions,
    retryFailedActions,
    resolveConflict,
    clearConflicts,
  };
}
