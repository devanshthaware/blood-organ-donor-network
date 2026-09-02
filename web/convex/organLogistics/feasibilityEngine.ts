/**
 * Logistics Feasibility Engine & Delay Detector
 * Evaluates transport options against the organ's preservation clock and detects timeline slippage.
 */

import { evaluateDeadlineRisk, DeadlineRiskEvaluation } from "./timeEngine";
import { RouteEstimate } from "./routeEngine";
import { FeasibilityState, RiskLevel, TransportMode } from "./logisticsConstants";

export interface EvaluatedTransportOption {
  mode: TransportMode;
  provider: string;
  estimatedDurationMinutes: number;
  estimatedArrival: number;
  safetyBufferMinutes: number;
  feasibility: FeasibilityState;
  riskLevel: RiskLevel;
  isRecommended: boolean;
  isSimulation: boolean;
  calculatedAt: number;
  explanation: string;
}

export function evaluateTransportOptions(
  estimates: RouteEstimate[],
  preservationDeadline: number,
  departureTime: number = Date.now()
): EvaluatedTransportOption[] {
  const evaluated: (EvaluatedTransportOption & { marginMinutes: number })[] = [];

  for (const est of estimates) {
    const estimatedArrival = departureTime + est.estimatedDurationMinutes * 60 * 1000;
    const riskEval: DeadlineRiskEvaluation = evaluateDeadlineRisk(
      preservationDeadline,
      estimatedArrival,
      est.safetyBufferMinutes,
      departureTime
    );

    evaluated.push({
      mode: est.mode,
      provider: est.provider,
      estimatedDurationMinutes: est.estimatedDurationMinutes,
      estimatedArrival,
      safetyBufferMinutes: est.safetyBufferMinutes,
      feasibility: riskEval.feasibility,
      riskLevel: riskEval.riskLevel,
      isRecommended: false, // Flagged below
      isSimulation: est.isSimulation,
      calculatedAt: est.calculatedAt,
      explanation: riskEval.explanation,
      marginMinutes: riskEval.marginMinutes,
    });
  }

  // Identify recommended option:
  // 1. Must be FEASIBLE
  // 2. Highest positive buffer margin (safest)
  // 3. If tied, lowest duration
  const feasibleOptions = evaluated.filter((o) => o.feasibility === "FEASIBLE");
  if (feasibleOptions.length > 0) {
    feasibleOptions.sort((a, b) => {
      if (b.marginMinutes !== a.marginMinutes) {
        return b.marginMinutes - a.marginMinutes; // More buffer is safer
      }
      return a.estimatedDurationMinutes - b.estimatedDurationMinutes;
    });
    feasibleOptions[0].isRecommended = true;
  } else {
    // If no option is fully FEASIBLE, recommend the option with lowest duration among RISKY options
    const riskyOptions = evaluated.filter((o) => o.feasibility === "RISKY");
    if (riskyOptions.length > 0) {
      riskyOptions.sort((a, b) => a.estimatedDurationMinutes - b.estimatedDurationMinutes);
      riskyOptions[0].isRecommended = true;
    }
  }

  return evaluated.map(({ marginMinutes, ...rest }) => rest);
}

export interface DelayAnalysis {
  isDelayed: boolean;
  delayMinutes: number;
  isCriticalToDeadline: boolean;
  alertMessage?: string;
}

export function analyzeMilestoneDelay(
  expectedTimestamp: number,
  actualTimestamp: number,
  preservationDeadline: number,
  remainingEstimatedTransitMinutes: number
): DelayAnalysis {
  const delayMs = actualTimestamp - expectedTimestamp;
  const delayMinutes = Math.round(delayMs / (60 * 1000));

  if (delayMinutes < 15) {
    return { isDelayed: false, delayMinutes: Math.max(0, delayMinutes), isCriticalToDeadline: false };
  }

  const newProjectedArrival = actualTimestamp + remainingEstimatedTransitMinutes * 60 * 1000;
  const isCriticalToDeadline = newProjectedArrival >= preservationDeadline - 30 * 60 * 1000; // <30m buffer left

  const alertMessage = isCriticalToDeadline
    ? `CRITICAL TRANSPORT DELAY: Shipment delayed by ${delayMinutes} minutes. Projected arrival now threatens preservation deadline!`
    : `Transport delay detected: Shipment delayed by ${delayMinutes} minutes from planned schedule.`;

  return {
    isDelayed: true,
    delayMinutes,
    isCriticalToDeadline,
    alertMessage,
  };
}
