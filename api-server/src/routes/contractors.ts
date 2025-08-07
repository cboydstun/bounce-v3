import express from "express";
import {
  authenticateToken,
  requireVerified,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  authenticateInternalAPI,
  InternalAuthRequest,
} from "../middleware/internalAuth.js";
import { contractorController } from "../controllers/contractorController.js";
import {
  registerDeviceToken,
  unregisterDeviceToken,
  getDeviceTokens,
  testPushNotification,
} from "../controllers/deviceTokenController.js";
import ContractorAuth from "../models/ContractorAuth.js";
import { pushNotificationService } from "../services/pushNotificationService.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// GET /api/contractors/me - Get contractor profile
router.get("/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    await contractorController.getProfile(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});

// PUT /api/contractors/me - Update contractor profile
router.put(
  "/me",
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res) => {
    try {
      await contractorController.updateProfile(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// POST /api/contractors/me/photo - Update contractor profile photo
router.post(
  "/me/photo",
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res) => {
    try {
      await contractorController.updateProfilePhoto(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// GET /api/contractors/earnings-summary - Get contractor earnings summary
router.get(
  "/earnings-summary",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      await contractorController.getEarningsSummary(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// GET /api/contractors/payment-history - Get contractor payment history
router.get(
  "/payment-history",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      await contractorController.getPaymentHistory(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// GET /api/contractors/earnings-details - Get contractor earnings details
router.get(
  "/earnings-details",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      await contractorController.getEarningsDetails(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// POST /api/contractors/register-device - Register device token for push notifications
router.post("/register-device", authenticateToken, registerDeviceToken);

// POST /api/contractors/unregister-device - Unregister device token
router.post("/unregister-device", authenticateToken, unregisterDeviceToken);

// GET /api/contractors/devices - Get registered device tokens (for debugging)
router.get("/devices", authenticateToken, getDeviceTokens);

// POST /api/contractors/test-notification - Send test push notification (for debugging)
router.post("/test-notification", authenticateToken, testPushNotification);

/**
 * POST /api/contractors/send-push-notification
 * Send FCM push notifications to contractors (for CRM task broadcasts)
 * MISSION CRITICAL: This endpoint enables background notifications when app is closed
 */
router.post(
  "/send-push-notification",
  authenticateInternalAPI,
  async (req: InternalAuthRequest, res) => {
    try {
      const { title, message, priority, data, contractorIds, metadata } =
        req.body;

      logger.info(
        "🚨 MISSION CRITICAL: FCM push notification request received",
        {
          title,
          contractorCount: contractorIds?.length || 0,
          priority,
          source: metadata?.source,
          critical: metadata?.critical,
          timestamp: new Date().toISOString(),
        },
      );

      // Validate required fields
      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: "Title and message are required for push notifications",
        });
      }

      if (
        !contractorIds ||
        !Array.isArray(contractorIds) ||
        contractorIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "contractorIds array is required and must not be empty",
        });
      }

      // Get device tokens for active contractors
      logger.info(
        `📲 Fetching device tokens for ${contractorIds.length} contractors...`,
      );

      const contractors = await ContractorAuth.find({
        _id: { $in: contractorIds },
        isActive: true,
        deviceTokens: { $exists: true, $not: { $size: 0 } },
      }).select("_id deviceTokens name email");

      // Collect all device tokens from all contractors
      const allTokens: string[] = [];
      contractors.forEach((contractor) => {
        if (contractor.deviceTokens && contractor.deviceTokens.length > 0) {
          allTokens.push(...contractor.deviceTokens);
        }
      });

      logger.info(
        `📱 Found ${allTokens.length} valid device tokens from ${contractors.length} contractors out of ${contractorIds.length} requested`,
      );

      if (allTokens.length === 0) {
        logger.warn("⚠️ No valid device tokens found for contractors", {
          requestedContractors: contractorIds.length,
          foundContractors: contractors.length,
          validTokens: allTokens.length,
        });

        return res.json({
          success: false,
          message: "No valid device tokens found for the specified contractors",
          details: {
            requestedContractors: contractorIds.length,
            foundContractors: contractors.length,
            validTokens: allTokens.length,
          },
        });
      }

      // Prepare notification payload
      const notificationPayload = {
        title,
        body: message,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          source: metadata?.source || "api",
          critical: metadata?.critical ? "true" : "false",
        },
      };

      // Send FCM push notifications using the service
      logger.info(
        `🔥 Sending FCM push notifications to ${allTokens.length} devices...`,
      );

      const result = await pushNotificationService.sendToTokens(
        allTokens,
        notificationPayload,
      );

      logger.info("✅ FCM push notifications sent successfully", {
        successCount: result.success,
        failureCount: result.failure,
        invalidTokens: result.invalidTokens.length,
        totalTokens: allTokens.length,
      });

      res.json({
        success: true,
        message: `FCM push notifications sent to ${result.success} devices`,
        details: {
          requestedContractors: contractorIds.length,
          foundContractors: contractors.length,
          validTokens: allTokens.length,
          successCount: result.success,
          failureCount: result.failure,
          invalidTokensRemoved: result.invalidTokens.length,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    } catch (error) {
      logger.error("❌ Critical error sending FCM push notifications:", error);

      res.status(500).json({
        success: false,
        message: "Failed to send FCM push notifications",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      return;
    }
  },
);

export default router;
