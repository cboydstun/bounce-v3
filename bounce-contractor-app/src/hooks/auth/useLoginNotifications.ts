import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { firebaseMessaging } from "../../config/firebase.config";
import { errorLogger } from "../../services/debug/errorLogger";

export interface UseLoginNotificationsReturn {
  requestNotificationPermission: () => Promise<{
    success: boolean;
    message: string;
    permission?: NotificationPermission | string;
  }>;
}

/**
 * Simple, non-blocking notification permission hook for login flow
 * This is designed to be crash-proof and non-intrusive
 */
export const useLoginNotifications = (): UseLoginNotificationsReturn => {
  /**
   * Request notification permission in a safe, non-blocking way
   */
  const requestNotificationPermission = useCallback(async () => {
    try {
      errorLogger.logInfo(
        "login-notifications",
        "Starting safe permission request",
        {
          platform: Capacitor.getPlatform(),
          isNative: Capacitor.isNativePlatform(),
        },
      );

      if (Capacitor.isNativePlatform()) {
        // Native platform - use Capacitor
        try {
          const permission = await PushNotifications.requestPermissions();

          errorLogger.logInfo(
            "login-notifications",
            "Native permission result",
            {
              receive: permission.receive,
            },
          );

          if (permission.receive === "granted") {
            return {
              success: true,
              message: "Notifications enabled! You'll receive task updates.",
              permission: permission.receive,
            };
          } else if (permission.receive === "prompt") {
            return {
              success: true,
              message:
                "Notifications available. You may see permission dialogs.",
              permission: permission.receive,
            };
          } else {
            return {
              success: false,
              message:
                "Notifications disabled. You can enable them later in settings.",
              permission: permission.receive,
            };
          }
        } catch (nativeError) {
          errorLogger.logWarn(
            "login-notifications",
            "Native permission request failed",
            nativeError as Error,
          );
          return {
            success: false,
            message: "Notification setup skipped. App will work normally.",
          };
        }
      } else {
        // Web platform - use browser API
        try {
          if (!("Notification" in window)) {
            return {
              success: false,
              message: "Notifications not supported on this browser.",
            };
          }

          // Check current permission first
          const currentPermission = Notification.permission;

          if (currentPermission === "granted") {
            return {
              success: true,
              message: "Notifications already enabled!",
              permission: currentPermission,
            };
          }

          if (currentPermission === "denied") {
            return {
              success: false,
              message:
                "Notifications blocked. Enable in browser settings if desired.",
              permission: currentPermission,
            };
          }

          // Request permission with timeout
          const permissionPromise = Notification.requestPermission();
          const timeoutPromise = new Promise<NotificationPermission>(
            (_, reject) => {
              setTimeout(
                () => reject(new Error("Permission request timeout")),
                5000,
              );
            },
          );

          const permission = await Promise.race([
            permissionPromise,
            timeoutPromise,
          ]);

          errorLogger.logInfo("login-notifications", "Web permission result", {
            permission,
          });

          if (permission === "granted") {
            return {
              success: true,
              message: "Notifications enabled! You'll receive task updates.",
              permission,
            };
          } else {
            return {
              success: false,
              message:
                "Notifications disabled. You can enable them later in settings.",
              permission,
            };
          }
        } catch (webError) {
          errorLogger.logWarn(
            "login-notifications",
            "Web permission request failed",
            webError as Error,
          );
          return {
            success: false,
            message: "Notification setup skipped. App will work normally.",
          };
        }
      }
    } catch (error) {
      errorLogger.logError(
        "login-notifications",
        "Permission request failed completely",
        error,
      );
      return {
        success: false,
        message: "App loaded successfully. Notifications can be enabled later.",
      };
    }
  }, []);

  return {
    requestNotificationPermission,
  };
};
