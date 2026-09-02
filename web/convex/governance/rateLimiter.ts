/**
 * Sliding Window Rate Limiter & Abuse Prevention
 * Protects critical endpoints from brute-force, request spam, and API exhaustion.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 attempts per min
  requests: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 requests per min
  verification: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 attempts per min
  default: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 requests per min
};

/**
 * Checks and records an action in the sliding window rate limiter.
 */
export function checkRateLimit(
  key: string,
  configType: keyof typeof DEFAULT_LIMITS = "default"
): {
  allowed: boolean;
  currentCount: number;
  maxRequests: number;
  resetMs: number;
} {
  const config = DEFAULT_LIMITS[configType] || DEFAULT_LIMITS.default;
  const now = Date.now();
  const cutoff = now - config.windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= config.maxRequests) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, oldest + config.windowMs - now);
    return {
      allowed: false,
      currentCount: record.timestamps.length,
      maxRequests: config.maxRequests,
      resetMs,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    currentCount: record.timestamps.length,
    maxRequests: config.maxRequests,
    resetMs: config.windowMs,
  };
}

/**
 * Clears rate limiter cache (for tests/reset).
 */
export function resetRateLimits() {
  rateLimitStore.clear();
}
