import React, { useState, useEffect } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonItem,
  IonLabel,
  IonRow,
  IonToggle,
  IonText,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonNote,
} from "@ionic/react";
import {
  volumeHighOutline,
  volumeMuteOutline,
  notificationsOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  playOutline,
  powerOutline,
  warningOutline,
  refreshOutline,
} from "ionicons/icons";
import { useNotificationSystem } from "../hooks/notifications/useNotificationSystem";
import { TaskPriority } from "../types/task.types";
import { errorLogger } from "../services/debug/errorLogger";
import { APP_CONFIG } from "../config/app.config";

interface AudioAlertsDemoProps {
  className?: string;
}

/**
 * Demo component for testing audio alerts and push notifications
 * This component provides a UI to test all notification features
 */
// System state interface for persistence
interface SystemState {
  masterEnabled: boolean;
  audioEnabled: boolean;
  pushEnabled: boolean;
  lastToggleTime: number;
}

export const AudioAlertsDemo: React.FC<AudioAlertsDemoProps> = ({
  className,
}) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );
  const [destroyError, setDestroyError] = useState<string | null>(null);

  // System state management
  const [systemState, setSystemState] = useState<SystemState>(() => {
    try {
      const stored = localStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.SYSTEM_INITIALIZATION_STATE,
      );
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load system state:", error);
    }
    return {
      masterEnabled: false,
      audioEnabled: false,
      pushEnabled: false,
      lastToggleTime: 0,
    };
  });

  // FIXED: Disable auto-initialization to prevent crashes
  const notificationSystem = useNotificationSystem({
    autoInitialize: false, // ← CRASH FIX: No automatic initialization
    autoRequestPermissions: false,
  });

  // Persist system state
  const persistSystemState = (newState: SystemState) => {
    try {
      localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.SYSTEM_INITIALIZATION_STATE,
        JSON.stringify(newState),
      );
      setSystemState(newState);
    } catch (error) {
      console.error("Failed to persist system state:", error);
    }
  };

  // Sync component state with actual system state on mount
  useEffect(() => {
    const syncSystemState = async () => {
      try {
        // Check if localStorage indicates system should be enabled
        if (
          systemState.masterEnabled ||
          systemState.audioEnabled ||
          systemState.pushEnabled
        ) {
          // Check if the actual notification system is initialized
          const audioInitialized = notificationSystem.audioAlerts.isInitialized;
          const pushInitialized =
            notificationSystem.pushNotifications.isInitialized;

          errorLogger.logInfo("audio-alerts-demo", "State sync check", {
            storedMasterEnabled: systemState.masterEnabled,
            storedAudioEnabled: systemState.audioEnabled,
            storedPushEnabled: systemState.pushEnabled,
            actualAudioInitialized: audioInitialized,
            actualPushInitialized: pushInitialized,
          });

          // If localStorage says enabled but system isn't initialized, initialize it
          if (!audioInitialized && !pushInitialized) {
            errorLogger.logInfo(
              "audio-alerts-demo",
              "Auto-initializing system to match stored preferences",
            );
            await handleSystemInitialization();
          } else {
            errorLogger.logInfo(
              "audio-alerts-demo",
              "System already initialized, state in sync",
            );
          }
        } else {
          errorLogger.logInfo(
            "audio-alerts-demo",
            "Stored preferences indicate system should be disabled",
          );
        }
      } catch (error) {
        errorLogger.logError(
          "audio-alerts-demo",
          "Failed to sync system state",
          error,
        );
      }
    };

    // Run sync after component mounts
    const timeoutId = setTimeout(syncSystemState, 100);

    return () => clearTimeout(timeoutId);
  }, []); // Only run once on mount

  // Update toggle states to reflect actual system status
  useEffect(() => {
    const updateToggleStates = () => {
      const audioInitialized = notificationSystem.audioAlerts.isInitialized;
      const pushInitialized =
        notificationSystem.pushNotifications.isInitialized;
      const masterShouldBeEnabled = audioInitialized || pushInitialized;

      // If actual system state doesn't match stored state, update stored state
      if (
        systemState.masterEnabled !== masterShouldBeEnabled ||
        systemState.audioEnabled !== audioInitialized ||
        systemState.pushEnabled !== pushInitialized
      ) {
        const correctedState = {
          masterEnabled: masterShouldBeEnabled,
          audioEnabled: audioInitialized,
          pushEnabled: pushInitialized,
          lastToggleTime: Date.now(),
        };

        errorLogger.logInfo(
          "audio-alerts-demo",
          "Correcting stored state to match actual system",
          {
            old: systemState,
            new: correctedState,
          },
        );

        persistSystemState(correctedState);
      }
    };

    // Update toggle states when system initialization status changes
    updateToggleStates();
  }, [
    notificationSystem.audioAlerts.isInitialized,
    notificationSystem.pushNotifications.isInitialized,
    systemState.masterEnabled,
    systemState.audioEnabled,
    systemState.pushEnabled,
  ]);

  const handleTestTaskAlert = async (priority: TaskPriority) => {
    try {
      await notificationSystem.playTaskAlert(priority);
    } catch (error) {
      console.error("Failed to test task alert:", error);
    }
  };

  const handleTestAllNotifications = async () => {
    try {
      await notificationSystem.testNotifications();
    } catch (error) {
      console.error("Failed to test notifications:", error);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const results = await notificationSystem.requestPermissions();
      console.log("Permission results:", results);
    } catch (error) {
      console.error("Failed to request permissions:", error);
    }
  };

  const handleInitializeSystem = async () => {
    if (isInitializing) return;

    setIsInitializing(true);
    setInitializationError(null);

    try {
      errorLogger.logInfo(
        "audio-alerts-demo",
        "Manual initialization started",
        {
          audioEnabled: notificationSystem.audioAlerts.isEnabled,
          pushEnabled: notificationSystem.pushNotifications.isEnabled,
          audioInitialized: notificationSystem.audioAlerts.isInitialized,
          pushInitialized: notificationSystem.pushNotifications.isInitialized,
        },
      );

      await notificationSystem.initialize();

      // Log final state after initialization
      errorLogger.logInfo(
        "audio-alerts-demo",
        "Manual initialization completed",
        {
          audioInitialized: notificationSystem.audioAlerts.isInitialized,
          pushInitialized: notificationSystem.pushNotifications.isInitialized,
          audioError: notificationSystem.audioAlerts.error,
          pushError: notificationSystem.pushNotifications.error,
        },
      );

      // Check if systems are actually working (more lenient success criteria)
      const audioSuccess =
        notificationSystem.audioAlerts.isInitialized ||
        (notificationSystem.audioAlerts.isSupported &&
          !notificationSystem.audioAlerts.error);

      const pushSuccess =
        notificationSystem.pushNotifications.isInitialized ||
        (!notificationSystem.pushNotifications.error &&
          notificationSystem.pushNotifications.isSupported);

      // Success if at least one system is working
      if (!audioSuccess && !pushSuccess) {
        throw new Error(
          "Both audio alerts and push notifications failed to initialize",
        );
      } else if (!audioSuccess && pushSuccess) {
        console.warn("Audio alerts failed but push notifications are working");
        errorLogger.logInfo(
          "audio-alerts-demo",
          "Partial success: Push notifications working, audio alerts failed",
        );
      } else if (audioSuccess && !pushSuccess) {
        console.warn(
          "Push notifications failed but audio alerts are working:",
          notificationSystem.pushNotifications.error ||
            "Event-based initialization used",
        );
        errorLogger.logInfo(
          "audio-alerts-demo",
          "Partial success: Audio alerts working, push notifications in safe mode",
        );
      } else {
        errorLogger.logInfo(
          "audio-alerts-demo",
          "Full success: Both systems working",
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Initialization failed";
      setInitializationError(errorMessage);
      errorLogger.logError(
        "audio-alerts-demo",
        "Manual initialization failed",
        error,
        {
          audioError: notificationSystem.audioAlerts.error,
          pushError: notificationSystem.pushNotifications.error,
        },
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusColor = (isEnabled: boolean, hasError: boolean) => {
    if (hasError) return "danger";
    if (isEnabled) return "success";
    return "medium";
  };

  const getStatusText = (
    isSupported: boolean,
    isInitialized: boolean,
    isEnabled: boolean,
    hasError: boolean,
  ) => {
    if (!isSupported) return "Not Supported";
    if (hasError) return "Error";
    if (!isInitialized) return "Not Initialized";
    if (!isEnabled) return "Disabled";
    return "Active";
  };

  // Master toggle handler
  const handleMasterToggle = async (e: CustomEvent) => {
    const enabled = e.detail.checked;
    const newState = {
      ...systemState,
      masterEnabled: enabled,
      audioEnabled: enabled,
      pushEnabled: enabled,
      lastToggleTime: Date.now(),
    };

    persistSystemState(newState);

    if (enabled) {
      await handleSystemInitialization();
    } else {
      await handleSystemDestruction();
    }
  };

  // Audio system toggle handler
  const handleAudioSystemToggle = async (e: CustomEvent) => {
    const enabled = e.detail.checked;
    const newState = {
      ...systemState,
      audioEnabled: enabled,
      masterEnabled: enabled || systemState.pushEnabled,
      lastToggleTime: Date.now(),
    };

    persistSystemState(newState);

    if (enabled) {
      await handleSystemInitialization();
    } else if (!systemState.pushEnabled) {
      await handleSystemDestruction();
    }
  };

  // Push system toggle handler
  const handlePushSystemToggle = async (e: CustomEvent) => {
    const enabled = e.detail.checked;
    const newState = {
      ...systemState,
      pushEnabled: enabled,
      masterEnabled: enabled || systemState.audioEnabled,
      lastToggleTime: Date.now(),
    };

    persistSystemState(newState);

    if (enabled) {
      await handleSystemInitialization();
    } else if (!systemState.audioEnabled) {
      await handleSystemDestruction();
    }
  };

  // System initialization handler
  const handleSystemInitialization = async () => {
    if (isInitializing) return;

    setIsInitializing(true);
    setInitializationError(null);
    setDestroyError(null);

    try {
      errorLogger.logInfo(
        "audio-alerts-demo",
        "System initialization started",
        {
          audioEnabled: systemState.audioEnabled,
          pushEnabled: systemState.pushEnabled,
        },
      );

      await notificationSystem.initialize();

      errorLogger.logInfo(
        "audio-alerts-demo",
        "System initialization completed",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Initialization failed";
      setInitializationError(errorMessage);
      errorLogger.logError(
        "audio-alerts-demo",
        "System initialization failed",
        error,
      );
    } finally {
      setIsInitializing(false);
    }
  };

  // System destruction handler
  const handleSystemDestruction = async () => {
    if (isDestroying) return;

    setIsDestroying(true);
    setDestroyError(null);
    setInitializationError(null);

    try {
      errorLogger.logInfo("audio-alerts-demo", "System destruction started");

      await notificationSystem.destroy();

      errorLogger.logInfo("audio-alerts-demo", "System destruction completed");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Destruction failed";
      setDestroyError(errorMessage);
      errorLogger.logError(
        "audio-alerts-demo",
        "System destruction failed",
        error,
      );

      // Try force destroy if graceful destruction failed
      try {
        notificationSystem.forceDestroy();
        errorLogger.logInfo("audio-alerts-demo", "Force destruction completed");
      } catch (forceError) {
        errorLogger.logError(
          "audio-alerts-demo",
          "Force destruction also failed",
          forceError,
        );
      }
    } finally {
      setIsDestroying(false);
    }
  };

  // Force reset handler
  const handleForceReset = () => {
    try {
      notificationSystem.forceDestroy();

      const resetState = {
        masterEnabled: false,
        audioEnabled: false,
        pushEnabled: false,
        lastToggleTime: Date.now(),
      };

      persistSystemState(resetState);
      setInitializationError(null);
      setDestroyError(null);

      errorLogger.logInfo("audio-alerts-demo", "Force reset completed");
    } catch (error) {
      errorLogger.logError("audio-alerts-demo", "Force reset failed", error);
    }
  };

  // System status helpers
  const getSystemStatusIcon = () => {
    if (isInitializing || isDestroying) return powerOutline;
    if (initializationError || destroyError) return alertCircleOutline;
    if (systemState.masterEnabled) return checkmarkCircleOutline;
    return powerOutline;
  };

  const getSystemStatusColor = () => {
    if (initializationError || destroyError) return "danger";
    if (systemState.masterEnabled) return "success";
    return "medium";
  };

  const getSystemStatusText = () => {
    if (isInitializing) return "Initializing systems...";
    if (isDestroying) return "Destroying systems...";
    if (initializationError)
      return `Initialization failed: ${initializationError}`;
    if (destroyError) return `Destruction failed: ${destroyError}`;
    if (systemState.masterEnabled) return "System active";
    return "System disabled";
  };

  const getSystemStatusBadge = () => {
    if (isInitializing) return "INIT";
    if (isDestroying) return "DESTROY";
    if (initializationError || destroyError) return "ERROR";
    if (systemState.masterEnabled) return "ACTIVE";
    return "DISABLED";
  };

  return (
    <div className={className}>
      <IonGrid>
        <IonRow>
          <IonCol size="12" sizeMd="6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={volumeHighOutline} className="mr-2" />
                  Audio Alerts
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonIcon
                    icon={
                      notificationSystem.audioAlerts.isEnabled
                        ? volumeHighOutline
                        : volumeMuteOutline
                    }
                    slot="start"
                  />
                  <IonLabel>
                    <h3>Status</h3>
                    <p>
                      {getStatusText(
                        notificationSystem.audioAlerts.isSupported,
                        notificationSystem.audioAlerts.isInitialized,
                        notificationSystem.audioAlerts.isEnabled,
                        !!notificationSystem.audioAlerts.error,
                      )}
                    </p>
                  </IonLabel>
                  <IonBadge
                    color={getStatusColor(
                      notificationSystem.audioAlerts.isEnabled,
                      !!notificationSystem.audioAlerts.error,
                    )}
                    slot="end"
                  >
                    {notificationSystem.audioAlerts.isSupported
                      ? "Supported"
                      : "Unsupported"}
                  </IonBadge>
                </IonItem>

                <IonItem>
                  <IonLabel>Enable Audio Alerts</IonLabel>
                  <IonToggle
                    checked={notificationSystem.audioAlerts.isEnabled}
                    onIonChange={(e) =>
                      notificationSystem.setAudioEnabled(e.detail.checked)
                    }
                    disabled={!notificationSystem.audioAlerts.isSupported}
                  />
                </IonItem>

                {notificationSystem.audioAlerts.error && (
                  <IonItem color="danger">
                    <IonIcon icon={alertCircleOutline} slot="start" />
                    <IonLabel>
                      <IonText color="danger">
                        {notificationSystem.audioAlerts.error}
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}

                <div className="mt-4">
                  <IonText>
                    <h4>Test Task Alerts</h4>
                  </IonText>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <IonButton
                          expand="block"
                          fill="outline"
                          color="success"
                          onClick={() => handleTestTaskAlert("low")}
                          disabled={!notificationSystem.audioAlerts.isEnabled}
                        >
                          <IonIcon icon={playOutline} slot="start" />
                          Low
                        </IonButton>
                      </IonCol>
                      <IonCol size="6">
                        <IonButton
                          expand="block"
                          fill="outline"
                          color="primary"
                          onClick={() => handleTestTaskAlert("medium")}
                          disabled={!notificationSystem.audioAlerts.isEnabled}
                        >
                          <IonIcon icon={playOutline} slot="start" />
                          Medium
                        </IonButton>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="6">
                        <IonButton
                          expand="block"
                          fill="outline"
                          color="warning"
                          onClick={() => handleTestTaskAlert("high")}
                          disabled={!notificationSystem.audioAlerts.isEnabled}
                        >
                          <IonIcon icon={playOutline} slot="start" />
                          High
                        </IonButton>
                      </IonCol>
                      <IonCol size="6">
                        <IonButton
                          expand="block"
                          fill="outline"
                          color="danger"
                          onClick={() => handleTestTaskAlert("urgent")}
                          disabled={!notificationSystem.audioAlerts.isEnabled}
                        >
                          <IonIcon icon={playOutline} slot="start" />
                          Urgent
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={notificationsOutline} className="mr-2" />
                  Push Notifications
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonIcon icon={notificationsOutline} slot="start" />
                  <IonLabel>
                    <h3>Status</h3>
                    <p>
                      {getStatusText(
                        notificationSystem.pushNotifications.isSupported,
                        notificationSystem.pushNotifications.isInitialized,
                        notificationSystem.pushNotifications.isEnabled,
                        !!notificationSystem.pushNotifications.error,
                      )}
                    </p>
                  </IonLabel>
                  <IonBadge
                    color={getStatusColor(
                      notificationSystem.pushNotifications.isEnabled,
                      !!notificationSystem.pushNotifications.error,
                    )}
                    slot="end"
                  >
                    {notificationSystem.pushNotifications.permissionStatus}
                  </IonBadge>
                </IonItem>

                <IonItem>
                  <IonLabel>Enable Push Notifications</IonLabel>
                  <IonToggle
                    checked={notificationSystem.pushNotifications.isEnabled}
                    onIonChange={(e) =>
                      notificationSystem.setPushEnabled(e.detail.checked)
                    }
                    disabled={!notificationSystem.pushNotifications.isSupported}
                  />
                </IonItem>

                {notificationSystem.pushNotifications.fcmToken && (
                  <IonItem>
                    <IonLabel>
                      <h3>FCM Token</h3>
                      <p className="text-xs break-all">
                        {notificationSystem.pushNotifications.fcmToken.substring(
                          0,
                          50,
                        )}
                        ...
                      </p>
                    </IonLabel>
                  </IonItem>
                )}

                {notificationSystem.pushNotifications.error && (
                  <IonItem color="danger">
                    <IonIcon icon={alertCircleOutline} slot="start" />
                    <IonLabel>
                      <IonText color="danger">
                        {notificationSystem.pushNotifications.error}
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}

                <div className="mt-4">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={handleRequestPermissions}
                    disabled={
                      notificationSystem.pushNotifications.permissionStatus ===
                      "granted"
                    }
                  >
                    <IonIcon icon={checkmarkCircleOutline} slot="start" />
                    Request Permissions
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol size="12">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>System Controls</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {/* Master System Toggle */}
                <IonItem className="mb-4">
                  <IonIcon icon={powerOutline} slot="start" />
                  <IonLabel>
                    <h3>Master System Control</h3>
                    <p>Enable/disable the complete notification system</p>
                  </IonLabel>
                  <IonToggle
                    checked={systemState.masterEnabled}
                    onIonChange={handleMasterToggle}
                    disabled={isInitializing || isDestroying}
                  />
                </IonItem>

                {/* Individual System Toggles */}
                <IonItem className="mb-2">
                  <IonIcon icon={volumeHighOutline} slot="start" />
                  <IonLabel>
                    <h3>Audio Alerts System</h3>
                    <p>Control audio alert initialization</p>
                  </IonLabel>
                  <IonToggle
                    checked={systemState.audioEnabled}
                    onIonChange={handleAudioSystemToggle}
                    disabled={isInitializing || isDestroying}
                  />
                </IonItem>

                <IonItem className="mb-4">
                  <IonIcon icon={notificationsOutline} slot="start" />
                  <IonLabel>
                    <h3>Push Notifications System</h3>
                    <p>Control push notification initialization</p>
                  </IonLabel>
                  <IonToggle
                    checked={systemState.pushEnabled}
                    onIonChange={handlePushSystemToggle}
                    disabled={isInitializing || isDestroying}
                  />
                </IonItem>

                {/* System Status Display */}
                <IonItem className="mb-4">
                  <IonIcon
                    icon={getSystemStatusIcon()}
                    color={getSystemStatusColor()}
                    slot="start"
                  />
                  <IonLabel>
                    <h3>System Status</h3>
                    <p>{getSystemStatusText()}</p>
                  </IonLabel>
                  <IonBadge color={getSystemStatusColor()} slot="end">
                    {getSystemStatusBadge()}
                  </IonBadge>
                </IonItem>

                {/* Loading States */}
                {(isInitializing || isDestroying) && (
                  <IonItem className="mb-4">
                    <IonSpinner name="crescent" slot="start" />
                    <IonLabel>
                      <IonText color="primary">
                        {isInitializing
                          ? "Initializing systems..."
                          : "Destroying systems..."}
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}

                {/* Error Display */}
                {(initializationError || destroyError) && (
                  <IonItem color="danger" className="mb-4">
                    <IonIcon icon={alertCircleOutline} slot="start" />
                    <IonLabel>
                      <IonText color="danger">
                        <strong>System Error:</strong>{" "}
                        {initializationError || destroyError}
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}

                {/* Action Buttons */}
                <IonGrid>
                  <IonRow>
                    <IonCol size="12" sizeMd="3">
                      <IonButton
                        expand="block"
                        color="primary"
                        onClick={handleTestAllNotifications}
                        disabled={
                          !notificationSystem.audioAlerts.isEnabled &&
                          !notificationSystem.pushNotifications.isEnabled
                        }
                      >
                        <IonIcon icon={playOutline} slot="start" />
                        Test All
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" sizeMd="3">
                      <IonButton
                        expand="block"
                        fill="outline"
                        color="success"
                        onClick={() => notificationSystem.setEnabled(true)}
                      >
                        <IonIcon icon={checkmarkCircleOutline} slot="start" />
                        Enable All
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" sizeMd="3">
                      <IonButton
                        expand="block"
                        fill="outline"
                        color="medium"
                        onClick={() => notificationSystem.setEnabled(false)}
                      >
                        <IonIcon icon={volumeMuteOutline} slot="start" />
                        Disable All
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" sizeMd="3">
                      <IonButton
                        expand="block"
                        fill="outline"
                        color="warning"
                        onClick={handleForceReset}
                        disabled={isInitializing || isDestroying}
                      >
                        <IonIcon icon={refreshOutline} slot="start" />
                        Force Reset
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>

                {/* Debug Information */}
                <div className="mt-4">
                  <IonText color="medium">
                    <p className="text-xs">
                      Last toggle:{" "}
                      {systemState.lastToggleTime
                        ? new Date(
                            systemState.lastToggleTime,
                          ).toLocaleTimeString()
                        : "Never"}
                    </p>
                  </IonText>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default AudioAlertsDemo;
