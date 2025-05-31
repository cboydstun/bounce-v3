<<<<<<< HEAD
import { useEffect, useRef } from "react";
import { useRealtimeStore } from "../../store/realtimeStore";
import { useAuthStore } from "../../store/authStore";
import {
  WebSocketEventData,
  WebSocketEventHandler,
} from "../../services/realtime/websocketService";
import { connectionManager } from "../../services/realtime/connectionManager";
=======
import { useEffect, useRef } from 'react';
import { useRealtimeStore } from '../../store/realtimeStore';
import { useAuthStore } from '../../store/authStore';
import { WebSocketEventData, WebSocketEventHandler } from '../../services/realtime/websocketService';
import { connectionManager } from '../../services/realtime/connectionManager';
>>>>>>> 5772b46b8 (notifications)

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnAuth?: boolean;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: any;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (eventType: string, handler: WebSocketEventHandler) => () => void;
  emit: (eventType: string, data?: any) => void;
  updateLocation: (latitude: number, longitude: number) => void;
}

/**
 * Hook for managing WebSocket connection and events
 */
<<<<<<< HEAD
export const useWebSocket = (
  options: UseWebSocketOptions = {},
): UseWebSocketReturn => {
  const { autoConnect = true, reconnectOnAuth = true } = options;

=======
export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const { autoConnect = true, reconnectOnAuth = true } = options;
  
>>>>>>> 5772b46b8 (notifications)
  const {
    isConnected,
    connectionStatus,
    connect: realtimeConnect,
    disconnect: realtimeDisconnect,
    updateLocation: realtimeUpdateLocation,
    joinContractorRoom,
  } = useRealtimeStore();
<<<<<<< HEAD

=======
  
>>>>>>> 5772b46b8 (notifications)
  const { tokens, user } = useAuthStore();
  const hasConnectedRef = useRef(false);

  // Auto-connect when authenticated
  useEffect(() => {
    if (tokens && autoConnect && !hasConnectedRef.current) {
<<<<<<< HEAD
      realtimeConnect(tokens)
        .then(() => {
          hasConnectedRef.current = true;

          // Join contractor-specific room for targeted notifications
          if (user?.id) {
            joinContractorRoom(user.id);
          }
        })
        .catch((error) => {
          console.error("Auto-connect failed:", error);
        });
=======
      realtimeConnect(tokens).then(() => {
        hasConnectedRef.current = true;
        
        // Join contractor-specific room for targeted notifications
        if (user?.id) {
          joinContractorRoom(user.id);
        }
      }).catch((error) => {
        console.error('Auto-connect failed:', error);
      });
>>>>>>> 5772b46b8 (notifications)
    }
  }, [tokens, autoConnect, realtimeConnect, user?.id, joinContractorRoom]);

  // Reconnect when auth tokens change
  useEffect(() => {
    if (tokens && reconnectOnAuth && hasConnectedRef.current) {
      realtimeConnect(tokens).catch((error) => {
<<<<<<< HEAD
        console.error("Reconnect on auth failed:", error);
=======
        console.error('Reconnect on auth failed:', error);
>>>>>>> 5772b46b8 (notifications)
      });
    }
  }, [tokens, reconnectOnAuth, realtimeConnect]);

  // Disconnect when tokens are cleared
  useEffect(() => {
    if (!tokens && hasConnectedRef.current) {
      realtimeDisconnect();
      hasConnectedRef.current = false;
    }
  }, [tokens, realtimeDisconnect]);

  const connect = async (): Promise<void> => {
    if (!tokens) {
<<<<<<< HEAD
      throw new Error("No authentication tokens available");
    }

    await realtimeConnect(tokens);
    hasConnectedRef.current = true;

=======
      throw new Error('No authentication tokens available');
    }
    
    await realtimeConnect(tokens);
    hasConnectedRef.current = true;
    
>>>>>>> 5772b46b8 (notifications)
    if (user?.id) {
      joinContractorRoom(user.id);
    }
  };

  const disconnect = (): void => {
    realtimeDisconnect();
    hasConnectedRef.current = false;
  };

<<<<<<< HEAD
  const subscribe = (
    eventType: string,
    handler: WebSocketEventHandler,
  ): (() => void) => {
=======
  const subscribe = (eventType: string, handler: WebSocketEventHandler): (() => void) => {
>>>>>>> 5772b46b8 (notifications)
    const websocket = connectionManager.getWebSocketService();
    return websocket.on(eventType, handler);
  };

  const emit = (eventType: string, data?: any): void => {
    const websocket = connectionManager.getWebSocketService();
    websocket.emit(eventType, data);
  };

  const updateLocation = (latitude: number, longitude: number): void => {
    realtimeUpdateLocation(latitude, longitude);
  };

  return {
    isConnected,
    isConnecting: connectionStatus.isConnecting,
    connectionStatus,
    connect,
    disconnect,
    subscribe,
    emit,
    updateLocation,
  };
};
