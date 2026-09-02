/**
 * Application Configuration
 * All configurable values should be here, not hardcoded in components
 */

// Emulator Configuration
export const EMULATOR_CONFIG = {
  auth: {
    host: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "localhost",
    port: parseInt(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || "9099", 10),
    get url() {
      return `http://${this.host}:${this.port}`;
    },
  },
  firestore: {
    host: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "localhost",
    port: parseInt(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || "8080", 10),
  },
  ui: {
    host: process.env.NEXT_PUBLIC_EMULATOR_UI_HOST || "localhost",
    port: parseInt(process.env.NEXT_PUBLIC_EMULATOR_UI_PORT || "4000", 10),
    get url() {
      return `http://${this.host}:${this.port}`;
    },
  },
} as const;

// ML API Configuration
export const ML_API_CONFIG = {
  url: process.env.NEXT_PUBLIC_ML_API_URL || "",
  timeout: parseInt(process.env.NEXT_PUBLIC_ML_API_TIMEOUT || "30000", 10),
} as const;

// App Configuration
export const APP_CONFIG = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;
