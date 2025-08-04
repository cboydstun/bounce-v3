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
  useIonToast,
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
import { useI18n, useTaskTranslation } from "../../hooks/common/useI18n";
import CompensationDisplay from "./CompensationDisplay";

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
  const { t: tTask } = useTaskTranslation();
  const {
    t,
    formatTaskTime,
    formatCurrency,
    formatDistance,
    isToday,
    isTomorrow,
  } = useI18n();
  const [presentToast] = useIonToast();

  // Handle coordinates - database stores as [longitude, latitude] array
  const coordinates = task.location.coordinates;
  const latitude = Array.isArray(coordinates)
    ? coordinates[1]
    : coordinates.latitude;
  const longitude = Array.isArray(coordinates)
    ? coordinates[0]
    : coordinates.longitude;

  const distance = getDistanceFromCurrent(latitude, longitude);

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

  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) {
      return "TH";
    }
    switch (day % 10) {
      case 1:
        return "ST";
      case 2:
        return "ND";
      case 3:
        return "RD";
      default:
        return "TH";
    }
  };

  const formatProminentDate = (dateString: string) => {
    const date = new Date(dateString);

    const months = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];

    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const ordinalSuffix = getOrdinalSuffix(day);

    return `${month} ${day}${ordinalSuffix} ${year}`;
  };

  const formatStartTime = (timeSlot: any) => {
    if (!timeSlot || !timeSlot.startTime) {
      return null;
    }

    const startTime = new Date(timeSlot.startTime);

    // Format start time in Central Time
    const formatOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago",
      hour12: true,
    };

    const startFormatted = startTime.toLocaleTimeString("en-US", formatOptions);

    return `${startFormatted} CT`;
  };

  const handleGetDirections = () => {
    // Construct address from task location data
    const address = `${task.location.address.street}, ${task.location.address.city}`;

    if (address && address.trim() !== ", ") {
      // Open device's default maps app
      const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
      window.open(mapsUrl, "_system");
    } else {
      presentToast({
        message: "Address not available for directions",
        duration: 3000,
        position: "top",
        color: "warning",
      });
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
                {tTask(`status.${task.status}`)}
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
            <CompensationDisplay
              compensation={task.compensation}
              size="compact"
              className="justify-end"
            />
            {/* {distance && (
              <IonText className="text-sm text-gray-500">
                {formatDistance(distance * 1609.34)}
              </IonText>
            )} */}
          </div>
        </div>
      </IonCardHeader>

      <IonCardContent>
        <div className="space-y-3">
          {/* PROMINENT DATE & TIME SECTION */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IonIcon
                  icon={calendarOutline}
                  className="mr-2 text-blue-600 text-lg"
                />
                <div>
                  <IonText className="text-lg font-bold text-blue-900 block">
                    {formatProminentDate(task.scheduledDate)}
                  </IonText>
                  {formatStartTime(task.scheduledTimeSlot) && (
                    <IonText className="text-sm font-medium text-blue-700 block">
                      {formatStartTime(task.scheduledTimeSlot)}
                    </IonText>
                  )}
                </div>
              </div>
              <IonIcon icon={timeOutline} className="text-blue-500 text-xl" />
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center justify-between text-gray-600">
            <div className="flex items-center flex-1">
              <IonIcon icon={locationOutline} className="mr-2 text-blue-500" />
              <IonText className="text-sm">
                {task.location.address.street}, {task.location.address.city}
              </IonText>
            </div>
            <IonButton
              fill="clear"
              size="small"
              onClick={handleGetDirections}
              className="ml-2"
            >
              <IonIcon icon={navigateOutline} className="text-blue-500" />
            </IonButton>
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
                {tTask("card.equipment")}:{" "}
                {task.equipment.map((eq) => eq.name).join(", ")}
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
                {isLoading
                  ? tTask("actions.claiming")
                  : tTask("card.claimButton")}
              </IonButton>
            )}

            <IonButton
              fill="outline"
              color="medium"
              onClick={() => onViewDetails?.(task.id)}
              className="min-w-0"
            >
              {tTask("card.viewDetails")}
            </IonButton>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default TaskCard;
