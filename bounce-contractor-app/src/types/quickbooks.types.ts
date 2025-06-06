/**
 * QuickBooks W-9 Integration Types
 *
 * This file contains all TypeScript definitions for the QuickBooks W-9 tax form
 * integration system, including form data structures, status tracking, and
 * API response types.
 */

// ============================================================================
// W-9 Form Data Types
// ============================================================================

/**
 * Tax classification options for W-9 form
 */
export type TaxClassification =
  | "individual"
  | "c-corp"
  | "s-corp"
  | "partnership"
  | "trust"
  | "llc"
  | "other";

/**
 * W-9 form status tracking
 */
export type W9Status = "draft" | "submitted" | "approved" | "rejected";

/**
 * Address information structure
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Requestor information (business requesting the W-9)
 */
export interface RequestorInfo {
  name: string;
  address: Address;
}

/**
 * Tax certifications and declarations
 */
export interface TaxCertifications {
  taxIdCorrect: boolean;
  notSubjectToBackupWithholding: boolean;
  usCitizenOrResident: boolean;
  fatcaExempt: boolean;
}

/**
 * Complete W-9 form data structure
 */
export interface W9FormData {
  // Basic Information
  businessName: string;
  taxClassification: TaxClassification;
  taxClassificationOther?: string;

  // Tax Identification
  taxId: string; // Will be encrypted before transmission

  // Address Information
  address: Address;

  // Requestor Information
  requestorInfo: RequestorInfo;

  // Certifications
  certifications: TaxCertifications;

  // Optional Fields
  exemptPayeeCodes?: string[];
  fatcaReportingCode?: string;

  // Signature
  signature: string;
  signatureDate?: string;
}

/**
 * W-9 form status and metadata
 */
export interface W9FormStatus {
  id: string;
  status: W9Status;
  businessName: string;
  taxClassification: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  hasPdf: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * QuickBooks integration status
 */
export interface QuickBooksStatus {
  connected: boolean;
  companyName?: string;
  w9Status: W9Status | "not_submitted";
  w9Approved: boolean;
  readyForSync: boolean;
  lastSyncAt?: Date;
  connectionExpiresAt?: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * API error response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

/**
 * W-9 submission response
 */
export interface W9SubmissionResponse {
  w9Form: W9FormStatus;
  message: string;
}

/**
 * W-9 status response
 */
export interface W9StatusResponse {
  w9Form: W9FormStatus | null;
}

/**
 * QuickBooks connection response
 */
export interface QuickBooksConnectionResponse {
  authUrl: string;
  state: string;
}

/**
 * QuickBooks sync status response
 */
export interface QuickBooksSyncResponse {
  syncStatus: QuickBooksStatus;
}

// ============================================================================
// Form Validation Types
// ============================================================================

/**
 * Form validation error
 */
export interface FormValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Form validation result
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
}

/**
 * Tax ID validation result
 */
export interface TaxIdValidationResult {
  isValid: boolean;
  format: "ssn" | "ein" | "invalid";
  formatted: string;
  error?: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * W-9 form step component props
 */
export interface W9FormStepProps {
  data: Partial<W9FormData>;
  onNext: (stepData: Partial<W9FormData>) => void;
  onBack: () => void;
  onSubmit?: (finalData: Partial<W9FormData>) => void;
  isSubmitting?: boolean;
  canGoBack: boolean;
  isLastStep: boolean;
}

/**
 * Tax ID input component props
 */
export interface TaxIdInputProps {
  value: string;
  onIonInput: (value: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

/**
 * W-9 status badge props
 */
export interface W9StatusBadgeProps {
  status: W9Status | "not_submitted";
  size?: "small" | "medium" | "large";
  showText?: boolean;
}

/**
 * Document viewer props
 */
export interface DocumentViewerProps {
  documentUrl?: string;
  documentBlob?: Blob;
  title: string;
  onDownload?: () => void;
  onClose: () => void;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * useW9Form hook return type
 */
export interface UseW9FormReturn {
  // Data
  w9Status: W9FormStatus | null;
  isLoadingStatus: boolean;

  // Actions
  submitW9Form: (formData: W9FormData) => void;
  isSubmitting: boolean;

  updateW9Form: (formData: Partial<W9FormData>) => void;
  isUpdating: boolean;

  downloadPDF: () => void;
  isDownloading: boolean;

  // Error handling
  error: Error | null;
  clearError: () => void;
}

/**
 * useQuickBooksStatus hook return type
 */
export interface UseQuickBooksStatusReturn {
  // Data
  quickbooksStatus: QuickBooksStatus | null;
  isLoading: boolean;

  // Actions
  connectQuickBooks: () => void;
  isConnecting: boolean;

  syncContractor: () => void;
  isSyncing: boolean;

  // Error handling
  error: Error | null;
  clearError: () => void;
}

/**
 * useTaxDocuments hook return type
 */
export interface UseTaxDocumentsReturn {
  // Data
  documents: W9FormStatus[];
  isLoading: boolean;

  // Actions
  downloadDocument: (documentId: string) => void;
  isDownloading: boolean;

  refreshDocuments: () => void;
  isRefreshing: boolean;

  // Error handling
  error: Error | null;
  clearError: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Form step identifier
 */
export type FormStep =
  | "classification"
  | "personal"
  | "address"
  | "certifications"
  | "signature"
  | "review";

/**
 * Form step configuration
 */
export interface FormStepConfig {
  key: FormStep;
  title: string;
  titleKey: string; // i18n key
  component: React.ComponentType<W9FormStepProps>;
  isOptional?: boolean;
  validationSchema?: any; // Joi schema
}

/**
 * Encrypted field wrapper
 */
export interface EncryptedField {
  encrypted: string;
  algorithm: string;
  iv: string;
}

/**
 * Draft form data (stored locally)
 */
export interface W9FormDraft {
  id: string;
  formData: Partial<W9FormData>;
  lastSaved: Date;
  step: FormStep;
  isComplete: boolean;
}

// ============================================================================
// Constants and Enums
// ============================================================================

/**
 * US states for address validation
 */
export const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;

/**
 * Tax classification options with labels
 */
export const TAX_CLASSIFICATIONS = [
  { value: "individual", labelKey: "quickbooks.taxClassification.individual" },
  { value: "c-corp", labelKey: "quickbooks.taxClassification.cCorp" },
  { value: "s-corp", labelKey: "quickbooks.taxClassification.sCorp" },
  {
    value: "partnership",
    labelKey: "quickbooks.taxClassification.partnership",
  },
  { value: "trust", labelKey: "quickbooks.taxClassification.trust" },
  { value: "llc", labelKey: "quickbooks.taxClassification.llc" },
  { value: "other", labelKey: "quickbooks.taxClassification.other" },
] as const;

/**
 * Form validation error codes
 */
export const VALIDATION_ERROR_CODES = {
  REQUIRED_FIELD: "REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_TAX_ID: "INVALID_TAX_ID",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PHONE: "INVALID_PHONE",
  INVALID_ZIP_CODE: "INVALID_ZIP_CODE",
  INVALID_STATE: "INVALID_STATE",
  SIGNATURE_REQUIRED: "SIGNATURE_REQUIRED",
  CERTIFICATION_REQUIRED: "CERTIFICATION_REQUIRED",
} as const;

export type ValidationErrorCode =
  (typeof VALIDATION_ERROR_CODES)[keyof typeof VALIDATION_ERROR_CODES];
