import React from "react";
import {
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonButton,
  IonIcon,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import { refreshOutline, notificationsOffOutline } from "ionicons/icons";
import { Notification } from "../../types/notification.types";
import { useNotificationTranslation } from "../../hooks/common/useI18n";
import NotificationItem from "./NotificationItem";

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRefresh,
  onMarkAsRead,
  onDelete,
  onNotificationClick,
}) => {
  const { t } = useNotificationTranslation();

  const handleInfiniteScroll = async (event: CustomEvent<void>) => {
    // Prevent multiple simultaneous calls
    if (loading) {
      (event.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    // Only load more if there's actually more content
    if (!hasMore) {
      (event.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    try {
      if (onLoadMore) {
        await onLoadMore();
      }
    } catch (error) {
      console.error("Error loading more notifications:", error);
    } finally {
      // Always complete the infinite scroll
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }
  };

  // Loading state
  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <IonSpinner name="crescent" className="mb-4 text-blue-500" />
        <IonText color="medium">
          <p className="text-gray-500">{t("list.loading")}</p>
        </IonText>
      </div>
    );
  }

  // Error state
  if (error && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
          <IonIcon
            icon={notificationsOffOutline}
            className="text-2xl text-red-500"
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("list.errorTitle")}
        </h3>
        <IonText className="text-center mb-6">
          <p className="text-gray-600 leading-relaxed">{error}</p>
        </IonText>
        {onRefresh && (
          <IonButton fill="outline" onClick={onRefresh} className="rounded-lg">
            <IonIcon icon={refreshOutline} slot="start" />
            {t("list.retry")}
          </IonButton>
        )}
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <IonIcon
            icon={notificationsOffOutline}
            className="text-2xl text-blue-500"
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("list.emptyTitle")}
        </h3>
        <IonText className="text-center mb-6">
          <p className="text-gray-600 leading-relaxed max-w-sm">
            {t("list.emptyMessage")}
          </p>
        </IonText>
        {onRefresh && (
          <IonButton fill="outline" onClick={onRefresh} className="rounded-lg">
            <IonIcon icon={refreshOutline} slot="start" />
            {t("list.refresh")}
          </IonButton>
        )}
      </div>
    );
  }

  return (
    <>
      <IonList className="notification-list">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
            onClick={onNotificationClick}
          />
        ))}
      </IonList>

      {/* Infinite scroll for pagination */}
      {hasMore && (
        <IonInfiniteScroll
          onIonInfinite={handleInfiniteScroll}
          threshold="100px"
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText={t("list.loadingMore")}
          />
        </IonInfiniteScroll>
      )}

      {/* Loading indicator for additional items */}
      {loading && notifications.length > 0 && (
        <div className="flex justify-center py-4">
          <IonSpinner name="dots" />
        </div>
      )}
    </>
  );
};

export default NotificationList;
