import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  registerDeviceToken,
  unregisterDeviceToken,
  getDeviceTokens,
  testPushNotification,
} from "../controllers/deviceTokenController.js";

const router = Router();

/**
 * @route POST /api/contractors/register-device
 * @desc Register a device token for push notifications
 * @access Private
 */
router.post("/register-device", authenticateToken, registerDeviceToken);

/**
 * @route POST /api/contractors/unregister-device
 * @desc Unregister a device token
 * @access Private
 */
router.post("/unregister-device", authenticateToken, unregisterDeviceToken);

/**
 * @route GET /api/contractors/devices
 * @desc Get contractor's registered device tokens (for debugging)
 * @access Private
 */
router.get("/devices", authenticateToken, getDeviceTokens);

/**
 * @route POST /api/contractors/test-notification
 * @desc Send test push notification (for debugging)
 * @access Private
 */
router.post("/test-notification", authenticateToken, testPushNotification);

export default router;
