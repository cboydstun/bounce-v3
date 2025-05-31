<<<<<<< HEAD
import React, { useState } from "react";
=======
import React, { useState } from 'react';
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
} from "@ionic/react";
=======
} from '@ionic/react';
>>>>>>> 5772b46b8 (notifications)
import {
  notificationsOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  settingsOutline,
  phonePortraitOutline,
  desktopOutline,
  warningOutline,
<<<<<<< HEAD
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
=======
} from 'ionicons/icons';
import { usePushNotifications } from '../../hooks/notifications/usePushNotifications';
import { useRealtimeStore } from '../../store/realtimeStore';
import ConnectionStatus from '../../components/common/ConnectionStatus';

const NotificationSettings: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');
>>>>>>> 5772b46b8 (notifications)

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

<<<<<<< HEAD
  const showMessage = (
    message: string,
    color: "success" | "warning" | "danger" = "success",
  ) => {
=======
  const showMessage = (message: string, color: 'success' | 'warning' | 'danger' = 'success') => {
>>>>>>> 5772b46b8 (notifications)
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleEnableNotifications = async () => {
<<<<<<< HEAD
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
=======
    if (permissionStatus === 'denied') {
      showMessage('Notification permission was denied. Please enable it in your browser settings.', 'warning');
      return;
    }

    if (permissionStatus === 'default') {
      const granted = await requestPermission();
      if (granted) {
        showMessage('Notifications enabled successfully!', 'success');
      } else {
        showMessage('Failed to enable notifications. Permission denied.', 'danger');
      }
    } else {
      setEnabled(true);
      showMessage('Notifications enabled!', 'success');
>>>>>>> 5772b46b8 (notifications)
    }
  };

  const handleDisableNotifications = () => {
    setEnabled(false);
<<<<<<< HEAD
    showMessage("Notifications disabled", "warning");
=======
    showMessage('Notifications disabled', 'warning');
>>>>>>> 5772b46b8 (notifications)
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
<<<<<<< HEAD
      showMessage("Test notification sent!", "success");
    } catch (err) {
      showMessage("Failed to send test notification", "danger");
=======
      showMessage('Test notification sent!', 'success');
    } catch (err) {
      showMessage('Failed to send test notification', 'danger');
>>>>>>> 5772b46b8 (notifications)
    }
  };

  const handleInitialize = async () => {
    try {
      await initialize();
<<<<<<< HEAD
      showMessage("Push notifications initialized!", "success");
    } catch (err) {
      showMessage("Failed to initialize push notifications", "danger");
=======
      showMessage('Push notifications initialized!', 'success');
    } catch (err) {
      showMessage('Failed to initialize push notifications', 'danger');
>>>>>>> 5772b46b8 (notifications)
    }
  };

  const handleClearNotifications = () => {
    clearNotifications();
<<<<<<< HEAD
    showMessage("All notifications cleared", "success");
=======
    showMessage('All notifications cleared', 'success');
>>>>>>> 5772b46b8 (notifications)
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
<<<<<<< HEAD
    showMessage("All notifications marked as read", "success");
=======
    showMessage('All notifications marked as read', 'success');
>>>>>>> 5772b46b8 (notifications)
  };

  const getPermissionStatusInfo = () => {
    switch (permissionStatus) {
<<<<<<< HEAD
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
=======
      case 'granted':
        return {
          color: 'success',
          icon: checkmarkCircleOutline,
          text: 'Granted',
          description: 'You will receive push notifications',
        };
      case 'denied':
        return {
          color: 'danger',
          icon: alertCircleOutline,
          text: 'Denied',
          description: 'Push notifications are blocked. Enable in browser settings.',
        };
      case 'default':
        return {
          color: 'warning',
          icon: warningOutline,
          text: 'Not Requested',
          description: 'Permission has not been requested yet',
        };
      default:
        return {
          color: 'medium',
          icon: settingsOutline,
          text: 'Unknown',
          description: 'Permission status is unknown',
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
          <IonTitle>{t("settings.title")}</IonTitle>
=======
          <IonTitle>Notification Settings</IonTitle>
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
              <IonIcon
                icon={isSupported ? phonePortraitOutline : desktopOutline}
                className="mr-2"
=======
              <IonIcon 
                icon={isSupported ? phonePortraitOutline : desktopOutline} 
                className="mr-2" 
>>>>>>> 5772b46b8 (notifications)
              />
              Push Notification Support
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">
<<<<<<< HEAD
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
=======
                  {isSupported ? 'Supported' : 'Not Supported'}
                </p>
                <p className="text-sm text-gray-600">
                  {isSupported 
                    ? 'Your device supports push notifications'
                    : 'Push notifications are not available on this device'
                  }
                </p>
              </div>
              <IonBadge color={isSupported ? 'success' : 'danger'}>
                {isSupported ? 'Available' : 'Unavailable'}
>>>>>>> 5772b46b8 (notifications)
              </IonBadge>
            </div>

            {!isSupported && (
              <IonNote color="warning">
                <p className="text-sm">
<<<<<<< HEAD
                  Push notifications require a modern browser with service
                  worker support. Try using Chrome, Firefox, or Safari on a
                  supported device.
=======
                  Push notifications require a modern browser with service worker support.
                  Try using Chrome, Firefox, or Safari on a supported device.
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
                  <p className="text-sm text-gray-600">
                    {permissionInfo.description}
                  </p>
=======
                  <p className="text-sm text-gray-600">{permissionInfo.description}</p>
>>>>>>> 5772b46b8 (notifications)
                </div>
                <IonBadge color={permissionInfo.color}>
                  {permissionInfo.text}
                </IonBadge>
              </div>

<<<<<<< HEAD
              {permissionStatus === "denied" && (
                <IonNote color="warning">
                  <p className="text-sm">
                    To enable notifications, go to your browser settings and
                    allow notifications for this site.
=======
              {permissionStatus === 'denied' && (
                <IonNote color="warning">
                  <p className="text-sm">
                    To enable notifications, go to your browser settings and allow notifications for this site.
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
                  disabled={!isSupported || permissionStatus !== "granted"}
=======
                  disabled={!isSupported || permissionStatus !== 'granted'}
>>>>>>> 5772b46b8 (notifications)
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

<<<<<<< HEAD
              {permissionStatus === "default" && isSupported && (
=======
              {permissionStatus === 'default' && isSupported && (
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
                  <p className="text-sm font-medium text-gray-700">
                    FCM Token:
                  </p>
=======
                  <p className="text-sm font-medium text-gray-700">FCM Token:</p>
>>>>>>> 5772b46b8 (notifications)
                  <p className="text-xs text-gray-500 break-all">
                    {fcmToken.substring(0, 50)}...
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status:</p>
                  <p className="text-xs text-gray-500">
<<<<<<< HEAD
                    Initialized: {isInitialized ? "Yes" : "No"} | Enabled:{" "}
                    {isEnabled ? "Yes" : "No"} | Supported:{" "}
                    {isSupported ? "Yes" : "No"}
=======
                    Initialized: {isInitialized ? 'Yes' : 'No'} | 
                    Enabled: {isEnabled ? 'Yes' : 'No'} | 
                    Supported: {isSupported ? 'Yes' : 'No'}
>>>>>>> 5772b46b8 (notifications)
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
