import React, { useState } from "react";
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
import TaskList from "../../components/tasks/TaskList";
import ConnectionStatus from "../../components/common/ConnectionStatus";
import { TaskFilters, Task } from "../../types/task.types";
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
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [realtimeToast, setRealtimeToast] = useState(false);
  const [realtimeMessage, setRealtimeMessage] = useState("");

  const {
    location,
    isLoading: locationLoading,
    error: locationError,
  } = useGeolocation();

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

  // Real-time task events
  const { isConnected } = useTaskEvents({
    onNewTask: (task: Task) => {
      setRealtimeMessage(`New task available: ${task.title}`);
      setRealtimeToast(true);
      // Auto-refresh to show the new task
      refetch();
    },
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
    history.push(`/tasks/${taskId}`);
  };

  const handleTaskNavigate = (taskId: string) => {
    // This would open navigation app or show directions
    setToastMessage("Opening navigation...");
    setShowToast(true);
  };

  const handleFilters = () => {
    // This would open a filter modal
    setToastMessage("Filters coming soon!");
    setShowToast(true);
  };

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
      </IonContent>
    </IonPage>
  );
};

export default AvailableTasks;
