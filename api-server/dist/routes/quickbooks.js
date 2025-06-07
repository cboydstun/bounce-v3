import express from "express";
import { quickbooksController } from "../controllers/quickbooksController.js";
import { authenticateToken, requireVerified } from "../middleware/auth.js";
const router = express.Router();
// ============================================================================
// W-9 Form Routes
// ============================================================================
/**
 * GET /api/quickbooks/w9/status
 * Get W-9 form status for the authenticated contractor
 */
router.get("/w9/status", authenticateToken, requireVerified, (req, res) => {
    quickbooksController.getW9Status(req, res);
});
/**
 * POST /api/quickbooks/w9/submit
 * Submit W-9 form
 */
router.post("/w9/submit", authenticateToken, requireVerified, (req, res) => {
    quickbooksController.submitW9Form(req, res);
});
/**
 * PUT /api/quickbooks/w9/update
 * Update W-9 form (draft only)
 */
router.put("/w9/update", authenticateToken, requireVerified, (req, res) => {
    quickbooksController.updateW9Form(req, res);
});
/**
 * GET /api/quickbooks/w9/download
 * Download W-9 PDF
 */
router.get("/w9/download", authenticateToken, requireVerified, (req, res) => {
    quickbooksController.downloadW9PDF(req, res);
});
// ============================================================================
// QuickBooks Integration Routes
// ============================================================================
/**
 * GET /api/quickbooks/sync/status
 * Get QuickBooks integration status
 */
router.get("/sync/status", authenticateToken, requireVerified, (req, res) => {
    quickbooksController.getQuickBooksStatus(req, res);
});
/**
 * POST /api/quickbooks/connect
 * Initiate QuickBooks connection
 */
router.post("/connect", authenticateToken, requireVerified, (req, res) => {
    quickbooksController.connectQuickBooks(req, res);
});
/**
 * POST /api/quickbooks/sync/contractor
 * Sync contractor data with QuickBooks
 */
router.post("/sync/contractor", authenticateToken, requireVerified, (req, res) => {
    quickbooksController.syncContractor(req, res);
});
/**
 * GET /api/quickbooks/callback
 * Handle QuickBooks OAuth callback
 * Note: This endpoint doesn't require authentication as it's called by QuickBooks
 */
router.get("/callback", (req, res) => {
    quickbooksController.handleOAuthCallback(req, res);
});
export default router;
//# sourceMappingURL=quickbooks.js.map