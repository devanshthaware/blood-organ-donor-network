/**
 * Verification Service (Queries & Mutations)
 * Manages verification requests, saves OCR results, and executes human coordinator review decisions.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireRole, requireUser } from "../authHelpers";
import { VERIFICATION_POLICY } from "./verificationConstants";

export const getVerificationHistory = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("verificationRequests")
      .filter((q) =>
        q.and(
          q.eq(q.field("entityType"), args.entityType),
          q.eq(q.field("entityId"), args.entityId)
        )
      )
      .order("desc")
      .collect();
  },
});

export const getAllVerificationRequests = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("verificationRequests")
        .withIndex("by_status", (idx) => idx.eq("status", args.status as any))
        .collect();
    }
    return await ctx.db.query("verificationRequests").order("desc").collect();
  },
});

export const getVerificationRequestById = query({
  args: { verificationRequestId: v.id("verificationRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.verificationRequestId);
  },
});

export const createVerificationRequest = mutation({
  args: {
    entityType: v.union(
      v.literal("BLOOD_UNIT"),
      v.literal("ORGAN"),
      v.literal("DONOR"),
      v.literal("RECIPIENT"),
      v.literal("TRANSPORT"),
      v.literal("DOCUMENT")
    ),
    entityId: v.string(),
    verificationType: v.union(
      v.literal("BLOOD_LABEL_VERIFICATION"),
      v.literal("ORGAN_IDENTIFIER_VERIFICATION"),
      v.literal("BARCODE_SCAN"),
      v.literal("DOCUMENT_OCR"),
      v.literal("PACKAGE_VERIFICATION")
    ),
    imageReference: v.string(),
    authoritativeSnapshot: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const id = await ctx.db.insert("verificationRequests", {
      entityType: args.entityType,
      entityId: args.entityId,
      verificationType: args.verificationType,
      imageReference: args.imageReference,
      authoritativeSnapshot: args.authoritativeSnapshot,
      status: "UPLOADED",
      engine: VERIFICATION_POLICY.engineName,
      engineVersion: VERIFICATION_POLICY.engineVersion,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "VERIFICATION_REQUEST_CREATED",
      resourceType: "verificationRequests",
      resourceId: id,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        entityType: args.entityType,
        entityId: args.entityId,
        verificationType: args.verificationType,
      },
    });

    return id;
  },
});

export const saveVerificationResults = mutation({
  args: {
    verificationRequestId: v.id("verificationRequests"),
    imageQuality: v.optional(v.any()),
    extractedData: v.optional(v.any()),
    comparisonResult: v.optional(v.any()),
    status: v.union(
      v.literal("UPLOADED"),
      v.literal("PROCESSING"),
      v.literal("EXTRACTED"),
      v.literal("REVIEW_REQUIRED"),
      v.literal("VERIFIED"),
      v.literal("REJECTED"),
      v.literal("FAILED")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.verificationRequestId, {
      imageQuality: args.imageQuality,
      extractedData: args.extractedData,
      comparisonResult: args.comparisonResult,
      status: args.status,
      updatedAt: now,
    });
    return true;
  },
});

export const submitHumanReview = mutation({
  args: {
    verificationRequestId: v.id("verificationRequests"),
    decision: v.union(
      v.literal("VERIFIED"),
      v.literal("REJECTED"),
      v.literal("RETRY_REQUESTED")
    ),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["hospital", "admin"]);
    const request = await ctx.db.get(args.verificationRequestId);
    if (!request) throw new Error("Verification request not found.");

    if (!args.reason || args.reason.trim().length === 0) {
      throw new Error("Mandatory Review Reason: Human coordinator decision requires recorded clinical/operational justification.");
    }

    const now = Date.now();

    await ctx.db.patch(args.verificationRequestId, {
      status: args.decision === "VERIFIED" ? "VERIFIED" : "REJECTED",
      reviewedBy: user.email,
      reviewDecision: args.decision,
      reviewReason: args.reason,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "VERIFICATION_REVIEWED_BY_HUMAN_COORDINATOR",
      resourceType: "verificationRequests",
      resourceId: args.verificationRequestId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        entityType: request.entityType,
        entityId: request.entityId,
        decision: args.decision,
        reason: args.reason,
        comparisonStatus: request.comparisonResult?.status,
        mismatchCount: request.comparisonResult?.mismatches?.length ?? 0,
      },
    });

    return true;
  },
});
