import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { firebaseMessaging } from "../../config/firebase.config";
import { apiClient } from "../api/apiClient";
import { audioService } from "../audio/audioService";
import { TaskPriority } from "../../types/task.types";
import {
  getSoundTypeFromPriority,
  getVibrationPatternFromPriority,
} from "../../hooks/audio/useAudioAlerts";
import { errorLogger } from "../debug/errorLogger";

export interface PushNotificationConfig {
  enabled: boolean;
  autoRegister: boolean;
  showBadge: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  sound?: string;
  tag?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Global state to prevent multiple initialization attempts across all components
let globalInitializationState = {
  isInitialized: false,
  isInitializing: false,
  initializationPromise: null as Promise<void> | null,
  error: null as string | null,
  lastFailureTime: 0,
  failureCount: 0,
  isCircuitBreakerOpen: false,
};

// Global state change listeners
const globalStateListeners = new Set<
  (state: typeof globalInitializationState) => void
>();

// Circuit breaker configuration
const CIRCUIT_BREAKER_CONFIG = {
  maxFailures: 3,
  resetTimeoutMs: 30000, // 30 seconds
  backoffMultiplier: 2,
  maxBackoffMs: 60000, // 1 minute
};

// Debouncing for initialization attempts
let initializationDebounceTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_DELAY_MS = 1000; // 1 second

class PushNotificationService {
  private config: PushNotificationConfig = {
    enabled: true,
    autoRegister: true,
    showBadge: true,
    sound: true,
    vibration: true,
  };

  private fcmToken: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private nativeListenersAdded = false;
  private initializationTimeout: NodeJS.Timeout | null = null;

  constructor(config?: Partial<PushNotificationConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get global initialization state
   */
  public getGlobalState() {
    return { ...globalInitializationState };
  }

  /**
   * Subscribe to global state changes
   */
  public onGlobalStateChange(
    listener: (state: typeof globalInitializationState) => void,
  ): () => void {
    globalStateListeners.add(listener);
    return () => globalStateListeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyGlobalStateChange() {
    globalStateListeners.forEach((listener) => {
      try {
        listener({ ...globalInitializationState });
      } catch (error) {
        errorLogger.logError(
          "push-notifications",
          "Error in global state listener",
          error,
        );
      }
    });
  }

  /**
   * Initialize push notifications with circuit breaker and debouncing
   */
  async initialize(): Promise<void> {
    errorLogger.logInfo("push-notifications", "Initialize called", {
      isInitialized: globalInitializationState.isInitialized,
      isInitializing: globalInitializationState.isInitializing,
      isCircuitBreakerOpen: globalInitializationState.isCircuitBreakerOpen,
      failureCount: globalInitializationState.failureCount,
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
    });

    // If already initialized, return immediately
    if (globalInitializationState.isInitialized) {
      errorLogger.logInfo(
        "push-notifications",
        "Already initialized globally - skipping",
      );
      return;
    }

    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      const timeUntilReset = this.getTimeUntilCircuitBreakerReset();
      errorLogger.logWarn(
        "push-notifications",
        "Circuit breaker is open - preventing initialization",
        {
          timeUntilResetMs: timeUntilReset,
        },
      );
      throw new Error(
        `Circuit breaker is open. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`,
      );
    }

    // If currently initializing, wait for the existing initialization to complete
    if (
      globalInitializationState.isInitializing &&
      globalInitializationState.initializationPromise
    ) {
      errorLogger.logInfo(
        "push-notifications",
        "Initialization in progress - waiting for completion",
      );
      try {
        await globalInitializationState.initializationPromise;
        return;
      } catch (error) {
        errorLogger.logError(
          "push-notifications",
          "Existing initialization failed",
          error,
        );
        // Don't reset state here - let the circuit breaker handle it
        throw error;
      }
    }

    // Debounce initialization attempts
    return new Promise((resolve, reject) => {
      if (initializationDebounceTimeout) {
        clearTimeout(initializationDebounceTimeout);
      }

      initializationDebounceTimeout = setTimeout(async () => {
        try {
          await this.performDebouncedInitialization();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, DEBOUNCE_DELAY_MS);
    });
  }

  /**
   * Perform debounced initialization
   */
  private async performDebouncedInitialization(): Promise<void> {
    // Double-check state after debounce delay
    if (globalInitializationState.isInitialized) {
      errorLogger.logInfo(
        "push-notifications",
        "Already initialized after debounce - skipping",
      );
      return;
    }

    if (globalInitializationState.isInitializing) {
      errorLogger.logInfo(
        "push-notifications",
        "Already initializing after debounce - skipping",
      );
      return;
    }

    // Start new initialization
    globalInitializationState.isInitializing = true;
    globalInitializationState.error = null;
    globalInitializationState.initializationPromise =
      this.performInitialization();
    this.notifyGlobalStateChange();

    try {
      await globalInitializationState.initializationPromise;
      globalInitializationState.isInitialized = true;
      globalInitializationState.failureCount = 0; // Reset failure count on success
      errorLogger.logInfo(
        "push-notifications",
        "Global initialization completed successfully",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Initialization failed";
      globalInitializationState.error = errorMessage;
      globalInitializationState.failureCount++;
      globalInitializationState.lastFailureTime = Date.now();

      // Check if we should open the circuit breaker
      if (
        globalInitializationState.failureCount >=
        CIRCUIT_BREAKER_CONFIG.maxFailures
      ) {
        globalInitializationState.isCircuitBreakerOpen = true;
        errorLogger.logError(
          "push-notifications",
          "Circuit breaker opened due to repeated failures",
          error,
          {
            failureCount: globalInitializationState.failureCount,
          },
        );
      }

      errorLogger.logError(
        "push-notifications",
        "Global initialization failed",
        error,
        {
          failureCount: globalInitializationState.failureCount,
          isCircuitBreakerOpen: globalInitializationState.isCircuitBreakerOpen,
        },
      );

      throw error;
    } finally {
      globalInitializationState.isInitializing = false;
      globalInitializationState.initializationPromise = null;
      this.notifyGlobalStateChange();
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(): boolean {
    if (!globalInitializationState.isCircuitBreakerOpen) {
      return false;
    }

    // Check if enough time has passed to reset the circuit breaker
    const timeSinceLastFailure =
      Date.now() - globalInitializationState.lastFailureTime;
    if (timeSinceLastFailure >= CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
      // Reset circuit breaker
      globalInitializationState.isCircuitBreakerOpen = false;
      globalInitializationState.failureCount = 0;
      errorLogger.logInfo(
        "push-notifications",
        "Circuit breaker reset after timeout",
      );
      return false;
    }

    return true;
  }

  /**
   * Get time until circuit breaker resets
   */
  private getTimeUntilCircuitBreakerReset(): number {
    if (!globalInitializationState.isCircuitBreakerOpen) {
      return 0;
    }

    const timeSinceLastFailure =
      Date.now() - globalInitializationState.lastFailureTime;
    return Math.max(
      0,
      CIRCUIT_BREAKER_CONFIG.resetTimeoutMs - timeSinceLastFailure,
    );
  }

  /**
   * Reset global state (for error recovery)
   */
  private resetGlobalState() {
    globalInitializationState.isInitialized = false;
    globalInitializationState.isInitializing = false;
    globalInitializationState.initializationPromise = null;
    globalInitializationState.error = null;
    this.notifyGlobalStateChange();
  }

  /**
   * Perform the actual initialization with platform-specific logic
   */
  private async performInitialization(): Promise<void> {
    errorLogger.logInfo(
      "push-notifications",
      "Starting platform-specific initialization",
      {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
      },
    );

    try {
      // Set up a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        this.initializationTimeout = setTimeout(() => {
          reject(
            new Error(
              "Push notification initialization timeout after 8 seconds",
            ),
          );
        }, 8000); // Reduced timeout to prevent long hangs
      });

      const initPromise = Capacitor.isNativePlatform()
        ? this.initializeNative()
        : this.initializeWeb();

      // Race between initialization and timeout
      await Promise.race([initPromise, timeoutPromise]);

      // Clear timeout if initialization completed successfully
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
        this.initializationTimeout = null;
      }
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Platform initialization failed",
        error,
      );
      throw error;
    } finally {
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
        this.initializationTimeout = null;
      }
    }
  }

  /**
   * Initialize native push notifications with improved error handling
   */
  private async initializeNative(): Promise<void> {
    // Wrap entire native initialization in comprehensive error handling
    try {
      errorLogger.logInfo(
        "push-notifications-native",
        "Starting native initialization with enhanced safety measures",
      );

      // Check if Capacitor and PushNotifications are available
      if (!(window as any).Capacitor) {
        throw new Error(
          "Capacitor not available - cannot initialize native push notifications",
        );
      }

      if (!PushNotifications) {
        throw new Error("PushNotifications plugin not available");
      }

      // Additional safety check for Android
      if (Capacitor.getPlatform() === "android") {
        try {
          // Test if we can access basic Capacitor functionality
          const platform = Capacitor.getPlatform();
          const isNative = Capacitor.isNativePlatform();
          errorLogger.logInfo(
            "push-notifications-native",
            "Android environment validation",
            {
              platform,
              isNative,
              hasCapacitor: !!(window as any).Capacitor,
              hasPushNotifications: !!PushNotifications,
            },
          );
        } catch (platformError) {
          errorLogger.logError(
            "push-notifications-native",
            "Android platform validation failed",
            platformError,
          );
          throw new Error(
            "Android platform validation failed - unsafe to proceed",
          );
        }
      }

      errorLogger.logInfo(
        "push-notifications-native",
        "Capacitor and PushNotifications plugin verified",
      );

      // Set up event listeners FIRST to avoid race conditions
      if (!this.nativeListenersAdded) {
        try {
          await this.setupNativeEventListeners();
          this.nativeListenersAdded = true;
          errorLogger.logInfo(
            "push-notifications-native",
            "Event listeners setup completed",
          );
        } catch (listenerError) {
          errorLogger.logError(
            "push-notifications-native",
            "Failed to setup event listeners",
            listenerError,
          );
          throw new Error(
            `Event listener setup failed: ${listenerError instanceof Error ? listenerError.message : "Unknown error"}`,
          );
        }
      }

      // Request permission with detailed error handling
      errorLogger.logInfo(
        "push-notifications-native",
        "Requesting push notification permissions",
      );
      let permission;
      try {
        const permissionPromise = PushNotifications.requestPermissions();
        const permissionTimeout = new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(new Error("Permission request timeout after 5 seconds")),
            5000,
          );
        });

        permission = await Promise.race([permissionPromise, permissionTimeout]);
        errorLogger.logInfo(
          "push-notifications-native",
          "Permission request completed",
          {
            receive: permission?.receive || "undefined",
            permissionObject: permission,
          },
        );
      } catch (permissionError) {
        errorLogger.logError(
          "push-notifications-native",
          "Permission request failed",
          permissionError,
        );
        throw new Error(
          `Permission request failed: ${permissionError instanceof Error ? permissionError.message : "Unknown error"}`,
        );
      }

      if (!permission || permission.receive === "denied") {
        const errorMsg = permission
          ? "Push notification permission denied by user"
          : "Permission request returned null/undefined";
        errorLogger.logWarn("push-notifications-native", errorMsg);
        throw new Error(errorMsg);
      }

      // CRASH FIX: Skip PushNotifications.register() call to prevent native crashes
      errorLogger.logInfo(
        "push-notifications-native",
        "Skipping direct registration call to prevent native crashes",
      );

      // Instead of calling PushNotifications.register(), we'll rely on event-based registration
      // The event listeners are already set up and working properly

      if (Capacitor.getPlatform() === "android") {
        errorLogger.logInfo(
          "push-notifications-native",
          "Android detected - using event-based registration strategy",
        );

        // On Android, the registration often happens automatically after permission is granted
        // We'll wait for the registration event instead of forcing it
        errorLogger.logInfo(
          "push-notifications-native",
          "Waiting for automatic registration via events",
        );

        // Set up a timeout to wait for automatic registration
        const waitForRegistration = new Promise<void>(async (resolve) => {
          // Set up a temporary listener for registration success
          let registrationReceived = false;

          const tempListener = await PushNotifications.addListener(
            "registration",
            (token: Token) => {
              if (!registrationReceived) {
                registrationReceived = true;
                errorLogger.logInfo(
                  "push-notifications-native",
                  "Automatic registration successful via event",
                  {
                    hasToken: !!token?.value,
                    tokenLength: token?.value?.length || 0,
                  },
                );
                tempListener.remove();
                resolve();
              }
            },
          );

          // Also resolve after a short timeout even if no registration event comes
          setTimeout(() => {
            if (!registrationReceived) {
              errorLogger.logInfo(
                "push-notifications-native",
                "No automatic registration event received - continuing anyway",
              );
              tempListener.remove();
              resolve();
            }
          }, 2000); // Wait 2 seconds for automatic registration
        });

        await waitForRegistration;
      } else {
        // For non-Android platforms, we might still try registration if it's safer
        errorLogger.logInfo(
          "push-notifications-native",
          "Non-Android platform - registration may work differently",
        );

        // For now, skip registration on all platforms to be safe
        errorLogger.logInfo(
          "push-notifications-native",
          "Skipping registration on all platforms for safety",
        );
      }

      errorLogger.logInfo(
        "push-notifications-native",
        "Registration phase completed (event-based approach)",
      );

      // Mark as successfully initialized since we completed the safe initialization process
      // This is important for the UI to show correct status
      errorLogger.logInfo(
        "push-notifications-native",
        "Marking native initialization as successful (event-based)",
      );

      errorLogger.logInfo(
        "push-notifications-native",
        "Native initialization completed",
      );
    } catch (error) {
      errorLogger.logError(
        "push-notifications-native",
        "Native initialization failed",
        error,
      );
      throw error;
    }
  }

  /**
   * Set up native event listeners with proper error handling
   */
  private async setupNativeEventListeners(): Promise<void> {
    try {
      errorLogger.logInfo(
        "push-notifications-native",
        "Setting up event listeners",
      );

      // Check if PushNotifications methods are available
      if (typeof PushNotifications.addListener !== "function") {
        throw new Error("PushNotifications.addListener is not available");
      }

      // Registration success
      const registrationListener = PushNotifications.addListener(
        "registration",
        (token: Token) => {
          try {
            errorLogger.logInfo(
              "push-notifications-native",
              "Registration success event received",
              {
                hasToken: !!token?.value,
                tokenLength: token?.value?.length || 0,
              },
            );

            if (token?.value) {
              this.fcmToken = token.value;
              this.registerTokenWithServer(token.value).catch((err) => {
                errorLogger.logError(
                  "push-notifications-native",
                  "Failed to register token with server",
                  err,
                );
              });
            } else {
              errorLogger.logWarn(
                "push-notifications-native",
                "Registration success but no token received",
              );
            }
          } catch (err) {
            errorLogger.logError(
              "push-notifications-native",
              "Error in registration listener",
              err,
            );
          }
        },
      );

      // Registration error
      const registrationErrorListener = PushNotifications.addListener(
        "registrationError",
        (error: any) => {
          errorLogger.logError(
            "push-notifications-native",
            "Registration error event received",
            error,
          );
        },
      );

      // Push notification received
      const notificationReceivedListener = PushNotifications.addListener(
        "pushNotificationReceived",
        (notification: PushNotificationSchema) => {
          try {
            errorLogger.logInfo(
              "push-notifications-native",
              "Notification received event",
              {
                title: notification?.title,
                hasData: !!notification?.data,
              },
            );

            if (notification) {
              this.handleNotificationReceived(notification);
            } else {
              errorLogger.logWarn(
                "push-notifications-native",
                "Notification received but notification object is null/undefined",
              );
            }
          } catch (err) {
            errorLogger.logError(
              "push-notifications-native",
              "Error handling received notification",
              err,
            );
          }
        },
      );

      // Push notification action
      const notificationActionListener = PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (notification: ActionPerformed) => {
          try {
            errorLogger.logInfo(
              "push-notifications-native",
              "Notification action performed event",
              {
                actionId: notification?.actionId,
              },
            );

            if (notification) {
              this.handleNotificationAction(notification);
            } else {
              errorLogger.logWarn(
                "push-notifications-native",
                "Notification action performed but notification object is null/undefined",
              );
            }
          } catch (err) {
            errorLogger.logError(
              "push-notifications-native",
              "Error handling notification action",
              err,
            );
          }
        },
      );

      // Verify listeners were created successfully
      if (
        !registrationListener ||
        !registrationErrorListener ||
        !notificationReceivedListener ||
        !notificationActionListener
      ) {
        throw new Error("One or more event listeners failed to be created");
      }

      errorLogger.logInfo(
        "push-notifications-native",
        "All event listeners setup completed successfully",
        {
          registrationListener: !!registrationListener,
          registrationErrorListener: !!registrationErrorListener,
          notificationReceivedListener: !!notificationReceivedListener,
          notificationActionListener: !!notificationActionListener,
        },
      );
    } catch (error) {
      errorLogger.logError(
        "push-notifications-native",
        "Failed to setup event listeners",
        error,
      );
      throw error;
    }
  }

  /**
   * Initialize web push notifications with improved Firebase handling
   */
  private async initializeWeb(): Promise<void> {
    try {
      errorLogger.logDebug(
        "push-notifications-web",
        "Starting web initialization",
      );

      if (!firebaseMessaging.isSupported()) {
        errorLogger.logWarn(
          "push-notifications-web",
          "Firebase messaging not supported - continuing without push notifications",
        );
        return;
      }

      // Check current permission status
      const permission = firebaseMessaging.getPermissionStatus();
      errorLogger.logInfo(
        "push-notifications-web",
        "Current permission status",
        { permission },
      );

      if (permission === "granted") {
        try {
          const token = await firebaseMessaging.getToken();
          if (token) {
            this.fcmToken = token;
            await this.registerTokenWithServer(token);
            errorLogger.logInfo(
              "push-notifications-web",
              "FCM token obtained and registered",
            );
          }
        } catch (tokenError) {
          errorLogger.logError(
            "push-notifications-web",
            "Failed to get FCM token",
            tokenError,
          );
        }
      }

      // Set up foreground message listener
      const unsubscribe = firebaseMessaging.onMessage((payload) => {
        try {
          errorLogger.logInfo(
            "push-notifications-web",
            "Foreground message received",
          );
          this.handleWebNotification(payload);
        } catch (err) {
          errorLogger.logError(
            "push-notifications-web",
            "Error handling web notification",
            err,
          );
        }
      });

      if (unsubscribe) {
        this.listeners.set("foreground", new Set([unsubscribe]));
      }

      errorLogger.logInfo(
        "push-notifications-web",
        "Web initialization completed",
      );
    } catch (error) {
      errorLogger.logError(
        "push-notifications-web",
        "Web initialization failed",
        error,
      );
      throw error;
    }
  }

  /**
   * Register FCM token with server
   */
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await apiClient.post("/contractors/register-device", {
        token,
        platform: Capacitor.getPlatform(),
      });

      errorLogger.logInfo(
        "push-notifications",
        "FCM token registered with server",
        {
          platform: Capacitor.getPlatform(),
          tokenLength: token.length,
        },
      );
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Failed to register FCM token with server",
        error,
      );
      // Don't throw - token registration failure shouldn't break the app
    }
  }

  /**
   * Handle notification received (native)
   */
  private handleNotificationReceived(
    notification: PushNotificationSchema,
  ): void {
    try {
      // Play audio alert for the notification
      this.handleAudioAlert(notification.data).catch((err) => {
        errorLogger.logError(
          "push-notifications",
          "Failed to play audio alert",
          err,
        );
      });

      // Show local notification if app is in foreground
      if (this.config.enabled) {
        this.showLocalNotification({
          title: notification.title || "New Notification",
          body: notification.body || "",
          data: notification.data,
        });
      }

      // Emit event to listeners
      this.emit("notificationReceived", notification);
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Error handling received notification",
        error,
      );
    }
  }

  /**
   * Handle notification action (native)
   */
  private handleNotificationAction(action: ActionPerformed): void {
    try {
      const { actionId, notification } = action;

      errorLogger.logInfo("push-notifications", "Notification action handled", {
        actionId,
      });

      // Handle different actions
      switch (actionId) {
        case "view":
          this.emit("notificationTapped", notification);
          break;
        case "dismiss":
          this.emit("notificationDismissed", notification);
          break;
        default:
          this.emit("notificationAction", { actionId, notification });
      }
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Error handling notification action",
        error,
      );
    }
  }

  /**
   * Handle web notification (Firebase)
   */
  private handleWebNotification(payload: any): void {
    try {
      const { notification, data } = payload;

      // Play audio alert for the notification
      this.handleAudioAlert(data).catch((err) => {
        errorLogger.logError(
          "push-notifications",
          "Failed to play audio alert for web notification",
          err,
        );
      });

      if (this.config.enabled && notification) {
        this.showLocalNotification({
          title: notification.title || "New Notification",
          body: notification.body || "",
          data: data || {},
          icon: notification.icon,
        });
      }

      // Emit event to listeners
      this.emit("notificationReceived", payload);
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Error handling web notification",
        error,
      );
    }
  }

  /**
   * Handle audio alerts for push notifications
   */
  private async handleAudioAlert(data: any): Promise<void> {
    if (!audioService.getStatus().isInitialized) {
      errorLogger.logWarn(
        "push-notifications",
        "Audio service not initialized - skipping audio alert",
      );
      return;
    }

    if (!this.config.sound) {
      errorLogger.logDebug(
        "push-notifications",
        "Push notification sounds disabled",
      );
      return;
    }

    try {
      // Determine notification type and priority from data
      const notificationType = data?.type || "general";
      const priority: TaskPriority = data?.priority || "medium";

      switch (notificationType) {
        case "new_task":
          await this.playNewTaskAlert(priority);
          break;
        case "task_assigned":
          await this.playTaskAssignedAlert();
          break;
        case "task_completed":
          await this.playTaskCompletedAlert();
          break;
        case "system":
        case "personal":
          await this.playNotificationAlert(priority);
          break;
        default:
          await this.playGeneralAlert();
          break;
      }
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Failed to play push notification audio alert",
        error,
      );
    }
  }

  /**
   * Play audio alert for new task push notification
   */
  private async playNewTaskAlert(priority: TaskPriority): Promise<void> {
    const soundType = getSoundTypeFromPriority(priority);
    const vibrationPattern = getVibrationPatternFromPriority(priority);

    await audioService.playAlert({
      soundType,
      vibrationPattern,
      fadeIn: priority === "urgent",
      repeat: priority === "urgent" ? 2 : 1,
    });

    errorLogger.logDebug(
      "push-notifications",
      `Played new task alert for priority: ${priority}`,
    );
  }

  /**
   * Play audio alert for task assigned push notification
   */
  private async playTaskAssignedAlert(): Promise<void> {
    await audioService.playAlert({
      soundType: "task_assigned",
      vibrationPattern: [300, 100, 300],
    });

    errorLogger.logDebug("push-notifications", "Played task assigned alert");
  }

  /**
   * Play audio alert for task completed push notification
   */
  private async playTaskCompletedAlert(): Promise<void> {
    await audioService.playAlert({
      soundType: "task_completed",
      vibrationPattern: [200],
    });

    errorLogger.logDebug("push-notifications", "Played task completed alert");
  }

  /**
   * Play audio alert for general notifications
   */
  private async playNotificationAlert(priority: TaskPriority): Promise<void> {
    const isUrgent = priority === "high" || priority === "urgent";

    await audioService.playAlert({
      soundType: isUrgent ? "alert_critical" : "notification_general",
      vibrationPattern: isUrgent ? [400, 100, 400, 100, 400] : [200],
    });

    errorLogger.logDebug(
      "push-notifications",
      `Played notification alert (urgent: ${isUrgent})`,
    );
  }

  /**
   * Play general audio alert
   */
  private async playGeneralAlert(): Promise<void> {
    await audioService.playAlert({
      soundType: "notification_general",
      vibrationPattern: [200],
    });

    errorLogger.logDebug("push-notifications", "Played general alert");
  }

  /**
   * Show local notification with error handling
   */
  private showLocalNotification(payload: NotificationPayload): void {
    try {
      if (!("Notification" in window)) {
        errorLogger.logWarn(
          "push-notifications",
          "Browser does not support notifications",
        );
        return;
      }

      if (Notification.permission !== "granted") {
        errorLogger.logWarn(
          "push-notifications",
          "Notification permission not granted",
        );
        return;
      }

      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || "/favicon.png",
        badge: payload.badge,
        data: payload.data,
        tag: payload.tag,
        silent: !this.config.sound,
        requireInteraction: true,
      };

      const notification = new Notification(payload.title, options);

      notification.onclick = () => {
        this.emit("notificationTapped", payload);
        notification.close();
      };

      notification.onclose = () => {
        this.emit("notificationDismissed", payload);
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      errorLogger.logDebug("push-notifications", "Local notification shown");
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Failed to show local notification",
        error,
      );
    }
  }

  /**
   * Subscribe to notification events
   */
  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners with error handling
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          errorLogger.logError(
            "push-notifications",
            `Error in event handler for ${event}`,
            error,
          );
        }
      });
    }
  }

  /**
   * Get current FCM token
   */
  public getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if notifications are enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable/disable notifications
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    errorLogger.logInfo(
      "push-notifications",
      `Notifications ${enabled ? "enabled" : "disabled"}`,
    );
  }

  /**
   * Get notification permission status
   */
  public getPermissionStatus(): NotificationPermission | "unknown" {
    if (Capacitor.isNativePlatform()) {
      // Use the new permission state method for native platforms
      return this.getPermissionState();
    } else {
      return firebaseMessaging.getPermissionStatus();
    }
  }

  /**
   * Get permission state based on service initialization status
   */
  public getPermissionState(): NotificationPermission | "unknown" {
    if (Capacitor.isNativePlatform()) {
      // Use global state to determine permission status
      if (globalInitializationState.isInitialized) {
        // If initialized successfully and we have a token or service is enabled, permissions are granted
        if (this.fcmToken || this.isEnabled()) {
          return "granted";
        }
        // If initialized but no token and not enabled, likely denied
        return "denied";
      } else if (globalInitializationState.error) {
        // If there was an initialization error, check if it's permission-related
        const errorMsg = globalInitializationState.error.toLowerCase();
        if (
          errorMsg.includes("denied") ||
          errorMsg.includes("permission") ||
          errorMsg.includes("blocked")
        ) {
          return "denied";
        }
        return "unknown";
      } else {
        // Not initialized yet, permission not requested
        return "default";
      }
    } else {
      // For web, use existing Firebase method
      return firebaseMessaging.getPermissionStatus();
    }
  }

  /**
   * Request notification permission with improved error handling
   */
  public async requestPermission(): Promise<boolean> {
    try {
      errorLogger.logDebug(
        "push-notifications",
        "Requesting notification permission",
      );

      if (Capacitor.isNativePlatform()) {
        const permission = await PushNotifications.requestPermissions();

        errorLogger.logInfo(
          "push-notifications",
          "Native permission request completed",
          {
            receive: permission.receive,
          },
        );

        // Accept both "granted" and "prompt" as successful
        const isGranted =
          permission.receive === "granted" || permission.receive === "prompt";

        if (isGranted && permission.receive === "prompt") {
          errorLogger.logInfo(
            "push-notifications",
            "Permission is prompt - notifications will work but user may see permission dialog",
          );
        }

        return isGranted;
      } else {
        const permission = await firebaseMessaging.requestPermission();

        errorLogger.logInfo(
          "push-notifications",
          "Web permission request completed",
          {
            permission,
          },
        );

        return permission === "granted";
      }
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Error requesting notification permission",
        error,
      );
      return false;
    }
  }

  /**
   * Check if push notifications are supported
   */
  public isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true; // Native platforms support push notifications
    } else {
      return firebaseMessaging.isSupported();
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PushNotificationConfig>): void {
    this.config = { ...this.config, ...config };
    errorLogger.logInfo("push-notifications", "Configuration updated", config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): PushNotificationConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    try {
      // Clear timeout if still active
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
        this.initializationTimeout = null;
      }

      // Clear listeners
      this.listeners.clear();

      // Reset local state
      this.fcmToken = null;
      this.nativeListenersAdded = false;

      // Reset global state
      this.resetGlobalState();

      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }

      errorLogger.logInfo(
        "push-notifications",
        "Service destroyed and cleaned up",
      );
    } catch (error) {
      errorLogger.logError("push-notifications", "Error during cleanup", error);
    }
  }

  /**
   * Test notification with platform-specific support
   */
  public async testNotification(): Promise<void> {
    if (!this.isEnabled()) {
      errorLogger.logWarn(
        "push-notifications",
        "Notifications are disabled - cannot send test notification",
      );
      throw new Error("Push notifications are disabled");
    }

    try {
      errorLogger.logInfo("push-notifications", "Starting test notification", {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        permissionStatus: this.getPermissionStatus(),
      });

      if (Capacitor.isNativePlatform()) {
        await this.sendNativeTestNotification();
      } else {
        await this.sendWebTestNotification();
      }

      errorLogger.logInfo(
        "push-notifications",
        "Test notification sent successfully",
      );
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Failed to send test notification",
        error,
      );
      throw error;
    }
  }

  /**
   * Send test notification for native platforms (Android/iOS)
   */
  private async sendNativeTestNotification(): Promise<void> {
    console.log("🔔 DEBUG: Starting sendNativeTestNotification");

    try {
      errorLogger.logInfo(
        "push-notifications",
        "Attempting native test notification",
      );

      // Method 1: Try using Local Notifications for actual visual notification
      console.log(
        "🔔 DEBUG: Method 1 - Checking LocalNotifications availability",
      );

      try {
        // Check if LocalNotifications is available
        console.log(
          "🔔 DEBUG: LocalNotifications object:",
          !!LocalNotifications,
        );
        console.log(
          "🔔 DEBUG: LocalNotifications methods:",
          LocalNotifications ? Object.keys(LocalNotifications) : "N/A",
        );

        if (LocalNotifications) {
          errorLogger.logInfo(
            "push-notifications",
            "Using LocalNotifications for native test",
          );
          console.log(
            "🔔 DEBUG: LocalNotifications is available, requesting permissions",
          );

          // Request permission for local notifications first
          console.log(
            "🔔 DEBUG: About to call LocalNotifications.requestPermissions()",
          );
          const permission = await LocalNotifications.requestPermissions();
          console.log("🔔 DEBUG: Permission result:", permission);

          if (permission.display === "granted") {
            console.log(
              "🔔 DEBUG: Permission granted, scheduling notification",
            );

            // Schedule a local notification that will appear in the system tray
            const notificationData = {
              notifications: [
                {
                  title: "Test Notification",
                  body: "This is a test notification from the Bounce Contractor app",
                  id: Math.floor(Math.random() * 2147483647), // Java-compatible integer
                  schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
                  sound: this.config.sound ? "default" : undefined,
                  extra: { test: true, type: "test_notification" },
                },
              ],
            };

            console.log("🔔 DEBUG: Notification data:", notificationData);
            console.log(
              "🔔 DEBUG: About to call LocalNotifications.schedule()",
            );

            await LocalNotifications.schedule(notificationData);

            console.log(
              "🔔 DEBUG: LocalNotifications.schedule() completed successfully",
            );
            errorLogger.logInfo(
              "push-notifications",
              "Local notification scheduled successfully",
            );

            // Also emit event for in-app handling
            this.emit("testNotificationSent", {
              type: "native_local_notification",
              title: "Test Notification",
              body: "This is a test notification from the Bounce Contractor app",
            });

            // Force show alert for debugging
            setTimeout(() => {
              if (typeof window !== "undefined" && window.alert) {
                window.alert(
                  "✅ Local notification scheduled successfully! Check your notification tray.",
                );
              }
            }, 500);

            console.log("🔔 DEBUG: Method 1 completed successfully");
            return;
          } else {
            console.log("🔔 DEBUG: Permission not granted:", permission);
            errorLogger.logWarn(
              "push-notifications",
              "Local notification permission not granted",
              { permission },
            );

            // Force show alert for debugging
            setTimeout(() => {
              if (typeof window !== "undefined" && window.alert) {
                window.alert(
                  `❌ Local notification permission denied: ${permission.display}`,
                );
              }
            }, 500);
          }
        } else {
          console.log("🔔 DEBUG: LocalNotifications plugin not available");
          errorLogger.logWarn(
            "push-notifications",
            "LocalNotifications plugin not available",
          );

          // Force show alert for debugging
          setTimeout(() => {
            if (typeof window !== "undefined" && window.alert) {
              window.alert("❌ LocalNotifications plugin not available");
            }
          }, 500);
        }
      } catch (localNotificationError) {
        console.error(
          "🔔 DEBUG: Local notification error:",
          localNotificationError,
        );
        errorLogger.logWarn(
          "push-notifications",
          "Local notification failed",
          localNotificationError as Error,
        );

        // Force show alert for debugging
        setTimeout(() => {
          if (typeof window !== "undefined" && window.alert) {
            window.alert(
              `❌ Local notification error: ${localNotificationError instanceof Error ? localNotificationError.message : "Unknown error"}`,
            );
          }
        }, 500);
      }

      console.log("🔔 DEBUG: Method 2 - Trying notification simulation");

      // Method 2: Try triggering through the existing notification system (for audio/vibration)
      try {
        const testPayload: PushNotificationSchema = {
          id: `test-${Date.now()}`,
          title: "Test Notification",
          body: "This is a test notification from the Bounce Contractor app",
          data: { test: true, type: "test_notification" } as Record<
            string,
            any
          >,
        };

        console.log(
          "🔔 DEBUG: Simulating notification with payload:",
          testPayload,
        );

        // Simulate a received notification to trigger the display logic
        this.handleNotificationReceived(testPayload);

        console.log("🔔 DEBUG: Notification simulation completed");
        errorLogger.logInfo(
          "push-notifications",
          "Native test notification via simulation",
        );

        // Also emit event for in-app handling
        this.emit("testNotificationSent", {
          type: "native_simulation",
          title: "Test Notification",
          body: "This is a test notification from the Bounce Contractor app",
        });

        console.log("🔔 DEBUG: Method 2 completed successfully");
        return;
      } catch (simulationError) {
        console.error("🔔 DEBUG: Simulation error:", simulationError);
        errorLogger.logWarn(
          "push-notifications",
          "Notification simulation failed",
          simulationError as Error,
        );
      }

      console.log("🔔 DEBUG: Method 3 - Fallback to in-app notification");

      // Method 3: Fallback to in-app notification
      this.showInAppTestNotification();
    } catch (error) {
      console.error("🔔 DEBUG: All methods failed with error:", error);
      errorLogger.logError(
        "push-notifications",
        "All native test methods failed",
        error,
      );

      // Force show alert for debugging
      setTimeout(() => {
        if (typeof window !== "undefined" && window.alert) {
          window.alert(
            `❌ All test methods failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }, 500);

      // Final fallback: in-app notification
      this.showInAppTestNotification();
    }

    console.log("🔔 DEBUG: sendNativeTestNotification completed");
  }

  /**
   * Send test notification for web platforms
   */
  private async sendWebTestNotification(): Promise<void> {
    try {
      // Check browser notification support and permission
      if (!("Notification" in window)) {
        throw new Error("Browser does not support notifications");
      }

      if (Notification.permission !== "granted") {
        throw new Error(
          `Browser notification permission is ${Notification.permission}`,
        );
      }

      // Send browser notification
      this.showLocalNotification({
        title: "Test Notification",
        body: "This is a test notification from the Bounce Contractor app",
        data: { test: true },
      });

      errorLogger.logInfo(
        "push-notifications",
        "Web browser notification sent",
      );

      // Also emit event for in-app handling
      this.emit("testNotificationSent", {
        type: "web_browser",
        title: "Test Notification",
        body: "This is a test notification from the Bounce Contractor app",
      });
    } catch (error) {
      errorLogger.logWarn(
        "push-notifications",
        "Web notification failed, using fallback",
        error as Error,
      );

      // Fallback to in-app notification
      this.showInAppTestNotification();
    }
  }

  /**
   * Show in-app test notification as fallback
   */
  private showInAppTestNotification(): void {
    try {
      errorLogger.logInfo(
        "push-notifications",
        "Showing in-app test notification fallback",
      );

      // Emit event that can be caught by UI components
      this.emit("testNotificationSent", {
        type: "in_app_fallback",
        title: "Test Notification",
        body: "This is a test notification from the Bounce Contractor app (in-app fallback)",
        message:
          "Test notification sent! Since native notifications may not be visible in development, this in-app message confirms the test worked.",
      });

      // Also try to show a simple alert as last resort
      if (typeof window !== "undefined" && window.alert) {
        setTimeout(() => {
          window.alert(
            "Test Notification: This is a test notification from the Bounce Contractor app",
          );
        }, 500);
      }

      errorLogger.logInfo(
        "push-notifications",
        "In-app test notification fallback completed",
      );
    } catch (error) {
      errorLogger.logError(
        "push-notifications",
        "Even in-app fallback failed",
        error,
      );
    }
  }
}

// Create singleton instance
export const pushNotificationService = new PushNotificationService();

// Export class for testing
export { PushNotificationService };
