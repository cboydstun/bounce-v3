/**
 * QuickBooks Service
 *
 * This service handles all QuickBooks-related API operations including
 * W-9 form submission, status tracking, and document management.
 * Integrates with the existing API client and follows established patterns.
 */

import { apiClient } from "../api/apiClient";
import {
  W9FormData,
  W9FormStatus,
  QuickBooksStatus,
  W9SubmissionResponse,
  W9StatusResponse,
  QuickBooksConnectionResponse,
  QuickBooksSyncResponse,
  ApiResponse,
} from "../../types/quickbooks.types";

/**
 * QuickBooks Service Class
 *
 * Provides methods for interacting with QuickBooks API endpoints
 * including W-9 form operations and integration status management.
 */
class QuickBooksService {
  // ============================================================================
  // W-9 Form Operations
  // ============================================================================

  /**
   * Submit W-9 form to QuickBooks
   *
   * @param formData - Complete W-9 form data
   * @returns Promise<W9FormStatus> - Form status after submission
   */
  async submitW9Form(formData: W9FormData): Promise<W9FormStatus> {
    try {
      // Encrypt sensitive data before transmission
      const secureFormData = this.prepareSecureFormData(formData);

      const response = await apiClient.post<ApiResponse<W9SubmissionResponse>>(
        "/quickbooks/w9/submit",
        secureFormData,
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to submit W-9 form");
      }

      return (response.data as any)?.w9Form || null;
    } catch (error) {
      console.error("QuickBooks W-9 submission error:", error);
      throw this.handleApiError(error, "Failed to submit W-9 form");
    }
  }

  /**
   * Get current W-9 form status
   *
   * @returns Promise<W9FormStatus | null> - Current form status or null if not found
   */
  async getW9Status(): Promise<W9FormStatus | null> {
    try {
      const response = await apiClient.get<ApiResponse<W9StatusResponse>>(
        "/quickbooks/w9/status",
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to get W-9 status");
      }

      return (response.data as any)?.w9Form || null;
    } catch (error) {
      console.error("QuickBooks W-9 status error:", error);
      throw this.handleApiError(error, "Failed to get W-9 status");
    }
  }

  /**
   * Update existing W-9 form (draft only)
   *
   * @param formData - Partial form data to update
   * @returns Promise<W9FormStatus> - Updated form status
   */
  async updateW9Form(formData: Partial<W9FormData>): Promise<W9FormStatus> {
    try {
      // Encrypt sensitive data if present
      const secureFormData = this.prepareSecureFormData(formData);

      const response = await apiClient.put<ApiResponse<W9SubmissionResponse>>(
        "/quickbooks/w9/update",
        secureFormData,
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update W-9 form");
      }

      return (response.data as any)?.w9Form || null;
    } catch (error) {
      console.error("QuickBooks W-9 update error:", error);
      throw this.handleApiError(error, "Failed to update W-9 form");
    }
  }

  /**
   * Download W-9 PDF document
   *
   * @returns Promise<Blob> - PDF file as blob
   */
  async downloadW9PDF(): Promise<Blob> {
    try {
      const response = await apiClient.get("/quickbooks/w9/download", {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!(response.data instanceof Blob)) {
        throw new Error("Invalid PDF response format");
      }

      return response.data;
    } catch (error) {
      console.error("QuickBooks W-9 download error:", error);
      throw this.handleApiError(error, "Failed to download W-9 PDF");
    }
  }

  // ============================================================================
  // QuickBooks Integration Operations
  // ============================================================================

  /**
   * Get QuickBooks integration status
   *
   * @returns Promise<QuickBooksStatus> - Current integration status
   */
  async getQuickBooksStatus(): Promise<QuickBooksStatus> {
    try {
      const response = await apiClient.get<ApiResponse<QuickBooksSyncResponse>>(
        "/quickbooks/sync/status",
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to get QuickBooks status");
      }

      return (
        (response.data as any)?.syncStatus || {
          connected: false,
          w9Status: "not_submitted",
          w9Approved: false,
          readyForSync: false,
        }
      );
    } catch (error) {
      console.error("QuickBooks status error:", error);
      throw this.handleApiError(error, "Failed to get QuickBooks status");
    }
  }

  /**
   * Initiate QuickBooks connection
   *
   * @returns Promise<string> - Authorization URL for QuickBooks OAuth
   */
  async connectQuickBooks(): Promise<string> {
    try {
      const response = await apiClient.post<
        ApiResponse<QuickBooksConnectionResponse>
      >("/quickbooks/connect");

      if (!response.success) {
        throw new Error(
          response.message || "Failed to initiate QuickBooks connection",
        );
      }

      return (response.data as any)?.authUrl || "";
    } catch (error) {
      console.error("QuickBooks connection error:", error);
      throw this.handleApiError(error, "Failed to connect to QuickBooks");
    }
  }

  /**
   * Sync contractor data with QuickBooks
   *
   * @returns Promise<{vendorId: string}> - QuickBooks vendor ID
   */
  async syncContractor(): Promise<{ vendorId: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ vendorId: string }>>(
        "/quickbooks/sync/contractor",
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to sync contractor data");
      }

      return (response.data as any) || { vendorId: "" };
    } catch (error) {
      console.error("QuickBooks sync error:", error);
      throw this.handleApiError(error, "Failed to sync contractor data");
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Prepare form data for secure transmission
   *
   * @param formData - Raw form data
   * @returns Prepared form data with sensitive fields handled
   */
  private prepareSecureFormData(
    formData: Partial<W9FormData>,
  ): Partial<W9FormData> {
    // Note: Tax ID encryption is handled on the server side
    // Client-side we just ensure proper formatting and validation
    const preparedData = { ...formData };

    // Format tax ID if present
    if (preparedData.taxId) {
      preparedData.taxId = this.formatTaxId(preparedData.taxId);
    }

    // Ensure signature date is properly formatted
    if (preparedData.signatureDate) {
      preparedData.signatureDate = new Date(preparedData.signatureDate)
        .toISOString()
        .split("T")[0];
    } else if (preparedData.signature) {
      // Auto-set signature date if signature is provided but date is not
      preparedData.signatureDate = new Date().toISOString().split("T")[0];
    }

    // Clean up empty optional fields
    if (preparedData.exemptPayeeCodes?.length === 0) {
      delete preparedData.exemptPayeeCodes;
    }

    if (!preparedData.fatcaReportingCode?.trim()) {
      delete preparedData.fatcaReportingCode;
    }

    if (!preparedData.taxClassificationOther?.trim()) {
      delete preparedData.taxClassificationOther;
    }

    return preparedData;
  }

  /**
   * Format tax ID for consistent formatting
   *
   * @param taxId - Raw tax ID input
   * @returns Formatted tax ID
   */
  private formatTaxId(taxId: string): string {
    // Remove all non-digits
    const digits = taxId.replace(/\D/g, "");

    if (digits.length === 9) {
      // Format as SSN: XXX-XX-XXXX
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    } else if (
      digits.length === 9 &&
      taxId.includes("-") &&
      taxId.indexOf("-") < 3
    ) {
      // Format as EIN: XX-XXXXXXX
      return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
    }

    // Return as-is if format is unclear
    return taxId;
  }

  /**
   * Handle API errors with consistent error formatting
   *
   * @param error - Original error
   * @param defaultMessage - Default error message
   * @returns Formatted error
   */
  private handleApiError(error: any, defaultMessage: string): Error {
    if (error.response?.data?.error?.message) {
      return new Error(error.response.data.error.message);
    }

    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    if (error.message) {
      return new Error(error.message);
    }

    return new Error(defaultMessage);
  }

  // ============================================================================
  // Validation Utilities
  // ============================================================================

  /**
   * Validate tax ID format
   *
   * @param taxId - Tax ID to validate
   * @returns Validation result with format information
   */
  validateTaxId(taxId: string): {
    isValid: boolean;
    format: "ssn" | "ein" | "invalid";
    formatted: string;
  } {
    const digits = taxId.replace(/\D/g, "");

    if (digits.length !== 9) {
      return { isValid: false, format: "invalid", formatted: taxId };
    }

    // Check for SSN format (XXX-XX-XXXX)
    if (taxId.match(/^\d{3}-\d{2}-\d{4}$/)) {
      return { isValid: true, format: "ssn", formatted: taxId };
    }

    // Check for EIN format (XX-XXXXXXX)
    if (taxId.match(/^\d{2}-\d{7}$/)) {
      return { isValid: true, format: "ein", formatted: taxId };
    }

    // Format as SSN by default for 9 digits
    const formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    return { isValid: true, format: "ssn", formatted };
  }

  /**
   * Validate ZIP code format
   *
   * @param zipCode - ZIP code to validate
   * @returns True if valid ZIP code format
   */
  validateZipCode(zipCode: string): boolean {
    // US ZIP code: 5 digits or 5+4 format
    return /^\d{5}(-\d{4})?$/.test(zipCode);
  }

  /**
   * Validate US state code
   *
   * @param state - State code to validate
   * @returns True if valid US state code
   */
  validateStateCode(state: string): boolean {
    const validStates = [
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
    ];
    return validStates.includes(state.toUpperCase());
  }
}

// Export singleton instance
export const quickbooksService = new QuickBooksService();

// Export class for testing
export type { QuickBooksService };
