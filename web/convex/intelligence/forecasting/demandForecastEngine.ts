/**
 * Multi-Horizon Demand Forecasting & Uncertainty Engine
 * Projects demand, supply, and shortage risk across 6h, 24h, 3d, 7d, and 14d horizons.
 */

export interface ForecastInput {
  regionId: string;
  bloodGroup: string;
  currentInventory: number;
  recentHourlyDepletions: number[]; // e.g. last 6 hours
  historicalDailyAverageDemand: number;
  historicalDailyAverageSupply: number;
  isEmergencyHotspot?: boolean;
}

export interface HorizonProjection {
  horizonHours: number;
  shortageProbability: number;
  expectedDemand: number;
  expectedSupply: number;
  netProjectedStock: number;
  confidence: number;
  predictionInterval: { lower: number; upper: number };
  depletionVelocity: number;
}

export const FORECAST_HORIZONS = [6, 24, 72, 168, 336]; // 6h, 24h, 3d, 7d, 14d

/**
 * Calculates current inventory depletion velocity (units per hour).
 */
export function calculateDepletionVelocity(recentHourlyDepletions: number[]): number {
  if (!recentHourlyDepletions || recentHourlyDepletions.length === 0) return 1.5;
  const sum = recentHourlyDepletions.reduce((a, b) => a + b, 0);
  return Math.round((sum / recentHourlyDepletions.length) * 10) / 10;
}

/**
 * Computes multi-horizon demand forecast and uncertainty-aware prediction intervals.
 */
export function computeMultiHorizonForecast(input: ForecastInput): HorizonProjection[] {
  const velocity = calculateDepletionVelocity(input.recentHourlyDepletions);
  const hourlyDemandBase = input.historicalDailyAverageDemand / 24;
  const hourlySupplyBase = input.historicalDailyAverageSupply / 24;

  const surgeMultiplier = input.isEmergencyHotspot ? 1.45 : 1.0;

  return FORECAST_HORIZONS.map((hours) => {
    // Project demand with time-scaling variance
    const projectedDemand = Math.round(hours * hourlyDemandBase * surgeMultiplier * 10) / 10;
    const projectedSupply = Math.round(hours * hourlySupplyBase * 10) / 10;

    // Uncertainty standard deviation scales with sqrt(time)
    const sigma = Math.max(1.5, Math.sqrt(hours) * 1.25);
    const lowerBound = Math.max(0, Math.round((projectedDemand - 1.645 * sigma) * 10) / 10);
    const upperBound = Math.round((projectedDemand + 1.645 * sigma) * 10) / 10;

    const netStock = input.currentInventory + projectedSupply - projectedDemand;

    // Shortage probability via logistic sigmoid over net stock relative to safety buffer
    const safetyBuffer = Math.max(4, Math.round(hours * 0.3));
    const deficit = safetyBuffer - netStock;
    const shortageProb = Math.min(
      0.99,
      Math.max(0.01, 1 / (1 + Math.exp(-deficit / Math.max(2, sigma))))
    );

    // Confidence decays naturally with time horizon
    const confidence = Math.round(Math.max(0.55, 0.95 - (hours / 336) * 0.35) * 100) / 100;

    return {
      horizonHours: hours,
      shortageProbability: Math.round(shortageProb * 100) / 100,
      expectedDemand: projectedDemand,
      expectedSupply: projectedSupply,
      netProjectedStock: Math.round(netStock * 10) / 10,
      confidence,
      predictionInterval: { lower: lowerBound, upper: upperBound },
      depletionVelocity: velocity,
    };
  });
}
