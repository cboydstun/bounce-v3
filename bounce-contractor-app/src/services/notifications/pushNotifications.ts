import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { firebaseMessaging } from '../../config/firebase.config';
import { apiClient } from '../api/apiClient';

export interface PushNotificationConfig {
  enabled: boolean;
  autoRegister: boolean;
  showBadge: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  sound?: string;
  tag?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class PushNotificationService {
  private config: PushNotificationConfig = {
    enabled: true,
    autoRegister: true,
    showBadge: true,
    sound: true,
    vibration: true,
  };

  private isInitialized = false;
  private fcmToken: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config?: Partial<PushNotificationConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Push notifications already initialized');
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        await this.initializeNative();
      } else {
        await this.initializeWeb();
      }

      this.isInitialized = true;
      console.log('Push notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      throw error;
    }
  }

  /**
   * Initialize native push notifications (iOS/Android)
   */
  private async initializeNative(): Promise<void> {
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      this.fcmToken = token.value;
      this.registerTokenWithServer(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Listen for push notifications received
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ', notification);
      this.handleNotificationReceived(notification);
    });

    // Listen for push notification actions
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed: ', notification);
      this.handleNotificationAction(notification);
    });
  }

  /**
   * Initialize web push notifications (Firebase)
   */
  private async initializeWeb(): Promise<void> {
    if (!firebaseMessaging.isSupported()) {
      throw new Error('Push notifications not supported in this browser');
    }

    // Request permission and get token
    const token = await firebaseMessaging.getToken();
    
    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    this.fcmToken = token;
    await this.registerTokenWithServer(token);

    // Listen for foreground messages
    const unsubscribe = firebaseMessaging.onMessage((payload) => {
      console.log('Message received in foreground: ', payload);
      this.handleWebNotification(payload);
    });

    if (unsubscribe) {
      // Store unsubscribe function for cleanup
      this.listeners.set('foreground', new Set([unsubscribe]));
    }
  }

  /**
   * Register FCM token with server
   */
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await apiClient.post('/contractors/fcm-token', {
        token,
        platform: Capacitor.getPlatform(),
        deviceInfo: {
          model: Capacitor.isNativePlatform() ? 'mobile' : 'web',
          platform: Capacitor.getPlatform(),
          version: '1.0.0',
        },
      });

      console.log('FCM token registered with server');
    } catch (error) {
      console.error('Failed to register FCM token with server:', error);
      // Don't throw error - token registration failure shouldn't break the app
    }
  }

  /**
   * Handle notification received (native)
   */
  private handleNotificationReceived(notification: PushNotificationSchema): void {
    // Show local notification if app is in foreground
    if (this.config.enabled) {
      this.showLocalNotification({
        title: notification.title || 'New Notification',
        body: notification.body || '',
        data: notification.data,
      });
    }

    // Emit event to listeners
    this.emit('notificationReceived', notification);
  }

  /**
   * Handle notification action (native)
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const { actionId, notification } = action;
    
    console.log('Notification action:', actionId, notification);
    
    // Handle different actions
    switch (actionId) {
      case 'view':
        this.emit('notificationTapped', notification);
        break;
      case 'dismiss':
        this.emit('notificationDismissed', notification);
        break;
      default:
        this.emit('notificationAction', { actionId, notification });
    }
  }

  /**
   * Handle web notification (Firebase)
   */
  private handleWebNotification(payload: any): void {
    const { notification, data } = payload;
    
    if (this.config.enabled && notification) {
      this.showLocalNotification({
        title: notification.title || 'New Notification',
        body: notification.body || '',
        data: data || {},
        icon: notification.icon,
      });
    }

    // Emit event to listeners
    this.emit('notificationReceived', payload);
  }

  /**
   * Show local notification
   */
  private showLocalNotification(payload: NotificationPayload): void {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/favicon.png',
      badge: payload.badge,
      data: payload.data,
      tag: payload.tag,
      silent: !this.config.sound,
      requireInteraction: true,
    };

    const notification = new Notification(payload.title, options);

    notification.onclick = () => {
      this.emit('notificationTapped', payload);
      notification.close();
    };

    notification.onclose = () => {
      this.emit('notificationDismissed', payload);
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  /**
   * Subscribe to notification events
   */
  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in notification event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get current FCM token
   */
  public getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if notifications are enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable/disable notifications
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Get notification permission status
   */
  public getPermissionStatus(): NotificationPermission | 'unknown' {
    if (Capacitor.isNativePlatform()) {
      // For native platforms, we'd need to check via Capacitor
      return 'unknown';
    } else {
      return firebaseMessaging.getPermissionStatus();
    }
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await PushNotifications.requestPermissions();
        return permission.receive === 'granted';
      } else {
        const permission = await firebaseMessaging.requestPermission();
        return permission === 'granted';
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if push notifications are supported
   */
  public isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true; // Native platforms support push notifications
    } else {
      return firebaseMessaging.isSupported();
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PushNotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): PushNotificationConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.listeners.clear();
    this.isInitialized = false;
    this.fcmToken = null;

    if (Capacitor.isNativePlatform()) {
      PushNotifications.removeAllListeners();
    }
  }

  /**
   * Test notification (development only)
   */
  public async testNotification(): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('Notifications are disabled');
      return;
    }

    this.showLocalNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the Bounce Contractor app',
      data: { test: true },
    });
  }
}

// Create singleton instance
export const pushNotificationService = new PushNotificationService();

// Export class for testing
export { PushNotificationService };
