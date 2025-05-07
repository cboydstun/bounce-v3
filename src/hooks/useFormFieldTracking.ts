import { useCallback } from "react";

/**
 * Custom hook for tracking form field interactions in the checkout process
 * Uses thumbprint.js visitor ID to track field focus, blur, and change events
 */
export function useFormFieldTracking() {
  /**
   * Track field interaction with the visitor API
   * @param fieldName The name of the field
   * @param action The action performed (focus, blur, change)
   * @param value The current value of the field (for change and blur events)
   */
  const trackFieldInteraction = useCallback(
    async (
      fieldName: string,
      action: "focus" | "blur" | "change",
      value?: any,
    ) => {
      try {
        // Get visitorId from localStorage
        const visitorId = localStorage.getItem("visitorId");

        if (!visitorId) {
          console.error("No visitorId found in localStorage");
          return;
        }

        // Send event to visitor API
        await fetch("/api/v1/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId,
            currentPage: window.location.pathname,
            interaction: {
              type: "form_field_interaction",
              element: `checkout-form-field-${fieldName}`,
              page: window.location.pathname,
              data: {
                field: fieldName,
                action,
                value: action === "change" ? value : undefined,
              },
            },
          }),
        });

        // Log to console in development
        if (process.env.NODE_ENV === "development") {
          console.log(
            `Tracked field interaction: ${fieldName} - ${action}`,
            action === "change" ? { value } : undefined,
          );
        }
      } catch (error) {
        // Silently fail to avoid breaking the checkout flow
        console.error("Error tracking field interaction:", error);
      }
    },
    [],
  );

  return {
    /**
     * Track when a field receives focus
     * @param fieldName The name of the field
     */
    trackFieldFocus: (fieldName: string) =>
      trackFieldInteraction(fieldName, "focus"),

    /**
     * Track when a field loses focus
     * @param fieldName The name of the field
     * @param value The current value of the field
     */
    trackFieldBlur: (fieldName: string, value?: any) =>
      trackFieldInteraction(fieldName, "blur", value),

    /**
     * Track when a field's value changes
     * @param fieldName The name of the field
     * @param value The new value of the field
     */
    trackFieldChange: (fieldName: string, value: any) =>
      trackFieldInteraction(fieldName, "change", value),
  };
}
