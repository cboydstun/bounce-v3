/**
 * RegistrationWizard Component
 *
 * Multi-step registration process for contractors including:
 * 1. Account Creation (basic info)
 * 2. Professional Profile (business info, skills)
 * 3. Tax Information (W-9 form - optional)
 */

import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonProgressBar,
  IonButtons,
  IonBackButton,
  IonToast,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useI18n } from "../../hooks/common/useI18n";
import { useToast, getToastColor } from "../../hooks/common/useToast";
import { useAuthStore } from "../../store/authStore";
import { RegisterData, ProfileUpdateData } from "../../types/auth.types";

// Step Components
import AccountStep from "./steps/AccountStep";
import ProfileStep from "./steps/ProfileStep";
import TaxInfoStep from "./steps/TaxInfoStep";

// Types
import { RegisterFormData } from "../../types/auth.types";
import { W9FormData } from "../../types/quickbooks.types";

interface RegistrationStepConfig {
  key: string;
  title: string;
  titleKey: string;
  component: React.ComponentType<any>;
  optional?: boolean;
}

const REGISTRATION_STEPS: RegistrationStepConfig[] = [
  {
    key: "account",
    title: "Create Account",
    titleKey: "registration.steps.account",
    component: AccountStep,
  },
  {
    key: "profile",
    title: "Professional Info",
    titleKey: "registration.steps.profile",
    component: ProfileStep,
  },
  {
    key: "tax",
    title: "Tax Information",
    titleKey: "registration.steps.tax",
    component: TaxInfoStep,
    optional: true,
  },
];

interface RegistrationData extends RegisterFormData {
  // Extended fields for professional profile
  businessName?: string;
  profileImage?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  };
  // W-9 tax information
  w9Data?: Partial<W9FormData>;
  w9Completed?: boolean;
}

export const RegistrationWizard: React.FC = () => {
  const history = useHistory();
  const { t } = useI18n();
  const { toastState, showToast, hideToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [registrationData, setRegistrationData] = useState<
    Partial<RegistrationData>
  >({
    skills: ["delivery", "setup"], // Default skills
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  /**
   * Get current step configuration
   */
  const getCurrentStep = (): RegistrationStepConfig => {
    return REGISTRATION_STEPS[currentStep];
  };

  /**
   * Calculate progress percentage
   */
  const getProgress = (): number => {
    return (currentStep + 1) / REGISTRATION_STEPS.length;
  };

  /**
   * Handle step navigation forward
   */
  const handleNext = (stepData: Partial<RegistrationData>) => {
    const updatedData = { ...registrationData, ...stepData };
    setRegistrationData(updatedData);

    if (currentStep < REGISTRATION_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step - complete registration
      handleCompleteRegistration(updatedData);
    }
  };

  /**
   * Handle step navigation backward
   */
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      // Go back to login
      history.push("/login");
    }
  };

  /**
   * Handle skipping optional steps
   */
  const handleSkip = () => {
    const currentStepConfig = getCurrentStep();
    if (currentStepConfig.optional) {
      if (currentStep < REGISTRATION_STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // Last step - complete registration
        handleCompleteRegistration(registrationData);
      }
    }
  };

  /**
   * Complete the registration process
   */
  const handleCompleteRegistration = async (
    finalData: Partial<RegistrationData>,
  ) => {
    try {
      // Step 1: Basic registration data for auth endpoint
      const registrationApiData: RegisterData = {
        name: finalData.name || "",
        email: finalData.email || "",
        phone: finalData.phone || "",
        password: finalData.password || "",
        skills: finalData.skills || ["delivery", "setup"],
      };

      // Register with auth store
      const register = useAuthStore.getState().register;
      await register(registrationApiData);

      // Step 2: Update profile with additional data if registration was successful
      if (finalData.businessName || finalData.emergencyContact) {
        try {
          // Prepare profile update data
          const profileUpdateData: ProfileUpdateData = {};

          if (finalData.businessName) {
            profileUpdateData.businessName = finalData.businessName;
          }

          if (finalData.emergencyContact) {
            profileUpdateData.emergencyContact = finalData.emergencyContact;
          }

          // TODO: Call profile update API endpoint
          // This would be implemented when the profile service is available
          console.log("Profile data to update:", profileUpdateData);
        } catch (profileError) {
          console.warn(
            "Profile update failed, but registration succeeded:",
            profileError,
          );
          // Don't fail the entire registration if profile update fails
        }
      }

      showToast(
        t(
          "registration.success",
          "Registration successful! Please check your email to verify your account.",
        ),
        "success",
      );

      // TODO: Save W-9 data if provided
      if (finalData.w9Data && finalData.w9Completed) {
        console.log("W-9 data to save:", finalData.w9Data);
        // This would be saved via the QuickBooks service
      }

      // Redirect to login after successful registration
      setTimeout(() => {
        history.replace("/login");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      showToast(
        t("registration.error", "Registration failed. Please try again."),
        "error",
      );
    }
  };

  // Get current step component
  const CurrentStepComponent = getCurrentStep().component;
  const stepConfig = getCurrentStep();
  const stepTitle = t(stepConfig.titleKey, stepConfig.title);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>{t("registration.title", "Join Our Team")}</IonTitle>
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
                {t("registration.stepIndicator", {
                  current: currentStep + 1,
                  total: REGISTRATION_STEPS.length,
                  defaultValue: `Step ${currentStep + 1} of ${REGISTRATION_STEPS.length}`,
                })}
                {stepConfig.optional && (
                  <span className="ml-2 text-blue-600">
                    ({t("common.optional")})
                  </span>
                )}
              </p>
            </div>
            {stepConfig.optional && (
              <button
                onClick={handleSkip}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {t("common.skip", "Skip for now")}
              </button>
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4">
          <CurrentStepComponent
            data={registrationData}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={stepConfig.optional ? handleSkip : undefined}
            canGoBack={currentStep > 0}
            isLastStep={currentStep === REGISTRATION_STEPS.length - 1}
            isOptional={stepConfig.optional}
          />
        </div>

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

export default RegistrationWizard;
