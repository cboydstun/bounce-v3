import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
declare class AuthController {
  /**
   * Register a new contractor
   */
  register(req: Request, res: Response): Promise<void>;
  /**
   * Authenticate contractor and return JWT tokens
   */
  login(req: Request, res: Response): Promise<void>;
  /**
   * Refresh access token using refresh token
   */
  refresh(req: Request, res: Response): Promise<void>;
  /**
   * Logout contractor and invalidate refresh token
   */
  logout(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Send password reset email
   */
  forgotPassword(req: Request, res: Response): Promise<void>;
  /**
   * Reset password using reset token
   */
  resetPassword(req: Request, res: Response): Promise<void>;
  /**
   * Verify email address using verification token (GET request for browser links)
   */
  verifyEmailGet(req: Request, res: Response): Promise<void>;
  /**
   * Verify JWT token and return contractor info
   */
  verifyToken(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Verify email address using verification token
   */
  verifyEmail(req: Request, res: Response): Promise<void>;
}
export declare const authController: AuthController;
export default authController;
//# sourceMappingURL=authController.d.ts.map
