/**
 * Hard Constraints Evaluator for Organ Matching
 * Strictly filters candidates: a candidate either passes or is rejected.
 */

import { MatchingPolicyConfig } from "./matchingPolicy";

export interface CandidateContext {
  organ: {
    _id: string;
    organType: string;
    bloodType: string;
    status: string;
    preservationDeadline: number;
    currentFacilityId: string;
    location?: { lat: number; lng: number };
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
    location: { lat: number; lng: number; address?: string };
    registeredAt: number;
  };
  distanceKm: number;
  currentTime: number;
}

export interface HardConstraintResult {
  passed: boolean;
  failedConstraints: string[];
}

export function evaluateHardConstraints(
  context: CandidateContext,
  policy: MatchingPolicyConfig
): HardConstraintResult {
  const failedConstraints: string[] = [];
  const { organ, request, recipient, distanceKm, currentTime } = context;

  // 1. Organ Type Strict Match
  if (organ.organType !== request.organType) {
    failedConstraints.push(
      `ORGAN_TYPE_MISMATCH: Requested ${request.organType} but organ is ${organ.organType}`
    );
  }

  // 2. Organ Status Available / Matching
  if (organ.status !== "AVAILABLE" && organ.status !== "MATCHING") {
    failedConstraints.push(
      `ORGAN_NOT_AVAILABLE: Organ status is '${organ.status}' (must be AVAILABLE or MATCHING)`
    );
  }

  // 3. Request Status Active / Matching
  if (request.status !== "ACTIVE" && request.status !== "MATCHING") {
    failedConstraints.push(
      `REQUEST_NOT_ACTIVE: Request status is '${request.status}' (must be ACTIVE or MATCHING)`
    );
  }

  // 4. Recipient Status Active
  if (recipient.recipientStatus !== "ACTIVE") {
    failedConstraints.push(
      `RECIPIENT_NOT_ACTIVE: Recipient status is '${recipient.recipientStatus}' (must be ACTIVE)`
    );
  }

  // 5. Verification Status Verified
  if (recipient.verificationStatus === "REJECTED" || recipient.verificationStatus === "UNVERIFIED") {
    failedConstraints.push(
      `VERIFICATION_FAILED: Recipient verification status is '${recipient.verificationStatus}'`
    );
  }

  // 6. Preservation Window Viable
  const minBufferMs = policy.thresholds.minRemainingPreservationHours * 3600 * 1000;
  if (organ.preservationDeadline <= currentTime + minBufferMs) {
    failedConstraints.push(
      `PRESERVATION_WINDOW_EXPIRED: Insufficient remaining cold ischemia time (requires >= ${policy.thresholds.minRemainingPreservationHours}h buffer)`
    );
  }

  // 7. Maximum Logistical Distance
  if (distanceKm > policy.thresholds.maxFeasibleDistanceKm) {
    failedConstraints.push(
      `DISTANCE_EXCEEDED: Distance ${Math.round(distanceKm)} km exceeds maximum logistical threshold of ${policy.thresholds.maxFeasibleDistanceKm} km`
    );
  }

  return {
    passed: failedConstraints.length === 0,
    failedConstraints,
  };
}
