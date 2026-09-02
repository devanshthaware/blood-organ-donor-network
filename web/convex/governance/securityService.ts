/**
 * Security Management Service (Queries & Mutations)
 * Powers the Admin Security Operations Center (/admin/security).
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../authHelpers";

export const getSecurityMetrics = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("securityEvents").collect();
    const users = await ctx.db.query("users").collect();

    const accessDenials = events.filter((e) => e.eventType === "ACCESS_DENIED").length;
    const authFailures = events.filter((e) => e.eventType === "AUTH_FAILURE").length;
    const rateLimitViolations = events.filter((e) => e.eventType === "RATE_LIMIT_EXCEEDED").length;
    const activeSuspensions = users.filter((u: any) => u.status === "SUSPENDED").length;

    return {
      totalSecurityEvents: events.length,
      accessDenials,
      authFailures,
      rateLimitViolations,
      activeSuspensions,
      criticalIncidents: events.filter((e) => e.severity === "CRITICAL").length,
    };
  },
});

export const getAllSecurityEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("securityEvents")
      .order("desc")
      .take(args.limit || 50);
  },
});

export const suspendAccount = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["admin"]);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Target user not found");

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      status: "SUSPENDED",
    });

    const eventId = `SEC-${now}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await ctx.db.insert("securityEvents", {
      eventId,
      eventType: "ACCOUNT_SUSPENDED",
      actorId: admin.clerkId,
      actorRole: admin.role,
      resourceType: "users",
      resourceId: args.userId,
      reason: args.reason,
      severity: "HIGH",
      timestamp: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: admin.clerkId,
      userEmail: admin.email,
      action: "ACCOUNT_SUSPENDED",
      resourceType: "users",
      resourceId: args.userId,
      ipAddress: "gateway",
      result: "SUCCESS",
      details: { targetEmail: target.email, reason: args.reason },
      timestamp: now,
    });

    return { success: true, status: "SUSPENDED" };
  },
});

export const restoreAccount = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["admin"]);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Target user not found");

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      status: "ACTIVE",
    });

    const eventId = `SEC-${now}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await ctx.db.insert("securityEvents", {
      eventId,
      eventType: "ACCOUNT_RESTORED",
      actorId: admin.clerkId,
      actorRole: admin.role,
      resourceType: "users",
      resourceId: args.userId,
      reason: "Administrative account reactivation",
      severity: "LOW",
      timestamp: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: admin.clerkId,
      userEmail: admin.email,
      action: "ACCOUNT_RESTORED",
      resourceType: "users",
      resourceId: args.userId,
      ipAddress: "gateway",
      result: "SUCCESS",
      details: { targetEmail: target.email },
      timestamp: now,
    });

    return { success: true, status: "ACTIVE" };
  },
});
