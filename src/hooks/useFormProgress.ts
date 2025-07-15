import { useMemo } from "react";
import { ContactFormData } from "@/types/contact";

interface FormSection {
  name: string;
  fields: (keyof ContactFormData)[];
  weight: number; // Relative importance of this section
}

const FORM_SECTIONS: FormSection[] = [
  {
    name: "Product Selection",
    fields: ["bouncer"],
    weight: 20,
  },
  {
    name: "Contact Information",
    fields: ["email", "phone"],
    weight: 15,
  },
  {
    name: "Party Details",
    fields: ["partyDate", "partyZipCode", "partyStartTime", "partyEndTime"],
    weight: 25,
  },
  {
    name: "Address Information",
    fields: ["streetAddress", "city", "state"],
    weight: 15,
  },
  {
    name: "Delivery Information",
    fields: ["deliveryDay", "deliveryTime", "pickupDay", "pickupTime"],
    weight: 20,
  },
  {
    name: "Additional Information",
    fields: ["paymentMethod", "confirmed"],
    weight: 5,
  },
];

const REQUIRED_FIELDS: (keyof ContactFormData)[] = [
  "bouncer",
  "email",
  "partyDate",
  "partyZipCode",
];

interface SectionProgress {
  name: string;
  completed: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

/**
 * Custom hook for tracking form completion progress
 * @param formData - Current form data
 * @returns Object with progress information
 */
export function useFormProgress(formData: ContactFormData) {
  const progress = useMemo(() => {
    let totalWeight = 0;
    let completedWeight = 0;
    const sectionProgress: SectionProgress[] = [];

    FORM_SECTIONS.forEach((section) => {
      const completedFields = section.fields.filter((field) => {
        const value = formData[field];
        return value !== undefined && value !== null && value !== "";
      });

      const sectionPercentage =
        (completedFields.length / section.fields.length) * 100;
      const isComplete = sectionPercentage === 100;

      sectionProgress.push({
        name: section.name,
        completed: completedFields.length,
        total: section.fields.length,
        percentage: sectionPercentage,
        isComplete,
      });

      totalWeight += section.weight;
      completedWeight += (sectionPercentage / 100) * section.weight;
    });

    const overallPercentage = Math.round((completedWeight / totalWeight) * 100);

    // Check if all required fields are completed
    const requiredFieldsCompleted = REQUIRED_FIELDS.every((field) => {
      const value = formData[field];
      return value !== undefined && value !== null && value !== "";
    });

    // Check if form is ready for submission
    const isReadyForSubmission =
      requiredFieldsCompleted && overallPercentage >= 60;

    return {
      overall: overallPercentage,
      sections: sectionProgress,
      requiredFieldsCompleted,
      isReadyForSubmission,
      completedSections: sectionProgress.filter((s) => s.isComplete).length,
      totalSections: sectionProgress.length,
    };
  }, [formData]);

  const getNextIncompleteField = useMemo(() => {
    // Find the first incomplete required field
    for (const field of REQUIRED_FIELDS) {
      const value = formData[field];
      if (!value || value === "") {
        return field;
      }
    }

    // If all required fields are complete, find the first incomplete optional field
    for (const section of FORM_SECTIONS) {
      for (const field of section.fields) {
        const value = formData[field];
        if (!value || value === "") {
          return field;
        }
      }
    }

    return null;
  }, [formData]);

  const getSectionForField = (
    fieldName: keyof ContactFormData,
  ): string | null => {
    const section = FORM_SECTIONS.find((s) => s.fields.includes(fieldName));
    return section?.name || null;
  };

  const isFieldRequired = (fieldName: keyof ContactFormData): boolean => {
    return REQUIRED_FIELDS.includes(fieldName);
  };

  return {
    progress,
    getNextIncompleteField,
    getSectionForField,
    isFieldRequired,
  };
}
