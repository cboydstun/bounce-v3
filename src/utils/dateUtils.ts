/**
 * Date utility functions for consistent date handling in Central Time (America/Chicago)
 *
 * This utility ensures all date operations use the same timezone and formatting
 * to prevent issues with date shifting across different parts of the application.
 */

// Central Time Zone identifier
export const CENTRAL_TIMEZONE = "America/Chicago";

/**
 * Format a date as YYYY-MM-DD in Central Time
 * @param date The date to format (can be a Date object or date string)
 * @returns A string in YYYY-MM-DD format representing the date in Central Time
 */
export function formatDateCT(date: Date | string): string {
  // Convert string to Date object if necessary
  const dateObj = date instanceof Date ? date : new Date(date);

  // Validate that we have a valid Date object
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date provided to formatDateCT: ${date}`);
  }

  return dateObj.toLocaleDateString("en-CA", {
    timeZone: CENTRAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Parse a YYYY-MM-DD string into a Date object in Central Time
 * @param dateStr A string in YYYY-MM-DD format
 * @returns A Date object representing the date in Central Time
 */
export function parseDateCT(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);

  // Create a date string with a noon time in Central Time
  // Using noon helps avoid any potential date shifting due to DST
  const centralTimeStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T12:00:00-05:00`;
  return new Date(centralTimeStr);
}

/**
 * Format a date for display in a user-friendly format in Central Time
 * @param date The date to format (can be a Date object or date string)
 * @returns A string with the date in a user-friendly format (e.g., "Monday, June 1, 2025")
 */
export function formatDisplayDateCT(date: Date | string): string {
  // Convert string to Date object if necessary
  const dateObj = date instanceof Date ? date : new Date(date);

  // Validate that we have a valid Date object
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date provided to formatDisplayDateCT: ${date}`);
  }

  return dateObj.toLocaleDateString("en-US", {
    timeZone: CENTRAL_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Compare two dates in Central Time (ignoring time component)
 * @param date1 The first date (can be a Date object or date string)
 * @param date2 The second date (can be a Date object or date string)
 * @returns true if the dates are the same day in Central Time, false otherwise
 */
export function isSameDayCT(
  date1: Date | string,
  date2: Date | string,
): boolean {
  const date1Str = formatDateCT(date1);
  const date2Str = formatDateCT(date2);
  return date1Str === date2Str;
}

/**
 * Get the current date in Central Time (with time set to noon)
 * @returns A Date object representing the current date in Central Time
 */
export function getCurrentDateCT(): Date {
  const now = new Date();
  const dateStr = formatDateCT(now);
  return parseDateCT(dateStr);
}

/**
 * Create a Date object for a specific year, month, and day in Central Time
 * @param year The year
 * @param month The month (1-12)
 * @param day The day of the month
 * @returns A Date object in Central Time
 */
export function createDateCT(year: number, month: number, day: number): Date {
  const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  return parseDateCT(dateStr);
}

/**
 * Get the first day of a month in Central Time
 * @param year The year
 * @param month The month (1-12)
 * @returns A Date object representing the first day of the month in Central Time
 */
export function getFirstDayOfMonthCT(year: number, month: number): Date {
  return createDateCT(year, month, 1);
}

/**
 * Get the last day of a month in Central Time
 * @param year The year
 * @param month The month (1-12)
 * @returns A Date object representing the last day of the month in Central Time
 */
export function getLastDayOfMonthCT(year: number, month: number): Date {
  // Create the first day of the next month, then subtract one day
  const firstDayNextMonth =
    month === 12
      ? createDateCT(year + 1, 1, 1)
      : createDateCT(year, month + 1, 1);

  const lastDay = new Date(firstDayNextMonth);
  lastDay.setDate(lastDay.getDate() - 1);

  return lastDay;
}

/**
 * Parse a YYYY-MM-DD string into a Date object representing the start of the day in UTC
 * This is used for date range filtering to match how dates are stored in the database
 * @param dateStr A string in YYYY-MM-DD format
 * @returns A Date object representing the start of the day (00:00:00) in UTC
 */
export function parseDateStartOfDayUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Parse a YYYY-MM-DD string into a Date object representing the end of the day in UTC
 * This is used for date range filtering to match how dates are stored in the database
 * @param dateStr A string in YYYY-MM-DD format
 * @returns A Date object representing the end of the day (23:59:59.999) in UTC
 */
export function parseDateEndOfDayUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}

/**
 * Parse delivery date from notes field
 * Looks for patterns like "Delivery: 2025-07-19 14:00" in the notes
 * @param notes The notes string to parse
 * @returns A Date object if found, null otherwise
 */
export function parseDateFromNotes(notes: string): Date | null {
  if (!notes) return null;

  // Look for patterns like "Delivery: 2025-07-19" or "Delivery: 2025-07-19 14:00"
  const deliveryMatch = notes.match(/Delivery:\s*(\d{4}-\d{2}-\d{2})/i);

  if (deliveryMatch) {
    const dateStr = deliveryMatch[1];
    try {
      // Use parseDateCT to maintain timezone consistency instead of parseDateStartOfDayUTC
      return parseDateCT(dateStr);
    } catch (error) {
      console.warn("Failed to parse date from notes:", dateStr, error);
      return null;
    }
  }

  return null;
}

/**
 * Parse and format a party date consistently across the application
 * Handles various date formats and returns a user-friendly display format
 * @param dateInput The date input (can be Date object, ISO string, MM/DD/YYYY, etc.)
 * @returns A formatted display string in Central Time (e.g., "Saturday, July 19, 2025")
 */
export function parseAndFormatPartyDateCT(dateInput: string | Date): string {
  try {
    // Handle Date objects directly
    if (dateInput instanceof Date) {
      return formatDisplayDateCT(dateInput);
    }

    // Handle string inputs
    const dateStr = dateInput.toString();

    // Handle MM/DD/YYYY format (e.g., "4/13/2025")
    if (
      typeof dateStr === "string" &&
      dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
    ) {
      const [month, day, year] = dateStr.split("/").map(Number);
      const isoDateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const parsedDate = parseDateCT(isoDateStr);
      return formatDisplayDateCT(parsedDate);
    }
    // Handle ISO format dates (YYYY-MM-DD)
    else if (
      typeof dateStr === "string" &&
      dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      const parsedDate = parseDateCT(dateStr);
      return formatDisplayDateCT(parsedDate);
    }
    // Handle ISO datetime format - extract just the date part
    else if (
      typeof dateStr === "string" &&
      dateStr.match(/^\d{4}-\d{2}-\d{2}T/)
    ) {
      const parsedDate = parseDateCT(dateStr.split("T")[0]);
      return formatDisplayDateCT(parsedDate);
    } else {
      // For other formats, try to parse and extract date part
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return formatDisplayDateCT(date);
      }
      // Fallback to original date string if parsing fails
      return dateStr;
    }
  } catch (error) {
    console.warn(`Failed to parse party date: ${dateInput}`, error);
    // Fallback to original date string if parsing fails
    return dateInput.toString();
  }
}

/**
 * Parse a party date consistently and return a Date object
 * Handles various date formats and returns a Date object in Central Time
 * @param dateInput The date input (can be Date object, ISO string, MM/DD/YYYY, etc.)
 * @returns A Date object in Central Time, or null if parsing fails
 */
export function parsePartyDateCT(dateInput: string | Date): Date | null {
  try {
    // Handle Date objects directly
    if (dateInput instanceof Date) {
      return dateInput;
    }

    // Handle string inputs
    const dateStr = dateInput.toString();

    // Handle MM/DD/YYYY format (e.g., "4/13/2025")
    if (
      typeof dateStr === "string" &&
      dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
    ) {
      const [month, day, year] = dateStr.split("/").map(Number);
      const isoDateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      return parseDateCT(isoDateStr);
    }
    // Handle ISO format dates (YYYY-MM-DD)
    else if (
      typeof dateStr === "string" &&
      dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      return parseDateCT(dateStr);
    }
    // Handle ISO datetime format - extract just the date part
    else if (
      typeof dateStr === "string" &&
      dateStr.match(/^\d{4}-\d{2}-\d{2}T/)
    ) {
      return parseDateCT(dateStr.split("T")[0]);
    } else {
      // For other formats, try to parse and extract date part
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return parseDateCT(formatDateCT(date));
      }
      return null;
    }
  } catch (error) {
    console.warn(`Failed to parse party date: ${dateInput}`, error);
    return null;
  }
}

/**
 * Get the event date from an order with intelligent fallback logic
 * Tries eventDate first, then deliveryDate, then parses from notes
 * @param order The order object with potential date fields
 * @returns Formatted display date string or "TBD" if no date found
 */
export function getEventDateDisplay(order: {
  eventDate?: Date | string;
  deliveryDate?: Date | string;
  notes?: string;
}): string {
  // Try eventDate first (preferred)
  if (order.eventDate) {
    // If it's a string in YYYY-MM-DD format, use parseDateCT to maintain timezone consistency
    if (
      typeof order.eventDate === "string" &&
      order.eventDate.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      return formatDisplayDateCT(parseDateCT(order.eventDate));
    }
    return formatDisplayDateCT(order.eventDate);
  }

  // Try deliveryDate as fallback
  if (order.deliveryDate) {
    // If it's a string in YYYY-MM-DD format, use parseDateCT to maintain timezone consistency
    if (
      typeof order.deliveryDate === "string" &&
      order.deliveryDate.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      return formatDisplayDateCT(parseDateCT(order.deliveryDate));
    }
    return formatDisplayDateCT(order.deliveryDate);
  }

  // Try parsing from notes as last resort
  if (order.notes) {
    const parsedDate = parseDateFromNotes(order.notes);
    if (parsedDate) {
      return formatDisplayDateCT(parsedDate);
    }
  }

  return "TBD";
}

/**
 * Debug function to log date information in multiple formats
 * @param label A label for the log
 * @param date The date to log
 */
export function debugDate(label: string, date: Date): void {
  console.log(`${label}:`, {
    original: date.toString(),
    centralTime: formatDateCT(date),
    utc: date.toISOString(),
    localString: date.toLocaleDateString(),
  });
}
