/**
 * Audit logging helper
 */
import { logger } from "./logger";

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
  logger.info(`Audit log: [${result}] ${action} on ${resourceType}:${resourceId} by ${userId} (${userEmail})`, {
    details,
    errorMessage,
    ipAddress,
  });
}

export async function getUserEmail(_userId: string): Promise<string> {
  return "user@veinlink.org";
}
