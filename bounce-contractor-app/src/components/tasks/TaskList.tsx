import React from "react";
import {
  IonList,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonText,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import TaskCard from "./TaskCard";
import { Task } from "../../types/task.types";
import { useClaimTask } from "../../hooks/tasks/useTaskActions";

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => Promise<void>;
  onTaskClaim?: (taskId: string) => void;
  onTaskDetails?: (taskId: string) => void;
  onTaskNavigate?: (taskId: string) => void;
  showClaimButton?: boolean;
  showNavigateButton?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading = false,
  isError = false,
  error = null,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  onRefresh,
  onTaskClaim,
  onTaskDetails,
  onTaskNavigate,
  showClaimButton = true,
  showNavigateButton = false,
  emptyMessage = "No tasks available",
  emptyIcon = "📋",
}) => {
  const claimTaskMutation = useClaimTask();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await onRefresh?.();
    } finally {
      event.detail.complete();
    }
  };

  const handleInfiniteScroll = (event: CustomEvent) => {
    if (hasNextPage && !isFetchingNextPage) {
      onLoadMore?.();
    }
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  const handleTaskClaim = async (taskId: string) => {
    try {
      await claimTaskMutation.mutateAsync({
        taskId,
        estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      });
      onTaskClaim?.(taskId);
    } catch (error) {
      console.error("Failed to claim task:", error);
      // Error handling will be shown by the mutation
    }
  };

  // Loading state
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <IonSpinner name="crescent" className="w-8 h-8" />
        <IonText className="text-gray-500">Loading tasks...</IonText>
      </div>
    );
  }

  // Error state
  if (isError && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 p-8">
        <div className="text-4xl">⚠️</div>
        <div className="text-center">
          <IonText className="text-lg font-medium text-gray-900">
            Unable to load tasks
          </IonText>
          <IonText className="text-sm text-gray-500 block mt-1">
            {error?.message || "Please check your connection and try again"}
          </IonText>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 p-8">
        <div className="text-4xl">{emptyIcon}</div>
        <div className="text-center">
          <IonText className="text-lg font-medium text-gray-900">
            {emptyMessage}
          </IonText>
          <IonText className="text-sm text-gray-500 block mt-1">
            Pull down to refresh or check back later
          </IonText>
        </div>
      </div>
    );
  }

  return (
    <>
      {onRefresh && (
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon="chevron-down-circle-outline"
            pullingText="Pull to refresh"
            refreshingSpinner="crescent"
            refreshingText="Refreshing..."
          />
        </IonRefresher>
      )}

      <IonList className="task-list">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClaim={handleTaskClaim}
            onViewDetails={onTaskDetails}
            onNavigate={onTaskNavigate}
            showClaimButton={showClaimButton}
            showNavigateButton={showNavigateButton}
            isLoading={claimTaskMutation.isPending}
          />
        ))}
      </IonList>

      {/* Infinite Scroll */}
      {onLoadMore && (
        <IonInfiniteScroll
          onIonInfinite={handleInfiniteScroll}
          threshold="100px"
          disabled={!hasNextPage || isFetchingNextPage}
        >
          <IonInfiniteScrollContent
            loadingSpinner="crescent"
            loadingText={
              isFetchingNextPage ? "Loading more tasks..." : "Loading..."
            }
          />
        </IonInfiniteScroll>
      )}

      {/* Loading indicator for next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <IonSpinner name="crescent" />
        </div>
      )}
    </>
  );
};

export default TaskList;
