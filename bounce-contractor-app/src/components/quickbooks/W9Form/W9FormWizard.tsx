/**
 * W9FormWizard Component
 *
 * Main wizard component that orchestrates the W-9 form submission process.
 * Manages step navigation, form state, and submission workflow.
 */

import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonProgressBar,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonLoading,
  IonToast,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { closeOutline, saveOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import {
  W9FormData,
  FormStep,
  FormStepConfig,
} from "../../../types/quickbooks.types";
import { useI18n } from "../../../hooks/common/useI18n";
import { useW9Form } from "../../../hooks/quickbooks/useW9Form";
import { useToast, getToastColor } from "../../../hooks/common/useToast";

// Import step components
import TaxClassificationStep from "./TaxClassificationStep";
import PersonalInfoStep from "./PersonalInfoStep";
import AddressStep from "./AddressStep";
import CertificationsStep from "./CertificationsStep";
import SignatureStep from "./SignatureStep";
import ReviewStep from "./ReviewStep";

/**
 * Form step configuration
 */
const FORM_STEPS: FormStepConfig[] = [
  {
    key: "classification",
    title: "Tax Classification",
    titleKey: "quickbooks.w9.steps.classification",
    component: TaxClassificationStep,
  },
  {
    key: "personal",
    title: "Personal Information",
    titleKey: "quickbooks.w9.steps.personal",
    component: PersonalInfoStep,
  },
  {
    key: "address",
    title: "Address Information",
    titleKey: "quickbooks.w9.steps.address",
    component: AddressStep,
  },
  {
    key: "certifications",
    title: "Certifications",
    titleKey: "quickbooks.w9.steps.certifications",
    component: CertificationsStep,
  },
  {
    key: "signature",
    title: "Signature",
    titleKey: "quickbooks.w9.steps.signature",
    component: SignatureStep,
  },
  {
    key: "review",
    title: "Review & Submit",
    titleKey: "quickbooks.w9.steps.review",
    component: ReviewStep,
  },
];

interface W9FormWizardProps {
  onClose?: () => void;
  initialData?: Partial<W9FormData>;
}

/**
 * W9FormWizard Component
 *
 * Features:
 * - Multi-step form navigation
 * - Progress indicator
 * - Form state management
 * - Draft saving capability
 * - Validation and error handling
 * - Responsive design
 */
export const W9FormWizard: React.FC<W9FormWizardProps> = ({
  onClose,
  initialData = {},
}) => {
  const history = useHistory();
  const { t } = useI18n();
  const { toastState, showToast, hideToast } = useToast();
  const {
    w9Status,
    isLoadingStatus,
    submitW9Form,
    isSubmitting,
    updateW9Form,
    isUpdating,
    error,
    clearError,
  } = useW9Form();

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<W9FormData>>(initialData);
  const [isDraft, setIsDraft] = useState(false);

  // Initialize form data from existing W-9 if available
  useEffect(() => {
    if (w9Status && w9Status.status === "draft") {
      // TODO: Load draft data from API when available
      setIsDraft(true);
    }
  }, [w9Status]);

  // Handle errors
  useEffect(() => {
    if (error) {
      showToast(error.message, "error");
      clearError();
    }
  }, [error, showToast, clearError]);

  /**
   * Get current step configuration
   */
  const getCurrentStep = (): FormStepConfig => {
    return FORM_STEPS[currentStep];
  };

  /**
   * Calculate progress percentage
   */
  const getProgress = (): number => {
    return (currentStep + 1) / FORM_STEPS.length;
  };

  /**
   * Handle step navigation forward
   */
  const handleNext = (stepData: Partial<W9FormData>) => {
    const updatedFormData = { ...formData, ...stepData };
    setFormData(updatedFormData);

    // Save draft automatically
    if (isDraft) {
      saveDraft(updatedFormData);
    }

    // Move to next step or submit if last step
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit(updatedFormData);
    }
  };

  /**
   * Handle step navigation backward
   */
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (finalData: Partial<W9FormData>) => {
    try {
      // Validate complete form data
      const completeFormData = validateCompleteForm(finalData);

      // Submit to API
      submitW9Form(completeFormData);

      // Show success message and navigate
      showToast(
        t("quickbooks.w9.submitSuccess", "W-9 form submitted successfully!"),
        "success",
      );

      // Navigate to status page after short delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          history.push("/quickbooks/w9-status");
        }
      }, 2000);
    } catch (validationError) {
      showToast(
        (validationError as Error).message ||
          t(
            "quickbooks.w9.validationError",
            "Please complete all required fields",
          ),
        "error",
      );
    }
  };

  /**
   * Save form as draft
   */
  const saveDraft = async (draftData: Partial<W9FormData>) => {
    try {
      await updateW9Form(draftData);
      setIsDraft(true);
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  /**
   * Validate complete form data before submission
   */
  const validateCompleteForm = (data: Partial<W9FormData>): W9FormData => {
    const errors: string[] = [];

    if (!data.taxClassification) {
      errors.push("Tax classification is required");
    }

    if (!data.businessName?.trim()) {
      errors.push("Business name is required");
    }

    if (!data.taxId?.trim()) {
      errors.push("Tax ID is required");
    }

    // Address validation
    if (!data.address?.street?.trim()) {
      errors.push("Address is required");
    }

    if (!data.address?.city?.trim()) {
      errors.push("City is required");
    }

    if (!data.address?.state?.trim()) {
      errors.push("State is required");
    }

    if (!data.address?.zipCode?.trim()) {
      errors.push("ZIP code is required");
    }

    // Certifications validation
    if (!data.certifications?.taxIdCorrect) {
      errors.push("Tax ID certification is required");
    }

    if (!data.certifications?.notSubjectToBackupWithholding) {
      errors.push("Backup withholding certification is required");
    }

    if (!data.certifications?.usCitizenOrResident) {
      errors.push("US citizenship/residency certification is required");
    }

    // Signature validation
    if (!data.signature?.trim()) {
      errors.push("Signature is required");
    }

    if (!data.signatureDate) {
      errors.push("Signature date is required");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return data as W9FormData;
  };

  /**
   * Handle wizard close
   */
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      history.goBack();
    }
  };

  /**
   * Handle save draft button
   */
  const handleSaveDraft = () => {
    saveDraft(formData);
    showToast(
      t("quickbooks.w9.draftSaved", "Draft saved successfully"),
      "success",
    );
  };

  // Get current step component
  const CurrentStepComponent = getCurrentStep().component;
  const stepTitle = t(getCurrentStep().titleKey, getCurrentStep().title);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>{t("quickbooks.w9.wizardTitle", "W-9 Tax Form")}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSaveDraft} disabled={isUpdating}>
              <IonIcon icon={saveOutline} />
            </IonButton>
            <IonButton onClick={handleClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Progress Bar */}
        <IonProgressBar value={getProgress()} className="h-1" />

        {/* Step Indicator */}
        <div className="bg-gray-50 px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {stepTitle}
              </h2>
              <p className="text-sm text-gray-600">
                {t(
                  "quickbooks.w9.stepIndicator",
                  `Step ${currentStep + 1} of ${FORM_STEPS.length}`,
                )}
              </p>
            </div>
            {isDraft && (
              <div className="text-sm text-blue-600 font-medium">
                {t("quickbooks.w9.draftMode", "Draft")}
              </div>
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4">
          {isLoadingStatus ? (
            <IonCard>
              <IonCardContent className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {t("quickbooks.w9.loading", "Loading form data...")}
                </p>
              </IonCardContent>
            </IonCard>
          ) : (
            <CurrentStepComponent
              data={formData}
              onNext={handleNext}
              onBack={handleBack}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canGoBack={currentStep > 0}
              isLastStep={currentStep === FORM_STEPS.length - 1}
            />
          )}
        </div>

        {/* Loading Overlay */}
        <IonLoading
          isOpen={isSubmitting || isUpdating}
          message={
            isSubmitting
              ? t("quickbooks.w9.submitting", "Submitting W-9 form...")
              : t("quickbooks.w9.saving", "Saving draft...")
          }
        />

        {/* Toast Notifications */}
        <IonToast
          isOpen={toastState.isOpen}
          onDidDismiss={hideToast}
          message={toastState.message}
          duration={toastState.duration}
          color={getToastColor(toastState.type)}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default W9FormWizard;
