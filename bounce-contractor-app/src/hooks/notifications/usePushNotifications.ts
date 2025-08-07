import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Capacitor } from "@capacitor/core";
import {
  pushNotificationService,
  PushNotificationConfig,
} from "../../services/notifications/pushNotifications";
import { firebaseMessaging } from "../../config/firebase.config";
import { useRealtimeStore } from "../../store/realtimeStore";
import { errorLogger } from "../../services/debug/errorLogger";

export interface UsePushNotificationsOptions {
  autoInitialize?: boolean;
  autoRequestPermission?: boolean;
}

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  isInitialized: boolean;
  isEnabled: boolean;
  permissionStatus: NotificationPermission | "unknown";
  fcmToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  destroy: () => Promise<void>;
  forceDestroy: () => void;
  requestPermission: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => void;
  testNotification: () => Promise<void>;
  updateConfig: (config: Partial<PushNotificationConfig>) => void;
}

/**
 * Hook for managing push notifications that consumes global singleton state
 */
export const usePushNotifications = (
  options: UsePushNotificationsOptions = {},
): UsePushNotificationsReturn => {
  const { autoInitialize = true, autoRequestPermission = false } = options;

  // Global state from service
  const [globalState, setGlobalState] = useState(() =>
    pushNotificationService.getGlobalState(),
  );

  // Local state for UI-specific data
  const [permissionStatus, setPermissionStatus] = useState<
    NotificationPermission | "unknown"
  >("unknown");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for cleanup and preventing race conditions
  const isMountedRef = useRef(true);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  const { addNotification } = useRealtimeStore();

  // Memoized values to prevent unnecessary re-renders
  const isSupported = useMemo(() => pushNotificationService.isSupported(), []);
  const isEnabled = useMemo(() => pushNotificationService.isEnabled(), []);

  /**
   * Safe state update that checks if component is still mounted
   */
  const safeSetState = useCallback((updater: () => void) => {
    if (isMountedRef.current) {
      updater();
    }
  }, []);

  /**
   * Initialize push notifications (delegates to global service)
   */
  const initialize = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    errorLogger.logInfo("usePushNotifications", "Hook initialize called", {
      isSupported,
      globalInitialized: globalState.isInitialized,
      globalInitializing: globalState.isInitializing,
    });

    // If already initialized globally, just sync local state
    if (globalState.isInitialized) {
      errorLogger.logInfo(
        "usePushNotifications",
        "Already initialized globally - syncing local state",
      );
      safeSetState(() => {
        const token = pushNotificationService.getToken();
        const permission = pushNotificationService.getPermissionStatus();
        setFcmToken(token);
        setPermissionStatus(permission);
      });
      return;
    }

    // If currently initializing globally, don't start another
    if (globalState.isInitializing) {
      errorLogger.logInfo(
        "usePushNotifications",
        "Global initialization in progress - waiting",
      );
      return;
    }

    if (!isSupported) {
      const errorMessage =
        "Push notifications are not supported on this device";
      errorLogger.logWarn("usePushNotifications", errorMessage);
      return;
    }

    safeSetState(() => setIsLoading(true));

    try {
      // Delegate to global service
      await pushNotificationService.initialize();

      if (!isMountedRef.current) return;

      // Sync local state after successful initialization
      safeSetState(() => {
        const token = pushNotificationService.getToken();
        const permission = pushNotificationService.getPermissionStatus();
        setFcmToken(token);
        setPermissionStatus(permission);
      });

      errorLogger.logInfo(
        "usePushNotifications",
        "Hook initialization completed successfully",
      );
    } catch (err) {
      if (!isMountedRef.current) return;

      errorLogger.logError(
        "usePushNotifications",
        "Hook initialization failed",
        err,
      );
      // Error is already handled by global state
    } finally {
      if (isMountedRef.current) {
        safeSetState(() => setIsLoading(false));
      }
    }
  }, [
    isSupported,
    globalState.isInitialized,
    globalState.isInitializing,
    safeSetState,
  ]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isMountedRef.current) return false;

    safeSetState(() => setIsLoading(true));

    try {
      const granted = await pushNotificationService.requestPermission();

      if (!isMountedRef.current) return granted;

      if (granted) {
        // Update local state
        const permission = pushNotificationService.getPermissionStatus();
        safeSetState(() => setPermissionStatus(permission));

        // Get FCM token for web platforms
        if (!Capacitor.isNativePlatform()) {
          try {
            const token =
              await firebaseMessaging.requestPermissionAndGetToken();
            if (token && isMountedRef.current) {
              safeSetState(() => setFcmToken(token));
              // Update the service's token
              (pushNotificationService as any).fcmToken = token;
              // Register with server
              await (pushNotificationService as any).registerTokenWithServer(
                token,
              );
            }
          } catch (tokenError) {
            errorLogger.logError(
              "usePushNotifications",
              "Failed to get FCM token after permission granted",
              tokenError,
            );
          }
        } else {
          // For native platforms, token should be available from the service
          const token = pushNotificationService.getToken();
          if (token && isMountedRef.current) {
            safeSetState(() => setFcmToken(token));
          }
        }
      }

      return granted;
    } catch (err) {
      if (!isMountedRef.current) return false;

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to request notification permission";
      errorLogger.logError(
        "usePushNotifications",
        "Permission request failed",
        err,
      );
      return false;
    } finally {
      if (isMountedRef.current) {
        safeSetState(() => setIsLoading(false));
      }
    }
  }, [safeSetState]);

  /**
   * Enable/disable notifications
   */
  const setEnabled = useCallback((enabled: boolean): void => {
    try {
      pushNotificationService.setEnabled(enabled);
      errorLogger.logInfo(
        "usePushNotifications",
        `Notifications ${enabled ? "enabled" : "disabled"}`,
      );
    } catch (err) {
      errorLogger.logError(
        "usePushNotifications",
        "Failed to set notification enabled state",
        err,
      );
    }
  }, []);

  /**
   * Test notification
   */
  const testNotification = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    try {
      await pushNotificationService.testNotification();
      errorLogger.logInfo(
        "usePushNotifications",
        "Test notification sent successfully",
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send test notification";
      errorLogger.logError(
        "usePushNotifications",
        "Test notification failed",
        err,
      );
      throw err;
    }
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback(
    (config: Partial<PushNotificationConfig>): void => {
      try {
        pushNotificationService.updateConfig(config);
        errorLogger.logInfo(
          "usePushNotifications",
          "Configuration updated",
          config,
        );
      } catch (err) {
        errorLogger.logError(
          "usePushNotifications",
          "Failed to update configuration",
          err,
        );
      }
    },
    [],
  );

  /**
   * Destroy push notifications system
   */
  const destroy = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    safeSetState(() => setIsLoading(true));

    try {
      errorLogger.logInfo("usePushNotifications", "Starting destruction...");

      // Run local cleanup first
      cleanupFunctionsRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (err) {
          errorLogger.logError(
            "usePushNotifications",
            "Error during local cleanup",
            err,
          );
        }
      });
      cleanupFunctionsRef.current = [];

      // Delegate to global service for destruction
      if (typeof (pushNotificationService as any).destroy === "function") {
        await (pushNotificationService as any).destroy();
      } else {
        // Fallback: disable and clear state
        pushNotificationService.setEnabled(false);
      }

      if (!isMountedRef.current) return;

      // Reset local state
      safeSetState(() => {
        setFcmToken(null);
        setPermissionStatus("unknown");
        setGlobalState({
          isInitialized: false,
          isInitializing: false,
          initializationPromise: null,
          error: null,
          lastFailureTime: 0,
          failureCount: 0,
          isCircuitBreakerOpen: false,
        });
      });

      errorLogger.logInfo(
        "usePushNotifications",
        "Push notifications destroyed successfully",
      );
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to destroy push notifications";
      errorLogger.logError(
        "usePushNotifications",
        "Push notifications destruction failed",
        err,
      );

      // Force cleanup if graceful destruction failed
      try {
        forceDestroy();
      } catch (forceError) {
        errorLogger.logError(
          "usePushNotifications",
          "Force destruction also failed",
          forceError,
        );
        throw forceError;
      }
    } finally {
      if (isMountedRef.current) {
        safeSetState(() => setIsLoading(false));
      }
    }
  }, [safeSetState]);

  /**
   * Force destroy push notifications system
   */
  const forceDestroy = useCallback((): void => {
    if (!isMountedRef.current) return;

    errorLogger.logWarn("usePushNotifications", "Force destroying...");

    // Aggressive cleanup
    cleanupFunctionsRef.current.forEach((cleanup) => {
      try {
        cleanup();
      } catch (err) {
        // Ignore cleanup errors during force destroy
      }
    });
    cleanupFunctionsRef.current = [];

    // Force disable service
    try {
      pushNotificationService.setEnabled(false);
    } catch (err) {
      // Ignore errors during force destroy
    }

    // Reset all local state
    safeSetState(() => {
      setFcmToken(null);
      setPermissionStatus("unknown");
      setGlobalState({
        isInitialized: false,
        isInitializing: false,
        initializationPromise: null,
        error: null,
        lastFailureTime: 0,
        failureCount: 0,
        isCircuitBreakerOpen: false,
      });
      setIsLoading(false);
    });

    errorLogger.logInfo("usePushNotifications", "Force destruction completed");
  }, [safeSetState]);

  // Subscribe to global state changes
  useEffect(() => {
    const unsubscribe = pushNotificationService.onGlobalStateChange(
      (newState) => {
        if (isMountedRef.current) {
          setGlobalState(newState);

          // Sync local state when global state changes
          if (newState.isInitialized) {
            const token = pushNotificationService.getToken();
            const permission = pushNotificationService.getPermissionStatus();
            setFcmToken(token);
            setPermissionStatus(permission);
          }
        }
      },
    );

    cleanupFunctionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // DISABLED: Auto-initialization to prevent cascading failures and render loops
  // Auto-initialization is now manual only to prevent crashes
  useEffect(() => {
    // Only log that auto-initialization is disabled
    if (
      autoInitialize &&
      isSupported &&
      !globalState.isInitialized &&
      !globalState.isInitializing
    ) {
      errorLogger.logInfo(
        "usePushNotifications",
        "Auto-initialization disabled to prevent crashes - use manual initialization",
      );
    }
  }, [
    autoInitialize,
    isSupported,
    globalState.isInitialized,
    globalState.isInitializing,
  ]);

  // Auto-request permission
  useEffect(() => {
    if (
      autoRequestPermission &&
      isSupported &&
      globalState.isInitialized &&
      permissionStatus === "default"
    ) {
      requestPermission().catch((error) => {
        errorLogger.logError(
          "usePushNotifications",
          "Auto-permission request failed",
          error,
        );
      });
    }
  }, [
    autoRequestPermission,
    isSupported,
    globalState.isInitialized,
    permissionStatus,
    requestPermission,
  ]);

  // Set up notification event listeners (only once when initialized)
  useEffect(() => {
    if (!globalState.isInitialized || !isMountedRef.current) return;

    try {
      // Listen for notification received
      const unsubscribeReceived = pushNotificationService.on(
        "notificationReceived",
        (notification) => {
          if (!isMountedRef.current) return;

          errorLogger.logInfo(
            "usePushNotifications",
            "Push notification received",
            {
              title: notification.title,
              hasData: !!notification.data,
            },
          );

          // Add to realtime store
          addNotification({
            type: "notification:personal",
            title: notification.title || "New Notification",
            message: notification.body || "",
            data: notification.data,
            priority: "medium",
          });
        },
      );

      // Listen for notification tapped
      const unsubscribeTapped = pushNotificationService.on(
        "notificationTapped",
        (notification) => {
          if (!isMountedRef.current) return;

          errorLogger.logInfo(
            "usePushNotifications",
            "Push notification tapped",
            {
              hasData: !!notification.data,
            },
          );

          // Handle notification tap - could navigate to specific screen
          if (notification.data?.taskId) {
            errorLogger.logInfo("usePushNotifications", "Navigate to task", {
              taskId: notification.data.taskId,
            });
          }
        },
      );

      // Store cleanup functions
      cleanupFunctionsRef.current.push(unsubscribeReceived, unsubscribeTapped);

      errorLogger.logInfo(
        "usePushNotifications",
        "Event listeners setup completed",
      );
    } catch (err) {
      errorLogger.logError(
        "usePushNotifications",
        "Failed to setup event listeners",
        err,
      );
    }
  }, [globalState.isInitialized, addNotification]);

  // Periodic status updates (reduced frequency)
  useEffect(() => {
    if (!isSupported || !globalState.isInitialized) return;

    const updateStatus = () => {
      if (!isMountedRef.current) return;

      try {
        const permission = pushNotificationService.getPermissionStatus();
        const token = pushNotificationService.getToken();

        safeSetState(() => {
          setPermissionStatus(permission);
          setFcmToken(token);
        });
      } catch (err) {
        errorLogger.logError(
          "usePushNotifications",
          "Failed to update status",
          err,
        );
      }
    };

    // Update immediately
    updateStatus();

    // Update every 5 minutes (reduced frequency)
    const interval = setInterval(updateStatus, 300000);
    cleanupFunctionsRef.current.push(() => clearInterval(interval));

    return () => clearInterval(interval);
  }, [isSupported, globalState.isInitialized, safeSetState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Run all cleanup functions
      cleanupFunctionsRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (err) {
          errorLogger.logError(
            "usePushNotifications",
            "Error during cleanup",
            err,
          );
        }
      });

      cleanupFunctionsRef.current = [];

      errorLogger.logInfo("usePushNotifications", "Hook cleanup completed");
    };
  }, []);

  return {
    isSupported,
    isInitialized: globalState.isInitialized,
    isEnabled,
    permissionStatus,
    fcmToken,
    isLoading: isLoading || globalState.isInitializing,
    error: globalState.error,
    // Actions
    initialize,
    destroy,
    forceDestroy,
    requestPermission,
    setEnabled,
    testNotification,
    updateConfig,
  };
};
