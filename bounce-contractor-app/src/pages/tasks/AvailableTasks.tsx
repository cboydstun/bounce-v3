import React, { useState, useCallback } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonToast,
} from "@ionic/react";
import { filterOutline, mapOutline, listOutline } from "ionicons/icons";
import { useInfiniteTasks } from "../../hooks/tasks/useTasks";
import { useGeolocation } from "../../hooks/location/useGeolocation";
import { useTaskEvents } from "../../hooks/realtime/useTaskEvents";
import { useNotificationSystem } from "../../hooks/notifications/useNotificationSystem";
import TaskList from "../../components/tasks/TaskList";
import TaskFilters from "../../components/tasks/TaskFilters";
import ConnectionStatus from "../../components/common/ConnectionStatus";
import { TaskFilters as TaskFiltersType, Task } from "../../types/task.types";
import { useHistory } from "react-router-dom";
import {
  useTaskTranslation,
  useNotificationTranslation,
} from "../../hooks/common/useI18n";

type ViewMode = "list" | "map";

const AvailableTasks: React.FC = () => {
  const history = useHistory();
  const { t: taskT } = useTaskTranslation();
  const { t: notificationT } = useNotificationTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<TaskFiltersType>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [realtimeToast, setRealtimeToast] = useState(false);
  const [realtimeMessage, setRealtimeMessage] = useState("");

  const {
    location,
    isLoading: locationLoading,
    error: locationError,
    getDistanceFromCurrent,
  } = useGeolocation();

  // Initialize notification system for real-time task alerts
  const notificationSystem = useNotificationSystem({
    autoInitialize: true,
    enableAudioAlerts: true,
    enablePushNotifications: true,
  });

  // Configuration for task notifications
  const MAX_NOTIFICATION_RADIUS = 50; // miles - configurable radius for task notifications

  // Smart filtering function to determine if we should notify for a task
  const shouldNotifyForTask = useCallback(
    (task: Task): boolean => {
      try {
        console.log(`🔍 Evaluating task ${task.id} for notifications:`, {
          taskTitle: task.title,
          taskStatus: task.status,
          taskPriority: task.priority,
          hasLocation: !!location,
          taskHasLocation: !!task.location?.coordinates,
        });

        // TEMPORARILY DISABLED: Distance-based filtering for debugging
        // if (location && task.location?.coordinates) {
        //   const distance = getDistanceFromCurrent(
        //     task.location.coordinates.latitude,
        //     task.location.coordinates.longitude
        //   );
        //
        //   if (distance && distance > MAX_NOTIFICATION_RADIUS) {
        //     console.log(`Task ${task.id} filtered out: distance ${distance.toFixed(1)} miles > ${MAX_NOTIFICATION_RADIUS} miles`);
        //     return false;
        //   }
        // }

        // Status filtering - only notify for available tasks
        if (task.status !== "published") {
          console.log(
            `❌ Task ${task.id} filtered out: status ${task.status} is not published`,
          );
          return false;
        }

        console.log(
          `✅ Task ${task.id} passed all filters - notifications will be sent`,
        );
        return true;
      } catch (error) {
        console.error("Error in shouldNotifyForTask:", error);
        return true; // Default to showing notification if filtering fails
      }
    },
    [location, getDistanceFromCurrent],
  );

  // Send rich push notification for new task
  const sendTaskNotification = useCallback(
    async (task: Task): Promise<void> => {
      try {
        // Calculate distance for notification content
        let distanceText = "";
        if (location && task.location?.coordinates) {
          const distance = getDistanceFromCurrent(
            task.location.coordinates.latitude,
            task.location.coordinates.longitude,
          );
          if (distance) {
            distanceText = ` • ${distance.toFixed(1)} mi away`;
          }
        }

        // Create priority-based notification content
        const priorityEmoji =
          {
            low: "📋",
            medium: "⚡",
            high: "🔥",
            urgent: "🚨",
          }[task.priority] || "📋";

        const priorityText =
          task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

        const title = `${priorityEmoji} New ${priorityText} Priority Task`;
        const body = `${task.title} - $${task.compensation.totalAmount}${distanceText}`;

        // Use browser's native Notification API for cross-platform compatibility
        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification(title, {
            body,
            icon: "/favicon.png",
            badge: "/favicon.png",
            data: {
              taskId: task.id,
              type: "new_task",
              priority: task.priority,
              compensation: task.compensation.totalAmount,
              location: task.location?.address?.city || "Unknown location",
              scheduledDate: task.scheduledDate,
            },
            tag: `task-${task.id}`,
            requireInteraction: true,
            silent: false,
          });

          // Handle notification click
          notification.onclick = () => {
            window.focus();
            history.push(`/task-details/${task.id}`);
            notification.close();
          };

          // Auto-close after 10 seconds
          setTimeout(() => {
            notification.close();
          }, 10000);

          console.log(`Browser notification sent for task ${task.id}:`, title);
        } else if (Notification.permission === "default") {
          // Request permission if not yet granted
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            // Retry sending notification
            await sendTaskNotification(task);
          } else {
            console.log(
              "Notification permission denied, skipping browser notification",
            );
          }
        } else {
          console.log(
            "Browser notifications not supported or permission denied",
          );
        }
      } catch (error) {
        console.error("Failed to send task notification:", error);
        // Don't throw - notification failure shouldn't break the app
      }
    },
    [location, getDistanceFromCurrent, history],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteTasks({
    filters,
    enabled: true,
  });

  // Enhanced new task handler with notifications
  const handleNewTask = useCallback(
    async (task: Task): Promise<void> => {
      try {
        // Always show the in-app toast (existing behavior)
        setRealtimeMessage(`New task available: ${task.title}`);
        setRealtimeToast(true);

        // Auto-refresh to show the new task (existing behavior)
        refetch();

        // Smart filtering for notifications
        if (shouldNotifyForTask(task)) {
          console.log(
            `Sending notifications for new task: ${task.title} (Priority: ${task.priority})`,
          );

          // Play audio alert based on task priority
          if (
            notificationSystem.audioAlerts.isInitialized &&
            notificationSystem.audioAlerts.isEnabled
          ) {
            try {
              await notificationSystem.playTaskAlert(task.priority);
              console.log(
                `Audio alert played for task ${task.id} with priority ${task.priority}`,
              );
            } catch (audioError) {
              console.error("Failed to play audio alert:", audioError);
            }
          }

          // Send push notification
          if (
            notificationSystem.pushNotifications.isInitialized &&
            notificationSystem.pushNotifications.isEnabled
          ) {
            try {
              await sendTaskNotification(task);
            } catch (notificationError) {
              console.error(
                "Failed to send push notification:",
                notificationError,
              );
            }
          }
        } else {
          console.log(`Task ${task.id} filtered out - no notifications sent`);
        }
      } catch (error) {
        console.error("Error in handleNewTask:", error);
        // Ensure the basic functionality still works even if notifications fail
      }
    },
    [shouldNotifyForTask, notificationSystem, sendTaskNotification, refetch],
  );

  // Real-time task events with enhanced notifications
  const { isConnected } = useTaskEvents({
    onNewTask: handleNewTask, // Use our enhanced handler with notifications
    onTaskClaimed: (task: Task) => {
      setRealtimeMessage(
        `Task "${task.title}" was claimed by another contractor`,
      );
      setRealtimeToast(true);
      // Auto-refresh to remove the claimed task
      refetch();
    },
    onTaskUpdated: (task: Task) => {
      setRealtimeMessage(`Task "${task.title}" was updated`);
      setRealtimeToast(true);
    },
    onTaskCancelled: (task: Task) => {
      setRealtimeMessage(`Task "${task.title}" was cancelled`);
      setRealtimeToast(true);
      // Auto-refresh to remove the cancelled task
      refetch();
    },
    autoRefreshQueries: true,
  });

  // Flatten the paginated data
  const tasks = data?.pages.flatMap((page) => page.tasks) || [];

  const handleRefresh = async () => {
    await refetch();
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleTaskClaim = (taskId: string) => {
    setToastMessage("Task claimed successfully!");
    setShowToast(true);
  };

  const handleTaskDetails = (taskId: string) => {
    history.push(`/task-details/${taskId}`);
  };

  const handleTaskNavigate = (taskId: string) => {
    // This would open navigation app or show directions
    setToastMessage("Opening navigation...");
    setShowToast(true);
  };

  const handleFilters = () => {
    setShowFilters(true);
  };

  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    // The filters are already applied through the filters state
    // The useInfiniteTasks hook will automatically refetch with new filters
    setToastMessage("Filters applied!");
    setShowToast(true);
  };

  const handleClearFilters = () => {
    setFilters({});
    setToastMessage("Filters cleared!");
    setShowToast(true);
  };

  // Manual test function to trigger notifications
  const handleTestNotification = useCallback(async () => {
    console.log("🧪 Manual notification test triggered");

    // Create a mock task for testing
    const mockTask: Task = {
      id: `test-${Date.now()}`,
      orderId: "test-order",
      title: "Test Bounce House Setup",
      description: "This is a test task for notification debugging",
      type: "delivery_and_setup",
      category: "bounce_house",
      priority: "high",
      status: "published",
      requiredSkills: ["setup", "delivery"],
      estimatedDuration: 120,
      scheduledDate: new Date().toISOString(),
      scheduledTimeSlot: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        isFlexible: false,
      },
      location: {
        coordinates: { latitude: 29.4241, longitude: -98.4936 },
        address: {
          street: "123 Test Street",
          city: "San Antonio",
          state: "TX",
          zipCode: "78201",
          country: "US",
          formattedAddress: "123 Test Street, San Antonio, TX 78201",
        },
        contactOnArrival: true,
      },
      customer: {
        id: "test-customer",
        firstName: "Test",
        lastName: "Customer",
        email: "test@example.com",
        phone: "555-0123",
        preferredContactMethod: "phone",
      },
      equipment: [],
      instructions: [],
      compensation: {
        baseAmount: 150,
        bonuses: [],
        totalAmount: 150,
        currency: "USD",
        paymentMethod: "direct_deposit",
        paymentSchedule: "weekly",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("🧪 Calling handleNewTask with mock task:", mockTask);
    await handleNewTask(mockTask);
  }, [handleNewTask]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{taskT("availableTasks.title")}</IonTitle>
          <div slot="end" className="flex items-center space-x-2">
            <ConnectionStatus showText={false} size="small" />
            <IonButton fill="clear" onClick={handleFilters}>
              <IonIcon icon={filterOutline} />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Real-time Connection Status */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                {taskT("availableTasks.realtimeUpdates")}
              </h3>
              <p className="text-xs text-gray-500">
                {isConnected
                  ? taskT("availableTasks.liveUpdatesEnabled")
                  : taskT("availableTasks.connectingToUpdates")}
              </p>
              {/* Notification Status */}
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <span className="text-xs">🔊</span>
                  <span className="text-xs text-gray-600">
                    Audio:{" "}
                    {notificationSystem.audioAlerts.isEnabled ? "✅" : "❌"}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">🔔</span>
                  <span className="text-xs text-gray-600">
                    Push:{" "}
                    {notificationSystem.pushNotifications.isEnabled
                      ? "✅"
                      : "❌"}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">📍</span>
                  <span className="text-xs text-gray-600">
                    Location: {location ? "✅" : "❌"}
                  </span>
                </div>
              </div>
              {/* Debug Test Button */}
              <div className="mt-3">
                <IonButton
                  size="small"
                  fill="outline"
                  color="primary"
                  onClick={handleTestNotification}
                >
                  🧪 Test Notification
                </IonButton>
              </div>
            </div>
            <ConnectionStatus showText={true} size="small" />
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="p-4 bg-gray-50">
          <IonSegment
            value={viewMode}
            onIonChange={(e) => setViewMode(e.detail.value as ViewMode)}
          >
            <IonSegmentButton value="list">
              <IonIcon icon={listOutline} />
              <IonLabel>{taskT("availableTasks.listView")}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="map">
              <IonIcon icon={mapOutline} />
              <IonLabel>{taskT("availableTasks.mapView")}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Location Status */}
        {locationLoading && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400">
            <p className="text-sm text-blue-700">
              📍 {taskT("availableTasks.gettingLocation")}
            </p>
          </div>
        )}

        {locationError && (
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-700">
              ⚠️ {taskT("availableTasks.locationDenied")}
            </p>
          </div>
        )}

        {location && (
          <div className="p-4 bg-green-50 border-l-4 border-green-400">
            <p className="text-sm text-green-700">
              ✅ {taskT("availableTasks.showingNearbyTasks")}
            </p>
          </div>
        )}

        {/* Task List */}
        {viewMode === "list" && (
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            isError={isError}
            error={error}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={handleLoadMore}
            onRefresh={handleRefresh}
            onTaskClaim={handleTaskClaim}
            onTaskDetails={handleTaskDetails}
            onTaskNavigate={handleTaskNavigate}
            showClaimButton={true}
            showNavigateButton={false}
            emptyMessage={taskT("availableTasks.noTasks")}
            emptyIcon="📋"
          />
        )}

        {/* Map View Placeholder */}
        {viewMode === "map" && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🗺️</span>
              </div>
              <h2 className="text-lg font-semibold mb-2">Map View</h2>
              <p className="text-gray-600 text-sm">
                Map integration coming soon! You'll be able to see tasks on a
                map.
              </p>
            </div>
          </div>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
        <IonToast
          isOpen={realtimeToast}
          onDidDismiss={() => setRealtimeToast(false)}
          message={realtimeMessage}
          duration={3000}
          position="top"
          color="primary"
        />

        {/* Task Filters Modal */}
        <TaskFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />
      </IonContent>
    </IonPage>
  );
};

export default AvailableTasks;
