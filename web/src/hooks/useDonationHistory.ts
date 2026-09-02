"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface DonationHistoryEntry {
  id: string;
  donorId: string;
  hospitalId: string;
  hospitalName?: string;
  amount: number;
  donationDate: Date | Timestamp;
  status: string;
  reservationId?: string;
  requestId?: string;
  createdAt: Date | Timestamp;
}

export function useDonationHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<DonationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Helper to fetch hospital name with local cache
    const hospitalCache = new Map<string, string>();
    const getHospitalName = async (id: string) => {
      if (hospitalCache.has(id)) return hospitalCache.get(id);
      try {
        const hDoc = await getDoc(doc(db, "hospitals", id));
        const name = hDoc.exists() ? (hDoc.data().name || "Unknown Hospital") : "Unknown Hospital";
        hospitalCache.set(id, name);
        return name;
      } catch {
        return "Unknown Hospital";
      }
    };

    const historyQuery = query(
      collection(db, "donation_history"),
      where("donorId", "==", user.uid),
      orderBy("donationDate", "desc")
    );

    const terminalReservationsQuery = query(
      collection(db, "reservations"),
      where("donorId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    let historyEntries: any[] = [];
    let terminalReservations: any[] = [];

    const updateHistory = async () => {
      if (!isMounted) return;

      const combined: DonationHistoryEntry[] = [];

      // Add donation_history entries
      for (const entry of historyEntries) {
        const hospitalName = await getHospitalName(entry.hospitalId);
        combined.push({
          id: entry.id,
          ...entry,
          hospitalName,
          donationDate: entry.donationDate?.toDate() || new Date(),
          createdAt: entry.createdAt?.toDate() || new Date(),
        } as DonationHistoryEntry);
      }

      // Add terminal reservations (declined/accepted/confirmed/completed)
      const terminalStates = ["DECLINED", "ACCEPTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
      for (const res of terminalReservations) {
        if (terminalStates.includes(res.status)) {
          // Check if this reservation already has a matching history entry
          const existsInHistory = historyEntries.some(e => e.reservationId === res.id);
          if (existsInHistory) continue;

          const hospitalName = await getHospitalName(res.hospitalId);

          combined.push({
            id: `reservation_${res.id}`,
            donorId: user.uid,
            hospitalId: res.hospitalId,
            hospitalName,
            amount: 450, // Default amount
            donationDate: res.completedAt?.toDate() ||
              res.confirmedAt?.toDate() ||
              res.acceptedAt?.toDate() ||
              res.declinedAt?.toDate() ||
              res.createdAt?.toDate() ||
              new Date(),
            status: res.status,
            reservationId: res.id,
            requestId: res.requestId,
            createdAt: res.createdAt?.toDate() || new Date(),
          } as DonationHistoryEntry);
        }
      }

      // Sort by date (most recent first)
      combined.sort((a, b) => {
        const dA = a.donationDate instanceof Date ? a.donationDate : (a.donationDate as any).toDate();
        const dB = b.donationDate instanceof Date ? b.donationDate : (b.donationDate as any).toDate();
        return dB.getTime() - dA.getTime();
      });

      if (isMounted) {
        setHistory(combined);
        setLoading(false);
      }
    };

    const unsubHistory = onSnapshot(historyQuery, (snap) => {
      historyEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateHistory();
    });

    const unsubReservations = onSnapshot(terminalReservationsQuery, (snap) => {
      terminalReservations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateHistory();
    });

    return () => {
      isMounted = false;
      unsubHistory();
      unsubReservations();
    };
  }, [user]);

  return { history, loading, error };
}
