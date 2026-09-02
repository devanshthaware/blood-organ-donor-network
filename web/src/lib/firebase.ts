import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { EMULATOR_CONFIG, APP_CONFIG } from "./config";

// Lazy initialization to avoid blocking page load
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

// Initialize Firebase only when needed
function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  
  const isDevelopment = APP_CONFIG.isDevelopment;
  const isBrowser = typeof window !== "undefined";
  const isLocalhost = isBrowser && 
                      (window.location.hostname === "localhost" || 
                       window.location.hostname === "127.0.0.1");
  const useEmulator = isDevelopment && isLocalhost;

  // Firebase config
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (useEmulator ? "AIzaSyDemo123456789012345678901234567890" : ""),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (useEmulator ? "localhost" : ""),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };

  // Validate required config in production
  if (APP_CONFIG.isProduction) {
    const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
    const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
    if (missing.length > 0) {
      throw new Error(`Missing required Firebase config: ${missing.join(", ")}. Please set environment variables.`);
    }
  }

  // Initialize Firebase
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return app;
}

// Initialize auth instance (lazy)
function initAuth(): Auth {
  if (authInstance) return authInstance;
  
  const firebaseApp = getFirebaseApp();
  const isBrowser = typeof window !== "undefined";
  const isDevelopment = APP_CONFIG.isDevelopment;
  const isLocalhost = isBrowser && 
                      (window.location.hostname === "localhost" || 
                       window.location.hostname === "127.0.0.1");
  const useEmulator = isDevelopment && isLocalhost;

  authInstance = getAuth(firebaseApp);

  // Connect to emulators asynchronously to avoid blocking
  if (isBrowser && useEmulator) {
    // Use setTimeout to defer emulator connection (non-blocking)
    setTimeout(() => {
      try {
        connectAuthEmulator(authInstance!, EMULATOR_CONFIG.auth.url, { 
          disableWarnings: true 
        });
      } catch (error: any) {
        // Silently ignore connection errors to avoid blocking
        if (!error?.message?.includes("already") && !error?.message?.includes("Cannot connect")) {
          // Only log in development console, don't throw
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠ Auth emulator connection:", error?.message);
          }
        }
      }
    }, 0);
  }

  return authInstance;
}

// Initialize firestore instance (lazy)
function initFirestore(): Firestore {
  if (dbInstance) return dbInstance;
  
  const firebaseApp = getFirebaseApp();
  const isBrowser = typeof window !== "undefined";
  const isDevelopment = APP_CONFIG.isDevelopment;
  const isLocalhost = isBrowser && 
                      (window.location.hostname === "localhost" || 
                       window.location.hostname === "127.0.0.1");
  const useEmulator = isDevelopment && isLocalhost;

  dbInstance = getFirestore(firebaseApp);

  // Connect to emulators asynchronously to avoid blocking
  if (isBrowser && useEmulator) {
    // Use setTimeout to defer emulator connection (non-blocking)
    setTimeout(() => {
      try {
        connectFirestoreEmulator(dbInstance!, EMULATOR_CONFIG.firestore.host, EMULATOR_CONFIG.firestore.port);
      } catch (error: any) {
        // Silently ignore connection errors to avoid blocking
        if (!error?.message?.includes("already") && !error?.message?.includes("Cannot connect")) {
          // Only log in development console, don't throw
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠ Firestore emulator connection:", error?.message);
          }
        }
      }
    }, 0);
  }

  return dbInstance;
}

// Export instances - initialization is fast, only emulator connection is deferred
export const auth = initAuth();
export const db = initFirestore();

export default getFirebaseApp;
