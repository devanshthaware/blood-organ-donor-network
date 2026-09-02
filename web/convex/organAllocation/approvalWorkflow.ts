/**
 * Human Approval Workflow & Concurrency Protection
 * Handles authorized coordinator approvals, human overrides, and revalidation guards.
 */

import { mutation, query, action } from "../_generated/server";
import { v } from "convex/values";
import { requireRole, requireUser } from "../authHelpers";
import { api } from "../_generated/api";
import { DEFAULT_ALLOCATION_POLICY } from "./allocationPolicy";
import { validateAllocationEligibility } from "./eligibilityGate";
import { optimizeAllocationCandidates } from "./multiObjectiveOptimizer";
import { buildAllocationRecommendations } from "./recommendationEngine";
import { calculateDistanceKm } from "../organMatching/compatibilityEngine";

export const getRecommendationsForOrgan = query({
  args: { organId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("allocationRecommendations")
      .withIndex("by_organId", (idx) => idx.eq("organId", args.organId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "PENDING_REVIEW"),
          q.eq(q.field("status"), "APPROVED")
        )
      )
      .order("asc")
      .collect();
  },
});

export const generateAllocationRecommendations = action({
  args: {
    organId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const policy = DEFAULT_ALLOCATION_POLICY;
    const currentTime = Date.now();

    // 1. Fetch Organ
    const organ: any = await ctx.runQuery((api as any).organMatching.getOrganDetails, {
      organId: args.organId,
    });
    if (!organ) throw new Error("Organ not found.");

    // 2. Fetch Active Requests
    const candidatePairs: any[] = await ctx.runQuery(
      (api as any).organMatching.getActiveRequestsForOrgan,
      { organType: organ.organType }
    );

    const eligibleCandidates: any[] = [];
    const organLat = 19.076;
    const organLng = 72.8777;

    for (const pair of candidatePairs) {
      const { request, recipient } = pair;
      const recLat = recipient.location?.lat ?? 19.076;
      const recLng = recipient.location?.lng ?? 72.8777;
      const distanceKm = calculateDistanceKm(organLat, organLng, recLat, recLng);

      const context = {
        organ: {
          _id: organ._id,
          organType: organ.organType,
          bloodType: organ.bloodType,
          status: organ.status,
          preservationDeadline: organ.preservationDeadline,
        },
        request: {
          _id: request._id,
          recipientId: request.recipientId,
          organType: request.organType,
          bloodType: request.bloodType,
          status: request.status,
          urgency: request.urgency,
          createdAt: request.createdAt,
        },
        recipient: {
          _id: recipient._id,
          recipientStatus: recipient.recipientStatus,
          verificationStatus: recipient.verificationStatus,
          bloodType: recipient.bloodType,
          registeredAt: recipient.registeredAt,
        },
        distanceKm,
        currentTime,
      };

      const eligibility = validateAllocationEligibility(context, policy);
      if (eligibility.isEligible) {
        eligibleCandidates.push({
          context,
          candidateMatchId: `match_${organ._id}_${recipient._id}`,
        });
      }
    }

    if (eligibleCandidates.length === 0) {
      return { success: true, recommendationsCount: 0, message: "No candidates passed eligibility gate." };
    }

    // 3. Multi-objective optimization
    const optimized = optimizeAllocationCandidates(eligibleCandidates, policy);

    // 4. Build recommendations (top 3)
    const topCandidates = optimized.slice(0, 3);
    const preparedRecs = buildAllocationRecommendations(topCandidates, policy);

    // 5. Persist recommendations
    const savedIds = await ctx.runMutation(
      (api as any).organAllocations.saveRecommendationsBatch,
      {
        organId: args.organId,
        recommendations: preparedRecs,
      }
    );

    return {
      success: true,
      recommendationsCount: savedIds.length,
      savedIds,
    };
  },
});

export const saveRecommendationsBatch = mutation({
  args: {
    organId: v.string(),
    recommendations: v.array(
      v.object({
        organId: v.string(),
        requestId: v.string(),
        recipientId: v.string(),
        candidateMatchId: v.string(),
        score: v.number(),
        rank: v.number(),
        objectives: v.any(),
        objectiveBreakdown: v.any(),
        constraints: v.array(v.string()),
        constraintResults: v.any(),
        warnings: v.array(v.string()),
        policyVersion: v.string(),
        algorithmVersion: v.string(),
        explanation: v.string(),
        status: v.union(
          v.literal("GENERATED"),
          v.literal("PENDING_REVIEW"),
          v.literal("UNDER_REVIEW"),
          v.literal("APPROVED"),
          v.literal("REJECTED"),
          v.literal("SUPERSEDED"),
          v.literal("EXPIRED")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    // Mark previous PENDING_REVIEW recommendations for this organ as SUPERSEDED
    const existingRecs = await ctx.db
      .query("allocationRecommendations")
      .withIndex("by_organId", (idx) => idx.eq("organId", args.organId))
      .filter((q) => q.eq(q.field("status"), "PENDING_REVIEW"))
      .collect();

    for (const er of existingRecs) {
      await ctx.db.patch(er._id, {
        status: "SUPERSEDED",
        updatedAt: now,
      });
    }

    const insertedIds = [];
    for (const rec of args.recommendations) {
      const id = await ctx.db.insert("allocationRecommendations", {
        ...rec,
        createdAt: now,
        updatedAt: now,
      });
      insertedIds.push(id);
    }

    // Place organ in MATCHING state
    const organ = await ctx.db
      .query("organInventory")
      .filter((q) => q.eq(q.field("_id"), args.organId as any))
      .first();
    if (organ && organ.status === "AVAILABLE") {
      await ctx.db.patch(organ._id, {
        status: "MATCHING",
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ALLOCATION_RECOMMENDATIONS_GENERATED",
      resourceType: "allocationRecommendations",
      resourceId: args.organId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organId: args.organId,
        recommendationCount: insertedIds.length,
        policyVersion: args.recommendations[0]?.policyVersion,
      },
    });

    return insertedIds;
  },
});

export const approveAllocationWithRevalidation = mutation({
  args: {
    recommendationId: v.id("allocationRecommendations"),
    clinicalJustification: v.string(),
    isOverride: v.boolean(),
    overrideReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Role-Based Authorization Check
    const { user } = await requireRole(ctx, ["hospital", "admin"]);

    // 2. Fetch Recommendation
    const rec = await ctx.db.get(args.recommendationId);
    if (!rec) throw new Error("Allocation recommendation record not found.");

    if (rec.status !== "PENDING_REVIEW") {
      throw new Error(`Recommendation cannot be approved in status '${rec.status}'.`);
    }

    // 3. Mandatory Human Override Justification Check
    if (args.isOverride && (!args.overrideReason || args.overrideReason.trim().length === 0)) {
      throw new Error(
        "Human Override Error: Selecting a non-primary candidate requires explicit recorded clinical justification."
      );
    }

    const now = Date.now();

    // 4. ATOMIC REVALIDATION (Anti-Stale & Conflict Protection)
    const organ = await ctx.db
      .query("organInventory")
      .filter((q) => q.eq(q.field("_id"), rec.organId as any))
      .first();

    if (!organ) throw new Error("Organ not found in registry.");
    if (organ.status !== "AVAILABLE" && organ.status !== "MATCHING") {
      throw new Error(
        `Allocation Conflict: This allocation is no longer valid because the organ is in status '${organ.status}'.`
      );
    }

    if (organ.preservationDeadline <= now) {
      throw new Error(
        "Preservation Conflict: Organ cold ischemia deadline has passed. Cannot allocate expired organ."
      );
    }

    const request = await ctx.db
      .query("organRequests")
      .filter((q) => q.eq(q.field("_id"), rec.requestId as any))
      .first();

    if (!request || (request.status !== "ACTIVE" && request.status !== "MATCHING")) {
      throw new Error("Request Conflict: Associated transplant request is no longer active.");
    }

    const recipient = await ctx.db
      .query("recipients")
      .filter((q) => q.eq(q.field("_id"), rec.recipientId as any))
      .first();

    if (!recipient || recipient.recipientStatus !== "ACTIVE") {
      throw new Error("Recipient Conflict: Recipient is no longer in ACTIVE status.");
    }

    // 5. ATOMIC COMMIT (Single ACID Transaction)
    // a. Update this recommendation to APPROVED
    await ctx.db.patch(args.recommendationId, {
      status: "APPROVED",
      updatedAt: now,
    });

    // b. Mark competing recommendations for same organ as SUPERSEDED
    const competingRecs = await ctx.db
      .query("allocationRecommendations")
      .withIndex("by_organId", (idx) => idx.eq("organId", rec.organId))
      .filter((q) => q.eq(q.field("status"), "PENDING_REVIEW"))
      .collect();

    for (const cr of competingRecs) {
      if (cr._id !== args.recommendationId) {
        await ctx.db.patch(cr._id, {
          status: "SUPERSEDED",
          updatedAt: now,
        });
      }
    }

    // c. Create formal authorized allocation entity
    const auditReference = `ALLOC-AUTH-${now}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const allocationId = await ctx.db.insert("organAllocations", {
      organId: rec.organId,
      recipientId: rec.recipientId,
      requestId: rec.requestId,
      matchId: rec.candidateMatchId,
      recommendationId: rec._id,
      isOverride: args.isOverride,
      overrideReason: args.overrideReason,
      decisionStatus: "APPROVED",
      decisionReason: args.clinicalJustification,
      decisionMakerId: user.clerkId,
      decisionMakerRole: user.role,
      approvedAt: now,
      policyVersion: rec.policyVersion,
      algorithmVersion: rec.algorithmVersion,
      auditReference,
      createdAt: now,
      updatedAt: now,
    });

    // d. Update domain entity states
    await ctx.db.patch(organ._id, { status: "ALLOCATED", updatedAt: now });
    await ctx.db.patch(request._id, { status: "ALLOCATED", updatedAt: now });
    await ctx.db.patch(recipient._id, { recipientStatus: "ALLOCATED", updatedAt: now });

    // e. Write Immutable Audit Trail
    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: args.isOverride
        ? "ALLOCATION_OVERRIDDEN_AND_APPROVED_BY_HUMAN"
        : "ALLOCATION_APPROVED_BY_HUMAN_COORDINATOR",
      resourceType: "organAllocations",
      resourceId: allocationId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organId: rec.organId,
        recipientId: rec.recipientId,
        isOverride: args.isOverride,
        overrideReason: args.overrideReason,
        clinicalJustification: args.clinicalJustification,
        policyVersion: rec.policyVersion,
        auditReference,
      },
    });

    return {
      success: true,
      allocationId,
      auditReference,
    };
  },
});

export const rejectAllocationWithReason = mutation({
  args: {
    recommendationId: v.id("allocationRecommendations"),
    rejectionCategory: v.string(),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["hospital", "admin"]);
    const rec = await ctx.db.get(args.recommendationId);
    if (!rec) throw new Error("Allocation recommendation not found.");

    const now = Date.now();

    await ctx.db.patch(args.recommendationId, {
      status: "REJECTED",
      updatedAt: now,
    });

    // If no other pending recommendations remain for this organ, restore it to AVAILABLE
    const remainingPending = await ctx.db
      .query("allocationRecommendations")
      .withIndex("by_organId", (idx) => idx.eq("organId", rec.organId))
      .filter((q) => q.eq(q.field("status"), "PENDING_REVIEW"))
      .collect();

    if (remainingPending.length <= 1) {
      const organ = await ctx.db
        .query("organInventory")
        .filter((q) => q.eq(q.field("_id"), rec.organId as any))
        .first();
      if (organ && organ.status === "MATCHING") {
        await ctx.db.patch(organ._id, {
          status: "AVAILABLE",
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ALLOCATION_RECOMMENDATION_REJECTED",
      resourceType: "allocationRecommendations",
      resourceId: args.recommendationId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organId: rec.organId,
        recipientId: rec.recipientId,
        rejectionCategory: args.rejectionCategory,
        rejectionReason: args.rejectionReason,
      },
    });

    return true;
  },
});
