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
 * @param date The date to format
 * @returns A string in YYYY-MM-DD format representing the date in Central Time
 */
export function formatDateCT(date: Date): string {
  return date.toLocaleDateString("en-CA", {
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
 * @param date The date to format
 * @returns A string with the date in a user-friendly format (e.g., "Monday, June 1, 2025")
 */
export function formatDisplayDateCT(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: CENTRAL_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Compare two dates in Central Time (ignoring time component)
 * @param date1 The first date
 * @param date2 The second date
 * @returns true if the dates are the same day in Central Time, false otherwise
 */
export function isSameDayCT(date1: Date, date2: Date): boolean {
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
