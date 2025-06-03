/**
 * CertificationsStep Component
 *
 * Fourth step of the W-9 form wizard for tax certifications and declarations.
 * Handles all required IRS certifications and optional exemption codes.
 */

import React, { useState, useEffect } from "react";
import {
  IonItem,
  IonLabel,
  IonCheckbox,
  IonInput,
  IonNote,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonAccordion,
  IonAccordionGroup,
} from "@ionic/react";
import {
  arrowForwardOutline,
  arrowBackOutline,
  shieldCheckmarkOutline,
  informationCircleOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { W9FormStepProps } from "../../../types/quickbooks.types";
import { useI18n } from "../../../hooks/common/useI18n";

/**
 * CertificationsStep Component
 *
 * Features:
 * - Required tax certifications with validation
 * - Optional exempt payee codes
 * - FATCA reporting code
 * - Educational tooltips and explanations
 * - Validation for required certifications
 * - Bilingual support
 */
export const CertificationsStep: React.FC<W9FormStepProps> = ({
  data,
  onNext,
  onBack,
  canGoBack,
  isLastStep,
}) => {
  const { t } = useI18n();
  const [certifications, setCertifications] = useState({
    taxIdCorrect: false,
    notSubjectToBackupWithholding: false,
    usCitizenOrResident: false,
    fatcaExempt: false,
  });
  const [exemptPayeeCodes, setExemptPayeeCodes] = useState("");
  const [fatcaReportingCode, setFatcaReportingCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (data.certifications) {
      setCertifications({
        taxIdCorrect: data.certifications.taxIdCorrect || false,
        notSubjectToBackupWithholding:
          data.certifications.notSubjectToBackupWithholding || false,
        usCitizenOrResident: data.certifications.usCitizenOrResident || false,
        fatcaExempt: data.certifications.fatcaExempt || false,
      });
    }
    if (data.exemptPayeeCodes) {
      setExemptPayeeCodes(data.exemptPayeeCodes.join(", "));
    }
    if (data.fatcaReportingCode) {
      setFatcaReportingCode(data.fatcaReportingCode);
    }
  }, [data]);

  /**
   * Validate the current step
   */
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required certifications
    if (!certifications.taxIdCorrect) {
      newErrors.taxIdCorrect = t(
        "quickbooks.validation.taxIdCertificationRequired",
        "You must certify that your tax ID is correct",
      );
    }

    if (!certifications.notSubjectToBackupWithholding) {
      newErrors.notSubjectToBackupWithholding = t(
        "quickbooks.validation.backupWithholdingRequired",
        "You must certify your backup withholding status",
      );
    }

    if (!certifications.usCitizenOrResident) {
      newErrors.usCitizenOrResident = t(
        "quickbooks.validation.citizenshipRequired",
        "You must certify your US citizenship or residency status",
      );
    }

    // Validate exempt payee codes format if provided
    if (exemptPayeeCodes.trim()) {
      const codes = exemptPayeeCodes.split(",").map((code) => code.trim());
      const invalidCodes = codes.filter(
        (code) => !/^[1-9]$|^1[0-3]$/.test(code),
      );
      if (invalidCodes.length > 0) {
        newErrors.exemptPayeeCodes = t(
          "quickbooks.validation.exemptPayeeCodesInvalid",
          "Exempt payee codes must be numbers 1-13",
        );
      }
    }

    // Validate FATCA reporting code format if provided
    if (fatcaReportingCode.trim()) {
      if (!/^[A-Z]$/.test(fatcaReportingCode.trim())) {
        newErrors.fatcaReportingCode = t(
          "quickbooks.validation.fatcaCodeInvalid",
          "FATCA reporting code must be a single letter A-Z",
        );
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle certification checkbox changes
   */
  const handleCertificationChange = (
    field: keyof typeof certifications,
    checked: boolean,
  ) => {
    setCertifications((prev) => ({
      ...prev,
      [field]: checked,
    }));

    // Clear error when user checks the box
    if (checked && errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  /**
   * Handle exempt payee codes input
   */
  const handleExemptPayeeCodesChange = (value: string) => {
    setExemptPayeeCodes(value);

    // Clear error when user starts typing
    if (errors.exemptPayeeCodes) {
      setErrors((prev) => ({
        ...prev,
        exemptPayeeCodes: "",
      }));
    }
  };

  /**
   * Handle FATCA reporting code input
   */
  const handleFatcaReportingCodeChange = (value: string) => {
    // Convert to uppercase and limit to 1 character
    const formatted = value.toUpperCase().slice(0, 1);
    setFatcaReportingCode(formatted);

    // Clear error when user starts typing
    if (errors.fatcaReportingCode) {
      setErrors((prev) => ({
        ...prev,
        fatcaReportingCode: "",
      }));
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
      certifications,
      exemptPayeeCodes: exemptPayeeCodes.trim()
        ? exemptPayeeCodes
            .split(",")
            .map((code) => code.trim())
            .filter(Boolean)
        : undefined,
      fatcaReportingCode: fatcaReportingCode.trim() || undefined,
    };

    onNext(stepData);
  };

  /**
   * Check if required certifications are complete
   */
  const areRequiredCertificationsComplete = () => {
    return (
      certifications.taxIdCorrect &&
      certifications.notSubjectToBackupWithholding &&
      certifications.usCitizenOrResident
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon
              icon={shieldCheckmarkOutline}
              className="mr-2 text-primary"
            />
            {t("quickbooks.w9.certificationsTitle", "Tax Certifications")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p className="text-gray-600">
            {t(
              "quickbooks.w9.certificationsDescription",
              "The following certifications are required by the IRS. Please read each statement carefully and check the boxes to certify your compliance.",
            )}
          </p>
        </IonCardContent>
      </IonCard>

      {/* Required Certifications */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center text-base">
            <IonIcon
              icon={shieldCheckmarkOutline}
              className="mr-2 text-red-600"
            />
            {t(
              "quickbooks.w9.requiredCertifications",
              "Required Certifications",
            )}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {/* Tax ID Correctness */}
            <IonItem>
              <IonCheckbox
                checked={certifications.taxIdCorrect}
                onIonChange={(e) =>
                  handleCertificationChange("taxIdCorrect", e.detail.checked)
                }
                slot="start"
                className={errors.taxIdCorrect ? "ion-invalid" : ""}
              />
              <IonLabel className="ion-text-wrap ml-3">
                <h3 className="font-medium">
                  {t("quickbooks.w9.taxIdCorrectLabel", "Tax ID Certification")}{" "}
                  *
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t(
                    "quickbooks.w9.taxIdCorrectDesc",
                    "I certify that the tax identification number shown on this form is my correct taxpayer identification number.",
                  )}
                </p>
              </IonLabel>
            </IonItem>
            {errors.taxIdCorrect && (
              <IonNote color="danger" className="block px-4 pb-2">
                {errors.taxIdCorrect}
              </IonNote>
            )}

            {/* Backup Withholding */}
            <IonItem>
              <IonCheckbox
                checked={certifications.notSubjectToBackupWithholding}
                onIonChange={(e) =>
                  handleCertificationChange(
                    "notSubjectToBackupWithholding",
                    e.detail.checked,
                  )
                }
                slot="start"
                className={
                  errors.notSubjectToBackupWithholding ? "ion-invalid" : ""
                }
              />
              <IonLabel className="ion-text-wrap ml-3">
                <h3 className="font-medium">
                  {t(
                    "quickbooks.w9.backupWithholdingLabel",
                    "Backup Withholding Certification",
                  )}{" "}
                  *
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t(
                    "quickbooks.w9.backupWithholdingDesc",
                    "I certify that I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the IRS that I am subject to backup withholding.",
                  )}
                </p>
              </IonLabel>
            </IonItem>
            {errors.notSubjectToBackupWithholding && (
              <IonNote color="danger" className="block px-4 pb-2">
                {errors.notSubjectToBackupWithholding}
              </IonNote>
            )}

            {/* US Citizenship/Residency */}
            <IonItem>
              <IonCheckbox
                checked={certifications.usCitizenOrResident}
                onIonChange={(e) =>
                  handleCertificationChange(
                    "usCitizenOrResident",
                    e.detail.checked,
                  )
                }
                slot="start"
                className={errors.usCitizenOrResident ? "ion-invalid" : ""}
              />
              <IonLabel className="ion-text-wrap ml-3">
                <h3 className="font-medium">
                  {t(
                    "quickbooks.w9.citizenshipLabel",
                    "US Citizenship/Residency Certification",
                  )}{" "}
                  *
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t(
                    "quickbooks.w9.citizenshipDesc",
                    "I certify that I am a U.S. citizen or other U.S. person (including a U.S. resident alien).",
                  )}
                </p>
              </IonLabel>
            </IonItem>
            {errors.usCitizenOrResident && (
              <IonNote color="danger" className="block px-4 pb-2">
                {errors.usCitizenOrResident}
              </IonNote>
            )}
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* Optional Certifications and Codes */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center text-base">
            <IonIcon
              icon={informationCircleOutline}
              className="mr-2 text-blue-600"
            />
            {t("quickbooks.w9.optionalFields", "Optional Fields")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {/* FATCA Exemption */}
            <IonItem>
              <IonCheckbox
                checked={certifications.fatcaExempt}
                onIonChange={(e) =>
                  handleCertificationChange("fatcaExempt", e.detail.checked)
                }
                slot="start"
              />
              <IonLabel className="ion-text-wrap ml-3">
                <h3 className="font-medium">
                  {t("quickbooks.w9.fatcaExemptLabel", "FATCA Exemption")}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t(
                    "quickbooks.w9.fatcaExemptDesc",
                    "I am exempt from FATCA reporting (Foreign Account Tax Compliance Act).",
                  )}
                </p>
              </IonLabel>
            </IonItem>

            {/* Exempt Payee Codes */}
            <IonItem>
              <IonLabel position="stacked">
                {t(
                  "quickbooks.w9.exemptPayeeCodesLabel",
                  "Exempt Payee Codes (Optional)",
                )}
              </IonLabel>
              <IonInput
                value={exemptPayeeCodes}
                onIonInput={(e) =>
                  handleExemptPayeeCodesChange(e.detail.value!)
                }
                placeholder={t(
                  "quickbooks.w9.exemptPayeeCodesPlaceholder",
                  "e.g., 1, 2, 5",
                )}
                className={errors.exemptPayeeCodes ? "ion-invalid" : ""}
                maxlength={50}
              />
              {errors.exemptPayeeCodes ? (
                <IonNote slot="error" color="danger">
                  {errors.exemptPayeeCodes}
                </IonNote>
              ) : (
                <IonNote slot="helper" color="medium">
                  {t(
                    "quickbooks.w9.exemptPayeeCodesHelper",
                    "Enter codes 1-13, separated by commas if multiple",
                  )}
                </IonNote>
              )}
            </IonItem>

            {/* FATCA Reporting Code */}
            <IonItem>
              <IonLabel position="stacked">
                {t(
                  "quickbooks.w9.fatcaReportingCodeLabel",
                  "FATCA Reporting Code (Optional)",
                )}
              </IonLabel>
              <IonInput
                value={fatcaReportingCode}
                onIonInput={(e) =>
                  handleFatcaReportingCodeChange(e.detail.value!)
                }
                placeholder={t(
                  "quickbooks.w9.fatcaReportingCodePlaceholder",
                  "A-Z",
                )}
                className={errors.fatcaReportingCode ? "ion-invalid" : ""}
                maxlength={1}
              />
              {errors.fatcaReportingCode ? (
                <IonNote slot="error" color="danger">
                  {errors.fatcaReportingCode}
                </IonNote>
              ) : (
                <IonNote slot="helper" color="medium">
                  {t(
                    "quickbooks.w9.fatcaReportingCodeHelper",
                    "Single letter code if applicable",
                  )}
                </IonNote>
              )}
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* Help Information */}
      <IonAccordionGroup>
        <IonAccordion value="help">
          <IonItem slot="header">
            <IonIcon icon={helpCircleOutline} className="mr-2 text-blue-600" />
            <IonLabel>
              {t(
                "quickbooks.w9.needHelp",
                "Need Help Understanding These Certifications?",
              )}
            </IonLabel>
          </IonItem>
          <div slot="content" className="p-4 bg-gray-50">
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {t(
                    "quickbooks.w9.backupWithholdingHelp",
                    "Backup Withholding",
                  )}
                </h4>
                <p className="text-gray-600">
                  {t(
                    "quickbooks.w9.backupWithholdingHelpDesc",
                    "Backup withholding is a type of tax on income payments. Most people are not subject to backup withholding unless they have been notified by the IRS.",
                  )}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {t(
                    "quickbooks.w9.fatcaHelp",
                    "FATCA (Foreign Account Tax Compliance Act)",
                  )}
                </h4>
                <p className="text-gray-600">
                  {t(
                    "quickbooks.w9.fatcaHelpDesc",
                    "FATCA requires foreign financial institutions to report information about financial accounts held by US taxpayers. Most domestic contractors are exempt.",
                  )}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {t("quickbooks.w9.exemptPayeeHelp", "Exempt Payee Codes")}
                </h4>
                <p className="text-gray-600">
                  {t(
                    "quickbooks.w9.exemptPayeeHelpDesc",
                    "These codes apply to specific types of organizations or individuals who are exempt from backup withholding. Most individual contractors do not need to enter any codes.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </IonAccordion>
      </IonAccordionGroup>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <IonButton fill="outline" onClick={onBack} disabled={!canGoBack}>
          <IonIcon icon={arrowBackOutline} slot="start" />
          {t("common.back", "Back")}
        </IonButton>

        <IonButton
          onClick={handleNext}
          disabled={!areRequiredCertificationsComplete()}
        >
          {t("common.next", "Next")}
          <IonIcon icon={arrowForwardOutline} slot="end" />
        </IonButton>
      </div>
    </div>
  );
};

export default CertificationsStep;
