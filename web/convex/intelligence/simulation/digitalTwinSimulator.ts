/**
 * Digital Twin Healthcare Simulation Engine
 * Simulates what-if operational interventions without dispatching live notifications.
 */

export interface SimulationScenarioInput {
  scenarioType: "DONOR_ACTIVATION" | "INTER_HOSPITAL_TRANSFER" | "DEMAND_SURGE" | "TRANSIT_DELAY";
  currentStock: number;
  expectedDailyDemand: number;
  activeDonorsCount: number;
  parameters: {
    activatedDonorsCount?: number;
    transferredUnitsCount?: number;
    demandSurgeMultiplier?: number;
    transitDelayHours?: number;
  };
}

export interface SimulationResult {
  simulationId: string;
  scenarioType: string;
  baselineShortageHours: number;
  projectedShortageHours: number;
  netUnitsImpact: number;
  projectedFulfillmentRate: number;
  resilienceScoreDelta: number;
  recommendationVerdict: string;
  generatedAt: number;
}

/**
 * Runs a what-if simulation against the current healthcare network state.
 */
export function simulateScenario(input: SimulationScenarioInput): SimulationResult {
  const now = Date.now();
  const simId = `SIM-${now}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const hourlyDemand = input.expectedDailyDemand / 24;
  const baselineStockoutHours =
    hourlyDemand > 0 ? Math.round((input.currentStock / hourlyDemand) * 10) / 10 : 96.0;

  let netUnitsDelta = 0;
  let newStockoutHours = baselineStockoutHours;
  let fulfillmentRate = 0.82;
  let resilienceDelta = 0;
  let verdict = "Neutral impact.";

  if (input.scenarioType === "DONOR_ACTIVATION") {
    const N = input.parameters.activatedDonorsCount || 20;
    // Expected donor response ~38% based on historical empirical yield
    const expectedYieldUnits = Math.round(N * 0.38);
    netUnitsDelta = expectedYieldUnits;
    newStockoutHours =
      hourlyDemand > 0
        ? Math.round(((input.currentStock + expectedYieldUnits) / hourlyDemand) * 10) / 10
        : baselineStockoutHours + 18;

    fulfillmentRate = Math.min(0.98, 0.82 + (expectedYieldUnits / 30) * 0.15);
    resilienceDelta = +14;
    verdict = `Activating ${N} targeted donors is projected to yield ~${expectedYieldUnits} units, extending stock runway by ${Math.round((newStockoutHours - baselineStockoutHours) * 10) / 10} hours.`;
  } else if (input.scenarioType === "INTER_HOSPITAL_TRANSFER") {
    const M = input.parameters.transferredUnitsCount || 10;
    netUnitsDelta = M;
    newStockoutHours =
      hourlyDemand > 0
        ? Math.round(((input.currentStock + M) / hourlyDemand) * 10) / 10
        : baselineStockoutHours + 12;

    fulfillmentRate = 0.94;
    resilienceDelta = +18;
    verdict = `Transferring ${M} units from neighboring facility resolves immediate 24h deficit without burdening donor pool.`;
  } else if (input.scenarioType === "DEMAND_SURGE") {
    const mult = input.parameters.demandSurgeMultiplier || 2.0;
    const surgedHourly = hourlyDemand * mult;
    newStockoutHours =
      surgedHourly > 0 ? Math.round((input.currentStock / surgedHourly) * 10) / 10 : 12;

    netUnitsDelta = -Math.round((surgedHourly - hourlyDemand) * 24);
    fulfillmentRate = 0.58;
    resilienceDelta = -28;
    verdict = `A ${mult}x demand surge compresses remaining runway from ${baselineStockoutHours}h to ${newStockoutHours}h, triggering critical shortage alert.`;
  }

  return {
    simulationId: simId,
    scenarioType: input.scenarioType,
    baselineShortageHours: baselineStockoutHours,
    projectedShortageHours: newStockoutHours,
    netUnitsImpact: netUnitsDelta,
    projectedFulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
    resilienceScoreDelta: resilienceDelta,
    recommendationVerdict: verdict,
    generatedAt: now,
  };
}
