import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAlerts = query({
  args: {
    hospitalId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let alerts;

    if (args.hospitalId) {
      alerts = await ctx.db
        .query("alerts")
        .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId!))
        .order("desc")
        .collect();
    } else {
      alerts = await ctx.db
        .query("alerts")
        .order("desc")
        .collect();
    }

    if (args.status) {
      return alerts.filter((a) => a.status === args.status);
    }

    return alerts;
  },
});

export const createAlert = mutation({
  args: {
    hospitalId: v.optional(v.string()),
    hospitalName: v.optional(v.string()),
    type: v.string(),
    severity: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    title: v.string(),
    message: v.string(),
    bloodType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alerts", {
      ...args,
      status: "ACTIVE",
      createdAt: Date.now(),
    });
  },
});

export const resolveAlert = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: "RESOLVED",
      resolvedAt: Date.now(),
    });
    return true;
  },
});
