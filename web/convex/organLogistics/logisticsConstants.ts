/**
 * Logistics Constants, Lifecycles & State Transitions
 * Source of truth for time-critical organ transport.
 */

export const TRANSPORT_STATUSES = [
  "CREATED",
  "PLANNING",
  "READY",
  "ASSIGNED",
  "PICKUP_PENDING",
  "IN_TRANSIT",
  "ARRIVED",
  "DELIVERED",
  "CONFIRMED",
  "CANCELLED",
  "DELAYED",
  "FAILED",
  "EXPIRED",
] as const;

export type TransportStatus = (typeof TRANSPORT_STATUSES)[number];

export const TRANSPORT_MODES = [
  "ROAD_AMBULANCE",
  "AIR_CHARTER",
  "COMMERCIAL_AIR",
  "SPECIALIZED_MEDICAL_COURIER",
] as const;

export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const FEASIBILITY_STATES = [
  "FEASIBLE",
  "RISKY",
  "INFEASIBLE",
  "UNKNOWN",
] as const;

export type FeasibilityState = (typeof FEASIBILITY_STATES)[number];

export const RISK_LEVELS = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
  "EXPIRED",
] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

export const ALERT_TYPES = [
  "ETA_RISK",
  "TRANSPORT_DELAY",
  "DEADLINE_APPROACHING",
  "DEADLINE_EXCEEDED",
  "ROUTE_FAILURE",
  "NO_TRANSPORT",
] as const;

export type LogisticsAlertType = (typeof ALERT_TYPES)[number];

// Controlled state transitions
export const VALID_TRANSPORT_TRANSITIONS: Record<TransportStatus, TransportStatus[]> = {
  CREATED: ["PLANNING", "CANCELLED"],
  PLANNING: ["READY", "CANCELLED"],
  READY: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKUP_PENDING", "CANCELLED"],
  PICKUP_PENDING: ["IN_TRANSIT", "DELAYED", "CANCELLED"],
  IN_TRANSIT: ["ARRIVED", "DELAYED", "FAILED", "EXPIRED"],
  DELAYED: ["IN_TRANSIT", "ARRIVED", "FAILED", "CANCELLED", "EXPIRED"],
  ARRIVED: ["DELIVERED", "FAILED"],
  DELIVERED: ["CONFIRMED", "FAILED"],
  CONFIRMED: [],
  CANCELLED: [],
  FAILED: [],
  EXPIRED: [],
};

export function isValidTransportTransition(
  current: TransportStatus,
  target: TransportStatus
): boolean {
  const allowed = VALID_TRANSPORT_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

// Mode-specific configuration presets
export const MODE_CONFIG = {
  ROAD_AMBULANCE: {
    name: "Ground Critical Care Ambulance",
    speedKmh: 75,
    prepAndHandoffMinutes: 25,
    safetyBufferMinutes: 30,
    maxRangeKm: 350,
  },
  AIR_CHARTER: {
    name: "Dedicated Medical Air Charter",
    speedKmh: 480,
    prepAndHandoffMinutes: 50,
    safetyBufferMinutes: 60,
    maxRangeKm: 2500,
  },
  SPECIALIZED_MEDICAL_COURIER: {
    name: "Priority Organ Courier",
    speedKmh: 85,
    prepAndHandoffMinutes: 20,
    safetyBufferMinutes: 30,
    maxRangeKm: 200,
  },
};
