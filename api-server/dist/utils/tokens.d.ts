/**
 * Generate a secure random token
 * @param length Token length in bytes (default: 32)
 * @returns Hex-encoded token string
 */
export declare function generateSecureToken(length?: number): string;
/**
 * Generate email verification token
 * @returns Secure token for email verification
 */
export declare function generateEmailVerificationToken(): string;
/**
 * Generate password reset token
 * @returns Secure token for password reset
 */
export declare function generatePasswordResetToken(): string;
/**
 * Generate a time-based expiration date
 * @param hours Hours from now (default: 24)
 * @returns Date object representing expiration time
 */
export declare function generateExpirationDate(hours?: number): Date;
/**
 * Check if a token has expired
 * @param expirationDate Expiration date to check
 * @returns True if expired, false otherwise
 */
export declare function isTokenExpired(expirationDate: Date): boolean;
/**
 * Hash a token for secure storage (optional additional security)
 * @param token Token to hash
 * @returns Hashed token
 */
export declare function hashToken(token: string): string;
/**
 * Generate a secure session ID
 * @returns Secure session identifier
 */
export declare function generateSessionId(): string;
//# sourceMappingURL=tokens.d.ts.map