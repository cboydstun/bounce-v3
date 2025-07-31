import { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { pushNotificationService } from "../../services/notifications/pushNotifications";
import { errorLogger } from "../../services/debug/errorLogger";

export interface UseNotificationStatusReturn {
  isSupported: boolean;
  isEnabled: boolean;
  permissionStatus: NotificationPermission | "unknown";
  fcmToken: string | null;
  hasToken: boolean;
  platformInfo: {
    platform: string;
    isNative: boolean;
    userAgent: string;
  };
}

/**
 * Read-only hook for displaying notification status in settings
 * This hook NEVER initializes or modifies anything - it only reads current state
 */
export const useNotificationStatus = (): UseNotificationStatusReturn => {
  const [permissionStatus, setPermissionStatus] = useState<
    NotificationPermission | "unknown"
  >("unknown");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Static values that don't change
  const isSupported = pushNotificationService.isSupported();
  const isEnabled = pushNotificationService.isEnabled();

  // Platform information
  const platformInfo = {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform(),
    userAgent: navigator.userAgent,
  };

  // Safely update state only if component is mounted
  const safeUpdate = (updater: () => void) => {
    if (isMountedRef.current) {
      try {
        updater();
      } catch (error) {
        errorLogger.logError(
          "useNotificationStatus",
          "Error updating state",
          error,
        );
      }
    }
  };

  // Get current permission status (read-only)
  const getCurrentPermissionStatus = (): NotificationPermission | "unknown" => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Use the push notification service's permission state for native platforms
        return pushNotificationService.getPermissionState();
      } else {
        // For web platforms, we can safely check the browser permission
        if ("Notification" in window) {
          return Notification.permission;
        }
        return "unknown";
      }
    } catch (error) {
      errorLogger.logWarn(
        "useNotificationStatus",
        "Failed to get permission status",
        error as Error,
      );
      return "unknown";
    }
  };

  // Get current FCM token (read-only)
  const getCurrentToken = (): string | null => {
    try {
      return pushNotificationService.getToken();
    } catch (error) {
      errorLogger.logWarn(
        "useNotificationStatus",
        "Failed to get FCM token",
        error as Error,
      );
      return null;
    }
  };

  // Update status on mount and periodically (read-only operations only)
  useEffect(() => {
    const updateStatus = () => {
      safeUpdate(() => {
        const permission = getCurrentPermissionStatus();
        const token = getCurrentToken();

        setPermissionStatus(permission);
        setFcmToken(token);

        errorLogger.logDebug("useNotificationStatus", "Status updated", {
          permission,
          hasToken: !!token,
          isSupported,
          isEnabled,
        });
      });
    };

    // Update immediately
    updateStatus();

    // Update every 30 seconds (much less frequent than before)
    const interval = setInterval(updateStatus, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [isSupported, isEnabled]);

  // Subscribe to push notification service state changes for native platforms
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Subscribe to global state changes
      const unsubscribe = pushNotificationService.onGlobalStateChange(
        (state) => {
          safeUpdate(() => {
            const permission = getCurrentPermissionStatus();
            const token = getCurrentToken();

            setPermissionStatus(permission);
            setFcmToken(token);

            errorLogger.logDebug(
              "useNotificationStatus",
              "State updated from service change",
              {
                permission,
                hasToken: !!token,
                serviceState: {
                  isInitialized: state.isInitialized,
                  error: state.error,
                  isInitializing: state.isInitializing,
                },
              },
            );
          });
        },
      );

      return unsubscribe;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      errorLogger.logDebug("useNotificationStatus", "Hook cleanup completed");
    };
  }, []);

  return {
    isSupported,
    isEnabled,
    permissionStatus,
    fcmToken,
    hasToken: !!fcmToken,
    platformInfo,
  };
};
