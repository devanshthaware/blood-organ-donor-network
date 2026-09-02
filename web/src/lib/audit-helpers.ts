/**
 * Audit logging helper for API routes
 * Ensures all actions are logged to audit_logs collection
 */

import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "./logger";

/**
 * Log an action to audit_logs collection
 * This ensures all actions are tracked for security and compliance
 */
export async function logAuditAction(
  userId: string,
  userEmail: string,
  action: string,
  resourceType: string,
  resourceId: string,
  result: "SUCCESS" | "FAILURE" | "ERROR",
  details?: Record<string, unknown>,
  errorMessage?: string,
  ipAddress?: string
): Promise<void> {
  try {
    await adminDb.collection("audit_logs").add({
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      ipAddress: ipAddress || "system",
      timestamp: FieldValue.serverTimestamp(),
      result,
      details: details || {},
      ...(errorMessage && { errorMessage }),
    });
    logger.info(`Audit log created: ${action} for ${resourceType} ${resourceId} by ${userId}`);
  } catch (error) {
    logger.error("Failed to write audit log", error);
    // Don't throw - audit logging failure shouldn't break the API
  }
}

/**
 * Get user email from userId
 */
export async function getUserEmail(userId: string): Promise<string> {
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data()?.email || "unknown@example.com";
    }
    return "unknown@example.com";
  } catch (error) {
    logger.error("Failed to get user email", error);
    return "unknown@example.com";
  }
}
