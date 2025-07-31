import React, { useState } from "react";
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
} from "ionicons/icons";
import { useNotificationSystem } from "../hooks/notifications/useNotificationSystem";
import { TaskPriority } from "../types/task.types";
import { errorLogger } from "../services/debug/errorLogger";

interface AudioAlertsDemoProps {
  className?: string;
}

/**
 * Demo component for testing audio alerts and push notifications
 * This component provides a UI to test all notification features
 */
export const AudioAlertsDemo: React.FC<AudioAlertsDemoProps> = ({
  className,
}) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  // FIXED: Disable auto-initialization to prevent crashes
  const notificationSystem = useNotificationSystem({
    autoInitialize: false, // ← CRASH FIX: No automatic initialization
    autoRequestPermissions: false,
  });

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
                {/* Manual Initialization Section */}
                {!notificationSystem.pushNotifications.isInitialized && (
                  <div className="mb-4">
                    <IonNote color="primary">
                      <p className="text-sm mb-3">
                        <IonIcon icon={warningOutline} className="mr-1" />
                        <strong>Safe Mode:</strong> Push notifications require
                        manual initialization to prevent crashes. Click
                        "Initialize System" to enable push notification testing.
                      </p>
                    </IonNote>

                    <IonButton
                      expand="block"
                      color="secondary"
                      onClick={handleInitializeSystem}
                      disabled={isInitializing}
                    >
                      {isInitializing ? (
                        <IonSpinner name="crescent" className="mr-2" />
                      ) : (
                        <IonIcon icon={powerOutline} slot="start" />
                      )}
                      {isInitializing ? "Initializing..." : "Initialize System"}
                    </IonButton>
                  </div>
                )}

                {/* Initialization Error Display */}
                {initializationError && (
                  <IonItem color="danger" className="mb-4">
                    <IonIcon icon={alertCircleOutline} slot="start" />
                    <IonLabel>
                      <IonText color="danger">
                        <strong>Initialization Failed:</strong>{" "}
                        {initializationError}
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}

                <IonGrid>
                  <IonRow>
                    <IonCol size="12" sizeMd="4">
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
                    <IonCol size="12" sizeMd="4">
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
                    <IonCol size="12" sizeMd="4">
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
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default AudioAlertsDemo;
