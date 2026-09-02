import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getAIEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("aiEvents")
      .order("desc")
      .collect();

    if (args.limit) {
      return events.slice(0, args.limit);
    }
    return events;
  },
});

export const logAIEvent = internalMutation({
  args: {
    modelName: v.string(),
    modelType: v.string(),
    inputSummary: v.any(),
    outputSummary: v.any(),
    status: v.union(v.literal("SUCCESS"), v.literal("FAILED")),
    executionTimeMs: v.optional(v.number()),
    modelVersion: v.string(),
    confidence: v.optional(v.number()),
    triggerSource: v.optional(v.string()),
    requestId: v.optional(v.string()),
    reservationId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiEvents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
