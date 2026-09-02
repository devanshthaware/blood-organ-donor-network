/**
 * Multi-Objective Allocation Optimizer
 * Computes normalized objective scores and performs deterministic multi-objective ranking.
 */

import { AllocationPolicyConfig, isParetoDominating } from "./allocationPolicy";
import { AllocationCandidateContext } from "./eligibilityGate";

export interface OptimizedCandidate {
  context: AllocationCandidateContext;
  candidateMatchId: string;
  normalizedObjectives: {
    clinicalUrgency: number;
    waitlistEquity: number;
    logisticsEfficiency: number;
    coldIschemiaViability: number;
    dataCompleteness: number;
  };
  rawObjectives: {
    urgencyTier: string;
    waitlistDays: number;
    distanceKm: number;
    preservationRemainingHours: number;
  };
  compositeScore: number;
  isParetoOptimal: boolean;
}

export function optimizeAllocationCandidates(
  candidates: { context: AllocationCandidateContext; candidateMatchId: string }[],
  policy: AllocationPolicyConfig
): OptimizedCandidate[] {
  const evaluated: OptimizedCandidate[] = [];
  const weights = policy.objectiveWeights;

  for (const item of candidates) {
    const { context, candidateMatchId } = item;
    const { request, recipient, organ, distanceKm, currentTime } = context;

    // 1. Clinical Urgency Objective (0.0 to 1.0)
    const urgencyMap: Record<string, number> = {
      CRITICAL: 1.0,
      HIGH: 0.75,
      MEDIUM: 0.50,
      LOW: 0.25,
    };
    const clinicalUrgency = urgencyMap[request.urgency] ?? 0.25;

    // 2. Waitlist Equity Objective (0.0 to 1.0, normalized against 180-day baseline)
    const registrationTime = recipient.registeredAt || request.createdAt;
    const waitlistDays = Math.max(0, (currentTime - registrationTime) / (24 * 60 * 60 * 1000));
    const waitlistEquity = Math.min(1.0, Math.round((waitlistDays / 180) * 100) / 100);

    // 3. Logistics Efficiency Objective (0.0 to 1.0)
    const maxDist = policy.thresholds.maxTransitDistanceKm;
    const logisticsEfficiency = Math.max(0.0, Math.min(1.0, Math.round((1.0 - distanceKm / maxDist) * 100) / 100));

    // 4. Cold Ischemia Viability Objective (0.0 to 1.0)
    const preservationRemainingHours = Math.max(0, (organ.preservationDeadline - currentTime) / (3600 * 1000));
    const estimatedTransitHours = distanceKm < 100 ? 1.5 : (distanceKm / 350) + 1.5;
    const viabilityRatio = preservationRemainingHours / Math.max(1.0, estimatedTransitHours * 2);
    const coldIschemiaViability = Math.min(1.0, Math.max(0.0, Math.round(viabilityRatio * 100) / 100));

    // 5. Data Completeness Objective (0.0 to 1.0)
    let completenessFields = 0;
    if (recipient.bloodType) completenessFields++;
    if (recipient.verificationStatus === "VERIFIED") completenessFields++;
    if (recipient.registeredAt) completenessFields++;
    if (distanceKm >= 0) completenessFields++;
    const dataCompleteness = Math.round((completenessFields / 4) * 100) / 100;

    // Composite Weighted Sum
    const compositeScore = Math.round(
      (weights.clinicalUrgency * clinicalUrgency +
        weights.waitlistEquity * waitlistEquity +
        weights.logisticsEfficiency * logisticsEfficiency +
        weights.coldIschemiaViability * coldIschemiaViability +
        weights.dataCompleteness * dataCompleteness) *
        1000
    ) / 1000;

    evaluated.push({
      context,
      candidateMatchId,
      normalizedObjectives: {
        clinicalUrgency,
        waitlistEquity,
        logisticsEfficiency,
        coldIschemiaViability,
        dataCompleteness,
      },
      rawObjectives: {
        urgencyTier: request.urgency,
        waitlistDays: Math.round(waitlistDays),
        distanceKm: Math.round(distanceKm),
        preservationRemainingHours: Math.round(preservationRemainingHours * 10) / 10,
      },
      compositeScore,
      isParetoOptimal: false, // Calculated next
    });
  }

  // Calculate Pareto Optimality
  for (let i = 0; i < evaluated.length; i++) {
    let dominated = false;
    for (let j = 0; j < evaluated.length; j++) {
      if (i !== j) {
        if (isParetoDominating(evaluated[j].normalizedObjectives, evaluated[i].normalizedObjectives)) {
          dominated = true;
          break;
        }
      }
    }
    evaluated[i].isParetoOptimal = !dominated;
  }

  // Deterministic Sorting:
  // 1. Higher composite score
  // 2. Tie-break: earlier request creation timestamp
  evaluated.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    return a.context.request.createdAt - b.context.request.createdAt;
  });

  return evaluated;
}
