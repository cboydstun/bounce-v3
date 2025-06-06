import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../services/api/apiClient";
import { ApiResponse } from "../../types/api.types";
import { APP_CONFIG } from "../../config/app.config";

export interface EarningsData {
  totalEarnings: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
  completedTasks: number;
  averagePerTask: number;
}

interface UseEarningsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export const useEarnings = (options: UseEarningsOptions = {}) => {
  const { enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: ["earnings", "summary"],
    queryFn: async (): Promise<EarningsData> => {
      const response: ApiResponse<EarningsData> = await apiClient.get(
        "/contractors/earnings-summary",
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch earnings summary");
      }

      return response.data!;
    },
    enabled,
    refetchInterval: refetchInterval || 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Helper hook to refetch earnings when tasks are completed
export const useRefreshEarnings = () => {
  const { refetch } = useEarnings({ enabled: false });

  return {
    refreshEarnings: refetch,
  };
};
