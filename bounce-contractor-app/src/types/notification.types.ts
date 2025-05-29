// Notification Core Types
export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: string;
  isRead: boolean;
  isPersistent: boolean;
  priority: NotificationPriority;
  actionButtons?: NotificationAction[];
  imageUrl?: string;
  iconUrl?: string;
  sound?: string;
  vibrationPattern?: number[];
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  scheduledFor?: string;
}

export type NotificationType = "push" | "local" | "in_app" | "email" | "sms";

export type NotificationCategory =
  | "task_alert"
  | "task_update"
  | "payment"
  | "system"
  | "marketing"
  | "reminder"
  | "emergency";

export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface NotificationAction {
  id: string;
  title: string;
  action: string;
  icon?: string;
  destructive?: boolean;
  requiresAuth?: boolean;
  deepLink?: string;
}

// Specific Notification Types
export interface TaskNotification extends Notification {
  category: "task_alert" | "task_update";
  data: {
    taskId: string;
    taskTitle: string;
    taskType: string;
    taskStatus?: string;
    customerId?: string;
    customerName?: string;
    scheduledDate?: string;
    location?: {
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
    compensation?: number;
    urgency?: "normal" | "urgent";
  };
}

export interface PaymentNotification extends Notification {
  category: "payment";
  data: {
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    taskId?: string;
    taskTitle?: string;
    status: "pending" | "completed" | "failed";
    transactionDate: string;
  };
}

export interface SystemNotification extends Notification {
  category: "system";
  data: {
    updateType?: "app_update" | "maintenance" | "feature" | "security";
    version?: string;
    maintenanceWindow?: {
      start: string;
      end: string;
    };
    actionRequired?: boolean;
    deadline?: string;
  };
}

export interface ReminderNotification extends Notification {
  category: "reminder";
  data: {
    reminderType:
      | "task_start"
      | "document_expiry"
      | "profile_update"
      | "training";
    relatedId?: string;
    dueDate?: string;
    actionUrl?: string;
  };
}

// Notification Settings
export interface NotificationSettings {
  userId: string;
  pushNotifications: PushNotificationSettings;
  emailNotifications: EmailNotificationSettings;
  smsNotifications: SmsNotificationSettings;
  inAppNotifications: InAppNotificationSettings;
  quietHours: QuietHoursSettings;
  preferences: NotificationPreferences;
  updatedAt: string;
}

export interface PushNotificationSettings {
  enabled: boolean;
  taskAlerts: boolean;
  taskUpdates: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
  marketingMessages: boolean;
  reminders: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  lockScreen: boolean;
  bannerStyle: "temporary" | "persistent";
}

export interface EmailNotificationSettings {
  enabled: boolean;
  taskSummary: boolean;
  paymentReceipts: boolean;
  weeklyReport: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  frequency: "immediate" | "daily" | "weekly";
}

export interface SmsNotificationSettings {
  enabled: boolean;
  urgentTasksOnly: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
  phoneNumber: string;
  verified: boolean;
}

export interface InAppNotificationSettings {
  enabled: boolean;
  showBadges: boolean;
  autoMarkAsRead: boolean;
  retentionDays: number;
  groupSimilar: boolean;
}

export interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timeZone: string;
  allowCritical: boolean;
  allowEmergency: boolean;
  weekendsOnly: boolean;
}

export interface NotificationPreferences {
  language: string;
  timeFormat: "12h" | "24h";
  dateFormat: string;
  groupByCategory: boolean;
  showPreviews: boolean;
  maxNotificationsPerDay: number;
  autoDeleteAfterDays: number;
}

// Notification Templates
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  variables: TemplateVariable[];
  conditions?: TemplateCondition[];
  scheduling?: TemplateScheduling;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "date" | "boolean";
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface TemplateCondition {
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains";
  value: any;
}

export interface TemplateScheduling {
  type: "immediate" | "delayed" | "scheduled";
  delay?: number; // in minutes
  scheduledTime?: string;
  recurring?: {
    frequency: "daily" | "weekly" | "monthly";
    interval: number;
    endDate?: string;
  };
}

// Notification Delivery
export interface NotificationDelivery {
  id: string;
  notificationId: string;
  type: NotificationType;
  status: DeliveryStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  deviceToken?: string;
  endpoint?: string;
  response?: any;
}

export type DeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "expired"
  | "cancelled";

// Push Notification Registration
export interface PushTokenRegistration {
  userId: string;
  deviceId: string;
  token: string;
  platform: "ios" | "android" | "web";
  appVersion: string;
  osVersion: string;
  deviceModel?: string;
  isActive: boolean;
  registeredAt: string;
  lastUsedAt: string;
  expiresAt?: string;
}

// Notification Analytics
export interface NotificationAnalytics {
  notificationId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  dismissed: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  avgDeliveryTime: number; // in seconds
  platformBreakdown: {
    ios: NotificationMetrics;
    android: NotificationMetrics;
    web: NotificationMetrics;
  };
  timeBreakdown: {
    hour: number;
    count: number;
    openRate: number;
  }[];
}

export interface NotificationMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

// Notification Events
export interface NotificationEvent {
  id: string;
  notificationId: string;
  userId: string;
  type: NotificationEventType;
  timestamp: string;
  deviceInfo?: {
    platform: string;
    appVersion: string;
    osVersion: string;
  };
  metadata?: Record<string, any>;
}

export type NotificationEventType =
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "dismissed"
  | "failed"
  | "expired";

// Notification Batching
export interface NotificationBatch {
  id: string;
  name: string;
  templateId: string;
  recipients: BatchRecipient[];
  status: BatchStatus;
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  createdBy: string;
  createdAt: string;
}

export interface BatchRecipient {
  userId: string;
  variables: Record<string, any>;
  status: "pending" | "sent" | "failed";
  notificationId?: string;
  failureReason?: string;
}

export type BatchStatus =
  | "draft"
  | "scheduled"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

// Real-time Notification Updates
export interface NotificationUpdate {
  type:
    | "new_notification"
    | "notification_read"
    | "notification_deleted"
    | "settings_updated";
  userId: string;
  data: any;
  timestamp: string;
}

// Notification Channels (Android)
export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: "min" | "low" | "default" | "high" | "max";
  sound?: string;
  vibration: boolean;
  lights: boolean;
  badge: boolean;
  lockScreen: "public" | "private" | "secret";
}
