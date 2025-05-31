<<<<<<< HEAD
import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  MessagePayload,
} from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";
import { APP_CONFIG } from "./app.config";
=======
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';
import { APP_CONFIG } from './app.config';
>>>>>>> 5772b46b8 (notifications)

// Firebase configuration
// Note: These will need to be replaced with actual Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
<<<<<<< HEAD
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "bounce-contractor-demo.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "bounce-contractor-demo",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "bounce-contractor-demo.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
=======
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bounce-contractor-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bounce-contractor-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bounce-contractor-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
>>>>>>> 5772b46b8 (notifications)
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: any = null;
let analytics: any = null;

// Initialize services only in browser environment
<<<<<<< HEAD
if (typeof window !== "undefined") {
  try {
    messaging = getMessaging(firebaseApp);

=======
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(firebaseApp);
    
>>>>>>> 5772b46b8 (notifications)
    // Initialize Analytics only in production
    if (APP_CONFIG.IS_PRODUCTION) {
      analytics = getAnalytics(firebaseApp);
    }
  } catch (error) {
<<<<<<< HEAD
    console.warn("Firebase services initialization failed:", error);
=======
    console.warn('Firebase services initialization failed:', error);
>>>>>>> 5772b46b8 (notifications)
  }
}

export { messaging, analytics };

// VAPID key for web push notifications
// This will need to be replaced with actual VAPID key from Firebase Console
<<<<<<< HEAD
export const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY || "demo-vapid-key";
=======
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "demo-vapid-key";
>>>>>>> 5772b46b8 (notifications)

// Firebase Cloud Messaging helper functions
export const firebaseMessaging = {
  /**
<<<<<<< HEAD
   * Get FCM token (only if permission is already granted)
   */
  async getToken(): Promise<string | null> {
    if (!messaging) {
      console.warn("Firebase messaging not initialized");
=======
   * Request notification permission and get FCM token
   */
  async getToken(): Promise<string | null> {
    if (!messaging) {
      console.warn('Firebase messaging not initialized');
>>>>>>> 5772b46b8 (notifications)
      return null;
    }

    try {
<<<<<<< HEAD
      // Check if permission is already granted
      const permission = this.getPermissionStatus();

      if (permission !== "granted") {
        console.warn(
          "Notification permission not granted, cannot get FCM token",
        );
=======
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
>>>>>>> 5772b46b8 (notifications)
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
<<<<<<< HEAD
        console.log("FCM token obtained:", token);
        return token;
      } else {
        console.warn("No FCM token available");
        return null;
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  },

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    if (!messaging) {
      console.warn("Firebase messaging not initialized");
      return null;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.warn("Notification permission denied");
        return null;
      }

      // Get FCM token after permission granted
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        console.log("FCM token obtained after permission granted:", token);
        return token;
      } else {
        console.warn("No FCM token available");
        return null;
      }
    } catch (error) {
      console.error(
        "Error requesting permission and getting FCM token:",
        error,
      );
=======
        console.log('FCM token obtained:', token);
        return token;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
>>>>>>> 5772b46b8 (notifications)
      return null;
    }
  },

  /**
   * Listen for foreground messages
   */
  onMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
    if (!messaging) {
<<<<<<< HEAD
      console.warn("Firebase messaging not initialized");
=======
      console.warn('Firebase messaging not initialized');
>>>>>>> 5772b46b8 (notifications)
      return null;
    }

    try {
      const unsubscribe = onMessage(messaging, callback);
      return unsubscribe;
    } catch (error) {
<<<<<<< HEAD
      console.error("Error setting up message listener:", error);
=======
      console.error('Error setting up message listener:', error);
>>>>>>> 5772b46b8 (notifications)
      return null;
    }
  },

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return (
<<<<<<< HEAD
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
=======
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
>>>>>>> 5772b46b8 (notifications)
      messaging !== null
    );
  },

  /**
   * Check notification permission status
   */
  getPermissionStatus(): NotificationPermission {
<<<<<<< HEAD
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
=======
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
>>>>>>> 5772b46b8 (notifications)
    }
    return Notification.permission;
  },

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
<<<<<<< HEAD
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
=======
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
>>>>>>> 5772b46b8 (notifications)
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
<<<<<<< HEAD
      console.error("Error requesting notification permission:", error);
      return "denied";
=======
      console.error('Error requesting notification permission:', error);
      return 'denied';
>>>>>>> 5772b46b8 (notifications)
    }
  },
};

// Export configuration for debugging
export const getFirebaseConfig = () => ({
  ...firebaseConfig,
  // Don't expose sensitive keys in logs
<<<<<<< HEAD
  apiKey: firebaseConfig.apiKey ? "[CONFIGURED]" : "[NOT SET]",
=======
  apiKey: firebaseConfig.apiKey ? '[CONFIGURED]' : '[NOT SET]',
>>>>>>> 5772b46b8 (notifications)
});

// Validation helper
export const validateFirebaseConfig = (): boolean => {
  const requiredFields = [
<<<<<<< HEAD
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const missingFields = requiredFields.filter(
    (field) =>
      !firebaseConfig[field as keyof typeof firebaseConfig] ||
      firebaseConfig[field as keyof typeof firebaseConfig] ===
        `demo-${field.toLowerCase().replace(/([A-Z])/g, "-$1")}`,
  );

  if (missingFields.length > 0) {
    console.warn(
      "Firebase configuration incomplete. Missing or demo values for:",
      missingFields,
    );
=======
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => 
    !firebaseConfig[field as keyof typeof firebaseConfig] || 
    firebaseConfig[field as keyof typeof firebaseConfig] === `demo-${field.toLowerCase().replace(/([A-Z])/g, '-$1')}`
  );

  if (missingFields.length > 0) {
    console.warn('Firebase configuration incomplete. Missing or demo values for:', missingFields);
>>>>>>> 5772b46b8 (notifications)
    return false;
  }

  return true;
};

// Initialize validation check
if (APP_CONFIG.IS_DEVELOPMENT) {
  const isValid = validateFirebaseConfig();
  if (!isValid) {
    console.warn(`
🔥 Firebase Configuration Notice:
- Currently using demo/placeholder values
- To enable push notifications, create a Firebase project and update environment variables:
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN  
  - VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_APP_ID
  - VITE_FIREBASE_VAPID_KEY
    `);
  }
}
