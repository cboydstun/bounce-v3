/**
 * ProfileStep Component
 *
 * Second step of registration wizard - professional profile setup
 * Collects: business name, skills, emergency contact, profile image
 */

import React, { useState } from "react";
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon,
  IonChip,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import {
  arrowForwardOutline,
  arrowBackOutline,
  businessOutline,
  constructOutline,
  personAddOutline,
  imageOutline,
} from "ionicons/icons";
import { useI18n } from "../../../hooks/common/useI18n";

interface ProfileStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  isLastStep?: boolean;
}

interface ProfileFormData {
  businessName: string;
  skills: string[];
  profileImage: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
    email: string;
  };
}

// Available skills for contractors
const AVAILABLE_SKILLS = [
  "delivery",
  "setup",
  "takedown",
  "cleaning",
  "customer_service",
  "heavy_lifting",
  "electrical_setup",
  "event_coordination",
  "safety_inspection",
  "equipment_maintenance",
];

const RELATIONSHIP_OPTIONS = [
  "spouse",
  "parent",
  "sibling",
  "child",
  "friend",
  "colleague",
  "other",
];

export const ProfileStep: React.FC<ProfileStepProps> = ({
  data,
  onNext,
  onBack,
  canGoBack,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<ProfileFormData>({
    businessName: data.businessName || "",
    skills: data.skills || ["delivery", "setup"],
    profileImage: data.profileImage || "",
    emergencyContact: data.emergencyContact || {
      name: "",
      phone: "",
      relationship: "",
      email: "",
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  /**
   * Update form field
   */
  const updateField = (field: keyof ProfileFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  /**
   * Update emergency contact field
   */
  const updateEmergencyContact = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  /**
   * Add skill to list
   */
  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
  };

  /**
   * Remove skill from list
   */
  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  /**
   * Add custom skill
   */
  const addCustomSkill = () => {
    const skill = skillInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (skill && !formData.skills.includes(skill)) {
      addSkill(skill);
      setSkillInput("");
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.skills.length === 0) {
      newErrors.skills = t(
        "validation.skillsRequired",
        "Please select at least one skill",
      );
    }

    // Emergency contact validation (optional but if provided, name and phone are required)
    if (formData.emergencyContact.name || formData.emergencyContact.phone) {
      if (!formData.emergencyContact.name.trim()) {
        newErrors.emergencyContactName = t(
          "validation.emergencyNameRequired",
          "Emergency contact name is required",
        );
      }
      if (!formData.emergencyContact.phone.trim()) {
        newErrors.emergencyContactPhone = t(
          "validation.emergencyPhoneRequired",
          "Emergency contact phone is required",
        );
      }
    }

    // Validate profile image URL if provided
    if (formData.profileImage) {
      try {
        new URL(formData.profileImage);
      } catch {
        newErrors.profileImage = t(
          "validation.invalidImageUrl",
          "Please enter a valid image URL",
        );
      }
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
      console.error("Profile step error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Format skill name for display
   */
  const formatSkillName = (skill: string): string => {
    return skill.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("registration.profile.title", "Professional Profile")}
        </h1>
        <p className="text-gray-600">
          {t(
            "registration.profile.subtitle",
            "Tell us about your skills and experience",
          )}
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Business Name */}
        <IonItem className="rounded-lg">
          <IonIcon
            icon={businessOutline}
            slot="start"
            className="text-gray-400"
          />
          <IonLabel position="stacked">
            {t("registration.profile.businessName", "Business Name")}
          </IonLabel>
          <IonInput
            value={formData.businessName}
            onIonInput={(e) => updateField("businessName", e.detail.value!)}
            placeholder={t(
              "registration.profile.businessNamePlaceholder",
              "Your business or company name (optional)",
            )}
            className="input-field"
          />
        </IonItem>

        {/* Skills Selection */}
        <div className="space-y-3">
          <IonLabel className="text-sm font-medium text-gray-700">
            {t("registration.profile.skills", "Skills & Expertise")} *
          </IonLabel>

          {/* Available Skills */}
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SKILLS.map((skill) => (
              <IonChip
                key={skill}
                onClick={() =>
                  formData.skills.includes(skill)
                    ? removeSkill(skill)
                    : addSkill(skill)
                }
                color={formData.skills.includes(skill) ? "primary" : "medium"}
                className="cursor-pointer"
              >
                {formatSkillName(skill)}
              </IonChip>
            ))}
          </div>

          {/* Custom Skill Input */}
          <div className="flex space-x-2">
            <IonInput
              value={skillInput}
              onIonInput={(e) => setSkillInput(e.detail.value!)}
              onKeyPress={(e) => e.key === "Enter" && addCustomSkill()}
              placeholder={t(
                "registration.profile.customSkillPlaceholder",
                "Add custom skill",
              )}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            />
            <IonButton
              fill="outline"
              onClick={addCustomSkill}
              disabled={!skillInput.trim()}
            >
              {t("common.add", "Add")}
            </IonButton>
          </div>

          {/* Selected Skills */}
          {formData.skills.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {t("registration.profile.selectedSkills", "Selected Skills")}:
              </p>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <IonChip
                    key={skill}
                    color="primary"
                    onClick={() => removeSkill(skill)}
                    className="cursor-pointer"
                  >
                    {formatSkillName(skill)}
                    <IonIcon name="close" />
                  </IonChip>
                ))}
              </div>
            </div>
          )}

          {errors.skills && (
            <p className="text-red-500 text-sm">{errors.skills}</p>
          )}
        </div>

        {/* Profile Image */}
        <IonItem
          className={`rounded-lg ${errors.profileImage ? "ion-invalid" : ""}`}
        >
          <IonIcon icon={imageOutline} slot="start" className="text-gray-400" />
          <IonLabel position="stacked">
            {t("registration.profile.profileImage", "Profile Image URL")}
          </IonLabel>
          <IonInput
            type="url"
            value={formData.profileImage}
            onIonInput={(e) => updateField("profileImage", e.detail.value!)}
            placeholder={t(
              "registration.profile.profileImagePlaceholder",
              "https://example.com/your-photo.jpg (optional)",
            )}
            className="input-field"
          />
        </IonItem>
        {errors.profileImage && (
          <p className="text-red-500 text-sm px-4">{errors.profileImage}</p>
        )}

        {/* Profile Image Preview */}
        {formData.profileImage && (
          <div className="flex justify-center">
            <img
              src={formData.profileImage}
              alt="Profile preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Emergency Contact Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center space-x-2">
          <IonIcon icon={personAddOutline} className="text-gray-400" />
          <IonLabel className="text-sm font-medium text-gray-700">
            {t("registration.profile.emergencyContact", "Emergency Contact")} (
            {t("common.optional", "Optional")})
          </IonLabel>
        </div>

        <IonItem
          className={`rounded-lg ${errors.emergencyContactName ? "ion-invalid" : ""}`}
        >
          <IonLabel position="stacked">
            {t("registration.profile.emergencyName", "Contact Name")}
          </IonLabel>
          <IonInput
            value={formData.emergencyContact.name}
            onIonInput={(e) => updateEmergencyContact("name", e.detail.value!)}
            placeholder={t(
              "registration.profile.emergencyNamePlaceholder",
              "Emergency contact name",
            )}
            className="input-field"
          />
        </IonItem>
        {errors.emergencyContactName && (
          <p className="text-red-500 text-sm px-4">
            {errors.emergencyContactName}
          </p>
        )}

        <IonItem
          className={`rounded-lg ${errors.emergencyContactPhone ? "ion-invalid" : ""}`}
        >
          <IonLabel position="stacked">
            {t("registration.profile.emergencyPhone", "Contact Phone")}
          </IonLabel>
          <IonInput
            type="tel"
            value={formData.emergencyContact.phone}
            onIonInput={(e) => updateEmergencyContact("phone", e.detail.value!)}
            placeholder={t(
              "registration.profile.emergencyPhonePlaceholder",
              "Emergency contact phone",
            )}
            className="input-field"
          />
        </IonItem>
        {errors.emergencyContactPhone && (
          <p className="text-red-500 text-sm px-4">
            {errors.emergencyContactPhone}
          </p>
        )}

        <IonItem className="rounded-lg">
          <IonLabel position="stacked">
            {t("registration.profile.emergencyRelationship", "Relationship")}
          </IonLabel>
          <IonSelect
            value={formData.emergencyContact.relationship}
            onIonChange={(e) =>
              updateEmergencyContact("relationship", e.detail.value)
            }
            placeholder={t(
              "registration.profile.emergencyRelationshipPlaceholder",
              "Select relationship",
            )}
          >
            {RELATIONSHIP_OPTIONS.map((relationship) => (
              <IonSelectOption key={relationship} value={relationship}>
                {formatSkillName(relationship)}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem className="rounded-lg">
          <IonLabel position="stacked">
            {t("registration.profile.emergencyEmail", "Contact Email")}
          </IonLabel>
          <IonInput
            type="email"
            value={formData.emergencyContact.email}
            onIonInput={(e) => updateEmergencyContact("email", e.detail.value!)}
            placeholder={t(
              "registration.profile.emergencyEmailPlaceholder",
              "Emergency contact email (optional)",
            )}
            className="input-field"
          />
        </IonItem>
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
    </div>
  );
};

export default ProfileStep;
