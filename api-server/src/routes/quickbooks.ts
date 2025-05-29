import { Router } from "express";
import { authenticateToken, requireVerified } from "../middleware/auth.js";
import { validateW9Form, validateW9Update } from "../middleware/validation.js";
import {
  connectQuickBooks,
  handleQuickBooksCallback,
  disconnectQuickBooks,
  getQuickBooksStatus,
  submitW9Form,
  getW9Status,
  updateW9Form,
  downloadW9PDF,
  syncContractor,
  getSyncStatus,
} from "../controllers/quickbooksController.js";

const router = Router();

// GET /api/quickbooks - Get available QuickBooks endpoints
router.get("/", (req, res) => {
  res.json({
    message: "QuickBooks API endpoints",
    endpoints: {
      "GET /auth-url": "Get QuickBooks authorization URL",
      "POST /connect": "Connect to QuickBooks (same as auth-url but POST)",
      "GET /callback": "Handle QuickBooks OAuth callback",
      "POST /disconnect": "Disconnect from QuickBooks",
      "GET /status": "Get QuickBooks connection status",
      "POST /w9/submit": "Submit W-9 tax form",
      "GET /w9/status": "Get W-9 form status",
      "PUT /w9/update": "Update W-9 form",
      "GET /w9/download": "Download W-9 PDF",
      "POST /sync/contractor": "Sync contractor to QuickBooks",
      "GET /sync/status": "Get sync status",
    },
  });
});

// GET /api/quickbooks/auth-url - Get QuickBooks authorization URL
router.get("/auth-url", authenticateToken, requireVerified, connectQuickBooks);

// QuickBooks Connection Routes
router.post("/connect", authenticateToken, requireVerified, connectQuickBooks);
router.get("/callback", handleQuickBooksCallback);
router.post(
  "/disconnect",
  authenticateToken,
  requireVerified,
  disconnectQuickBooks,
);
router.get("/status", authenticateToken, getQuickBooksStatus);

// W-9 Form Routes
router.post(
  "/w9/submit",
  authenticateToken,
  requireVerified,
  validateW9Form,
  submitW9Form,
);
router.get("/w9/status", authenticateToken, getW9Status);
router.put(
  "/w9/update",
  authenticateToken,
  requireVerified,
  validateW9Update,
  updateW9Form,
);
router.get("/w9/download", authenticateToken, downloadW9PDF);

// Contractor Sync Routes
router.post(
  "/sync/contractor",
  authenticateToken,
  requireVerified,
  syncContractor,
);
router.get("/sync/status", authenticateToken, getSyncStatus);

export default router;
