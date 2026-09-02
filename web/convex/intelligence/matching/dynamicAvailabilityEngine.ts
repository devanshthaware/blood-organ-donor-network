/**
 * Dynamic Time-Sensitive Donor Availability & ETA Prediction Engine
 * Computes P(donor accepts within T minutes) and segmented arrival ETAs.
 */

export interface DonorDynamicContext {
  donorId: string;
  distanceKm: number;
  urgencyLevel: "ROUTINE" | "URGENT" | "CRITICAL";
  historicalAcceptanceRate: number;
  avgResponseMinutes: number;
  timeOfDayHours: number; // 0-23
}

export interface DynamicAvailabilityResult {
  pAcceptanceWithin15Min: number;
  pAcceptanceWithin30Min: number;
  pAcceptanceWithin60Min: number;
  expectedResponseMinutes: number;
  expectedTransitMinutes: number;
  totalArrivalMinutes: number;
  confidence: number;
}

/**
 * Computes time-decayed availability probabilities and multi-stage ETA estimates.
 */
export function computeDynamicAvailability(context: DonorDynamicContext): DynamicAvailabilityResult {
  const urgencyMultiplier =
    context.urgencyLevel === "CRITICAL" ? 1.35 : context.urgencyLevel === "URGENT" ? 1.15 : 1.0;

  // Circadian penalty (night hours 22:00 - 06:00 reduce immediate responsiveness)
  const isNight = context.timeOfDayHours >= 22 || context.timeOfDayHours < 6;
  const timeMultiplier = isNight ? 0.65 : 1.0;

  // Base response probability
  const baseProb = Math.min(0.95, context.historicalAcceptanceRate * urgencyMultiplier * timeMultiplier);

  // Time-decay rate parameter lambda (higher avgResponse = lower rate)
  const lambda = 1 / Math.max(5, context.avgResponseMinutes);

  // Cumulative distribution function: P(T <= t) = baseProb * (1 - exp(-lambda * t))
  const p15 = Math.min(0.99, Math.max(0.05, baseProb * (1 - Math.exp(-lambda * 15))));
  const p30 = Math.min(0.99, Math.max(0.08, baseProb * (1 - Math.exp(-lambda * 30))));
  const p60 = Math.min(0.99, Math.max(0.12, baseProb * (1 - Math.exp(-lambda * 60))));

  // Travel ETA assuming urban average speed ~35 km/h + 8 mins prep
  const transitMinutes = Math.round((context.distanceKm / 35) * 60) + 8;
  const expectedResponse = Math.round(context.avgResponseMinutes * (isNight ? 1.5 : 1.0));
  const totalArrival = expectedResponse + transitMinutes;

  // Confidence based on distance feasibility and response stability
  const confidence = Math.round(Math.max(0.6, 0.95 - (context.distanceKm / 50) * 0.25) * 100) / 100;

  return {
    pAcceptanceWithin15Min: Math.round(p15 * 100) / 100,
    pAcceptanceWithin30Min: Math.round(p30 * 100) / 100,
    pAcceptanceWithin60Min: Math.round(p60 * 100) / 100,
    expectedResponseMinutes: expectedResponse,
    expectedTransitMinutes: transitMinutes,
    totalArrivalMinutes: totalArrival,
    confidence,
  };
}
