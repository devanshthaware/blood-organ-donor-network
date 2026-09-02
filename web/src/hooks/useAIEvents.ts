"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface AIEvent {
  id: string;
  modelName: string;
  modelType: string;
  inputSummary: Record<string, unknown>;
  outputSummary: Record<string, unknown>;
  status: "SUCCESS" | "FAILED";
  createdAt: Date | Timestamp;
  triggerSource?: string;
  requestId?: string;
  reservationId?: string;
  executionTimeMs?: number;
  modelVersion?: string;
  errorMessage?: string;
  confidence?: number;
}

export function useAIEvents(maxEvents: number = 100) {
  const { user } = useAuth();
  const [events, setEvents] = useState<AIEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Query AI events ordered by creation time (newest first)
    const q = query(
      collection(db, "ai_events"),
      orderBy("createdAt", "desc"),
      limit(maxEvents)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: AIEvent[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            modelName: docData.modelName || docData.modelType || "unknown",
            modelType: docData.modelType || "unknown",
            inputSummary: docData.inputSummary || docData.input || {},
            outputSummary: docData.outputSummary || docData.output || {},
            status: docData.status || "SUCCESS",
            createdAt: docData.createdAt?.toDate() || new Date(),
            triggerSource: docData.triggerSource,
            requestId: docData.requestId,
            reservationId: docData.reservationId,
            executionTimeMs: docData.executionTimeMs,
            modelVersion: docData.modelVersion,
            errorMessage: docData.errorMessage,
            confidence: docData.confidence,
          } as AIEvent);
        });
        setEvents(data);
        setLoading(false);
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, maxEvents]);

  return { events, loading, error };
}
