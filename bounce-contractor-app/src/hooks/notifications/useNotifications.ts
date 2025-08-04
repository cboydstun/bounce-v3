import { useState, useEffect, useCallback } from "react";
import {
  NotificationService,
  NotificationFilters,
} from "../../services/notifications/notificationService";
import {
  ApiNotification,
  ApiNotificationResponse,
  Notification,
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from "../../types/notification.types";
import { websocketService } from "../../services/realtime/websocketService";
import { createTestNotifications } from "../../utils/testNotifications";
import { audioService } from "../../services/audio/audioService";
import { SoundType, AudioAlert } from "../../types/audio.types";
import { TaskPriority } from "../../types/task.types";

export interface UseNotificationsOptions {
  autoLoad?: boolean;
  filters?: NotificationFilters;
  refreshInterval?: number;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  unreadCount: number;

  // Actions
  loadNotifications: (filters?: NotificationFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

  // Filters
  setFilters: (filters: NotificationFilters) => void;
  clearFilters: () => void;
}

/**
 * Deduplicate notifications by ID
 */
const deduplicateNotifications = (
  notifications: Notification[],
): Notification[] => {
  const seen = new Set<string>();
  const deduplicated = notifications.filter((notification) => {
    if (seen.has(notification.id)) {
      console.warn("🔄 Duplicate notification detected and removed:", {
        id: notification.id,
        title: notification.title,
      });
      return false;
    }
    seen.add(notification.id);
    return true;
  });

  if (deduplicated.length !== notifications.length) {
    console.log("📊 Deduplication stats:", {
      original: notifications.length,
      deduplicated: deduplicated.length,
      removed: notifications.length - deduplicated.length,
    });
  }

  return deduplicated;
};

/**
 * Map notification priority to task priority for audio alerts
 */
const mapNotificationPriorityToTaskPriority = (
  priority: NotificationPriority,
): TaskPriority => {
  const priorityMap: Record<NotificationPriority, TaskPriority> = {
    low: "low",
    medium: "medium",
    high: "high",
    urgent: "urgent",
  };
  return priorityMap[priority] || "medium";
};

/**
 * Map task priority string to notification priority
 */
const mapTaskPriorityToNotificationPriority = (
  taskPriority?: string,
): NotificationPriority => {
  if (!taskPriority) return "medium";

  const priorityMap: Record<string, NotificationPriority> = {
    low: "low",
    medium: "medium",
    normal: "medium",
    high: "high",
    urgent: "urgent",
    critical: "urgent",
  };

  return priorityMap[taskPriority.toLowerCase()] || "medium";
};

/**
 * Get sound type based on notification category and priority
 */
const getSoundTypeForNotification = (
  category: NotificationCategory,
  priority: NotificationPriority,
): SoundType => {
  if (category === "task_alert") {
    const taskPriority = mapNotificationPriorityToTaskPriority(priority);
    const soundTypeMap: Record<TaskPriority, SoundType> = {
      low: "new_task_low",
      medium: "new_task_medium",
      high: "new_task_high",
      urgent: "new_task_urgent",
    };
    return soundTypeMap[taskPriority];
  }

  // Default sound for non-task notifications
  return "notification_general";
};

/**
 * Get vibration pattern based on notification priority
 */
const getVibrationPatternForNotification = (
  priority: NotificationPriority,
): number[] => {
  const vibrationPatterns: Record<NotificationPriority, number[]> = {
    low: [200],
    medium: [200, 100, 200],
    high: [300, 100, 300, 100, 300],
    urgent: [500, 100, 500, 100, 500, 100, 500],
  };
  return vibrationPatterns[priority] || [200, 100, 200];
};

/**
 * Play audio alert for notification
 */
const playNotificationAudio = async (
  notification: Notification,
): Promise<void> => {
  try {
    // Initialize audio service if not already initialized
    if (!audioService.getStatus().isInitialized) {
      console.log("🔊 Initializing audio service for notification...");
      await audioService.initialize();
    }

    const soundType = getSoundTypeForNotification(
      notification.category,
      notification.priority,
    );
    const vibrationPattern = getVibrationPatternForNotification(
      notification.priority,
    );

    const audioAlert: AudioAlert = {
      soundType,
      vibrationPattern,
      volume: notification.priority === "urgent" ? 1.0 : 0.8,
      fadeIn: notification.priority === "urgent",
    };

    console.log("🔊 Playing audio alert for notification:", {
      id: notification.id,
      title: notification.title,
      category: notification.category,
      priority: notification.priority,
      soundType,
      vibrationPattern,
    });

    await audioService.playAlert(audioAlert);
  } catch (error) {
    console.error("❌ Failed to play notification audio:", error);
    // Don't throw - audio failure shouldn't break notification handling
  }
};

/**
 * Transform ApiNotification to Notification for UI components
 */
const transformApiNotification = (
  apiNotification: ApiNotification,
): Notification => {
  // Debug logging to trace undefined IDs
  console.log("🔍 Transforming API notification:", {
    originalNotification: apiNotification,
    id: apiNotification.id,
    idType: typeof apiNotification.id,
    hasId: !!apiNotification.id,
  });

  // Validate that we have a valid ID
  if (
    !apiNotification.id ||
    apiNotification.id === "undefined" ||
    apiNotification.id === "null"
  ) {
    console.error("❌ Invalid notification ID detected:", {
      id: apiNotification.id,
      notification: apiNotification,
    });
    throw new Error(`Invalid notification ID: ${apiNotification.id}`);
  }

  // Map API priority to UI priority
  const priorityMap: Record<string, NotificationPriority> = {
    low: "low",
    normal: "medium",
    high: "high",
    critical: "urgent",
  };

  // Map API type to UI category
  const categoryMap: Record<string, NotificationCategory> = {
    task: "task_alert",
    system: "system",
    personal: "reminder",
  };

  // Transform and structure the data based on notification type
  let transformedData = apiNotification.data;

  // For task notifications, ensure the data matches TaskNotification structure
  if (apiNotification.type === "task" && apiNotification.data) {
    transformedData = {
      taskId: apiNotification.data.taskId || apiNotification.data.id,
      taskTitle: apiNotification.data.taskTitle || apiNotification.data.title,
      taskType: apiNotification.data.taskType || apiNotification.data.type,
      taskStatus:
        apiNotification.data.taskStatus || apiNotification.data.status,
      customerId: apiNotification.data.customerId,
      customerName:
        apiNotification.data.customerName || apiNotification.data.customer,
      scheduledDate:
        apiNotification.data.scheduledDate ||
        apiNotification.data.scheduledTime,
      location: apiNotification.data.location
        ? {
            address:
              apiNotification.data.location.address ||
              apiNotification.data.location,
            coordinates: apiNotification.data.location.coordinates,
          }
        : undefined,
      compensation:
        apiNotification.data.compensation ||
        apiNotification.data.amount ||
        apiNotification.data.totalAmount,
      urgency:
        apiNotification.data.urgency ||
        (apiNotification.priority === "critical" ? "urgent" : "normal"),
    };

    console.log("🔄 Transformed task notification data:", {
      original: apiNotification.data,
      transformed: transformedData,
    });
  }

  const transformed: Notification = {
    id: apiNotification.id,
    type: "in_app" as NotificationType, // Default type for UI
    category: categoryMap[apiNotification.type] || "system",
    title: apiNotification.title,
    body: apiNotification.message, // Map message to body
    data: transformedData,
    userId: apiNotification.contractorId,
    isRead: apiNotification.isRead,
    isPersistent: true, // Default for API notifications
    priority: priorityMap[apiNotification.priority] || "medium",
    createdAt: apiNotification.createdAt,
    readAt: apiNotification.readAt,
    expiresAt: apiNotification.expiresAt,
  };

  console.log("✅ Transformed notification:", {
    originalId: apiNotification.id,
    transformedId: transformed.id,
    title: transformed.title,
  });

  return transformed;
};

/**
 * Hook for managing notifications with real-time updates
 */
export const useNotifications = (
  options: UseNotificationsOptions = {},
): UseNotificationsReturn => {
  const {
    autoLoad = true,
    filters: initialFilters = {},
    refreshInterval = 0,
  } = options;

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] =
    useState<NotificationFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(
    async (newFilters?: NotificationFilters, append = false) => {
      try {
        setLoading(true);
        setError(null);

        const currentFilters = newFilters || filters;

        // Get current pagination values
        const currentPage = append ? pagination.page + 1 : 1;

        console.log("📄 Loading notifications:", {
          currentPage,
          append,
          filters: currentFilters,
          currentPagination: pagination,
        });

        const response: ApiNotificationResponse =
          await NotificationService.getNotifications({
            ...currentFilters,
            page: currentPage,
            limit: pagination.limit,
          });

        console.log("📄 API response received:", {
          page: response.page,
          totalPages: response.totalPages,
          total: response.total,
          notificationsCount: response.notifications.length,
        });

        // Transform API notifications to UI notifications
        const transformedNotifications = response.notifications.map(
          transformApiNotification,
        );

        if (append) {
          setNotifications((prev) => {
            const combined = [...prev, ...transformedNotifications];
            return deduplicateNotifications(combined);
          });
        } else {
          // Check for new notifications that weren't there before (for audio alerts)
          const existingIds = new Set(notifications.map((n) => n.id));
          const newNotifications = transformedNotifications.filter(
            (n) => !existingIds.has(n.id),
          );

          // Play audio alerts for new notifications (fallback for when WebSocket isn't working)
          if (newNotifications.length > 0 && !append && currentPage === 1) {
            console.log(
              `🔊 Found ${newNotifications.length} new notifications via REST API, playing audio alerts...`,
            );
            newNotifications.forEach((notification) => {
              // Only play audio for unread notifications to avoid spam
              if (!notification.isRead) {
                playNotificationAudio(notification).catch((error) => {
                  console.error(
                    "Failed to play audio for REST API notification:",
                    error,
                  );
                });
              }
            });
          }

          setNotifications(deduplicateNotifications(transformedNotifications));
        }

        // Update pagination with response data
        setPagination({
          page: response.page,
          totalPages: response.totalPages,
          total: response.total,
          limit: pagination.limit,
        });

        // Only update unread count on initial load, not on pagination or refresh
        // This prevents double-decrement when markAsRead is followed by auto-refresh
        if (!append && currentPage === 1) {
          const stats = await NotificationService.getNotificationStats();
          setUnreadCount(stats?.unread || 0);
          console.log("📊 Updated unread count from API:", stats?.unread || 0);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load notifications";
        setError(errorMessage);
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  /**
   * Load more notifications (pagination)
   */
  const loadMore = useCallback(async () => {
    console.log("🔍 loadMore called:", {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      hasMore: pagination.page < pagination.totalPages,
      loading,
      notificationCount: notifications.length,
    });

    if (pagination.page >= pagination.totalPages) {
      console.log("⚠️ No more pages to load");
      return;
    }

    if (loading) {
      console.log("⚠️ Already loading, skipping loadMore");
      return;
    }

    console.log("✅ Loading more notifications...");
    await loadNotifications(filters, true);
  }, [
    loadNotifications,
    filters,
    pagination.page,
    pagination.totalPages,
    loading,
    notifications.length,
  ]);

  /**
   * Refresh notifications
   */
  const refresh = useCallback(async () => {
    await loadNotifications(filters, false);
  }, [loadNotifications, filters]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Validate notification ID before making API call
      console.log("🔍 markAsRead called with ID:", {
        notificationId,
        idType: typeof notificationId,
        isValid:
          !!notificationId &&
          notificationId !== "undefined" &&
          notificationId !== "null",
        currentUnreadCount: unreadCount,
      });

      if (
        !notificationId ||
        notificationId === "undefined" ||
        notificationId === "null"
      ) {
        console.error(
          "❌ Invalid notification ID passed to markAsRead:",
          notificationId,
        );
        return;
      }

      try {
        const success = await NotificationService.markAsRead(notificationId);

        if (success) {
          // Update local state
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === notificationId
                ? {
                    ...notification,
                    isRead: true,
                    readAt: new Date().toISOString(),
                  }
                : notification,
            ),
          );

          // Update unread count locally (this should be the ONLY place it decrements)
          setUnreadCount((prev) => {
            const newCount = Math.max(0, prev - 1);
            console.log("📉 Unread count decremented:", {
              previousCount: prev,
              newCount,
              notificationId,
            });
            return newCount;
          });
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    [unreadCount],
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      const notificationIds = unreadNotifications.map((n) => n.id);

      if (notificationIds.length === 0) return;

      const modifiedCount =
        await NotificationService.markMultipleAsRead(notificationIds);

      if (modifiedCount > 0) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: new Date().toISOString(),
          })),
        );

        // Reset unread count
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [notifications]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const success =
          await NotificationService.deleteNotification(notificationId);

        if (success) {
          // Remove from local state
          const deletedNotification = notifications.find(
            (n) => n.id === notificationId,
          );
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId),
          );

          // Update counts
          setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
          if (deletedNotification && !deletedNotification.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    },
    [notifications],
  );

  /**
   * Set filters and reload
   */
  const setFilters = useCallback(
    (newFilters: NotificationFilters) => {
      setFiltersState(newFilters);
      loadNotifications(newFilters, false);
    },
    [loadNotifications],
  );

  /**
   * Clear filters and reload
   */
  const clearFilters = useCallback(() => {
    const emptyFilters = {};
    setFiltersState(emptyFilters);
    loadNotifications(emptyFilters, false);
  }, [loadNotifications]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadNotifications();
    }
  }, [autoLoad, loadNotifications]);

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    const handleNewNotification = (eventData: any) => {
      const notificationData = eventData.payload;

      try {
        // Transform and check for duplicates before adding
        const transformedNotification =
          transformApiNotification(notificationData);

        setNotifications((prev) => {
          // Check if notification already exists
          const exists = prev.some((n) => n.id === transformedNotification.id);
          if (exists) {
            console.warn(
              "🔄 WebSocket notification already exists, skipping:",
              {
                id: transformedNotification.id,
                title: transformedNotification.title,
              },
            );
            return prev; // Don't add duplicate
          }

          console.log("✅ Adding new WebSocket notification:", {
            id: transformedNotification.id,
            title: transformedNotification.title,
          });

          return [transformedNotification, ...prev];
        });

        setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
        setUnreadCount((prev) => prev + 1);

        // 🔊 PLAY AUDIO ALERT FOR NEW NOTIFICATION
        playNotificationAudio(transformedNotification).catch((error) => {
          console.error("Failed to play audio for new notification:", error);
        });
      } catch (error) {
        console.error("❌ Error handling WebSocket notification:", error);
      }
    };

    const handleNotificationUpdate = (eventData: any) => {
      const updatedNotification = eventData.payload;

      try {
        // Transform and update existing notification
        const transformedNotification =
          transformApiNotification(updatedNotification);

        setNotifications((prev) => {
          const updated = prev.map((notification) =>
            notification.id === transformedNotification.id
              ? { ...notification, ...transformedNotification }
              : notification,
          );

          // Check if any notification was actually updated
          const wasUpdated = updated.some(
            (notification, index) => notification !== prev[index],
          );

          if (wasUpdated) {
            console.log("✅ Updated WebSocket notification:", {
              id: transformedNotification.id,
              title: transformedNotification.title,
            });
          } else {
            console.warn("⚠️ WebSocket update for non-existent notification:", {
              id: transformedNotification.id,
              title: transformedNotification.title,
            });
          }

          return updated;
        });
      } catch (error) {
        console.error(
          "❌ Error handling WebSocket notification update:",
          error,
        );
      }
    };

    // 🎯 NEW: Handle task events and convert them to notifications
    const handleNewTask = (eventData: any) => {
      const taskData = eventData.payload;

      console.log("🎯 NEW TASK EVENT RECEIVED:", taskData);

      try {
        // Convert task event to notification format
        const taskNotification: Notification = {
          id: `task-${taskData.id}`, // Prefix to avoid ID conflicts
          type: "in_app" as NotificationType,
          category: "task_alert" as NotificationCategory,
          title: `New ${taskData.type} Task Available`,
          body:
            taskData.description || taskData.title || "A new task is available",
          data: {
            taskId: taskData.id,
            taskTitle: taskData.title,
            taskType: taskData.type,
            taskStatus: taskData.status,
            scheduledDate: taskData.scheduledDateTime,
            location: { address: taskData.address },
            compensation: taskData.paymentAmount,
            urgency:
              taskData.priority?.toLowerCase() === "high" ? "urgent" : "normal",
          },
          userId: "current-contractor", // Will be set properly when we have auth
          isRead: false,
          isPersistent: true,
          priority: mapTaskPriorityToNotificationPriority(taskData.priority),
          createdAt: taskData.timestamp || new Date().toISOString(),
          readAt: undefined,
          expiresAt: undefined,
        };

        console.log("🔄 Converted task to notification:", taskNotification);

        // Add to notifications list
        setNotifications((prev) => {
          // Check if notification already exists
          const exists = prev.some((n) => n.id === taskNotification.id);
          if (exists) {
            console.warn("🔄 Task notification already exists, skipping:", {
              id: taskNotification.id,
              title: taskNotification.title,
            });
            return prev;
          }

          console.log("✅ Adding new task notification:", {
            id: taskNotification.id,
            title: taskNotification.title,
          });

          return [taskNotification, ...prev];
        });

        setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
        setUnreadCount((prev) => prev + 1);

        // 🔊 PLAY AUDIO ALERT FOR NEW TASK
        console.log("🔊 About to play audio alert for new task...");
        playNotificationAudio(taskNotification).catch((error) => {
          console.error("❌ Failed to play audio for new task:", error);
        });
      } catch (error) {
        console.error("❌ Error handling WebSocket task event:", error);
      }
    };

    // Subscribe to WebSocket events
    const unsubscribeNew = websocketService.on(
      "notification:new",
      handleNewNotification,
    );
    const unsubscribeUpdate = websocketService.on(
      "notification:update",
      handleNotificationUpdate,
    );

    // 🎯 NEW: Subscribe to task events
    const unsubscribeNewTask = websocketService.on("task:new", handleNewTask);

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
      unsubscribeNewTask();
    };
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, refresh]);

  return {
    notifications,
    loading,
    error,
    hasMore: pagination.page < pagination.totalPages,
    totalCount: pagination.total,
    unreadCount,

    // Actions
    loadNotifications: (newFilters) => loadNotifications(newFilters, false),
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Filters
    setFilters,
    clearFilters,
  };
};

export default useNotifications;
