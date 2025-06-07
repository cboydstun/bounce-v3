import express from "express";
import { authenticateToken, requireVerified, } from "../middleware/auth.js";
import { contractorController } from "../controllers/contractorController.js";
const router = express.Router();
// GET /api/contractors/me - Get contractor profile
router.get("/me", authenticateToken, async (req, res) => {
    try {
        await contractorController.getProfile(req, res);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});
// PUT /api/contractors/me - Update contractor profile
router.put("/me", authenticateToken, requireVerified, async (req, res) => {
    try {
        await contractorController.updateProfile(req, res);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});
// POST /api/contractors/me/photo - Update contractor profile photo
router.post("/me/photo", authenticateToken, requireVerified, async (req, res) => {
    try {
        await contractorController.updateProfilePhoto(req, res);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});
// GET /api/contractors/earnings-summary - Get contractor earnings summary
router.get("/earnings-summary", authenticateToken, async (req, res) => {
    try {
        await contractorController.getEarningsSummary(req, res);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});
export default router;
//# sourceMappingURL=contractors.js.map