import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

// Configure emulator connection for Admin SDK
// Firebase Admin SDK automatically uses emulators if FIREBASE_AUTH_EMULATOR_HOST is set
// Format for Auth emulator: localhost:9099 (NO http:// prefix!)
// Format for Firestore emulator: localhost:8080
const isDevelopment = process.env.NODE_ENV === "development";
const isLocalhost = typeof process !== "undefined" && 
                   (process.env.VERCEL === undefined && process.env.NODE_ENV !== "production");

if (isDevelopment && isLocalhost) {
  // Always clean and set Auth emulator host to ensure correct format
  // IMPORTANT: Admin SDK expects format "host:port" WITHOUT http://
  const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "localhost";
  const authPort = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || "9099";
  // Remove http:// or https:// if present, and extract just the hostname
  let cleanAuthHost = authHost.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  // Ensure we have a valid host (not empty, not just "http")
  if (!cleanAuthHost || cleanAuthHost === "http" || cleanAuthHost === "https") {
    cleanAuthHost = "localhost";
  }
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${cleanAuthHost}:${authPort}`;
  
  // Always clean and set Firestore emulator host to ensure correct format
  const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "localhost";
  const firestorePort = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || "8080";
  // Remove http:// or https:// if present, and extract just the hostname
  let cleanFirestoreHost = firestoreHost.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  // Ensure we have a valid host (not empty, not just "http")
  if (!cleanFirestoreHost || cleanFirestoreHost === "http" || cleanFirestoreHost === "https") {
    cleanFirestoreHost = "localhost";
  }
  process.env.FIRESTORE_EMULATOR_HOST = `${cleanFirestoreHost}:${firestorePort}`;
  
  // Debug logging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log(`[Firebase Admin] Emulator config:`, {
      auth: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      firestore: process.env.FIRESTORE_EMULATOR_HOST,
    });
  }
}

// Initialize Firebase Admin (server-side only)
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  // In production, use service account credentials
  // In development/emulator, use default credentials
  const hasCredentials = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
  
  if (hasCredentials) {
    // Production: use service account
    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID is required when using service account credentials");
    }
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    } catch (error) {
      throw new Error(`Failed to initialize Firebase Admin with credentials: ${error}`);
    }
  } else {
    // Development/Emulator: use default credentials
    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID is required");
    }
    adminApp = initializeApp({
      projectId,
    });
  }
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export default adminApp;
