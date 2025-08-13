import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  IonToast,
  IonAlert,
  useIonToast,
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
import { useQueryClient } from "@tanstack/react-query";
import { useTaskById } from "../../hooks/tasks/useTasks";
import {
  useClaimTask,
  useUpdateTaskStatus,
  useCompleteTask,
} from "../../hooks/tasks/useTaskActions";
import { useTaskTranslation } from "../../hooks/common/useI18n";
import {
  isConsolidatedTask,
  parseConsolidatedTask,
  getNextStop,
  getRouteProgress,
  ParsedConsolidatedTask,
} from "../../utils/consolidatedTaskParser";
import {
  RouteOverviewCard,
  ItemsListCard,
  DeliveryScheduleCard,
  NextStopCard,
  RouteStatsCard,
  RouteTimeline,
  DetailedItemsCard,
} from "../../components/tasks/ConsolidatedTaskComponents";

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

const createFormatDateTime =
  (t: (key: string) => string) => (dateString: string) => {
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
        return `${t("details.today")} ${t("details.at")} ${timeStr}`;
      } else if (diffDays === 1) {
        return `${t("details.tomorrow")} ${t("details.at")} ${timeStr}`;
      } else if (diffDays === -1) {
        return `${t("details.yesterday")} ${t("details.at")} ${timeStr}`;
      } else {
        return `${date.toLocaleDateString()} ${t("details.at")} ${timeStr}`;
      }
    } catch (error) {
      return dateString;
    }
  };

const TaskDetails: React.FC = () => {
  const { t } = useTaskTranslation();
  const { id } = useParams<TaskDetailsParams>();
  const [presentToast] = useIonToast();
  const [showCompleteAlert, setShowCompleteAlert] = React.useState(false);
  const queryClient = useQueryClient();

  // Android fallback - extract ID from URL if useParams fails
  const taskId = id || extractTaskIdFromUrl();

  // Task action hooks
  const claimTaskMutation = useClaimTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const completeTaskMutation = useCompleteTask();

  // NEW: Local state to override task status for optimistic updates
  const [localTaskOverride, setLocalTaskOverride] = useState<{
    status?: string;
    timestamp?: string;
  } | null>(null);

  // NEW: Polling fallback refs
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // NEW: Computed display task with local overrides
  const displayTask = useMemo(() => {
    if (!task) return null;

    return {
      ...task,
      // Override with local state if available
      status: localTaskOverride?.status || task.status,
      // Add visual indicator for optimistic updates
      _isOptimistic: !!localTaskOverride,
    };
  }, [task, localTaskOverride]);

  // NEW: Clear local override when server data updates
  useEffect(() => {
    if (task && localTaskOverride) {
      // If server status matches our local override, clear it
      if (task.status === localTaskOverride.status) {
        console.log(
          "🔄 Server status matches local override, clearing optimistic state",
        );
        setLocalTaskOverride(null);
      }
    }
  }, [task, localTaskOverride]);

  // NEW: Polling fallback function
  const startPollingFallback = useCallback(
    (taskId: string) => {
      // Clear any existing polling
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

      console.log("🔄 Starting Android polling fallback for task:", taskId);

      // Poll every 2 seconds for 20 seconds
      pollingIntervalRef.current = setInterval(() => {
        console.log("📡 Polling task status...");
        queryClient.refetchQueries({
          queryKey: ["tasks", "detail", taskId],
          exact: true,
        });
      }, 2000);

      // Stop polling after 20 seconds
      pollingTimeoutRef.current = setTimeout(() => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        console.log("⏹️ Stopped Android polling fallback");
      }, 20000);
    },
    [queryClient],
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  // Create formatDateTime function with translations
  const formatDateTime = useMemo(() => createFormatDateTime(t), [t]);

  // NEW: Parse consolidated task data
  const consolidatedTaskData = useMemo(() => {
    if (!displayTask) return null;
    return parseConsolidatedTask(displayTask);
  }, [displayTask]);

  // NEW: State for consolidated task progress tracking
  const [completedStops, setCompletedStops] = useState<number[]>([]);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [currentStop, setCurrentStop] = useState<number | undefined>();

  // NEW: Calculate route progress
  const routeProgress = useMemo(() => {
    if (!consolidatedTaskData?.isConsolidated) return null;
    return getRouteProgress(
      consolidatedTaskData.routeMetadata.totalStops,
      completedStops,
    );
  }, [consolidatedTaskData, completedStops]);

  // NEW: Get next stop
  const nextStop = useMemo(() => {
    if (!consolidatedTaskData?.isConsolidated) return null;
    return getNextStop(consolidatedTaskData.deliverySchedule, completedStops);
  }, [consolidatedTaskData, completedStops]);

  console.log("🔍 TaskDetails render:", {
    id: taskId,
    hasTask: !!task,
    hasDisplayTask: !!displayTask,
    isLoading,
    isError,
    queryEnabled: !!taskId && taskId.trim() !== "",
    localOverride: localTaskOverride,
    isConsolidated: consolidatedTaskData?.isConsolidated,
  });

  // DETAILED DEBUGGING: Log full task data
  if (displayTask) {
    console.log("📋 Full Task Data:", {
      id: displayTask.id,
      title: displayTask.title,
      type: displayTask.type,
      status: displayTask.status,
      description: displayTask.description,
      descriptionLength: displayTask.description?.length,
      compensation: displayTask.compensation,
      location: displayTask.location,
      scheduledDate: displayTask.scheduledDate,
      createdAt: displayTask.createdAt,
      updatedAt: displayTask.updatedAt,
    });

    console.log("🔍 Description Analysis:", {
      hasCompleteRoute: displayTask.description?.includes(
        "Complete delivery route with",
      ),
      hasItemsSection: displayTask.description?.includes(
        "📦 Items to Deliver:",
      ),
      hasScheduleSection: displayTask.description?.includes(
        "📍 Delivery Schedule:",
      ),
      hasSummarySection: displayTask.description?.includes("📊 Route Summary:"),
      hasRouteMetadata: displayTask.description?.includes(
        "--- Route Metadata ---",
      ),
      descriptionStart: displayTask.description?.substring(0, 100),
      descriptionEnd: displayTask.description?.substring(
        displayTask.description.length - 100,
      ),
    });
  }

  // DETAILED DEBUGGING: Log consolidated task parsing results
  if (consolidatedTaskData) {
    console.log("📊 Consolidated Task Data:", {
      isConsolidated: consolidatedTaskData.isConsolidated,
      itemsCount: consolidatedTaskData.items.length,
      stopsCount: consolidatedTaskData.deliverySchedule.length,
      routeMetadata: consolidatedTaskData.routeMetadata,
      rawSections: Object.keys(consolidatedTaskData.rawSections),
      items: consolidatedTaskData.items,
      deliverySchedule: consolidatedTaskData.deliverySchedule,
    });
  }

  // Button click handlers with optimistic updates
  const handleClaimTask = () => {
    if (!task) return;

    // IMMEDIATE: Update local state for instant UI feedback
    console.log('🚀 Optimistically updating task status to "assigned"');
    setLocalTaskOverride({
      status: "assigned",
      timestamp: new Date().toISOString(),
    });

    claimTaskMutation.mutate(
      {
        taskId: task.id,
        estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
        notes: "Task claimed via mobile app",
      },
      {
        onSuccess: () => {
          presentToast({
            message: "Task claimed successfully!",
            duration: 3000,
            position: "top",
            color: "success",
          });

          // Start Android polling fallback
          startPollingFallback(task.id);
        },
        onError: (error) => {
          // REVERT: Clear optimistic update on error
          console.log("❌ Reverting optimistic update due to error");
          setLocalTaskOverride(null);

          let errorMessage = error.message || "Failed to claim task";

          // Handle specific error cases
          if (error.code === "RESOURCE_CONFLICT" || error.statusCode === 409) {
            errorMessage =
              "This task has already been claimed by another contractor";
          }

          presentToast({
            message: errorMessage,
            duration: 4000,
            position: "top",
            color: "danger",
          });
        },
      },
    );
  };

  const handleStartTask = () => {
    if (!task) return;

    // IMMEDIATE: Update local state for instant UI feedback
    console.log('🚀 Optimistically updating task status to "in_progress"');
    setLocalTaskOverride({
      status: "in_progress",
      timestamp: new Date().toISOString(),
    });

    updateStatusMutation.mutate(
      {
        taskId: task.id,
        status: "in_progress", // Mobile app status
        timestamp: new Date().toISOString(),
        notes: "Task started",
      },
      {
        onSuccess: () => {
          presentToast({
            message: "Task started successfully!",
            duration: 3000,
            position: "top",
            color: "success",
          });

          // Start Android polling fallback
          startPollingFallback(task.id);
        },
        onError: (error) => {
          // REVERT: Clear optimistic update on error
          console.log("❌ Reverting optimistic update due to error");
          setLocalTaskOverride(null);

          presentToast({
            message: error.message || "Failed to start task",
            duration: 4000,
            position: "top",
            color: "danger",
          });
        },
      },
    );
  };

  const handleCompleteTask = () => {
    if (!task) return;

    // IMMEDIATE: Update local state for instant UI feedback
    console.log('🚀 Optimistically updating task status to "completed"');
    setLocalTaskOverride({
      status: "completed",
      timestamp: new Date().toISOString(),
    });

    completeTaskMutation.mutate(
      {
        taskId: task.id,
        completionPhotos: [], // Empty for now, can be enhanced later
        actualDuration: 120, // Default 2 hours
        completedAt: new Date().toISOString(),
        contractorNotes: "Task completed successfully",
      },
      {
        onSuccess: () => {
          presentToast({
            message: "Task completed successfully!",
            duration: 3000,
            position: "top",
            color: "success",
          });
          setShowCompleteAlert(false);

          // Start Android polling fallback
          startPollingFallback(task.id);
        },
        onError: (error) => {
          // REVERT: Clear optimistic update on error
          console.log("❌ Reverting optimistic update due to error");
          setLocalTaskOverride(null);

          presentToast({
            message: error.message || "Failed to complete task",
            duration: 4000,
            position: "top",
            color: "danger",
          });
          setShowCompleteAlert(false);
        },
      },
    );
  };

  const handleGetDirections = () => {
    const address = displayTask?.location?.address?.formattedAddress;
    if (address) {
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

  // Loading state
  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/available-tasks" />
            </IonButtons>
            <IonTitle>{t("details.title")}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="flex flex-col justify-center items-center h-full p-8">
            <IonSpinner name="crescent" />
            <IonText className="text-sm text-gray-500 mt-4 text-center">
              {t("details.loading")}
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Error state
  if (isError || !displayTask) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/available-tasks" />
            </IonButtons>
            <IonTitle>{t("details.title")}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <IonText className="text-lg font-medium text-gray-900">
              {t("details.notFound")}
            </IonText>
            <IonText className="text-sm text-gray-500 text-center mt-2">
              {error instanceof Error
                ? error.message
                : t("details.notFoundMessage")}
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
          <IonTitle>{displayTask.title || t("details.title")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4 space-y-4">
          {/* Consolidated Task UI */}
          {consolidatedTaskData?.isConsolidated ? (
            <>
              {/* Task Header with Route Badge */}
              <IonCard>
                <IonCardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IonIcon
                          icon={getTaskTypeIcon(displayTask.type)}
                          className={`text-${getTaskTypeColor(displayTask.type)}`}
                        />
                        <IonBadge color={getTaskTypeColor(displayTask.type)}>
                          {displayTask.type || "Task"}
                        </IonBadge>
                        <IonBadge color="secondary">Route Task</IonBadge>
                        <IonBadge
                          color={getPriorityColor(displayTask.priority)}
                        >
                          {displayTask.priority || "Medium"} Priority
                        </IonBadge>
                        <IonBadge color={getStatusColor(displayTask.status)}>
                          {displayTask.status || "Unknown"}
                          {displayTask._isOptimistic && " (syncing...)"}
                        </IonBadge>
                      </div>
                      <IonCardTitle className="text-lg font-semibold">
                        {(displayTask as any).mobileTitle ||
                          displayTask.title ||
                          "Task Details"}
                      </IonCardTitle>
                    </div>
                  </div>
                </IonCardHeader>
              </IonCard>

              {/* Route Overview */}
              <RouteOverviewCard
                metadata={consolidatedTaskData.routeMetadata}
                paymentAmount={displayTask.compensation?.totalAmount}
                progress={routeProgress || undefined}
              />

              {/* Next Stop (if route is in progress) */}
              {displayTask.status === "in_progress" && nextStop && (
                <NextStopCard
                  nextStop={nextStop}
                  onNavigate={() => {
                    const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(nextStop.address)}`;
                    window.open(mapsUrl, "_system");
                  }}
                  onMarkComplete={() => {
                    setCompletedStops((prev) => [...prev, nextStop.stopNumber]);
                    setCurrentStop(nextStop.stopNumber + 1);
                    presentToast({
                      message: `Stop ${nextStop.stopNumber} marked as complete!`,
                      duration: 2000,
                      position: "top",
                      color: "success",
                    });
                  }}
                />
              )}

              {/* Enhanced Items Breakdown - Shows detailed items grouped by order/stop */}
              <DetailedItemsCard
                items={consolidatedTaskData.items}
                deliverySchedule={consolidatedTaskData.deliverySchedule}
                completedItems={completedItems}
                onItemToggle={(itemKey, completed) => {
                  if (completed) {
                    setCompletedItems((prev) => [...prev, itemKey]);
                  } else {
                    setCompletedItems((prev) =>
                      prev.filter((key) => key !== itemKey),
                    );
                  }
                }}
                readonly={displayTask.status === "completed"}
              />

              {/* Detailed Route Timeline - Shows comprehensive stop details */}
              <RouteTimeline
                deliverySchedule={consolidatedTaskData.deliverySchedule}
                completedStops={completedStops}
                currentStop={currentStop}
                onNavigateToStop={(stop) => {
                  const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(stop.address)}`;
                  window.open(mapsUrl, "_system");
                }}
                onMarkStopComplete={(stopNumber) => {
                  setCompletedStops((prev) => [...prev, stopNumber]);
                  presentToast({
                    message: `Stop ${stopNumber} marked as complete!`,
                    duration: 2000,
                    position: "top",
                    color: "success",
                  });
                }}
                onCallCustomer={(stop) => {
                  // TODO: Implement customer calling functionality
                  presentToast({
                    message: `Calling ${stop.customerName}...`,
                    duration: 2000,
                    position: "top",
                    color: "primary",
                  });
                }}
                readonly={displayTask.status === "completed"}
              />

              {/* Route Statistics */}
              {routeProgress && (
                <RouteStatsCard
                  metadata={consolidatedTaskData.routeMetadata}
                  progress={routeProgress}
                  startTime={
                    displayTask.status !== "published"
                      ? formatDateTime(
                          displayTask.updatedAt || displayTask.createdAt,
                        )
                      : undefined
                  }
                />
              )}
            </>
          ) : (
            <>
              {/* Standard Task UI */}
              {/* Task Header */}
              <IonCard>
                <IonCardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IonIcon
                          icon={getTaskTypeIcon(displayTask.type)}
                          className={`text-${getTaskTypeColor(displayTask.type)}`}
                        />
                        <IonBadge color={getTaskTypeColor(displayTask.type)}>
                          {displayTask.type || "Task"}
                        </IonBadge>
                        <IonBadge
                          color={getPriorityColor(displayTask.priority)}
                        >
                          {displayTask.priority || "Medium"} Priority
                        </IonBadge>
                        <IonBadge color={getStatusColor(displayTask.status)}>
                          {displayTask.status || "Unknown"}
                          {displayTask._isOptimistic && " (syncing...)"}
                        </IonBadge>
                      </div>
                      <IonCardTitle className="text-lg font-semibold">
                        {displayTask.title || "Task Details"}
                      </IonCardTitle>
                    </div>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <IonText className="text-gray-700">
                    {(displayTask as any).mobileSummary ||
                      displayTask.description ||
                      "No description available"}
                  </IonText>
                </IonCardContent>
              </IonCard>

              {/* Scheduling Information */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle className="flex items-center gap-2">
                    <IonIcon
                      icon={calendarOutline}
                      className="text-purple-500"
                    />
                    {t("details.schedule")}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <IonIcon icon={timeOutline} className="text-orange-500" />
                      <div>
                        <div className="font-medium">
                          {t("details.scheduledTime")}
                        </div>
                        <div className="text-sm text-gray-600">
                          {displayTask.scheduledDate
                            ? formatDateTime(displayTask.scheduledDate)
                            : t("details.notScheduled")}
                        </div>
                      </div>
                    </div>

                    {displayTask.estimatedDuration && (
                      <div className="flex items-center gap-3">
                        <IonIcon icon={timeOutline} className="text-blue-500" />
                        <div>
                          <div className="font-medium">
                            {t("details.estimatedDuration")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {Math.floor(displayTask.estimatedDuration / 60)}h{" "}
                            {displayTask.estimatedDuration % 60}m
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Location Information */}
              {(displayTask.location?.address?.formattedAddress ||
                displayTask.location?.coordinates) && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="flex items-center gap-2">
                      <IonIcon
                        icon={locationOutline}
                        className="text-blue-500"
                      />
                      {t("details.location")}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="space-y-3">
                      {displayTask.location?.address?.formattedAddress && (
                        <div className="flex items-start gap-3">
                          <IonIcon
                            icon={homeOutline}
                            className="text-green-500 mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {t("details.address")}
                            </div>
                            <div className="text-sm text-gray-600">
                              {displayTask.location.address.formattedAddress}
                            </div>
                          </div>
                          <IonButton fill="clear" size="small">
                            <IonIcon icon={navigateOutline} />
                          </IonButton>
                        </div>
                      )}

                      {displayTask.location?.coordinates && (
                        <div className="flex items-center gap-3">
                          <IonIcon
                            icon={locationOutline}
                            className="text-red-500"
                          />
                          <div>
                            <div className="font-medium">
                              {t("details.coordinates")}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {displayTask.location.coordinates.latitude},{" "}
                              {displayTask.location.coordinates.longitude}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Payment Information */}
              {displayTask.compensation?.totalAmount && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="flex items-center gap-2">
                      <IonIcon icon={cashOutline} className="text-green-500" />
                      {t("details.payment")}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-green-600">
                        ${displayTask.compensation.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {displayTask.compensation.currency || "USD"}
                      </div>
                    </div>
                    {displayTask.compensation.baseAmount !==
                      displayTask.compensation.totalAmount && (
                      <div className="text-sm text-gray-600 mt-1">
                        {t("details.base")}: $
                        {displayTask.compensation.baseAmount.toFixed(2)}
                        {displayTask.compensation.bonuses?.length > 0 && (
                          <span>
                            {" "}
                            + {displayTask.compensation.bonuses.length}{" "}
                            {t("details.bonus")}
                          </span>
                        )}
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>
              )}

              {/* Assignment Information */}
              {displayTask.contractor && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="flex items-center gap-2">
                      <IonIcon
                        icon={personOutline}
                        className="text-indigo-500"
                      />
                      {t("details.assignment")}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <IonIcon
                          icon={personOutline}
                          className="text-blue-500"
                        />
                        <div>
                          <div className="font-medium">
                            {t("details.assignedContractor")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {displayTask.contractor.contractorId}
                          </div>
                          {displayTask.contractor.assignedAt && (
                            <div className="text-xs text-gray-500">
                              {t("details.assigned")}:{" "}
                              {formatDateTime(
                                displayTask.contractor.assignedAt,
                              )}
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
                    {t("details.taskInformation")}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <IonIcon
                        icon={businessOutline}
                        className="text-blue-500"
                      />
                      <div>
                        <div className="font-medium">Task ID</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {displayTask.id}
                        </div>
                      </div>
                    </div>

                    {displayTask.orderId && (
                      <div className="flex items-center gap-3">
                        <IonIcon
                          icon={businessOutline}
                          className="text-purple-500"
                        />
                        <div>
                          <div className="font-medium">
                            {t("details.orderId")}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {displayTask.orderId}
                          </div>
                        </div>
                      </div>
                    )}

                    {displayTask.createdAt && (
                      <div className="flex items-center gap-3">
                        <IonIcon icon={timeOutline} className="text-gray-500" />
                        <div>
                          <div className="font-medium">
                            {t("details.created")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDateTime(displayTask.createdAt)}
                          </div>
                        </div>
                      </div>
                    )}

                    {displayTask.updatedAt && (
                      <div className="flex items-center gap-3">
                        <IonIcon icon={timeOutline} className="text-gray-500" />
                        <div>
                          <div className="font-medium">
                            {t("details.lastUpdated")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDateTime(displayTask.updatedAt)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            </>
          )}

          {/* Action Buttons - Common for both consolidated and standard tasks */}
          <div className="space-y-3 pb-8">
            {displayTask.status === "published" && (
              <IonButton
                expand="block"
                color="primary"
                onClick={handleClaimTask}
                disabled={claimTaskMutation.isPending}
              >
                {claimTaskMutation.isPending ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <IonIcon icon={playOutline} slot="start" />
                )}
                {claimTaskMutation.isPending ? "Claiming..." : "Claim Task"}
                {displayTask._isOptimistic && (
                  <IonIcon
                    icon={timeOutline}
                    slot="end"
                    className="text-orange-500"
                  />
                )}
              </IonButton>
            )}

            {displayTask.status === "assigned" && (
              <IonButton
                expand="block"
                color="success"
                onClick={handleStartTask}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <IonIcon icon={playOutline} slot="start" />
                )}
                {updateStatusMutation.isPending ? "Starting..." : "Start Task"}
                {displayTask._isOptimistic && (
                  <IonIcon
                    icon={timeOutline}
                    slot="end"
                    className="text-orange-500"
                  />
                )}
              </IonButton>
            )}

            {displayTask.status === "in_progress" && (
              <IonButton
                expand="block"
                color="success"
                onClick={() => setShowCompleteAlert(true)}
                disabled={completeTaskMutation.isPending}
              >
                {completeTaskMutation.isPending ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                )}
                {completeTaskMutation.isPending
                  ? "Completing..."
                  : "Complete Task"}
                {displayTask._isOptimistic && (
                  <IonIcon
                    icon={timeOutline}
                    slot="end"
                    className="text-orange-500"
                  />
                )}
              </IonButton>
            )}

            {displayTask.location?.address?.formattedAddress && (
              <IonButton
                expand="block"
                fill="outline"
                color="primary"
                onClick={handleGetDirections}
              >
                <IonIcon icon={navigateOutline} slot="start" />
                Get Directions
              </IonButton>
            )}
          </div>
        </div>

        {/* Complete Task Confirmation Alert */}
        <IonAlert
          isOpen={showCompleteAlert}
          onDidDismiss={() => setShowCompleteAlert(false)}
          header="Complete Task"
          message="Are you sure you want to mark this task as completed? This action cannot be undone."
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => {
                setShowCompleteAlert(false);
              },
            },
            {
              text: "Complete",
              role: "confirm",
              handler: handleCompleteTask,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default TaskDetails;
