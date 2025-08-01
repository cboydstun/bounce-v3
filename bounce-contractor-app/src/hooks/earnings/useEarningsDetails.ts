import { useQuery } from "@tanstack/react-query";
import { earningsService } from "../../services/api/earningsService";

interface UseEarningsDetailsOptions {
  enabled?: boolean;
}

export const useEarningsDetails = (options: UseEarningsDetailsOptions = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["earningsDetails"],
    queryFn: () => earningsService.getEarningsDetails(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
