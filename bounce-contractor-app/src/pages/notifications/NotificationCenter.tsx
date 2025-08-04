import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonActionSheet,
} from "@ionic/react";
import {
  checkmarkDoneOutline,
  filterOutline,
  ellipsisVerticalOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useNotificationTranslation } from "../../hooks/common/useI18n";
import { useNotifications } from "../../hooks/notifications/useNotifications";
import { NotificationFilters } from "../../services/notifications/notificationService";
import NotificationList from "../../components/notifications/NotificationList";
import NotificationDetailModal from "../../components/notifications/NotificationDetailModal";
import { Notification } from "../../types/notification.types";

const NotificationCenter: React.FC = () => {
  const { t } = useNotificationTranslation();
  const history = useHistory();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const {
    notifications,
    loading,
    error,
    hasMore,
    totalCount,
    unreadCount,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
  } = useNotifications({
    autoLoad: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = async (event: CustomEvent) => {
    await refresh();
    event.detail.complete();
  };

  const handleFilterChange = (filterType: string) => {
    setSelectedFilter(filterType);

    const filters: NotificationFilters = {};

    switch (filterType) {
      case "unread":
        filters.read = false;
        break;
      case "task":
        filters.type = "task";
        break;
      case "system":
        filters.type = "system";
        break;
      case "personal":
        filters.type = "personal";
        break;
      default:
        // "all" - no filters
        break;
    }

    setFilters(filters);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Open detail modal
    setSelectedNotification(notification);
    setShowDetailModal(true);

    // Auto-mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
  };

  const handleViewTask = (taskId: string) => {
    // Navigate to task details page
    console.log("Navigate to task:", taskId);

    // Validate task ID before navigation
    if (!taskId || taskId.trim() === "") {
      console.error("Invalid task ID provided for navigation:", taskId);
      return;
    }

    // Close the modal first
    setShowDetailModal(false);
    setSelectedNotification(null);

    // Navigate to task details page using the correct route
    history.push(`/task-details/${taskId}`);
  };

  const handleDeleteFromModal = (notificationId: string) => {
    deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setShowActionSheet(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {t("center.title")}
            {unreadCount > 0 && (
              <IonBadge color="danger" className="ml-2">
                {unreadCount}
              </IonBadge>
            )}
          </IonTitle>
          <IonButtons slot="end">
            {unreadCount > 0 && (
              <IonButton onClick={() => setShowActionSheet(true)}>
                <IonIcon icon={ellipsisVerticalOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>

        {/* Filter Segment */}
        <IonToolbar>
          <IonSegment
            value={selectedFilter}
            onIonChange={(e) => handleFilterChange(e.detail.value as string)}
          >
            <IonSegmentButton value="all">
              <IonLabel>{t("filters.all")}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="unread">
              <IonLabel>
                {t("filters.unread")}
                {unreadCount > 0 && (
                  <IonBadge color="danger" className="ml-1">
                    {unreadCount}
                  </IonBadge>
                )}
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="task">
              <IonLabel>{t("filters.tasks")}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="system">
              <IonLabel>{t("filters.system")}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <NotificationList
          notifications={notifications}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRefresh={refresh}
          onMarkAsRead={markAsRead}
          onDelete={deleteNotification}
          onNotificationClick={handleNotificationClick}
        />

        {/* Action Sheet for bulk actions */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: t("actions.markAllRead"),
              icon: checkmarkDoneOutline,
              handler: handleMarkAllAsRead,
            },
            {
              text: t("actions.cancel"),
              role: "cancel",
            },
          ]}
        />

        {/* Notification Detail Modal */}
        <NotificationDetailModal
          isOpen={showDetailModal}
          notification={selectedNotification}
          onClose={handleCloseDetailModal}
          onDelete={handleDeleteFromModal}
          onViewTask={handleViewTask}
        />
      </IonContent>
    </IonPage>
  );
};

export default NotificationCenter;
