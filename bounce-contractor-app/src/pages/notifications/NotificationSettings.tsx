import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonToast,
  IonSpinner,
  IonNote,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import {
  notificationsOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  settingsOutline,
  phonePortraitOutline,
  desktopOutline,
  warningOutline,
} from "ionicons/icons";
import { useNotificationStatus } from "../../hooks/notifications/useNotificationStatus";
import { useRealtimeStore } from "../../store/realtimeStore";
import ConnectionStatus from "../../components/common/ConnectionStatus";
import { useNotificationTranslation } from "../../hooks/common/useI18n";
import { AudioAlertsDemo } from "../../components/AudioAlertsDemo";
import DebugPanel from "../../components/debug/DebugPanel";
import RenderLoopBoundary from "../../components/common/RenderLoopBoundary";
import { errorLogger } from "../../services/debug/errorLogger";

const NotificationSettings: React.FC = () => {
  const { t } = useNotificationTranslation();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<
    "success" | "warning" | "danger"
  >("success");
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const {
    isSupported,
    isEnabled,
    permissionStatus,
    fcmToken,
    hasToken,
    platformInfo,
  } = useNotificationStatus();

  const {
    notificationsEnabled,
    setNotificationsEnabled,
    notifications,
    unreadCount,
    clearNotifications,
    markAllNotificationsAsRead,
  } = useRealtimeStore();

  const showMessage = (
    message: string,
    color: "success" | "warning" | "danger" = "success",
  ) => {
    // Only update state if component is still mounted
    if (isMountedRef.current) {
      setToastMessage(message);
      setToastColor(color);
      setShowToast(true);
    }
  };

  // All notification management functions removed - this is now a read-only page
  // Users are directed to enable notifications during login or in browser settings

  const handleClearNotifications = () => {
    clearNotifications();
    showMessage("All notifications cleared", "success");
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    showMessage("All notifications marked as read", "success");
  };

  const getPermissionStatusInfo = () => {
    switch (permissionStatus) {
      case "granted":
        return {
          color: "success",
          icon: checkmarkCircleOutline,
          text: "Granted",
          description: "You will receive push notifications",
        };
      case "denied":
        return {
          color: "danger",
          icon: alertCircleOutline,
          text: "Denied",
          description:
            "Push notifications are blocked. Enable in browser settings.",
        };
      case "default":
        return {
          color: "warning",
          icon: warningOutline,
          text: "Not Requested",
          description: "Permission has not been requested yet",
        };
      default:
        return {
          color: "medium",
          icon: settingsOutline,
          text: "Unknown",
          description: "Permission status is unknown",
        };
    }
  };

  const permissionInfo = getPermissionStatusInfo();

  return (
    <RenderLoopBoundary
      onError={(error: Error, errorInfo: React.ErrorInfo) => {
        errorLogger.logError(
          "notification-settings-boundary",
          "NotificationSettings component crashed",
          error,
          {
            componentStack: errorInfo.componentStack,
            permissionStatus,
            isSupported,
            platform: platformInfo.platform,
          },
        );
      }}
    >
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>{t("settings.title")}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {/* Real-time Connection Status */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center">
                <IonIcon icon={notificationsOutline} className="mr-2" />
                Real-time Connection
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Real-time task updates and notifications
                  </p>
                  <ConnectionStatus showText={true} />
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Push Notification Support */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center">
                <IonIcon
                  icon={isSupported ? phonePortraitOutline : desktopOutline}
                  className="mr-2"
                />
                Push Notification Support
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">
                    {isSupported ? "Supported" : "Not Supported"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isSupported
                      ? "Your device supports push notifications"
                      : "Push notifications are not available on this device"}
                  </p>
                </div>
                <IonBadge color={isSupported ? "success" : "danger"}>
                  {isSupported ? "Available" : "Unavailable"}
                </IonBadge>
              </div>

              {!isSupported && (
                <IonNote color="warning">
                  <p className="text-sm">
                    Push notifications require a modern browser with service
                    worker support. Try using Chrome, Firefox, or Safari on a
                    supported device.
                  </p>
                </IonNote>
              )}
            </IonCardContent>
          </IonCard>

          {/* Permission Status */}
          {isSupported && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center">
                  <IonIcon icon={permissionInfo.icon} className="mr-2" />
                  Permission Status
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{permissionInfo.text}</p>
                    <p className="text-sm text-gray-600">
                      {permissionInfo.description}
                    </p>
                  </div>
                  <IonBadge color={permissionInfo.color}>
                    {permissionInfo.text}
                  </IonBadge>
                </div>

                {permissionStatus === "denied" && (
                  <IonNote color="warning">
                    <p className="text-sm">
                      To enable notifications, go to your browser settings and
                      allow notifications for this site.
                    </p>
                  </IonNote>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Notification Settings */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Notification Preferences</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel>
                    <h3>Real-time Notifications</h3>
                    <p>Show notifications for real-time events</p>
                  </IonLabel>
                  <IonToggle
                    checked={notificationsEnabled}
                    onIonChange={(e) =>
                      setNotificationsEnabled(e.detail.checked)
                    }
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <h3>Push Notifications</h3>
                    <p>Receive notifications when app is closed</p>
                  </IonLabel>
                  <IonToggle checked={isEnabled} disabled={true} />
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Audio Alerts Testing */}
          <AudioAlertsDemo />

          {/* Actions */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Actions</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="space-y-3">
                {/* Safe actions only - no initialization */}
                {notifications.length > 0 && (
                  <>
                    <IonButton
                      expand="block"
                      fill="clear"
                      color="medium"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark All as Read ({unreadCount})
                    </IonButton>

                    <IonButton
                      expand="block"
                      fill="clear"
                      color="danger"
                      onClick={handleClearNotifications}
                    >
                      Clear All Notifications
                    </IonButton>
                  </>
                )}

                {/* Information about notification setup */}
                <IonNote color="primary">
                  <p className="text-sm">
                    <strong>Note:</strong> Notification permissions are now
                    requested during login. If you need to change notification
                    settings, please enable them in your browser/device
                    settings.
                  </p>
                </IonNote>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Debug Information */}
          {fcmToken && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Debug Information</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      FCM Token:
                    </p>
                    <p className="text-xs text-gray-500 break-all">
                      {fcmToken.substring(0, 50)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status:</p>
                    <p className="text-xs text-gray-500">
                      Platform: {platformInfo.platform} | Enabled:{" "}
                      {isEnabled ? "Yes" : "No"} | Supported:{" "}
                      {isSupported ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            duration={3000}
            position="bottom"
            color={toastColor}
          />
        </IonContent>

        {/* Debug Panel - Always available for debugging crashes */}
        <DebugPanel isVisible={showDebugPanel} onToggle={setShowDebugPanel} />
      </IonPage>
    </RenderLoopBoundary>
  );
};

export default NotificationSettings;
