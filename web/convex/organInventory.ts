import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./authHelpers";
import {
  ORGAN_INVENTORY_STATUSES,
  VALID_ORGAN_INVENTORY_TRANSITIONS,
  isValidTransition,
  OrganInventoryStatus,
} from "./domainConstants";

export const getAvailableOrgans = query({
  args: { organType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("organInventory")
      .withIndex("by_status", (idx) => idx.eq("status", "AVAILABLE"));

    if (args.organType) {
      return await ctx.db
        .query("organInventory")
        .withIndex("by_organType", (idx) => idx.eq("organType", args.organType!))
        .filter((q) => q.eq(q.field("status"), "AVAILABLE"))
        .collect();
    }

    return await q.collect();
  },
});

export const getAllOrganInventory = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("organInventory")
        .withIndex("by_status", (idx) => idx.eq("status", args.status as any))
        .collect();
    }
    return await ctx.db.query("organInventory").collect();
  },
});

export const registerOrgan = mutation({
  args: {
    organType: v.string(),
    bloodType: v.string(),
    donorId: v.optional(v.string()),
    currentFacilityId: v.string(),
    availabilityTimestamp: v.number(),
    preservationDeadline: v.number(), // Data-driven preservation window
    viabilityNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const organId = await ctx.db.insert("organInventory", {
      organType: args.organType,
      bloodType: args.bloodType,
      status: "IDENTIFIED",
      donorId: args.donorId,
      currentFacilityId: args.currentFacilityId,
      availabilityTimestamp: args.availabilityTimestamp,
      preservationDeadline: args.preservationDeadline,
      verificationStatus: "PENDING",
      viabilityNotes: args.viabilityNotes,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ORGAN_IDENTIFIED",
      resourceType: "organInventory",
      resourceId: organId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organType: args.organType,
        bloodType: args.bloodType,
        preservationDeadline: args.preservationDeadline,
      },
    });

    return organId;
  },
});

export const updateOrganStatus = mutation({
  args: {
    organId: v.id("organInventory"),
    newStatus: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const organ = await ctx.db.get(args.organId);
    if (!organ) throw new Error("Organ not found");

    const currentStatus = organ.status as OrganInventoryStatus;
    const nextStatus = args.newStatus as OrganInventoryStatus;

    if (!isValidTransition(currentStatus, nextStatus, VALID_ORGAN_INVENTORY_TRANSITIONS)) {
      throw new Error(
        `Invalid organ state transition from ${currentStatus} to ${nextStatus}`
      );
    }

    const now = Date.now();
    await ctx.db.patch(args.organId, {
      status: nextStatus,
      updatedAt: now,
      ...(nextStatus === "VERIFIED" && { verificationStatus: "VERIFIED" }),
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ORGAN_STATUS_TRANSITION",
      resourceType: "organInventory",
      resourceId: args.organId,
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
