/**
 * Allocation Policy Configuration & Objective Definitions
 * Governs multi-objective optimization weights, tie-breaking rules, and fairness invariants.
 */

export const ALLOCATION_POLICY_VERSION = "2026.1-NATIONAL-ALLOCATION-POLICY";
export const ALLOCATION_ALGORITHM_VERSION = "1.0.0-MULTI-OBJECTIVE-OPTIMIZER";

export interface AllocationPolicyConfig {
  policyVersion: string;
  algorithmVersion: string;
  objectiveWeights: {
    clinicalUrgency: number;
    waitlistEquity: number;
    logisticsEfficiency: number;
    coldIschemiaViability: number;
    dataCompleteness: number;
  };
  thresholds: {
    minColdIschemiaBufferHours: number;
    maxTransitDistanceKm: number;
  };
  rejectionCategories: string[];
}

export const DEFAULT_ALLOCATION_POLICY: AllocationPolicyConfig = {
  policyVersion: ALLOCATION_POLICY_VERSION,
  algorithmVersion: ALLOCATION_ALGORITHM_VERSION,
  objectiveWeights: {
    clinicalUrgency: 0.35,
    waitlistEquity: 0.25,
    logisticsEfficiency: 0.20,
    coldIschemiaViability: 0.15,
    dataCompleteness: 0.05,
  },
  thresholds: {
    minColdIschemiaBufferHours: 1.0,
    maxTransitDistanceKm: 1500,
  },
  rejectionCategories: [
    "Clinical Review Concern",
    "Logistics / Transit Window Unfeasible",
    "Candidate Medical Hold / Unavailable",
    "Crossmatch / Serological Discrepancy",
    "Candidate Preference / Declined",
    "Administrative / Policy Override",
    "Other",
  ],
};

/**
 * Checks if Candidate A Pareto-dominates Candidate B across all multi-objective dimensions.
 * Candidate A dominates Candidate B iff A >= B on all objectives and A > B on at least one.
 */
export function isParetoDominating(
  aObjectives: Record<string, number>,
  bObjectives: Record<string, number>
): boolean {
  let strictlyBetterInAtLeastOne = false;
  for (const key of Object.keys(aObjectives)) {
    const valA = aObjectives[key] ?? 0;
    const valB = bObjectives[key] ?? 0;
    if (valA < valB) return false;
    if (valA > valB) strictlyBetterInAtLeastOne = true;
  }
  return strictlyBetterInAtLeastOne;
}
