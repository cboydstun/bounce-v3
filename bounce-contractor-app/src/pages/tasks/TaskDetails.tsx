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
import { useClaimTask, useUpdateTaskStatus } from "../../hooks/tasks/useTaskActions";

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

  // Mock task data - in real app, this would come from API
  const mockTask: Task = {
    id: id,
    orderId: "ORD-2025-001",
    title: "Bounce House Delivery & Setup",
    description: "Deliver and set up large bounce house for birthday party. Customer has requested early setup at 9 AM. Please ensure all safety equipment is properly installed.",
    type: "delivery_and_setup",
    category: "bounce_house",
    priority: "high",
    status: "published",
    requiredSkills: ["delivery", "setup", "safety_inspection"],
    estimatedDuration: 180, // 3 hours
    scheduledDate: "2025-06-02T09:00:00.000Z",
    scheduledTimeSlot: {
      startTime: "2025-06-02T09:00:00.000Z",
      endTime: "2025-06-02T12:00:00.000Z",
      isFlexible: false,
    },
    location: {
      coordinates: { latitude: 29.4241, longitude: -98.4936 },
      address: {
        street: "1234 Oak Tree Lane",
        city: "San Antonio",
        state: "TX",
        zipCode: "78201",
        country: "USA",
        formattedAddress: "1234 Oak Tree Lane, San Antonio, TX 78201",
      },
      accessInstructions: "Use side gate, code is 1234. Park in driveway.",
      contactOnArrival: true,
      gateCode: "1234",
    },
    customer: {
      id: "CUST-001",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@email.com",
      phone: "(555) 123-4567",
      preferredContactMethod: "phone",
      specialInstructions: "Please call 15 minutes before arrival. Dog in backyard - please keep gate closed.",
    },
    equipment: [
      {
        id: "EQ-001",
        name: "Large Castle Bounce House",
        type: "bounce_house",
        dimensions: { length: 15, width: 15, height: 12 },
        weight: 250,
        powerRequirements: {
          voltage: 110,
          amperage: 15,
          outlets: 1,
          extensionCordLength: 50,
          generatorRequired: false,
        },
        condition: "excellent",
        images: [],
        setupInstructions: "Requires 20x20 flat area, 6ft clearance on all sides",
        safetyNotes: "Check all anchor points, ensure proper inflation before use",
      },
    ],
    instructions: [
      {
        id: "INST-001",
        type: "safety",
        title: "Safety Inspection",
        content: "Perform complete safety inspection before customer handoff",
        order: 1,
        isRequired: true,
        estimatedTime: 15,
      },
      {
        id: "INST-002",
        type: "setup",
        title: "Setup Instructions",
        content: "Follow manufacturer setup guide, ensure all stakes are secure",
        order: 2,
        isRequired: true,
        estimatedTime: 45,
      },
    ],
    compensation: {
      baseAmount: 125.00,
      bonuses: [
        {
          type: "rush",
          amount: 25.00,
          description: "Early morning setup bonus",
        },
        {
          type: "difficulty",
          amount: 15.00,
          description: "Large equipment bonus",
        },
      ],
      totalAmount: 165.00,
      currency: "USD",
      paymentMethod: "direct_deposit",
      paymentSchedule: "weekly",
    },
    createdAt: "2025-06-01T10:00:00.000Z",
    updatedAt: "2025-06-01T10:00:00.000Z",
  };

  const isLoading = false; // Would be from API hook
  const isError = false; // Would be from API hook

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
    // Open navigation app
    const { latitude, longitude } = mockTask.location.coordinates;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const handleCallCustomer = () => {
    window.open(`tel:${mockTask.customer.phone}`, '_self');
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
      return 'Today ' + formatTaskTime(date);
    } else if (isTomorrow(date)) {
      return 'Tomorrow ' + formatTaskTime(date);
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
              <IonBackButton defaultHref="/tasks/available" />
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

  if (isError || !mockTask) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tasks/available" />
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
            <IonBackButton defaultHref="/tasks/available" />
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
                    {mockTask.title}
                  </IonCardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <IonBadge color={getStatusColor(mockTask.status)}>
                      {mockTask.status.replace('_', ' ').toUpperCase()}
                    </IonBadge>
                    <IonBadge color={getPriorityColor(mockTask.priority)}>
                      {mockTask.priority.toUpperCase()} PRIORITY
                    </IonBadge>
                  </div>
                </div>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <IonText className="text-gray-700">
                {mockTask.description}
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* Compensation Details */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Compensation</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <CompensationDisplay
                compensation={mockTask.compensation}
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
                  <IonIcon icon={calendarOutline} className="mr-3 text-purple-500" />
                  <div>
                    <div className="font-medium">Scheduled Time</div>
                    <div className="text-sm text-gray-600">
                      {formatScheduledDate(mockTask.scheduledDate)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <IonIcon icon={timeOutline} className="mr-3 text-orange-500" />
                  <div>
                    <div className="font-medium">Estimated Duration</div>
                    <div className="text-sm text-gray-600">
                      {Math.round(mockTask.estimatedDuration / 60)}h {mockTask.estimatedDuration % 60}m
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <IonIcon icon={locationOutline} className="mr-3 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-gray-600">
                      {mockTask.location.address.formattedAddress}
                    </div>
                    {mockTask.location.accessInstructions && (
                      <div className="text-xs text-gray-500 mt-1">
                        Access: {mockTask.location.accessInstructions}
                      </div>
                    )}
                  </div>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={handleNavigate}
                  >
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
                    <IonIcon icon={personOutline} className="mr-3 text-indigo-500" />
                    <div>
                      <div className="font-medium">
                        {mockTask.customer.firstName} {mockTask.customer.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {mockTask.customer.email}
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

                {mockTask.customer.specialInstructions && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <div className="flex items-start">
                      <IonIcon icon={informationCircleOutline} className="mr-2 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-yellow-800">
                          Special Instructions
                        </div>
                        <div className="text-sm text-yellow-700">
                          {mockTask.customer.specialInstructions}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Equipment */}
          {mockTask.equipment.length > 0 && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Equipment</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {mockTask.equipment.map((equipment) => (
                  <div key={equipment.id} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0 mb-3 last:mb-0">
                    <div className="font-medium">{equipment.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {equipment.dimensions.length}' × {equipment.dimensions.width}' × {equipment.dimensions.height}'
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
          {mockTask.requiredSkills.length > 0 && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Required Skills</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="flex flex-wrap gap-2">
                  {mockTask.requiredSkills.map((skill, index) => (
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
            {mockTask.status === "published" && (
              <IonButton
                expand="block"
                color="primary"
                onClick={handleClaimTask}
                disabled={claimTaskMutation.isPending}
              >
                {claimTaskMutation.isPending ? "Claiming..." : "Claim Task"}
              </IonButton>
            )}

            {mockTask.status === "assigned" && (
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

            {mockTask.status === "in_progress" && (
              <IonButton
                expand="block"
                color="success"
                onClick={handleCompleteTask}
              >
                <IonIcon icon={checkmarkCircleOutline} slot="start" />
                Complete Task
              </IonButton>
            )}

            <IonButton
              expand="block"
              fill="outline"
              onClick={handleNavigate}
            >
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
