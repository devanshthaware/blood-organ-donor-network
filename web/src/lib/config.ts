/**
 * VeinLink Application Configuration
 * All configurable values and service endpoints
 */

// Core Services Configuration
export const SERVICES_CONFIG = {
  convex: {
    url: process.env.NEXT_PUBLIC_CONVEX_URL || "",
  },
  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  },
  mlApi: {
    url: process.env.NEXT_PUBLIC_ML_API_URL || "http://localhost:8000",
    timeout: parseInt(process.env.NEXT_PUBLIC_ML_API_TIMEOUT || "30000", 10),
  },
  n8n: {
    webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "http://localhost:5678",
  },
} as const;

// App Runtime Configuration
export const APP_CONFIG = {
  name: "VeinLink",
  version: "2.1.0-hackathon-final",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;
