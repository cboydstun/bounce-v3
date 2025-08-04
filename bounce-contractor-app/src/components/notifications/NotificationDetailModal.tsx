import React from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonNote,
  IonText,
} from "@ionic/react";
import {
  closeOutline,
  timeOutline,
  locationOutline,
  cashOutline,
  personOutline,
  calendarOutline,
  trashOutline,
  eyeOutline,
  constructOutline,
  informationCircleOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { Notification } from "../../types/notification.types";
import { useNotificationTranslation } from "../../hooks/common/useI18n";

interface NotificationDetailModalProps {
  isOpen: boolean;
  notification: Notification | null;
  onClose: () => void;
  onDelete?: (notificationId: string) => void;
  onViewTask?: (taskId: string) => void;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  isOpen,
  notification,
  onClose,
  onDelete,
  onViewTask,
}) => {
  const { t } = useNotificationTranslation();

  if (!notification) return null;

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Parse task information from notification message
  const parseTaskInfoFromMessage = (message: string) => {
    const taskInfo: any = {};

    // Extract location (address pattern)
    const locationMatch = message.match(/in (.+?) - \$/);
    if (locationMatch) {
      taskInfo.location = locationMatch[1].trim();
    }

    // Extract compensation (dollar amount)
    const compensationMatch = message.match(/- \$(\d+(?:\.\d{2})?)/);
    if (compensationMatch) {
      taskInfo.compensation = parseFloat(compensationMatch[1]);
    }

    // Extract task type from title or message
    const taskTypeMatch = message.match(/^(\w+) task/i);
    if (taskTypeMatch) {
      taskInfo.taskType = taskTypeMatch[1];
    }

    console.log("📝 Parsed task info from message:", {
      originalMessage: message,
      parsedInfo: taskInfo,
    });

    return taskInfo;
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(notification.id);
    }
    onClose();
  };

  const handleViewTask = () => {
    if (onViewTask && notification.data?.taskId) {
      onViewTask(notification.data.taskId);
    }
    onClose();
  };

  const renderTaskDetails = () => {
    // Debug logging to see what data we actually have
    console.log("🔍 NotificationDetailModal - renderTaskDetails debug:", {
      category: notification.category,
      hasData: !!notification.data,
      data: notification.data,
      dataKeys: notification.data ? Object.keys(notification.data) : [],
      fullNotification: notification,
    });

    if (notification.category !== "task_alert") {
      console.log("❌ Task details not rendered - wrong category:", {
        category: notification.category,
        expectedCategory: "task_alert",
      });
      return null;
    }

    // Parse information from the notification message as fallback
    const parsedInfo = parseTaskInfoFromMessage(notification.body);

    // Combine structured data with parsed data (structured data takes precedence)
    const taskData = {
      location:
        notification.data?.location?.address ||
        notification.data?.location ||
        parsedInfo.location,
      compensation:
        notification.data?.compensation ||
        notification.data?.amount ||
        notification.data?.totalAmount ||
        parsedInfo.compensation,
      scheduledDate:
        notification.data?.scheduledDate || notification.data?.scheduledTime,
      customerName:
        notification.data?.customerName || notification.data?.customer,
      taskTitle: notification.data?.taskTitle || notification.title,
      taskType: notification.data?.taskType || parsedInfo.taskType,
    };

    console.log("📋 Combined task data:", {
      structured: notification.data,
      parsed: parsedInfo,
      combined: taskData,
    });

    return (
      <IonCard className="mt-4">
        <IonCardContent>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t("detail.taskDetails")}
          </h3>

          <div className="space-y-3">
            {/* Location */}
            {taskData.location && (
              <IonItem lines="none" className="px-0">
                <IonIcon icon={locationOutline} slot="start" color="medium" />
                <IonLabel>
                  <h4 className="font-medium">{t("detail.location")}</h4>
                  <p className="text-sm text-gray-600">{taskData.location}</p>
                </IonLabel>
              </IonItem>
            )}

            {/* Compensation */}
            {taskData.compensation && (
              <IonItem lines="none" className="px-0">
                <IonIcon icon={cashOutline} slot="start" color="success" />
                <IonLabel>
                  <h4 className="font-medium">{t("detail.payment")}</h4>
                  <p className="text-sm text-green-600 font-semibold">
                    ${taskData.compensation}
                  </p>
                </IonLabel>
              </IonItem>
            )}

            {/* Scheduled Date */}
            {taskData.scheduledDate && (
              <IonItem lines="none" className="px-0">
                <IonIcon icon={calendarOutline} slot="start" color="primary" />
                <IonLabel>
                  <h4 className="font-medium">{t("detail.scheduled")}</h4>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(taskData.scheduledDate)}
                  </p>
                </IonLabel>
              </IonItem>
            )}

            {/* Customer Name */}
            {taskData.customerName && (
              <IonItem lines="none" className="px-0">
                <IonIcon icon={personOutline} slot="start" color="medium" />
                <IonLabel>
                  <h4 className="font-medium">{t("detail.customer")}</h4>
                  <p className="text-sm text-gray-600">
                    {taskData.customerName}
                  </p>
                </IonLabel>
              </IonItem>
            )}

            {/* Task Title */}
            {taskData.taskTitle &&
              taskData.taskTitle !== notification.title && (
                <IonItem lines="none" className="px-0">
                  <IonIcon
                    icon={constructOutline}
                    slot="start"
                    color="primary"
                  />
                  <IonLabel>
                    <h4 className="font-medium">{t("detail.taskTitle")}</h4>
                    <p className="text-sm text-gray-600">
                      {taskData.taskTitle}
                    </p>
                  </IonLabel>
                </IonItem>
              )}

            {/* Task Type */}
            {taskData.taskType && (
              <IonItem lines="none" className="px-0">
                <IonIcon icon={constructOutline} slot="start" color="medium" />
                <IonLabel>
                  <h4 className="font-medium">{t("detail.taskType")}</h4>
                  <p className="text-sm text-gray-600">{taskData.taskType}</p>
                </IonLabel>
              </IonItem>
            )}
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

  const renderPaymentDetails = () => {
    if (notification.category !== "payment" || !notification.data) {
      return null;
    }

    return (
      <IonCard className="mt-4">
        <IonCardContent>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t("detail.paymentDetails")}
          </h3>

          <div className="space-y-3">
            <IonItem lines="none" className="px-0">
              <IonIcon icon={cashOutline} slot="start" color="success" />
              <IonLabel>
                <h4 className="font-medium">Amount</h4>
                <p className="text-lg text-green-600 font-bold">
                  ${notification.data.amount} {notification.data.currency}
                </p>
              </IonLabel>
            </IonItem>

            {notification.data.paymentMethod && (
              <IonItem lines="none" className="px-0">
                <IonIcon
                  icon={informationCircleOutline}
                  slot="start"
                  color="medium"
                />
                <IonLabel>
                  <h4 className="font-medium">Payment Method</h4>
                  <p className="text-sm text-gray-600">
                    {notification.data.paymentMethod}
                  </p>
                </IonLabel>
              </IonItem>
            )}

            {notification.data.transactionDate && (
              <IonItem lines="none" className="px-0">
                <IonIcon icon={timeOutline} slot="start" color="medium" />
                <IonLabel>
                  <h4 className="font-medium">Transaction Date</h4>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(notification.data.transactionDate)}
                  </p>
                </IonLabel>
              </IonItem>
            )}
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("detail.title")}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Notification Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            <IonIcon
              icon={getCategoryIcon(notification.category)}
              className="text-3xl"
              color={getPriorityColor(notification.priority)}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {notification.title}
              </h2>
              <IonBadge
                color={getPriorityColor(notification.priority)}
                className="flex-shrink-0"
              >
                {notification.priority}
              </IonBadge>
            </div>

            <IonNote className="text-sm text-gray-500">
              <IonIcon icon={timeOutline} className="mr-1" />
              {formatDateTime(notification.createdAt)}
            </IonNote>
          </div>
        </div>

        {/* Notification Body */}
        <div className="mb-6">
          <IonText>
            <p className="text-base text-gray-700 leading-relaxed">
              {notification.body}
            </p>
          </IonText>
        </div>

        {/* Category-specific Details */}
        {renderTaskDetails()}
        {renderPaymentDetails()}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-8 mb-4">
          {notification.category === "task_alert" &&
            notification.data?.taskId && (
              <IonButton
                expand="block"
                fill="solid"
                color="primary"
                onClick={handleViewTask}
                className="rounded-lg"
              >
                <IonIcon icon={eyeOutline} slot="start" />
                {t("detail.viewTask")}
              </IonButton>
            )}

          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            onClick={handleDelete}
            className="rounded-lg"
          >
            <IonIcon icon={trashOutline} slot="start" />
            {t("detail.delete")}
          </IonButton>

          <IonButton
            expand="block"
            fill="clear"
            color="medium"
            onClick={onClose}
            className="rounded-lg"
          >
            {t("detail.close")}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default NotificationDetailModal;
