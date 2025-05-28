import sgMail from "@sendgrid/mail";
import { logger } from "./logger.js";
// Lazy initialization flag
let isInitialized = false;
// Initialize SendGrid with API key (called lazily)
function initializeSendGrid() {
  if (isInitialized) return;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.warn("SENDGRID_API_KEY not set in environment variables");
    return;
  }
  sgMail.setApiKey(apiKey);
  isInitialized = true;
}
/**
 * Send an email using SendGrid
 * @param emailData The email data to send
 */
export async function sendEmail(emailData) {
  initializeSendGrid();
  try {
    await sgMail.send(emailData);
    logger.info("Email sent successfully", {
      to: emailData.to,
      subject: emailData.subject,
    });
  } catch (error) {
    logger.error("Error sending email with SendGrid:", error);
    throw error;
  }
}
/**
 * Send email verification email to contractor
 * @param email Contractor's email address
 * @param name Contractor's name
 * @param verificationToken Verification token
 */
export async function sendVerificationEmail(email, name, verificationToken) {
  const verificationUrl = `http://localhost:4000/api/auth/contractor/verify-email/${verificationToken}`;
  const emailData = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Verify Your Bounce House Contractor Account",
    text: `
Hi ${name},

Welcome to the Bounce House Contractor Network!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
The Bounce House Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to the Team!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
    <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
    
    <p>Welcome to the Bounce House Contractor Network! We're excited to have you join our team of professional contractors.</p>
    
    <p>To get started, please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="color: #666; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
    
    <p>Best regards,<br>The Bounce House Team</p>
  </div>
</body>
</html>
    `.trim(),
  };
  await sendEmail(emailData);
}
/**
 * Send password reset email to contractor
 * @param email Contractor's email address
 * @param name Contractor's name
 * @param resetToken Password reset token
 */
export async function sendPasswordResetEmail(email, name, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const emailData = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Reset Your Password - Bounce House Contractor",
    text: `
Hi ${name},

You requested a password reset for your Bounce House Contractor account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The Bounce House Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
    <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
    
    <p>You requested a password reset for your Bounce House Contractor account.</p>
    
    <p>Click the button below to reset your password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #ff6b6b;">${resetUrl}</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
    
    <p>Best regards,<br>The Bounce House Team</p>
  </div>
</body>
</html>
    `.trim(),
  };
  await sendEmail(emailData);
}
/**
 * Send welcome email after email verification
 * @param email Contractor's email address
 * @param name Contractor's name
 */
export async function sendWelcomeEmail(email, name) {
  const emailData = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Welcome to the Bounce House Contractor Network!",
    text: `
Hi ${name},

Congratulations! Your email has been verified and your contractor account is now active.

You can now:
- View and claim available tasks
- Update your profile and skills
- Receive real-time notifications
- Track your earnings

Download our mobile app to get started:
- iOS: Coming soon
- Android: Coming soon

If you have any questions, feel free to reach out to our support team.

Welcome aboard!

Best regards,
The Bounce House Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Team!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to the Team!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
    <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
    
    <p>Congratulations! Your email has been verified and your contractor account is now active.</p>
    
    <h3 style="color: #2ecc71;">You can now:</h3>
    <ul style="color: #555;">
      <li>View and claim available tasks</li>
      <li>Update your profile and skills</li>
      <li>Receive real-time notifications</li>
      <li>Track your earnings</li>
    </ul>
    
    <h3 style="color: #2ecc71;">Download our mobile app:</h3>
    <div style="text-align: center; margin: 20px 0;">
      <p style="color: #666;">Coming soon to iOS and Android!</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p>If you have any questions, feel free to reach out to our support team.</p>
    
    <p><strong>Welcome aboard!</strong></p>
    
    <p>Best regards,<br>The Bounce House Team</p>
  </div>
</body>
</html>
    `.trim(),
  };
  await sendEmail(emailData);
}
/**
 * Send security alert email for password changes
 * @param email Contractor's email address
 * @param name Contractor's name
 */
export async function sendPasswordChangeAlert(email, name) {
  const emailData = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Password Changed - Bounce House Contractor",
    text: `
Hi ${name},

This is a security notification to confirm that your password was successfully changed.

If you made this change, no further action is required.

If you did not change your password, please contact our support team immediately and consider changing your password again.

Best regards,
The Bounce House Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Security Alert</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
    <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
    
    <p>This is a security notification to confirm that your password was successfully changed.</p>
    
    <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #2ecc71; margin: 20px 0;">
      <p style="margin: 0; color: #2ecc71; font-weight: bold;">✓ If you made this change, no further action is required.</p>
    </div>
    
    <div style="background: #fdf2e8; padding: 15px; border-radius: 5px; border-left: 4px solid #f39c12; margin: 20px 0;">
      <p style="margin: 0; color: #f39c12; font-weight: bold;">⚠ If you did not change your password, please contact our support team immediately and consider changing your password again.</p>
    </div>
    
    <p>Best regards,<br>The Bounce House Team</p>
  </div>
</body>
</html>
    `.trim(),
  };
  await sendEmail(emailData);
}
//# sourceMappingURL=emailService.js.map
