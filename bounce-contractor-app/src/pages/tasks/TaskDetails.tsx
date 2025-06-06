import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonBadge,
  IonChip,
  IonLabel,
  IonItem,
  IonList,
  IonListHeader,
  IonBackButton,
  IonButtons,
  IonSpinner,
  IonToast,
} from "@ionic/react";
import {
  locationOutline,
  timeOutline,
  personOutline,
  calendarOutline,
  navigateOutline,
  callOutline,
  checkmarkCircleOutline,
  playOutline,
  pauseOutline,
  informationCircleOutline,
} from "ionicons/icons";
import { useParams, useHistory } from "react-router-dom";
import { Task } from "../../types/task.types";
import { useI18n } from "../../hooks/common/useI18n";
import CompensationDisplay from "../../components/tasks/CompensationDisplay";
import {
  useClaimTask,
  useUpdateTaskStatus,
} from "../../hooks/tasks/useTaskActions";
import { useTaskById } from "../../hooks/tasks/useTasks";

interface TaskDetailsParams {
  id: string;
}

const TaskDetails: React.FC = () => {
  const { id } = useParams<TaskDetailsParams>();
  const history = useHistory();
  const { formatTaskTime, formatDistance, isToday, isTomorrow } = useI18n();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const claimTaskMutation = useClaimTask();
  const updateStatusMutation = useUpdateTaskStatus();

  // Fetch task data from API
  const { data: task, isLoading, isError } = useTaskById(id!);

  const handleClaimTask = async () => {
    try {
      await claimTaskMutation.mutateAsync({
        taskId: id,
        estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      setToastMessage("Task claimed successfully!");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to claim task:", error);
    }
  };

  const handleStartTask = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        taskId: id,
        status: "in_progress",
        timestamp: new Date().toISOString(),
      });
      setToastMessage("Task started!");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to start task:", error);
    }
  };

  const handleCompleteTask = () => {
    // Navigate to completion form
    history.push(`/tasks/${id}/complete`);
  };

  const handleNavigate = () => {
    if (!task) return;
    // Open navigation app
    const { latitude, longitude } = task.location.coordinates;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  const handleCallCustomer = () => {
    if (!task) return;
    window.open(`tel:${task.customer.phone}`, "_self");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "assigned":
        return "warning";
      case "in_progress":
        return "primary";
      case "completed":
        return "medium";
      default:
        return "medium";
    }
  };

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

  const formatScheduledDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return "Today " + formatTaskTime(date);
    } else if (isTomorrow(date)) {
      return "Tomorrow " + formatTaskTime(date);
    } else {
      return formatTaskTime(date);
    }
  };

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
          <div className="flex justify-center items-center h-full">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
              The task you're looking for doesn't exist or has been removed.
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <IonCardTitle className="text-lg font-semibold">
                    {task.title}
                  </IonCardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <IonBadge color={getStatusColor(task.status)}>
                      {task.status.replace("_", " ").toUpperCase()}
                    </IonBadge>
                    <IonBadge color={getPriorityColor(task.priority)}>
                      {task.priority.toUpperCase()} PRIORITY
                    </IonBadge>
                  </div>
                </div>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <IonText className="text-gray-700">{task.description}</IonText>
            </IonCardContent>
          </IonCard>

          {/* Compensation Details */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Compensation</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <CompensationDisplay
                compensation={task.compensation}
                size="detailed"
                showBreakdown={true}
                showPaymentMethod={true}
                showPaymentSchedule={true}
              />
            </IonCardContent>
          </IonCard>

          {/* Task Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Task Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <IonIcon
                    icon={calendarOutline}
                    className="mr-3 text-purple-500"
                  />
                  <div>
                    <div className="font-medium">Scheduled Time</div>
                    <div className="text-sm text-gray-600">
                      {formatScheduledDate(task.scheduledDate)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <IonIcon
                    icon={timeOutline}
                    className="mr-3 text-orange-500"
                  />
                  <div>
                    <div className="font-medium">Estimated Duration</div>
                    <div className="text-sm text-gray-600">
                      {Math.round(task.estimatedDuration / 60)}h{" "}
                      {task.estimatedDuration % 60}m
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <IonIcon
                    icon={locationOutline}
                    className="mr-3 text-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-gray-600">
                      {task.location.address.formattedAddress}
                    </div>
                    {task.location.accessInstructions && (
                      <div className="text-xs text-gray-500 mt-1">
                        Access: {task.location.accessInstructions}
                      </div>
                    )}
                  </div>
                  <IonButton fill="clear" size="small" onClick={handleNavigate}>
                    <IonIcon icon={navigateOutline} />
                  </IonButton>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Customer Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Customer Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IonIcon
                      icon={personOutline}
                      className="mr-3 text-indigo-500"
                    />
                    <div>
                      <div className="font-medium">
                        {task.customer.firstName} {task.customer.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {task.customer.email}
                      </div>
                    </div>
                  </div>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={handleCallCustomer}
                  >
                    <IonIcon icon={callOutline} />
                  </IonButton>
                </div>

                {task.customer.specialInstructions && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <div className="flex items-start">
                      <IonIcon
                        icon={informationCircleOutline}
                        className="mr-2 text-yellow-600 mt-0.5"
                      />
                      <div>
                        <div className="text-sm font-medium text-yellow-800">
                          Special Instructions
                        </div>
                        <div className="text-sm text-yellow-700">
                          {task.customer.specialInstructions}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Equipment */}
          {task.equipment.length > 0 && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Equipment</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {task.equipment.map((equipment) => (
                  <div
                    key={equipment.id}
                    className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0 mb-3 last:mb-0"
                  >
                    <div className="font-medium">{equipment.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {equipment.dimensions.length}' ×{" "}
                      {equipment.dimensions.width}' ×{" "}
                      {equipment.dimensions.height}'
                      {equipment.weight && ` • ${equipment.weight} lbs`}
                    </div>
                    {equipment.setupInstructions && (
                      <div className="text-xs text-gray-500 mt-1">
                        Setup: {equipment.setupInstructions}
                      </div>
                    )}
                    {equipment.safetyNotes && (
                      <div className="text-xs text-red-600 mt-1">
                        Safety: {equipment.safetyNotes}
                      </div>
                    )}
                  </div>
                ))}
              </IonCardContent>
            </IonCard>
          )}

          {/* Required Skills */}
          {task.requiredSkills.length > 0 && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Required Skills</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="flex flex-wrap gap-2">
                  {task.requiredSkills.map((skill, index) => (
                    <IonChip key={index}>
                      <IonLabel>{skill}</IonLabel>
                    </IonChip>
                  ))}
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pb-8">
            {task.status === "published" && (
              <IonButton
                expand="block"
                color="primary"
                onClick={handleClaimTask}
                disabled={claimTaskMutation.isPending}
              >
                {claimTaskMutation.isPending ? "Claiming..." : "Claim Task"}
              </IonButton>
            )}

            {task.status === "assigned" && (
              <IonButton
                expand="block"
                color="success"
                onClick={handleStartTask}
                disabled={updateStatusMutation.isPending}
              >
                <IonIcon icon={playOutline} slot="start" />
                {updateStatusMutation.isPending ? "Starting..." : "Start Task"}
              </IonButton>
            )}

            {task.status === "in_progress" && (
              <IonButton
                expand="block"
                color="success"
                onClick={handleCompleteTask}
              >
                <IonIcon icon={checkmarkCircleOutline} slot="start" />
                Complete Task
              </IonButton>
            )}

            <IonButton expand="block" fill="outline" onClick={handleNavigate}>
              <IonIcon icon={navigateOutline} slot="start" />
              Get Directions
            </IonButton>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default TaskDetails;
