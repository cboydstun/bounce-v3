import { useEffect, useCallback } from "react";
import { usePushNotifications } from "./usePushNotifications";
import { useAudioAlerts } from "../audio/useAudioAlerts";
import { websocketService } from "../../services/realtime/websocketService";
import { audioService } from "../../services/audio/audioService";
import { TaskPriority } from "../../types/task.types";
import { APP_CONFIG } from "../../config/app.config";

export interface UseNotificationSystemOptions {
  autoInitialize?: boolean;
  autoRequestPermissions?: boolean;
  enableAudioAlerts?: boolean;
  enablePushNotifications?: boolean;
  preloadSounds?: boolean;
}

export interface UseNotificationSystemReturn {
  // Push notification state
  pushNotifications: {
    isSupported: boolean;
    isInitialized: boolean;
    isEnabled: boolean;
    permissionStatus: NotificationPermission | "unknown";
    fcmToken: string | null;
    isLoading: boolean;
    error: string | null;
  };

  // Audio alerts state
  audioAlerts: {
    isSupported: boolean;
    isInitialized: boolean;
    isEnabled: boolean;
    isLoading: boolean;
    error: string | null;
  };

  // Combined actions
  initialize: () => Promise<void>;
  destroy: () => Promise<void>;
  forceDestroy: () => void;
  requestPermissions: () => Promise<{ push: boolean; audio: boolean }>;
  playTaskAlert: (priority: TaskPriority) => Promise<void>;
  testNotifications: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
}

/**
 * Comprehensive hook for managing the complete notification system
 * Combines push notifications, audio alerts, and real-time WebSocket integration
 */
export const useNotificationSystem = (
  options: UseNotificationSystemOptions = {},
): UseNotificationSystemReturn => {
  const {
    autoInitialize = true,
    autoRequestPermissions = false,
    enableAudioAlerts = APP_CONFIG.AUDIO_ALERTS_ENABLED,
    enablePushNotifications = APP_CONFIG.PUSH_NOTIFICATION_ENABLED,
    preloadSounds = APP_CONFIG.AUDIO_PRELOAD_SOUNDS,
  } = options;

  // Initialize push notifications
  const pushNotifications = usePushNotifications({
    autoInitialize: enablePushNotifications && autoInitialize,
    autoRequestPermission: autoRequestPermissions,
  });

  // Initialize audio alerts
  const audioAlerts = useAudioAlerts({
    autoInitialize: enableAudioAlerts && autoInitialize,
    preloadSounds,
  });

  /**
   * Initialize the complete notification system with sequential initialization and lenient success criteria
   */
  const initialize = useCallback(async (): Promise<void> => {
    try {
      console.log("Starting notification system initialization");
      let audioWorking = false;
      let pushWorking = false;

      // Initialize audio alerts first (they're more reliable)
      if (enableAudioAlerts) {
        try {
          console.log("Initializing audio alerts...");
          await audioAlerts.initialize();

          // Check if audio is actually working
          if (audioAlerts.isSupported && !audioAlerts.error) {
            audioWorking = true;
            console.log("Audio alerts confirmed working");
          } else {
            console.log(
              "Audio alerts initialized but may not be fully functional",
            );
          }
        } catch (audioError) {
          console.error("Audio alerts initialization failed:", audioError);
          // Don't throw - continue with push notifications
        }
      }

      // Initialize push notifications second (they're more prone to failure)
      if (enablePushNotifications) {
        try {
          console.log("Initializing push notifications...");
          await pushNotifications.initialize();

          // Consider it working if no error occurred (even without full registration)
          if (!pushNotifications.error) {
            pushWorking = true;
            console.log(
              "Push notifications completed safely (event-based approach)",
            );
          } else {
            console.log("Push notifications completed with errors");
          }
        } catch (pushError) {
          console.error("Push notifications initialization failed:", pushError);
          // Don't throw - audio alerts might still work
          // The error will be available in the push notification state
        }
      }

      // Success if at least one system is working
      if (audioWorking || pushWorking) {
        console.log(
          `Notification system partially successful: Audio=${audioWorking}, Push=${pushWorking}`,
        );
      } else {
        console.warn(
          "No notification systems are fully functional, but initialization completed without crashes",
        );
        // Don't throw - partial functionality is better than crashes
      }

      console.log("Notification system initialization completed");
    } catch (error) {
      console.error("Failed to initialize notification system:", error);
      throw error;
    }
  }, [
    enablePushNotifications,
    enableAudioAlerts,
    pushNotifications.initialize,
    audioAlerts.initialize,
    pushNotifications.error,
    audioAlerts.isSupported,
    audioAlerts.error,
  ]);

  /**
   * Request all necessary permissions
   */
  const requestPermissions = useCallback(async (): Promise<{
    push: boolean;
    audio: boolean;
  }> => {
    const results = { push: false, audio: true }; // Audio doesn't need explicit permission

    try {
      // Request push notification permission
      if (enablePushNotifications) {
        results.push = await pushNotifications.requestPermission();
      }

      // Audio alerts don't require explicit permission, but we can check if they're working
      if (enableAudioAlerts && audioAlerts.isSupported) {
        results.audio = true;
      }

      return results;
    } catch (error) {
      console.error("Failed to request permissions:", error);
      return results;
    }
  }, [
    enablePushNotifications,
    enableAudioAlerts,
    pushNotifications.requestPermission,
    audioAlerts.isSupported,
  ]);

  /**
   * Play audio alert for new task based on priority
   */
  const playTaskAlert = useCallback(
    async (priority: TaskPriority): Promise<void> => {
      if (!enableAudioAlerts || !audioAlerts.isInitialized) {
        console.warn("Audio alerts not available");
        return;
      }

      try {
        await audioAlerts.playTaskAlert(priority);
      } catch (error) {
        console.error("Failed to play task alert:", error);
      }
    },
    [enableAudioAlerts, audioAlerts.isInitialized, audioAlerts.playTaskAlert],
  );

  /**
   * Test both notification systems
   */
  const testNotifications = useCallback(async (): Promise<void> => {
    const testPromises: Promise<void>[] = [];

    // Test push notifications
    if (enablePushNotifications && pushNotifications.isInitialized) {
      testPromises.push(pushNotifications.testNotification());
    }

    // Test audio alerts
    if (enableAudioAlerts && audioAlerts.isInitialized) {
      testPromises.push(audioAlerts.testAudio("notification_general"));
    }

    try {
      await Promise.all(testPromises);
      console.log("Notification system test completed");
    } catch (error) {
      console.error("Notification system test failed:", error);
    }
  }, [
    enablePushNotifications,
    enableAudioAlerts,
    pushNotifications.isInitialized,
    pushNotifications.testNotification,
    audioAlerts.isInitialized,
    audioAlerts.testAudio,
  ]);

  /**
   * Enable/disable entire notification system
   */
  const setEnabled = useCallback(
    (enabled: boolean): void => {
      if (enablePushNotifications) {
        pushNotifications.setEnabled(enabled);
      }

      if (enableAudioAlerts) {
        audioAlerts.updatePreferences({ soundEnabled: enabled });
      }
    },
    [
      enablePushNotifications,
      enableAudioAlerts,
      pushNotifications.setEnabled,
      audioAlerts.updatePreferences,
    ],
  );

  /**
   * Enable/disable audio alerts only
   */
  const setAudioEnabled = useCallback(
    (enabled: boolean): void => {
      if (enableAudioAlerts) {
        audioAlerts.updatePreferences({ soundEnabled: enabled });
      }
    },
    [enableAudioAlerts, audioAlerts.updatePreferences],
  );

  /**
   * Enable/disable push notifications only
   */
  const setPushEnabled = useCallback(
    (enabled: boolean): void => {
      if (enablePushNotifications) {
        pushNotifications.setEnabled(enabled);
      }
    },
    [enablePushNotifications, pushNotifications.setEnabled],
  );

  /**
   * Destroy the complete notification system
   */
  const destroy = useCallback(async (): Promise<void> => {
    try {
      console.log("Starting notification system destruction");
      const destroyPromises: Promise<void>[] = [];

      // Destroy audio alerts
      if (enableAudioAlerts) {
        console.log("Destroying audio alerts...");
        destroyPromises.push(audioAlerts.destroy());
      }

      // Destroy push notifications
      if (enablePushNotifications) {
        console.log("Destroying push notifications...");
        destroyPromises.push(pushNotifications.destroy());
      }

      // Wait for all destruction to complete
      await Promise.allSettled(destroyPromises);

      console.log("Notification system destruction completed");
    } catch (error) {
      console.error("Failed to destroy notification system:", error);
      throw error;
    }
  }, [
    enableAudioAlerts,
    enablePushNotifications,
    audioAlerts.destroy,
    pushNotifications.destroy,
  ]);

  /**
   * Force destroy the complete notification system
   */
  const forceDestroy = useCallback((): void => {
    console.warn("Force destroying notification system...");

    // Force destroy audio alerts
    if (enableAudioAlerts) {
      try {
        audioAlerts.forceDestroy();
      } catch (error) {
        console.error("Failed to force destroy audio alerts:", error);
      }
    }

    // Force destroy push notifications
    if (enablePushNotifications) {
      try {
        pushNotifications.forceDestroy();
      } catch (error) {
        console.error("Failed to force destroy push notifications:", error);
      }
    }

    console.log("Notification system force destruction completed");
  }, [
    enableAudioAlerts,
    enablePushNotifications,
    audioAlerts.forceDestroy,
    pushNotifications.forceDestroy,
  ]);

  // Set up WebSocket event listeners for real-time notifications
  useEffect(() => {
    if (!audioAlerts.isInitialized && !pushNotifications.isInitialized) {
      return;
    }

    // Listen for new task events from WebSocket
    const unsubscribeNewTask = websocketService.on("task:new", (eventData) => {
      const taskData = eventData.payload;
      const priority: TaskPriority = taskData.priority || "medium";

      console.log("New task received via WebSocket:", taskData);

      // Audio alert is already handled by the WebSocket service
      // This is just for additional logging or UI updates
    });

    // Listen for task assigned events
    const unsubscribeAssigned = websocketService.on(
      "task:assigned",
      (eventData) => {
        console.log("Task assigned via WebSocket:", eventData.payload);
        // Audio alert is already handled by the WebSocket service
      },
    );

    // Listen for task completed events
    const unsubscribeCompleted = websocketService.on(
      "task:completed",
      (eventData) => {
        console.log("Task completed via WebSocket:", eventData.payload);
        // Audio alert is already handled by the WebSocket service
      },
    );

    // Cleanup listeners
    return () => {
      unsubscribeNewTask();
      unsubscribeAssigned();
      unsubscribeCompleted();
    };
  }, [audioAlerts.isInitialized, pushNotifications.isInitialized]);

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize) {
      initialize().catch(console.error);
    }
  }, [autoInitialize, initialize]);

  // Auto-request permissions if requested
  useEffect(() => {
    if (
      autoRequestPermissions &&
      (pushNotifications.isInitialized || audioAlerts.isInitialized)
    ) {
      requestPermissions().catch(console.error);
    }
  }, [
    autoRequestPermissions,
    pushNotifications.isInitialized,
    audioAlerts.isInitialized,
    requestPermissions,
  ]);

  return {
    pushNotifications: {
      isSupported: pushNotifications.isSupported,
      isInitialized: pushNotifications.isInitialized,
      isEnabled: pushNotifications.isEnabled,
      permissionStatus: pushNotifications.permissionStatus,
      fcmToken: pushNotifications.fcmToken,
      isLoading: pushNotifications.isLoading,
      error: pushNotifications.error,
    },
    audioAlerts: {
      isSupported: audioAlerts.isSupported,
      isInitialized: audioAlerts.isInitialized,
      isEnabled: audioAlerts.preferences.soundEnabled,
      isLoading: audioAlerts.isLoading,
      error: audioAlerts.error,
    },
    // Actions
    initialize,
    destroy,
    forceDestroy,
    requestPermissions,
    playTaskAlert,
    testNotifications,
    setEnabled,
    setAudioEnabled,
    setPushEnabled,
  };
};
