export interface EmailData {
  to: string | string[];
  from: string;
  subject: string;
  text: string;
  html?: string;
}
/**
 * Send an email using SendGrid
 * @param emailData The email data to send
 */
export declare function sendEmail(emailData: EmailData): Promise<void>;
/**
 * Send email verification email to contractor
 * @param email Contractor's email address
 * @param name Contractor's name
 * @param verificationToken Verification token
 */
export declare function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string,
): Promise<void>;
/**
 * Send password reset email to contractor
 * @param email Contractor's email address
 * @param name Contractor's name
 * @param resetToken Password reset token
 */
export declare function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
): Promise<void>;
/**
 * Send welcome email after email verification
 * @param email Contractor's email address
 * @param name Contractor's name
 */
export declare function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<void>;
/**
 * Send security alert email for password changes
 * @param email Contractor's email address
 * @param name Contractor's name
 */
export declare function sendPasswordChangeAlert(
  email: string,
  name: string,
): Promise<void>;
//# sourceMappingURL=emailService.d.ts.map
