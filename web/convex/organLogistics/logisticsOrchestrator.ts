/**
 * Logistics Orchestrator & Audit Trail Service
 * Coordinates transport request creation, option assignment, milestone progress, delay escalations, and event tracking.
 */

import { mutation, query } from "../_generated/server";
import { actionGeneric } from "convex/server";
import { v } from "convex/values";
import { requireRole, requireUser } from "../authHelpers";
import { api } from "../_generated/api";
import { isValidTransportTransition, TransportStatus } from "./logisticsConstants";
import { SimulatedMultiModalRouteProvider } from "./routeEngine";
import { evaluateTransportOptions, analyzeMilestoneDelay } from "./feasibilityEngine";

export const getTransportRequests = query({
  args: {
    status: v.optional(v.string()),
    organId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.organId) {
      return await ctx.db
        .query("transportRequests")
        .withIndex("by_organId", (idx) => idx.eq("organId", args.organId!))
        .collect();
    }
    if (args.status) {
      return await ctx.db
        .query("transportRequests")
        .withIndex("by_status", (idx) => idx.eq("status", args.status as any))
        .collect();
    }
    return await ctx.db.query("transportRequests").order("desc").collect();
  },
});

export const getTransportDetails = query({
  args: { transportRequestId: v.id("transportRequests") },
  handler: async (ctx, args) => {
    const transport = await ctx.db.get(args.transportRequestId);
    if (!transport) return null;

    const options = await ctx.db
      .query("transportOptions")
      .withIndex("by_transportRequestId", (idx) =>
        idx.eq("transportRequestId", transport._id)
      )
      .collect();

    const events = await ctx.db
      .query("transportEvents")
      .withIndex("by_transportRequestId", (idx) =>
        idx.eq("transportRequestId", transport._id)
      )
      .order("asc")
      .collect();

    const alerts = await ctx.db
      .query("logisticsAlerts")
      .withIndex("by_transportRequestId", (idx) =>
        idx.eq("transportRequestId", transport._id)
      )
      .collect();

    return {
      transport,
      options,
      events,
      alerts,
    };
  },
});

export const createTransportPlanAction = actionGeneric({
  args: {
    allocationId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch Allocation Details
    const allocation: any = await ctx.runQuery(
      (api as any).organLogistics?.logisticsOrchestrator?.getAllocationForTransport,
      { allocationId: args.allocationId }
    );
    if (!allocation) throw new Error("Authorized allocation record not found.");

    if (allocation.decisionStatus !== "APPROVED") {
      throw new Error(`Cannot initiate transport for allocation in status '${allocation.decisionStatus}'. Must be APPROVED.`);
    }

    const organ = allocation.organ;
    if (!organ) throw new Error("Associated organ inventory not found.");

    // 2. Determine Coordinates
    const originLat = 19.076; // Default regional donor hospital
    const originLng = 72.8777;
    const destLat = 18.5204; // Destination transplant center
    const destLng = 73.8567;

    // 3. Multi-Modal Route Calculation
    const routeProvider = new SimulatedMultiModalRouteProvider();
    const rawEstimates = await routeProvider.calculateRoutes(
      { lat: originLat, lng: originLng, facilityName: organ.currentFacilityId },
      { lat: destLat, lng: destLng, facilityName: "Regional Apex Transplant Center" }
    );

    // 4. Feasibility & Risk Evaluation
    const evaluatedOptions = evaluateTransportOptions(rawEstimates, organ.preservationDeadline, Date.now());

    // 5. Persist Transport Plan & Options
    const transportRequestId = await ctx.runMutation(
      (api as any).organLogistics?.logisticsOrchestrator?.saveTransportPlanMutation,
      {
        allocationId: allocation._id,
        organId: organ._id,
        originFacilityId: organ.currentFacilityId,
        destinationFacilityId: "FACILITY_APEX_TRANSPLANT",
        preservationDeadline: organ.preservationDeadline,
        options: evaluatedOptions,
      }
    );

    return {
      success: true,
      transportRequestId,
      optionsGenerated: evaluatedOptions.length,
    };
  },
});

export const getAllocationForTransport = query({
  args: { allocationId: v.string() },
  handler: async (ctx, args) => {
    const allocation = await ctx.db
      .query("organAllocations")
      .filter((q) => q.eq(q.field("_id"), args.allocationId as any))
      .first();
    if (!allocation) return null;

    const organ = await ctx.db
      .query("organInventory")
      .filter((q) => q.eq(q.field("_id"), allocation.organId as any))
      .first();

    return {
      ...allocation,
      organ,
    };
  },
});

export const saveTransportPlanMutation = mutation({
  args: {
    allocationId: v.string(),
    organId: v.string(),
    originFacilityId: v.string(),
    destinationFacilityId: v.string(),
    preservationDeadline: v.number(),
    options: v.array(
      v.object({
        mode: v.union(
          v.literal("ROAD_AMBULANCE"),
          v.literal("AIR_CHARTER"),
          v.literal("COMMERCIAL_AIR"),
          v.literal("SPECIALIZED_MEDICAL_COURIER")
        ),
        provider: v.string(),
        estimatedDurationMinutes: v.number(),
        estimatedArrival: v.number(),
        safetyBufferMinutes: v.number(),
        feasibility: v.union(
          v.literal("FEASIBLE"),
          v.literal("RISKY"),
          v.literal("INFEASIBLE"),
          v.literal("UNKNOWN")
        ),
        riskLevel: v.union(
          v.literal("LOW"),
          v.literal("MODERATE"),
          v.literal("HIGH"),
          v.literal("CRITICAL")
        ),
        isRecommended: v.boolean(),
        isSimulation: v.boolean(),
        calculatedAt: v.number(),
        explanation: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    // Check if transport request already exists for this allocation
    const existing = await ctx.db
      .query("transportRequests")
      .withIndex("by_allocationId", (idx) => idx.eq("allocationId", args.allocationId))
      .first();

    if (existing) {
      return existing._id;
    }

    const recommendedOption = args.options.find((o) => o.isRecommended) || args.options[0];
    const trackingCode = `TRK-${now.toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const transportRequestId = await ctx.db.insert("transportRequests", {
      allocationId: args.allocationId,
      organId: args.organId,
      originFacilityId: args.originFacilityId,
      destinationFacilityId: args.destinationFacilityId,
      priority: "CRITICAL_EMERGENCY",
      status: "READY",
      trackingCode,
      preservationDeadline: args.preservationDeadline,
      estimatedArrival: recommendedOption?.estimatedArrival,
      feasibility: recommendedOption?.feasibility || "UNKNOWN",
      riskLevel: recommendedOption?.riskLevel || "LOW",
      createdAt: now,
      updatedAt: now,
    });

    for (const opt of args.options) {
      await ctx.db.insert("transportOptions", {
        transportRequestId,
        mode: opt.mode,
        provider: opt.provider,
        estimatedDurationMinutes: opt.estimatedDurationMinutes,
        estimatedArrival: opt.estimatedArrival,
        safetyBufferMinutes: opt.safetyBufferMinutes,
        feasibility: opt.feasibility,
        riskLevel: opt.riskLevel,
        isRecommended: opt.isRecommended,
        isSimulation: opt.isSimulation,
        calculatedAt: opt.calculatedAt,
      });
    }

    // Record initial event
    await ctx.db.insert("transportEvents", {
      transportRequestId,
      eventType: "CREATED",
      actorId: user.clerkId,
      actorRole: user.role,
      timestamp: now,
      locationDescription: "Central Logistics Orchestrator",
      metadata: { trackingCode },
    });

    return transportRequestId;
  },
});

export const assignTransportOption = mutation({
  args: {
    transportRequestId: v.id("transportRequests"),
    transportOptionId: v.id("transportOptions"),
    assignedCarrier: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const transport = await ctx.db.get(args.transportRequestId);
    if (!transport) throw new Error("Transport request not found.");

    if (!isValidTransportTransition(transport.status, "ASSIGNED")) {
      throw new Error(`Invalid status transition: Cannot assign transport from status '${transport.status}'.`);
    }

    const option = await ctx.db.get(args.transportOptionId);
    if (!option) throw new Error("Selected transport option not found.");

    const now = Date.now();

    await ctx.db.patch(args.transportRequestId, {
      status: "ASSIGNED",
      selectedTransportOptionId: args.transportOptionId,
      assignedCarrier: args.assignedCarrier,
      estimatedArrival: option.estimatedArrival,
      feasibility: option.feasibility,
      riskLevel: option.riskLevel,
      updatedAt: now,
    });

    await ctx.db.insert("transportEvents", {
      transportRequestId: args.transportRequestId,
      eventType: "TRANSPORT_ASSIGNED",
      actorId: user.clerkId,
      actorRole: user.role,
      timestamp: now,
      locationDescription: "Logistics Dispatch Center",
      metadata: {
        carrier: args.assignedCarrier,
        mode: option.mode,
        estimatedArrival: option.estimatedArrival,
      },
    });

    return true;
  },
});

export const updateTransportStatus = mutation({
  args: {
    transportRequestId: v.id("transportRequests"),
    targetStatus: v.union(
      v.literal("PICKUP_PENDING"),
      v.literal("IN_TRANSIT"),
      v.literal("ARRIVED"),
      v.literal("DELIVERED"),
      v.literal("CONFIRMED"),
      v.literal("CANCELLED")
    ),
    locationDescription: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const transport = await ctx.db.get(args.transportRequestId);
    if (!transport) throw new Error("Transport request not found.");

    if (!isValidTransportTransition(transport.status, args.targetStatus as TransportStatus)) {
      throw new Error(
        `Invalid Transition: Cannot transition transport from '${transport.status}' to '${args.targetStatus}'.`
      );
    }

    const now = Date.now();

    // Map targetStatus to corresponding eventType
    const eventMap: Record<string, any> = {
      PICKUP_PENDING: "PICKUP_STARTED",
      IN_TRANSIT: "DEPARTED",
      ARRIVED: "ARRIVED",
      DELIVERED: "DELIVERED",
      CONFIRMED: "DELIVERY_CONFIRMED",
      CANCELLED: "TRANSPORT_CANCELLED",
    };

    await ctx.db.patch(args.transportRequestId, {
      status: args.targetStatus as any,
      updatedAt: now,
    });

    await ctx.db.insert("transportEvents", {
      transportRequestId: args.transportRequestId,
      eventType: eventMap[args.targetStatus] || "CHECKPOINT_REACHED",
      actorId: user.clerkId,
      actorRole: user.role,
      timestamp: now,
      locationDescription: args.locationDescription || "Transit Waypoint",
      metadata: { notes: args.notes },
    });

    // If delivery confirmed, advance organ status to TRANSPLANTED
    if (args.targetStatus === "CONFIRMED") {
      const organ = await ctx.db
        .query("organInventory")
        .filter((q) => q.eq(q.field("_id"), transport.organId as any))
        .first();
      if (organ) {
        await ctx.db.patch(organ._id, {
          status: "TRANSPLANTED",
          updatedAt: now,
        });
      }
    }

    return true;
  },
});

export const reportTransportDelay = mutation({
  args: {
    transportRequestId: v.id("transportRequests"),
    delayMinutes: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const transport = await ctx.db.get(args.transportRequestId);
    if (!transport) throw new Error("Transport request not found.");

    const now = Date.now();
    const plannedArrival = transport.estimatedArrival || now + 120 * 60 * 1000;
    const newArrival = plannedArrival + args.delayMinutes * 60 * 1000;

    const delayAnalysis = analyzeMilestoneDelay(
      plannedArrival,
      newArrival,
      transport.preservationDeadline,
      30
    );

    const newRiskLevel = delayAnalysis.isCriticalToDeadline ? "CRITICAL" : "HIGH";

    await ctx.db.patch(args.transportRequestId, {
      status: "DELAYED",
      estimatedArrival: newArrival,
      riskLevel: newRiskLevel,
      updatedAt: now,
    });

    await ctx.db.insert("transportEvents", {
      transportRequestId: args.transportRequestId,
      eventType: "DELAY_DETECTED",
      actorId: user.clerkId,
      actorRole: user.role,
      timestamp: now,
      locationDescription: "Transit Corridor",
      metadata: {
        delayMinutes: args.delayMinutes,
        reason: args.reason,
        isCriticalToDeadline: delayAnalysis.isCriticalToDeadline,
      },
    });

    // Generate Urgent Logistics Alert
    await ctx.db.insert("logisticsAlerts", {
      transportRequestId: args.transportRequestId,
      organId: transport.organId,
      alertType: "TRANSPORT_DELAY",
      severity: delayAnalysis.isCriticalToDeadline ? "CRITICAL" : "HIGH",
      message: delayAnalysis.alertMessage || `Transport delay: +${args.delayMinutes} mins. Reason: ${args.reason}`,
      status: "ACTIVE",
      detectedAt: now,
    });

    return {
      success: true,
      newArrival,
      isCriticalToDeadline: delayAnalysis.isCriticalToDeadline,
    };
  },
});

export const acknowledgeLogisticsAlert = mutation({
  args: {
    alertId: v.id("logisticsAlerts"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found.");

    const now = Date.now();
    await ctx.db.patch(args.alertId, {
      status: "ACKNOWLEDGED",
      acknowledgedBy: user.email,
      acknowledgedAt: now,
    });

    return true;
  },
});
