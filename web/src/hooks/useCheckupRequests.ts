"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export interface CheckupRequest {
  id: string;
  hospitalId: string;
  hospitalName?: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";
  scheduledAt: Date;
  requestedAt: Date;
}

export function useCheckupRequests() {
  const { user } = useAuth();
  const requestsData = useQuery(
    api.checkups.getCheckupRequests,
    user?.uid ? { donorId: user.uid } : "skip"
  );

  const request: CheckupRequest | null =
    requestsData && requestsData.length > 0
      ? {
          id: requestsData[0]._id,
          hospitalId: requestsData[0].hospitalId,
          hospitalName: requestsData[0].hospitalName || "Medical Center",
          status: "REQUESTED",
          scheduledAt: new Date(requestsData[0].createdAt),
          requestedAt: new Date(requestsData[0].createdAt),
        }
      : null;

  return {
    request,
    loading: requestsData === undefined,
  };
}
export default useCheckupRequests;
