import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  MessagePayload,
} from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";
import { APP_CONFIG } from "./app.config";

// Firebase configuration
// Note: These will need to be replaced with actual Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
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
};

// Validation helper
export const validateFirebaseConfig = (): boolean => {
  const requiredFields = [
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
        `demo-${field.toLowerCase().replace(/([A-Z])/g, "-$1")}` ||
      (firebaseConfig[field as keyof typeof firebaseConfig] as string).includes(
        "demo",
      ),
  );

  if (missingFields.length > 0) {
    console.warn(
      "Firebase configuration incomplete. Missing or demo values for:",
      missingFields,
    );
    return false;
  }

  return true;
};

// Check if Firebase config is valid before initializing
const isFirebaseConfigValid = validateFirebaseConfig();

// Initialize Firebase only if config is valid
export const firebaseApp = isFirebaseConfigValid
  ? initializeApp(firebaseConfig)
  : null;

// Initialize Firebase Cloud Messaging
// Initialize services synchronously to avoid timing issues
let messaging: any = null;
let analytics: any = null;

// Only initialize if we have a valid config and we're in a browser environment
if (typeof window !== "undefined" && firebaseApp && isFirebaseConfigValid) {
  try {
    // Try to import Capacitor synchronously if available
    let isNativePlatform = false;
    try {
      // Check if we're in a Capacitor environment
      isNativePlatform =
        (window as any).Capacitor?.isNativePlatform?.() || false;
    } catch {
      // If Capacitor is not available, assume web platform
      isNativePlatform = false;
    }

    // Only initialize Firebase messaging on web platforms
    if (!isNativePlatform) {
      try {
        messaging = getMessaging(firebaseApp);
        console.log("Firebase web messaging initialized successfully");
      } catch (error) {
        console.warn("Firebase messaging initialization failed:", error);
        messaging = null;
      }

      // Initialize Analytics only in production and only on web
      if (APP_CONFIG.IS_PRODUCTION) {
        try {
          analytics = getAnalytics(firebaseApp);
          console.log("Firebase analytics initialized successfully");
        } catch (error) {
          console.warn("Firebase analytics initialization failed:", error);
          analytics = null;
        }
      }
    } else {
      console.info(
        "Native platform detected - skipping Firebase web messaging initialization",
      );
    }
  } catch (error) {
    console.warn("Firebase services initialization failed:", error);
    messaging = null;
    analytics = null;
  }
} else if (!isFirebaseConfigValid) {
  console.info(
    "Firebase not initialized - using demo/invalid configuration. Push notifications will be disabled.",
  );
}

export { messaging, analytics };

// VAPID key for web push notifications
// This will need to be replaced with actual VAPID key from Firebase Console
export const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY || "demo-vapid-key";

// Firebase Cloud Messaging helper functions
export const firebaseMessaging = {
  /**
   * Get FCM token (only if permission is already granted)
   */
  async getToken(): Promise<string | null> {
    if (!messaging) {
      console.warn("Firebase messaging not initialized");
      return null;
    }

    try {
      // Check if permission is already granted
      const permission = this.getPermissionStatus();

      if (permission !== "granted") {
        console.warn(
          "Notification permission not granted, cannot get FCM token",
        );
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
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
      return null;
    }
  },

  /**
   * Listen for foreground messages
   */
  onMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
    if (!messaging) {
      console.warn("Firebase messaging not initialized");
      return null;
    }

    try {
      const unsubscribe = onMessage(messaging, callback);
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up message listener:", error);
      return null;
    }
  },

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      messaging !== null
    );
  },

  /**
   * Check notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  },

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  },
};

// Export configuration for debugging
export const getFirebaseConfig = () => ({
  ...firebaseConfig,
  // Don't expose sensitive keys in logs
  apiKey: firebaseConfig.apiKey ? "[CONFIGURED]" : "[NOT SET]",
});

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
