import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity } from "./authHelpers";

export const getDonorProfile = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;

    if (!targetUserId) {
      const identity = await getUserIdentity(ctx);
      if (!identity) return null;
      targetUserId = identity.subject;
    }

    return await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId!))
      .first();
  },
});

export const getDonorById = query({
  args: { donorId: v.id("donors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.donorId);
  },
});

export const registerDonor = mutation({
  args: {
    userId: v.string(),
    fullName: v.string(),
    bloodType: v.string(),
    lat: v.number(),
    lng: v.number(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        fullName: args.fullName,
        bloodType: args.bloodType,
        lat: args.lat,
        lng: args.lng,
        address: args.address,
      });
      return existing._id;
    }

    return await ctx.db.insert("donors", {
      userId: args.userId,
      fullName: args.fullName,
      bloodType: args.bloodType,
      donorStatus: "APPROVED",
      isActive: true,
      healthStatus: "FIT",
      lat: args.lat,
      lng: args.lng,
      address: args.address,
      reliabilityScore: 0.5,
      totalRequests: 0,
      acceptedRequests: 0,
      completedDonations: 0,
      noShows: 0,
      avgResponseTimeMinutes: 30,
      pastAcceptanceRate: 0.8,
      createdAt: now,
    });
  },
});

export const updateAvailability = mutation({
  args: { isActive: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!donor) throw new Error("Donor profile not found");

    await ctx.db.patch(donor._id, { isActive: args.isActive });
    return true;
  },
});

export const updateHealthStatus = mutation({
  args: {
    healthStatus: v.union(
      v.literal("FIT"),
      v.literal("UNFIT"),
      v.literal("TEMPORARILY_UNAVAILABLE")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!donor) throw new Error("Donor profile not found");

    await ctx.db.patch(donor._id, { healthStatus: args.healthStatus });
    return true;
  },
});

export const getAllDonors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("donors").collect();
  },
});
