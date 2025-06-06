import { useState, useEffect } from "react";
import { NetworkStatus } from "../../types/api.types";
import { offlineService } from "../../services/offline/offlineService";

export interface NetworkHookResult {
  networkStatus: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string;
  isSlowConnection: boolean;
}

export function useNetwork(): NetworkHookResult {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    offlineService.getNetworkStatus(),
  );

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = offlineService.onNetworkChange((status) => {
      setNetworkStatus(status);
    });

    return unsubscribe;
  }, []);

  return {
    networkStatus,
    isOnline: networkStatus.isOnline,
    isOffline: !networkStatus.isOnline,
    connectionType: networkStatus.connectionType,
    isSlowConnection: networkStatus.isSlowConnection,
  };
}
