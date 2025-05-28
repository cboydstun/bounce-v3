import { Request, Response } from "express";
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isVerified: boolean;
  };
  contractor?: {
    id: string;
    email: string;
    isVerified: boolean;
  };
}
/**
 * QuickBooks Controller
 *
 * Handles all QuickBooks-related HTTP requests including W-9 form management,
 * QuickBooks integration, and document operations.
 */
export declare class QuickBooksController {
  /**
   * Get W-9 form status for the authenticated contractor
   */
  getW9Status(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Submit W-9 form
   */
  submitW9Form(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Update W-9 form (draft only)
   */
  updateW9Form(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Download W-9 PDF
   */
  downloadW9PDF(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Get QuickBooks integration status
   */
  getQuickBooksStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Initiate QuickBooks connection
   */
  connectQuickBooks(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Sync contractor data with QuickBooks
   */
  syncContractor(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Handle QuickBooks OAuth callback
   */
  handleOAuthCallback(req: Request, res: Response): Promise<void>;
}
export declare const quickbooksController: QuickBooksController;
//# sourceMappingURL=quickbooksController.d.ts.map
