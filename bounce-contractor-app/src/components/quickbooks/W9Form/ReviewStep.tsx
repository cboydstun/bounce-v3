/**
 * ReviewStep Component
 *
 * Final step of the W-9 form wizard for reviewing and submitting the form.
 * Displays all collected information with edit capabilities.
 */

import React, { useState } from "react";
import {
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonCheckbox,
  IonNote,
  IonSpinner,
} from "@ionic/react";
import {
  checkmarkCircleOutline,
  arrowBackOutline,
  createOutline,
  documentTextOutline,
  locationOutline,
  shieldCheckmarkOutline,
  personOutline,
  businessOutline,
} from "ionicons/icons";
import { W9FormStepProps } from "../../../types/quickbooks.types";
import { useI18n } from "../../../hooks/common/useI18n";

/**
 * ReviewStep Component
 *
 * Features:
 * - Complete form data review
 * - Editable sections (click to go back to specific step)
 * - Final validation check
 * - Submission button with loading state
 * - Terms and conditions acceptance
 * - Summary display with proper formatting
 * - Bilingual support
 */
export const ReviewStep: React.FC<W9FormStepProps> = ({
  data,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
  canGoBack,
  isLastStep,
}) => {
  const { t } = useI18n();
  const [finalAgreement, setFinalAgreement] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate final submission
   */
  const validateSubmission = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!finalAgreement) {
      newErrors.finalAgreement = t(
        "quickbooks.validation.finalAgreementRequired",
        "You must confirm the accuracy of all information before submitting",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = () => {
    if (!validateSubmission()) {
      return;
    }

    if (onSubmit) {
      onSubmit(data);
    }
  };

  /**
   * Handle final agreement change
   */
  const handleFinalAgreementChange = (checked: boolean) => {
    setFinalAgreement(checked);

    // Clear error when user agrees
    if (checked && errors.finalAgreement) {
      setErrors((prev) => ({
        ...prev,
        finalAgreement: "",
      }));
    }
  };

  /**
   * Format tax classification for display
   */
  const formatTaxClassification = (): string => {
    if (!data.taxClassification) return "";

    const classification = data.taxClassification;
    if (classification === "other" && data.taxClassificationOther) {
      return `${classification} (${data.taxClassificationOther})`;
    }

    return classification
      .replace("-", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  /**
   * Format address for display
   */
  const formatAddress = (): string => {
    if (!data.address) return "";

    const { street, city, state, zipCode } = data.address;
    return `${street}, ${city}, ${state} ${zipCode}`;
  };

  /**
   * Format certifications for display
   */
  const formatCertifications = (): string[] => {
    if (!data.certifications) return [];

    const certifications = [];

    if (data.certifications.taxIdCorrect) {
      certifications.push(
        t("quickbooks.review.taxIdCertified", "Tax ID is correct"),
      );
    }

    if (data.certifications.notSubjectToBackupWithholding) {
      certifications.push(
        t(
          "quickbooks.review.backupWithholdingCertified",
          "Not subject to backup withholding",
        ),
      );
    }

    if (data.certifications.usCitizenOrResident) {
      certifications.push(
        t("quickbooks.review.citizenshipCertified", "US citizen or resident"),
      );
    }

    if (data.certifications.fatcaExempt) {
      certifications.push(t("quickbooks.review.fatcaExempt", "FATCA exempt"));
    }

    return certifications;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  /**
   * Mask tax ID for display
   */
  const maskTaxId = (taxId: string): string => {
    if (!taxId) return "";
    return "•••-••-••••";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon icon={documentTextOutline} className="mr-2 text-primary" />
            {t("quickbooks.w9.reviewTitle", "Review & Submit W-9 Form")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p className="text-gray-600">
            {t(
              "quickbooks.w9.reviewDescription",
              "Please review all information below carefully. Once submitted, your W-9 form will be processed and you will not be able to make changes without contacting support.",
            )}
          </p>
        </IonCardContent>
      </IonCard>

      {/* Tax Classification Review */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <IonIcon icon={businessOutline} className="mr-2 text-secondary" />
              {t(
                "quickbooks.review.taxClassificationSection",
                "Tax Classification",
              )}
            </div>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => onBack && onBack()}
            >
              {t("common.edit", "Edit")}
            </IonButton>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("quickbooks.review.classification", "Classification")}:
              </span>
              <span className="font-medium">{formatTaxClassification()}</span>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Personal Information Review */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <IonIcon icon={personOutline} className="mr-2 text-secondary" />
              {t(
                "quickbooks.review.personalInfoSection",
                "Personal Information",
              )}
            </div>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => onBack && onBack()}
            >
              {t("common.edit", "Edit")}
            </IonButton>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("quickbooks.review.businessName", "Business Name")}:
              </span>
              <span className="font-medium">{data.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("quickbooks.review.taxId", "Tax ID")}:
              </span>
              <span className="font-medium">{maskTaxId(data.taxId || "")}</span>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Address Review */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <IonIcon icon={locationOutline} className="mr-2 text-secondary" />
              {t("quickbooks.review.addressSection", "Address Information")}
            </div>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => onBack && onBack()}
            >
              {t("common.edit", "Edit")}
            </IonButton>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("quickbooks.review.address", "Address")}:
              </span>
              <span className="font-medium text-right">{formatAddress()}</span>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Certifications Review */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <IonIcon
                icon={shieldCheckmarkOutline}
                className="mr-2 text-secondary"
              />
              {t("quickbooks.review.certificationsSection", "Certifications")}
            </div>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => onBack && onBack()}
            >
              {t("common.edit", "Edit")}
            </IonButton>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="space-y-2">
            {formatCertifications().map((certification, index) => (
              <div key={index} className="flex items-center">
                <IonIcon
                  icon={checkmarkCircleOutline}
                  className="text-green-600 mr-2"
                />
                <span className="text-sm">{certification}</span>
              </div>
            ))}

            {data.exemptPayeeCodes && data.exemptPayeeCodes.length > 0 && (
              <div className="flex justify-between mt-3">
                <span className="text-gray-600">
                  {t(
                    "quickbooks.review.exemptPayeeCodes",
                    "Exempt Payee Codes",
                  )}
                  :
                </span>
                <span className="font-medium">
                  {data.exemptPayeeCodes.join(", ")}
                </span>
              </div>
            )}

            {data.fatcaReportingCode && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {t(
                    "quickbooks.review.fatcaReportingCode",
                    "FATCA Reporting Code",
                  )}
                  :
                </span>
                <span className="font-medium">{data.fatcaReportingCode}</span>
              </div>
            )}
          </div>
        </IonCardContent>
      </IonCard>

      {/* Signature Review */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <IonIcon icon={createOutline} className="mr-2 text-secondary" />
              {t("quickbooks.review.signatureSection", "Digital Signature")}
            </div>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => onBack && onBack()}
            >
              {t("common.edit", "Edit")}
            </IonButton>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("quickbooks.review.signature", "Signature")}:
              </span>
              <span className="font-medium italic">{data.signature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("quickbooks.review.signatureDate", "Date")}:
              </span>
              <span className="font-medium">
                {data.signatureDate ? formatDate(data.signatureDate) : ""}
              </span>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Final Agreement */}
      <IonCard>
        <IonCardContent>
          <IonItem>
            <IonCheckbox
              checked={finalAgreement}
              onIonChange={(e) => handleFinalAgreementChange(e.detail.checked)}
              slot="start"
              className={errors.finalAgreement ? "ion-invalid" : ""}
            />
            <IonLabel className="ion-text-wrap ml-3">
              <p className="text-sm">
                {t(
                  "quickbooks.review.finalAgreement",
                  "I certify that I have reviewed all information above and confirm that it is accurate, complete, and true to the best of my knowledge. I understand that this information will be used for tax reporting purposes and that providing false information may result in penalties under federal law.",
                )}{" "}
                *
              </p>
            </IonLabel>
          </IonItem>
          {errors.finalAgreement && (
            <IonNote color="danger" className="block px-4 pt-2">
              {errors.finalAgreement}
            </IonNote>
          )}
        </IonCardContent>
      </IonCard>

      {/* Submission Notice */}
      <IonCard className="border-l-4 border-l-blue-500">
        <IonCardContent>
          <div className="flex items-start">
            <IonIcon
              icon={documentTextOutline}
              className="text-blue-500 mr-3 mt-1 flex-shrink-0"
            />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t(
                  "quickbooks.review.submissionNoticeTitle",
                  "What Happens Next?",
                )}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  {t(
                    "quickbooks.review.submissionStep1",
                    "• Your W-9 form will be securely submitted for review",
                  )}
                </li>
                <li>
                  {t(
                    "quickbooks.review.submissionStep2",
                    "• You will receive a confirmation email with your submission details",
                  )}
                </li>
                <li>
                  {t(
                    "quickbooks.review.submissionStep3",
                    "• The form will be processed within 1-2 business days",
                  )}
                </li>
                <li>
                  {t(
                    "quickbooks.review.submissionStep4",
                    "• Once approved, you will be able to receive payments",
                  )}
                </li>
              </ul>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <IonButton
          fill="outline"
          onClick={onBack}
          disabled={!canGoBack || isSubmitting}
        >
          <IonIcon icon={arrowBackOutline} slot="start" />
          {t("common.back", "Back")}
        </IonButton>

        <IonButton
          onClick={handleSubmit}
          disabled={!finalAgreement || isSubmitting}
          color="success"
        >
          {isSubmitting ? (
            <>
              <IonSpinner name="crescent" className="mr-2" />
              {t("quickbooks.review.submitting", "Submitting...")}
            </>
          ) : (
            <>
              <IonIcon icon={checkmarkCircleOutline} slot="start" />
              {t("quickbooks.review.submitForm", "Submit W-9 Form")}
            </>
          )}
        </IonButton>
      </div>
    </div>
  );
};

export default ReviewStep;
