import { useEffect, useRef } from 'react';
import { useRealtimeStore } from '../../store/realtimeStore';
import { useAuthStore } from '../../store/authStore';
import { WebSocketEventData, WebSocketEventHandler } from '../../services/realtime/websocketService';
import { connectionManager } from '../../services/realtime/connectionManager';

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
export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const { autoConnect = true, reconnectOnAuth = true } = options;
  
  const {
    isConnected,
    connectionStatus,
    connect: realtimeConnect,
    disconnect: realtimeDisconnect,
    updateLocation: realtimeUpdateLocation,
    joinContractorRoom,
  } = useRealtimeStore();
  
  const { tokens, user } = useAuthStore();
  const hasConnectedRef = useRef(false);

  // Auto-connect when authenticated
  useEffect(() => {
    if (tokens && autoConnect && !hasConnectedRef.current) {
      realtimeConnect(tokens).then(() => {
        hasConnectedRef.current = true;
        
        // Join contractor-specific room for targeted notifications
        if (user?.id) {
          joinContractorRoom(user.id);
        }
      }).catch((error) => {
        console.error('Auto-connect failed:', error);
      });
    }
  }, [tokens, autoConnect, realtimeConnect, user?.id, joinContractorRoom]);

  // Reconnect when auth tokens change
  useEffect(() => {
    if (tokens && reconnectOnAuth && hasConnectedRef.current) {
      realtimeConnect(tokens).catch((error) => {
        console.error('Reconnect on auth failed:', error);
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
      throw new Error('No authentication tokens available');
    }
    
    await realtimeConnect(tokens);
    hasConnectedRef.current = true;
    
    if (user?.id) {
      joinContractorRoom(user.id);
    }
  };

  const disconnect = (): void => {
    realtimeDisconnect();
    hasConnectedRef.current = false;
  };

  const subscribe = (eventType: string, handler: WebSocketEventHandler): (() => void) => {
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
