// Firebase Messaging Service Worker
// This file handles background push notifications when the app is not in focus

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
// Note: These should match the configuration in firebase.config.ts
const firebaseConfig = {
  apiKey: "AIzaSyAz7olOEMdDURfHksMtD2TKaQgq6GKUoYw",
  authDomain: "bouncer-contractor.firebaseapp.com",
  projectId: "bouncer-contractor",
  storageBucket: "bouncer-contractor.firebasestorage.app",
  messagingSenderId: "105191716611",
  appId: "1:105191716611:web:f9b0035b6d150a7fce1b36",
  measurementId: "G-HFLBTFQK4H"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const { notification, data } = payload;
  
  // Customize notification
  const notificationTitle = notification?.title || 'Bounce Contractor';
  const notificationOptions = {
    body: notification?.body || 'You have a new notification',
    icon: notification?.icon || '/favicon.png',
    badge: '/favicon.png',
    tag: data?.tag || 'bounce-notification',
    data: data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/favicon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  const { notification, action } = event;
  const data = notification.data || {};

  // Close notification
  notification.close();

  if (action === 'dismiss') {
    // User dismissed the notification
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Focus existing window and send message
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: data,
            action: action || 'view'
          });
          return;
        }
      }

      // Open new window if app is not open
      let url = self.location.origin;
      
      // Navigate to specific page based on notification data
      if (data.taskId) {
        url += `/tasks/${data.taskId}`;
      } else if (data.page) {
        url += data.page;
      }

      return clients.openWindow(url);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  
  // Track notification dismissal if needed
  const data = event.notification.data || {};
  
  // Send analytics or tracking data
  if (data.trackingId) {
    // Could send tracking data to analytics service
    console.log('Notification dismissed:', data.trackingId);
  }
});

// Handle push event (fallback)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);

  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Push payload:', payload);

    // Handle push notification if Firebase messaging doesn't handle it
    if (!payload.notification) {
      // Custom push notification handling
      const notificationTitle = payload.title || 'Bounce Contractor';
      const notificationOptions = {
        body: payload.body || 'You have a new notification',
        icon: payload.icon || '/favicon.png',
        badge: '/favicon.png',
        data: payload.data || {},
        tag: payload.tag || 'bounce-notification'
      };

      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    }
  } catch (error) {
    console.error('Error parsing push payload:', error);
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installing...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activating...');
  
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message received:', event.data);

  const { type, data } = event.data || {};

  switch (type) {
    case 'UPDATE_CONFIG':
      // Update service worker configuration
      console.log('Updating service worker config:', data);
      break;
    
    case 'CLEAR_NOTIFICATIONS':
      // Clear all notifications
      self.registration.getNotifications().then((notifications) => {
        notifications.forEach((notification) => {
          notification.close();
        });
      });
      break;
    
    default:
      console.log('Unknown message type:', type);
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[firebase-messaging-sw.js] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[firebase-messaging-sw.js] Unhandled promise rejection:', event.reason);
});

console.log('[firebase-messaging-sw.js] Service worker loaded successfully');
