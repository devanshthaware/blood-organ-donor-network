"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface Alert {
  id: string;
  type: string;
  severity: string;
  bloodGroup?: string;
  bloodType?: string;
  title: string;
  message: string;
  confidence?: number;
  recommendedActions?: string[];
  area?: string;
  region?: number;
  createdAt: Date;
  acknowledgedAt?: Date;
}

export function useAlerts() {
  const alertsData = useQuery(api.alerts.getAlerts, {});

  const alerts: Alert[] = (alertsData || []).map((a: any) => ({
    id: a._id,
    type: a.type,
    severity: a.severity,
    bloodGroup: a.bloodType,
    bloodType: a.bloodType,
    title: a.title,
    message: a.message,
    createdAt: new Date(a.createdAt),
    acknowledgedAt: a.resolvedAt ? new Date(a.resolvedAt) : undefined,
  }));

  return {
    alerts,
    loading: alertsData === undefined,
    error: null,
  };
}
export default useAlerts;
