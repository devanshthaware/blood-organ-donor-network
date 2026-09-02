/**
 * Logistics Time Engine
 * Evaluates cold ischemia preservation clocks, safety buffers, and deadline risk tiers.
 */

import { RiskLevel, FeasibilityState } from "./logisticsConstants";

export interface PreservationWindow {
  remainingMs: number;
  remainingHours: number;
  remainingMinutes: number;
  formattedText: string;
  isExpired: boolean;
}

export interface DeadlineRiskEvaluation {
  riskLevel: RiskLevel;
  feasibility: FeasibilityState;
  marginMinutes: number;
  explanation: string;
}

export function calculatePreservationWindow(
  deadlineTimestamp: number,
  currentTimestamp: number = Date.now()
): PreservationWindow {
  const remainingMs = deadlineTimestamp - currentTimestamp;
  const isExpired = remainingMs <= 0;

  if (isExpired) {
    return {
      remainingMs: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      formattedText: "00h 00m (Expired)",
      isExpired: true,
    };
  }

  const totalMinutes = Math.floor(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const formattedText = `${hours.toString().padStart(2, "0")}h ${minutes
    .toString()
    .padStart(2, "0")}m remaining`;

  return {
    remainingMs,
    remainingHours: Math.round((remainingMs / (3600 * 1000)) * 10) / 10,
    remainingMinutes: totalMinutes,
    formattedText,
    isExpired: false,
  };
}

export function evaluateDeadlineRisk(
  preservationDeadline: number,
  estimatedArrivalTimestamp: number,
  safetyBufferMinutes: number,
  currentTimestamp: number = Date.now()
): DeadlineRiskEvaluation {
  if (currentTimestamp >= preservationDeadline) {
    return {
      riskLevel: "EXPIRED",
      feasibility: "INFEASIBLE",
      marginMinutes: 0,
      explanation: "Organ preservation deadline has passed. Cold ischemia limit reached.",
    };
  }

  const arrivalWithBuffer = estimatedArrivalTimestamp + safetyBufferMinutes * 60 * 1000;
  const marginMs = preservationDeadline - arrivalWithBuffer;
  const marginMinutes = Math.round(marginMs / (60 * 1000));

  if (estimatedArrivalTimestamp >= preservationDeadline) {
    return {
      riskLevel: "CRITICAL",
      feasibility: "INFEASIBLE",
      marginMinutes,
      explanation: `Projected arrival is past the cold ischemia deadline by ${Math.abs(
        Math.round((estimatedArrivalTimestamp - preservationDeadline) / (60 * 1000))
      )} minutes.`,
    };
  }

  if (marginMinutes < 0) {
    // Arrival before deadline, but safety buffer is breached
    return {
      riskLevel: "HIGH",
      feasibility: "RISKY",
      marginMinutes,
      explanation: `Arrival projected before deadline, but safety buffer is compressed by ${Math.abs(
        marginMinutes
      )} minutes. Vulnerable to road/weather delays.`,
    };
  }

  if (marginMinutes <= 60) {
    return {
      riskLevel: "MODERATE",
      feasibility: "FEASIBLE",
      marginMinutes,
      explanation: `Transit feasible with acceptable safety buffer margin (${marginMinutes} minutes).`,
    };
  }

  return {
    riskLevel: "LOW",
    feasibility: "FEASIBLE",
    marginMinutes,
    explanation: `Transit comfortably feasible with generous buffer margin (${marginMinutes} minutes).`,
  };
}
