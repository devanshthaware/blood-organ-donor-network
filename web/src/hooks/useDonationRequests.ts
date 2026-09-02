"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export interface DonationRequest {
  id: string;
  _id?: string;
  hospitalId: string;
  hospitalName?: string;
  bloodGroup: string;
  bloodType?: string;
  quantity: number;
  unitsRequested?: number;
  fulfilledUnits?: number;
  urgency: string;
  status: string;
  createdAt: Date;
  dueDate?: Date;
  requiredBy?: number;
  notes?: string;
  distanceKm?: number;
  aiExplanation?: string;
}

export function useDonationRequests(role: "donor" | "hospital") {
  const { user } = useAuth();

  const requestsData = useQuery(
    api.requests.getDonationRequests,
    role === "hospital" && user?.uid ? { hospitalId: user.uid } : {}
  );

  const createRequestMutation = useMutation(api.requests.createRequest);
  const cancelRequestMutation = useMutation(api.requests.cancelRequest);

  const requests: DonationRequest[] = (requestsData || []).map((r: any) => ({
    id: r._id,
    _id: r._id,
    hospitalId: r.hospitalId,
    hospitalName: r.hospitalName,
    bloodGroup: r.bloodType,
    bloodType: r.bloodType,
    quantity: r.unitsRequested,
    unitsRequested: r.unitsRequested,
    fulfilledUnits: r.fulfilledUnits,
    urgency: r.urgency,
    status: r.status,
    createdAt: new Date(r.createdAt),
    notes: r.notes,
  }));

  const createRequest = async (payload: {
    bloodGroup?: string;
    bloodType?: string;
    quantity?: number;
    unitsRequested?: number;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    notes?: string;
    hospitalName?: string;
  }) => {
    if (!user) throw new Error("Unauthenticated");

    const bloodType = payload.bloodType || payload.bloodGroup || "O+";
    const units = payload.unitsRequested || payload.quantity || 1;

    return await createRequestMutation({
      hospitalId: user.uid,
      hospitalName: payload.hospitalName || "Regional Hospital",
      bloodType,
      unitsRequested: units,
      urgency: payload.urgency,
      notes: payload.notes,
      creatorEmail: user.email,
    });
  };

  const cancelRequest = async (requestId: string) => {
    return await cancelRequestMutation({ requestId: requestId as any });
  };

  return {
    requests,
    loading: requestsData === undefined,
    error: null,
    createRequest,
    cancelRequest,
  };
}
export default useDonationRequests;
