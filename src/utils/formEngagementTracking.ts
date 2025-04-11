import { trackInteraction } from "./trackInteraction";
import { InteractionType } from "@/types/visitor";

// Store form start time to calculate time spent
let formStartTime: number | null = null;
let fieldInteractions: Record<string, boolean> = {};
let totalFields = 0;

/**
 * Initialize form tracking
 * @param formId The ID of the form
 * @param fieldCount The number of fields in the form
 */
export function initFormTracking(formId: string, fieldCount: number) {
  formStartTime = Date.now();
  fieldInteractions = {};
  totalFields = fieldCount;

  // Track form view
  trackFormEngagement("form_view", formId, {
    totalFields: totalFields,
  });
}

/**
 * Track field interaction
 * @param formId The ID of the form
 * @param fieldName The name of the field
 * @param interactionType The type of interaction (focus, blur, change)
 * @param value The current value of the field
 */
export function trackFieldInteraction(
  formId: string,
  fieldName: string,
  interactionType: "focus" | "blur" | "change",
  value?: string,
) {
  // Track field focus
  if (interactionType === "focus") {
    trackFormEngagement("form_field_focus", formId, {
      field: fieldName,
    });
  }

  // Track field completion on blur if field has value
  if (interactionType === "blur" && value) {
    fieldInteractions[fieldName] = true;

    trackFormEngagement("form_field_complete", formId, {
      field: fieldName,
      fieldsCompleted: Object.keys(fieldInteractions).length,
      totalFields: totalFields,
    });
  }

  // For message field, track length
  if (fieldName === "message" && interactionType === "change" && value) {
    trackFormEngagement("form_message_update", formId, {
      messageLength: value.length,
    });
  }
}

/**
 * Track extras selection
 * @param formId The ID of the form
 * @param extrasSelected The number of extras selected
 */
export function trackExtrasSelection(formId: string, extrasSelected: number) {
  trackFormEngagement("form_extras_selection", formId, {
    extrasSelected: extrasSelected,
  });
}

/**
 * Track form completion
 * @param formId The ID of the form
 * @param data The form data
 */
export function trackFormCompletion(formId: string, data: any) {
  // Calculate time spent on form
  const timeSpent = formStartTime
    ? Math.floor((Date.now() - formStartTime) / 1000)
    : 0;

  // Count extras selected
  const extrasSelected = Object.keys(data).filter(
    (key) =>
      [
        "tablesChairs",
        "generator",
        "popcornMachine",
        "cottonCandyMachine",
        "snowConeMachine",
        "basketballShoot",
        "slushyMachine",
        "overnight",
      ].includes(key) && data[key] === true,
  ).length;

  // Count completed fields
  const fieldsCompleted = Object.keys(data).filter(
    (key) =>
      Boolean(data[key]) &&
      key !== "sourcePage" &&
      typeof data[key] !== "boolean",
  ).length;

  trackFormEngagement("form_completion", formId, {
    timeSpent,
    extrasSelected,
    fieldsCompleted,
    totalFields,
    messageLength: data.message ? data.message.length : 0,
  });
}

/**
 * Track success page engagement
 * @param action The action performed
 * @param data Additional data
 */
export function trackSuccessPageEngagement(action: string, data?: any) {
  trackFormEngagement(action, "contact-form-success", data);
}

/**
 * Helper function to send engagement data to API
 * @param interactionType The type of interaction
 * @param element The element that was interacted with
 * @param data Additional data
 */
async function trackFormEngagement(
  interactionType: string,
  element: string,
  data?: Record<string, any>,
) {
  try {
    // First track using existing tracking system if it's a standard interaction type
    if (isStandardInteractionType(interactionType)) {
      trackInteraction(
        interactionType as InteractionType,
        element,
        window.location.pathname,
        data,
      );
    }

    // Get visitor ID from localStorage
    const visitorId = localStorage.getItem("visitorId");
    if (!visitorId) {
      console.warn("Cannot track form engagement: No visitor ID found");
      return;
    }

    // Then update scores via API
    await fetch("/api/v1/visitors/score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId,
        interactionType,
        data: {
          ...data,
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          language: navigator.language,
          referrer: document.referrer || "Direct",
          device: getDeviceType(),
        },
      }),
    });
  } catch (error) {
    console.error("Error tracking form engagement:", error);
  }
}

/**
 * Check if the interaction type is a standard one defined in InteractionType
 * @param type The interaction type to check
 * @returns Whether the interaction type is standard
 */
function isStandardInteractionType(type: string): boolean {
  const standardTypes: InteractionType[] = [
    "click",
    "scroll",
    "form_start",
    "form_submit",
    "video_play",
    "gallery_view",
    "product_view",
    "price_check",
  ];

  return standardTypes.includes(type as InteractionType);
}

/**
 * Get the device type based on screen size
 * @returns The device type (Mobile, Tablet, Desktop)
 */
function getDeviceType(): "Mobile" | "Tablet" | "Desktop" {
  const width = window.innerWidth;
  if (width < 768) return "Mobile";
  if (width < 1024) return "Tablet";
  return "Desktop";
}
