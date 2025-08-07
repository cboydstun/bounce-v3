import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import ContractorAuth from "../models/ContractorAuth.js";
import { pushNotificationService } from "../services/pushNotificationService.js";

/**
 * Register a device token for push notifications
 */
export const registerDeviceToken = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { token, platform } = req.body;
    const contractorId = req.contractor?.contractorId;

    if (!contractorId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Device token is required",
        },
      });
    }

    // Find the contractor
    const contractor = await ContractorAuth.findById(contractorId);
    if (!contractor) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Contractor not found",
        },
      });
    }

    // Check if token already exists
    if (contractor.deviceTokens && contractor.deviceTokens.includes(token)) {
      return res.json({
        success: true,
        message: "Device token already registered",
        data: {
          tokenCount: contractor.deviceTokens.length,
        },
      });
    }

    // Add the token to the contractor's device tokens
    if (!contractor.deviceTokens) {
      contractor.deviceTokens = [];
    }
    contractor.deviceTokens.push(token);

    // Keep only the last 5 tokens per contractor (in case they have multiple devices)
    if (contractor.deviceTokens.length > 5) {
      contractor.deviceTokens = contractor.deviceTokens.slice(-5);
    }

    await contractor.save();

    console.log(`📱 Device token registered for contractor ${contractorId}:`, {
      platform: platform || "unknown",
      tokenPreview: token.substring(0, 20) + "...",
      totalTokens: contractor.deviceTokens.length,
    });

    return res.json({
      success: true,
      message: "Device token registered successfully",
      data: {
        tokenCount: contractor.deviceTokens.length,
        pushNotificationsAvailable: pushNotificationService.isAvailable(),
      },
    });
  } catch (error) {
    console.error("❌ Error registering device token:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to register device token",
      },
    });
  }
};

/**
 * Unregister a device token
 */
export const unregisterDeviceToken = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { token } = req.body;
    const contractorId = req.contractor?.contractorId;

    if (!contractorId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Device token is required",
        },
      });
    }

    // Remove the token from the contractor's device tokens
    const result = await ContractorAuth.updateOne(
      { _id: contractorId },
      { $pull: { deviceTokens: token } },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Device token not found or contractor not found",
        },
      });
    }

    console.log(
      `🗑️ Device token unregistered for contractor ${contractorId}:`,
      {
        tokenPreview: token.substring(0, 20) + "...",
      },
    );

    return res.json({
      success: true,
      message: "Device token unregistered successfully",
    });
  } catch (error) {
    console.error("❌ Error unregistering device token:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to unregister device token",
      },
    });
  }
};

/**
 * Get contractor's registered device tokens (for debugging)
 */
export const getDeviceTokens = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor?.contractorId;

    if (!contractorId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const contractor =
      await ContractorAuth.findById(contractorId).select("deviceTokens");
    if (!contractor) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Contractor not found",
        },
      });
    }

    const tokens = contractor.deviceTokens || [];

    return res.json({
      success: true,
      data: {
        tokenCount: tokens.length,
        tokens: tokens.map((token) => ({
          preview: token.substring(0, 20) + "...",
          length: token.length,
        })),
        pushNotificationsAvailable: pushNotificationService.isAvailable(),
      },
    });
  } catch (error) {
    console.error("❌ Error getting device tokens:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get device tokens",
      },
    });
  }
};

/**
 * Test push notification (for debugging)
 */
export const testPushNotification = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor?.contractorId;

    if (!contractorId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!pushNotificationService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Push notifications are not configured",
        },
      });
    }

    // Send test notification to all contractors (for now)
    await pushNotificationService.testNotification();

    return res.json({
      success: true,
      message: "Test notification sent to all contractors",
    });
  } catch (error) {
    console.error("❌ Error sending test notification:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to send test notification",
      },
    });
  }
};
