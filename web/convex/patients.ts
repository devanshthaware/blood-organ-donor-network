import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPatients = query({
  args: { hospitalId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.hospitalId) {
      return await ctx.db
        .query("patients")
        .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("patients").order("desc").collect();
  },
});

export const createPatient = mutation({
  args: {
    hospitalId: v.string(),
    name: v.string(),
    age: v.number(),
    bloodType: v.string(),
    condition: v.string(),
    urgency: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("patients", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const deletePatient = mutation({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.patientId);
    return true;
  },
});
