import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export interface InternalAuthRequest extends Request {
  isInternalRequest?: boolean;
}

/**
 * Middleware to authenticate internal API requests from CRM
 */
export const authenticateInternalAPI = (
  req: InternalAuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (!internalSecret) {
    logger.error("INTERNAL_API_SECRET not configured");
    res.status(500).json({
      success: false,
      message: "Internal API authentication not configured",
    });
    return;
  }

  // Check for API key in multiple headers for flexibility
  const apiKey =
    req.headers["x-internal-api-key"] ||
    req.headers["authorization"]?.replace("Bearer ", "") ||
    req.headers["x-api-key"];

  if (!apiKey) {
    logger.warn("Internal API request missing authentication", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
    });

    res.status(401).json({
      success: false,
      message: "Internal API key required",
    });
    return;
  }

  if (apiKey !== internalSecret) {
    logger.warn("Internal API request with invalid key", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
      providedKey:
        typeof apiKey === "string" ? apiKey.substring(0, 8) + "..." : "invalid",
    });

    res.status(403).json({
      success: false,
      message: "Invalid internal API key",
    });
    return;
  }

  // Mark request as authenticated internal request
  req.isInternalRequest = true;

  logger.info("Internal API request authenticated", {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  next();
};

/**
 * Middleware to require internal authentication
 */
export const requireInternalAuth = (
  req: InternalAuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.isInternalRequest) {
    res.status(403).json({
      success: false,
      message: "Internal authentication required",
    });
    return;
  }

  next();
};
