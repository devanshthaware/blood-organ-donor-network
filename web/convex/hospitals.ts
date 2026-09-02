import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity } from "./authHelpers";

export const getHospitalProfile = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;

    if (!targetUserId) {
      const identity = await getUserIdentity(ctx);
      if (!identity) return null;
      targetUserId = identity.subject;
    }

    return await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId!))
      .first();
  },
});

export const getHospitalById = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.hospitalId);
  },
});

export const getAllHospitals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("hospitals").collect();
  },
});

export const registerHospital = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    address: v.string(),
    region: v.number(),
    lat: v.number(),
    lng: v.number(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    licenseNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        address: args.address,
        region: args.region,
        lat: args.lat,
        lng: args.lng,
        contactEmail: args.contactEmail,
        contactPhone: args.contactPhone,
        licenseNumber: args.licenseNumber,
      });
      return existing._id;
    }

    return await ctx.db.insert("hospitals", {
      userId: args.userId,
      name: args.name,
      address: args.address,
      region: args.region,
      lat: args.lat,
      lng: args.lng,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      licenseNumber: args.licenseNumber,
      isActive: true,
      createdAt: now,
    });
  },
});

export const updateHospitalProfile = mutation({
  args: {
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!hospital) throw new Error("Hospital profile not found");

    await ctx.db.patch(hospital._id, {
      ...(args.name && { name: args.name }),
      ...(args.address && { address: args.address }),
      ...(args.contactPhone && { contactPhone: args.contactPhone }),
      ...(args.contactEmail && { contactEmail: args.contactEmail }),
    });

    return true;
  },
});

export const updateHospitalStatus = mutation({
  args: {
    hospitalId: v.id("hospitals"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.hospitalId, {
      isActive: args.isActive,
    });
    return true;
  },
});
