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

type TaskFilter = "active" | "completed" | "all";

const MyTasks: React.FC = () => {
  const history = useHistory();
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("active");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Create filters based on selected tab
  const getFilters = (filter: TaskFilter): TaskFilters => {
    switch (filter) {
      case "active":
        return {
          status: ["assigned", "accepted", "in_progress", "en_route", "on_site"] as TaskStatus[],
        };
      case "completed":
        return {
          status: ["completed"] as TaskStatus[],
        };
      case "all":
      default:
        return {};
    }
  };

  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
  } = useMyTasks({
    filters: getFilters(activeFilter),
    enabled: true,
  });

  const tasks = tasksData?.tasks || [];

  const handleRefresh = async () => {
    await refetch();
  };

  const handleTaskDetails = (taskId: string) => {
    history.push(`/tasks/${taskId}`);
  };

  const handleTaskNavigate = (taskId: string) => {
    // This would open navigation app or show directions
    setToastMessage("Opening navigation...");
    setShowToast(true);
  };

  const handleTaskUpdate = (taskId: string) => {
    // This would open task update modal
    setToastMessage("Task update coming soon!");
    setShowToast(true);
  };

  const getEmptyMessage = (filter: TaskFilter) => {
    switch (filter) {
      case "active":
        return "No active tasks";
      case "completed":
        return "No completed tasks";
      case "all":
      default:
        return "No tasks found";
    }
  };

  const getEmptyIcon = (filter: TaskFilter) => {
    switch (filter) {
      case "active":
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
          <IonTitle>My Tasks</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Task Filter Tabs */}
        <div className="p-4 bg-gray-50">
          <IonSegment
            value={activeFilter}
            onIonChange={(e) => setActiveFilter(e.detail.value as TaskFilter)}
          >
            <IonSegmentButton value="active">
              <IonLabel>Active</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="completed">
              <IonLabel>Completed</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="all">
              <IonLabel>All</IonLabel>
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
