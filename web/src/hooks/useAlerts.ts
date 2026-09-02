"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface Alert {
  id: string;
  type: string;
  severity: string;
  bloodGroup: string;
  title: string;
  message: string;
  confidence?: number;
  recommendedActions?: string[];
  area?: string;
  region?: number;
  createdAt: Date | Timestamp;
  acknowledgedAt?: Date | Timestamp;
}

export function useAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Hospitals and admins can see alerts
    const q = query(
      collection(db, "alerts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Alert[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            ...docData,
            createdAt: docData.createdAt?.toDate() || new Date(),
            acknowledgedAt: docData.acknowledgedAt?.toDate(),
          } as Alert);
        });
        setAlerts(data);
        setLoading(false);
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { alerts, loading, error };
}
