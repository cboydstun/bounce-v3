import { Server as SocketIOServer } from "socket.io";
import { RoomManager } from "./roomManager.js";
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
export declare class SocketHandlers {
    private io;
    private roomManager;
    constructor(io: SocketIOServer);
    /**
     * Initialize socket event handlers
     */
    initializeHandlers(): void;
    /**
     * Handle new socket connection
     */
    private handleConnection;
    /**
     * Set up event handlers for authenticated socket
     */
    private setupSocketEventHandlers;
    /**
     * Broadcast task event to relevant contractors
     */
    broadcastTaskEvent(eventType: string, taskData: any, options?: {
        excludeContractor?: string;
        location?: {
            lat: number;
            lng: number;
            radius: number;
        };
        skills?: string[];
        targetContractor?: string;
    }): Promise<void>;
    /**
     * Broadcast system notification
     */
    broadcastSystemNotification(notification: {
        title: string;
        message: string;
        priority: "critical" | "high" | "normal" | "low";
        data?: any;
    }, options?: {
        targetContractor?: string;
        targetSkills?: string[];
    }): Promise<void>;
    /**
     * Get room manager instance
     */
    getRoomManager(): RoomManager;
    /**
     * Get connection statistics
     */
    getConnectionStats(): {
        totalConnections: number;
        roomStats: {
            [roomName: string]: number;
        };
        contractorConnections: string[];
    };
    /**
     * Private helper methods
     */
    private checkRateLimit;
    private validateLocationData;
}
//# sourceMappingURL=socketHandlers.d.ts.map