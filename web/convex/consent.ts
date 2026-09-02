import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./authHelpers";
import { CONSENT_STATUSES, ConsentStatus } from "./domainConstants";

export const getConsentByDonor = query({
  args: { donorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("consentRecords")
      .withIndex("by_donorId", (q) => q.eq("donorId", args.donorId))
      .order("desc")
      .first();
  },
});

export const recordConsent = mutation({
  args: {
    donorId: v.string(),
    consentType: v.union(
      v.literal("OPT_IN"),
      v.literal("ORGAN_SPECIFIC"),
      v.literal("FIRST_PERSON"),
      v.literal("SURROGATE")
    ),
    status: v.union(
      v.literal("NO_CONSENT"),
      v.literal("PENDING"),
      v.literal("GRANTED"),
      v.literal("WITHDRAWN"),
      v.literal("EXPIRED_OR_INVALID")
    ),
    witnessName: v.optional(v.string()),
    source: v.string(),
    version: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const consentId = await ctx.db.insert("consentRecords", {
      donorId: args.donorId,
      consentType: args.consentType,
      status: args.status,
      witnessName: args.witnessName,
      recordedAt: now,
      updatedAt: now,
      source: args.source,
      version: args.version,
      notes: args.notes,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "CONSENT_RECORDED",
      resourceType: "consentRecords",
      resourceId: consentId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        donorId: args.donorId,
        consentType: args.consentType,
        status: args.status,
      },
    });

    return consentId;
  },
});

export const withdrawConsent = mutation({
  args: {
    consentId: v.id("consentRecords"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const record = await ctx.db.get(args.consentId);
    if (!record) throw new Error("Consent record not found");

    const now = Date.now();
    await ctx.db.patch(args.consentId, {
      status: "WITHDRAWN",
      withdrawnAt: now,
      updatedAt: now,
      notes: args.reason ? `Withdrawn: ${args.reason}` : "Withdrawn by user",
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "CONSENT_WITHDRAWN",
      resourceType: "consentRecords",
      resourceId: args.consentId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        donorId: record.donorId,
        reason: args.reason,
      },
    });

    return true;
  },
});
