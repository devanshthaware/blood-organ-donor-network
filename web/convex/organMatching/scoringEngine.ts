/**
 * Scoring Engine for Organ Candidate Ranking
 * Calculates normalized multi-factor composite scores (0.0 to 1.0).
 */

import {
  MatchingPolicyConfig,
  URGENCY_NORMALIZATION_MAP,
} from "./matchingPolicy";
import { CandidateContext } from "./hardConstraints";
import { CompatibilityEvaluation } from "./compatibilityEngine";

export interface CandidateFactorScores {
  urgencyScore: number;
  waitingPriorityScore: number;
  geographicFeasibilityScore: number;
  preservationFeasibilityScore: number;
  dataCompletenessScore: number;
}

export interface CandidateScoreResult {
  compositeScore: number;
  factors: CandidateFactorScores;
}

export function calculateCandidateScore(
  context: CandidateContext,
  compatibility: CompatibilityEvaluation,
  policy: MatchingPolicyConfig
): CandidateScoreResult {
  const { request, recipient, organ, distanceKm, currentTime } = context;
  const weights = policy.weights;

  // 1. Urgency Factor (0.0 - 1.0)
  const urgencyScore = URGENCY_NORMALIZATION_MAP[request.urgency] ?? 0.25;

  // 2. Waiting Priority Factor (0.0 - 1.0)
  // Normalized over 180 days (6 months) waitlist benchmark
  const registrationTimestamp = recipient.registeredAt || request.createdAt;
  const daysWaiting = Math.max(0, (currentTime - registrationTimestamp) / (24 * 60 * 60 * 1000));
  const waitingPriorityScore = Math.min(1.0, Math.round((daysWaiting / 180) * 100) / 100);

  // 3. Geographic Feasibility Factor (0.0 - 1.0)
  // Linear decay up to policy maximum distance threshold
  const maxDistance = policy.thresholds.maxFeasibleDistanceKm;
  const geographicFeasibilityScore = Math.max(
    0.0,
    Math.min(1.0, Math.round((1.0 - distanceKm / maxDistance) * 100) / 100)
  );

  // 4. Preservation Time Feasibility Factor (0.0 - 1.0)
  // Ratio of available cold ischemia buffer to estimated transit + prep time
  const remainingHours = Math.max(0, (organ.preservationDeadline - currentTime) / (3600 * 1000));
  const estimatedTransitHours = distanceKm < 100 ? 1.5 : (distanceKm / 350) + 1.5; // air/ground estimate + buffer
  const ratio = remainingHours / Math.max(1.0, estimatedTransitHours);
  const preservationFeasibilityScore = Math.min(1.0, Math.max(0.0, Math.round((ratio / 2.0) * 100) / 100));

  // 5. Data Completeness Factor (0.0 - 1.0)
  const dataCompletenessScore = compatibility.dataCompleteness;

  // Composite Weighted Sum
  const compositeScore = Math.round(
    (weights.urgency * urgencyScore +
      weights.waitingPriority * waitingPriorityScore +
      weights.geographicFeasibility * geographicFeasibilityScore +
      weights.preservationFeasibility * preservationFeasibilityScore +
      weights.dataCompleteness * dataCompletenessScore) *
      1000
  ) / 1000;

  return {
    compositeScore: Math.min(1.0, Math.max(0.0, compositeScore)),
    factors: {
      urgencyScore,
      waitingPriorityScore,
      geographicFeasibilityScore,
      preservationFeasibilityScore,
      dataCompletenessScore,
    },
  };
}
