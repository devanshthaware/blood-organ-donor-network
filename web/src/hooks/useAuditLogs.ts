"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  timestamp: Date;
  result: "SUCCESS" | "FAILURE" | "ERROR";
  details?: Record<string, unknown>;
  errorMessage?: string;
}

export function useAuditLogs(maxLogs: number = 100) {
  const logsData = useQuery(api.audit.getAuditLogs, { limit: maxLogs });

  const auditLogs: AuditLog[] = (logsData || []).map((l: any) => ({
    id: l._id,
    userId: l.userId,
    userEmail: l.userEmail,
    action: l.action,
    resourceType: l.resourceType,
    resourceId: l.resourceId,
    ipAddress: l.ipAddress,
    timestamp: new Date(l.timestamp),
    result: l.result,
    details: l.details,
    errorMessage: l.errorMessage,
  }));

  return {
    auditLogs,
    loading: logsData === undefined,
    error: null as Error | null,
  };
}
export default useAuditLogs;
