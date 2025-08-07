import admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    console.log(
      "🔄 Firebase Admin SDK already initialized, returning existing instance",
    );
    return firebaseApp;
  }

  console.log("🚀 Initializing Firebase Admin SDK...");

  try {
    // Check if Firebase service account is configured
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    console.log("🔍 Checking Firebase environment variables:");
    console.log(
      `- FIREBASE_SERVICE_ACCOUNT_KEY: ${serviceAccountKey ? `Present (${serviceAccountKey.length} chars)` : "MISSING"}`,
    );
    console.log(`- FIREBASE_PROJECT_ID: ${projectId || "MISSING"}`);

    if (!serviceAccountKey || !projectId) {
      console.error(
        "❌ Firebase configuration missing. Push notifications will be disabled.",
      );
      console.error("Required environment variables:");
      console.error(
        "- FIREBASE_SERVICE_ACCOUNT_KEY (base64 encoded service account JSON)",
      );
      console.error("- FIREBASE_PROJECT_ID");
      throw new Error("Firebase configuration missing");
    }

    // Decode the base64 service account key
    let serviceAccount: any;
    try {
      console.log("🔓 Decoding base64 service account key...");
      const decodedKey = Buffer.from(serviceAccountKey, "base64").toString(
        "utf-8",
      );
      console.log(
        `✅ Base64 decoded successfully (${decodedKey.length} chars)`,
      );

      console.log("📄 Parsing service account JSON...");
      serviceAccount = JSON.parse(decodedKey);
      console.log("✅ Service account JSON parsed successfully");

      // Validate required fields
      const requiredFields = [
        "type",
        "project_id",
        "private_key_id",
        "private_key",
        "client_email",
        "client_id",
      ];
      const missingFields = requiredFields.filter(
        (field) => !serviceAccount[field],
      );

      if (missingFields.length > 0) {
        console.error(
          "❌ Service account JSON missing required fields:",
          missingFields,
        );
        throw new Error(
          `Service account missing fields: ${missingFields.join(", ")}`,
        );
      }

      console.log("✅ Service account validation passed");
      console.log(`- Type: ${serviceAccount.type}`);
      console.log(`- Project ID: ${serviceAccount.project_id}`);
      console.log(`- Client Email: ${serviceAccount.client_email}`);
    } catch (error: any) {
      console.error("❌ Failed to decode/parse Firebase service account key:");
      console.error("Error details:", error);

      if (error instanceof SyntaxError) {
        console.error(
          "🔍 This appears to be a JSON parsing error. Check if the base64 encoded service account is valid.",
        );
        console.error(
          "🔍 First 100 chars of decoded key:",
          serviceAccountKey.substring(0, 100),
        );
      }

      throw new Error(
        `Invalid Firebase service account key format: ${error.message}`,
      );
    }

    // Verify project ID matches
    if (serviceAccount.project_id !== projectId) {
      console.warn(
        `⚠️ Project ID mismatch: env=${projectId}, serviceAccount=${serviceAccount.project_id}`,
      );
      console.warn("Using service account project ID");
    }

    console.log("🔧 Initializing Firebase Admin with credentials...");

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id, // Use project ID from service account
    });

    console.log("✅ Firebase Admin SDK initialized successfully!");
    console.log(`🎯 Project ID: ${serviceAccount.project_id}`);
    console.log(`📧 Service Account: ${serviceAccount.client_email}`);

    return firebaseApp;
  } catch (error: any) {
    console.error("❌ CRITICAL: Failed to initialize Firebase Admin SDK");
    console.error("Error type:", error?.constructor?.name || "Unknown");
    console.error("Error message:", error?.message || "Unknown error");
    console.error("Error stack:", error?.stack || "No stack trace");

    // Don't throw - let the service handle the null case
    firebaseApp = null;
    return null as any;
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
