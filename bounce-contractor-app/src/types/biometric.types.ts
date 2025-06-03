export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorCode?: BiometricErrorCode;
}

export interface BiometricAvailabilityResult {
  isAvailable: boolean;
  biometryType?: BiometryType;
  strongBiometryIsAvailable?: boolean;
  reason?: string;
}

export interface BiometricCredentials {
  username: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface BiometricPromptOptions {
  reason: string;
  title?: string;
  subtitle?: string;
  description?: string;
  fallbackTitle?: string;
  negativeButtonText?: string;
  maxAttempts?: number;
}

export enum BiometryType {
  NONE = "none",
  TOUCH_ID = "touchId",
  FACE_ID = "faceId",
  FINGERPRINT = "fingerprint",
  FACE_AUTHENTICATION = "faceAuthentication",
  IRIS_AUTHENTICATION = "irisAuthentication",
  MULTIPLE = "multiple",
}

export enum BiometricErrorCode {
  BIOMETRY_UNKNOWN_ERROR = -1,
  BIOMETRY_NOT_AVAILABLE = 1,
  BIOMETRY_NOT_ENROLLED = 2,
  BIOMETRY_PERMISSION_NOT_GRANTED = 3,
  USER_CANCEL = 10,
  USER_FALLBACK = 11,
  SYSTEM_CANCEL = 12,
  PASSCODE_NOT_SET = 13,
  BIOMETRY_LOCKOUT = 14,
  BIOMETRY_LOCKOUT_PERMANENT = 15,
  USER_TEMPORARY_LOCKOUT = 16,
  AUTHENTICATION_FAILED = 17,
  APP_CANCEL = 18,
  INVALID_CONTEXT = 19,
  NOT_INTERACTIVE = 20,
  PASSCODE_FALLBACK = 21,
}

export interface BiometricSettings {
  enabled: boolean;
  enrolledAt?: string;
  lastUsedAt?: string;
  failureCount?: number;
  maxFailures?: number;
}

export interface SecureStorageItem {
  key: string;
  value: string;
  createdAt: string;
  expiresAt?: string;
}

export interface SecureStorageOptions {
  encrypt?: boolean;
  requireBiometric?: boolean;
  expirationTime?: number; // milliseconds
}
