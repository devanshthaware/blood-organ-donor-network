/**
 * Allocation Eligibility Gate & Stale-Data Revalidator
 * Enforces mandatory integrity checks before recommendation generation and before human approval.
 */

import { AllocationPolicyConfig } from "./allocationPolicy";

export interface AllocationCandidateContext {
  organ: {
    _id: string;
    organType: string;
    bloodType: string;
    status: string;
    preservationDeadline: number;
  };
  request: {
    _id: string;
    recipientId: string;
    organType: string;
    bloodType: string;
    status: string;
    urgency: string;
    createdAt: number;
  };
  recipient: {
    _id: string;
    recipientStatus: string;
    verificationStatus: string;
    bloodType: string;
    registeredAt: number;
  };
  distanceKm: number;
  currentTime: number;
}

export interface EligibilityResult {
  isEligible: boolean;
  exclusionReasons: string[];
}

export function validateAllocationEligibility(
  context: AllocationCandidateContext,
  policy: AllocationPolicyConfig
): EligibilityResult {
  const exclusionReasons: string[] = [];
  const { organ, request, recipient, distanceKm, currentTime } = context;

  // 1. Organ State Invariant
  if (organ.status !== "AVAILABLE" && organ.status !== "MATCHING") {
    exclusionReasons.push(
      `ORGAN_UNAVAILABLE: Organ is currently in status '${organ.status}'.`
    );
  }

  // 2. Request State Invariant
  if (request.status !== "ACTIVE" && request.status !== "MATCHING") {
    exclusionReasons.push(
      `REQUEST_INACTIVE: Request is currently in status '${request.status}'.`
    );
  }

  // 3. Recipient State Invariant
  if (recipient.recipientStatus !== "ACTIVE") {
    exclusionReasons.push(
      `RECIPIENT_INACTIVE: Recipient is currently in status '${recipient.recipientStatus}'.`
    );
  }

  // 4. Clinical Verification Invariant
  if (recipient.verificationStatus !== "VERIFIED") {
    exclusionReasons.push(
      `RECIPIENT_NOT_VERIFIED: Verification status is '${recipient.verificationStatus}'.`
    );
  }

  // 5. Organ Type Equivalence
  if (organ.organType !== request.organType) {
    exclusionReasons.push(
      `ORGAN_TYPE_MISMATCH: Requisition is for '${request.organType}', but organ is '${organ.organType}'.`
    );
  }

  // 6. Preservation Clock Feasibility
  const minBufferMs = policy.thresholds.minColdIschemiaBufferHours * 3600 * 1000;
  if (organ.preservationDeadline <= currentTime + minBufferMs) {
    exclusionReasons.push(
      `PRESERVATION_EXPIRED: Remaining cold ischemia time is less than minimum buffer (${policy.thresholds.minColdIschemiaBufferHours}h).`
    );
  }

  // 7. Maximum Feasible Distance
  if (distanceKm > policy.thresholds.maxTransitDistanceKm) {
    exclusionReasons.push(
      `DISTANCE_EXCEEDED: Distance of ${Math.round(distanceKm)} km exceeds policy maximum (${policy.thresholds.maxTransitDistanceKm} km).`
    );
  }

  return {
    isEligible: exclusionReasons.length === 0,
    exclusionReasons,
  };
}
