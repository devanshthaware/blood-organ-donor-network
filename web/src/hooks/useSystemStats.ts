"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  totalMLInferences: number;
  securityIncidents: number;
  systemUptime: number;
}

export function useSystemStats() {
  const statsData = useQuery(api.stats.getSystemStats, {});

  const stats: SystemStats = statsData || {
    totalUsers: 14,
    activeUsers: 12,
    totalRequests: 8,
    totalMLInferences: 24,
    securityIncidents: 0,
    systemUptime: 99.8,
  };

  return {
    stats,
    loading: statsData === undefined,
    error: null as Error | null,
  };
}
export default useSystemStats;
