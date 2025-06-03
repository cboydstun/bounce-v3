/**
 * TaxClassificationStep Component
 *
 * First step of the W-9 form wizard for selecting tax classification.
 * Supports all standard tax entity types with proper validation and
 * conditional fields for "other" classification.
 */

import React, { useState, useEffect } from "react";
import {
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
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
import { arrowForwardOutline, informationCircleOutline } from "ionicons/icons";
import {
  W9FormStepProps,
  TaxClassification,
  TAX_CLASSIFICATIONS,
} from "../../../types/quickbooks.types";
import { useI18n } from "../../../hooks/common/useI18n";

/**
 * TaxClassificationStep Component
 *
 * Features:
 * - Radio button selection for tax classification
 * - Conditional "other" text input
 * - Validation for required fields
 * - Helpful descriptions for each classification type
 * - Bilingual support
 */
export const TaxClassificationStep: React.FC<W9FormStepProps> = ({
  data,
  onNext,
  onBack,
  canGoBack,
  isLastStep,
}) => {
  const { t } = useI18n();
  const [selectedClassification, setSelectedClassification] = useState<
    TaxClassification | ""
  >("");
  const [otherClassification, setOtherClassification] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (data.taxClassification) {
      setSelectedClassification(data.taxClassification);
    }
    if (data.taxClassificationOther) {
      setOtherClassification(data.taxClassificationOther);
    }
  }, [data]);

  /**
   * Validate the current step
   */
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedClassification) {
      newErrors.taxClassification = t(
        "quickbooks.validation.taxClassificationRequired",
        "Please select a tax classification",
      );
    }

    if (selectedClassification === "other" && !otherClassification.trim()) {
      newErrors.taxClassificationOther = t(
        "quickbooks.validation.otherClassificationRequired",
        "Please specify the other tax classification",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle classification selection
   */
  const handleClassificationChange = (classification: TaxClassification) => {
    setSelectedClassification(classification);

    // Clear errors when user makes a selection
    if (errors.taxClassification) {
      setErrors((prev) => ({ ...prev, taxClassification: "" }));
    }

    // Clear "other" field if not selecting "other"
    if (classification !== "other") {
      setOtherClassification("");
      if (errors.taxClassificationOther) {
        setErrors((prev) => ({ ...prev, taxClassificationOther: "" }));
      }
    }
  };

  /**
   * Handle "other" classification input
   */
  const handleOtherClassificationChange = (value: string) => {
    setOtherClassification(value);

    // Clear error when user starts typing
    if (errors.taxClassificationOther) {
      setErrors((prev) => ({ ...prev, taxClassificationOther: "" }));
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
      taxClassification: selectedClassification as TaxClassification,
      taxClassificationOther:
        selectedClassification === "other"
          ? otherClassification.trim()
          : undefined,
    };

    onNext(stepData);
  };

  /**
   * Get description for tax classification
   */
  const getClassificationDescription = (
    classification: TaxClassification,
  ): string => {
    const descriptions = {
      individual: t(
        "quickbooks.taxClassification.individualDesc",
        "Individual/sole proprietor or single-member LLC",
      ),
      "c-corp": t("quickbooks.taxClassification.cCorpDesc", "C Corporation"),
      "s-corp": t("quickbooks.taxClassification.sCorpDesc", "S Corporation"),
      partnership: t(
        "quickbooks.taxClassification.partnershipDesc",
        "Partnership",
      ),
      trust: t("quickbooks.taxClassification.trustDesc", "Trust/estate"),
      llc: t(
        "quickbooks.taxClassification.llcDesc",
        "Limited liability company",
      ),
      other: t(
        "quickbooks.taxClassification.otherDesc",
        "Other (specify below)",
      ),
    };

    return descriptions[classification] || "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon
              icon={informationCircleOutline}
              className="mr-2 text-primary"
            />
            {t("quickbooks.w9.taxClassificationTitle", "Tax Classification")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p className="text-gray-600">
            {t(
              "quickbooks.w9.taxClassificationDescription",
              "Select the federal tax classification that applies to you. This determines how your income will be reported for tax purposes.",
            )}
          </p>
        </IonCardContent>
      </IonCard>

      {/* Tax Classification Selection */}
      <IonCard>
        <IonCardContent>
          <IonList>
            <IonRadioGroup
              value={selectedClassification}
              onIonChange={(e) => handleClassificationChange(e.detail.value)}
            >
              {TAX_CLASSIFICATIONS.map((classification) => (
                <IonItem key={classification.value}>
                  <IonRadio
                    slot="start"
                    value={classification.value}
                    aria-describedby={`${classification.value}-desc`}
                  />
                  <IonLabel className="ion-text-wrap">
                    <h3 className="font-medium">
                      {t(classification.labelKey, classification.value)}
                    </h3>
                    <p
                      id={`${classification.value}-desc`}
                      className="text-sm text-gray-500 mt-1"
                    >
                      {getClassificationDescription(
                        classification.value as TaxClassification,
                      )}
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonRadioGroup>
          </IonList>

          {errors.taxClassification && (
            <IonNote color="danger" className="block mt-2">
              {errors.taxClassification}
            </IonNote>
          )}
        </IonCardContent>
      </IonCard>

      {/* Other Classification Input */}
      {selectedClassification === "other" && (
        <IonCard>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">
                {t(
                  "quickbooks.w9.otherClassificationLabel",
                  "Specify Other Classification",
                )}{" "}
                *
              </IonLabel>
              <IonInput
                value={otherClassification}
                onIonInput={(e) =>
                  handleOtherClassificationChange(e.detail.value!)
                }
                placeholder={t(
                  "quickbooks.w9.otherClassificationPlaceholder",
                  "Enter your tax classification",
                )}
                className={errors.taxClassificationOther ? "ion-invalid" : ""}
                maxlength={100}
              />
              {errors.taxClassificationOther && (
                <IonNote slot="error" color="danger">
                  {errors.taxClassificationOther}
                </IonNote>
              )}
            </IonItem>
          </IonCardContent>
        </IonCard>
      )}

      {/* Important Notice */}
      <IonCard className="border-l-4 border-l-yellow-500">
        <IonCardContent>
          <div className="flex items-start">
            <IonIcon
              icon={informationCircleOutline}
              className="text-yellow-500 mr-3 mt-1 flex-shrink-0"
            />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t("quickbooks.w9.importantNoticeTitle", "Important Notice")}
              </h4>
              <p className="text-sm text-gray-600">
                {t(
                  "quickbooks.w9.taxClassificationNotice",
                  "If you are unsure about your tax classification, consult with a tax professional. The classification you select affects how your income is reported and taxed.",
                )}
              </p>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <IonButton
          fill="outline"
          onClick={onBack}
          disabled={!canGoBack}
          className={!canGoBack ? "invisible" : ""}
        >
          {t("common.back", "Back")}
        </IonButton>

        <IonButton onClick={handleNext} disabled={!selectedClassification}>
          {t("common.next", "Next")}
          <IonIcon icon={arrowForwardOutline} slot="end" />
        </IonButton>
      </div>
    </div>
  );
};

export default TaxClassificationStep;
