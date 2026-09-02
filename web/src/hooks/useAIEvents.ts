"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface AIEvent {
  id: string;
  modelName: string;
  modelType: string;
  inputSummary: Record<string, unknown>;
  outputSummary: Record<string, unknown>;
  status: "SUCCESS" | "FAILED";
  createdAt: Date;
  triggerSource?: string;
  requestId?: string;
  reservationId?: string;
  executionTimeMs?: number;
  modelVersion?: string;
  errorMessage?: string;
  confidence?: number;
}

export function useAIEvents(maxEvents: number = 100) {
  const eventsData = useQuery(api.aiEvents.getAIEvents, { limit: maxEvents });

  const events: AIEvent[] = (eventsData || []).map((e: any) => ({
    id: e._id,
    modelName: e.modelName,
    modelType: e.modelType,
    inputSummary: e.inputSummary || {},
    outputSummary: e.outputSummary || {},
    status: e.status,
    createdAt: new Date(e.createdAt),
    triggerSource: e.triggerSource,
    requestId: e.requestId,
    reservationId: e.reservationId,
    executionTimeMs: e.executionTimeMs,
    modelVersion: e.modelVersion,
    errorMessage: e.errorMessage,
    confidence: e.confidence,
  }));

  return {
    events,
    loading: eventsData === undefined,
    error: null as Error | null,
  };
}
export default useAIEvents;
