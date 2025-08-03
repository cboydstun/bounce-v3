import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonToast,
  IonFab,
  IonFabButton,
  IonIcon,
} from "@ionic/react";
import { addOutline } from "ionicons/icons";
import { useMyTasks } from "../../hooks/tasks/useTasks";
import TaskList from "../../components/tasks/TaskList";
import { TaskFilters, TaskStatus } from "../../types/task.types";
import { useHistory } from "react-router-dom";
import { mapMobileStatusToApiStatus } from "../../hooks/tasks/useTaskActions";
import { useTaskTranslation } from "../../hooks/common/useI18n";

type TaskFilter = "upcoming" | "completed" | "all";

const MyTasks: React.FC = () => {
  const { t } = useTaskTranslation();
  const history = useHistory();
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("upcoming");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Create filters based on selected tab
  const getFilters = (filter: TaskFilter) => {
    // Helper function to map mobile statuses to API statuses and remove duplicates
    const mapStatusesToApi = (mobileStatuses: TaskStatus[]) => {
      return mobileStatuses
        .map(mapMobileStatusToApiStatus)
        .filter((status, index, arr) => arr.indexOf(status) === index); // Remove duplicates
    };

    switch (filter) {
      case "upcoming":
        return {
          status: mapStatusesToApi([
            "published",
            "assigned",
            "accepted",
            "in_progress",
            "en_route",
            "on_site",
          ] as TaskStatus[]),
        };
      case "completed":
        return {
          status: mapStatusesToApi([
            "completed",
            "cancelled",
            "failed",
          ] as TaskStatus[]),
        };
      case "all":
      default:
        return {
          // Exclude draft since contractors shouldn't see draft tasks
          status: mapStatusesToApi([
            "published",
            "assigned",
            "accepted",
            "in_progress",
            "en_route",
            "on_site",
            "completed",
            "cancelled",
            "failed",
          ] as TaskStatus[]),
        };
    }
  };

  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
  } = useMyTasks({
    filters: getFilters(activeFilter) as TaskFilters,
    enabled: true,
  });

  const tasks = tasksData?.tasks || [];

  const handleRefresh = async () => {
    await refetch();
  };

  const handleTaskDetails = (taskId: string) => {
    history.push(`/task-details/${taskId}`);
  };

  const handleTaskNavigate = (taskId: string) => {
    // This would open navigation app or show directions
    setToastMessage(t("myTasks.toast.openingNavigation"));
    setShowToast(true);
  };

  const handleTaskUpdate = (taskId: string) => {
    // This would open task update modal
    setToastMessage(t("myTasks.toast.taskUpdateComingSoon"));
    setShowToast(true);
  };

  const getEmptyMessage = (filter: TaskFilter) => {
    switch (filter) {
      case "upcoming":
        return t("myTasks.empty.upcoming");
      case "completed":
        return t("myTasks.empty.completed");
      case "all":
      default:
        return t("myTasks.empty.all");
    }
  };

  const getEmptyIcon = (filter: TaskFilter) => {
    switch (filter) {
      case "upcoming":
        return "⏳";
      case "completed":
        return "✅";
      case "all":
      default:
        return "📋";
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("myTasks.title")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Task Filter Tabs */}
        <div className="p-4 bg-gray-50">
          <IonSegment
            value={activeFilter}
            onIonChange={(e) => setActiveFilter(e.detail.value as TaskFilter)}
          >
            <IonSegmentButton value="upcoming">
              <IonLabel>{t("myTasks.filters.upcoming")}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="completed">
              <IonLabel>{t("myTasks.filters.completed")}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="all">
              <IonLabel>{t("myTasks.filters.all")}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Task List */}
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRefresh={handleRefresh}
          onTaskDetails={handleTaskDetails}
          onTaskNavigate={handleTaskNavigate}
          showClaimButton={false}
          showNavigateButton={true}
          emptyMessage={getEmptyMessage(activeFilter)}
          emptyIcon={getEmptyIcon(activeFilter)}
        />

        {/* Floating Action Button for Quick Actions */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => handleTaskUpdate("")}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default MyTasks;
