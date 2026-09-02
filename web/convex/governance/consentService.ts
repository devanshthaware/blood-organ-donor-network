/**
 * Consent Management Service
 * Manages purpose-specific consent lifecycle, versioning, revocation, and downstream enforcement.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../authHelpers";

export const CURRENT_POLICY_VERSION = "2.1.0-2026";

export const getUserConsents = query({
  args: { donorId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const targetDonorId = args.donorId || user.clerkId;

    return await ctx.db
      .query("consentRecords")
      .withIndex("by_donorId", (q) => q.eq("donorId", targetDonorId))
      .order("desc")
      .collect();
  },
});

export const grantConsent = mutation({
  args: {
    donorId: v.string(),
    consentType: v.union(
      v.literal("OPT_IN"),
      v.literal("ORGAN_SPECIFIC"),
      v.literal("FIRST_PERSON"),
      v.literal("SURROGATE")
    ),
    purpose: v.union(
      v.literal("DONATION"),
      v.literal("EMERGENCY_CONTACT"),
      v.literal("LOCATION_PROCESSING"),
      v.literal("AI_PROCESSING"),
      v.literal("COMMUNICATION"),
      v.literal("RESEARCH")
    ),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    // Check if previous consent exists for this purpose
    const existing = await ctx.db
      .query("consentRecords")
      .withIndex("by_donorId", (q) => q.eq("donorId", args.donorId))
      .filter((q) => q.eq(q.field("purpose"), args.purpose))
      .first();

    let consentId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "GRANTED",
        updatedAt: now,
        withdrawnAt: undefined,
        version: CURRENT_POLICY_VERSION,
        notes: args.notes,
      });
      consentId = existing._id;
    } else {
      consentId = await ctx.db.insert("consentRecords", {
        donorId: args.donorId,
        consentType: args.consentType,
        purpose: args.purpose,
        status: "GRANTED",
        recordedAt: now,
        updatedAt: now,
        source: args.source || "web_portal",
        version: CURRENT_POLICY_VERSION,
        notes: args.notes,
      });
    }

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "CONSENT_GRANTED",
      resourceType: "consentRecords",
      resourceId: consentId.toString(),
      ipAddress: "gateway",
      result: "SUCCESS",
      details: { purpose: args.purpose, policyVersion: CURRENT_POLICY_VERSION },
      timestamp: now,
    });

    return { success: true, consentId, status: "GRANTED" };
  },
});

export const revokeConsent = mutation({
  args: {
    donorId: v.string(),
    purpose: v.union(
      v.literal("DONATION"),
      v.literal("EMERGENCY_CONTACT"),
      v.literal("LOCATION_PROCESSING"),
      v.literal("AI_PROCESSING"),
      v.literal("COMMUNICATION"),
      v.literal("RESEARCH")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const record = await ctx.db
      .query("consentRecords")
      .withIndex("by_donorId", (q) => q.eq("donorId", args.donorId))
      .filter((q) => q.eq(q.field("purpose"), args.purpose))
      .first();

    if (!record) {
      throw new Error(`Consent record for purpose '${args.purpose}' not found.`);
    }

    await ctx.db.patch(record._id, {
      status: "WITHDRAWN",
      updatedAt: now,
      withdrawnAt: now,
      notes: args.reason ? `Revoked: ${args.reason}` : "Revoked by user",
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "CONSENT_REVOKED",
      resourceType: "consentRecords",
      resourceId: record._id.toString(),
      ipAddress: "gateway",
      result: "SUCCESS",
      details: { purpose: args.purpose, reason: args.reason },
      timestamp: now,
    });

    await ctx.db.insert("securityEvents", {
      eventId: `SEC-${now}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventType: "CONSENT_REVOKED",
      actorId: user.clerkId,
      actorRole: user.role,
      resourceType: "consentRecords",
      resourceId: record._id.toString(),
      reason: args.reason || "User exercised right to revoke consent",
      severity: "LOW",
      timestamp: now,
    });

    return { success: true, consentId: record._id, status: "WITHDRAWN" };
  },
});
