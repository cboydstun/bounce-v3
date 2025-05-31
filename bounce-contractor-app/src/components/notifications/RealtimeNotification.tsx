<<<<<<< HEAD
import React from "react";
import { IonItem, IonLabel, IonIcon, IonBadge, IonButton } from "@ionic/react";
import {
  briefcaseOutline,
  checkmarkCircleOutline,
  refreshOutline,
=======
import React from 'react';
import { IonItem, IonLabel, IonIcon, IonBadge, IonButton } from '@ionic/react';
import { 
  briefcaseOutline, 
  checkmarkCircleOutline, 
  refreshOutline, 
>>>>>>> 5772b46b8 (notifications)
  closeCircleOutline,
  notificationsOutline,
  personOutline,
  timeOutline,
<<<<<<< HEAD
  closeOutline,
} from "ionicons/icons";
import { formatDistanceToNow } from "date-fns";
import { RealtimeNotification } from "../../store/realtimeStore";
=======
  closeOutline
} from 'ionicons/icons';
import { formatDistanceToNow } from 'date-fns';
import { RealtimeNotification } from '../../store/realtimeStore';
>>>>>>> 5772b46b8 (notifications)

export interface RealtimeNotificationProps {
  notification: RealtimeNotification;
  onMarkAsRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  onTap?: (notification: RealtimeNotification) => void;
  showActions?: boolean;
  compact?: boolean;
}

<<<<<<< HEAD
export const RealtimeNotificationComponent: React.FC<
  RealtimeNotificationProps
> = ({
=======
export const RealtimeNotificationComponent: React.FC<RealtimeNotificationProps> = ({
>>>>>>> 5772b46b8 (notifications)
  notification,
  onMarkAsRead,
  onRemove,
  onTap,
  showActions = true,
  compact = false,
}) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
<<<<<<< HEAD
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
=======
      case 'task:new':
        return briefcaseOutline;
      case 'task:assigned':
        return checkmarkCircleOutline;
      case 'task:updated':
        return refreshOutline;
      case 'task:cancelled':
        return closeCircleOutline;
      case 'notification:system':
        return notificationsOutline;
      case 'notification:personal':
>>>>>>> 5772b46b8 (notifications)
        return personOutline;
      default:
        return notificationsOutline;
    }
  };

  const getNotificationColor = () => {
    switch (notification.priority) {
<<<<<<< HEAD
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "medium";
      default:
        return "primary";
=======
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'medium';
      default:
        return 'primary';
>>>>>>> 5772b46b8 (notifications)
    }
  };

  const handleItemClick = () => {
    if (onTap) {
      onTap(notification);
    }
<<<<<<< HEAD

=======
    
>>>>>>> 5772b46b8 (notifications)
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

<<<<<<< HEAD
  const timeAgo = formatDistanceToNow(notification.timestamp, {
    addSuffix: true,
  });
=======
  const timeAgo = formatDistanceToNow(notification.timestamp, { addSuffix: true });
>>>>>>> 5772b46b8 (notifications)

  if (compact) {
    return (
      <IonItem
        button
        onClick={handleItemClick}
<<<<<<< HEAD
        className={`${!notification.isRead ? "notification-unread" : ""}`}
=======
        className={`${!notification.isRead ? 'notification-unread' : ''}`}
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD
      className={`${!notification.isRead ? "notification-unread border-l-4 border-blue-500 bg-blue-50" : ""}`}
=======
      className={`${!notification.isRead ? 'notification-unread border-l-4 border-blue-500 bg-blue-50' : ''}`}
>>>>>>> 5772b46b8 (notifications)
    >
      <IonIcon
        icon={getNotificationIcon()}
        color={getNotificationColor()}
        slot="start"
        size="large"
      />
<<<<<<< HEAD

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
=======
      
      <IonLabel>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </h2>
            <p className={`mt-1 ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
>>>>>>> 5772b46b8 (notifications)
              {notification.message}
            </p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <IonIcon icon={timeOutline} className="mr-1" />
              <span>{timeAgo}</span>
<<<<<<< HEAD
              {notification.priority === "high" && (
=======
              {notification.priority === 'high' && (
>>>>>>> 5772b46b8 (notifications)
                <IonBadge color="danger" className="ml-2">
                  High Priority
                </IonBadge>
              )}
            </div>
          </div>
<<<<<<< HEAD

=======
          
>>>>>>> 5772b46b8 (notifications)
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
<<<<<<< HEAD

=======
      
>>>>>>> 5772b46b8 (notifications)
      {!notification.isRead && !showActions && (
        <IonBadge color="primary" slot="end">
          New
        </IonBadge>
      )}
    </IonItem>
  );
};

export default RealtimeNotificationComponent;
