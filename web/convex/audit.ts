import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getAuditLogs = query({
  args: {
    userId: v.optional(v.string()),
    action: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs;

    if (args.userId) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .collect();
    } else if (args.action) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_action", (q) => q.eq("action", args.action!))
        .order("desc")
        .collect();
    } else {
      logs = await ctx.db
        .query("auditLogs")
        .order("desc")
        .collect();
    }

    if (args.limit) {
      return logs.slice(0, args.limit);
    }

    return logs;
  },
});

export const logAction = internalMutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    ipAddress: v.string(),
    result: v.union(v.literal("SUCCESS"), v.literal("FAILURE"), v.literal("ERROR")),
    details: v.any(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
