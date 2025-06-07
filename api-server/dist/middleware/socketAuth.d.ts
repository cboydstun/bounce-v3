import { Socket } from "socket.io";
export interface AuthenticatedSocket extends Socket {
    contractorId?: string;
    contractor?: any;
}
/**
 * WebSocket authentication middleware
 * Validates JWT token and attaches contractor info to socket
 */
export declare const socketAuthMiddleware: (socket: AuthenticatedSocket, next: (err?: Error) => void) => Promise<void>;
/**
 * Rate limiting for WebSocket events
 */
export declare class SocketRateLimiter {
    private static eventCounts;
    private static readonly MAX_EVENTS_PER_MINUTE;
    private static readonly WINDOW_MS;
    static checkRateLimit(socketId: string): boolean;
    static cleanup(): void;
}
export declare const clearSocketAuthInterval: () => void;
//# sourceMappingURL=socketAuth.d.ts.map