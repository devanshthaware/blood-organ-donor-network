import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity, requireUser } from "./authHelpers";
import {
  ORGAN_DONOR_STATUSES,
  VALID_ORGAN_DONOR_TRANSITIONS,
  isValidTransition,
  OrganDonorStatus,
} from "./domainConstants";

export const getOrganDonorProfile = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;

    if (!targetUserId) {
      const identity = await getUserIdentity(ctx);
      if (!identity) return null;
      targetUserId = identity.subject;
    }

    return await ctx.db
      .query("organDonors")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId!))
      .first();
  },
});

export const getAllOrganDonors = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("organDonors")
        .withIndex("by_status", (q) => q.eq("donorStatus", args.status as any))
        .collect();
    }
    return await ctx.db.query("organDonors").collect();
  },
});

export const registerOrganDonor = mutation({
  args: {
    donationPreferences: v.array(v.string()),
    bloodType: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    address: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("organDonors")
      .withIndex("by_userId", (q) => q.eq("userId", user.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        donationPreferences: args.donationPreferences,
        bloodType: args.bloodType,
        location: {
          lat: args.lat,
          lng: args.lng,
          address: args.address,
        },
        updatedAt: now,
      });
      return existing._id;
    }

    const donorId = await ctx.db.insert("organDonors", {
      userId: user.clerkId,
      donorStatus: "REGISTERED",
      donationPreferences: args.donationPreferences,
      verificationStatus: "PENDING",
      bloodType: args.bloodType,
      location: {
        lat: args.lat,
        lng: args.lng,
        address: args.address,
      },
      registeredAt: now,
      updatedAt: now,
      metadata: args.metadata,
    });

    // Record audit event
    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ORGAN_DONOR_REGISTERED",
      resourceType: "organDonors",
      resourceId: donorId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: { preferences: args.donationPreferences },
    });

    return donorId;
  },
});

export const updateDonorStatus = mutation({
  args: {
    donorId: v.id("organDonors"),
    newStatus: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const donor = await ctx.db.get(args.donorId);
    if (!donor) throw new Error("Organ donor not found");

    const currentStatus = donor.donorStatus as OrganDonorStatus;
    const nextStatus = args.newStatus as OrganDonorStatus;

    if (!isValidTransition(currentStatus, nextStatus, VALID_ORGAN_DONOR_TRANSITIONS)) {
      throw new Error(
        `Invalid lifecycle transition from ${currentStatus} to ${nextStatus}`
      );
    }

    const now = Date.now();
    await ctx.db.patch(args.donorId, {
      donorStatus: nextStatus,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ORGAN_DONOR_STATUS_UPDATED",
      resourceType: "organDonors",
      resourceId: args.donorId,
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
