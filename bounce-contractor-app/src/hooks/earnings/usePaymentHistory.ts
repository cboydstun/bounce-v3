import { useQuery } from "@tanstack/react-query";
import {
  earningsService,
  PaymentHistoryFilters,
} from "../../services/api/earningsService";

interface UsePaymentHistoryOptions {
  enabled?: boolean;
  filters?: PaymentHistoryFilters;
}

export const usePaymentHistory = (options: UsePaymentHistoryOptions = {}) => {
  const { enabled = true, filters = {} } = options;

  return useQuery({
    queryKey: ["paymentHistory", filters],
    queryFn: () => earningsService.getPaymentHistory(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
