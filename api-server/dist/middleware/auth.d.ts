import { Request, Response, NextFunction } from "express";
import { JWTPayload } from "../utils/jwt.js";
export interface AuthenticatedRequest extends Request {
  contractor?: JWTPayload;
}
export declare const authenticateToken: (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;
export declare const requireVerified: (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => void;
export declare const optionalAuth: (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map
