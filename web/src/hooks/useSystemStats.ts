"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  totalMLInferences: number;
  securityIncidents: number;
  systemUptime: number; // percentage
}

export function useSystemStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRequests: 0,
    totalMLInferences: 0,
    securityIncidents: 0,
    systemUptime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        // Get total users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const totalUsers = usersSnapshot.size;

        // Get active users (users with isActive flag)
        // Count users where isActive is not explicitly false
        let activeUsers = 0;
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          // Count as active if isActive is not explicitly false
          // Default to active if field doesn't exist
          if (data.isActive !== false) {
            activeUsers++;
          }
        });
        
        // If no active users found, use total as fallback
        if (activeUsers === 0 && totalUsers > 0) {
          activeUsers = totalUsers;
        }

        // Get total requests
        const requestsSnapshot = await getDocs(collection(db, "donation_requests"));
        const totalRequests = requestsSnapshot.size;

        // Get total ML inferences (count ml_outputs)
        const mlOutputsSnapshot = await getDocs(collection(db, "ml_outputs"));
        const totalMLInferences = mlOutputsSnapshot.size;

        // Get security incidents (audit logs with ERROR result in last 24 hours)
        const auditLogsSnapshot = await getDocs(collection(db, "audit_logs"));
        let securityIncidents = 0;
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        auditLogsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.result === "ERROR") {
            try {
              const timestamp = data.timestamp?.toDate?.() || 
                               (data.timestamp instanceof Date ? data.timestamp : null) ||
                               (typeof data.timestamp === 'object' && 'seconds' in data.timestamp 
                                 ? new Date(data.timestamp.seconds * 1000) 
                                 : null);
              // Count if timestamp exists and is within last 24 hours, or if no timestamp (count all errors)
              if (!timestamp || timestamp >= oneDayAgo) {
                securityIncidents++;
              }
            } catch {
              // If timestamp parsing fails, count the error anyway
              securityIncidents++;
            }
          }
        });

        // Calculate system uptime (based on successful operations in audit logs)
        let totalOps = 0;
        let successfulOps = 0;
        auditLogsSnapshot.forEach((doc) => {
          const data = doc.data();
          totalOps++;
          if (data.result === "SUCCESS") {
            successfulOps++;
          }
        });
        const systemUptime = totalOps > 0 ? Math.round((successfulOps / totalOps) * 100 * 10) / 10 : 100;

        setStats({
          totalUsers,
          activeUsers,
          totalRequests,
          totalMLInferences,
          securityIncidents,
          systemUptime,
        });
        setLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return { stats, loading, error };
}
