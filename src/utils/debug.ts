/**
 * Debug utility for tracking authentication and session issues
 * This file provides consistent logging across the application
 */

// Environment-aware debug logger
export const debugLog = (
  module: string,
  message: string,
  data?: any,
  forceLog: boolean = false,
) => {
  // Only log in development or if forceLog is true (for production debugging)
  if (process.env.NODE_ENV === "development" || forceLog) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${module}]`;

    if (data) {
      // Safely stringify data, handling circular references
      let safeData;
      try {
        // Replace sensitive data with placeholders
        const sanitizedData = sanitizeData(data);
        safeData = JSON.stringify(sanitizedData, null, 2);
      } catch (err) {
        safeData = "[Circular or complex object]";
      }
      console.log(`${prefix} ${message}`, safeData);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
};

// Function to sanitize sensitive data
const sanitizeData = (data: any): any => {
  if (!data) return data;

  // Handle different data types
  if (typeof data !== "object") return data;
  if (data instanceof Date) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  // Handle objects
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Mask sensitive fields
    if (
      key.toLowerCase().includes("password") ||
      key.toLowerCase().includes("token") ||
      key.toLowerCase().includes("secret") ||
      key.toLowerCase().includes("key")
    ) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Function to check environment variables
export const checkAuthEnvVars = () => {
  const vars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL_SET: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
    JWT_SECRET_SET: !!process.env.JWT_SECRET,
    MONGODB_URI_SET: !!process.env.MONGODB_URI,
  };

  debugLog("ENV_CHECK", "Authentication environment variables", vars);

  // Return missing required variables
  const missing = [];
  if (!process.env.NEXTAUTH_URL) missing.push("NEXTAUTH_URL");
  if (!process.env.NEXTAUTH_SECRET && !process.env.JWT_SECRET)
    missing.push("NEXTAUTH_SECRET or JWT_SECRET");
  if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");

  return { vars, missing };
};

// Function to check cookies
export const checkAuthCookies = () => {
  if (typeof document === "undefined") return {};

  const cookies = document.cookie.split(";").reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && name.includes("next-auth")) {
        acc[name] = "exists";
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  debugLog("COOKIES", "Authentication cookies", cookies);
  return cookies;
};

// Export a specialized logger for auth debugging
export const authDebug = {
  log: (message: string, data?: any) => debugLog("AUTH", message, data),
  error: (message: string, error: any) => {
    debugLog(
      "AUTH_ERROR",
      message,
      {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      },
      true,
    ); // Force log errors even in production
  },
  session: (message: string, session: any) => {
    if (!session) {
      debugLog("SESSION", message, { exists: false });
      return;
    }

    debugLog("SESSION", message, {
      exists: true,
      hasUser: !!session.user,
      userId: session.user?.id,
      expires: session.expires,
    });
  },
};

export default {
  debugLog,
  checkAuthEnvVars,
  checkAuthCookies,
  authDebug,
};
