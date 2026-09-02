"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export interface Reservation {
  id: string;
  _id?: string;
  requestId: string;
  donorId: string;
  donorName?: string;
  hospitalId: string;
  hospitalName?: string;
  status: string;
  rank: number;
  mlScores?: {
    availability: number;
    reliability: number;
    combined: number;
  };
  explanation?: string;
  distanceKm?: number;
  bloodGroup?: string;
  bloodType?: string;
  createdAt: Date;
  expiresAt?: any;
  estArrival?: number;
  acceptedAt?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
}

export function useReservations(role: "donor" | "hospital") {
  const { user } = useAuth();

  const reservationsData = useQuery(
    api.reservations.getReservations,
    user?.uid
      ? role === "donor"
        ? { donorId: user.uid }
        : { hospitalId: user.uid }
      : "skip"
  );

  const acceptMutation = useMutation(api.reservations.acceptReservation);
  const declineMutation = useMutation(api.reservations.declineReservation);
  const completeMutation = useMutation(api.reservations.completeReservation);

  const reservations: Reservation[] = (reservationsData || []).map((r: any, idx: number) => ({
    id: r._id,
    _id: r._id,
    requestId: r.requestId,
    donorId: r.donorId,
    donorName: r.donorName,
    hospitalId: r.hospitalId,
    hospitalName: r.hospitalName,
    status: r.status,
    rank: idx + 1,
    mlScores: {
      availability: r.availabilityScore ?? 0.8,
      reliability: r.reliabilityScore ?? 0.8,
      combined: r.matchScore ?? 0.8,
    },
    explanation: r.aiExplanation?.summary || "Compatible match prioritizing proximity and recovery fitness.",
    distanceKm: r.distanceKm ?? 12,
    bloodGroup: r.bloodType,
    bloodType: r.bloodType,
    createdAt: new Date(r.createdAt),
    acceptedAt: r.respondedAt ? new Date(r.respondedAt) : undefined,
    completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
  }));

  const acceptReservation = async (reservationId: string) => {
    return await acceptMutation({ reservationId: reservationId as any });
  };

  const declineReservation = async (reservationId: string, reason?: string) => {
    return await declineMutation({
      reservationId: reservationId as any,
      reason,
    });
  };

  const completeReservation = async (reservationId: string) => {
    return await completeMutation({ reservationId: reservationId as any });
  };

  return {
    reservations,
    loading: reservationsData === undefined,
    error: null,
    acceptReservation,
    declineReservation,
    completeReservation,
  };
}
export default useReservations;
