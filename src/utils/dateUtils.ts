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
      return parseDateStartOfDayUTC(dateStr);
    } catch (error) {
      console.warn("Failed to parse date from notes:", dateStr, error);
      return null;
    }
  }

  return null;
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
