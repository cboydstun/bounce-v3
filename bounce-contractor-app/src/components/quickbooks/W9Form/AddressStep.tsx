/**
 * AddressStep Component
 *
 * Third step of the W-9 form wizard for collecting address information.
 * Includes validation for US addresses and proper formatting.
 */

import React, { useState, useEffect } from "react";
import {
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
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
  locationOutline,
  homeOutline,
} from "ionicons/icons";
import { W9FormStepProps, US_STATES } from "../../../types/quickbooks.types";
import { useI18n } from "../../../hooks/common/useI18n";
import { quickbooksService } from "../../../services/quickbooks/quickbooksService";

/**
 * AddressStep Component
 *
 * Features:
 * - Street address input with validation
 * - City, state, and ZIP code fields
 * - US state dropdown with validation
 * - ZIP code formatting and validation
 * - Auto-population from user profile
 * - Bilingual support
 */
export const AddressStep: React.FC<W9FormStepProps> = ({
  data,
  onNext,
  onBack,
  canGoBack,
  isLastStep,
}) => {
  const { t } = useI18n();
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (data.address) {
      setAddress({
        street: data.address.street || "",
        city: data.address.city || "",
        state: data.address.state || "",
        zipCode: data.address.zipCode || "",
      });
    }
  }, [data]);

  /**
   * Validate the current step
   */
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Street address validation
    if (!address.street.trim()) {
      newErrors.street = t(
        "quickbooks.validation.streetRequired",
        "Street address is required",
      );
    } else if (address.street.trim().length < 5) {
      newErrors.street = t(
        "quickbooks.validation.streetTooShort",
        "Street address must be at least 5 characters",
      );
    }

    // City validation
    if (!address.city.trim()) {
      newErrors.city = t(
        "quickbooks.validation.cityRequired",
        "City is required",
      );
    } else if (address.city.trim().length < 2) {
      newErrors.city = t(
        "quickbooks.validation.cityTooShort",
        "City must be at least 2 characters",
      );
    }

    // State validation
    if (!address.state.trim()) {
      newErrors.state = t(
        "quickbooks.validation.stateRequired",
        "State is required",
      );
    } else if (!quickbooksService.validateStateCode(address.state)) {
      newErrors.state = t(
        "quickbooks.validation.stateInvalid",
        "Invalid state code",
      );
    }

    // ZIP code validation
    if (!address.zipCode.trim()) {
      newErrors.zipCode = t(
        "quickbooks.validation.zipCodeRequired",
        "ZIP code is required",
      );
    } else if (!quickbooksService.validateZipCode(address.zipCode)) {
      newErrors.zipCode = t(
        "quickbooks.validation.zipCodeInvalid",
        "Invalid ZIP code format (use 12345 or 12345-6789)",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle address field changes
   */
  const handleAddressChange = (field: keyof typeof address, value: string) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  /**
   * Format ZIP code input
   */
  const handleZipCodeChange = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");

    // Format as 12345 or 12345-6789
    let formatted = digits;
    if (digits.length > 5) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
    }

    handleAddressChange("zipCode", formatted);
  };

  /**
   * Handle next button click
   */
  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    const stepData = {
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.toUpperCase(),
        zipCode: address.zipCode.trim(),
      },
    };

    onNext(stepData);
  };

  /**
   * Check if form is complete
   */
  const isFormComplete = () => {
    return (
      address.street.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      address.zipCode.trim()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon icon={locationOutline} className="mr-2 text-primary" />
            {t("quickbooks.w9.addressTitle", "Address Information")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p className="text-gray-600">
            {t(
              "quickbooks.w9.addressDescription",
              "Provide your current mailing address. This address will be used for tax reporting purposes and must match your tax records.",
            )}
          </p>
        </IonCardContent>
      </IonCard>

      {/* Address Form */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center text-base">
            <IonIcon icon={homeOutline} className="mr-2 text-secondary" />
            {t("quickbooks.w9.mailingAddress", "Mailing Address")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {/* Street Address */}
            <IonItem>
              <IonLabel position="stacked">
                {t("quickbooks.w9.streetAddress", "Street Address")} *
              </IonLabel>
              <IonInput
                value={address.street}
                onIonInput={(e) =>
                  handleAddressChange("street", e.detail.value!)
                }
                placeholder={t(
                  "quickbooks.w9.streetPlaceholder",
                  "Enter your street address",
                )}
                className={errors.street ? "ion-invalid" : ""}
                maxlength={100}
                clearInput
              />
              {errors.street ? (
                <IonNote slot="error" color="danger">
                  {errors.street}
                </IonNote>
              ) : (
                <IonNote slot="helper" color="medium">
                  {t(
                    "quickbooks.w9.streetHelper",
                    "Include apartment, suite, or unit number if applicable",
                  )}
                </IonNote>
              )}
            </IonItem>

            {/* City */}
            <IonItem>
              <IonLabel position="stacked">
                {t("quickbooks.w9.city", "City")} *
              </IonLabel>
              <IonInput
                value={address.city}
                onIonInput={(e) => handleAddressChange("city", e.detail.value!)}
                placeholder={t(
                  "quickbooks.w9.cityPlaceholder",
                  "Enter your city",
                )}
                className={errors.city ? "ion-invalid" : ""}
                maxlength={50}
                clearInput
              />
              {errors.city && (
                <IonNote slot="error" color="danger">
                  {errors.city}
                </IonNote>
              )}
            </IonItem>

            {/* State */}
            <IonItem>
              <IonLabel position="stacked">
                {t("quickbooks.w9.state", "State")} *
              </IonLabel>
              <IonSelect
                value={address.state}
                onIonChange={(e) =>
                  handleAddressChange("state", e.detail.value)
                }
                placeholder={t(
                  "quickbooks.w9.statePlaceholder",
                  "Select your state",
                )}
                className={errors.state ? "ion-invalid" : ""}
                interface="popover"
              >
                {US_STATES.map((state) => (
                  <IonSelectOption key={state} value={state}>
                    {state}
                  </IonSelectOption>
                ))}
              </IonSelect>
              {errors.state && (
                <IonNote slot="error" color="danger">
                  {errors.state}
                </IonNote>
              )}
            </IonItem>

            {/* ZIP Code */}
            <IonItem>
              <IonLabel position="stacked">
                {t("quickbooks.w9.zipCode", "ZIP Code")} *
              </IonLabel>
              <IonInput
                value={address.zipCode}
                onIonInput={(e) => handleZipCodeChange(e.detail.value!)}
                placeholder={t(
                  "quickbooks.w9.zipPlaceholder",
                  "12345 or 12345-6789",
                )}
                className={errors.zipCode ? "ion-invalid" : ""}
                maxlength={10}
                inputmode="numeric"
              />
              {errors.zipCode ? (
                <IonNote slot="error" color="danger">
                  {errors.zipCode}
                </IonNote>
              ) : (
                <IonNote slot="helper" color="medium">
                  {t(
                    "quickbooks.w9.zipHelper",
                    "Enter 5-digit ZIP code or ZIP+4 format",
                  )}
                </IonNote>
              )}
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* Address Verification Notice */}
      <IonCard className="border-l-4 border-l-blue-500">
        <IonCardContent>
          <div className="flex items-start">
            <IonIcon
              icon={locationOutline}
              className="text-blue-500 mr-3 mt-1 flex-shrink-0"
            />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t(
                  "quickbooks.w9.addressVerificationTitle",
                  "Address Verification",
                )}
              </h4>
              <p className="text-sm text-gray-600">
                {t(
                  "quickbooks.w9.addressVerificationNotice",
                  "Please ensure your address is accurate and matches your tax records. This address will be used for all tax-related correspondence and 1099 forms.",
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

export default AddressStep;
