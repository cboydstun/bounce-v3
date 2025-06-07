/**
 * WebSocket event definitions for type safety
 */
export interface ClientToServerEvents {
  "contractor:join": (contractorId: string) => void;
  "contractor:location-update": (data: {
    lat: number;
    lng: number;
    radius?: number;
  }) => void;
  "task:subscribe": (filters: {
    skills?: string[];
    location?: {
      lat: number;
      lng: number;
      radius?: number;
    };
  }) => void;
  ping: () => void;
  "notification:ack": (data: { notificationId: string }) => void;
  "debug:room-info": () => void;
}
export interface ServerToClientEvents {
  "connection:established": (data: {
    message: string;
    contractorId: string;
    timestamp: string;
    rooms: string[];
  }) => void;
  "connection:error": (data: { message: string; error: string }) => void;
  "contractor:location-updated": (data: {
    message: string;
    location: {
      lat: number;
      lng: number;
      radius?: number;
    };
    timestamp: string;
  }) => void;
  "task:new": (data: TaskEventPayload) => void;
  "task:assigned": (data: TaskEventPayload) => void;
  "task:updated": (data: TaskUpdatePayload) => void;
  "task:claimed": (data: TaskClaimedPayload) => void;
  "task:cancelled": (data: TaskCancelledPayload) => void;
  "task:completed": (data: TaskCompletedPayload) => void;
  "task:subscription-confirmed": (data: {
    message: string;
    filters: any;
    timestamp: string;
  }) => void;
  "notification:system": (data: SystemNotificationPayload) => void;
  "notification:personal": (data: PersonalNotificationPayload) => void;
  pong: (data: { timestamp: string }) => void;
  "debug:room-info-response": (data: {
    contractorRooms: string[];
    roomStats: {
      [roomName: string]: number;
    };
    timestamp: string;
  }) => void;
  error: (data: { message: string; code: string }) => void;
}
export interface TaskEventPayload {
  id: string;
  orderId: string;
  type: "Delivery" | "Setup" | "Pickup" | "Maintenance";
  description: string;
  priority: "High" | "Medium" | "Low";
  scheduledDateTime: Date;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  address: string;
  status?: "Pending" | "Assigned" | "In Progress" | "Completed" | "Cancelled";
  timestamp: string;
}
export interface TaskUpdatePayload {
  id: string;
  orderId: string;
  type: "Delivery" | "Setup" | "Pickup" | "Maintenance";
  description: string;
  status: "Pending" | "Assigned" | "In Progress" | "Completed" | "Cancelled";
  previousStatus: string;
  updatedAt: string;
  updatedBy: string;
  timestamp: string;
}
export interface TaskClaimedPayload {
  id: string;
  orderId: string;
  type: "Delivery" | "Setup" | "Pickup" | "Maintenance";
  description: string;
  claimedBy: string;
  claimedAt: string;
  timestamp: string;
}
export interface TaskCancelledPayload {
  id: string;
  orderId: string;
  type: "Delivery" | "Setup" | "Pickup" | "Maintenance";
  description: string;
  reason: string;
  cancelledAt: string;
  timestamp: string;
}
export interface TaskCompletedPayload {
  id: string;
  orderId: string;
  type: "Delivery" | "Setup" | "Pickup" | "Maintenance";
  description: string;
  status: "Completed";
  completedAt?: Date;
  completedBy: string;
  completionPhotos?: string[];
  completionNotes?: string;
  timestamp: string;
}
export interface SystemNotificationPayload {
  id: string;
  title: string;
  message: string;
  priority: "critical" | "high" | "normal" | "low";
  type: "system";
  data?: any;
  timestamp: string;
}
export interface PersonalNotificationPayload {
  title: string;
  message: string;
  priority: "critical" | "high" | "normal" | "low";
  type: "personal";
  data?: any;
  timestamp: string;
}
export type RoomType = "contractor" | "location" | "skill" | "global";
export interface RoomInfo {
  type: RoomType;
  name: string;
  contractorId?: string;
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  skill?: string;
}
export interface ContractorConnection {
  contractorId: string;
  socketId: string;
  connectedAt: Date;
  lastSeen: Date;
  location?: {
    lat: number;
    lng: number;
    radius?: number;
  };
  activeRooms: string[];
}
export interface BroadcastOptions {
  excludeContractor?: string;
  targetContractor?: string;
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  skills?: string[];
}
export interface SocketAuthData {
  contractorId: string;
  contractor: {
    id: string;
    name: string;
    email: string;
    skills: string[];
    isActive: boolean;
    isVerified: boolean;
  };
}
export declare enum SocketErrorCode {
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  CONTRACTOR_NOT_FOUND = "CONTRACTOR_NOT_FOUND",
  CONTRACTOR_INACTIVE = "CONTRACTOR_INACTIVE",
  CONTRACTOR_NOT_VERIFIED = "CONTRACTOR_NOT_VERIFIED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INVALID_LOCATION = "INVALID_LOCATION",
  LOCATION_UPDATE_FAILED = "LOCATION_UPDATE_FAILED",
  SUBSCRIPTION_FAILED = "SUBSCRIPTION_FAILED",
}
export interface ConnectionStats {
  totalConnections: number;
  roomStats: {
    [roomName: string]: number;
  };
  contractorConnections: string[];
}
export interface TaskSubscriptionFilters {
  skills?: string[];
  location?: {
    lat: number;
    lng: number;
    radius?: number;
  };
  priority?: "High" | "Medium" | "Low";
  types?: ("Delivery" | "Setup" | "Pickup" | "Maintenance")[];
}
export interface RealtimeEvents {
  "task:new": TaskEventPayload;
  "task:assigned": TaskEventPayload;
  "task:updated": TaskUpdatePayload;
  "task:claimed": TaskClaimedPayload;
  "task:cancelled": TaskCancelledPayload;
  "task:completed": TaskCompletedPayload;
  "notification:system": SystemNotificationPayload;
  "notification:personal": PersonalNotificationPayload;
}
export type RealtimeEventType = keyof RealtimeEvents;
export type RealtimeEventPayload<T extends RealtimeEventType> =
  RealtimeEvents[T];
//# sourceMappingURL=websocket.d.ts.map
