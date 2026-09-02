import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCheckupRequests = query({
  args: {
    hospitalId: v.optional(v.string()),
    donorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.hospitalId) {
      return await ctx.db
        .query("checkupRequests")
        .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId!))
        .order("desc")
        .collect();
    } else if (args.donorId) {
      return await ctx.db
        .query("checkupRequests")
        .withIndex("by_donorId", (q) => q.eq("donorId", args.donorId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("checkupRequests").order("desc").collect();
  },
});

export const createCheckupRequest = mutation({
  args: {
    hospitalId: v.string(),
    hospitalName: v.optional(v.string()),
    donorId: v.string(),
    donorName: v.optional(v.string()),
    date: v.string(),
    timeSlot: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("checkupRequests", {
      ...args,
      status: "PENDING",
      createdAt: Date.now(),
    });
  },
});

export const updateCheckupStatus = mutation({
  args: {
    checkupId: v.id("checkupRequests"),
    status: v.union(v.literal("PENDING"), v.literal("CONFIRMED"), v.literal("COMPLETED"), v.literal("CANCELLED")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.checkupId, { status: args.status });
    return true;
  },
});

export const approveDonorCheckup = mutation({
  args: {
    checkupId: v.id("checkupRequests"),
    donorId: v.string(),
    bloodType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.checkupId, { status: "COMPLETED" });

    // Update donor record
    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", args.donorId))
      .first();

    if (donor) {
      await ctx.db.patch(donor._id, {
        bloodType: args.bloodType,
        donorStatus: "APPROVED",
        isActive: true,
        healthStatus: "FIT",
      });
    }

    return true;
  },
});

export const rejectDonorCheckup = mutation({
  args: {
    checkupId: v.id("checkupRequests"),
    donorId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.checkupId, { status: "CANCELLED" });

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", args.donorId))
      .first();

    if (donor) {
      await ctx.db.patch(donor._id, {
        donorStatus: "REJECTED",
        isActive: false,
      });
    }

    return true;
  },
});
