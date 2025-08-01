import express from "express";
import {
  authenticateToken,
  requireVerified,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { supportController } from "../controllers/supportController.js";
import Joi from "joi";

const router = express.Router();

// Validation schemas
const supportRequestSchema = Joi.object({
  type: Joi.string().valid("general", "bug", "feature").required(),
  priority: Joi.string().valid("low", "medium", "high", "urgent").required(),
  category: Joi.string().required(),
  subject: Joi.string().min(5).max(200).required(),
  message: Joi.string().min(10).max(2000).required(),
  systemInfo: Joi.object({
    appVersion: Joi.string().optional(),
    platform: Joi.string().optional(),
    userAgent: Joi.string().optional(),
  }).optional(),
});

const bugReportSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  stepsToReproduce: Joi.string().max(1000).optional().allow(""),
  expectedBehavior: Joi.string().max(1000).optional().allow(""),
  actualBehavior: Joi.string().max(1000).optional().allow(""),
  priority: Joi.string().valid("low", "medium", "high", "critical").required(),
  category: Joi.string().required(),
  systemInfo: Joi.object({
    appVersion: Joi.string().optional(),
    platform: Joi.string().optional(),
    userAgent: Joi.string().optional(),
  }).optional(),
});

const featureRequestSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  useCase: Joi.string().max(1000).optional().allow(""),
  priority: Joi.string().valid("low", "medium", "high").required(),
  category: Joi.string().required(),
});

// POST /api/support/contact - Submit general support request
router.post(
  "/contact",
  authenticateToken,
  requireVerified,
  validate(supportRequestSchema, "body"),
  async (req: AuthenticatedRequest, res) => {
    try {
      await supportController.submitSupportRequest(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// POST /api/support/bug-report - Submit bug report
router.post(
  "/bug-report",
  authenticateToken,
  requireVerified,
  validate(bugReportSchema, "body"),
  async (req: AuthenticatedRequest, res) => {
    try {
      await supportController.submitBugReport(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// POST /api/support/feature-request - Submit feature request
router.post(
  "/feature-request",
  authenticateToken,
  requireVerified,
  validate(featureRequestSchema, "body"),
  async (req: AuthenticatedRequest, res) => {
    try {
      await supportController.submitFeatureRequest(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

export default router;
