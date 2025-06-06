import { Server as SocketIOServer } from "socket.io";
import {
  AuthenticatedSocket,
  SocketRateLimiter,
} from "../middleware/socketAuth.js";
import { RoomManager, ContractorLocation } from "./roomManager.js";
import { logger } from "../utils/logger.js";

export interface TaskFilters {
  skills?: string[];
  location?: {
    lat: number;
    lng: number;
    radius?: number;
  };
}

export interface LocationUpdateData {
  lat: number;
  lng: number;
  radius?: number;
}

/**
 * Socket event handlers for real-time communication
 */
export class SocketHandlers {
  private io: SocketIOServer;
  private roomManager: RoomManager;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.roomManager = new RoomManager(io);
  }

  /**
   * Initialize socket event handlers
   */
  initializeHandlers(): void {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.contractorId || !socket.contractor) {
      logger.error("Unauthenticated socket connection attempt");
      socket.disconnect(true);
      return;
    }

    const contractorId = socket.contractorId;
    logger.info(`Contractor connected: ${contractorId} (Socket: ${socket.id})`);

    try {
      // Join contractor to appropriate rooms
      await this.roomManager.joinContractorRooms(socket);

      // Send welcome message
      socket.emit("connection:established", {
        message: "Connected successfully",
        contractorId,
        timestamp: new Date().toISOString(),
        rooms: this.roomManager.getContractorRooms(contractorId),
      });

      // Set up event handlers for this socket
      this.setupSocketEventHandlers(socket);
    } catch (error) {
      logger.error(
        `Error setting up socket for contractor ${contractorId}:`,
        error,
      );
      socket.emit("connection:error", {
        message: "Failed to establish connection",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      socket.disconnect(true);
    }
  }

  /**
   * Set up event handlers for authenticated socket
   */
  private setupSocketEventHandlers(socket: AuthenticatedSocket): void {
    const contractorId = socket.contractorId!;

    // Location update handler
    socket.on(
      "contractor:location-update",
      async (data: LocationUpdateData) => {
        if (!this.checkRateLimit(socket)) return;

        try {
          if (!this.validateLocationData(data)) {
            socket.emit("error", {
              message: "Invalid location data",
              code: "INVALID_LOCATION",
            });
            return;
          }

          await this.roomManager.updateContractorLocation(socket, data);

          socket.emit("contractor:location-updated", {
            message: "Location updated successfully",
            location: data,
            timestamp: new Date().toISOString(),
          });

          logger.info(`Location updated for contractor ${contractorId}:`, data);
        } catch (error) {
          logger.error(
            `Error updating location for contractor ${contractorId}:`,
            error,
          );
          socket.emit("error", {
            message: "Failed to update location",
            code: "LOCATION_UPDATE_FAILED",
          });
        }
      },
    );

    // Task subscription handler
    socket.on("task:subscribe", async (filters: TaskFilters) => {
      if (!this.checkRateLimit(socket)) return;

      try {
        logger.info(
          `Contractor ${contractorId} subscribed to task updates with filters:`,
          filters,
        );

        socket.emit("task:subscription-confirmed", {
          message: "Subscribed to task updates",
          filters,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error(
          `Error subscribing to tasks for contractor ${contractorId}:`,
          error,
        );
        socket.emit("error", {
          message: "Failed to subscribe to task updates",
          code: "SUBSCRIPTION_FAILED",
        });
      }
    });

    // Heartbeat/ping handler
    socket.on("ping", () => {
      socket.emit("pong", {
        timestamp: new Date().toISOString(),
      });
    });

    // Room info request handler (for debugging)
    socket.on("debug:room-info", () => {
      if (!this.checkRateLimit(socket)) return;

      const rooms = this.roomManager.getContractorRooms(contractorId);
      const roomStats = this.roomManager.getRoomStats();

      socket.emit("debug:room-info-response", {
        contractorRooms: rooms,
        roomStats,
        timestamp: new Date().toISOString(),
      });
    });

    // Notification acknowledgment handler
    socket.on("notification:ack", (data: { notificationId: string }) => {
      if (!this.checkRateLimit(socket)) return;

      logger.info(
        `Notification acknowledged by contractor ${contractorId}:`,
        data.notificationId,
      );

      // Here you could update notification delivery status in database
      // await NotificationService.markAsDelivered(data.notificationId, contractorId);
    });

    // Handle disconnection
    socket.on("disconnect", async (reason: string) => {
      logger.info(
        `Contractor ${contractorId} disconnected: ${reason} (Socket: ${socket.id})`,
      );

      try {
        await this.roomManager.leaveAllRooms(socket);
      } catch (error) {
        logger.error(
          `Error cleaning up rooms for contractor ${contractorId}:`,
          error,
        );
      }
    });

    // Handle connection errors
    socket.on("error", (error: Error) => {
      logger.error(`Socket error for contractor ${contractorId}:`, {
        error: error.message,
        stack: error.stack,
        socketId: socket.id,
      });
    });
  }

  /**
   * Broadcast task event to relevant contractors
   */
  async broadcastTaskEvent(
    eventType: string,
    taskData: any,
    options?: {
      excludeContractor?: string;
      location?: { lat: number; lng: number; radius: number };
      skills?: string[];
      targetContractor?: string;
    },
  ): Promise<void> {
    try {
      const { excludeContractor, location, skills, targetContractor } =
        options || {};

      // If targeting specific contractor, send to their personal room
      if (targetContractor) {
        const contractorRoom =
          this.roomManager.getContractorRoomName(targetContractor);
        this.io.to(contractorRoom).emit(eventType, {
          ...taskData,
          timestamp: new Date().toISOString(),
        });

        logger.info(
          `Task event ${eventType} sent to contractor ${targetContractor}`,
        );
        return;
      }

      // Broadcast to location-based rooms if location provided
      if (location) {
        const contractorsInRange = this.roomManager.getContractorsInLocation(
          location.lat,
          location.lng,
          location.radius,
        );

        for (const contractorId of contractorsInRange) {
          if (contractorId !== excludeContractor) {
            const contractorRoom =
              this.roomManager.getContractorRoomName(contractorId);
            this.io.to(contractorRoom).emit(eventType, {
              ...taskData,
              timestamp: new Date().toISOString(),
            });
          }
        }

        logger.info(
          `Task event ${eventType} broadcast to ${contractorsInRange.length} contractors in location`,
        );
        return;
      }

      // Broadcast to skill-based rooms if skills provided
      if (skills && skills.length > 0) {
        const contractorsWithSkills =
          this.roomManager.getContractorsWithSkills(skills);

        for (const contractorId of contractorsWithSkills) {
          if (contractorId !== excludeContractor) {
            const contractorRoom =
              this.roomManager.getContractorRoomName(contractorId);
            this.io.to(contractorRoom).emit(eventType, {
              ...taskData,
              timestamp: new Date().toISOString(),
            });
          }
        }

        logger.info(
          `Task event ${eventType} broadcast to ${contractorsWithSkills.length} contractors with matching skills`,
        );
        return;
      }

      // Default: broadcast to global room (excluding specific contractor if specified)
      if (excludeContractor) {
        // Get all connected sockets and filter out the excluded contractor
        const connectedSockets = this.io.sockets.sockets;
        for (const [socketId, socket] of connectedSockets) {
          const authSocket = socket as AuthenticatedSocket;
          if (
            authSocket.contractorId &&
            authSocket.contractorId !== excludeContractor
          ) {
            socket.emit(eventType, {
              ...taskData,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } else {
        this.io.to(this.roomManager.getGlobalRoomName()).emit(eventType, {
          ...taskData,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info(`Task event ${eventType} broadcast globally`);
    } catch (error) {
      logger.error(`Error broadcasting task event ${eventType}:`, error);
    }
  }

  /**
   * Broadcast system notification
   */
  async broadcastSystemNotification(
    notification: {
      title: string;
      message: string;
      priority: "critical" | "high" | "normal" | "low";
      data?: any;
    },
    options?: {
      targetContractor?: string;
      targetSkills?: string[];
    },
  ): Promise<void> {
    try {
      const { targetContractor, targetSkills } = options || {};

      const notificationData = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: "system",
      };

      if (targetContractor) {
        // Send to specific contractor
        const contractorRoom =
          this.roomManager.getContractorRoomName(targetContractor);
        this.io
          .to(contractorRoom)
          .emit("notification:system", notificationData);

        logger.info(
          `System notification sent to contractor ${targetContractor}`,
        );
      } else if (targetSkills && targetSkills.length > 0) {
        // Send to contractors with specific skills
        const contractorsWithSkills =
          this.roomManager.getContractorsWithSkills(targetSkills);

        for (const contractorId of contractorsWithSkills) {
          const contractorRoom =
            this.roomManager.getContractorRoomName(contractorId);
          this.io
            .to(contractorRoom)
            .emit("notification:system", notificationData);
        }

        logger.info(
          `System notification sent to ${contractorsWithSkills.length} contractors with matching skills`,
        );
      } else {
        // Broadcast to all contractors
        this.io
          .to(this.roomManager.getGlobalRoomName())
          .emit("notification:system", notificationData);

        logger.info("System notification broadcast to all contractors");
      }
    } catch (error) {
      logger.error("Error broadcasting system notification:", error);
    }
  }

  /**
   * Get room manager instance
   */
  getRoomManager(): RoomManager {
    return this.roomManager;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    totalConnections: number;
    roomStats: { [roomName: string]: number };
    contractorConnections: string[];
  } {
    const connectedSockets = this.io.sockets.sockets;
    const contractorConnections: string[] = [];

    for (const [socketId, socket] of connectedSockets) {
      const authSocket = socket as AuthenticatedSocket;
      if (authSocket.contractorId) {
        contractorConnections.push(authSocket.contractorId);
      }
    }

    return {
      totalConnections: connectedSockets.size,
      roomStats: this.roomManager.getRoomStats(),
      contractorConnections,
    };
  }

  /**
   * Private helper methods
   */
  private checkRateLimit(socket: AuthenticatedSocket): boolean {
    if (!SocketRateLimiter.checkRateLimit(socket.id)) {
      socket.emit("error", {
        message: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
      });
      return false;
    }
    return true;
  }

  private validateLocationData(data: LocationUpdateData): boolean {
    if (!data || typeof data !== "object") return false;
    if (typeof data.lat !== "number" || typeof data.lng !== "number")
      return false;
    if (data.lat < -90 || data.lat > 90) return false;
    if (data.lng < -180 || data.lng > 180) return false;
    if (
      data.radius !== undefined &&
      (typeof data.radius !== "number" || data.radius <= 0)
    )
      return false;

    return true;
  }
}
