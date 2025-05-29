import React from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonBadge,
  IonText,
  IonChip,
  IonLabel,
} from "@ionic/react";
import {
  locationOutline,
  timeOutline,
  cashOutline,
  personOutline,
  calendarOutline,
  navigateOutline,
} from "ionicons/icons";
import { Task } from "../../types/task.types";
import { useGeolocation } from "../../hooks/location/useGeolocation";
import { formatDistance, formatDuration, format } from "date-fns";

interface TaskCardProps {
  task: Task;
  onClaim?: (taskId: string) => void;
  onViewDetails?: (taskId: string) => void;
  onNavigate?: (taskId: string) => void;
  showClaimButton?: boolean;
  showNavigateButton?: boolean;
  isLoading?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClaim,
  onViewDetails,
  onNavigate,
  showClaimButton = true,
  showNavigateButton = false,
  isLoading = false,
}) => {
  const { getDistanceFromCurrent } = useGeolocation();

  const distance = getDistanceFromCurrent(
    task.location.coordinates.latitude,
    task.location.coordinates.longitude,
  );

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
      case "cancelled":
        return "danger";
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
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (
      date.toDateString() ===
      new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()
    ) {
      return `Tomorrow at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d 'at' h:mm a");
    }
  };

  return (
    <IonCard className="task-card">
      <IonCardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <IonCardTitle className="text-lg font-semibold text-gray-900">
              {task.title}
            </IonCardTitle>
            <div className="flex items-center gap-2 mt-1">
              <IonBadge color={getStatusColor(task.status)} className="text-xs">
                {task.status.replace("_", " ").toUpperCase()}
              </IonBadge>
              <IonBadge
                color={getPriorityColor(task.priority)}
                className="text-xs"
              >
                {task.priority.toUpperCase()}
              </IonBadge>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-green-600 font-semibold">
              <IonIcon icon={cashOutline} className="mr-1" />
              <span>${task.compensation.totalAmount}</span>
            </div>
            {distance && (
              <IonText className="text-sm text-gray-500">
                {distance.toFixed(1)} mi away
              </IonText>
            )}
          </div>
        </div>
      </IonCardHeader>

      <IonCardContent>
        <div className="space-y-3">
          {/* Description */}
          <IonText className="text-gray-700 text-sm line-clamp-2">
            {task.description}
          </IonText>

          {/* Location */}
          <div className="flex items-center text-gray-600">
            <IonIcon icon={locationOutline} className="mr-2 text-blue-500" />
            <IonText className="text-sm">
              {task.location.address.street}, {task.location.address.city}
            </IonText>
          </div>

          {/* Scheduled Date */}
          <div className="flex items-center text-gray-600">
            <IonIcon icon={calendarOutline} className="mr-2 text-purple-500" />
            <IonText className="text-sm">
              {formatScheduledDate(task.scheduledDate)}
            </IonText>
          </div>

          {/* Duration */}
          <div className="flex items-center text-gray-600">
            <IonIcon icon={timeOutline} className="mr-2 text-orange-500" />
            <IonText className="text-sm">
              Est. {Math.round(task.estimatedDuration / 60)}h{" "}
              {task.estimatedDuration % 60}m
            </IonText>
          </div>

          {/* Customer */}
          <div className="flex items-center text-gray-600">
            <IonIcon icon={personOutline} className="mr-2 text-indigo-500" />
            <IonText className="text-sm">
              {task.customer.firstName} {task.customer.lastName}
            </IonText>
          </div>

          {/* Required Skills */}
          {task.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.requiredSkills.map((skill, index) => (
                <IonChip key={index} className="text-xs">
                  <IonLabel>{skill}</IonLabel>
                </IonChip>
              ))}
            </div>
          )}

          {/* Equipment */}
          {task.equipment.length > 0 && (
            <div className="mt-2">
              <IonText className="text-xs text-gray-500 font-medium">
                Equipment: {task.equipment.map((eq) => eq.name).join(", ")}
              </IonText>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {showClaimButton && task.status === "published" && (
              <IonButton
                expand="block"
                fill="solid"
                color="primary"
                onClick={() => onClaim?.(task.id)}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Claiming..." : "Claim Task"}
              </IonButton>
            )}

            {showNavigateButton && (
              <IonButton
                fill="outline"
                color="primary"
                onClick={() => onNavigate?.(task.id)}
                className="min-w-0"
              >
                <IonIcon icon={navigateOutline} slot="icon-only" />
              </IonButton>
            )}

            <IonButton
              fill="outline"
              color="medium"
              onClick={() => onViewDetails?.(task.id)}
              className="min-w-0"
            >
              Details
            </IonButton>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default TaskCard;
