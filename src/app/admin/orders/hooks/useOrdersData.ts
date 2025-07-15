import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Order } from "@/types/order";
import { getOrders, deleteOrder, syncAllAgreementStatuses } from "@/utils/api";

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export const useOrdersData = () => {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  // Fetch orders with filters and pagination
  const fetchOrders = useCallback(
    async (
      page = pagination.currentPage,
      filters: Record<string, string | number> = {},
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const apiFilters = {
          page,
          limit: pagination.pageSize,
          ...filters,
        };

        const data = await getOrders(apiFilters);
        setOrders(data.orders || []);

        // Update pagination information
        if (data.pagination) {
          setPagination((prev) => ({
            ...prev,
            totalPages: data.pagination.totalPages || 1,
            currentPage: data.pagination.currentPage || 1,
          }));
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch orders",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize],
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number, filters?: Record<string, string | number>) => {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      fetchOrders(page, filters);
    },
    [fetchOrders],
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (newSize: number, filters?: Record<string, string | number>) => {
      setPagination((prev) => ({
        ...prev,
        pageSize: newSize,
        currentPage: 1, // Reset to first page when changing page size
      }));
      fetchOrders(1, filters);
    },
    [fetchOrders],
  );

  // Handle order deletion
  const handleDelete = useCallback(
    async (id: string) => {
      // Check if authenticated
      if (authStatus !== "authenticated") {
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?returnUrl=${returnUrl}`);
        return;
      }

      if (
        !window.confirm(
          "Are you sure you want to delete this order? This action cannot be undone.",
        )
      ) {
        return;
      }

      try {
        setIsDeleting(true);
        await deleteOrder(id);

        // Update the local state
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== id),
        );
        alert("Order deleted successfully");
      } catch (error) {
        // Handle authentication errors
        if (
          error instanceof Error &&
          error.message.includes("Authentication failed")
        ) {
          setError(
            "Your session has expired. Please log in again to continue.",
          );
          setTimeout(() => {
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/login?returnUrl=${returnUrl}`);
          }, 2000);
          return;
        }

        setError(
          error instanceof Error ? error.message : "Failed to delete order",
        );
        console.error("Error deleting order:", error);
      } finally {
        setIsDeleting(false);
      }
    },
    [authStatus, router],
  );

  // Handle sync all agreements
  const handleSyncAll = useCallback(async () => {
    setIsSyncingAll(true);
    setError(null);
    setSyncResults(null);

    try {
      const result = await syncAllAgreementStatuses();
      const { results } = result;
      const summary = `✅ ${results.updated} updated, ℹ️ ${results.alreadyCurrent} already current, ❌ ${results.failed} failed (${results.total} total)`;

      setSyncResults(summary);

      // Refresh the orders list to show updated statuses
      fetchOrders(pagination.currentPage);

      // Show detailed errors if any
      if (results.errors && results.errors.length > 0) {
        console.error("Sync errors:", results.errors);
      }
    } catch (err) {
      console.error("Error syncing all agreements:", err);
      setError(
        err instanceof Error ? err.message : "Failed to sync agreements",
      );
    } finally {
      setIsSyncingAll(false);
    }
  }, [fetchOrders, pagination.currentPage]);

  // Clear sync results
  const clearSyncResults = useCallback(() => {
    setSyncResults(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchOrders();
    }
  }, [authStatus, fetchOrders]);

  return {
    orders,
    pagination,
    isLoading,
    isDeleting,
    isSyncingAll,
    error,
    syncResults,
    authStatus,
    fetchOrders,
    handlePageChange,
    handlePageSizeChange,
    handleDelete,
    handleSyncAll,
    clearSyncResults,
  };
};
