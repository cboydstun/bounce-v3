import crypto from "crypto";
import { logger } from "./logger.js";
/**
 * Generate a secure random token
 * @param length Token length in bytes (default: 32)
 * @returns Hex-encoded token string
 */
export function generateSecureToken(length = 32) {
  try {
    return crypto.randomBytes(length).toString("hex");
  } catch (error) {
    logger.error("Error generating secure token:", error);
    throw new Error("Failed to generate secure token");
  }
}
/**
 * Generate email verification token
 * @returns Secure token for email verification
 */
export function generateEmailVerificationToken() {
  return generateSecureToken(32); // 64 character hex string
}
/**
 * Generate password reset token
 * @returns Secure token for password reset
 */
export function generatePasswordResetToken() {
  return generateSecureToken(32); // 64 character hex string
}
/**
 * Generate a time-based expiration date
 * @param hours Hours from now (default: 24)
 * @returns Date object representing expiration time
 */
export function generateExpirationDate(hours = 24) {
  const now = new Date();
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}
/**
 * Check if a token has expired
 * @param expirationDate Expiration date to check
 * @returns True if expired, false otherwise
 */
export function isTokenExpired(expirationDate) {
  return new Date() > expirationDate;
}
/**
 * Hash a token for secure storage (optional additional security)
 * @param token Token to hash
 * @returns Hashed token
 */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
/**
 * Generate a secure session ID
 * @returns Secure session identifier
 */
export function generateSessionId() {
  return generateSecureToken(16); // 32 character hex string
}
//# sourceMappingURL=tokens.js.map
