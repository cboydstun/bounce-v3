import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/contractor/register - Contractor registration
router.post('/contractor/register', authController.register);

// POST /api/auth/contractor/login - Contractor authentication
router.post('/contractor/login', authController.login);

// POST /api/auth/contractor/refresh - Refresh access token
router.post('/contractor/refresh', authController.refresh);

// POST /api/auth/contractor/logout - Logout contractor
router.post('/contractor/logout', authenticateToken, authController.logout);

// POST /api/auth/contractor/forgot-password - Request password reset
router.post('/contractor/forgot-password', authController.forgotPassword);

// POST /api/auth/contractor/reset-password - Reset password
router.post('/contractor/reset-password', authController.resetPassword);

// POST /api/auth/contractor/verify-email - Verify email address
router.post('/contractor/verify-email', authController.verifyEmail);

export default router;
