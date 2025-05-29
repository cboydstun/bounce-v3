import { Server as SocketIOServer } from "socket.io";
import { AuthenticatedSocket } from "../middleware/socketAuth.js";
import { logger } from "../utils/logger.js";

export interface ContractorLocation {
  lat: number;
  lng: number;
  radius?: number; // in kilometers
}

export interface RoomInfo {
  type: "contractor" | "location" | "skill" | "global";
  name: string;
  contractorId?: string;
  location?: ContractorLocation;
  skill?: string;
}

/**
 * Manages WebSocket rooms for targeted broadcasting
 */
export class RoomManager {
  private io: SocketIOServer;
  private contractorLocations = new Map<string, ContractorLocation>();
  private contractorRooms = new Map<string, Set<string>>(); // contractorId -> Set of room names

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Join contractor to their personal room and skill-based rooms
   */
  async joinContractorRooms(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.contractorId || !socket.contractor) {
      logger.error("Cannot join rooms - socket not authenticated");
      return;
    }

    const contractorId = socket.contractorId;
    const contractor = socket.contractor;

    try {
      // Join personal contractor room
      const contractorRoom = this.getContractorRoomName(contractorId);
      await socket.join(contractorRoom);
      this.addContractorToRoom(contractorId, contractorRoom);

      // Join skill-based rooms
      if (contractor.skills && Array.isArray(contractor.skills)) {
        for (const skill of contractor.skills) {
          const skillRoom = this.getSkillRoomName(skill);
          await socket.join(skillRoom);
          this.addContractorToRoom(contractorId, skillRoom);
        }
      }

      // Join global room for system announcements
      const globalRoom = this.getGlobalRoomName();
      await socket.join(globalRoom);
      this.addContractorToRoom(contractorId, globalRoom);

      logger.info(`Contractor ${contractorId} joined rooms:`, {
        contractorRoom,
        skillRooms:
          contractor.skills?.map((skill: string) =>
            this.getSkillRoomName(skill),
          ) || [],
        globalRoom,
      });
    } catch (error) {
      logger.error(
        `Error joining rooms for contractor ${contractorId}:`,
        error,
      );
    }
  }

  /**
   * Update contractor's location and manage location-based rooms
   */
  async updateContractorLocation(
    socket: AuthenticatedSocket,
    location: ContractorLocation,
  ): Promise<void> {
    if (!socket.contractorId) {
      logger.error("Cannot update location - socket not authenticated");
      return;
    }

    const contractorId = socket.contractorId;
    const previousLocation = this.contractorLocations.get(contractorId);

    try {
      // Leave previous location room if exists
      if (previousLocation) {
        const previousLocationRoom = this.getLocationRoomName(
          previousLocation.lat,
          previousLocation.lng,
          previousLocation.radius || 50,
        );
        await socket.leave(previousLocationRoom);
        this.removeContractorFromRoom(contractorId, previousLocationRoom);
      }

      // Join new location room
      const radius = location.radius || 50; // Default 50km radius
      const locationRoom = this.getLocationRoomName(
        location.lat,
        location.lng,
        radius,
      );
      await socket.join(locationRoom);
      this.addContractorToRoom(contractorId, locationRoom);

      // Update stored location
      this.contractorLocations.set(contractorId, { ...location, radius });

      logger.info(`Contractor ${contractorId} location updated:`, {
        location: { lat: location.lat, lng: location.lng, radius },
        locationRoom,
      });
    } catch (error) {
      logger.error(
        `Error updating location for contractor ${contractorId}:`,
        error,
      );
    }
  }

  /**
   * Leave all rooms when contractor disconnects
   */
  async leaveAllRooms(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.contractorId) {
      return;
    }

    const contractorId = socket.contractorId;
    const rooms = this.contractorRooms.get(contractorId);

    if (rooms) {
      for (const roomName of rooms) {
        await socket.leave(roomName);
      }
      this.contractorRooms.delete(contractorId);
    }

    // Remove location data
    this.contractorLocations.delete(contractorId);

    logger.info(`Contractor ${contractorId} left all rooms`);
  }

  /**
   * Get contractors in a specific location radius
   */
  getContractorsInLocation(lat: number, lng: number, radius: number): string[] {
    const contractorsInRange: string[] = [];

    for (const [contractorId, location] of this.contractorLocations.entries()) {
      const distance = this.calculateDistance(
        lat,
        lng,
        location.lat,
        location.lng,
      );
      if (distance <= radius) {
        contractorsInRange.push(contractorId);
      }
    }

    return contractorsInRange;
  }

  /**
   * Get contractors with specific skills
   */
  getContractorsWithSkills(skills: string[]): string[] {
    const contractorsWithSkills: string[] = [];
    const connectedSockets = this.io.sockets.sockets;

    for (const [socketId, socket] of connectedSockets) {
      const authSocket = socket as AuthenticatedSocket;
      if (authSocket.contractor && authSocket.contractor.skills) {
        const hasMatchingSkill = skills.some((skill) =>
          authSocket.contractor.skills.some(
            (contractorSkill: string) =>
              contractorSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(contractorSkill.toLowerCase()),
          ),
        );

        if (hasMatchingSkill && authSocket.contractorId) {
          contractorsWithSkills.push(authSocket.contractorId);
        }
      }
    }

    return contractorsWithSkills;
  }

  /**
   * Room name generators
   */
  getContractorRoomName(contractorId: string): string {
    return `contractor:${contractorId}`;
  }

  getLocationRoomName(lat: number, lng: number, radius: number): string {
    // Round coordinates to reduce room fragmentation
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    return `location:${roundedLat}-${roundedLng}-${radius}`;
  }

  getSkillRoomName(skill: string): string {
    return `skill:${skill.toLowerCase().replace(/\s+/g, "-")}`;
  }

  getGlobalRoomName(): string {
    return "global";
  }

  /**
   * Get room info for debugging/monitoring
   */
  getRoomInfo(roomName: string): RoomInfo | null {
    if (roomName.startsWith("contractor:")) {
      const contractorId = roomName.split(":")[1];
      if (!contractorId) return null;

      return {
        type: "contractor",
        name: roomName,
        contractorId,
      };
    }

    if (roomName.startsWith("location:")) {
      const locationPart = roomName.split(":")[1];
      if (!locationPart) return null;

      const parts = locationPart.split("-");
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return {
          type: "location",
          name: roomName,
          location: {
            lat: parseFloat(parts[0]),
            lng: parseFloat(parts[1]),
            radius: parseInt(parts[2]),
          },
        };
      }
    }

    if (roomName.startsWith("skill:")) {
      const skill = roomName.split(":")[1];
      if (!skill) return null;

      return {
        type: "skill",
        name: roomName,
        skill,
      };
    }

    if (roomName === "global") {
      return {
        type: "global",
        name: roomName,
      };
    }

    return null;
  }

  /**
   * Get all rooms for a contractor
   */
  getContractorRooms(contractorId: string): string[] {
    const rooms = this.contractorRooms.get(contractorId);
    return rooms ? Array.from(rooms) : [];
  }

  /**
   * Get room statistics for monitoring
   */
  getRoomStats(): { [roomName: string]: number } {
    const stats: { [roomName: string]: number } = {};
    const rooms = this.io.sockets.adapter.rooms;

    for (const [roomName, room] of rooms) {
      // Skip socket ID rooms (these are individual socket rooms)
      if (!roomName.includes(":") && !roomName.includes("global")) {
        continue;
      }
      stats[roomName] = room.size;
    }

    return stats;
  }

  /**
   * Private helper methods
   */
  private addContractorToRoom(contractorId: string, roomName: string): void {
    if (!this.contractorRooms.has(contractorId)) {
      this.contractorRooms.set(contractorId, new Set());
    }
    this.contractorRooms.get(contractorId)!.add(roomName);
  }

  private removeContractorFromRoom(
    contractorId: string,
    roomName: string,
  ): void {
    const rooms = this.contractorRooms.get(contractorId);
    if (rooms) {
      rooms.delete(roomName);
      if (rooms.size === 0) {
        this.contractorRooms.delete(contractorId);
      }
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
