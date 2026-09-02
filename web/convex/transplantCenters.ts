import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./authHelpers";

export const getAllCenters = query({
  args: { region: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (args.region !== undefined) {
      return await ctx.db
        .query("transplantCenters")
        .withIndex("by_region", (idx) => idx.eq("region", args.region!))
        .collect();
    }
    return await ctx.db.query("transplantCenters").collect();
  },
});

export const getCenterById = query({
  args: { centerId: v.id("transplantCenters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.centerId);
  },
});

export const registerCenter = mutation({
  args: {
    name: v.string(),
    hospitalId: v.string(),
    address: v.string(),
    region: v.number(),
    lat: v.number(),
    lng: v.number(),
    accreditationCode: v.string(),
    supportedOrgans: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const centerId = await ctx.db.insert("transplantCenters", {
      name: args.name,
      hospitalId: args.hospitalId,
      address: args.address,
      region: args.region,
      lat: args.lat,
      lng: args.lng,
      accreditationCode: args.accreditationCode,
      supportedOrgans: args.supportedOrgans,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "TRANSPLANT_CENTER_REGISTERED",
      resourceType: "transplantCenters",
      resourceId: centerId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        name: args.name,
        accreditationCode: args.accreditationCode,
        supportedOrgans: args.supportedOrgans,
      },
    });

    return centerId;
  },
});
