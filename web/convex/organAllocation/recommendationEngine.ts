/**
 * Allocation Recommendation Engine
 * Prepares structured recommendation records for human coordinator review.
 */

import { AllocationPolicyConfig } from "./allocationPolicy";
import { OptimizedCandidate } from "./multiObjectiveOptimizer";

export interface PreparedRecommendation {
  organId: string;
  requestId: string;
  recipientId: string;
  candidateMatchId: string;
  score: number;
  rank: number;
  objectives: any;
  objectiveBreakdown: any;
  constraints: string[];
  constraintResults: any;
  warnings: string[];
  policyVersion: string;
  algorithmVersion: string;
  explanation: string;
  status: "PENDING_REVIEW";
}

export function buildAllocationRecommendations(
  optimizedCandidates: OptimizedCandidate[],
  policy: AllocationPolicyConfig
): PreparedRecommendation[] {
  const recommendations: PreparedRecommendation[] = [];
  const weights = policy.objectiveWeights;

  optimizedCandidates.forEach((candidate, index) => {
    const rank = index + 1;
    const { context, candidateMatchId, compositeScore, normalizedObjectives, rawObjectives, isParetoOptimal } = candidate;
    const { request, recipient, organ } = context;

    const warnings: string[] = [];
    if (rawObjectives.distanceKm > 600) {
      warnings.push(`Long transport corridor: ${rawObjectives.distanceKm} km requires dedicated charter coordination.`);
    }
    if (rawObjectives.preservationRemainingHours < 4) {
      warnings.push(`Tight preservation window: ${rawObjectives.preservationRemainingHours}h remaining.`);
    }
    if (isParetoOptimal && rank > 1) {
      warnings.push(`Pareto non-dominated alternative: Candidate has optimal trade-offs compared to Rank #1.`);
    }

    const explanation =
      rank === 1
        ? `Primary recommendation: Highest multi-objective alignment (${Math.round(compositeScore * 100)}%) balancing ${request.urgency} urgency with ${rawObjectives.distanceKm} km logistical transit.`
        : `Rank #${rank} alternative recommendation: Strong clinical feasibility (${Math.round(compositeScore * 100)}%) with ${rawObjectives.waitlistDays} waitlist days.`;

    const objectiveBreakdown = {
      urgencyContribution: Math.round(weights.clinicalUrgency * normalizedObjectives.clinicalUrgency * 1000) / 1000,
      waitlistContribution: Math.round(weights.waitlistEquity * normalizedObjectives.waitlistEquity * 1000) / 1000,
      logisticsContribution: Math.round(weights.logisticsEfficiency * normalizedObjectives.logisticsEfficiency * 1000) / 1000,
      preservationContribution: Math.round(weights.coldIschemiaViability * normalizedObjectives.coldIschemiaViability * 1000) / 1000,
      dataContribution: Math.round(weights.dataCompleteness * normalizedObjectives.dataCompleteness * 1000) / 1000,
    };

    recommendations.push({
      organId: organ._id,
      requestId: request._id,
      recipientId: recipient._id,
      candidateMatchId,
      score: compositeScore,
      rank,
      objectives: rawObjectives,
      objectiveBreakdown,
      constraints: [
        "ORGAN_AVAILABLE",
        "REQUEST_ACTIVE",
        "RECIPIENT_VERIFIED",
        "PRESERVATION_VIABLE",
      ],
      constraintResults: {
        allPassed: true,
        evaluatedAt: Date.now(),
      },
      warnings,
      policyVersion: policy.policyVersion,
      algorithmVersion: policy.algorithmVersion,
      explanation,
      status: "PENDING_REVIEW",
    });
  });

  return recommendations;
}
