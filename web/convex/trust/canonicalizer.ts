/**
 * Deterministic Canonicalizer & Cryptographic Hashing Engine
 * Ensures logically identical audit records produce identical SHA-256 digests.
 */

import { createHash } from "crypto";

/**
 * Recursively sorts all object keys alphabetically and standardizes primitive formatting.
 */
export function canonicalizeValue(val: any): any {
  if (val === null || val === undefined) {
    return null;
  }
  if (Array.isArray(val)) {
    return val.map((item) => canonicalizeValue(item));
  }
  if (typeof val === "object") {
    const sortedKeys = Object.keys(val).sort();
    const result: Record<string, any> = {};
    for (const key of sortedKeys) {
      result[key] = canonicalizeValue(val[key]);
    }
    return result;
  }
  if (typeof val === "number") {
    // Standardize floating point / integers
    return Number.isFinite(val) ? val : null;
  }
  return val;
}

/**
 * Converts any JavaScript object into a deterministic, canonical JSON string.
 */
export function canonicalStringify(obj: any): string {
  const canonicalObj = canonicalizeValue(obj);
  return JSON.stringify(canonicalObj);
}

/**
 * Calculates a SHA-256 cryptographic digest from an object or canonical string.
 */
export function computeSha256(data: any): string {
  const str = typeof data === "string" ? data : canonicalStringify(data);
  return createHash("sha256").update(str, "utf8").digest("hex");
}
