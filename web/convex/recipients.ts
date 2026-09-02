import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./authHelpers";
import {
  RECIPIENT_STATUSES,
  RecipientStatus,
  ORGAN_TYPES,
} from "./domainConstants";

export const getAllRecipients = query({
  args: {
    status: v.optional(v.string()),
    organType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("recipients");

    if (args.status) {
      return await q
        .withIndex("by_status", (idx) => idx.eq("recipientStatus", args.status as any))
        .collect();
    }

    if (args.organType) {
      return await q
        .withIndex("by_organType", (idx) => idx.eq("requiredOrganType", args.organType!))
        .collect();
    }

    return await q.collect();
  },
});

export const getRecipientById = query({
  args: { recipientId: v.id("recipients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.recipientId);
  },
});

export const registerRecipient = mutation({
  args: {
    userId: v.string(),
    requiredOrganType: v.string(),
    bloodType: v.string(),
    urgency: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    hospitalId: v.string(),
    transplantCenterId: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const recipientId = await ctx.db.insert("recipients", {
      userId: args.userId,
      recipientStatus: "REGISTERED",
      requiredOrganType: args.requiredOrganType,
      bloodType: args.bloodType,
      urgency: args.urgency,
      verificationStatus: "PENDING",
      hospitalId: args.hospitalId,
      transplantCenterId: args.transplantCenterId,
      location: {
        lat: args.lat,
        lng: args.lng,
        address: args.address,
      },
      registeredAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "RECIPIENT_REGISTERED",
      resourceType: "recipients",
      resourceId: recipientId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        requiredOrganType: args.requiredOrganType,
        bloodType: args.bloodType,
        urgency: args.urgency,
      },
    });

    return recipientId;
  },
});

export const updateRecipientStatus = mutation({
  args: {
    recipientId: v.id("recipients"),
    newStatus: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const recipient = await ctx.db.get(args.recipientId);
    if (!recipient) throw new Error("Recipient not found");

    const now = Date.now();
    await ctx.db.patch(args.recipientId, {
      recipientStatus: args.newStatus as any,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "RECIPIENT_STATUS_UPDATED",
      resourceType: "recipients",
      resourceId: args.recipientId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        previousState: recipient.recipientStatus,
        newState: args.newStatus,
        reason: args.reason,
      },
    });

    return true;
  },
});
