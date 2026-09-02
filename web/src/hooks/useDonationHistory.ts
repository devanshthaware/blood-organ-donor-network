"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export interface DonationHistoryEntry {
  id: string;
  donorId: string;
  hospitalId: string;
  hospitalName?: string;
  amount: number;
  donationDate: Date;
  status: string;
  reservationId?: string;
  requestId?: string;
  createdAt: Date;
}

export function useDonationHistory() {
  const { user } = useAuth();
  const reservationsData = useQuery(
    api.reservations.getReservations,
    user?.uid ? { donorId: user.uid } : "skip"
  );

  const history: DonationHistoryEntry[] = (reservationsData || [])
    .filter((r: any) =>
      ["ACCEPTED", "CONFIRMED", "COMPLETED", "DECLINED"].includes(r.status)
    )
    .map((r: any) => ({
      id: r._id,
      donorId: r.donorId,
      hospitalId: r.hospitalId,
      hospitalName: r.hospitalName || "Medical Center",
      amount: 450,
      donationDate: new Date(r.completedAt || r.respondedAt || r.createdAt),
      status: r.status,
      reservationId: r._id,
      requestId: r.requestId,
      createdAt: new Date(r.createdAt),
    }));

  return {
    history,
    loading: reservationsData === undefined,
    error: null,
  };
}
export default useDonationHistory;
