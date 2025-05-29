import { Socket } from "socket.io";
import { jwtService } from "../utils/jwt.js";
import ContractorAuth from "../models/ContractorAuth.js";
import { logger } from "../utils/logger.js";

export interface AuthenticatedSocket extends Socket {
  contractorId?: string;
  contractor?: any;
}

/**
 * WebSocket authentication middleware
 * Validates JWT token and attaches contractor info to socket
 */
export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) => {
  try {
    // Extract token from auth header or handshake query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      logger.warn(
        `Socket connection rejected - no token provided: ${socket.id}`,
      );
      return next(new Error("Authentication token required"));
    }

    // Verify JWT token
    const payload = jwtService.verifyAccessToken(token as string);

    if (!payload || !payload.contractorId) {
      logger.warn(`Socket connection rejected - invalid token: ${socket.id}`);
      return next(new Error("Invalid authentication token"));
    }

    // Verify contractor exists and is active
    const contractor = await ContractorAuth.findById(payload.contractorId);

    if (!contractor) {
      logger.warn(
        `Socket connection rejected - contractor not found: ${payload.contractorId}`,
      );
      return next(new Error("Contractor not found"));
    }

    if (!contractor.isActive) {
      logger.warn(
        `Socket connection rejected - contractor inactive: ${payload.contractorId}`,
      );
      return next(new Error("Contractor account is inactive"));
    }

    if (!contractor.isVerified) {
      logger.warn(
        `Socket connection rejected - contractor not verified: ${payload.contractorId}`,
      );
      return next(new Error("Contractor account is not verified"));
    }

    // Attach contractor info to socket
    socket.contractorId = contractor._id.toString();
    socket.contractor = {
      id: contractor._id.toString(),
      name: contractor.name,
      email: contractor.email,
      skills: contractor.skills || [],
      isActive: contractor.isActive,
      isVerified: contractor.isVerified,
    };

    logger.info(
      `Socket authenticated successfully: ${socket.id} for contractor: ${contractor._id}`,
    );
    next();
  } catch (error) {
    logger.error("Socket authentication error:", {
      socketId: socket.id,
      error: error instanceof Error ? error.message : "Unknown error",
      ip: socket.handshake.address,
    });

    if (error instanceof Error) {
      if (error.message === "Access token expired") {
        return next(new Error("Authentication token expired"));
      } else if (error.message === "Invalid access token") {
        return next(new Error("Invalid authentication token"));
      }
    }

    next(new Error("Authentication failed"));
  }
};

/**
 * Rate limiting for WebSocket events
 */
export class SocketRateLimiter {
  private static eventCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private static readonly MAX_EVENTS_PER_MINUTE = 50;
  private static readonly WINDOW_MS = 60 * 1000; // 1 minute

  static checkRateLimit(socketId: string): boolean {
    const now = Date.now();
    const key = socketId;
    const current = this.eventCounts.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize counter
      this.eventCounts.set(key, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return true;
    }

    if (current.count >= this.MAX_EVENTS_PER_MINUTE) {
      logger.warn(`Rate limit exceeded for socket: ${socketId}`);
      return false;
    }

    current.count++;
    return true;
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.eventCounts.entries()) {
      if (now > value.resetTime) {
        this.eventCounts.delete(key);
      }
    }
  }
}

// Cleanup rate limiter every 5 minutes (only in production)
let cleanupInterval: NodeJS.Timeout | null = null;

if (process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(
    () => {
      SocketRateLimiter.cleanup();
    },
    5 * 60 * 1000,
  );
}

// Export cleanup function for tests
export const clearSocketAuthInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};
