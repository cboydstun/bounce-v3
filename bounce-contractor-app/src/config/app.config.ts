export const APP_CONFIG = {
  // App Information
  APP_NAME: "Bounce Contractor",
  APP_VERSION: "1.0.0",
  APP_DESCRIPTION: "Mobile app for bounce house delivery contractors",

  // Environment
  ENVIRONMENT: import.meta.env.MODE || "development",
  IS_PRODUCTION: import.meta.env.MODE === "production",
  IS_DEVELOPMENT: import.meta.env.MODE === "development",

  // API Configuration
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  API_TIMEOUT: 30000, // 30 seconds

  // WebSocket Configuration
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:4000",
  WEBSOCKET_RECONNECT_INTERVAL: 5000, // 5 seconds
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS: 5,

  // Authentication
  JWT_ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  JWT_REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  BIOMETRIC_ENABLED: true,

  // Location Services
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
  LOCATION_ACCURACY_THRESHOLD: 100, // meters
  GEOFENCE_RADIUS: 1000, // meters

  // Task Management
  TASK_REFRESH_INTERVAL: 60000, // 1 minute
  TASK_CLAIM_TIMEOUT: 300000, // 5 minutes
  MAX_ACTIVE_TASKS: 3,

  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  IMAGE_COMPRESSION_QUALITY: 0.8,

  // Offline Support
  OFFLINE_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  OFFLINE_SYNC_RETRY_ATTEMPTS: 3,
  OFFLINE_SYNC_RETRY_DELAY: 5000, // 5 seconds

  // Notifications
  PUSH_NOTIFICATION_ENABLED: true,
  LOCAL_NOTIFICATION_ENABLED: true,
  NOTIFICATION_SOUND_ENABLED: true,

  // Audio Alerts
  AUDIO_ALERTS_ENABLED: true,
  AUDIO_MASTER_VOLUME: 0.8,
  AUDIO_VIBRATION_ENABLED: true,
  AUDIO_RESPECT_SILENT_MODE: true,
  AUDIO_PRELOAD_SOUNDS: true,

  // UI/UX
  ANIMATION_DURATION: 300, // milliseconds
  DEBOUNCE_DELAY: 500, // milliseconds
  INFINITE_SCROLL_THRESHOLD: 100, // pixels
  PULL_TO_REFRESH_THRESHOLD: 60, // pixels

  // Maps
  DEFAULT_MAP_ZOOM: 12,
  MAP_STYLE: "roadmap",
  MARKER_CLUSTER_ENABLED: true,

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: "auth_token",
    REFRESH_TOKEN: "refresh_token",
    USER_PROFILE: "user_profile",
    BIOMETRIC_ENABLED: "biometric_enabled",
    BIOMETRIC_CREDENTIALS: "biometric_credentials",
    LOCATION_PERMISSION: "location_permission",
    NOTIFICATION_SETTINGS: "notification_settings",
    SYSTEM_INITIALIZATION_STATE: "system_initialization_state",
    OFFLINE_QUEUE: "offline_queue",
    CACHED_TASKS: "cached_tasks",
    APP_SETTINGS: "app_settings",
  },

  // Error Codes
  ERROR_CODES: {
    NETWORK_ERROR: "NETWORK_ERROR",
    AUTH_ERROR: "AUTH_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    PERMISSION_ERROR: "PERMISSION_ERROR",
    SERVER_ERROR: "SERVER_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
  },

  // Feature Flags
  FEATURES: {
    BIOMETRIC_AUTH: true,
    BACKGROUND_LOCATION: true,
    OFFLINE_MODE: true,
    PUSH_NOTIFICATIONS: true,
    QUICKBOOKS_INTEGRATION: true,
    MULTI_LANGUAGE: false, // Future feature
    DARK_MODE: false, // Future feature
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
