/**
 * Centralized logging utility
 * In production, this can be replaced with a proper logging service
 */

export const logger = {
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[ERROR] ${message}`, error);
    }
    // In production, send to logging service (e.g., Sentry, LogRocket)
  },
  warn: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[WARN] ${message}`, data);
    }
  },
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.info(`[INFO] ${message}`, data);
    }
  },
};
