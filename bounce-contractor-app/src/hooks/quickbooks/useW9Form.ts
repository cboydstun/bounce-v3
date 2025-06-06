/**
 * useW9Form Hook
 *
 * React hook for managing W-9 form state, submission, and status tracking.
 * Integrates with React Query for caching and state management.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { quickbooksService } from "../../services/quickbooks/quickbooksService";
import {
  W9FormData,
  W9FormStatus,
  UseW9FormReturn,
} from "../../types/quickbooks.types";
import { useToast } from "../common/useToast";
import { useI18n } from "../common/useI18n";

/**
 * Query keys for React Query caching
 */
export const W9_QUERY_KEYS = {
  status: ["w9", "status"] as const,
  form: ["w9", "form"] as const,
} as const;

/**
 * useW9Form Hook
 *
 * Provides comprehensive W-9 form management including:
 * - Form status tracking
 * - Form submission and updates
 * - PDF download functionality
 * - Error handling and user feedback
 *
 * @returns UseW9FormReturn - Hook return object with data and actions
 */
export const useW9Form = (): UseW9FormReturn => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useI18n();

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Get W-9 form status
   */
  const {
    data: w9Status,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery({
    queryKey: W9_QUERY_KEYS.status,
    queryFn: () => quickbooksService.getW9Status(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (form not found) or 401 (unauthorized)
      if (error && typeof error === "object" && "response" in error) {
        const status = (error as any).response?.status;
        if (status === 404 || status === 401) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  // ============================================================================
  // Mutations
  // ============================================================================

  /**
   * Submit W-9 form mutation
   */
  const submitW9Mutation = useMutation({
    mutationFn: (formData: W9FormData) =>
      quickbooksService.submitW9Form(formData),
    onSuccess: (data) => {
      // Invalidate and refetch status
      queryClient.invalidateQueries({ queryKey: W9_QUERY_KEYS.status });

      // Show success message
      showToast(
        t("quickbooks.w9.submitSuccess", "W-9 form submitted successfully"),
        "success",
      );

      // Log success for analytics
      console.log("W-9 form submitted successfully:", data.id);
    },
    onError: (error: Error) => {
      console.error("W-9 form submission failed:", error);

      // Show error message
      showToast(
        error.message ||
          t("quickbooks.w9.submitError", "Failed to submit W-9 form"),
        "error",
      );
    },
  });

  /**
   * Update W-9 form mutation (for drafts)
   */
  const updateW9Mutation = useMutation({
    mutationFn: (formData: Partial<W9FormData>) =>
      quickbooksService.updateW9Form(formData),
    onSuccess: (data) => {
      // Update cached status
      queryClient.setQueryData(W9_QUERY_KEYS.status, data);

      // Show success message
      showToast(
        t("quickbooks.w9.updateSuccess", "W-9 form updated successfully"),
        "success",
      );
    },
    onError: (error: Error) => {
      console.error("W-9 form update failed:", error);

      // Show error message
      showToast(
        error.message ||
          t("quickbooks.w9.updateError", "Failed to update W-9 form"),
        "error",
      );
    },
  });

  /**
   * Download W-9 PDF mutation
   */
  const downloadPDFMutation = useMutation({
    mutationFn: () => quickbooksService.downloadW9PDF(),
    onSuccess: (blob) => {
      try {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `w9-form-${new Date().toISOString().split("T")[0]}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        window.URL.revokeObjectURL(url);

        // Show success message
        showToast(
          t("quickbooks.w9.downloadSuccess", "W-9 PDF downloaded successfully"),
          "success",
        );
      } catch (error) {
        console.error("PDF download error:", error);
        showToast(
          t("quickbooks.w9.downloadError", "Failed to download PDF"),
          "error",
        );
      }
    },
    onError: (error: Error) => {
      console.error("W-9 PDF download failed:", error);

      // Show error message
      showToast(
        error.message ||
          t("quickbooks.w9.downloadError", "Failed to download W-9 PDF"),
        "error",
      );
    },
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Get the current error state
   */
  const error =
    statusError ||
    submitW9Mutation.error ||
    updateW9Mutation.error ||
    downloadPDFMutation.error;

  /**
   * Clear all errors
   */
  const clearError = () => {
    submitW9Mutation.reset();
    updateW9Mutation.reset();
    downloadPDFMutation.reset();
    queryClient.removeQueries({
      queryKey: W9_QUERY_KEYS.status,
      type: "inactive",
    });
  };

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // Data
    w9Status: w9Status || null,
    isLoadingStatus,

    // Actions
    submitW9Form: submitW9Mutation.mutate,
    isSubmitting: submitW9Mutation.isPending,

    updateW9Form: updateW9Mutation.mutate,
    isUpdating: updateW9Mutation.isPending,

    downloadPDF: downloadPDFMutation.mutate,
    isDownloading: downloadPDFMutation.isPending,

    // Error handling
    error: error as Error | null,
    clearError,
  };
};

/**
 * useW9FormStatus Hook
 *
 * Simplified hook for just getting W-9 status without mutations.
 * Useful for components that only need to display status.
 *
 * @returns Object with status data and loading state
 */
export const useW9FormStatus = () => {
  const {
    data: w9Status,
    isLoading,
    error,
  } = useQuery({
    queryKey: W9_QUERY_KEYS.status,
    queryFn: () => quickbooksService.getW9Status(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    w9Status: w9Status || null,
    isLoading,
    error: error as Error | null,
  };
};

/**
 * useW9FormValidation Hook
 *
 * Hook for validating W-9 form data without submitting.
 * Useful for real-time validation in form components.
 *
 * @returns Validation utilities
 */
export const useW9FormValidation = () => {
  const { t } = useI18n();

  /**
   * Validate complete W-9 form data
   */
  const validateForm = (formData: Partial<W9FormData>) => {
    const errors: Array<{ field: string; message: string }> = [];

    // Required fields validation
    if (!formData.businessName?.trim()) {
      errors.push({
        field: "businessName",
        message: t(
          "quickbooks.validation.businessNameRequired",
          "Business name is required",
        ),
      });
    }

    if (!formData.taxClassification) {
      errors.push({
        field: "taxClassification",
        message: t(
          "quickbooks.validation.taxClassificationRequired",
          "Tax classification is required",
        ),
      });
    }

    if (!formData.taxId?.trim()) {
      errors.push({
        field: "taxId",
        message: t("quickbooks.validation.taxIdRequired", "Tax ID is required"),
      });
    } else {
      // Validate tax ID format
      const taxIdValidation = quickbooksService.validateTaxId(formData.taxId);
      if (!taxIdValidation.isValid) {
        errors.push({
          field: "taxId",
          message: t(
            "quickbooks.validation.taxIdInvalid",
            "Invalid tax ID format",
          ),
        });
      }
    }

    // Address validation
    if (!formData.address?.street?.trim()) {
      errors.push({
        field: "address.street",
        message: t(
          "quickbooks.validation.streetRequired",
          "Street address is required",
        ),
      });
    }

    if (!formData.address?.city?.trim()) {
      errors.push({
        field: "address.city",
        message: t("quickbooks.validation.cityRequired", "City is required"),
      });
    }

    if (!formData.address?.state?.trim()) {
      errors.push({
        field: "address.state",
        message: t("quickbooks.validation.stateRequired", "State is required"),
      });
    } else if (!quickbooksService.validateStateCode(formData.address.state)) {
      errors.push({
        field: "address.state",
        message: t("quickbooks.validation.stateInvalid", "Invalid state code"),
      });
    }

    if (!formData.address?.zipCode?.trim()) {
      errors.push({
        field: "address.zipCode",
        message: t(
          "quickbooks.validation.zipCodeRequired",
          "ZIP code is required",
        ),
      });
    } else if (!quickbooksService.validateZipCode(formData.address.zipCode)) {
      errors.push({
        field: "address.zipCode",
        message: t(
          "quickbooks.validation.zipCodeInvalid",
          "Invalid ZIP code format",
        ),
      });
    }

    // Certifications validation
    if (!formData.certifications?.taxIdCorrect) {
      errors.push({
        field: "certifications.taxIdCorrect",
        message: t(
          "quickbooks.validation.taxIdCertificationRequired",
          "Tax ID certification is required",
        ),
      });
    }

    if (!formData.certifications?.notSubjectToBackupWithholding) {
      errors.push({
        field: "certifications.notSubjectToBackupWithholding",
        message: t(
          "quickbooks.validation.backupWithholdingCertificationRequired",
          "Backup withholding certification is required",
        ),
      });
    }

    if (!formData.certifications?.usCitizenOrResident) {
      errors.push({
        field: "certifications.usCitizenOrResident",
        message: t(
          "quickbooks.validation.citizenshipCertificationRequired",
          "Citizenship certification is required",
        ),
      });
    }

    // Signature validation
    if (!formData.signature?.trim()) {
      errors.push({
        field: "signature",
        message: t(
          "quickbooks.validation.signatureRequired",
          "Signature is required",
        ),
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Validate individual field
   */
  const validateField = (field: string, value: any) => {
    const tempFormData = { [field]: value } as Partial<W9FormData>;
    const validation = validateForm(tempFormData);
    return validation.errors.find((error) => error.field === field) || null;
  };

  return {
    validateForm,
    validateField,
    validateTaxId: quickbooksService.validateTaxId.bind(quickbooksService),
    validateZipCode: quickbooksService.validateZipCode.bind(quickbooksService),
    validateStateCode:
      quickbooksService.validateStateCode.bind(quickbooksService),
  };
};
