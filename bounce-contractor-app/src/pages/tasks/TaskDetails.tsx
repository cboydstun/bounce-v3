import React from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonIcon,
  IonButton,
  IonChip,
  IonLabel,
} from "@ionic/react";
import {
  calendarOutline,
  timeOutline,
  locationOutline,
  cashOutline,
  personOutline,
  navigateOutline,
  callOutline,
  checkmarkCircleOutline,
  playOutline,
  alertCircleOutline,
  businessOutline,
  constructOutline,
  carOutline,
  homeOutline,
  buildOutline,
  cubeOutline,
} from "ionicons/icons";
import { useParams } from "react-router-dom";
import { useTaskById } from "../../hooks/tasks/useTasks";

interface TaskDetailsParams {
  id: string;
}

// Helper function to extract task ID from URL (Android fallback)
const extractTaskIdFromUrl = (): string | null => {
  const pathname = window.location.pathname;
  const hash = window.location.hash;

  // Try different URL patterns that might be used on Android
  const patterns = [
    /\/task-details\/([^\/\?#]+)/, // /task-details/123 (correct route)
    /#\/task-details\/([^\/\?#]+)/, // #/task-details/123
    /task-details\/([^\/\?#]+)/, // task-details/123
  ];

  for (const pattern of patterns) {
    const match = pathname.match(pattern) || hash.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

// Helper functions for task data
const getTaskTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "delivery":
      return carOutline;
    case "setup":
      return constructOutline;
    case "pickup":
      return cubeOutline;
    case "maintenance":
      return buildOutline;
    default:
      return businessOutline;
  }
};

const getTaskTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case "delivery":
      return "primary";
    case "setup":
      return "success";
    case "pickup":
      return "warning";
    case "maintenance":
      return "danger";
    default:
      return "medium";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "medium";
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "medium";
    case "assigned":
      return "primary";
    case "in progress":
      return "warning";
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "medium";
  }
};

const formatDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffDays === 0) {
      return `Today at ${timeStr}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${timeStr}`;
    } else if (diffDays === -1) {
      return `Yesterday at ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} at ${timeStr}`;
    }
  } catch (error) {
    return dateString;
  }
};

const TaskDetails: React.FC = () => {
  const { id } = useParams<TaskDetailsParams>();

  // Android fallback - extract ID from URL if useParams fails
  const taskId = id || extractTaskIdFromUrl();

  // Enhanced debugging for Android
  console.log("URL Debug:", {
    useParamsId: id,
    extractedTaskId: extractTaskIdFromUrl(),
    finalTaskId: taskId,
    pathname: window.location.pathname,
    hash: window.location.hash,
    search: window.location.search,
    href: window.location.href,
  });

  // Simple React Query hook - only enable if we have a valid task ID
  const {
    data: task,
    isLoading,
    isError,
    error,
  } = useTaskById(taskId || "", !!taskId && taskId.trim() !== "");

  console.log("TaskDetails render:", {
    id: taskId,
    hasTask: !!task,
    isLoading,
    isError,
    queryEnabled: !!taskId && taskId.trim() !== "",
    taskData: task,
  });

  // Loading state
  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/available-tasks" />
            </IonButtons>
            <IonTitle>Task Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="flex flex-col justify-center items-center h-full p-8">
            <IonSpinner name="crescent" />
            <IonText className="text-sm text-gray-500 mt-4 text-center">
              Loading task details...
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Error state
  if (isError || !task) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/available-tasks" />
            </IonButtons>
            <IonTitle>Task Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <IonText className="text-lg font-medium text-gray-900">
              Task not found
            </IonText>
            <IonText className="text-sm text-gray-500 text-center mt-2">
              {error instanceof Error
                ? error.message
                : "The task could not be loaded."}
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Success state - show enhanced task details
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/available-tasks" />
          </IonButtons>
          <IonTitle>Task Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4 space-y-4">
          {/* Task Header */}
          <IonCard>
            <IonCardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <IonIcon
                      icon={getTaskTypeIcon(task.type)}
                      className={`text-${getTaskTypeColor(task.type)}`}
                    />
                    <IonBadge color={getTaskTypeColor(task.type)}>
                      {task.type || "Task"}
                    </IonBadge>
                    <IonBadge color={getPriorityColor(task.priority)}>
                      {task.priority || "Medium"} Priority
                    </IonBadge>
                    <IonBadge color={getStatusColor(task.status)}>
                      {task.status || "Unknown"}
                    </IonBadge>
                  </div>
                  <IonCardTitle className="text-lg font-semibold">
                    {task.title || "Task Details"}
                  </IonCardTitle>
                </div>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <IonText className="text-gray-700">
                {task.description || "No description available"}
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* Scheduling Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center gap-2">
                <IonIcon icon={calendarOutline} className="text-purple-500" />
                Schedule
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <IonIcon icon={timeOutline} className="text-orange-500" />
                  <div>
                    <div className="font-medium">Scheduled Time</div>
                    <div className="text-sm text-gray-600">
                      {task.scheduledDate
                        ? formatDateTime(task.scheduledDate)
                        : "Not scheduled"}
                    </div>
                  </div>
                </div>

                {task.estimatedDuration && (
                  <div className="flex items-center gap-3">
                    <IonIcon icon={timeOutline} className="text-blue-500" />
                    <div>
                      <div className="font-medium">Estimated Duration</div>
                      <div className="text-sm text-gray-600">
                        {Math.floor(task.estimatedDuration / 60)}h{" "}
                        {task.estimatedDuration % 60}m
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Location Information */}
          {(task.location?.address?.formattedAddress ||
            task.location?.coordinates) && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center gap-2">
                  <IonIcon icon={locationOutline} className="text-blue-500" />
                  Location
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="space-y-3">
                  {task.location?.address?.formattedAddress && (
                    <div className="flex items-start gap-3">
                      <IonIcon
                        icon={homeOutline}
                        className="text-green-500 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Address</div>
                        <div className="text-sm text-gray-600">
                          {task.location.address.formattedAddress}
                        </div>
                      </div>
                      <IonButton fill="clear" size="small">
                        <IonIcon icon={navigateOutline} />
                      </IonButton>
                    </div>
                  )}

                  {task.location?.coordinates && (
                    <div className="flex items-center gap-3">
                      <IonIcon
                        icon={locationOutline}
                        className="text-red-500"
                      />
                      <div>
                        <div className="font-medium">Coordinates</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {task.location.coordinates.latitude},{" "}
                          {task.location.coordinates.longitude}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Payment Information */}
          {task.compensation?.totalAmount && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center gap-2">
                  <IonIcon icon={cashOutline} className="text-green-500" />
                  Payment
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-green-600">
                    ${task.compensation.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {task.compensation.currency || "USD"}
                  </div>
                </div>
                {task.compensation.baseAmount !==
                  task.compensation.totalAmount && (
                  <div className="text-sm text-gray-600 mt-1">
                    Base: ${task.compensation.baseAmount.toFixed(2)}
                    {task.compensation.bonuses?.length > 0 && (
                      <span>
                        {" "}
                        + {task.compensation.bonuses.length} bonus(es)
                      </span>
                    )}
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Assignment Information */}
          {task.contractor && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center gap-2">
                  <IonIcon icon={personOutline} className="text-indigo-500" />
                  Assignment
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <IonIcon icon={personOutline} className="text-blue-500" />
                    <div>
                      <div className="font-medium">Assigned Contractor</div>
                      <div className="text-sm text-gray-600">
                        {task.contractor.contractorId}
                      </div>
                      {task.contractor.assignedAt && (
                        <div className="text-xs text-gray-500">
                          Assigned: {formatDateTime(task.contractor.assignedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Task Metadata */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center gap-2">
                <IonIcon icon={businessOutline} className="text-gray-500" />
                Task Information
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <IonIcon icon={businessOutline} className="text-blue-500" />
                  <div>
                    <div className="font-medium">Task ID</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {task.id}
                    </div>
                  </div>
                </div>

                {task.orderId && (
                  <div className="flex items-center gap-3">
                    <IonIcon
                      icon={businessOutline}
                      className="text-purple-500"
                    />
                    <div>
                      <div className="font-medium">Order ID</div>
                      <div className="text-xs text-gray-500 font-mono">
                        {task.orderId}
                      </div>
                    </div>
                  </div>
                )}

                {task.createdAt && (
                  <div className="flex items-center gap-3">
                    <IonIcon icon={timeOutline} className="text-gray-500" />
                    <div>
                      <div className="font-medium">Created</div>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(task.createdAt)}
                      </div>
                    </div>
                  </div>
                )}

                {task.updatedAt && (
                  <div className="flex items-center gap-3">
                    <IonIcon icon={timeOutline} className="text-gray-500" />
                    <div>
                      <div className="font-medium">Last Updated</div>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(task.updatedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Action Buttons */}
          <div className="space-y-3 pb-8">
            {task.status === "published" && (
              <IonButton expand="block" color="primary">
                <IonIcon icon={playOutline} slot="start" />
                Claim Task
              </IonButton>
            )}

            {task.status === "assigned" && (
              <IonButton expand="block" color="success">
                <IonIcon icon={playOutline} slot="start" />
                Start Task
              </IonButton>
            )}

            {task.status === "in_progress" && (
              <IonButton expand="block" color="success">
                <IonIcon icon={checkmarkCircleOutline} slot="start" />
                Complete Task
              </IonButton>
            )}

            {task.location?.address?.formattedAddress && (
              <IonButton expand="block" fill="outline" color="primary">
                <IonIcon icon={navigateOutline} slot="start" />
                Get Directions
              </IonButton>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TaskDetails;
