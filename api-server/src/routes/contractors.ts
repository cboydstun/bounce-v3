import express from "express";
import {
  authenticateToken,
  requireVerified,
  AuthenticatedRequest,
} from "../middleware/auth.js";
import { contractorController } from "../controllers/contractorController.js";
import {
  registerDeviceToken,
  unregisterDeviceToken,
  getDeviceTokens,
  testPushNotification,
} from "../controllers/deviceTokenController.js";

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

export default router;
