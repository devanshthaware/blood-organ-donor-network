"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface MLLog {
  id: string;
  modelType: string;
  timestamp: Date;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  requestId?: string;
  reservationId?: string;
}

export function useMLOutputs(maxLogs: number = 50) {
  const eventsData = useQuery(api.aiEvents.getAIEvents, { limit: maxLogs });

  const mlLogs: MLLog[] = (eventsData || []).map((e: any) => ({
    id: e._id,
    modelType: e.modelType,
    timestamp: new Date(e.createdAt),
    input: e.inputSummary || {},
    output: e.outputSummary || {},
    requestId: e.requestId,
    reservationId: e.reservationId,
  }));

  return {
    mlLogs,
    loading: eventsData === undefined,
    error: null,
  };
}
export default useMLOutputs;
