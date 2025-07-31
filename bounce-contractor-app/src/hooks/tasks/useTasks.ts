import React from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "../../services/api/apiClient";
import { Task, TaskFilters, TaskSearchParams } from "../../types/task.types";
import { ApiResponse, PaginatedResponse } from "../../types/api.types";
import { useGeolocation } from "../location/useGeolocation";
import { useAuthStore } from "../../store/authStore";
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
  const { isAuthenticated, tokens } = useAuthStore();

  // Check if auth is ready
  const isAuthReady = isAuthenticated && !!tokens?.accessToken;

  const queryKey = ["tasks", "available", filters, location, isAuthReady];

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
    enabled: enabled && isAuthReady,
    refetchInterval: refetchInterval || APP_CONFIG.TASK_REFRESH_INTERVAL,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInfiniteTasks = (options: UseTasksOptions = {}) => {
  const { filters, enabled = true } = options;
  const { location } = useGeolocation();
  const { isAuthenticated, tokens } = useAuthStore();

  // Check if auth is ready
  const isAuthReady = isAuthenticated && !!tokens?.accessToken;

  const queryKey = [
    "tasks",
    "available",
    "infinite",
    filters,
    location,
    isAuthReady,
  ];

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
    enabled: enabled && isAuthReady,
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
  const { isAuthenticated, tokens } = useAuthStore();

  // Check if auth is ready
  const isAuthReady = isAuthenticated && !!tokens?.accessToken;

  const queryKey = ["tasks", "my-tasks", filters, isAuthReady];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<TasksResponse> => {
      const params: Record<string, any> = {
        page: 1,
        limit: 20,
      };

      // Add status filter for my tasks (typically assigned, in_progress, etc.)
      if (filters?.status && filters.status.length > 0) {
        // Convert all statuses to API format and send as comma-separated string
        const apiStatuses = filters.status.map((status) =>
          convertStatusForAPI(status),
        );
        params.status = apiStatuses.join(",");
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
    enabled: enabled && isAuthReady,
    refetchInterval: refetchInterval || APP_CONFIG.TASK_REFRESH_INTERVAL,
    staleTime: 15000, // 15 seconds for active tasks
    gcTime: 5 * 60 * 1000,
  });
};

export const useTaskById = (taskId: string, enabled = true) => {
  // Use stable selectors with useCallback to prevent re-renders
  const isAuthenticated = useAuthStore(
    React.useCallback((state) => state.isAuthenticated, []),
  );
  const hasAccessToken = useAuthStore(
    React.useCallback((state) => !!state.tokens?.accessToken, []),
  );

  // Use refs to track previous values and prevent unnecessary re-executions
  const prevAuthReadyRef = React.useRef<boolean>(false);
  const prevQueryEnabledRef = React.useRef<boolean>(false);
  const queryExecutionCountRef = React.useRef<number>(0);

  // Stable auth readiness with ref comparison
  const isAuthReady = React.useMemo(() => {
    const newAuthReady = isAuthenticated && hasAccessToken;
    if (prevAuthReadyRef.current !== newAuthReady) {
      console.log(`🔑 [useTaskById] Auth readiness changed:`, {
        taskId,
        from: prevAuthReadyRef.current,
        to: newAuthReady,
        isAuthenticated,
        hasAccessToken,
      });
      prevAuthReadyRef.current = newAuthReady;
    }
    return newAuthReady;
  }, [isAuthenticated, hasAccessToken]); // Removed taskId from dependencies

  // Stable enabled condition with ref comparison
  const queryEnabled = React.useMemo(() => {
    const newEnabled = enabled && !!taskId && isAuthReady;
    if (prevQueryEnabledRef.current !== newEnabled) {
      console.log(`🎯 [useTaskById] Query enabled changed:`, {
        taskId,
        from: prevQueryEnabledRef.current,
        to: newEnabled,
        enabled,
        hasTaskId: !!taskId,
        isAuthReady,
      });
      prevQueryEnabledRef.current = newEnabled;
    }
    return newEnabled;
  }, [enabled, taskId, isAuthReady]);

  // Ultra-stable query key that only changes when absolutely necessary
  const queryKey = React.useMemo(() => {
    const key = ["tasks", "detail", taskId];
    console.log(`🔑 [useTaskById] Query key generated:`, {
      taskId,
      key,
      isAuthReady,
      queryEnabled,
    });
    return key;
  }, [taskId]); // Only depend on taskId, not auth state

  console.log(`🚀 [useTaskById] Hook called:`, {
    taskId,
    enabled,
    isAuthenticated,
    hasAccessToken,
    isAuthReady,
    queryEnabled,
    executionCount: queryExecutionCountRef.current,
  });

  return useQuery({
    queryKey,
    queryFn: async (): Promise<Task> => {
      queryExecutionCountRef.current += 1;

      try {
        console.log(
          `🔍 [useTaskById] QueryFn executing - Attempt ${queryExecutionCountRef.current}:`,
          {
            taskId,
            isAuthenticated,
            hasAccessToken,
            isAuthReady,
            timestamp: new Date().toISOString(),
          },
        );

        const response: ApiResponse<Task> = await apiClient.get(
          `/tasks/${taskId}`,
        );

        console.log(`📡 [useTaskById] API Response received:`, {
          taskId,
          success: response.success,
          hasData: !!response.data,
          statusCode: (response as any)?.statusCode,
          executionCount: queryExecutionCountRef.current,
        });

        if (!response.success) {
          const errorMessage =
            response.error || response.message || "Failed to fetch task";
          console.error(`❌ Task fetch failed:`, {
            taskId,
            errorMessage,
            statusCode: (response as any)?.statusCode,
            isAuthReady,
            executionCount: queryExecutionCountRef.current,
            fullResponse: response,
          });

          // Distinguish between auth errors and actual task not found
          if (
            (response as any)?.statusCode === 401 ||
            (response as any)?.statusCode === 403
          ) {
            throw new Error("Authentication required. Please log in again.");
          }

          throw new Error(errorMessage);
        }

        if (!response.data) {
          console.error(`❌ Task data is null/undefined for taskId: ${taskId}`);
          throw new Error("Task data not found");
        }

        console.log(`✅ [useTaskById] Successfully fetched task:`, {
          taskId,
          taskTitle: response.data.title,
          taskStatus: response.data.status,
          executionCount: queryExecutionCountRef.current,
        });

        return response.data;
      } catch (error) {
        console.error(`💥 Task fetch error:`, {
          taskId,
          error: (error as Error).message,
          isAuthReady,
          executionCount: queryExecutionCountRef.current,
          stack: (error as Error).stack,
        });
        throw error;
      }
    },
    enabled: queryEnabled,
    // Android-optimized cache settings
    staleTime: 10000, // Reduced to 10 seconds for faster updates
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Enable for Android app focus
    refetchOnReconnect: true, // Enable for Android network reconnect
    refetchOnMount: true, // Always refetch on mount for fresh data
    retry: (failureCount, error) => {
      console.log(`🔄 [useTaskById] Retry attempt ${failureCount}:`, {
        taskId,
        error: (error as Error).message,
        willRetry:
          failureCount < 2 &&
          !(error as Error).message.includes("Authentication required"),
        executionCount: queryExecutionCountRef.current,
      });

      // Don't retry auth errors
      if ((error as Error).message.includes("Authentication required")) {
        return false;
      }
      // Reduced retry attempts from 3 to 2
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Faster retry for Android
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
