import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../services/api/apiClient";
import {
  Task,
  TaskClaimRequest,
  TaskStatusUpdate,
  TaskCompletionData,
} from "../../types/task.types";
import { ApiResponse, ApiError } from "../../types/api.types";
import { useAuthStore } from "../../store/authStore";
import { useNetwork } from "../common/useNetwork";
import { useOfflineQueue } from "../common/useOfflineQueue";
import { offlineService } from "../../services/offline/offlineService";

// Hook for claiming a task with offline support
export const useClaimTask = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { isOnline } = useNetwork();
  const { queueAction } = useOfflineQueue();

  return useMutation({
    mutationFn: async (
      claimRequest: TaskClaimRequest,
    ): Promise<Task | { queued: true; actionId: string }> => {
      // If offline, queue the action
      if (!isOnline) {
        const actionId = await queueAction({
          type: "task_claim",
          payload: {
            taskId: claimRequest.taskId,
            contractorId: user?.id,
            estimatedArrival: claimRequest.estimatedArrival,
            notes: claimRequest.notes,
          },
          priority: "high",
          endpoint: `/tasks/${claimRequest.taskId}/claim`,
          method: "POST",
          requiresAuth: true,
        });

        // Return a queued response
        return { queued: true, actionId };
      }

      // If online, execute immediately
      const response: ApiResponse<Task> = await apiClient.post(
        `/tasks/${claimRequest.taskId}/claim`,
        {
          estimatedArrival: claimRequest.estimatedArrival,
          notes: claimRequest.notes,
        },
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to claim task");
      }

      return response.data!;
    },
    onSuccess: (result, claimRequest) => {
      if ("queued" in result) {
        // Handle queued action
        console.log(`Task claim queued for offline sync: ${result.actionId}`);

        // Optimistically update the UI
        const optimisticTask = {
          id: claimRequest.taskId,
          status: "assigned",
          assignedContractor: user?.id,
          estimatedArrival: claimRequest.estimatedArrival,
          notes: claimRequest.notes,
          _offline: true, // Mark as offline change
        };

        queryClient.setQueryData(
          ["tasks", "detail", claimRequest.taskId],
          optimisticTask,
        );
      } else {
        // Handle successful online claim
        const claimedTask = result as Task;
        queryClient.setQueryData(
          ["tasks", "detail", claimedTask.id],
          claimedTask,
        );

        // Invalidate and refetch related queries
        queryClient.invalidateQueries({ queryKey: ["tasks", "available"] });
        queryClient.invalidateQueries({ queryKey: ["tasks", "my-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["tasks", "nearby"] });
        queryClient.invalidateQueries({ queryKey: ["tasks", "stats"] });
      }
    },
    onError: (error: ApiError) => {
      console.error("Failed to claim task:", error);

      // Provide more specific error messages for different error types
      if (error.code === "RESOURCE_CONFLICT") {
        // Task is likely already claimed by another contractor
        console.warn(
          "This task has already been claimed by another contractor",
        );
      }
    },
  });
};

// Hook for updating task status with offline support
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useNetwork();
  const { queueAction } = useOfflineQueue();

  return useMutation({
    mutationFn: async (
      statusUpdate: TaskStatusUpdate,
    ): Promise<Task | { queued: true; actionId: string }> => {
      // If offline, queue the action
      if (!isOnline) {
        const actionId = await queueAction({
          type: "task_status_update",
          payload: {
            taskId: statusUpdate.taskId,
            status: statusUpdate.status,
            location: statusUpdate.location,
            notes: statusUpdate.notes,
            photos: statusUpdate.photos,
            timestamp: statusUpdate.timestamp,
          },
          priority: "medium",
          endpoint: `/tasks/${statusUpdate.taskId}/status`,
          method: "PUT",
          requiresAuth: true,
        });

        return { queued: true, actionId };
      }

      // If online, execute immediately
      const response: ApiResponse<Task> = await apiClient.put(
        `/tasks/${statusUpdate.taskId}/status`,
        {
          status: statusUpdate.status,
          location: statusUpdate.location,
          notes: statusUpdate.notes,
          photos: statusUpdate.photos,
          timestamp: statusUpdate.timestamp,
        },
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to update task status");
      }

      return response.data!;
    },
    onSuccess: (result, statusUpdate) => {
      if ("queued" in result) {
        // Handle queued action
        console.log(
          `Task status update queued for offline sync: ${result.actionId}`,
        );

        // Optimistically update the UI
        const optimisticTask = {
          id: statusUpdate.taskId,
          status: statusUpdate.status,
          location: statusUpdate.location,
          notes: statusUpdate.notes,
          timestamp: statusUpdate.timestamp,
          _offline: true, // Mark as offline change
        };

        queryClient.setQueryData(
          ["tasks", "detail", statusUpdate.taskId],
          (oldData: any) => ({ ...oldData, ...optimisticTask }),
        );
      } else {
        // Handle successful online update
        const updatedTask = result as Task;
        queryClient.setQueryData(
          ["tasks", "detail", updatedTask.id],
          updatedTask,
        );

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["tasks", "my-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["tasks", "stats"] });
      }
    },
    onError: (error: ApiError) => {
      console.error("Failed to update task status:", error);
    },
  });
};

// Hook for completing a task
export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (completionData: TaskCompletionData): Promise<Task> => {
      // Create FormData for file uploads
      const formData = new FormData();

      // Add completion photos
      if (
        completionData.completionPhotos &&
        completionData.completionPhotos.length > 0
      ) {
        completionData.completionPhotos.forEach((photo, index) => {
          formData.append(`photos`, photo);
        });
      }

      // Add other completion data
      if (completionData.customerSignature) {
        formData.append("customerSignature", completionData.customerSignature);
      }
      if (completionData.customerRating) {
        formData.append(
          "customerRating",
          completionData.customerRating.toString(),
        );
      }
      if (completionData.customerFeedback) {
        formData.append("customerFeedback", completionData.customerFeedback);
      }
      if (completionData.contractorNotes) {
        formData.append("contractorNotes", completionData.contractorNotes);
      }
      if (completionData.issuesEncountered) {
        formData.append(
          "issuesEncountered",
          JSON.stringify(completionData.issuesEncountered),
        );
      }
      formData.append(
        "actualDuration",
        completionData.actualDuration.toString(),
      );
      formData.append("completedAt", completionData.completedAt);

      const response: ApiResponse<Task> = await apiClient.request({
        method: "POST",
        url: `/tasks/${completionData.taskId}/complete`,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to complete task");
      }

      return response.data!;
    },
    onSuccess: (completedTask) => {
      // Update the task in cache
      queryClient.setQueryData(
        ["tasks", "detail", completedTask.id],
        completedTask,
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["tasks", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "available"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "stats"] });
    },
    onError: (error: ApiError) => {
      console.error("Failed to complete task:", error);
    },
  });
};

// Hook for cancelling a task
export const useCancelTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      reason,
    }: {
      taskId: string;
      reason: string;
    }): Promise<Task> => {
      const response: ApiResponse<Task> = await apiClient.post(
        `/tasks/${taskId}/cancel`,
        { reason },
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to cancel task");
      }

      return response.data!;
    },
    onSuccess: (cancelledTask) => {
      // Update the task in cache
      queryClient.setQueryData(
        ["tasks", "detail", cancelledTask.id],
        cancelledTask,
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["tasks", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "available"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "stats"] });
    },
    onError: (error: ApiError) => {
      console.error("Failed to cancel task:", error);
    },
  });
};

// Hook for uploading task photos
export const useUploadTaskPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      photo,
      type,
      caption,
      onProgress,
    }: {
      taskId: string;
      photo: File | Blob;
      type: string;
      caption?: string;
      onProgress?: (progress: number) => void;
    }): Promise<any> => {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("type", type);
      if (caption) {
        formData.append("caption", caption);
      }

      const response = await apiClient.uploadFile(
        `/tasks/${taskId}/photos`,
        photo,
        onProgress,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to upload photo");
      }

      return response.data;
    },
    onSuccess: (uploadResult, variables) => {
      // Invalidate task detail to refetch with new photo
      queryClient.invalidateQueries({
        queryKey: ["tasks", "detail", variables.taskId],
      });
    },
    onError: (error: ApiError) => {
      console.error("Failed to upload task photo:", error);
    },
  });
};

// Hook for reporting task issues
export const useReportTaskIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      issue,
    }: {
      taskId: string;
      issue: {
        type: string;
        severity: string;
        title: string;
        description: string;
        photos?: File[];
      };
    }): Promise<any> => {
      const formData = new FormData();
      formData.append("type", issue.type);
      formData.append("severity", issue.severity);
      formData.append("title", issue.title);
      formData.append("description", issue.description);

      if (issue.photos && issue.photos.length > 0) {
        issue.photos.forEach((photo, index) => {
          formData.append(`photos`, photo);
        });
      }

      const response: ApiResponse<any> = await apiClient.request({
        method: "POST",
        url: `/tasks/${taskId}/issues`,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to report issue");
      }

      return response.data;
    },
    onSuccess: (result, variables) => {
      // Invalidate task detail to refetch with new issue
      queryClient.invalidateQueries({
        queryKey: ["tasks", "detail", variables.taskId],
      });
    },
    onError: (error: ApiError) => {
      console.error("Failed to report task issue:", error);
    },
  });
};

// Hook for getting task directions
export const useGetTaskDirections = () => {
  return useMutation({
    mutationFn: async ({
      taskId,
      currentLocation,
    }: {
      taskId: string;
      currentLocation: { latitude: number; longitude: number };
    }): Promise<any> => {
      const response: ApiResponse<any> = await apiClient.post(
        `/tasks/${taskId}/directions`,
        {
          currentLocation,
        },
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to get directions");
      }

      return response.data;
    },
    onError: (error: ApiError) => {
      console.error("Failed to get task directions:", error);
    },
  });
};
