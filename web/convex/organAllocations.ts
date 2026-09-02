import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, requireRole } from "./authHelpers";
import {
  ALLOCATION_STATUSES,
  VALID_ALLOCATION_TRANSITIONS,
  isValidTransition,
  AllocationStatus,
} from "./domainConstants";

export {
  getRecommendationsForOrgan,
  saveRecommendationsBatch,
  approveAllocationWithRevalidation,
  rejectAllocationWithReason,
} from "./organAllocation/approvalWorkflow";

export const getAllocations = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("organAllocations")
        .withIndex("by_decisionStatus", (idx) =>
          idx.eq("decisionStatus", args.status as any)
        )
        .collect();
    }
    return await ctx.db.query("organAllocations").collect();
  },
});

export const submitAllocationReview = mutation({
  args: {
    organId: v.string(),
    recipientId: v.string(),
    requestId: v.string(),
    matchId: v.string(),
    proposedReason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    // Verify organ is available
    const organ = await ctx.db
      .query("organInventory")
      .filter((q) => q.eq(q.field("_id"), args.organId as any))
      .first();

    if (!organ) throw new Error("Organ not found");
    if (organ.status !== "AVAILABLE" && organ.status !== "MATCHING") {
      throw new Error(`Organ cannot be allocated in status ${organ.status}`);
    }

    const allocationId = await ctx.db.insert("organAllocations", {
      organId: args.organId,
      recipientId: args.recipientId,
      requestId: args.requestId,
      matchId: args.matchId,
      decisionStatus: "PENDING_HUMAN_APPROVAL",
      decisionReason: args.proposedReason,
      decisionMakerId: user.clerkId,
      decisionMakerRole: user.role,
      policyVersion: "1.0-NATIONAL-ALLOCATION-POLICY",
      auditReference: `ALLOC-REV-${now}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
    });

    // Move organ to MATCHING state while under review
    await ctx.db.patch(organ._id, {
      status: "MATCHING",
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ALLOCATION_SUBMITTED_FOR_REVIEW",
      resourceType: "organAllocations",
      resourceId: allocationId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organId: args.organId,
        recipientId: args.recipientId,
        matchId: args.matchId,
      },
    });

    return allocationId;
  },
});

export const approveAllocation = mutation({
  args: {
    allocationId: v.id("organAllocations"),
    clinicalJustification: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const allocation = await ctx.db.get(args.allocationId);
    if (!allocation) throw new Error("Allocation record not found");

    if (allocation.decisionStatus !== "PENDING_HUMAN_APPROVAL") {
      throw new Error(
        `Cannot approve allocation in status ${allocation.decisionStatus}`
      );
    }

    const now = Date.now();

    // 1. Update allocation record with human decision
    await ctx.db.patch(args.allocationId, {
      decisionStatus: "APPROVED",
      decisionReason: args.clinicalJustification,
      decisionMakerId: user.clerkId,
      decisionMakerRole: user.role,
      approvedAt: now,
      updatedAt: now,
    });

    // 2. Mark organ as ALLOCATED
    const organ = await ctx.db
      .query("organInventory")
      .filter((q) => q.eq(q.field("_id"), allocation.organId as any))
      .first();
    if (organ) {
      await ctx.db.patch(organ._id, {
        status: "ALLOCATED",
        updatedAt: now,
      });
    }

    // 3. Update organ request to ALLOCATED
    const request = await ctx.db
      .query("organRequests")
      .filter((q) => q.eq(q.field("_id"), allocation.requestId as any))
      .first();
    if (request) {
      await ctx.db.patch(request._id, {
        status: "ALLOCATED",
        updatedAt: now,
      });
    }

    // 4. Update recipient status to ALLOCATED
    const recipient = await ctx.db
      .query("recipients")
      .filter((q) => q.eq(q.field("_id"), allocation.recipientId as any))
      .first();
    if (recipient) {
      await ctx.db.patch(recipient._id, {
        recipientStatus: "ALLOCATED",
        updatedAt: now,
      });
    }

    // 5. Immutable Audit Log
    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ALLOCATION_APPROVED_BY_HUMAN_COORDINATOR",
      resourceType: "organAllocations",
      resourceId: args.allocationId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organId: allocation.organId,
        recipientId: allocation.recipientId,
        decisionMaker: user.email,
        clinicalJustification: args.clinicalJustification,
        policyVersion: allocation.policyVersion,
        auditReference: allocation.auditReference,
      },
    });

    return true;
  },
});

export const rejectAllocation = mutation({
  args: {
    allocationId: v.id("organAllocations"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const allocation = await ctx.db.get(args.allocationId);
    if (!allocation) throw new Error("Allocation record not found");

    const now = Date.now();

    await ctx.db.patch(args.allocationId, {
      decisionStatus: "REJECTED",
      decisionReason: args.rejectionReason,
      decisionMakerId: user.clerkId,
      decisionMakerRole: user.role,
      updatedAt: now,
    });

    // Revert organ back to AVAILABLE if it was matching
    const organ = await ctx.db
      .query("organInventory")
      .filter((q) => q.eq(q.field("_id"), allocation.organId as any))
      .first();
    if (organ && organ.status === "MATCHING") {
      await ctx.db.patch(organ._id, {
        status: "AVAILABLE",
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ALLOCATION_REJECTED_BY_HUMAN_COORDINATOR",
      resourceType: "organAllocations",
      resourceId: args.allocationId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organId: allocation.organId,
        recipientId: allocation.recipientId,
        rejectionReason: args.rejectionReason,
      },
    });

    return true;
  },
});
