import { Request, Response, NextFunction } from "express";
import { jwtService, JWTPayload } from "../utils/jwt.js";
import { logger } from "../utils/logger.js";

export interface AuthenticatedRequest extends Request {
  contractor?: JWTPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: "Access token required",
        code: "TOKEN_MISSING",
      });
      return;
    }

    const payload = jwtService.verifyAccessToken(token);
    req.contractor = payload;
    next();
  } catch (error) {
    logger.error("Authentication error:", error);

    if (error instanceof Error) {
      if (error.message === "Access token expired") {
        res.status(401).json({
          error: "Access token expired",
          code: "TOKEN_EXPIRED",
        });
        return;
      } else if (error.message === "Invalid access token") {
        res.status(401).json({
          error: "Invalid access token",
          code: "TOKEN_INVALID",
        });
        return;
      }
    }

    res.status(401).json({
      error: "Authentication failed",
      code: "AUTH_FAILED",
    });
  }
};

export const requireVerified = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.contractor) {
    res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  if (!req.contractor.isVerified) {
    res.status(403).json({
      error: "Account verification required",
      code: "VERIFICATION_REQUIRED",
    });
    return;
  }

  next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const payload = jwtService.verifyAccessToken(token);
        req.contractor = payload;
      } catch (error) {
        // Ignore token errors for optional auth
        logger.debug("Optional auth token error:", error);
      }
    }

    next();
  } catch (error) {
    logger.error("Optional auth error:", error);
    next();
  }
};
