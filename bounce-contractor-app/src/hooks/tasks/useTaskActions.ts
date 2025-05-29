import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../services/api/apiClient";
import { 
  Task, 
  TaskClaimRequest, 
  TaskStatusUpdate, 
  TaskCompletionData 
} from "../../types/task.types";
import { ApiResponse } from "../../types/api.types";
import { useAuthStore } from "../../store/authStore";

// Hook for claiming a task
export const useClaimTask = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (claimRequest: TaskClaimRequest): Promise<Task> => {
      const response: ApiResponse<Task> = await apiClient.post(
        `/tasks/${claimRequest.taskId}/claim`,
        {
          estimatedArrival: claimRequest.estimatedArrival,
          notes: claimRequest.notes,
        }
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to claim task");
      }

      return response.data!;
    },
    onSuccess: (claimedTask) => {
      // Update the task in cache
      queryClient.setQueryData(
        ["tasks", "detail", claimedTask.id],
        claimedTask
      );

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["tasks", "available"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "nearby"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "stats"] });
    },
    onError: (error) => {
      console.error("Failed to claim task:", error);
    },
  });
};

// Hook for updating task status
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusUpdate: TaskStatusUpdate): Promise<Task> => {
      const response: ApiResponse<Task> = await apiClient.put(
        `/tasks/${statusUpdate.taskId}/status`,
        {
          status: statusUpdate.status,
          location: statusUpdate.location,
          notes: statusUpdate.notes,
          photos: statusUpdate.photos,
          timestamp: statusUpdate.timestamp,
        }
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to update task status");
      }

      return response.data!;
    },
    onSuccess: (updatedTask) => {
      // Update the task in cache
      queryClient.setQueryData(
        ["tasks", "detail", updatedTask.id],
        updatedTask
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["tasks", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "stats"] });
    },
    onError: (error) => {
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
      if (completionData.completionPhotos && completionData.completionPhotos.length > 0) {
        completionData.completionPhotos.forEach((photo, index) => {
          formData.append(`photos`, photo);
        });
      }

      // Add other completion data
      if (completionData.customerSignature) {
        formData.append("customerSignature", completionData.customerSignature);
      }
      if (completionData.customerRating) {
        formData.append("customerRating", completionData.customerRating.toString());
      }
      if (completionData.customerFeedback) {
        formData.append("customerFeedback", completionData.customerFeedback);
      }
      if (completionData.contractorNotes) {
        formData.append("contractorNotes", completionData.contractorNotes);
      }
      if (completionData.issuesEncountered) {
        formData.append("issuesEncountered", JSON.stringify(completionData.issuesEncountered));
      }
      formData.append("actualDuration", completionData.actualDuration.toString());
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
        completedTask
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["tasks", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "available"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "stats"] });
    },
    onError: (error) => {
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
      reason 
    }: { 
      taskId: string; 
      reason: string; 
    }): Promise<Task> => {
      const response: ApiResponse<Task> = await apiClient.post(
        `/tasks/${taskId}/cancel`,
        { reason }
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
        cancelledTask
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["tasks", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "available"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "stats"] });
    },
    onError: (error) => {
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
      onProgress 
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
        onProgress
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to upload photo");
      }

      return response.data;
    },
    onSuccess: (uploadResult, variables) => {
      // Invalidate task detail to refetch with new photo
      queryClient.invalidateQueries({ 
        queryKey: ["tasks", "detail", variables.taskId] 
      });
    },
    onError: (error) => {
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
      issue 
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
        queryKey: ["tasks", "detail", variables.taskId] 
      });
    },
    onError: (error) => {
      console.error("Failed to report task issue:", error);
    },
  });
};

// Hook for getting task directions
export const useGetTaskDirections = () => {
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      currentLocation 
    }: { 
      taskId: string; 
      currentLocation: { latitude: number; longitude: number }; 
    }): Promise<any> => {
      const response: ApiResponse<any> = await apiClient.post(
        `/tasks/${taskId}/directions`,
        {
          currentLocation,
        }
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to get directions");
      }

      return response.data;
    },
    onError: (error) => {
      console.error("Failed to get task directions:", error);
    },
  });
};
