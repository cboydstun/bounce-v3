import { Notification } from "../types/notification.types";

/**
 * Generate test notifications for development and testing
 */
export const createTestNotifications = (): Notification[] => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  return [
    {
      id: "1",
      type: "in_app",
      category: "task_alert",
      title: "New Task Available",
      body: "A new bounce house setup task is available near you. Payment: $75",
      data: {
        taskId: "task-123",
        taskTitle: "Bounce House Setup - Birthday Party",
        taskType: "Setup",
        taskStatus: "pending",
        customerId: "customer-456",
        customerName: "Sarah Johnson",
        scheduledDate: new Date(
          now.getTime() + 2 * 60 * 60 * 1000,
        ).toISOString(),
        location: {
          address: "123 Oak Street, San Antonio, TX 78201",
          coordinates: {
            latitude: 29.4241,
            longitude: -98.4936,
          },
        },
        compensation: 75,
        urgency: "normal" as const,
      },
      userId: "contractor-1",
      isRead: false,
      isPersistent: true,
      priority: "high",
      createdAt: oneHourAgo.toISOString(),
    },
    {
      id: "2",
      type: "in_app",
      category: "task_update",
      title: "Task Completed",
      body: "You have successfully completed the bounce house pickup task.",
      data: {
        taskId: "task-122",
        taskTitle: "Bounce House Pickup - Corporate Event",
        taskType: "Pickup",
        taskStatus: "completed",
        customerId: "customer-789",
        customerName: "ABC Corporation",
        scheduledDate: oneDayAgo.toISOString(),
        location: {
          address: "456 Business Park Dr, San Antonio, TX 78230",
          coordinates: {
            latitude: 29.5149,
            longitude: -98.4951,
          },
        },
        compensation: 50,
        urgency: "normal" as const,
      },
      userId: "contractor-1",
      isRead: true,
      isPersistent: true,
      priority: "medium",
      createdAt: oneDayAgo.toISOString(),
      readAt: new Date(oneDayAgo.getTime() + 30 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      type: "in_app",
      category: "payment",
      title: "Payment Received",
      body: "You have received payment of $125.00 for completed tasks.",
      data: {
        paymentId: "payment-789",
        amount: 125.0,
        currency: "USD",
        paymentMethod: "Direct Deposit",
        taskId: "task-121",
        taskTitle: "Multiple Task Completion",
        status: "completed" as const,
        transactionDate: threeDaysAgo.toISOString(),
      },
      userId: "contractor-1",
      isRead: true,
      isPersistent: true,
      priority: "medium",
      createdAt: threeDaysAgo.toISOString(),
      readAt: new Date(threeDaysAgo.getTime() + 15 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      type: "in_app",
      category: "system",
      title: "App Update Available",
      body: "A new version of the contractor app is available with bug fixes and improvements.",
      data: {
        updateType: "app_update" as const,
        version: "2.1.0",
        actionRequired: false,
      },
      userId: "contractor-1",
      isRead: false,
      isPersistent: true,
      priority: "low",
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "5",
      type: "in_app",
      category: "reminder",
      title: "Task Starting Soon",
      body: "Your bounce house setup task starts in 30 minutes. Don't forget to bring your tools!",
      data: {
        reminderType: "task_start" as const,
        relatedId: "task-124",
        dueDate: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      },
      userId: "contractor-1",
      isRead: false,
      isPersistent: false,
      priority: "urgent",
      createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    },
  ];
};

/**
 * Create a single test notification
 */
export const createSingleTestNotification = (
  overrides: Partial<Notification> = {},
): Notification => {
  const now = new Date();

  const defaultNotification: Notification = {
    id: `test-${Date.now()}`,
    type: "in_app",
    category: "task_alert",
    title: "Test Notification",
    body: "This is a test notification to verify the system is working.",
    data: {
      taskId: "test-task",
      taskTitle: "Test Task",
      taskType: "Test",
      compensation: 50,
    },
    userId: "contractor-1",
    isRead: false,
    isPersistent: true,
    priority: "medium",
    createdAt: now.toISOString(),
  };

  return { ...defaultNotification, ...overrides };
};

export default { createTestNotifications, createSingleTestNotification };
