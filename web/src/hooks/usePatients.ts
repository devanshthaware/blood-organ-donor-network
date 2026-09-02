"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface Patient {
  id: string;
  hospitalId: string;
  name: string;
  age?: number;
  bloodGroup: string;
  status: string;
  admissionDate: Date | Timestamp;
  notes?: string;
  requestId?: string;
  createdAt: Date | Timestamp;
}

export function usePatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "patients"),
      where("hospitalId", "==", user.uid),
      orderBy("admissionDate", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Patient[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            ...docData,
            admissionDate: docData.admissionDate?.toDate() || new Date(),
            createdAt: docData.createdAt?.toDate() || new Date(),
          } as Patient);
        });
        setPatients(data);
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

  return { patients, loading, error };
}
