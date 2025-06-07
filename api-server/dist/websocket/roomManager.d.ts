import { Server as SocketIOServer } from "socket.io";
import { AuthenticatedSocket } from "../middleware/socketAuth.js";
export interface ContractorLocation {
    lat: number;
    lng: number;
    radius?: number;
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
export declare class RoomManager {
    private io;
    private contractorLocations;
    private contractorRooms;
    constructor(io: SocketIOServer);
    /**
     * Join contractor to their personal room and skill-based rooms
     */
    joinContractorRooms(socket: AuthenticatedSocket): Promise<void>;
    /**
     * Update contractor's location and manage location-based rooms
     */
    updateContractorLocation(socket: AuthenticatedSocket, location: ContractorLocation): Promise<void>;
    /**
     * Leave all rooms when contractor disconnects
     */
    leaveAllRooms(socket: AuthenticatedSocket): Promise<void>;
    /**
     * Get contractors in a specific location radius
     */
    getContractorsInLocation(lat: number, lng: number, radius: number): string[];
    /**
     * Get contractors with specific skills
     */
    getContractorsWithSkills(skills: string[]): string[];
    /**
     * Room name generators
     */
    getContractorRoomName(contractorId: string): string;
    getLocationRoomName(lat: number, lng: number, radius: number): string;
    getSkillRoomName(skill: string): string;
    getGlobalRoomName(): string;
    /**
     * Get room info for debugging/monitoring
     */
    getRoomInfo(roomName: string): RoomInfo | null;
    /**
     * Get all rooms for a contractor
     */
    getContractorRooms(contractorId: string): string[];
    /**
     * Get room statistics for monitoring
     */
    getRoomStats(): {
        [roomName: string]: number;
    };
    /**
     * Private helper methods
     */
    private addContractorToRoom;
    private removeContractorFromRoom;
    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    private calculateDistance;
    private toRadians;
}
//# sourceMappingURL=roomManager.d.ts.map