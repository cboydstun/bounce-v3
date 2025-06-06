import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "../../services/api/apiClient";
import { Task, TaskFilters, TaskSearchParams } from "../../types/task.types";
import { ApiResponse, PaginatedResponse } from "../../types/api.types";
import { useGeolocation } from "../location/useGeolocation";
import { APP_CONFIG } from "../../config/app.config";

// Helper function to convert TypeScript status values to API format
const convertStatusForAPI = (status: string): string => {
  const statusMap: Record<string, string> = {
    assigned: "Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    accepted: "Accepted",
    en_route: "En Route",
    on_site: "On Site",
  };
  return statusMap[status] || status;
};

interface UseTasksOptions {
  filters?: TaskFilters;
  enabled?: boolean;
  refetchInterval?: number;
}

interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useTasks = (options: UseTasksOptions = {}) => {
  const { filters, enabled = true, refetchInterval } = options;
  const { location } = useGeolocation();

  const queryKey = ["tasks", "available", filters, location];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<TasksResponse> => {
      const params: Record<string, any> = {
        page: 1,
        limit: 20,
      };

      // Add location-based filtering if available
      if (location && !filters?.location) {
        params.lat = location.latitude;
        params.lng = location.longitude;
        params.radius = 50; // Default 50 mile radius
      }

      // Add filters
      if (filters) {
        if (filters.status) {
          params.status = filters.status.join(",");
        }
        if (filters.type) {
          params.type = filters.type.join(",");
        }
        if (filters.category) {
          params.category = filters.category.join(",");
        }
        if (filters.skills) {
          params.skills = filters.skills.join(",");
        }
        if (filters.location) {
          params.lat = filters.location.coordinates.latitude;
          params.lng = filters.location.coordinates.longitude;
          params.radius = filters.location.radius;
        }
        if (filters.compensation) {
          params.minAmount = filters.compensation.min;
          params.maxAmount = filters.compensation.max;
        }
        if (filters.dateRange) {
          params.startDate = filters.dateRange.start;
          params.endDate = filters.dateRange.end;
        }
        if (filters.duration) {
          params.minDuration = filters.duration.min;
          params.maxDuration = filters.duration.max;
        }
      }

      const response: ApiResponse<TasksResponse> = await apiClient.get(
        "/tasks/available",
        params,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch tasks");
      }

      return response.data!;
    },
    enabled,
    refetchInterval: refetchInterval || APP_CONFIG.TASK_REFRESH_INTERVAL,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInfiniteTasks = (options: UseTasksOptions = {}) => {
  const { filters, enabled = true } = options;
  const { location } = useGeolocation();

  const queryKey = ["tasks", "available", "infinite", filters, location];

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }): Promise<TasksResponse> => {
      const params: Record<string, any> = {
        page: pageParam,
        limit: 20,
      };

      // TEMPORARILY DISABLED: Add location-based filtering if available
      // if (location && !filters?.location) {
      //   params.lat = location.latitude;
      //   params.lng = location.longitude;
      //   params.radius = 50;
      // }

      // Add filters (same logic as useTasks)
      if (filters) {
        if (filters.status) {
          params.status = filters.status.join(",");
        }
        if (filters.type) {
          params.type = filters.type.join(",");
        }
        if (filters.category) {
          params.category = filters.category.join(",");
        }
        if (filters.skills) {
          params.skills = filters.skills.join(",");
        }
        if (filters.location) {
          params.lat = filters.location.coordinates.latitude;
          params.lng = filters.location.coordinates.longitude;
          params.radius = filters.location.radius;
        }
        if (filters.compensation) {
          params.minAmount = filters.compensation.min;
          params.maxAmount = filters.compensation.max;
        }
        if (filters.dateRange) {
          params.startDate = filters.dateRange.start;
          params.endDate = filters.dateRange.end;
        }
        if (filters.duration) {
          params.minDuration = filters.duration.min;
          params.maxDuration = filters.duration.max;
        }
      }

      const response: ApiResponse<TasksResponse> = await apiClient.get(
        "/tasks/available",
        params,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch tasks");
      }

      return response.data!;
    },
    enabled,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useMyTasks = (options: UseTasksOptions = {}) => {
  const { filters, enabled = true, refetchInterval } = options;

  const queryKey = ["tasks", "my-tasks", filters];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<TasksResponse> => {
      const params: Record<string, any> = {
        page: 1,
        limit: 20,
      };

      // Add status filter for my tasks (typically assigned, in_progress, etc.)
      if (filters?.status) {
        // Convert first status to API format and send
        params.status = convertStatusForAPI(filters.status[0]);
      } else {
        // Default to assigned status (most common active status)
        params.status = "Assigned";
      }

      const response: ApiResponse<TasksResponse> = await apiClient.get(
        "/tasks/my-tasks",
        params,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch my tasks");
      }

      return response.data!;
    },
    enabled,
    refetchInterval: refetchInterval || APP_CONFIG.TASK_REFRESH_INTERVAL,
    staleTime: 15000, // 15 seconds for active tasks
    gcTime: 5 * 60 * 1000,
  });
};

export const useTaskById = (taskId: string, enabled = true) => {
  return useQuery({
    queryKey: ["tasks", "detail", taskId],
    queryFn: async (): Promise<Task> => {
      const response: ApiResponse<Task> = await apiClient.get(
        `/tasks/${taskId}`,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch task");
      }

      return response.data!;
    },
    enabled: enabled && !!taskId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useNearbyTasks = (radius = 25, enabled = true) => {
  const { location, isLoading: locationLoading } = useGeolocation();

  return useQuery({
    queryKey: ["tasks", "nearby", location, radius],
    queryFn: async (): Promise<TasksResponse> => {
      if (!location) {
        throw new Error("Location not available");
      }

      const params = {
        lat: location.latitude,
        lng: location.longitude,
        radius,
        page: 1,
        limit: 50,
        status: "published", // Only available tasks
      };

      const response: ApiResponse<TasksResponse> = await apiClient.get(
        "/tasks/available",
        params,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch nearby tasks");
      }

      return response.data!;
    },
    enabled: enabled && !!location && !locationLoading,
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

// Helper hook for task statistics
export const useTaskStats = (enabled = true) => {
  return useQuery({
    queryKey: ["tasks", "stats"],
    queryFn: async () => {
      const response: ApiResponse<any> = await apiClient.get("/tasks/stats");

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch task stats");
      }

      return response.data!;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
