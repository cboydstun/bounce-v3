<<<<<<< HEAD
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  connectionManager,
  ConnectionManagerStatus,
} from "../services/realtime/connectionManager";
import {
  websocketService,
  WebSocketEventData,
} from "../services/realtime/websocketService";
import { AuthTokens } from "../types/auth.types";

export interface RealtimeNotification {
  id: string;
  type:
    | "task:new"
    | "task:assigned"
    | "task:updated"
    | "task:cancelled"
    | "notification:system"
    | "notification:personal";
=======
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connectionManager, ConnectionManagerStatus } from '../services/realtime/connectionManager';
import { websocketService, WebSocketEventData } from '../services/realtime/websocketService';
import { AuthTokens } from '../types/auth.types';

export interface RealtimeNotification {
  id: string;
  type: 'task:new' | 'task:assigned' | 'task:updated' | 'task:cancelled' | 'notification:system' | 'notification:personal';
>>>>>>> 5772b46b8 (notifications)
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  isRead: boolean;
<<<<<<< HEAD
  priority: "low" | "medium" | "high";
=======
  priority: 'low' | 'medium' | 'high';
>>>>>>> 5772b46b8 (notifications)
}

export interface RealtimeState {
  // Connection status
  connectionStatus: ConnectionManagerStatus;
  isConnected: boolean;
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
<<<<<<< HEAD

  // Notifications
  notifications: RealtimeNotification[];
  unreadCount: number;

  // Real-time events
  lastEvent?: WebSocketEventData;
  eventHistory: WebSocketEventData[];

=======
  
  // Notifications
  notifications: RealtimeNotification[];
  unreadCount: number;
  
  // Real-time events
  lastEvent?: WebSocketEventData;
  eventHistory: WebSocketEventData[];
  
>>>>>>> 5772b46b8 (notifications)
  // Settings
  isEnabled: boolean;
  autoConnect: boolean;
  notificationsEnabled: boolean;
}

export interface RealtimeActions {
  // Connection management
  connect: (authTokens: AuthTokens) => Promise<void>;
  disconnect: () => void;
  setEnabled: (enabled: boolean) => void;
  setAutoConnect: (autoConnect: boolean) => void;
<<<<<<< HEAD

  // Notifications
  addNotification: (
    notification: Omit<RealtimeNotification, "id" | "timestamp" | "isRead">,
  ) => void;
=======
  
  // Notifications
  addNotification: (notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'isRead'>) => void;
>>>>>>> 5772b46b8 (notifications)
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
<<<<<<< HEAD

  // Events
  addEvent: (event: WebSocketEventData) => void;
  clearEventHistory: () => void;

=======
  
  // Events
  addEvent: (event: WebSocketEventData) => void;
  clearEventHistory: () => void;
  
>>>>>>> 5772b46b8 (notifications)
  // Location updates
  updateLocation: (latitude: number, longitude: number) => void;
  joinContractorRoom: (contractorId: string) => void;
  leaveContractorRoom: (contractorId: string) => void;
<<<<<<< HEAD

=======
  
>>>>>>> 5772b46b8 (notifications)
  // Internal state updates
  updateConnectionStatus: (status: ConnectionManagerStatus) => void;
  setLastEvent: (event: WebSocketEventData) => void;
}

export type RealtimeStore = RealtimeState & RealtimeActions;

const initialState: RealtimeState = {
  connectionStatus: {
    isInitialized: false,
    isConnecting: false,
    isConnected: false,
    connectionAttempts: 0,
  },
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  eventHistory: [],
  isEnabled: true,
  autoConnect: true,
  notificationsEnabled: true,
};

export const useRealtimeStore = create<RealtimeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Connection management
      connect: async (authTokens: AuthTokens) => {
        const { isEnabled } = get();
        if (!isEnabled) {
<<<<<<< HEAD
          console.log("Realtime is disabled, skipping connection");
=======
          console.log('Realtime is disabled, skipping connection');
>>>>>>> 5772b46b8 (notifications)
          return;
        }

        try {
          await connectionManager.setAuthTokens(authTokens, true);
        } catch (error) {
<<<<<<< HEAD
          console.error("Failed to connect to realtime service:", error);
=======
          console.error('Failed to connect to realtime service:', error);
>>>>>>> 5772b46b8 (notifications)
          throw error;
        }
      },

      disconnect: () => {
        connectionManager.disconnect();
      },

      setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
<<<<<<< HEAD

=======
        
>>>>>>> 5772b46b8 (notifications)
        if (!enabled) {
          connectionManager.disconnect();
        }
      },

      setAutoConnect: (autoConnect: boolean) => {
        set({ autoConnect });
      },

      // Notifications
      addNotification: (notification) => {
        const newNotification: RealtimeNotification = {
          ...notification,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          isRead: false,
        };

        set((state) => ({
<<<<<<< HEAD
          notifications: [newNotification, ...state.notifications].slice(
            0,
            100,
          ), // Keep only last 100
=======
          notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep only last 100
>>>>>>> 5772b46b8 (notifications)
          unreadCount: state.unreadCount + 1,
        }));
      },

      markNotificationAsRead: (id: string) => {
        set((state) => {
<<<<<<< HEAD
          const notifications = state.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification,
          );

          const unreadCount = notifications.filter((n) => !n.isRead).length;

=======
          const notifications = state.notifications.map(notification =>
            notification.id === id ? { ...notification, isRead: true } : notification
          );
          
          const unreadCount = notifications.filter(n => !n.isRead).length;
          
>>>>>>> 5772b46b8 (notifications)
          return { notifications, unreadCount };
        });
      },

      markAllNotificationsAsRead: () => {
        set((state) => ({
<<<<<<< HEAD
          notifications: state.notifications.map((notification) => ({
=======
          notifications: state.notifications.map(notification => ({
>>>>>>> 5772b46b8 (notifications)
            ...notification,
            isRead: true,
          })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id: string) => {
        set((state) => {
<<<<<<< HEAD
          const notifications = state.notifications.filter((n) => n.id !== id);
          const unreadCount = notifications.filter((n) => !n.isRead).length;

=======
          const notifications = state.notifications.filter(n => n.id !== id);
          const unreadCount = notifications.filter(n => !n.isRead).length;
          
>>>>>>> 5772b46b8 (notifications)
          return { notifications, unreadCount };
        });
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      setNotificationsEnabled: (enabled: boolean) => {
        set({ notificationsEnabled: enabled });
      },

      // Events
      addEvent: (event: WebSocketEventData) => {
        set((state) => ({
          eventHistory: [event, ...state.eventHistory].slice(0, 50), // Keep only last 50 events
          lastEvent: event,
        }));
      },

      clearEventHistory: () => {
        set({ eventHistory: [], lastEvent: undefined });
      },

      // Location updates
      updateLocation: (latitude: number, longitude: number) => {
        connectionManager.updateLocation(latitude, longitude);
      },

      joinContractorRoom: (contractorId: string) => {
        connectionManager.joinContractorRoom(contractorId);
      },

      leaveContractorRoom: (contractorId: string) => {
        connectionManager.leaveContractorRoom(contractorId);
      },

      // Internal state updates
      updateConnectionStatus: (status: ConnectionManagerStatus) => {
        set((state) => ({
          connectionStatus: status,
          isConnected: status.isConnected,
<<<<<<< HEAD
          lastConnectedAt: status.isConnected
            ? new Date()
            : state.lastConnectedAt,
          lastDisconnectedAt:
            !status.isConnected && state.isConnected
              ? new Date()
              : state.lastDisconnectedAt,
=======
          lastConnectedAt: status.isConnected ? new Date() : state.lastConnectedAt,
          lastDisconnectedAt: !status.isConnected && state.isConnected ? new Date() : state.lastDisconnectedAt,
>>>>>>> 5772b46b8 (notifications)
        }));
      },

      setLastEvent: (event: WebSocketEventData) => {
        set({ lastEvent: event });
      },
    }),
    {
<<<<<<< HEAD
      name: "realtime-store",
=======
      name: 'realtime-store',
>>>>>>> 5772b46b8 (notifications)
      partialize: (state) => ({
        // Only persist these fields
        isEnabled: state.isEnabled,
        autoConnect: state.autoConnect,
        notificationsEnabled: state.notificationsEnabled,
        notifications: state.notifications.slice(0, 20), // Persist only last 20 notifications
      }),
<<<<<<< HEAD
    },
  ),
=======
    }
  )
>>>>>>> 5772b46b8 (notifications)
);

// Initialize realtime store with connection manager
let isInitialized = false;

export const initializeRealtimeStore = () => {
  if (isInitialized) return;
<<<<<<< HEAD

=======
  
>>>>>>> 5772b46b8 (notifications)
  // Subscribe to connection status changes
  connectionManager.onStatusChange((status) => {
    useRealtimeStore.getState().updateConnectionStatus(status);
  });

  // Subscribe to WebSocket events
  const websocket = connectionManager.getWebSocketService();
<<<<<<< HEAD

  // Task events
  websocket.on("task:new", (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);

    if (store.notificationsEnabled) {
      store.addNotification({
        type: "task:new",
        title: "New Task Available",
        message: `A new task is available in your area`,
        data: event.payload,
        priority: "high",
=======
  
  // Task events
  websocket.on('task:new', (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);
    
    if (store.notificationsEnabled) {
      store.addNotification({
        type: 'task:new',
        title: 'New Task Available',
        message: `A new task is available in your area`,
        data: event.payload,
        priority: 'high',
>>>>>>> 5772b46b8 (notifications)
      });
    }
  });

<<<<<<< HEAD
  websocket.on("task:assigned", (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);

    if (store.notificationsEnabled) {
      store.addNotification({
        type: "task:assigned",
        title: "Task Assigned",
        message: `You have been assigned a new task`,
        data: event.payload,
        priority: "high",
=======
  websocket.on('task:assigned', (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);
    
    if (store.notificationsEnabled) {
      store.addNotification({
        type: 'task:assigned',
        title: 'Task Assigned',
        message: `You have been assigned a new task`,
        data: event.payload,
        priority: 'high',
>>>>>>> 5772b46b8 (notifications)
      });
    }
  });

<<<<<<< HEAD
  websocket.on("task:updated", (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);

    if (store.notificationsEnabled) {
      store.addNotification({
        type: "task:updated",
        title: "Task Updated",
        message: `A task has been updated`,
        data: event.payload,
        priority: "medium",
=======
  websocket.on('task:updated', (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);
    
    if (store.notificationsEnabled) {
      store.addNotification({
        type: 'task:updated',
        title: 'Task Updated',
        message: `A task has been updated`,
        data: event.payload,
        priority: 'medium',
>>>>>>> 5772b46b8 (notifications)
      });
    }
  });

<<<<<<< HEAD
  websocket.on("task:cancelled", (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);

    if (store.notificationsEnabled) {
      store.addNotification({
        type: "task:cancelled",
        title: "Task Cancelled",
        message: `A task has been cancelled`,
        data: event.payload,
        priority: "medium",
=======
  websocket.on('task:cancelled', (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);
    
    if (store.notificationsEnabled) {
      store.addNotification({
        type: 'task:cancelled',
        title: 'Task Cancelled',
        message: `A task has been cancelled`,
        data: event.payload,
        priority: 'medium',
>>>>>>> 5772b46b8 (notifications)
      });
    }
  });

  // System notifications
<<<<<<< HEAD
  websocket.on("notification:system", (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);

    if (store.notificationsEnabled) {
      store.addNotification({
        type: "notification:system",
        title: event.payload.title || "System Notification",
        message: event.payload.message || "You have a new system notification",
        data: event.payload,
        priority: event.payload.priority || "medium",
=======
  websocket.on('notification:system', (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);
    
    if (store.notificationsEnabled) {
      store.addNotification({
        type: 'notification:system',
        title: event.payload.title || 'System Notification',
        message: event.payload.message || 'You have a new system notification',
        data: event.payload,
        priority: event.payload.priority || 'medium',
>>>>>>> 5772b46b8 (notifications)
      });
    }
  });

  // Personal notifications
<<<<<<< HEAD
  websocket.on("notification:personal", (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);

    if (store.notificationsEnabled) {
      store.addNotification({
        type: "notification:personal",
        title: event.payload.title || "Personal Notification",
        message:
          event.payload.message || "You have a new personal notification",
        data: event.payload,
        priority: event.payload.priority || "medium",
=======
  websocket.on('notification:personal', (event) => {
    const store = useRealtimeStore.getState();
    store.addEvent(event);
    
    if (store.notificationsEnabled) {
      store.addNotification({
        type: 'notification:personal',
        title: event.payload.title || 'Personal Notification',
        message: event.payload.message || 'You have a new personal notification',
        data: event.payload,
        priority: event.payload.priority || 'medium',
>>>>>>> 5772b46b8 (notifications)
      });
    }
  });

  // Connection events
<<<<<<< HEAD
  websocket.on("connection:established", (event) => {
=======
  websocket.on('connection:established', (event) => {
>>>>>>> 5772b46b8 (notifications)
    const store = useRealtimeStore.getState();
    store.addEvent(event);
  });

  isInitialized = true;
};

// Auto-initialize when store is created
initializeRealtimeStore();
