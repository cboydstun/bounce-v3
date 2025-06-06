import React, { useState } from "react";
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
import { usePushNotifications } from "../../hooks/notifications/usePushNotifications";
import { useRealtimeStore } from "../../store/realtimeStore";
import ConnectionStatus from "../../components/common/ConnectionStatus";
import { useNotificationTranslation } from "../../hooks/common/useI18n";

const NotificationSettings: React.FC = () => {
  const { t } = useNotificationTranslation();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<
    "success" | "warning" | "danger"
  >("success");

  const {
    isSupported,
    isInitialized,
    isEnabled,
    permissionStatus,
    fcmToken,
    isLoading,
    error,
    initialize,
    requestPermission,
    setEnabled,
    testNotification,
    updateConfig,
  } = usePushNotifications();

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
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleEnableNotifications = async () => {
    if (permissionStatus === "denied") {
      showMessage(
        "Notification permission was denied. Please enable it in your browser settings.",
        "warning",
      );
      return;
    }

    if (permissionStatus === "default") {
      const granted = await requestPermission();
      if (granted) {
        showMessage("Notifications enabled successfully!", "success");
      } else {
        showMessage(
          "Failed to enable notifications. Permission denied.",
          "danger",
        );
      }
    } else {
      setEnabled(true);
      showMessage("Notifications enabled!", "success");
    }
  };

  const handleDisableNotifications = () => {
    setEnabled(false);
    showMessage("Notifications disabled", "warning");
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
      showMessage("Test notification sent!", "success");
    } catch (err) {
      showMessage("Failed to send test notification", "danger");
    }
  };

  const handleInitialize = async () => {
    try {
      await initialize();
      showMessage("Push notifications initialized!", "success");
    } catch (err) {
      showMessage("Failed to initialize push notifications", "danger");
    }
  };

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
                  onIonChange={(e) => setNotificationsEnabled(e.detail.checked)}
                />
              </IonItem>

              <IonItem>
                <IonLabel>
                  <h3>Push Notifications</h3>
                  <p>Receive notifications when app is closed</p>
                </IonLabel>
                <IonToggle
                  checked={isEnabled}
                  disabled={!isSupported || permissionStatus !== "granted"}
                  onIonChange={(e) => {
                    if (e.detail.checked) {
                      handleEnableNotifications();
                    } else {
                      handleDisableNotifications();
                    }
                  }}
                />
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Actions */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Actions</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-3">
              {!isInitialized && isSupported && (
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleInitialize}
                  disabled={isLoading}
                >
                  {isLoading && <IonSpinner name="crescent" className="mr-2" />}
                  Initialize Push Notifications
                </IonButton>
              )}

              {permissionStatus === "default" && isSupported && (
                <IonButton
                  expand="block"
                  color="primary"
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                >
                  {isLoading && <IonSpinner name="crescent" className="mr-2" />}
                  Request Permission
                </IonButton>
              )}

              {isEnabled && (
                <IonButton
                  expand="block"
                  fill="outline"
                  color="secondary"
                  onClick={handleTestNotification}
                  disabled={isLoading}
                >
                  Send Test Notification
                </IonButton>
              )}

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
                    Initialized: {isInitialized ? "Yes" : "No"} | Enabled:{" "}
                    {isEnabled ? "Yes" : "No"} | Supported:{" "}
                    {isSupported ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Error Display */}
        {error && (
          <IonCard color="danger">
            <IonCardHeader>
              <IonCardTitle className="text-white">Error</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p className="text-white text-sm">{error}</p>
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
    </IonPage>
  );
};

export default NotificationSettings;
