// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// HTTP Methods
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// API Request Configuration
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Network Status
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: "wifi" | "cellular" | "none" | "unknown";
  isSlowConnection: boolean;
}

// File Upload Types
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadedFile {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Location Types
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formattedAddress: string;
}

export interface LocationData {
  coordinates: Coordinates;
  address?: Address;
  timestamp: string;
}

// Offline Queue Types
export interface QueuedRequest {
  id: string;
  config: ApiRequestConfig;
  timestamp: string;
  retryCount: number;
  priority: "low" | "medium" | "high";
  status: "pending" | "processing" | "failed" | "completed";
}

export interface SyncResult {
  successful: number;
  failed: number;
  total: number;
  errors: ApiError[];
}

// Real-time Event Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
}

export interface WebSocketEvent {
  event: string;
  data: any;
  timestamp: string;
}

// Push Notification Types
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

// Biometric Types
export interface BiometricOptions {
  reason: string;
  subtitle?: string;
  description?: string;
  fallbackButtonTitle?: string;
  negativeButtonText?: string;
}

export interface BiometricResult {
  isAvailable: boolean;
  biometryType?: "TouchID" | "FaceID" | "Fingerprint" | "Face" | "Iris";
  isEnrolled: boolean;
  strongBiometryIsAvailable: boolean;
}

// Cache Types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: string;
  expiresAt: string;
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  priority?: "low" | "medium" | "high";
  tags?: string[];
}

// Storage Types
export interface StorageItem<T = any> {
  value: T;
  timestamp: string;
  expiresAt?: string;
}

export interface SecureStorageOptions {
  requireBiometric?: boolean;
  accessGroup?: string;
  service?: string;
}
