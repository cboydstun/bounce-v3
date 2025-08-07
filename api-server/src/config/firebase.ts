import admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if Firebase service account is configured
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!serviceAccountKey || !projectId) {
      console.warn(
        "Firebase configuration missing. Push notifications will be disabled.",
      );
      console.warn("Required environment variables:");
      console.warn(
        "- FIREBASE_SERVICE_ACCOUNT_KEY (base64 encoded service account JSON)",
      );
      console.warn("- FIREBASE_PROJECT_ID");
      return null as any;
    }

    // Decode the base64 service account key
    let serviceAccount;
    try {
      const decodedKey = Buffer.from(serviceAccountKey, "base64").toString(
        "utf-8",
      );
      serviceAccount = JSON.parse(decodedKey);
    } catch (error) {
      console.error("Failed to decode Firebase service account key:", error);
      throw new Error("Invalid Firebase service account key format");
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId,
    });

    console.log("✅ Firebase Admin SDK initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
};

/**
 * Get Firebase Admin instance
 */
export const getFirebaseAdmin = (): admin.app.App => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

/**
 * Get Firebase Messaging instance
 */
export const getFirebaseMessaging = (): admin.messaging.Messaging => {
  const app = getFirebaseAdmin();
  if (!app) {
    throw new Error("Firebase Admin not initialized");
  }
  return app.messaging();
};

/**
 * Check if Firebase is properly configured
 */
export const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_PROJECT_ID
  );
};
