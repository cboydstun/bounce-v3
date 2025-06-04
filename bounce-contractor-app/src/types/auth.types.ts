import { Coordinates } from "./api.types";

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type UserStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending_verification";
export type UserRole = "contractor" | "admin" | "super_admin";

// Contractor Profile Types
export interface ContractorProfile {
  id: string;
  userId: string;
  businessName?: string;
  businessLicense?: string;
  insuranceNumber?: string;
  taxId?: string;
  skills: ContractorSkill[];
  serviceAreas: ServiceArea[];
  availability: Availability;
  rating: number;
  totalJobs: number;
  completionRate: number;
  onTimeRate: number;
  backgroundCheckStatus: BackgroundCheckStatus;
  backgroundCheckDate?: string;
  emergencyContact: EmergencyContact;
  bankingInfo?: BankingInfo;
  quickbooksConnected: boolean;
  quickbooksCompanyId?: string;
  w9Submitted: boolean;
  w9SubmittedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractorSkill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  certified: boolean;
  certificationDate?: string;
  certificationExpiry?: string;
}

export type SkillCategory =
  | "delivery"
  | "setup"
  | "electrical"
  | "safety"
  | "customer_service"
  | "equipment_maintenance";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface ServiceArea {
  id: string;
  name: string;
  zipCodes: string[];
  radius: number; // in miles
  coordinates: Coordinates;
  isActive: boolean;
}

export interface Availability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
  timeZone: string;
}

export interface DayAvailability {
  isAvailable: boolean;
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
  breaks?: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export type BackgroundCheckStatus =
  | "not_started"
  | "in_progress"
  | "passed"
  | "failed"
  | "expired";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface BankingInfo {
  accountHolderName: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string; // This should be encrypted
  accountType: "checking" | "savings";
  isVerified: boolean;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  skills: string[];
}

// Profile update data for contractor profile endpoint
export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  skills?: Array<{
    id: string;
    name: string;
    category: string;
    level: string;
    certified: boolean;
  }>;
  businessName?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  };
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  skills: string[];
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: "Bearer";
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  profile: ContractorProfile | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
  sessionExpiry: string | null;
}

// Password Reset Types
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Email Verification Types
export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
  code: string;
}

// Phone Verification Types
export interface PhoneVerificationRequest {
  phone: string;
}

export interface PhoneVerificationConfirm {
  phone: string;
  code: string;
}

// Session Types
export interface SessionInfo {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
}

// Biometric Authentication Types
export interface BiometricSetup {
  enabled: boolean;
  biometryType: string;
  enrolledAt?: string;
}

export interface BiometricAuthRequest {
  reason: string;
  fallbackTitle?: string;
}

// OAuth Types (for QuickBooks integration)
export interface OAuthState {
  state: string;
  codeVerifier: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope: string;
  tokenType: string;
}

// Permission Types
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// Account Settings Types
export interface AccountSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
  preferences: UserPreferences;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  taskAlerts: boolean;
  paymentAlerts: boolean;
  marketingEmails: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface PrivacySettings {
  profileVisibility: "public" | "private" | "contractors_only";
  locationSharing: boolean;
  activityStatus: boolean;
  dataCollection: boolean;
  analyticsOptOut: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number; // in minutes
  loginAlerts: boolean;
  deviceTrust: boolean;
}

export interface UserPreferences {
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  currency: string;
  distanceUnit: "miles" | "kilometers";
  temperatureUnit: "fahrenheit" | "celsius";
  theme: "light" | "dark" | "auto";
  mapStyle: "roadmap" | "satellite" | "hybrid" | "terrain";
}
