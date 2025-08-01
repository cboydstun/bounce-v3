import { apiClient } from "./apiClient";
import { ApiResponse } from "../../types/api.types";

export interface PaymentHistoryItem {
  id: string;
  orderId: string;
  taskTitle: string;
  taskType: string;
  amount: number;
  paymentDate: string;
  paymentStatus: string;
  paymentMethod: string;
  address: string;
  scheduledDate: string;
  completedDate: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[];
  summary: {
    totalPayments: number;
    totalAmount: number;
    averagePayment: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EarningsDetailsResponse {
  summary: {
    totalEarnings: number;
    completedTasks: number;
    averagePerTask: number;
    last30DaysEarnings: number;
    last7DaysEarnings: number;
  };
  trends: {
    daily: Array<{ date: string; amount: number }>;
    weekly: Array<{ weekStart: string; amount: number }>;
    monthly: Array<{ month: string; amount: number }>;
  };
  breakdown: {
    byTaskType: Array<{
      taskType: string;
      count: number;
      totalEarnings: number;
      averagePerTask: number;
    }>;
  };
  performance: {
    bestDay: { date: string; amount: number } | null;
    bestWeek: { weekStart: string; amount: number } | null;
    bestMonth: { month: string; amount: number } | null;
  };
}

export interface PaymentHistoryFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

class EarningsService {
  /**
   * Get payment history for the contractor
   */
  async getPaymentHistory(
    filters: PaymentHistoryFilters = {},
  ): Promise<PaymentHistoryResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const queryString = params.toString();
    const url = `/contractors/payment-history${queryString ? `?${queryString}` : ""}`;

    const response: ApiResponse<PaymentHistoryResponse> =
      await apiClient.get(url);

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch payment history");
    }

    return response.data!;
  }

  /**
   * Get detailed earnings analytics for the contractor
   */
  async getEarningsDetails(): Promise<EarningsDetailsResponse> {
    const response: ApiResponse<EarningsDetailsResponse> = await apiClient.get(
      "/contractors/earnings-details",
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch earnings details");
    }

    return response.data!;
  }
}

export const earningsService = new EarningsService();
export default earningsService;
