import express from 'express';
import { authenticateToken, requireVerified, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// GET /api/contractors/me - Get contractor profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    res.json({
      message: 'Contractor profile endpoint',
      contractor: req.contractor
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/contractors/me - Update contractor profile
router.put('/me', authenticateToken, requireVerified, async (req: AuthenticatedRequest, res) => {
  try {
    res.json({
      message: 'Update contractor profile endpoint'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
