/**
 * PersonalInfoStep Component
 *
 * Second step of the W-9 form wizard for collecting personal/business
 * information including business name and tax ID with secure handling.
 */

import React, { useState, useEffect } from "react";
import {
  IonItem,
  IonLabel,
  IonInput,
  IonNote,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
} from "@ionic/react";
import {
  arrowForwardOutline,
  arrowBackOutline,
  personOutline,
  businessOutline,
} from "ionicons/icons";
import { W9FormStepProps } from "../../../types/quickbooks.types";
import { useI18n } from "../../../hooks/common/useI18n";
import TaxIdInput from "../TaxIdInput";
import { quickbooksService } from "../../../services/quickbooks/quickbooksService";

/**
 * PersonalInfoStep Component
 *
 * Features:
 * - Business name input with validation
 * - Secure tax ID input with masking
 * - Real-time validation feedback
 * - Auto-population from user profile
 * - Bilingual support
 */
export const PersonalInfoStep: React.FC<W9FormStepProps> = ({
  data,
  onNext,
  onBack,
  canGoBack,
  isLastStep,
}) => {
  const { t } = useI18n();
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (data.businessName) {
      setBusinessName(data.businessName);
    }
    if (data.taxId) {
      setTaxId(data.taxId);
    }
  }, [data]);

  /**
   * Validate the current step
   */
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Business name validation
    if (!businessName.trim()) {
      newErrors.businessName = t(
        "quickbooks.validation.businessNameRequired",
        "Business name is required",
      );
    } else if (businessName.trim().length < 2) {
      newErrors.businessName = t(
        "quickbooks.validation.businessNameTooShort",
        "Business name must be at least 2 characters",
      );
    } else if (businessName.trim().length > 100) {
      newErrors.businessName = t(
        "quickbooks.validation.businessNameTooLong",
        "Business name must be less than 100 characters",
      );
    }

    // Tax ID validation
    if (!taxId.trim()) {
      newErrors.taxId = t(
        "quickbooks.validation.taxIdRequired",
        "Tax ID is required",
      );
    } else {
      const taxIdValidation = quickbooksService.validateTaxId(taxId);
      if (!taxIdValidation.isValid) {
        newErrors.taxId = t(
          "quickbooks.validation.taxIdInvalid",
          "Invalid tax ID format. Use XXX-XX-XXXX (SSN) or XX-XXXXXXX (EIN)",
        );
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle business name input
   */
  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);

    // Clear error when user starts typing
    if (errors.businessName) {
      setErrors((prev) => ({ ...prev, businessName: "" }));
    }
  };

  /**
   * Handle tax ID input
   */
  const handleTaxIdChange = (value: string) => {
    setTaxId(value);

    // Clear error when user starts typing
    if (errors.taxId) {
      setErrors((prev) => ({ ...prev, taxId: "" }));
    }
  };

  /**
   * Handle next button click
   */
  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    const stepData = {
      businessName: businessName.trim(),
      taxId: taxId.trim(),
    };

    onNext(stepData);
  };

  /**
   * Get business name helper text
   */
  const getBusinessNameHelper = (): string => {
    if (data.taxClassification === "individual") {
      return t(
        "quickbooks.w9.businessNameIndividualHelper",
        "For individuals, enter your full legal name as it appears on your tax return",
      );
    }

    return t(
      "quickbooks.w9.businessNameHelper",
      "Enter the legal name of your business as registered with tax authorities",
    );
  };

  /**
   * Get tax ID helper text based on classification
   */
  const getTaxIdHelper = (): string => {
    if (data.taxClassification === "individual") {
      return t(
        "quickbooks.w9.taxIdIndividualHelper",
        "Enter your Social Security Number (SSN) in XXX-XX-XXXX format",
      );
    }

    return t(
      "quickbooks.w9.taxIdBusinessHelper",
      "Enter your Employer Identification Number (EIN) in XX-XXXXXXX format or SSN in XXX-XX-XXXX format",
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon icon={personOutline} className="mr-2 text-primary" />
            {t(
              "quickbooks.w9.personalInfoTitle",
              "Personal & Business Information",
            )}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p className="text-gray-600">
            {t(
              "quickbooks.w9.personalInfoDescription",
              "Provide your legal business name and tax identification number. This information must match your tax records.",
            )}
          </p>
        </IonCardContent>
      </IonCard>

      {/* Business Name */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center text-base">
            <IonIcon icon={businessOutline} className="mr-2 text-secondary" />
            {t("quickbooks.w9.businessNameSection", "Business Name")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            <IonItem>
              <IonLabel position="stacked">
                {data.taxClassification === "individual"
                  ? t("quickbooks.w9.legalNameLabel", "Legal Name")
                  : t("quickbooks.w9.businessNameLabel", "Business Name")}{" "}
                *
              </IonLabel>
              <IonInput
                value={businessName}
                onIonInput={(e) => handleBusinessNameChange(e.detail.value!)}
                placeholder={
                  data.taxClassification === "individual"
                    ? t(
                        "quickbooks.w9.legalNamePlaceholder",
                        "Enter your full legal name",
                      )
                    : t(
                        "quickbooks.w9.businessNamePlaceholder",
                        "Enter your business name",
                      )
                }
                className={errors.businessName ? "ion-invalid" : ""}
                maxlength={100}
                clearInput
              />
              {errors.businessName ? (
                <IonNote slot="error" color="danger">
                  {errors.businessName}
                </IonNote>
              ) : (
                <IonNote slot="helper" color="medium">
                  {getBusinessNameHelper()}
                </IonNote>
              )}
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* Tax ID */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center text-base">
            <IonIcon icon={personOutline} className="mr-2 text-secondary" />
            {t("quickbooks.w9.taxIdSection", "Tax Identification")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            <TaxIdInput
              value={taxId}
              onIonInput={handleTaxIdChange}
              label={
                data.taxClassification === "individual"
                  ? t("quickbooks.w9.ssnLabel", "Social Security Number (SSN)")
                  : t("quickbooks.w9.taxIdLabel", "Tax ID (SSN or EIN)")
              }
              placeholder={
                data.taxClassification === "individual"
                  ? "XXX-XX-XXXX"
                  : "XXX-XX-XXXX or XX-XXXXXXX"
              }
              required
              error={errors.taxId}
            />
          </IonList>

          {/* Additional helper text */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <IonIcon icon={personOutline} className="mr-1" />
              {getTaxIdHelper()}
            </p>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Security Notice */}
      <IonCard className="border-l-4 border-l-green-500">
        <IonCardContent>
          <div className="flex items-start">
            <IonIcon
              icon={personOutline}
              className="text-green-500 mr-3 mt-1 flex-shrink-0"
            />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t("quickbooks.w9.securityNoticeTitle", "Security & Privacy")}
              </h4>
              <p className="text-sm text-gray-600">
                {t(
                  "quickbooks.w9.securityNotice",
                  "Your tax identification number is encrypted before transmission and stored securely. This information is only used for tax reporting purposes as required by law.",
                )}
              </p>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <IonButton fill="outline" onClick={onBack} disabled={!canGoBack}>
          <IonIcon icon={arrowBackOutline} slot="start" />
          {t("common.back", "Back")}
        </IonButton>

        <IonButton
          onClick={handleNext}
          disabled={!businessName.trim() || !taxId.trim()}
        >
          {t("common.next", "Next")}
          <IonIcon icon={arrowForwardOutline} slot="end" />
        </IonButton>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
