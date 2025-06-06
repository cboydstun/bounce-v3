import { ITaskDocument } from "../models/Task.js";

/**
 * WebSocket event definitions for type safety
 */

// Client to Server Events
export interface ClientToServerEvents {
  // Connection and authentication
  "contractor:join": (contractorId: string) => void;

  // Location updates
  "contractor:location-update": (data: {
    lat: number;
    lng: number;
    radius?: number;
  }) => void;

  // Task subscriptions
  "task:subscribe": (filters: {
    skills?: string[];
    location?: {
      lat: number;
      lng: number;
      radius?: number;
    };
  }) => void;

  // Heartbeat
  ping: () => void;

  // Notification acknowledgments
  "notification:ack": (data: { notificationId: string }) => void;

  // Debug events
  "debug:room-info": () => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  // Connection events
  "connection:established": (data: {
    message: string;
    contractorId: string;
    timestamp: string;
    rooms: string[];
  }) => void;

  "connection:error": (data: { message: string; error: string }) => void;

  // Location events
  "contractor:location-updated": (data: {
    message: string;
    location: {
      lat: number;
      lng: number;
      radius?: number;
    };
    timestamp: string;
  }) => void;

  // Task events
  "task:new": (data: TaskEventPayload) => void;
  "task:assigned": (data: TaskEventPayload) => void;
  "task:updated": (data: TaskUpdatePayload) => void;
  "task:claimed": (data: TaskClaimedPayload) => void;
  "task:cancelled": (data: TaskCancelledPayload) => void;
  "task:completed": (data: TaskCompletedPayload) => void;

  // Subscription events
  "task:subscription-confirmed": (data: {
    message: string;
    filters: any;
    timestamp: string;
  }) => void;

  // Notification events
  "notification:system": (data: SystemNotificationPayload) => void;
  "notification:personal": (data: PersonalNotificationPayload) => void;

  // Heartbeat response
  pong: (data: { timestamp: string }) => void;

  // Debug responses
  "debug:room-info-response": (data: {
    contractorRooms: string[];
    roomStats: { [roomName: string]: number };
    timestamp: string;
  }) => void;

  // Error events
  error: (data: { message: string; code: string }) => void;
}

// Task Event Payloads
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

// Notification Payloads
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

// Room Types
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

// Connection State
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

// Broadcast Options
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

// Socket Authentication Data
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

// Error Codes
export enum SocketErrorCode {
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

// Connection Statistics
export interface ConnectionStats {
  totalConnections: number;
  roomStats: { [roomName: string]: number };
  contractorConnections: string[];
}

// Task Filters for Subscriptions
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

// Real-time Service Events
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
