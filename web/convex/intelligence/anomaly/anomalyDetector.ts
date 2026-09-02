/**
 * Statistical Anomaly Detection Engine
 * Identifies sudden demand surges, rapid inventory depletions, and response anomalies.
 */

export interface AnomalyObservation {
  entityId: string;
  regionId: string;
  metricName: string;
  currentValue: number;
  baselineMean: number;
  baselineStdDev: number;
  currentDepletionVelocity?: number; // units/hr
  currentStock?: number;
}

export interface AnomalyAlert {
  anomalyType: "DEMAND_SURGE" | "RAPID_DEPLETION" | "RESPONSE_DROP" | "LOGISTICS_BOTTLENECK";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number; // e.g. z-score
  affectedEntity: string;
  regionId: string;
  explanation: string;
  detectedAt: number;
}

/**
 * Evaluates operational observations against statistical baselines to detect anomalies.
 */
export function detectNetworkAnomalies(observations: AnomalyObservation[]): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const now = Date.now();

  for (const obs of observations) {
    const stdDev = Math.max(1.0, obs.baselineStdDev);
    const zScore = (obs.currentValue - obs.baselineMean) / stdDev;

    // 1. Demand Surge Detection (Z-Score >= 2.0)
    if (obs.metricName === "daily_requests" && zScore >= 2.0) {
      const severity = zScore >= 3.5 ? "CRITICAL" : zScore >= 2.8 ? "HIGH" : "MEDIUM";
      alerts.push({
        anomalyType: "DEMAND_SURGE",
        severity,
        score: Math.round(zScore * 100) / 100,
        affectedEntity: obs.entityId,
        regionId: obs.regionId,
        explanation: `Statistical demand surge detected: observed ${obs.currentValue} requests vs baseline mean of ${obs.baselineMean} (z-score: +${Math.round(zScore * 10) / 10}σ).`,
        detectedAt: now,
      });
    }

    // 2. Rapid Inventory Depletion Detection
    if (
      obs.currentDepletionVelocity &&
      obs.currentStock !== undefined &&
      obs.currentDepletionVelocity >= 3.5 &&
      obs.currentStock <= 25
    ) {
      const severity = obs.currentStock <= 10 ? "CRITICAL" : "HIGH";
      alerts.push({
        anomalyType: "RAPID_DEPLETION",
        severity,
        score: Math.round(obs.currentDepletionVelocity * 10) / 10,
        affectedEntity: obs.entityId,
        regionId: obs.regionId,
        explanation: `Accelerated inventory depletion: current velocity is ${obs.currentDepletionVelocity} units/hr with only ${obs.currentStock} units remaining.`,
        detectedAt: now,
      });
    }

    // 3. Response Drop Detection (Negative Z-Score <= -2.2)
    if (obs.metricName === "acceptance_rate" && zScore <= -2.2) {
      alerts.push({
        anomalyType: "RESPONSE_DROP",
        severity: "HIGH",
        score: Math.round(Math.abs(zScore) * 100) / 100,
        affectedEntity: obs.entityId,
        regionId: obs.regionId,
        explanation: `Significant donor responsiveness drop: observed acceptance rate ${Math.round(obs.currentValue * 100)}% vs baseline ${Math.round(obs.baselineMean * 100)}%.`,
        detectedAt: now,
      });
    }
  }

  return alerts;
}
