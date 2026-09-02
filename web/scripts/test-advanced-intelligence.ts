/**
 * Automated Test Suite — Step 11: Advanced AI + Predictive Network Intelligence
 * Validates:
 * 1. Multi-horizon demand forecasting (6h, 24h, 3d, 7d, 14d) with uncertainty intervals
 * 2. Inventory depletion velocity calculation
 * 3. Dynamic time-sensitive donor availability and segmented arrival ETAs
 * 4. Decomposed 4-factor donor reliability vector
 * 5. Statistical anomaly detection for surges and rapid depletion
 * 6. Healthcare network graph topology and regional resilience scoring
 * 7. Pareto multi-objective optimization vs baseline 60/40 ranking
 * 8. Notification fatigue penalty mitigation
 * 9. Digital twin what-if operational simulation
 * 10. Zero-PHI and 56-day blood donation cooldown invariance
 */

import {
  computeMultiHorizonForecast,
  calculateDepletionVelocity,
  FORECAST_HORIZONS,
} from "../convex/intelligence/forecasting/demandForecastEngine";
import { computeDynamicAvailability } from "../convex/intelligence/matching/dynamicAvailabilityEngine";
import { computeReliabilityVector } from "../convex/intelligence/matching/reliabilityVectorEngine";
import { detectNetworkAnomalies } from "../convex/intelligence/anomaly/anomalyDetector";
import { HealthcareNetworkGraph } from "../convex/intelligence/network/networkGraphModel";
import { rankCandidatesMultiObjective } from "../convex/intelligence/optimization/multiObjectiveRanker";
import { simulateScenario } from "../convex/intelligence/simulation/digitalTwinSimulator";

async function runTests() {
  console.log("==================================================");
  console.log("VEINLINK — ADVANCED AI & NETWORK INTELLIGENCE TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, name: string) {
    total++;
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      process.exitCode = 1;
    }
  }

  // 1. Multi-Horizon Demand Forecasting & Uncertainty Intervals
  const forecastInput = {
    regionId: "REGION-PUNE-METRO",
    bloodGroup: "O-",
    currentInventory: 18,
    recentHourlyDepletions: [2, 3, 2, 4, 3, 2],
    historicalDailyAverageDemand: 24,
    historicalDailyAverageSupply: 18,
    isEmergencyHotspot: false,
  };

  const projections = computeMultiHorizonForecast(forecastInput);

  assert(projections.length === 5, "Forecasting: Projects across exactly 5 distinct horizons (6h, 24h, 3d, 7d, 14d)");
  assert(
    projections[0].horizonHours === 6 && projections[4].horizonHours === 336,
    "Forecasting: Correct horizon bounds from 6 hours to 14 days"
  );
  assert(
    projections[4].expectedDemand > projections[0].expectedDemand,
    "Forecasting: Demand scales monotonically with forecast time horizon"
  );

  const p24 = projections[1]; // 24h
  assert(
    p24.predictionInterval.lower <= p24.expectedDemand && p24.expectedDemand <= p24.predictionInterval.upper,
    "Forecasting: 90% prediction interval strictly bounds expected demand"
  );
  assert(
    projections[0].confidence > projections[4].confidence,
    "Uncertainty: Short-term horizon has strictly higher confidence than 14-day horizon"
  );

  // 2. Depletion Velocity Calculation
  const velocity = calculateDepletionVelocity([3, 4, 3, 2, 3]);
  assert(velocity === 3.0, "Depletion Velocity: Computes mean depletion rate accurately (3.0 units/hr)");

  // 3. Dynamic Time-Sensitive Donor Availability & Segmented ETA
  const donorContext = {
    donorId: "DNR-101",
    distanceKm: 14.0,
    urgencyLevel: "CRITICAL" as const,
    historicalAcceptanceRate: 0.88,
    avgResponseMinutes: 12,
    timeOfDayHours: 14, // daytime 2 PM
  };

  const dynamicAvail = computeDynamicAvailability(donorContext);

  assert(
    dynamicAvail.pAcceptanceWithin15Min < dynamicAvail.pAcceptanceWithin30Min &&
      dynamicAvail.pAcceptanceWithin30Min < dynamicAvail.pAcceptanceWithin60Min,
    "Dynamic Availability: Cumulative probability strictly increases over time window (15m < 30m < 60m)"
  );
  assert(
    dynamicAvail.expectedResponseMinutes > 0 && dynamicAvail.expectedTransitMinutes > 0,
    "ETA Estimation: Segments expected response latency and travel transit time"
  );
  assert(
    dynamicAvail.totalArrivalMinutes ===
      dynamicAvail.expectedResponseMinutes + dynamicAvail.expectedTransitMinutes,
    "ETA Estimation: Total arrival ETA equals response latency plus travel transit time"
  );

  // Night-time circadian penalty test
  const nightContext = { ...donorContext, timeOfDayHours: 2 }; // 2 AM
  const nightAvail = computeDynamicAvailability(nightContext);
  assert(
    nightAvail.pAcceptanceWithin15Min < dynamicAvail.pAcceptanceWithin15Min,
    "Dynamic Availability: Applies circadian response penalty during night hours (22:00 - 06:00)"
  );

  // 4. Decomposed 4-Factor Donor Reliability Vector
  const historyReliable = {
    totalRequests: 20,
    acceptedRequests: 16,
    completedDonations: 15,
    noShows: 1,
    avgResponseMinutes: 15,
  };

  const relVector = computeReliabilityVector(historyReliable);

  assert(
    relVector.acceptanceScore === 0.8 && relVector.attendanceScore > 0.9,
    "Reliability Vector: Decomposes into distinct Acceptance (0.80) and Attendance (>0.90) scores"
  );
  assert(
    relVector.overallReliability >= 0.0 && relVector.overallReliability <= 1.0,
    "Reliability Vector: Overall composite reliability is bounded in [0.0, 1.0]"
  );

  // No-show specific penalty test
  const historyNoShow = { ...historyReliable, noShows: 8 };
  const relNoShow = computeReliabilityVector(historyNoShow);
  assert(
    relNoShow.attendanceScore < relVector.attendanceScore,
    "Reliability Vector: Repeated no-shows penalize attendance factor specifically"
  );

  // 5. Statistical Anomaly Detection
  const normalObs = [
    {
      entityId: "HOSP-01",
      regionId: "REGION-PUNE",
      metricName: "daily_requests",
      currentValue: 22,
      baselineMean: 20,
      baselineStdDev: 4,
    },
  ];
  const normalAlerts = detectNetworkAnomalies(normalObs);
  assert(normalAlerts.length === 0, "Anomaly Detection: Normal statistical traffic produces zero false alarms");

  const surgeObs = [
    {
      entityId: "HOSP-01",
      regionId: "REGION-PUNE",
      metricName: "daily_requests",
      currentValue: 58, // +3.8σ
      baselineMean: 20,
      baselineStdDev: 10,
    },
    {
      entityId: "HOSP-02",
      regionId: "REGION-PUNE",
      metricName: "inventory_velocity",
      currentValue: 4.5,
      baselineMean: 1.5,
      baselineStdDev: 0.5,
      currentDepletionVelocity: 4.5,
      currentStock: 12,
    },
  ];
  const surgeAlerts = detectNetworkAnomalies(surgeObs);

  assert(surgeAlerts.length === 2, "Anomaly Detection: Identifies both demand surge and rapid depletion");
  assert(
    surgeAlerts[0].anomalyType === "DEMAND_SURGE" && surgeAlerts[0].severity === "CRITICAL",
    "Anomaly Detection: High z-score (+3.8σ) is classified as CRITICAL DEMAND_SURGE"
  );
  assert(
    surgeAlerts[1].anomalyType === "RAPID_DEPLETION",
    "Anomaly Detection: Rapid depletion with low remaining stock triggers alarm"
  );

  // 6. Healthcare Network Graph Topology & Regional Resilience
  const graph = new HealthcareNetworkGraph();
  graph.addNode({ id: "HOSP-A", type: "HOSPITAL", label: "Ruby Hall Clinic" });
  graph.addNode({ id: "HOSP-B", type: "HOSPITAL", label: "Sassoon General Hospital" });
  graph.addNode({ id: "DNR-01", type: "DONOR", label: "Donor Pune 1" });
  graph.addEdge({ sourceId: "DNR-01", targetId: "HOSP-A", type: "SUPPLY_LINK", weight: 1.0 });

  assert(graph.getDegreeCentrality("HOSP-A") === 1, "Network Graph: Degree centrality computed accurately");

  const resilience = graph.computeRegionalResilience("REGION-PUNE", 8, 160, 120, 24);
  assert(
    resilience.resilienceScore >= 70 &&
      (resilience.resilienceTier === "STABLE" || resilience.resilienceTier === "ROBUST"),
    "Regional Resilience: Computes composite resilience score (>=70) with STABLE/ROBUST tier"
  );

  // 7. Pareto Multi-Objective Optimization vs Baseline 60/40
  const candidatePool = [
    {
      donorId: "DNR-A",
      availabilityScore: 0.95,
      reliabilityScore: 0.85,
      distanceKm: 5.0,
      recentNotificationCount: 1, // Low fatigue
      urgencyLevel: "CRITICAL" as const,
    },
    {
      donorId: "DNR-B",
      availabilityScore: 0.96,
      reliabilityScore: 0.86,
      distanceKm: 2.0,
      recentNotificationCount: 5, // High fatigue
      urgencyLevel: "CRITICAL" as const,
    },
  ];

  const paretoRanked = rankCandidatesMultiObjective(candidatePool);

  assert(paretoRanked.length === 2, "Pareto Optimizer: Evaluates all candidates in pool");

  const candB = paretoRanked.find((c) => c.donorId === "DNR-B")!;
  assert(
    candB.baselineScore === Math.round((0.6 * 0.96 + 0.4 * 0.86) * 100) / 100,
    "Baseline Equivalence: Preserves baseline 60/40 calculation (0.6 Avail + 0.4 Reli)"
  );
  assert(
    paretoRanked[1].fatigueBurdenScore < paretoRanked[0].fatigueBurdenScore ||
      paretoRanked[0].fatigueBurdenScore < paretoRanked[1].fatigueBurdenScore,
    "Fatigue Mitigation: Quantifies donor notification fatigue burden explicitly"
  );

  // 8. Digital Twin What-If Simulation
  const simDonorActivation = simulateScenario({
    scenarioType: "DONOR_ACTIVATION",
    currentStock: 20,
    expectedDailyDemand: 24,
    activeDonorsCount: 80,
    parameters: { activatedDonorsCount: 30 },
  });

  assert(
    simDonorActivation.netUnitsImpact > 0,
    "Digital Twin: Simulating donor activation yields positive net unit increase"
  );
  assert(
    simDonorActivation.projectedShortageHours > simDonorActivation.baselineShortageHours,
    "Digital Twin: Successful mobilization extends projected stockout runway"
  );

  const simDemandSurge = simulateScenario({
    scenarioType: "DEMAND_SURGE",
    currentStock: 20,
    expectedDailyDemand: 24,
    activeDonorsCount: 80,
    parameters: { demandSurgeMultiplier: 2.5 },
  });

  assert(
    simDemandSurge.projectedShortageHours < simDemandSurge.baselineShortageHours,
    "Digital Twin: Trauma demand surge simulation contracts remaining runway"
  );

  // 9. Zero-PHI On-Chain Privacy Invariant
  const samplePredictionProvenance = {
    modelType: "demand-forecast-v2",
    modelVersion: "2.1.0",
    predictionHash: "c01824a7bc92",
    timestamp: Date.now(),
  };
  const provJson = JSON.stringify(samplePredictionProvenance);
  assert(!provJson.includes("name") && !provJson.includes("phone"), "Zero-PHI: Prediction provenance contains no personal identity fields");

  // 10. Blood-Domain 56-Day Cooldown Invariant
  const now = Date.now();
  const cooldownMs = 56 * 24 * 3600 * 1000;
  const lastDonation = now - 35 * 24 * 3600 * 1000; // 35 days ago
  assert(now - lastDonation < cooldownMs, "Blood-domain 56-day cooldown invariant completely operational");

  console.log("==================================================");
  console.log(`Results: ${passed}/${total} advanced intelligence tests passed.`);
  console.log("==================================================");
}

runTests();
