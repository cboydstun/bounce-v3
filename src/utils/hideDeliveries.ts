import { DeliveryTimeSlot, OptimizedRoute } from "./routeOptimization";

/**
 * Reasons for hiding deliveries
 */
export type HideReason =
  | "vehicle_capacity"
  | "driver_expertise"
  | "time_constraints"
  | "customer_request"
  | "route_splitting"
  | "address_issue"
  | "manual"
  | "bulk_operation";

/**
 * Hide criteria for filtering deliveries
 */
export interface HideCriteria {
  customerType?: string[];
  zipCodes?: string[];
  timeWindowConflicts?: boolean;
  orderValueThreshold?: {
    min?: number;
    max?: number;
  };
  specialRequirements?: string[];
  geographicZone?: string;
}

/**
 * Hide template for saving common hide patterns
 */
export interface HideTemplate {
  id: string;
  name: string;
  description?: string;
  criteria: HideCriteria;
  createdAt: Date;
  createdBy?: string;
}

/**
 * Hide preferences stored in localStorage
 */
export interface HidePreferences {
  hiddenDeliveryIds: string[];
  hideReasons: Record<string, HideReason>;
  hiddenAt: Record<string, Date>;
  templates: HideTemplate[];
}

/**
 * Storage key for localStorage
 */
const HIDE_PREFERENCES_KEY = "delivery_hide_preferences";

/**
 * Get hide preferences from localStorage
 */
export function getHidePreferences(date: Date): HidePreferences {
  try {
    const dateKey = date.toISOString().split("T")[0];
    const stored = localStorage.getItem(`${HIDE_PREFERENCES_KEY}_${dateKey}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return {
        ...parsed,
        hiddenAt: Object.fromEntries(
          Object.entries(parsed.hiddenAt || {}).map(([id, dateStr]) => [
            id,
            new Date(dateStr as string),
          ]),
        ),
        templates: (parsed.templates || []).map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
        })),
      };
    }
  } catch (error) {
    console.warn("Error loading hide preferences:", error);
  }

  return {
    hiddenDeliveryIds: [],
    hideReasons: {},
    hiddenAt: {},
    templates: [],
  };
}

/**
 * Save hide preferences to localStorage
 */
export function saveHidePreferences(
  date: Date,
  preferences: HidePreferences,
): void {
  try {
    const dateKey = date.toISOString().split("T")[0];
    localStorage.setItem(
      `${HIDE_PREFERENCES_KEY}_${dateKey}`,
      JSON.stringify(preferences),
    );
  } catch (error) {
    console.warn("Error saving hide preferences:", error);
  }
}

/**
 * Hide a single delivery
 */
export function hideDelivery(
  deliveryId: string,
  reason: HideReason,
  date: Date,
  hiddenBy?: string,
): void {
  const preferences = getHidePreferences(date);

  if (!preferences.hiddenDeliveryIds.includes(deliveryId)) {
    preferences.hiddenDeliveryIds.push(deliveryId);
    preferences.hideReasons[deliveryId] = reason;
    preferences.hiddenAt[deliveryId] = new Date();
  }

  saveHidePreferences(date, preferences);
}

/**
 * Show a single delivery (remove from hidden list)
 */
export function showDelivery(deliveryId: string, date: Date): void {
  const preferences = getHidePreferences(date);

  preferences.hiddenDeliveryIds = preferences.hiddenDeliveryIds.filter(
    (id) => id !== deliveryId,
  );
  delete preferences.hideReasons[deliveryId];
  delete preferences.hiddenAt[deliveryId];

  saveHidePreferences(date, preferences);
}

/**
 * Hide multiple deliveries
 */
export function hideDeliveries(
  deliveryIds: string[],
  reason: HideReason,
  date: Date,
  hiddenBy?: string,
): void {
  const preferences = getHidePreferences(date);
  const now = new Date();

  deliveryIds.forEach((id) => {
    if (!preferences.hiddenDeliveryIds.includes(id)) {
      preferences.hiddenDeliveryIds.push(id);
      preferences.hideReasons[id] = reason;
      preferences.hiddenAt[id] = now;
    }
  });

  saveHidePreferences(date, preferences);
}

/**
 * Show multiple deliveries
 */
export function showDeliveries(deliveryIds: string[], date: Date): void {
  const preferences = getHidePreferences(date);

  deliveryIds.forEach((id) => {
    preferences.hiddenDeliveryIds = preferences.hiddenDeliveryIds.filter(
      (hiddenId) => hiddenId !== id,
    );
    delete preferences.hideReasons[id];
    delete preferences.hiddenAt[id];
  });

  saveHidePreferences(date, preferences);
}

/**
 * Show all hidden deliveries
 */
export function showAllDeliveries(date: Date): void {
  const preferences: HidePreferences = {
    hiddenDeliveryIds: [],
    hideReasons: {},
    hiddenAt: {},
    templates: getHidePreferences(date).templates, // Preserve templates
  };

  saveHidePreferences(date, preferences);
}

/**
 * Check if a delivery is hidden
 */
export function isDeliveryHidden(deliveryId: string, date: Date): boolean {
  const preferences = getHidePreferences(date);
  return preferences.hiddenDeliveryIds.includes(deliveryId);
}

/**
 * Get hide reason for a delivery
 */
export function getHideReason(
  deliveryId: string,
  date: Date,
): HideReason | undefined {
  const preferences = getHidePreferences(date);
  return preferences.hideReasons[deliveryId];
}

/**
 * Get when a delivery was hidden
 */
export function getHiddenAt(deliveryId: string, date: Date): Date | undefined {
  const preferences = getHidePreferences(date);
  return preferences.hiddenAt[deliveryId];
}

/**
 * Filter deliveries by hide criteria
 */
export function getDeliveriesByHideCriteria(
  timeSlots: DeliveryTimeSlot[],
  criteria: HideCriteria,
): string[] {
  return timeSlots
    .filter((slot) => {
      // Filter by zip codes
      if (criteria.zipCodes && criteria.zipCodes.length > 0) {
        if (!criteria.zipCodes.includes(slot.contact.partyZipCode)) {
          return false;
        }
      }

      // Filter by order value threshold
      if (criteria.orderValueThreshold && slot.order) {
        const orderTotal = slot.order.totalAmount || 0;
        if (
          criteria.orderValueThreshold.min &&
          orderTotal < criteria.orderValueThreshold.min
        ) {
          return false;
        }
        if (
          criteria.orderValueThreshold.max &&
          orderTotal > criteria.orderValueThreshold.max
        ) {
          return false;
        }
      }

      // Add more criteria filters as needed
      return true;
    })
    .map((slot) => slot.contact._id);
}

/**
 * Apply hide preferences to an optimized route
 */
export function applyHidePreferences(
  route: OptimizedRoute,
  date: Date,
): OptimizedRoute {
  const preferences = getHidePreferences(date);
  const hiddenIds = new Set(preferences.hiddenDeliveryIds);

  // Separate active and hidden deliveries
  const activeDeliveries: DeliveryTimeSlot[] = [];
  const hiddenDeliveries: DeliveryTimeSlot[] = [];

  route.timeSlots.forEach((slot) => {
    const isHidden = hiddenIds.has(slot.contact._id);
    const updatedSlot: DeliveryTimeSlot = {
      ...slot,
      isHidden,
      hideReason: isHidden
        ? preferences.hideReasons[slot.contact._id]
        : undefined,
      hiddenAt: isHidden ? preferences.hiddenAt[slot.contact._id] : undefined,
    };

    if (isHidden) {
      hiddenDeliveries.push(updatedSlot);
    } else {
      activeDeliveries.push(updatedSlot);
    }
  });

  return {
    ...route,
    timeSlots: activeDeliveries, // Only active deliveries in main timeSlots
    activeDeliveries,
    hiddenDeliveries,
    deliveryOrder: route.deliveryOrder.filter(
      (contact) => !hiddenIds.has(contact._id),
    ),
    routeStats: {
      totalDeliveries: route.timeSlots.length,
      activeDeliveries: activeDeliveries.length,
      hiddenDeliveries: hiddenDeliveries.length,
    },
  };
}

/**
 * Save a hide template
 */
export function saveHideTemplate(
  template: Omit<HideTemplate, "id" | "createdAt">,
): HideTemplate {
  const newTemplate: HideTemplate = {
    ...template,
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  };

  // Save to a global templates storage (not date-specific)
  try {
    const stored = localStorage.getItem(`${HIDE_PREFERENCES_KEY}_templates`);
    const templates: HideTemplate[] = stored ? JSON.parse(stored) : [];
    templates.push(newTemplate);
    localStorage.setItem(
      `${HIDE_PREFERENCES_KEY}_templates`,
      JSON.stringify(templates),
    );
  } catch (error) {
    console.warn("Error saving hide template:", error);
  }

  return newTemplate;
}

/**
 * Get all hide templates
 */
export function getHideTemplates(): HideTemplate[] {
  try {
    const stored = localStorage.getItem(`${HIDE_PREFERENCES_KEY}_templates`);
    if (stored) {
      const templates = JSON.parse(stored);
      return templates.map((template: any) => ({
        ...template,
        createdAt: new Date(template.createdAt),
      }));
    }
  } catch (error) {
    console.warn("Error loading hide templates:", error);
  }

  return [];
}

/**
 * Delete a hide template
 */
export function deleteHideTemplate(templateId: string): void {
  try {
    const templates = getHideTemplates().filter((t) => t.id !== templateId);
    localStorage.setItem(
      `${HIDE_PREFERENCES_KEY}_templates`,
      JSON.stringify(templates),
    );
  } catch (error) {
    console.warn("Error deleting hide template:", error);
  }
}

/**
 * Apply a hide template to deliveries
 */
export function applyHideTemplate(
  template: HideTemplate,
  timeSlots: DeliveryTimeSlot[],
  date: Date,
): void {
  const deliveryIds = getDeliveriesByHideCriteria(timeSlots, template.criteria);
  if (deliveryIds.length > 0) {
    hideDeliveries(deliveryIds, "bulk_operation", date);
  }
}
