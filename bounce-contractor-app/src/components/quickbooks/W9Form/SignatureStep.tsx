/**
 * SignatureStep Component
 *
 * Fifth step of the W-9 form wizard for digital signature capture.
 * Handles text-based signature input and date validation.
 */

import React, { useState, useEffect } from "react";
import {
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonNote,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonCheckbox,
} from "@ionic/react";
import {
  arrowForwardOutline,
  arrowBackOutline,
  createOutline,
  calendarOutline,
  documentTextOutline,
} from "ionicons/icons";
import { W9FormStepProps } from "../../../types/quickbooks.types";
import { useI18n } from "../../../hooks/common/useI18n";

/**
 * SignatureStep Component
 *
 * Features:
 * - Text-based signature input (typed name)
 * - Signature date with validation
 * - Legal disclaimer and terms
 * - Signature validation
 * - Clear and re-sign functionality
 * - Bilingual support
 */
export const SignatureStep: React.FC<W9FormStepProps> = ({
  data,
  onNext,
  onBack,
  canGoBack,
  isLastStep,
}) => {
  const { t } = useI18n();
  const [signature, setSignature] = useState("");
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString());
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (data.signature) {
      setSignature(data.signature);
    }
    if (data.signatureDate) {
      setSignatureDate(new Date(data.signatureDate).toISOString());
    }
  }, [data]);

  /**
   * Validate the current step
   */
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Signature validation
    if (!signature.trim()) {
      newErrors.signature = t(
        "quickbooks.validation.signatureRequired",
        "Signature is required",
      );
    } else if (signature.trim().length < 2) {
      newErrors.signature = t(
        "quickbooks.validation.signatureTooShort",
        "Signature must be at least 2 characters",
      );
    }

    // Date validation
    const selectedDate = new Date(signatureDate);
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    if (selectedDate > today) {
      newErrors.signatureDate = t(
        "quickbooks.validation.signatureDateFuture",
        "Signature date cannot be in the future",
      );
    } else if (selectedDate < thirtyDaysAgo) {
      newErrors.signatureDate = t(
        "quickbooks.validation.signatureDateTooOld",
        "Signature date cannot be more than 30 days ago",
      );
    }

    // Terms agreement validation
    if (!agreedToTerms) {
      newErrors.agreedToTerms = t(
        "quickbooks.validation.termsRequired",
        "You must agree to the terms and conditions",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle signature input
   */
  const handleSignatureChange = (value: string) => {
    setSignature(value);

    // Clear error when user starts typing
    if (errors.signature) {
      setErrors((prev) => ({
        ...prev,
        signature: "",
      }));
    }
  };

  /**
   * Handle signature date change
   */
  const handleSignatureDateChange = (value: string) => {
    setSignatureDate(value);

    // Clear error when user changes date
    if (errors.signatureDate) {
      setErrors((prev) => ({
        ...prev,
        signatureDate: "",
      }));
    }
  };

  /**
   * Handle terms agreement change
   */
  const handleTermsChange = (checked: boolean) => {
    setAgreedToTerms(checked);

    // Clear error when user agrees
    if (checked && errors.agreedToTerms) {
      setErrors((prev) => ({
        ...prev,
        agreedToTerms: "",
      }));
    }
  };

  /**
   * Clear signature
   */
  const handleClearSignature = () => {
    setSignature("");
    setSignatureDate(new Date().toISOString());
    setAgreedToTerms(false);
    setErrors({});
  };

  /**
   * Handle next button click
   */
  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    const stepData = {
      signature: signature.trim(),
      signatureDate: signatureDate,
    };

    onNext(stepData);
  };

  /**
   * Check if form is complete
   */
  const isFormComplete = () => {
    return signature.trim() && signatureDate && agreedToTerms;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon icon={createOutline} className="mr-2 text-primary" />
            {t("quickbooks.w9.signatureTitle", "Digital Signature")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p className="text-gray-600">
            {t(
              "quickbooks.w9.signatureDescription",
              "By signing this form, you certify that all information provided is true, correct, and complete. Your digital signature has the same legal effect as a handwritten signature.",
            )}
          </p>
        </IonCardContent>
      </IonCard>

      {/* Signature Input */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center text-base">
            <IonIcon icon={createOutline} className="mr-2 text-secondary" />
            {t("quickbooks.w9.signatureSection", "Your Signature")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {/* Signature Field */}
            <IonItem>
              <IonLabel position="stacked">
                {t("quickbooks.w9.signatureLabel", "Type Your Full Legal Name")}{" "}
                *
              </IonLabel>
              <IonInput
                value={signature}
                onIonInput={(e) => handleSignatureChange(e.detail.value!)}
                placeholder={t(
                  "quickbooks.w9.signaturePlaceholder",
                  "Enter your full legal name as your signature",
                )}
                className={errors.signature ? "ion-invalid" : ""}
                maxlength={100}
                clearInput
              />
              {errors.signature ? (
                <IonNote slot="error" color="danger">
                  {errors.signature}
                </IonNote>
              ) : (
                <IonNote slot="helper" color="medium">
                  {t(
                    "quickbooks.w9.signatureHelper",
                    "This will serve as your digital signature on the W-9 form",
                  )}
                </IonNote>
              )}
            </IonItem>

            {/* Signature Date */}
            <IonItem>
              <IonLabel position="stacked">
                {t("quickbooks.w9.signatureDateLabel", "Signature Date")} *
              </IonLabel>
              <IonDatetime
                value={signatureDate}
                onIonChange={(e) =>
                  handleSignatureDateChange(e.detail.value as string)
                }
                presentation="date"
                max={new Date().toISOString()}
                className={errors.signatureDate ? "ion-invalid" : ""}
              />
              {errors.signatureDate ? (
                <IonNote slot="error" color="danger">
                  {errors.signatureDate}
                </IonNote>
              ) : (
                <IonNote slot="helper" color="medium">
                  {t(
                    "quickbooks.w9.signatureDateHelper",
                    "Date when you are signing this form",
                  )}
                </IonNote>
              )}
            </IonItem>
          </IonList>

          {/* Signature Preview */}
          {signature && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {t("quickbooks.w9.signaturePreview", "Signature Preview")}
                </p>
                <div className="text-xl font-signature italic text-gray-900 mb-2">
                  {signature}
                </div>
                <p className="text-sm text-gray-500">
                  {t("quickbooks.w9.signedOn", "Signed on")}:{" "}
                  {formatDate(signatureDate)}
                </p>
              </div>
            </div>
          )}

          {/* Clear Signature Button */}
          {signature && (
            <div className="mt-4 text-center">
              <IonButton
                fill="outline"
                size="small"
                onClick={handleClearSignature}
                color="medium"
              >
                {t("quickbooks.w9.clearSignature", "Clear Signature")}
              </IonButton>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Legal Terms and Conditions */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center text-base">
            <IonIcon
              icon={documentTextOutline}
              className="mr-2 text-blue-600"
            />
            {t("quickbooks.w9.legalTerms", "Legal Terms & Conditions")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="space-y-4">
            {/* Legal Text */}
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
              <h4 className="font-medium mb-3">
                {t(
                  "quickbooks.w9.certificationStatement",
                  "Certification Statement",
                )}
              </h4>
              <p className="mb-3">
                {t(
                  "quickbooks.w9.certificationText1",
                  "Under penalties of perjury, I certify that:",
                )}
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>
                  {t(
                    "quickbooks.w9.certificationPoint1",
                    "The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me)",
                  )}
                </li>
                <li>
                  {t(
                    "quickbooks.w9.certificationPoint2",
                    "I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the Internal Revenue Service (IRS) that I am subject to backup withholding",
                  )}
                </li>
                <li>
                  {t(
                    "quickbooks.w9.certificationPoint3",
                    "I am a U.S. citizen or other U.S. person",
                  )}
                </li>
                <li>
                  {t(
                    "quickbooks.w9.certificationPoint4",
                    "The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct",
                  )}
                </li>
              </ul>
              <p className="text-xs text-gray-600">
                {t(
                  "quickbooks.w9.perjuryWarning",
                  "You must cross out item 2 above if you have been notified by the IRS that you are currently subject to backup withholding because you have failed to report all interest and dividends on your tax return.",
                )}
              </p>
            </div>

            {/* Terms Agreement Checkbox */}
            <IonItem>
              <IonCheckbox
                checked={agreedToTerms}
                onIonChange={(e) => handleTermsChange(e.detail.checked)}
                slot="start"
                className={errors.agreedToTerms ? "ion-invalid" : ""}
              />
              <IonLabel className="ion-text-wrap ml-3">
                <p className="text-sm">
                  {t(
                    "quickbooks.w9.termsAgreement",
                    "I have read and understand the certification statement above. I agree that my digital signature has the same legal effect as a handwritten signature, and I certify that all information provided on this form is true, correct, and complete.",
                  )}{" "}
                  *
                </p>
              </IonLabel>
            </IonItem>
            {errors.agreedToTerms && (
              <IonNote color="danger" className="block px-4">
                {errors.agreedToTerms}
              </IonNote>
            )}
          </div>
        </IonCardContent>
      </IonCard>

      {/* Security Notice */}
      <IonCard className="border-l-4 border-l-green-500">
        <IonCardContent>
          <div className="flex items-start">
            <IonIcon
              icon={createOutline}
              className="text-green-500 mr-3 mt-1 flex-shrink-0"
            />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t(
                  "quickbooks.w9.digitalSignatureNotice",
                  "Digital Signature Security",
                )}
              </h4>
              <p className="text-sm text-gray-600">
                {t(
                  "quickbooks.w9.digitalSignatureDesc",
                  "Your digital signature is legally binding and will be securely stored with your W-9 form. This signature certifies that all information provided is accurate and complete under penalty of perjury.",
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

        <IonButton onClick={handleNext} disabled={!isFormComplete()}>
          {t("common.next", "Next")}
          <IonIcon icon={arrowForwardOutline} slot="end" />
        </IonButton>
      </div>
    </div>
  );
};

export default SignatureStep;
