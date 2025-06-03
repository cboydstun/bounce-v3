/**
 * TaxIdInput Component
 *
 * Secure input component for tax ID (SSN/EIN) with masking, validation,
 * and proper formatting. Provides visual security by masking the input
 * when not focused and validates format in real-time.
 */

import React, { useState, useCallback } from "react";
import { IonInput, IonItem, IonLabel, IonNote, IonIcon } from "@ionic/react";
import {
  eyeOutline,
  eyeOffOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import { TaxIdInputProps } from "../../types/quickbooks.types";
import { quickbooksService } from "../../services/quickbooks/quickbooksService";
import { useI18n } from "../../hooks/common/useI18n";

/**
 * TaxIdInput Component
 *
 * Features:
 * - Automatic masking when not focused (•••-••-••••)
 * - Real-time format validation
 * - Support for both SSN and EIN formats
 * - Visual feedback for validation state
 * - Accessibility support
 * - Bilingual labels and error messages
 */
export const TaxIdInput: React.FC<TaxIdInputProps> = ({
  value,
  onIonInput,
  label,
  placeholder = "XXX-XX-XXXX or XX-XXXXXXX",
  required = false,
  disabled = false,
  error,
}) => {
  const { t } = useI18n();
  const [isFocused, setIsFocused] = useState(false);
  const [showValue, setShowValue] = useState(false);

  /**
   * Format tax ID input with proper dashes
   */
  const formatTaxId = useCallback((input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, "");

    // Limit to 9 digits
    const limitedDigits = digits.slice(0, 9);

    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 5) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
    } else {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 5)}-${limitedDigits.slice(5)}`;
    }
  }, []);

  /**
   * Create masked version of tax ID for display
   */
  const getMaskedValue = useCallback((taxId: string): string => {
    if (!taxId) return "";

    const digits = taxId.replace(/\D/g, "");
    if (digits.length < 9) {
      // Don't mask incomplete tax IDs
      return taxId;
    }

    // Mask as •••-••-••••
    return "•••-••-••••";
  }, []);

  /**
   * Validate tax ID and get validation state
   */
  const getValidationState = useCallback(() => {
    if (!value) return null;

    const validation = quickbooksService.validateTaxId(value);
    return validation;
  }, [value]);

  /**
   * Handle input changes with formatting
   */
  const handleInput = useCallback(
    (e: any) => {
      const rawValue = e.detail.value || "";
      const formatted = formatTaxId(rawValue);
      onIonInput(formatted);
    },
    [formatTaxId, onIonInput],
  );

  /**
   * Handle focus events
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  /**
   * Handle blur events
   */
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setShowValue(false);
  }, []);

  /**
   * Toggle value visibility
   */
  const toggleShowValue = useCallback(() => {
    setShowValue((prev) => !prev);
  }, []);

  // Get validation state
  const validation = getValidationState();
  const isValid = validation?.isValid ?? null;
  const hasError = error || (value && !isValid);

  // Determine display value
  const displayValue = isFocused || showValue ? value : getMaskedValue(value);

  // Get input mode based on validation
  const getInputMode = (): "numeric" | "text" => {
    return "numeric";
  };

  // Get helper text
  const getHelperText = (): string => {
    if (error) return error;

    if (value && validation) {
      if (validation.isValid) {
        const formatType = validation.format === "ssn" ? "SSN" : "EIN";
        return t("quickbooks.taxId.validFormat", `Valid ${formatType} format`);
      } else {
        return t(
          "quickbooks.taxId.invalidFormat",
          "Invalid tax ID format. Use XXX-XX-XXXX (SSN) or XX-XXXXXXX (EIN)",
        );
      }
    }

    return t(
      "quickbooks.taxId.helperText",
      "Your tax ID is encrypted and securely stored",
    );
  };

  return (
    <IonItem>
      <IonLabel position="stacked">
        {label} {required && <span className="text-red-500">*</span>}
      </IonLabel>

      <div className="w-full flex items-center">
        <IonInput
          value={displayValue}
          placeholder={placeholder}
          onIonInput={handleInput}
          onIonFocus={handleFocus}
          onIonBlur={handleBlur}
          maxlength={11} // XXX-XX-XXXX format
          inputmode={getInputMode()}
          disabled={disabled}
          className={`flex-1 ${hasError ? "ion-invalid" : isValid ? "ion-valid" : ""}`}
          aria-label={label}
          aria-describedby={`${label}-helper`}
        />

        {value && (
          <button
            type="button"
            onClick={toggleShowValue}
            className="ml-2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
            aria-label={
              showValue
                ? t("quickbooks.taxId.hideValue", "Hide tax ID")
                : t("quickbooks.taxId.showValue", "Show tax ID")
            }
            disabled={disabled}
          >
            <IonIcon
              icon={showValue ? eyeOffOutline : eyeOutline}
              className="w-5 h-5"
            />
          </button>
        )}

        {isValid && (
          <IonIcon
            icon={shieldCheckmarkOutline}
            className="ml-2 text-green-500 w-5 h-5"
            aria-label={t("quickbooks.taxId.validIcon", "Valid tax ID")}
          />
        )}
      </div>

      <IonNote
        slot={hasError ? "error" : "helper"}
        id={`${label}-helper`}
        color={hasError ? "danger" : isValid ? "success" : "medium"}
      >
        {getHelperText()}
      </IonNote>
    </IonItem>
  );
};

export default TaxIdInput;
