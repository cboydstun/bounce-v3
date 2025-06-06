/**
 * AccountStep Component
 *
 * First step of registration wizard - basic account creation
 * Collects: name, email, phone, password, terms agreement
 */

import React, { useState } from "react";
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonText,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import {
  arrowForwardOutline,
  personOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
} from "ionicons/icons";
import { useI18n } from "../../../hooks/common/useI18n";

interface AccountStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  isLastStep?: boolean;
}

interface AccountFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export const AccountStep: React.FC<AccountStepProps> = ({
  data,
  onNext,
  onBack,
  canGoBack,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<AccountFormData>({
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    password: data.password || "",
    confirmPassword: data.confirmPassword || "",
    agreeToTerms: data.agreeToTerms || false,
    agreeToPrivacy: data.agreeToPrivacy || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Update form field
   */
  const updateField = (
    field: keyof AccountFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t(
        "validation.nameRequired",
        "Please enter your full name",
      );
    }

    if (!formData.email.trim()) {
      newErrors.email = t(
        "validation.emailRequired",
        "Please enter your email address",
      );
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t(
        "validation.emailInvalid",
        "Please enter a valid email address",
      );
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t(
        "validation.phoneRequired",
        "Please enter your phone number",
      );
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = t(
        "validation.passwordLength",
        "Password must be at least 8 characters long",
      );
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t(
        "validation.passwordMatch",
        "Passwords do not match",
      );
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = t(
        "validation.termsRequired",
        "Please agree to the Terms of Service",
      );
    }

    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = t(
        "validation.privacyRequired",
        "Please agree to the Privacy Policy",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass data to next step
      onNext(formData);
    } catch (error) {
      console.error("Account step error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("registration.account.title", "Create Your Account")}
        </h1>
        <p className="text-gray-600">
          {t(
            "registration.account.subtitle",
            "Enter your basic information to get started",
          )}
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name */}
        <IonItem className={`rounded-lg ${errors.name ? "ion-invalid" : ""}`}>
          <IonIcon
            icon={personOutline}
            slot="start"
            className="text-gray-400"
          />
          <IonLabel position="stacked">
            {t("registration.account.name", "Full Name")} *
          </IonLabel>
          <IonInput
            value={formData.name}
            onIonInput={(e) => updateField("name", e.detail.value!)}
            placeholder={t(
              "registration.account.namePlaceholder",
              "Enter your full name",
            )}
            className="input-field"
          />
        </IonItem>
        {errors.name && (
          <p className="text-red-500 text-sm px-4">{errors.name}</p>
        )}

        {/* Email */}
        <IonItem className={`rounded-lg ${errors.email ? "ion-invalid" : ""}`}>
          <IonIcon icon={mailOutline} slot="start" className="text-gray-400" />
          <IonLabel position="stacked">
            {t("registration.account.email", "Email Address")} *
          </IonLabel>
          <IonInput
            type="email"
            value={formData.email}
            onIonInput={(e) => updateField("email", e.detail.value!)}
            placeholder={t(
              "registration.account.emailPlaceholder",
              "Enter your email",
            )}
            className="input-field"
          />
        </IonItem>
        {errors.email && (
          <p className="text-red-500 text-sm px-4">{errors.email}</p>
        )}

        {/* Phone */}
        <IonItem className={`rounded-lg ${errors.phone ? "ion-invalid" : ""}`}>
          <IonIcon icon={callOutline} slot="start" className="text-gray-400" />
          <IonLabel position="stacked">
            {t("registration.account.phone", "Phone Number")} *
          </IonLabel>
          <IonInput
            type="tel"
            value={formData.phone}
            onIonInput={(e) => updateField("phone", e.detail.value!)}
            placeholder={t(
              "registration.account.phonePlaceholder",
              "Enter your phone number",
            )}
            className="input-field"
          />
        </IonItem>
        {errors.phone && (
          <p className="text-red-500 text-sm px-4">{errors.phone}</p>
        )}

        {/* Password */}
        <IonItem
          className={`rounded-lg ${errors.password ? "ion-invalid" : ""}`}
        >
          <IonIcon
            icon={lockClosedOutline}
            slot="start"
            className="text-gray-400"
          />
          <IonLabel position="stacked">
            {t("registration.account.password", "Password")} *
          </IonLabel>
          <IonInput
            type="password"
            value={formData.password}
            onIonInput={(e) => updateField("password", e.detail.value!)}
            placeholder={t(
              "registration.account.passwordPlaceholder",
              "Create a password",
            )}
            className="input-field"
          />
        </IonItem>
        {errors.password && (
          <p className="text-red-500 text-sm px-4">{errors.password}</p>
        )}

        {/* Confirm Password */}
        <IonItem
          className={`rounded-lg ${errors.confirmPassword ? "ion-invalid" : ""}`}
        >
          <IonIcon
            icon={lockClosedOutline}
            slot="start"
            className="text-gray-400"
          />
          <IonLabel position="stacked">
            {t("registration.account.confirmPassword", "Confirm Password")} *
          </IonLabel>
          <IonInput
            type="password"
            value={formData.confirmPassword}
            onIonInput={(e) => updateField("confirmPassword", e.detail.value!)}
            placeholder={t(
              "registration.account.confirmPasswordPlaceholder",
              "Confirm your password",
            )}
            className="input-field"
          />
        </IonItem>
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm px-4">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Terms and Privacy */}
      <div className="space-y-3">
        <IonItem lines="none" className="pl-0">
          <IonCheckbox
            checked={formData.agreeToTerms}
            onIonChange={(e) => updateField("agreeToTerms", e.detail.checked)}
            className={errors.agreeToTerms ? "ion-invalid" : ""}
          />
          <IonLabel className="ml-2 text-sm">
            {t("registration.account.agreeTerms", "I agree to the")}{" "}
            <IonButton
              fill="clear"
              size="small"
              className="text-primary p-0 h-auto"
            >
              {t("registration.account.termsOfService", "Terms of Service")}
            </IonButton>
          </IonLabel>
        </IonItem>
        {errors.agreeToTerms && (
          <p className="text-red-500 text-sm px-4">{errors.agreeToTerms}</p>
        )}

        <IonItem lines="none" className="pl-0">
          <IonCheckbox
            checked={formData.agreeToPrivacy}
            onIonChange={(e) => updateField("agreeToPrivacy", e.detail.checked)}
            className={errors.agreeToPrivacy ? "ion-invalid" : ""}
          />
          <IonLabel className="ml-2 text-sm">
            {t("registration.account.agreePrivacy", "I agree to the")}{" "}
            <IonButton
              fill="clear"
              size="small"
              className="text-primary p-0 h-auto"
            >
              {t("registration.account.privacyPolicy", "Privacy Policy")}
            </IonButton>
          </IonLabel>
        </IonItem>
        {errors.agreeToPrivacy && (
          <p className="text-red-500 text-sm px-4">{errors.agreeToPrivacy}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <div>{/* Placeholder for back button alignment */}</div>

        <IonButton
          onClick={handleNext}
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
              {t("common.continue", "Continue")}
              <IonIcon icon={arrowForwardOutline} slot="end" />
            </>
          )}
        </IonButton>
      </div>

      {/* Help Text */}
      <div className="text-center pt-4">
        <p className="text-sm text-gray-500">
          {t("registration.account.helpText", "Already have an account?")}{" "}
          <IonButton
            fill="clear"
            size="small"
            routerLink="/login"
            className="text-primary font-medium"
          >
            {t("registration.account.signIn", "Sign In")}
          </IonButton>
        </p>
      </div>
    </div>
  );
};

export default AccountStep;
