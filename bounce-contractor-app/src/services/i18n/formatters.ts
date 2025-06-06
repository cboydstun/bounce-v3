// Central Time formatting services for consistent timezone handling
const APP_TIMEZONE = "America/Chicago";

/**
 * Format date in Central Time with localization
 */
export const formatDate = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

/**
 * Format date and time in Central Time with localization
 */
export const formatDateTime = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

/**
 * Format time only in Central Time with localization
 */
export const formatTime = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

/**
 * Format task time with Central Time indicator
 */
export const formatTaskTime = (date: Date, locale: string): string => {
  const timeString = formatTime(date, locale);
  return `${timeString} CT`;
};

/**
 * Format currency in USD with localization
 */
export const formatCurrency = (amount: number, locale: string): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

/**
 * Format distance in Imperial system (feet/miles) with localization
 */
export const formatDistance = (meters: number, locale: string): string => {
  const feet = meters * 3.28084;
  const miles = meters * 0.000621371;

  if (meters < 1609) {
    // Less than 1 mile
    return locale.startsWith("es")
      ? `${feet.toFixed(0)} pies`
      : `${feet.toFixed(0)} feet`;
  } else {
    return locale.startsWith("es")
      ? `${miles.toFixed(1)} millas`
      : `${miles.toFixed(1)} miles`;
  }
};

/**
 * Format US phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone; // Return as-is if not 10 digits
};

/**
 * Format US address
 */
export const formatAddress = (address: any): string => {
  const { street, city, state, zipCode } = address;
  return `${street}\n${city}, ${state} ${zipCode}`;
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 30 minutes")
 */
export const formatRelativeTime = (date: Date, locale: string): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  } else {
    return rtf.format(diffDays, "day");
  }
};

/**
 * Check if date is today in Central Time
 */
export const isToday = (date: Date): boolean => {
  const now = new Date();
  const today = new Date(
    now.toLocaleString("en-US", { timeZone: APP_TIMEZONE }),
  );
  const checkDate = new Date(
    date.toLocaleString("en-US", { timeZone: APP_TIMEZONE }),
  );

  return today.toDateString() === checkDate.toDateString();
};

/**
 * Check if date is tomorrow in Central Time
 */
export const isTomorrow = (date: Date): boolean => {
  const now = new Date();
  const tomorrow = new Date(
    now.toLocaleString("en-US", { timeZone: APP_TIMEZONE }),
  );
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkDate = new Date(
    date.toLocaleString("en-US", { timeZone: APP_TIMEZONE }),
  );

  return tomorrow.toDateString() === checkDate.toDateString();
};

/**
 * Check if date is yesterday in Central Time
 */
export const isYesterday = (date: Date): boolean => {
  const now = new Date();
  const yesterday = new Date(
    now.toLocaleString("en-US", { timeZone: APP_TIMEZONE }),
  );
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = new Date(
    date.toLocaleString("en-US", { timeZone: APP_TIMEZONE }),
  );

  return yesterday.toDateString() === checkDate.toDateString();
};
