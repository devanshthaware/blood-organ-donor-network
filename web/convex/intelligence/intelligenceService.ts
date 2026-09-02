/**
 * Intelligence Service (Queries, Mutations & Orchestration)
 * Powers the Network Intelligence Command Center and What-If Simulation Studio.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { computeMultiHorizonForecast } from "./forecasting/demandForecastEngine";
import { detectNetworkAnomalies } from "./anomaly/anomalyDetector";
import { HealthcareNetworkGraph } from "./network/networkGraphModel";
import { rankCandidatesMultiObjective } from "./optimization/multiObjectiveRanker";
import { simulateScenario } from "./simulation/digitalTwinSimulator";

export const getIntelligenceMetrics = query({
  args: {},
  handler: async (ctx) => {
    const anomalies = await ctx.db.query("networkAnomalies").collect();
    const activeAnomalies = anomalies.filter((a) => a.status === "ACTIVE").length;

    const graph = new HealthcareNetworkGraph();
    const resilience = graph.computeRegionalResilience("REGION-PUNE-METRO", 8, 142, 115, 28);

    return {
      activeAnomalies,
      criticalAnomalies: anomalies.filter((a) => a.severity === "CRITICAL" && a.status === "ACTIVE").length,
      regionalResilienceScore: resilience.resilienceScore,
      resilienceTier: resilience.resilienceTier,
      forecastLeadTimeHours: 72,
      activeModelsCount: 5,
    };
  },
});

export const getMultiHorizonForecast = query({
  args: {
    regionId: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const regionId = args.regionId || "REGION-PUNE-METRO";
    const bloodGroup = args.bloodGroup || "O-";

    return computeMultiHorizonForecast({
      regionId,
      bloodGroup,
      currentInventory: 18,
      recentHourlyDepletions: [2, 3, 2, 4, 3, 2],
      historicalDailyAverageDemand: 22,
      historicalDailyAverageSupply: 16,
      isEmergencyHotspot: true,
    });
  },
});

export const getAllNetworkAnomalies = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("networkAnomalies")
      .order("desc")
      .take(args.limit || 50);

    if (records.length === 0) {
      // Return simulated anomaly for demonstration if table is empty
      return [
        {
          _id: "demo-anomaly-1" as any,
          anomalyId: "ANOM-DEMO-01",
          anomalyType: "DEMAND_SURGE",
          severity: "HIGH",
          score: 2.85,
          affectedEntity: "HOSP-PUNE-01",
          regionId: "REGION-PUNE-METRO",
          explanation: "Observed 48 requests/day vs 18 baseline mean (+2.85σ surge).",
          status: "ACTIVE",
          detectedAt: Date.now() - 3600000,
        },
      ];
    }

    return records;
  },
});

export const acknowledgeAnomaly = mutation({
  args: {
    anomalyId: v.string(),
    resolutionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("networkAnomalies")
      .filter((q) => q.eq(q.field("anomalyId"), args.anomalyId))
      .first();

    if (record) {
      await ctx.db.patch(record._id, {
        status: "ACKNOWLEDGED",
      });
    }

    return { success: true };
  },
});

export const runParetoCandidateRanking = query({
  args: {},
  handler: async () => {
    const sampleCandidates = [
      {
        donorId: "DNR-101",
        name: "Aarav Deshmukh",
        availabilityScore: 0.94,
        reliabilityScore: 0.92,
        distanceKm: 6.2,
        recentNotificationCount: 1,
        urgencyLevel: "CRITICAL" as const,
      },
      {
        donorId: "DNR-102",
        name: "Meera Kulkarni",
        availabilityScore: 0.96,
        reliabilityScore: 0.78,
        distanceKm: 2.1,
        recentNotificationCount: 4, // Higher fatigue
        urgencyLevel: "CRITICAL" as const,
      },
      {
        donorId: "DNR-103",
        name: "Rohan Patil",
        availabilityScore: 0.72,
        reliabilityScore: 0.96,
        distanceKm: 14.5,
        recentNotificationCount: 0, // Very fresh
        urgencyLevel: "CRITICAL" as const,
      },
      {
        donorId: "DNR-104",
        name: "Ananya Joshi",
        availabilityScore: 0.85,
        reliabilityScore: 0.88,
        distanceKm: 8.4,
        recentNotificationCount: 2,
        urgencyLevel: "CRITICAL" as const,
      },
    ];

    return rankCandidatesMultiObjective(sampleCandidates);
  },
});

export const executeWhatIfSimulation = mutation({
  args: {
    scenarioType: v.union(
      v.literal("DONOR_ACTIVATION"),
      v.literal("INTER_HOSPITAL_TRANSFER"),
      v.literal("DEMAND_SURGE"),
      v.literal("TRANSIT_DELAY")
    ),
    activatedDonorsCount: v.optional(v.number()),
    transferredUnitsCount: v.optional(v.number()),
    demandSurgeMultiplier: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = simulateScenario({
      scenarioType: args.scenarioType,
      currentStock: 24,
      expectedDailyDemand: 28,
      activeDonorsCount: 120,
      parameters: {
        activatedDonorsCount: args.activatedDonorsCount,
        transferredUnitsCount: args.transferredUnitsCount,
        demandSurgeMultiplier: args.demandSurgeMultiplier,
      },
    });

    await ctx.db.insert("simulationRuns", {
      simulationId: result.simulationId,
      scenarioType: args.scenarioType,
      parameters: args,
      projectedShortage: result.projectedShortageHours,
      projectedFulfillment: result.projectedFulfillmentRate,
      networkResilienceScore: 68 + result.resilienceScoreDelta,
      createdAt: result.generatedAt,
    });

    return result;
  },
});
