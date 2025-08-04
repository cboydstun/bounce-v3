/**
 * API configuration for CRM to communicate with API server
 */

export const API_CONFIG = {
  // API Server URLs
  API_SERVER_URL: process.env.API_SERVER_URL || "http://localhost:4000",

  // Internal API authentication
  API_SERVER_SECRET: process.env.API_SERVER_SECRET || "",

  // Request timeouts
  REQUEST_TIMEOUT: 10000, // 10 seconds

  // Retry configuration
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Validate API configuration
 */
export function validateApiConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!API_CONFIG.API_SERVER_URL) {
    errors.push("API_SERVER_URL is required");
  }

  if (!API_CONFIG.API_SERVER_SECRET) {
    errors.push("API_SERVER_SECRET is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
