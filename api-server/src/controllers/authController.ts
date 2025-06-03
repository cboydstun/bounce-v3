import { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import ContractorAuth, {
  IContractorAuthDocument,
} from "../models/ContractorAuth.js";
import { jwtService, JWTPayload } from "../utils/jwt.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordChangeAlert,
} from "../utils/emailService.js";
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  generateExpirationDate,
  isTokenExpired,
  hashToken,
} from "../utils/tokens.js";

interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  skills?: string[];
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface VerifyEmailRequest {
  token: string;
}

class AuthController {
  /**
   * Register a new contractor
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, password, skills }: RegisterRequest =
        req.body;

      logger.info("Registration attempt", { email, name });

      // Check if contractor already exists
      const existingContractor = await ContractorAuth.findByEmail(email);
      if (existingContractor) {
        logger.warn("Registration failed - email already exists", { email });
        res.status(409).json({
          error: "An account with this email already exists",
          code: "EMAIL_ALREADY_EXISTS",
        });
        return;
      }

      // Generate email verification token
      const verificationToken = generateEmailVerificationToken();
      const verificationExpires = generateExpirationDate(24); // 24 hours

      // Create contractor (password will be hashed by pre-save hook)
      const contractor = await ContractorAuth.create({
        name,
        email,
        phone,
        password,
        skills: skills || [],
        isActive: true,
        isVerified: false,
        resetPasswordToken: verificationToken,
        resetPasswordExpires: verificationExpires,
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, name, verificationToken);
        logger.info("Verification email sent", {
          email,
          contractorId: contractor._id.toString(),
        });
      } catch (emailError) {
        logger.error("Failed to send verification email", {
          error: emailError,
          email,
          contractorId: contractor._id.toString(),
        });
        // Continue with registration even if email fails
      }

      // Return success response (without sensitive data)
      res.status(201).json({
        message:
          "Registration successful. Please check your email to verify your account.",
        contractor: {
          id: contractor._id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          skills: contractor.skills,
          isVerified: contractor.isVerified,
          createdAt: contractor.createdAt,
        },
      });
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json({
        error: "Registration failed",
        code: "REGISTRATION_FAILED",
      });
    }
  }

  /**
   * Authenticate contractor and return JWT tokens
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      logger.info("Login attempt", { email });

      // Find contractor by email
      const contractor = await ContractorAuth.findByEmail(email);
      if (!contractor) {
        logger.warn("Login failed - contractor not found", { email });
        res.status(401).json({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      // Check if account is active
      if (!contractor.isActive) {
        logger.warn("Login failed - account inactive", {
          email,
          contractorId: contractor._id.toString(),
        });
        res.status(403).json({
          error: "Account is deactivated. Please contact support.",
          code: "ACCOUNT_INACTIVE",
        });
        return;
      }

      // Verify password
      const isPasswordValid = await contractor.comparePassword(password);
      if (!isPasswordValid) {
        logger.warn("Login failed - invalid password", {
          email,
          contractorId: contractor._id.toString(),
        });
        res.status(401).json({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      // Generate JWT tokens
      const payload: JWTPayload = {
        contractorId: contractor._id.toString(),
        email: contractor.email,
        name: contractor.name,
        isVerified: contractor.isVerified,
      };

      const { accessToken, refreshToken } =
        jwtService.generateTokenPair(payload);

      // Store refresh token in database
      contractor.refreshTokens.push(refreshToken);
      contractor.lastLogin = new Date();
      await contractor.save();

      logger.info("Login successful", {
        email,
        contractorId: contractor._id.toString(),
        isVerified: contractor.isVerified,
      });

      // Return tokens and contractor data
      res.json({
        message: "Login successful",
        accessToken,
        refreshToken,
        contractor: {
          id: contractor._id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          skills: contractor.skills,
          isVerified: contractor.isVerified,
          isActive: contractor.isActive,
          lastLogin: contractor.lastLogin,
          quickbooksConnected: contractor.quickbooksConnected,
        },
      });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({
        error: "Login failed",
        code: "LOGIN_FAILED",
      });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;

      logger.info("Token refresh attempt");

      // Verify refresh token
      let decoded;
      try {
        decoded = jwtService.verifyRefreshToken(refreshToken);
      } catch (error) {
        logger.warn("Token refresh failed - invalid token", {
          error: (error as Error).message,
        });
        res.status(401).json({
          error: "Invalid refresh token",
          code: "INVALID_REFRESH_TOKEN",
        });
        return;
      }

      // Find contractor and verify refresh token exists
      const contractor = await ContractorAuth.findById(decoded.contractorId);
      if (!contractor || !contractor.refreshTokens.includes(refreshToken)) {
        logger.warn("Token refresh failed - token not found in database", {
          contractorId: decoded.contractorId,
        });
        res.status(401).json({
          error: "Invalid refresh token",
          code: "INVALID_REFRESH_TOKEN",
        });
        return;
      }

      // Check if account is still active
      if (!contractor.isActive) {
        logger.warn("Token refresh failed - account inactive", {
          contractorId: contractor._id.toString(),
        });
        res.status(403).json({
          error: "Account is deactivated",
          code: "ACCOUNT_INACTIVE",
        });
        return;
      }

      // Generate new access token
      const payload: JWTPayload = {
        contractorId: contractor._id.toString(),
        email: contractor.email,
        name: contractor.name,
        isVerified: contractor.isVerified,
      };

      const newAccessToken = jwtService.generateAccessToken(payload);

      // Optionally rotate refresh token for enhanced security
      const shouldRotateRefreshToken =
        process.env.ROTATE_REFRESH_TOKENS === "true";
      let newRefreshToken = refreshToken;

      if (shouldRotateRefreshToken) {
        // Remove old refresh token and generate new one
        contractor.removeRefreshToken(refreshToken);
        newRefreshToken = jwtService.generateRefreshToken(
          contractor._id.toString(),
        );
        contractor.refreshTokens.push(newRefreshToken);
        await contractor.save();
      }

      logger.info("Token refresh successful", {
        contractorId: contractor._id.toString(),
        rotated: shouldRotateRefreshToken,
      });

      res.json({
        message: "Token refresh successful",
        accessToken: newAccessToken,
        ...(shouldRotateRefreshToken && { refreshToken: newRefreshToken }),
      });
    } catch (error) {
      logger.error("Token refresh error:", error);
      res.status(500).json({
        error: "Token refresh failed",
        code: "REFRESH_FAILED",
      });
    }
  }

  /**
   * Logout contractor and invalidate refresh token
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;
      const refreshToken = req.body.refreshToken;

      logger.info("Logout attempt", { contractorId });

      if (!contractorId) {
        res.status(401).json({
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      // Find contractor and remove refresh token
      const contractor = await ContractorAuth.findById(contractorId);
      if (contractor && refreshToken) {
        contractor.removeRefreshToken(refreshToken);
        await contractor.save();
      }

      logger.info("Logout successful", { contractorId });

      res.json({
        message: "Logout successful",
      });
    } catch (error) {
      logger.error("Logout error:", error);
      res.status(500).json({
        error: "Logout failed",
        code: "LOGOUT_FAILED",
      });
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email }: ForgotPasswordRequest = req.body;

      logger.info("Forgot password attempt", { email });

      // Find contractor by email
      const contractor = await ContractorAuth.findByEmail(email);
      if (!contractor) {
        // Don't reveal if email exists or not for security
        logger.warn("Forgot password - email not found", { email });
        res.json({
          message:
            "If an account with this email exists, a password reset link has been sent.",
        });
        return;
      }

      // Check if account is active
      if (!contractor.isActive) {
        logger.warn("Forgot password - account inactive", {
          email,
          contractorId: contractor._id.toString(),
        });
        res.json({
          message:
            "If an account with this email exists, a password reset link has been sent.",
        });
        return;
      }

      // Generate reset token
      const resetToken = generatePasswordResetToken();
      const resetExpires = generateExpirationDate(1); // 1 hour

      // Save reset token to database
      contractor.resetPasswordToken = resetToken;
      contractor.resetPasswordExpires = resetExpires;
      await contractor.save();

      // Send password reset email
      try {
        await sendPasswordResetEmail(email, contractor.name, resetToken);
        logger.info("Password reset email sent", {
          email,
          contractorId: contractor._id.toString(),
        });
      } catch (emailError) {
        logger.error("Failed to send password reset email", {
          error: emailError,
          email,
          contractorId: contractor._id.toString(),
        });
        // Continue with success response even if email fails
      }

      res.json({
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    } catch (error) {
      logger.error("Forgot password error:", error);
      res.status(500).json({
        error: "Password reset request failed",
        code: "FORGOT_PASSWORD_FAILED",
      });
    }
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password }: ResetPasswordRequest = req.body;

      logger.info("Reset password attempt", {
        token: token.substring(0, 8) + "...",
      });

      // Find contractor by reset token
      const contractor = await ContractorAuth.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!contractor) {
        logger.warn("Reset password failed - invalid or expired token", {
          token: token.substring(0, 8) + "...",
        });
        res.status(400).json({
          error: "Invalid or expired reset token",
          code: "INVALID_RESET_TOKEN",
        });
        return;
      }

      // Check if account is active
      if (!contractor.isActive) {
        logger.warn("Reset password failed - account inactive", {
          contractorId: contractor._id.toString(),
        });
        res.status(403).json({
          error: "Account is deactivated",
          code: "ACCOUNT_INACTIVE",
        });
        return;
      }

      // Update password (will be hashed by pre-save hook)
      contractor.password = password;
      contractor.resetPasswordToken = undefined;
      contractor.resetPasswordExpires = undefined;

      // Invalidate all existing refresh tokens for security
      contractor.refreshTokens = [];

      await contractor.save();

      // Send security alert email
      try {
        await sendPasswordChangeAlert(contractor.email, contractor.name);
        logger.info("Password change alert sent", {
          contractorId: contractor._id.toString(),
        });
      } catch (emailError) {
        logger.error("Failed to send password change alert", {
          error: emailError,
          contractorId: contractor._id.toString(),
        });
        // Continue with success response even if email fails
      }

      logger.info("Password reset successful", {
        contractorId: contractor._id.toString(),
      });

      res.json({
        message:
          "Password reset successful. Please log in with your new password.",
      });
    } catch (error) {
      logger.error("Reset password error:", error);
      res.status(500).json({
        error: "Password reset failed",
        code: "RESET_PASSWORD_FAILED",
      });
    }
  }

  /**
   * Verify email address using verification token (GET request for browser links)
   */
  async verifyEmailGet(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Verification Failed</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error { color: #e74c3c; }
              .icon { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">❌</div>
              <h1 class="error">Verification Failed</h1>
              <p>No verification token provided.</p>
              <p>Please use the link from your verification email.</p>
            </div>
          </body>
          </html>
        `);
        return;
      }

      logger.info("Email verification attempt via GET", {
        token: token.substring(0, 8) + "...",
      });

      // Find contractor by verification token (stored in resetPasswordToken field)
      const contractor = await ContractorAuth.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
        isVerified: false,
      });

      if (!contractor) {
        logger.warn("Email verification failed - invalid or expired token", {
          token: token.substring(0, 8) + "...",
        });

        // Return HTML response for browser
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Verification Failed</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error { color: #e74c3c; }
              .icon { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">❌</div>
              <h1 class="error">Verification Failed</h1>
              <p>The verification link is invalid or has expired.</p>
              <p>Please request a new verification email or contact support.</p>
            </div>
          </body>
          </html>
        `);
        return;
      }

      // Verify email
      contractor.isVerified = true;
      contractor.resetPasswordToken = undefined;
      contractor.resetPasswordExpires = undefined;
      await contractor.save();

      // Send welcome email
      try {
        await sendWelcomeEmail(contractor.email, contractor.name);
        logger.info("Welcome email sent", {
          contractorId: contractor._id.toString(),
        });
      } catch (emailError) {
        logger.error("Failed to send welcome email", {
          error: emailError,
          contractorId: contractor._id.toString(),
        });
        // Continue with success response even if email fails
      }

      logger.info("Email verification successful via GET", {
        contractorId: contractor._id.toString(),
      });

      // Return HTML success response for browser
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verified Successfully</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #27ae60; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1 class="success">Email Verified!</h1>
            <p>Congratulations! Your email has been successfully verified.</p>
            <p>Your contractor account is now active and you can start using the mobile app.</p>
            <p><strong>Welcome to the Bounce House Contractor Network!</strong></p>
            <a href="#" class="button">Download Mobile App</a>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      logger.error("Email verification error (GET):", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Error</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #e74c3c; }
            .icon { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⚠️</div>
            <h1 class="error">Something went wrong</h1>
            <p>An error occurred while verifying your email.</p>
            <p>Please try again or contact support.</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  /**
   * Verify JWT token and return contractor info
   */
  async verifyToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const contractorId = req.contractor?.contractorId;

      if (!contractorId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      // Find contractor to ensure they still exist and are active
      const contractor = await ContractorAuth.findById(contractorId);
      if (!contractor) {
        logger.warn("Token verification failed - contractor not found", {
          contractorId,
        });
        res.status(401).json({
          success: false,
          error: "Contractor not found",
          code: "CONTRACTOR_NOT_FOUND",
        });
        return;
      }

      if (!contractor.isActive) {
        logger.warn("Token verification failed - account inactive", {
          contractorId,
        });
        res.status(403).json({
          success: false,
          error: "Account is deactivated",
          code: "ACCOUNT_INACTIVE",
        });
        return;
      }

      logger.info("Token verification successful", {
        contractorId,
        email: contractor.email,
      });

      res.json({
        success: true,
        message: "Token is valid",
        contractor: {
          id: contractor._id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          skills: contractor.skills,
          isVerified: contractor.isVerified,
          isActive: contractor.isActive,
          quickbooksConnected: contractor.quickbooksConnected,
        },
      });
    } catch (error) {
      logger.error("Token verification error:", error);
      res.status(500).json({
        success: false,
        error: "Token verification failed",
        code: "VERIFICATION_FAILED",
      });
    }
  }

  /**
   * Verify email address using verification token
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token }: VerifyEmailRequest = req.body;

      logger.info("Email verification attempt", {
        token: token.substring(0, 8) + "...",
      });

      // Find contractor by verification token (stored in resetPasswordToken field)
      const contractor = await ContractorAuth.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
        isVerified: false,
      });

      if (!contractor) {
        logger.warn("Email verification failed - invalid or expired token", {
          token: token.substring(0, 8) + "...",
        });
        res.status(400).json({
          error: "Invalid or expired verification token",
          code: "INVALID_VERIFICATION_TOKEN",
        });
        return;
      }

      // Verify email
      contractor.isVerified = true;
      contractor.resetPasswordToken = undefined;
      contractor.resetPasswordExpires = undefined;
      await contractor.save();

      // Send welcome email
      try {
        await sendWelcomeEmail(contractor.email, contractor.name);
        logger.info("Welcome email sent", {
          contractorId: contractor._id.toString(),
        });
      } catch (emailError) {
        logger.error("Failed to send welcome email", {
          error: emailError,
          contractorId: contractor._id.toString(),
        });
        // Continue with success response even if email fails
      }

      logger.info("Email verification successful", {
        contractorId: contractor._id.toString(),
      });

      res.json({
        message: "Email verification successful. Your account is now active.",
        contractor: {
          id: contractor._id,
          name: contractor.name,
          email: contractor.email,
          isVerified: contractor.isVerified,
        },
      });
    } catch (error) {
      logger.error("Email verification error:", error);
      res.status(500).json({
        error: "Email verification failed",
        code: "VERIFICATION_FAILED",
      });
    }
  }
}

export const authController = new AuthController();
export default authController;
