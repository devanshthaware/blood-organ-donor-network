"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, Timestamp, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  timestamp: Date | Timestamp;
  result: "SUCCESS" | "FAILURE" | "ERROR";
  details?: Record<string, unknown>;
  errorMessage?: string;
}

export function useAuditLogs(maxLogs: number = 100) {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Only admins can see audit logs
    const q = query(
      collection(db, "audit_logs"),
      orderBy("timestamp", "desc"),
      limit(maxLogs)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: AuditLog[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            userId: docData.userId || "",
            userEmail: docData.userEmail || "",
            action: docData.action || "",
            resourceType: docData.resourceType || "",
            resourceId: docData.resourceId || "",
            ipAddress: docData.ipAddress || "system",
            timestamp: docData.timestamp?.toDate() || new Date(),
            result: docData.result || "SUCCESS",
            details: docData.details,
            errorMessage: docData.errorMessage,
          } as AuditLog);
        });
        setAuditLogs(data);
        setLoading(false);
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, maxLogs]);

  return { auditLogs, loading, error };
}
