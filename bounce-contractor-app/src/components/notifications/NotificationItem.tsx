import React from "react";
import {
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonIcon,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from "@ionic/react";
import {
  checkmarkOutline,
  trashOutline,
  timeOutline,
  locationOutline,
  cashOutline,
  alertCircleOutline,
  informationCircleOutline,
  constructOutline,
} from "ionicons/icons";
import { Notification } from "../../types/notification.types";
import { useNotificationTranslation } from "../../hooks/common/useI18n";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onClick?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}) => {
  const { t } = useNotificationTranslation();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "primary";
      case "low":
        return "medium";
      default:
        return "medium";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "task_alert":
      case "task_update":
        return constructOutline;
      case "payment":
        return cashOutline;
      case "system":
        return informationCircleOutline;
      case "emergency":
        return alertCircleOutline;
      default:
        return informationCircleOutline;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return t("item.justNow");
    if (diffInMinutes < 60)
      return t("item.minutesAgo", { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t("item.hoursAgo", { count: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return t("item.daysAgo", { count: diffInDays });

    return date.toLocaleDateString();
  };

  const handleItemClick = () => {
    if (onClick) {
      onClick(notification);
    }

    // Auto-mark as read when clicked
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <IonItemSliding>
      <IonItem
        button
        onClick={handleItemClick}
        className={`mx-4 my-2 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${
          !notification.isRead
            ? "bg-blue-50 border-l-4 border-blue-500"
            : "bg-white"
        }`}
      >
        <IonIcon
          icon={getCategoryIcon(notification.category)}
          slot="start"
          color={getPriorityColor(notification.priority)}
          className="text-2xl mr-3"
        />

        <IonLabel>
          <div className="flex justify-between items-start mb-1">
            <h3
              className={`text-base leading-tight ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-800"}`}
            >
              {notification.title}
            </h3>
            {!notification.isRead && (
              <IonBadge
                color="primary"
                className="text-xs px-2 py-1 rounded-full ml-2"
              >
                {t("item.new")}
              </IonBadge>
            )}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            {notification.body}
          </p>

          {/* Task-specific details */}
          {notification.category === "task_alert" && notification.data && (
            <div className="flex flex-wrap gap-3 mt-2">
              {notification.data.location?.address && (
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  <IonIcon icon={locationOutline} className="text-sm" />
                  <span>{notification.data.location.address}</span>
                </div>
              )}
              {notification.data.compensation && (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <IonIcon icon={cashOutline} className="text-sm" />
                  <span>${notification.data.compensation}</span>
                </div>
              )}
              {notification.data.scheduledDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  <IonIcon icon={timeOutline} className="text-sm" />
                  <span>
                    {new Date(
                      notification.data.scheduledDate,
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <IonNote
            slot="end"
            className="text-xs text-gray-400 whitespace-nowrap"
          >
            {formatTimeAgo(notification.createdAt)}
          </IonNote>
        </IonLabel>
      </IonItem>

      <IonItemOptions side="end">
        {!notification.isRead && (
          <IonItemOption color="success" onClick={handleMarkAsRead}>
            <IonIcon icon={checkmarkOutline} />
            {t("item.markRead")}
          </IonItemOption>
        )}
        <IonItemOption color="danger" onClick={handleDelete}>
          <IonIcon icon={trashOutline} />
          {t("item.delete")}
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default NotificationItem;
