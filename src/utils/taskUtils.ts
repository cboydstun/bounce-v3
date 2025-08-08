import { TaskType } from "@/types/task";
import { Order, OrderItem } from "@/types/order";
import {
  parsePartyDateCT,
  formatDateCT,
  parseDateFromNotes,
  parsePartyDateCT as parseDate,
  CENTRAL_TIMEZONE,
} from "./dateUtils";

/**
 * Generate a task title based on order items and task type
 * @param orderItems Array of order items
 * @param taskType Type of task (Delivery, Setup, Pickup, Maintenance)
 * @returns Generated task title
 */
export function generateTaskTitle(
  orderItems: OrderItem[],
  taskType: TaskType,
): string {
  if (!orderItems || orderItems.length === 0) {
    return `${taskType} Task`;
  }

  // Group items by type and get unique names
  const itemNames = new Set<string>();

  orderItems.forEach((item) => {
    // Extract the main item name (remove extra descriptors)
    let cleanName = item.name;

    // Remove common suffixes and prefixes to get core item name
    cleanName = cleanName
      .replace(/\s*\(.*?\)\s*/g, "") // Remove parenthetical descriptions
      .replace(/\s*-.*$/g, "") // Remove dash descriptions
      .replace(/^\d+x?\s*/i, "") // Remove quantity prefixes
      .trim();

    itemNames.add(cleanName);
  });

  // Convert to array and limit to avoid overly long titles
  const uniqueNames = Array.from(itemNames).slice(0, 3);

  // Create a concise item list
  let itemList = uniqueNames.join(", ");

  // If there are more than 3 unique items, add "and more"
  if (itemNames.size > 3) {
    itemList += ", and more";
  }

  return `${taskType} - ${itemList}`;
}

/**
 * Generate a concise, actionable task description from order data
 * @param order Complete order object
 * @param taskType Type of task being created
 * @returns Generated task description
 */
export function generateTaskDescription(
  order: Order,
  taskType?: TaskType,
): string {
  const lines: string[] = [];

  // Customer name
  const customerName = order.customerName || "Customer";

  // Address information
  const addressParts = [
    order.customerAddress,
    order.customerCity,
    order.customerState,
    order.customerZipCode,
  ].filter(Boolean);

  const address =
    addressParts.length > 0 ? addressParts.join(", ") : "Address TBD";

  // Items list - simplified
  let itemsList = "";
  if (order.items && order.items.length > 0) {
    itemsList = order.items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(", ");
  }

  // Generate action-based description based on task type
  if (taskType) {
    switch (taskType) {
      case "Delivery":
        lines.push(`Deliver ${itemsList} to ${address}`);
        break;
      case "Setup":
        lines.push(`Setup ${itemsList} at ${address}`);
        break;
      case "Pickup":
        lines.push(`Pickup ${itemsList} from ${address}`);
        break;
      case "Maintenance":
        lines.push(`Maintenance for ${itemsList}`);
        if (addressParts.length > 0) {
          lines.push(`Location: ${address}`);
        }
        break;
      default:
        lines.push(`Task for ${itemsList} at ${address}`);
    }
  } else {
    // Fallback if no task type provided
    lines.push(`${itemsList} at ${address}`);
  }

  // Customer and order reference
  lines.push(`Customer: ${customerName} | Order: ${order.orderNumber}`);

  // Add order notes if they exist and are important
  if (order.notes && order.notes.trim()) {
    const notes = order.notes.trim();
    // Only include notes if they're not too long (keep description concise)
    if (notes.length <= 100) {
      lines.push(`Notes: ${notes}`);
    } else {
      // Truncate long notes
      lines.push(`Notes: ${notes.substring(0, 97)}...`);
    }
  }

  return lines.join("\n");
}

/**
 * Calculate payment amount based on task type and order total
 * @param taskType Type of task
 * @param orderTotal Total amount of the order
 * @returns Calculated payment amount
 */
export function calculateTaskPayment(
  taskType: TaskType,
  orderTotal: number,
): number {
  let amount: number;

  switch (taskType) {
    case "Setup":
    case "Maintenance":
      amount = 20.0;
      break;

    case "Delivery":
    case "Pickup":
      const baseAmount = 10.0;
      const percentage = orderTotal * 0.1; // 10% of order total
      amount = baseAmount + percentage;
      break;

    default:
      amount = 0;
      break;
  }

  // Ensure exactly 2 decimal places to avoid floating-point precision issues
  return parseFloat(amount.toFixed(2));
}

/**
 * Create a date with specific time in Central Time
 * @param baseDate The base date to use
 * @param hours Hour (0-23)
 * @param minutes Minutes (0-59)
 * @returns Date object with the specified time in Central Time
 */
function createDateWithTimeCT(
  baseDate: Date,
  hours: number,
  minutes: number,
): Date {
  // Create a new date string in Central Time format
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const day = String(baseDate.getDate()).padStart(2, "0");
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");

  // Create date string in Central Time (using -06:00 for CST, -05:00 for CDT)
  // For simplicity, we'll use -06:00 and let the system handle DST
  const centralTimeStr = `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00-06:00`;
  return new Date(centralTimeStr);
}

/**
 * Generate default scheduled date/time based on task type and order dates
 * @param taskType Type of task
 * @param order Order object with date information
 * @returns Default scheduled date/time or null if no suitable date found
 */
export function generateDefaultScheduledDateTime(
  taskType: TaskType,
  order: Order,
): Date | null {
  const now = new Date();

  // Debug logging to help troubleshoot date parsing issues
  console.log("🔍 generateDefaultScheduledDateTime Debug:", {
    taskType,
    orderNumber: order.orderNumber,
    deliveryDate: order.deliveryDate,
    eventDate: order.eventDate,
    deliveryDateType: typeof order.deliveryDate,
    eventDateType: typeof order.eventDate,
  });

  try {
    switch (taskType) {
      case "Delivery":
      case "Setup":
        // Try delivery date first
        if (order.deliveryDate) {
          try {
            const deliveryDate = parsePartyDateCT(order.deliveryDate);
            if (deliveryDate && deliveryDate > now) {
              // Set to 9 AM Central Time on delivery date as default
              const scheduledDate = createDateWithTimeCT(deliveryDate, 9, 0);
              console.log(
                "✅ Using delivery date for",
                taskType,
                ":",
                scheduledDate,
              );
              return scheduledDate;
            }
          } catch (error) {
            console.warn(
              "⚠️ Failed to parse delivery date:",
              order.deliveryDate,
              error,
            );
          }
        }

        // Fallback to event date if delivery date is not available or in the past
        if (order.eventDate) {
          try {
            const eventDate = parsePartyDateCT(order.eventDate);
            if (eventDate && eventDate > now) {
              // Set to 9 AM Central Time on event date as fallback
              const scheduledDate = createDateWithTimeCT(eventDate, 9, 0);
              console.log(
                "✅ Using event date as fallback for",
                taskType,
                ":",
                scheduledDate,
              );
              return scheduledDate;
            }
          } catch (error) {
            console.warn(
              "⚠️ Failed to parse event date:",
              order.eventDate,
              error,
            );
          }
        }

        // Final fallback: try to parse delivery date from notes
        if (order.notes) {
          try {
            const parsedDate = parseDateFromNotes(order.notes);
            if (parsedDate && parsedDate > now) {
              // Extract time from notes if available, otherwise default to 9 AM Central Time
              const timeMatch = order.notes.match(
                /Delivery:\s*\d{4}-\d{2}-\d{2}\s+(\d{1,2}):(\d{2})/i,
              );
              if (timeMatch) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const scheduledDate = createDateWithTimeCT(
                  parsedDate,
                  hours,
                  minutes,
                );
                console.log(
                  "✅ Using delivery date from notes with specific time for",
                  taskType,
                  ":",
                  scheduledDate,
                );
                return scheduledDate;
              } else {
                const scheduledDate = createDateWithTimeCT(parsedDate, 9, 0);
                console.log(
                  "✅ Using delivery date from notes with default time for",
                  taskType,
                  ":",
                  scheduledDate,
                );
                return scheduledDate;
              }
            }
          } catch (error) {
            console.warn(
              "⚠️ Failed to parse delivery date from notes:",
              order.notes,
              error,
            );
          }
        }
        break;

      case "Pickup":
        // Try event date first for pickup
        if (order.eventDate) {
          try {
            const eventDate = parsePartyDateCT(order.eventDate);
            if (eventDate) {
              // Default to next day after event at 10 AM Central Time
              const nextDay = new Date(eventDate);
              nextDay.setDate(nextDay.getDate() + 1);
              const pickupDate = createDateWithTimeCT(nextDay, 10, 0);

              // Only use if it's in the future
              if (pickupDate > now) {
                console.log(
                  "✅ Using event date + 1 day for pickup:",
                  pickupDate,
                );
                return pickupDate;
              }
            }
          } catch (error) {
            console.warn(
              "⚠️ Failed to parse event date for pickup:",
              order.eventDate,
              error,
            );
          }
        }

        // Fallback: if no event date or it's in the past, try delivery date + 2 days
        if (order.deliveryDate) {
          try {
            const deliveryDate = parsePartyDateCT(order.deliveryDate);
            if (deliveryDate) {
              const twoDaysLater = new Date(deliveryDate);
              twoDaysLater.setDate(twoDaysLater.getDate() + 2);
              const pickupDate = createDateWithTimeCT(twoDaysLater, 10, 0);

              if (pickupDate > now) {
                console.log(
                  "✅ Using delivery date + 2 days as pickup fallback:",
                  pickupDate,
                );
                return pickupDate;
              }
            }
          } catch (error) {
            console.warn(
              "⚠️ Failed to parse delivery date for pickup fallback:",
              order.deliveryDate,
              error,
            );
          }
        }

        // Final fallback: try to parse pickup date from notes
        if (order.notes) {
          try {
            // Look for pickup time in notes
            const pickupMatch = order.notes.match(
              /Pickup:\s*(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})/i,
            );
            if (pickupMatch) {
              const dateStr = pickupMatch[1];
              const hours = parseInt(pickupMatch[2]);
              const minutes = parseInt(pickupMatch[3]);
              const parsedDate = parsePartyDateCT(dateStr);
              if (parsedDate && parsedDate > now) {
                const pickupDate = createDateWithTimeCT(
                  parsedDate,
                  hours,
                  minutes,
                );
                console.log(
                  "✅ Using pickup date from notes with specific time:",
                  pickupDate,
                );
                return pickupDate;
              }
            }

            // If no specific pickup time, try to use delivery date from notes + 1 day
            const parsedDate = parseDateFromNotes(order.notes);
            if (parsedDate && parsedDate > now) {
              const nextDay = new Date(parsedDate);
              nextDay.setDate(nextDay.getDate() + 1);
              const pickupDate = createDateWithTimeCT(nextDay, 10, 0);
              console.log(
                "✅ Using delivery date from notes + 1 day for pickup:",
                pickupDate,
              );
              return pickupDate;
            }
          } catch (error) {
            console.warn(
              "⚠️ Failed to parse pickup date from notes:",
              order.notes,
              error,
            );
          }
        }
        break;

      case "Maintenance":
        // For maintenance, don't provide a default - admin should manually select
        console.log("ℹ️ Maintenance tasks require manual date/time selection");
        return null;

      default:
        console.warn("⚠️ Unknown task type:", taskType);
        return null;
    }
  } catch (error) {
    console.error("❌ Error in generateDefaultScheduledDateTime:", error);
  }

  console.log("⚠️ No suitable date found for task type:", taskType);
  return null;
}

/**
 * Format date for datetime-local input in Central Time
 * @param date Date object
 * @returns Formatted string for datetime-local input in Central Time
 */
export function formatDateTimeLocalCT(date: Date): string {
  // Convert to Central Time using toLocaleString
  const centralTimeStr = date.toLocaleString("en-CA", {
    timeZone: CENTRAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Format: "2025-01-08, 21:30" -> "2025-01-08T21:30"
  const [datePart, timePart] = centralTimeStr.split(", ");
  return `${datePart}T${timePart}`;
}

/**
 * Format date for datetime-local input (legacy function - use formatDateTimeLocalCT instead)
 * @param date Date object
 * @returns Formatted string for datetime-local input
 * @deprecated Use formatDateTimeLocalCT for Central Time consistency
 */
export function formatDateTimeLocal(date: Date): string {
  console.warn(
    "formatDateTimeLocal is deprecated. Use formatDateTimeLocalCT for Central Time consistency.",
  );
  return formatDateTimeLocalCT(date);
}
