import { useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import {
  pushNotificationService,
  PushNotificationConfig,
} from "../../services/notifications/pushNotifications";
import { firebaseMessaging } from "../../config/firebase.config";
import { useRealtimeStore } from "../../store/realtimeStore";

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
  requestPermission: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => void;
  testNotification: () => Promise<void>;
  updateConfig: (config: Partial<PushNotificationConfig>) => void;
}

/**
 * Hook for managing push notifications
 */
export const usePushNotifications = (
  options: UsePushNotificationsOptions = {},
): UsePushNotificationsReturn => {
  const { autoInitialize = true, autoRequestPermission = false } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    NotificationPermission | "unknown"
  >("unknown");
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const { addNotification } = useRealtimeStore();

  // Check if push notifications are supported
  const isSupported = pushNotificationService.isSupported();
  const isEnabled = pushNotificationService.isEnabled();

  /**
   * Initialize push notifications
   */
  const initialize = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError("Push notifications are not supported on this device");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationService.initialize();
      setIsInitialized(true);

      // Get FCM token
      const token = pushNotificationService.getToken();
      setFcmToken(token);

      // Update permission status
      const permission = pushNotificationService.getPermissionStatus();
      setPermissionStatus(permission);

      console.log("Push notifications initialized successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to initialize push notifications";
      setError(errorMessage);
      console.error("Push notification initialization failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Request notification permission and get FCM token
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const granted = await pushNotificationService.requestPermission();

      if (granted) {
        // Update permission status
        const permission = pushNotificationService.getPermissionStatus();
        setPermissionStatus(permission);

        // Get FCM token now that permission is granted
        if (Capacitor.isNativePlatform()) {
          // For native platforms, token will be obtained automatically
          const token = pushNotificationService.getToken();
          setFcmToken(token);
        } else {
          // For web, request token with permission
          const token = await firebaseMessaging.requestPermissionAndGetToken();
          if (token) {
            setFcmToken(token);
            // Update the service's token
            (pushNotificationService as any).fcmToken = token;
            // Register with server
            await (pushNotificationService as any).registerTokenWithServer(
              token,
            );
          }
        }
      }

      return granted;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to request notification permission";
      setError(errorMessage);
      console.error("Permission request failed:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Enable/disable notifications
   */
  const setEnabled = useCallback((enabled: boolean): void => {
    pushNotificationService.setEnabled(enabled);
  }, []);

  /**
   * Test notification
   */
  const testNotification = useCallback(async (): Promise<void> => {
    try {
      await pushNotificationService.testNotification();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send test notification";
      setError(errorMessage);
      console.error("Test notification failed:", err);
    }
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback(
    (config: Partial<PushNotificationConfig>): void => {
      pushNotificationService.updateConfig(config);
    },
    [],
  );

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && isSupported && !isInitialized) {
      initialize().catch(console.error);
    }
  }, [autoInitialize, isSupported, isInitialized, initialize]);

  // Auto-request permission
  useEffect(() => {
    if (
      autoRequestPermission &&
      isSupported &&
      permissionStatus === "default"
    ) {
      requestPermission().catch(console.error);
    }
  }, [autoRequestPermission, isSupported, permissionStatus, requestPermission]);

  // Set up notification event listeners
  useEffect(() => {
    if (!isInitialized) return;

    // Listen for notification received
    const unsubscribeReceived = pushNotificationService.on(
      "notificationReceived",
      (notification) => {
        console.log("Push notification received:", notification);

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
        console.log("Push notification tapped:", notification);

        // Handle notification tap - could navigate to specific screen
        if (notification.data?.taskId) {
          // Navigate to task details
          console.log("Navigate to task:", notification.data.taskId);
        }
      },
    );

    // Listen for notification dismissed
    const unsubscribeDismissed = pushNotificationService.on(
      "notificationDismissed",
      (notification) => {
        console.log("Push notification dismissed:", notification);
      },
    );

    // Cleanup listeners
    return () => {
      unsubscribeReceived();
      unsubscribeTapped();
      unsubscribeDismissed();
    };
  }, [isInitialized, addNotification]);

  // Update permission status periodically
  useEffect(() => {
    if (!isSupported) return;

    const updatePermissionStatus = () => {
      const permission = pushNotificationService.getPermissionStatus();
      setPermissionStatus(permission);
    };

    // Update immediately
    updatePermissionStatus();

    // Update every 5 seconds
    const interval = setInterval(updatePermissionStatus, 5000);

    return () => clearInterval(interval);
  }, [isSupported]);

  // Update FCM token periodically
  useEffect(() => {
    if (!isInitialized) return;

    const updateFcmToken = () => {
      const token = pushNotificationService.getToken();
      setFcmToken(token);
    };

    // Update immediately
    updateFcmToken();

    // Update every 30 seconds
    const interval = setInterval(updateFcmToken, 30000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  return {
    isSupported,
    isInitialized,
    isEnabled,
    permissionStatus,
    fcmToken,
    isLoading,
    error,

    // Actions
    initialize,
    requestPermission,
    setEnabled,
    testNotification,
    updateConfig,
  };
};
