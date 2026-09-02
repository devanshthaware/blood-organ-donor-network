/**
 * Pareto Multi-Objective Ranker & Notification Fatigue Mitigation Engine
 * Evaluates candidate trade-offs across fulfillment probability, ETA, and notification fatigue.
 */

export interface CandidateCandidateVector {
  donorId: string;
  name?: string;
  availabilityScore: number;    // 0.0 to 1.0
  reliabilityScore: number;     // 0.0 to 1.0
  distanceKm: number;           // lower is better
  recentNotificationCount: number; // fatigue signal
  urgencyLevel: "ROUTINE" | "URGENT" | "CRITICAL";
}

export interface RankedCandidateResult {
  donorId: string;
  baselineScore: number; // 60% Avail + 40% Reli
  paretoRank: number;
  isParetoOptimal: boolean;
  tradeOffSummary: string;
  fatigueBurdenScore: number; // 0.0 (fresh) to 1.0 (fatigued)
  compositeOptimizationScore: number;
}

/**
 * Computes baseline 60/40 ranking and advanced Pareto multi-objective ranking.
 */
export function rankCandidatesMultiObjective(
  candidates: CandidateCandidateVector[]
): RankedCandidateResult[] {
  if (!candidates || candidates.length === 0) return [];

  // 1. Calculate Baseline Scores (0.60 Availability + 0.40 Reliability)
  const evaluated = candidates.map((cand) => {
    const baselineScore =
      Math.round((0.6 * cand.availabilityScore + 0.4 * cand.reliabilityScore) * 100) / 100;

    // Fatigue burden score: 5+ recent notifications in 7 days = maximum fatigue penalty
    const fatigueBurden = Math.min(1.0, cand.recentNotificationCount / 5.0);

    // Distance normalization (1.0 for 0km, decaying to 0.2 at 50km)
    const distanceScore = Math.max(0.1, 1.0 - Math.min(50, cand.distanceKm) / 50.0);

    // Dynamic multi-objective composite
    const wAvail = 0.35;
    const wReli = 0.25;
    const wDist = 0.25;
    const wFatigueMitigation = 0.15; // Prefers non-fatigued donors

    const compositeScore =
      cand.availabilityScore * wAvail +
      cand.reliabilityScore * wReli +
      distanceScore * wDist +
      (1.0 - fatigueBurden) * wFatigueMitigation;

    return {
      donorId: cand.donorId,
      baselineScore,
      compositeScore: Math.round(compositeScore * 100) / 100,
      fatigueBurden: Math.round(fatigueBurden * 100) / 100,
      distanceKm: cand.distanceKm,
      availability: cand.availabilityScore,
      reliability: cand.reliabilityScore,
    };
  });

  // 2. Identify Pareto Dominance: Candidate A dominates B if A is >= B in all dimensions and strictly > in at least one
  const paretoResults = evaluated.map((a, idx, arr) => {
    let isDominated = false;
    for (let j = 0; j < arr.length; j++) {
      if (idx === j) continue;
      const b = arr[j];
      // Check if B strictly dominates A (higher avail, reli, composite, and lower distance/fatigue)
      if (
        b.availability >= a.availability &&
        b.reliability >= a.reliability &&
        b.distanceKm <= a.distanceKm &&
        b.fatigueBurden <= a.fatigueBurden &&
        (b.availability > a.availability ||
          b.reliability > a.reliability ||
          b.distanceKm < a.distanceKm ||
          b.fatigueBurden < a.fatigueBurden)
      ) {
        isDominated = true;
        break;
      }
    }

    let tradeOff = "Balanced operational profile.";
    if (a.availability >= 0.9 && a.distanceKm > 20) {
      tradeOff = "High availability with extended travel distance.";
    } else if (a.distanceKm <= 5 && a.fatigueBurden >= 0.6) {
      tradeOff = "Extremely close proximity, but high recent outreach burden.";
    } else if (a.fatigueBurden <= 0.2 && a.reliability >= 0.85) {
      tradeOff = "Fresh donor (low fatigue) with strong clinical reliability.";
    }

    return {
      donorId: a.donorId,
      baselineScore: a.baselineScore,
      isParetoOptimal: !isDominated,
      tradeOffSummary: tradeOff,
      fatigueBurdenScore: a.fatigueBurden,
      compositeOptimizationScore: a.compositeScore,
      paretoRank: 0,
    };
  });

  // Sort by composite multi-objective score descending
  paretoResults.sort((x, y) => y.compositeOptimizationScore - x.compositeOptimizationScore);

  // Assign ranks
  return paretoResults.map((res, index) => ({
    ...res,
    paretoRank: index + 1,
  }));
}
