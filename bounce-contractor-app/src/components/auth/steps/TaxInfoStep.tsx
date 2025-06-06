/**
 * TaxInfoStep Component
 *
 * Third step of registration wizard - tax information (W-9 form)
 * Optional step that can be completed now or later
 */

import React, { useState } from "react";
import {
  IonButton,
  IonSpinner,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
} from "@ionic/react";
import {
  arrowForwardOutline,
  arrowBackOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  timeOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useI18n } from "../../../hooks/common/useI18n";
import { W9FormData } from "../../../types/quickbooks.types";

interface TaxInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
  onSkip?: () => void;
  canGoBack?: boolean;
  isLastStep?: boolean;
  isOptional?: boolean;
}

export const TaxInfoStep: React.FC<TaxInfoStepProps> = ({
  data,
  onNext,
  onBack,
  onSkip,
  canGoBack,
  isLastStep,
  isOptional,
}) => {
  const { t } = useI18n();
  const history = useHistory();
  const [w9FormData, setW9FormData] = useState<Partial<W9FormData>>(
    data.w9Data || {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSkipAlert, setShowSkipAlert] = useState(false);

  /**
   * Handle proceeding without W-9
   */
  const handleNext = (stepData: any = {}) => {
    setIsSubmitting(true);
    try {
      onNext({
        w9Data: w9FormData,
        w9Completed: !!stepData.w9Completed,
        ...stepData,
      });
    } catch (error) {
      console.error("Tax info step error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle skip confirmation
   */
  const handleSkipConfirm = () => {
    setShowSkipAlert(false);
    if (onSkip) {
      onSkip();
    } else {
      handleNext({ w9Completed: false });
    }
  };

  /**
   * Handle W-9 form navigation
   */
  const handleStartW9Form = () => {
    // For now, we'll skip the W-9 form and allow completion later
    // In a full implementation, this would navigate to the W-9 form
    // and return to complete the registration
    handleNext({ w9Completed: false, w9Skipped: true });
  };

  /**
   * Check if W-9 is partially completed
   */
  const isW9PartiallyCompleted = (): boolean => {
    return !!(
      w9FormData.businessName ||
      w9FormData.taxId ||
      w9FormData.taxClassification
    );
  };

  /**
   * Check if W-9 is fully completed
   */
  const isW9Completed = (): boolean => {
    return !!(
      w9FormData.businessName &&
      w9FormData.taxId &&
      w9FormData.taxClassification &&
      w9FormData.address &&
      w9FormData.certifications &&
      w9FormData.signature
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <IonIcon
          icon={documentTextOutline}
          className="text-4xl text-blue-600 mb-3"
        />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("registration.tax.title", "Tax Information")}
        </h1>
        <p className="text-gray-600">
          {t(
            "registration.tax.subtitle",
            "Complete your W-9 form for tax compliance",
          )}
        </p>
      </div>

      {/* Information Card */}
      <IonCard className="mb-6">
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon
              icon={informationCircleOutline}
              className="mr-2 text-blue-600"
            />
            {t("registration.tax.whyNeeded", "Why is this needed?")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              {t(
                "registration.tax.explanation1",
                "The W-9 form is required for tax reporting purposes when you earn $600 or more in a calendar year.",
              )}
            </p>
            <p>
              {t(
                "registration.tax.explanation2",
                "Completing this now will ensure faster payment processing and compliance with tax regulations.",
              )}
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mt-4">
              <p className="text-blue-800 font-medium">
                {t(
                  "registration.tax.optional",
                  "This step is optional during registration - you can complete it anytime before your first payment.",
                )}
              </p>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Current Status */}
      {isW9Completed() ? (
        <IonCard color="success" className="mb-6">
          <IonCardContent>
            <div className="flex items-center">
              <IonIcon
                icon={checkmarkCircleOutline}
                className="text-2xl mr-3"
              />
              <div>
                <h3 className="font-semibold text-white">
                  {t("registration.tax.completed", "W-9 Form Completed")}
                </h3>
                <p className="text-green-100 text-sm">
                  {t(
                    "registration.tax.completedMessage",
                    "Your tax information is ready for processing",
                  )}
                </p>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      ) : isW9PartiallyCompleted() ? (
        <IonCard color="warning" className="mb-6">
          <IonCardContent>
            <div className="flex items-center">
              <IonIcon icon={timeOutline} className="text-2xl mr-3" />
              <div>
                <h3 className="font-semibold text-white">
                  {t("registration.tax.inProgress", "W-9 Form In Progress")}
                </h3>
                <p className="text-orange-100 text-sm">
                  {t(
                    "registration.tax.inProgressMessage",
                    "You have started but not completed your W-9 form",
                  )}
                </p>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      ) : null}

      {/* Action Buttons */}
      <div className="space-y-4">
        {isW9Completed() ? (
          <IonButton
            expand="block"
            fill="outline"
            onClick={handleStartW9Form}
            className="mb-4"
          >
            <IonIcon icon={documentTextOutline} slot="start" />
            {t("registration.tax.review", "Review W-9 Form")}
          </IonButton>
        ) : (
          <IonButton
            expand="block"
            onClick={handleStartW9Form}
            className="btn-primary mb-4"
          >
            <IonIcon icon={documentTextOutline} slot="start" />
            {isW9PartiallyCompleted()
              ? t("registration.tax.continue", "Continue W-9 Form")
              : t("registration.tax.start", "Complete W-9 Form Now")}
          </IonButton>
        )}

        {isOptional && (
          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            onClick={() => setShowSkipAlert(true)}
          >
            <IonIcon icon={timeOutline} slot="start" />
            {t("registration.tax.completeLater", "Complete Later")}
          </IonButton>
        )}
      </div>

      {/* Benefits List */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">
          {t("registration.tax.benefits", "Benefits of completing now:")}
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <IonIcon
              icon={checkmarkCircleOutline}
              className="text-green-600 mr-2 mt-0.5 flex-shrink-0"
            />
            {t("registration.tax.benefit1", "Faster payment processing")}
          </li>
          <li className="flex items-start">
            <IonIcon
              icon={checkmarkCircleOutline}
              className="text-green-600 mr-2 mt-0.5 flex-shrink-0"
            />
            {t("registration.tax.benefit2", "Access to higher-paying tasks")}
          </li>
          <li className="flex items-start">
            <IonIcon
              icon={checkmarkCircleOutline}
              className="text-green-600 mr-2 mt-0.5 flex-shrink-0"
            />
            {t("registration.tax.benefit3", "Tax compliance ready")}
          </li>
          <li className="flex items-start">
            <IonIcon
              icon={checkmarkCircleOutline}
              className="text-green-600 mr-2 mt-0.5 flex-shrink-0"
            />
            {t("registration.tax.benefit4", "Professional profile completion")}
          </li>
        </ul>
      </div>

      {/* Navigation */}
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
          onClick={() => handleNext()}
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? (
            <>
              <IonSpinner name="crescent" className="mr-2" />
              {t("common.processing", "Processing...")}
            </>
          ) : (
            <>
              {isLastStep
                ? t("registration.tax.complete", "Complete Registration")
                : t("common.continue", "Continue")}
              <IonIcon icon={arrowForwardOutline} slot="end" />
            </>
          )}
        </IonButton>
      </div>

      {/* Skip Confirmation Alert */}
      <IonAlert
        isOpen={showSkipAlert}
        onDidDismiss={() => setShowSkipAlert(false)}
        header={t("registration.tax.skipTitle", "Skip Tax Information?")}
        message={t(
          "registration.tax.skipMessage",
          "You can complete your W-9 form later from your profile. You'll need to complete it before receiving payments over $600.",
        )}
        buttons={[
          {
            text: t("common.cancel", "Cancel"),
            role: "cancel",
          },
          {
            text: t("registration.tax.skipConfirm", "Skip for Now"),
            handler: handleSkipConfirm,
          },
        ]}
      />
    </div>
  );
};

export default TaxInfoStep;
