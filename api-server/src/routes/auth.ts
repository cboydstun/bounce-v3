import express from "express";
import { authController } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  sanitizeBody,
} from "../middleware/validation.js";

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeBody);

// POST /api/auth/contractor/register - Contractor registration
router.post(
  "/contractor/register",
  validateRegistration,
  authController.register,
);

// POST /api/auth/contractor/login - Contractor authentication
router.post("/contractor/login", validateLogin, authController.login);

// POST /api/auth/contractor/refresh - Refresh access token
router.post(
  "/contractor/refresh",
  validateRefreshToken,
  authController.refresh,
);

// POST /api/auth/contractor/logout - Logout contractor
router.post("/contractor/logout", authenticateToken, authController.logout);

// POST /api/auth/contractor/forgot-password - Request password reset
router.post(
  "/contractor/forgot-password",
  validateForgotPassword,
  authController.forgotPassword,
);

// POST /api/auth/contractor/reset-password - Reset password
router.post(
  "/contractor/reset-password",
  validateResetPassword,
  authController.resetPassword,
);

// GET /api/auth/contractor/verify-email/:token - Verify email address via browser link
router.get("/contractor/verify-email/:token", authController.verifyEmailGet);

// GET /api/auth/contractor/verify - Verify JWT token
router.get("/contractor/verify", authenticateToken, authController.verifyToken);

// POST /api/auth/contractor/verify-email - Verify email address
router.post(
  "/contractor/verify-email",
  validateVerifyEmail,
  authController.verifyEmail,
);

export default router;
