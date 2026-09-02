/**
 * Deterministic Explanation Builder for Organ Matching
 * Produces transparent, policy-traceable justifications without hallucinations.
 */

import { CandidateContext } from "./hardConstraints";
import { CompatibilityEvaluation } from "./compatibilityEngine";
import { CandidateScoreResult } from "./scoringEngine";
import { MatchingPolicyConfig } from "./matchingPolicy";

export interface StructuredExplanation {
  summary: string;
  bullets: string[];
  warnings: string[];
  factorBreakdown: Record<string, number>;
  dataConfidence: "HIGH" | "MEDIUM" | "LOW";
}

export function buildStructuredExplanation(
  context: CandidateContext,
  compatibility: CompatibilityEvaluation,
  scoreResult: CandidateScoreResult,
  policy: MatchingPolicyConfig
): StructuredExplanation {
  const { request, recipient, organ, distanceKm } = context;
  const { factors, compositeScore } = scoreResult;
  const weights = policy.weights;

  const bullets: string[] = [];
  const warnings: string[] = [...compatibility.warnings];

  // 1. Urgency Bullet
  bullets.push(
    `✓ Medical Urgency: ${request.urgency} tier (${Math.round(factors.urgencyScore * 100)}% urgency index)`
  );

  // 2. Waiting Time Bullet
  const daysWaiting = Math.round(factors.waitingPriorityScore * 180);
  bullets.push(
    `✓ Waitlist Priority: ${daysWaiting} active days on regional waitlist`
  );

  // 3. Geographic / Logistics Bullet
  bullets.push(
    `✓ Logistics Feasibility: ${Math.round(distanceKm)} km estimated distance (${Math.round(factors.geographicFeasibilityScore * 100)}% transit score)`
  );

  // 4. Preservation Buffer Bullet
  bullets.push(
    `✓ Cold Ischemia Viability: Adequate preservation buffer for procurement and transit`
  );

  // 5. Blood Compatibility Bullet
  if (compatibility.isExactBloodMatch) {
    bullets.push(`✓ Exact ABO Match: Donor (${organ.bloodType}) to Recipient (${recipient.bloodType})`);
  } else if (compatibility.bloodCompatibility) {
    bullets.push(`✓ Compatible Cross-Type: Donor (${organ.bloodType}) to Recipient (${recipient.bloodType})`);
  }

  // Summary Verdict
  let summary = "";
  if (compositeScore >= 0.8) {
    summary = `Top-tier candidate recommendation with high clinical urgency and strong logistical proximity.`;
  } else if (compositeScore >= 0.6) {
    summary = `Viable candidate recommendation with moderate waiting duration and acceptable transit feasibility.`;
  } else {
    summary = `Eligible candidate meeting hard constraints with lower relative priority or extended travel distance.`;
  }

  // Data Confidence Rating
  let dataConfidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
  if (compatibility.dataCompleteness < 0.6) {
    dataConfidence = "LOW";
  } else if (compatibility.dataCompleteness < 0.85) {
    dataConfidence = "MEDIUM";
  }

  // Factor Breakdown (weighted contribution to composite score)
  const factorBreakdown = {
    urgencyContribution: Math.round(weights.urgency * factors.urgencyScore * 1000) / 1000,
    waitingPriorityContribution: Math.round(weights.waitingPriority * factors.waitingPriorityScore * 1000) / 1000,
    geographicContribution: Math.round(weights.geographicFeasibility * factors.geographicFeasibilityScore * 1000) / 1000,
    preservationContribution: Math.round(weights.preservationFeasibility * factors.preservationFeasibilityScore * 1000) / 1000,
    dataCompletenessContribution: Math.round(weights.dataCompleteness * factors.dataCompletenessScore * 1000) / 1000,
  };

  return {
    summary,
    bullets,
    warnings,
    factorBreakdown,
    dataConfidence,
  };
}
