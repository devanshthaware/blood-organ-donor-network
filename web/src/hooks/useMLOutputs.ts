"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface MLLog {
  id: string;
  modelType: string;
  timestamp: Date | Timestamp;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  requestId?: string;
  reservationId?: string;
}

export function useMLOutputs(maxLogs: number = 50) {
  const { user } = useAuth();
  const [mlLogs, setMlLogs] = useState<MLLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log("useMLOutputs: Checking user...", user);
    if (!user) {
      console.log("useMLOutputs: No user found.");
      setLoading(false);
      return;
    }

    console.log("useMLOutputs: User found, setting up listener...", user.uid);

    // Query recent ML outputs
    const q = query(
      collection(db, "ml_outputs"),
      // orderBy("timestamp", "desc"),
      limit(maxLogs)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`useMLOutputs: Snapshot received. Size: ${snapshot.size}, Empty: ${snapshot.empty}`);
        const data: MLLog[] = [];
        snapshot.forEach((doc) => {
          console.log("useMLOutputs: Doc found:", doc.id);
          const docData = doc.data();
          data.push({
            id: doc.id,
            modelType: docData.modelType || "unknown",
            timestamp: docData.timestamp?.toDate() || new Date(),
            input: docData.input || {},
            output: docData.output || {},
            requestId: docData.requestId,
            reservationId: docData.reservationId,
          } as MLLog);
        });
        setMlLogs(data);
        setLoading(false);
      },
      (err) => {
        console.error("useMLOutputs: Error in snapshot listener:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, maxLogs]);

  return { mlLogs, loading, error };
}
