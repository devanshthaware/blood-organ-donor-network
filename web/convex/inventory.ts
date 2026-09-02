import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBloodInventory = query({
  args: { hospitalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.hospitalId) {
      return await ctx.db
        .query("bloodInventory")
        .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId!))
        .collect();
    }
    return await ctx.db.query("bloodInventory").collect();
  },
});

export const updateStock = mutation({
  args: {
    hospitalId: v.string(),
    bloodType: v.string(),
    unitsAvailable: v.number(),
    minimumThreshold: v.optional(v.number()),
    optimalThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bloodInventory")
      .withIndex("by_hospital_bloodType", (q: any) =>
        q.eq("hospitalId", args.hospitalId).eq("bloodType", args.bloodType)
      )
      .first();

    const minThreshold = args.minimumThreshold ?? existing?.minimumThreshold ?? 10;
    const optThreshold = args.optimalThreshold ?? existing?.optimalThreshold ?? 25;
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        unitsAvailable: args.unitsAvailable,
        minimumThreshold: minThreshold,
        optimalThreshold: optThreshold,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("bloodInventory", {
        hospitalId: args.hospitalId,
        bloodType: args.bloodType,
        unitsAvailable: args.unitsAvailable,
        minimumThreshold: minThreshold,
        optimalThreshold: optThreshold,
        updatedAt: now,
      });
    }

    // Auto-generate Shortage Alert if units are below minimum threshold
    if (args.unitsAvailable < minThreshold) {
      // Check for active alert to avoid spamming
      const activeAlert = await ctx.db
        .query("alerts")
        .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId))
        .filter((q) =>
          q.and(
            q.eq(q.field("bloodType"), args.bloodType),
            q.eq(q.field("status"), "ACTIVE")
          )
        )
        .first();

      if (!activeAlert) {
        await ctx.db.insert("alerts", {
          hospitalId: args.hospitalId,
          type: "SHORTAGE",
          severity: args.unitsAvailable <= minThreshold / 2 ? "CRITICAL" : "HIGH",
          title: `Critical Shortage: ${args.bloodType}`,
          message: `Blood stock for ${args.bloodType} dropped to ${args.unitsAvailable} units (threshold: ${minThreshold}).`,
          bloodType: args.bloodType,
          status: "ACTIVE",
          createdAt: now,
        });
      }
    }

    return true;
  },
});
