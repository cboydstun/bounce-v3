import React from "react";
import { IonItem, IonLabel, IonIcon, IonBadge, IonButton } from "@ionic/react";
import {
  briefcaseOutline,
  checkmarkCircleOutline,
  refreshOutline,
  closeCircleOutline,
  notificationsOutline,
  personOutline,
  timeOutline,
  closeOutline,
} from "ionicons/icons";
import { formatDistanceToNow } from "date-fns";
import { RealtimeNotification } from "../../store/realtimeStore";

export interface RealtimeNotificationProps {
  notification: RealtimeNotification;
  onMarkAsRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  onTap?: (notification: RealtimeNotification) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const RealtimeNotificationComponent: React.FC<
  RealtimeNotificationProps
> = ({
  notification,
  onMarkAsRead,
  onRemove,
  onTap,
  showActions = true,
  compact = false,
}) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "task:new":
        return briefcaseOutline;
      case "task:assigned":
        return checkmarkCircleOutline;
      case "task:updated":
        return refreshOutline;
      case "task:cancelled":
        return closeCircleOutline;
      case "notification:system":
        return notificationsOutline;
      case "notification:personal":
        return personOutline;
      default:
        return notificationsOutline;
    }
  };

  const getNotificationColor = () => {
    switch (notification.priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "medium";
      default:
        return "primary";
    }
  };

  const handleItemClick = () => {
    if (onTap) {
      onTap(notification);
    }

    // Auto-mark as read when tapped
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(notification.id);
    }
  };

  const timeAgo = formatDistanceToNow(notification.timestamp, {
    addSuffix: true,
  });

  if (compact) {
    return (
      <IonItem
        button
        onClick={handleItemClick}
        className={`${!notification.isRead ? "notification-unread" : ""}`}
      >
        <IonIcon
          icon={getNotificationIcon()}
          color={getNotificationColor()}
          slot="start"
        />
        <IonLabel>
          <h3 className="text-sm font-medium">{notification.title}</h3>
          <p className="text-xs text-gray-500">{timeAgo}</p>
        </IonLabel>
        {!notification.isRead && (
          <IonBadge color="primary" slot="end">
            New
          </IonBadge>
        )}
      </IonItem>
    );
  }

  return (
    <IonItem
      button
      onClick={handleItemClick}
      className={`${!notification.isRead ? "notification-unread border-l-4 border-blue-500 bg-blue-50" : ""}`}
    >
      <IonIcon
        icon={getNotificationIcon()}
        color={getNotificationColor()}
        slot="start"
        size="large"
      />

      <IonLabel>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2
              className={`font-semibold ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}
            >
              {notification.title}
            </h2>
            <p
              className={`mt-1 ${!notification.isRead ? "text-gray-800" : "text-gray-600"}`}
            >
              {notification.message}
            </p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <IonIcon icon={timeOutline} className="mr-1" />
              <span>{timeAgo}</span>
              {notification.priority === "high" && (
                <IonBadge color="danger" className="ml-2">
                  High Priority
                </IonBadge>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-2 ml-4">
              {!notification.isRead && (
                <IonButton
                  fill="clear"
                  size="small"
                  color="primary"
                  onClick={handleMarkAsRead}
                  title="Mark as read"
                >
                  <IonIcon icon={checkmarkCircleOutline} />
                </IonButton>
              )}
              <IonButton
                fill="clear"
                size="small"
                color="medium"
                onClick={handleRemove}
                title="Remove notification"
              >
                <IonIcon icon={closeOutline} />
              </IonButton>
            </div>
          )}
        </div>
      </IonLabel>

      {!notification.isRead && !showActions && (
        <IonBadge color="primary" slot="end">
          New
        </IonBadge>
      )}
    </IonItem>
  );
};

export default RealtimeNotificationComponent;
