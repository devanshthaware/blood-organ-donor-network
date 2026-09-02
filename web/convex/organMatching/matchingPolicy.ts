/**
 * Organ Matching Policy Configuration
 * Central source of truth for multi-factor weights, thresholds, and policy versions.
 */

export const POLICY_VERSION = "2026.1-NATIONAL-ORGAN-MATCHING-POLICY";
export const ALGORITHM_VERSION = "1.0.0-DETERMINISTIC-MULTIOBJ";

export interface MatchingPolicyConfig {
  policyVersion: string;
  algorithmVersion: string;
  weights: {
    urgency: number;
    waitingPriority: number;
    geographicFeasibility: number;
    preservationFeasibility: number;
    dataCompleteness: number;
  };
  thresholds: {
    maxFeasibleDistanceKm: number;
    minRemainingPreservationHours: number;
    minimumPassingScore: number;
  };
}

export const DEFAULT_MATCHING_POLICY: MatchingPolicyConfig = {
  policyVersion: POLICY_VERSION,
  algorithmVersion: ALGORITHM_VERSION,
  weights: {
    urgency: 0.35,
    waitingPriority: 0.25,
    geographicFeasibility: 0.20,
    preservationFeasibility: 0.15,
    dataCompleteness: 0.05,
  },
  thresholds: {
    maxFeasibleDistanceKm: 1500, // Maximum logistical transport radius for emergency organ transit
    minRemainingPreservationHours: 1.0, // Minimum buffer window required for transit & prep
    minimumPassingScore: 0.10,
  },
};

// Urgency factor mapping: CRITICAL = 1.0, HIGH = 0.75, MEDIUM = 0.50, LOW = 0.25
export const URGENCY_NORMALIZATION_MAP: Record<string, number> = {
  CRITICAL: 1.0,
  HIGH: 0.75,
  MEDIUM: 0.50,
  LOW: 0.25,
};
