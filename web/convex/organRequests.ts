import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./authHelpers";
import {
  ORGAN_REQUEST_STATUSES,
  VALID_ORGAN_REQUEST_TRANSITIONS,
  isValidTransition,
  OrganRequestStatus,
} from "./domainConstants";

export const getAllOrganRequests = query({
  args: {
    status: v.optional(v.string()),
    organType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("organRequests")
        .withIndex("by_status", (idx) => idx.eq("status", args.status as any))
        .collect();
    }
    if (args.organType) {
      return await ctx.db
        .query("organRequests")
        .withIndex("by_organType", (idx) => idx.eq("organType", args.organType!))
        .collect();
    }
    return await ctx.db.query("organRequests").collect();
  },
});

export const getOrganRequestById = query({
  args: { requestId: v.id("organRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

export const createOrganRequest = mutation({
  args: {
    requestingOrganizationId: v.string(),
    recipientId: v.string(),
    organType: v.string(),
    bloodType: v.string(),
    urgency: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const requestId = await ctx.db.insert("organRequests", {
      requestingOrganizationId: args.requestingOrganizationId,
      recipientId: args.recipientId,
      organType: args.organType,
      bloodType: args.bloodType,
      urgency: args.urgency,
      status: "CREATED",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ORGAN_REQUEST_CREATED",
      resourceType: "organRequests",
      resourceId: requestId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organType: args.organType,
        recipientId: args.recipientId,
        urgency: args.urgency,
      },
    });

    return requestId;
  },
});

export const updateOrganRequestStatus = mutation({
  args: {
    requestId: v.id("organRequests"),
    newStatus: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Organ request not found");

    const currentStatus = request.status as OrganRequestStatus;
    const nextStatus = args.newStatus as OrganRequestStatus;

    if (!isValidTransition(currentStatus, nextStatus, VALID_ORGAN_REQUEST_TRANSITIONS)) {
      throw new Error(
        `Invalid organ request state transition from ${currentStatus} to ${nextStatus}`
      );
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: nextStatus,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ORGAN_REQUEST_STATUS_UPDATED",
      resourceType: "organRequests",
      resourceId: args.requestId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        previousState: currentStatus,
        newState: nextStatus,
        reason: args.reason,
      },
    });

    return true;
  },
});
