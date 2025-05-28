import express from 'express';
import { authenticateToken, requireVerified, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// POST /api/quickbooks/connect - Initiate QuickBooks OAuth
router.post('/connect', authenticateToken, requireVerified, async (req: AuthenticatedRequest, res) => {
  try {
    res.json({
      message: 'QuickBooks connect endpoint',
      authUrl: 'https://quickbooks.intuit.com/oauth/authorize'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quickbooks/callback - Handle QuickBooks OAuth callback
router.post('/callback', async (req, res) => {
  try {
    res.json({
      message: 'QuickBooks callback endpoint'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quickbooks/w9 - Submit W-9 information
router.post('/w9', authenticateToken, requireVerified, async (req: AuthenticatedRequest, res) => {
  try {
    res.json({
      message: 'W-9 submission endpoint'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
