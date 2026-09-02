import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity } from "./authHelpers";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    role: v.union(v.literal("donor"), v.literal("hospital"), v.literal("admin")),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        fullName: args.fullName,
        email: args.email,
        role: args.role,
        phoneNumber: args.phoneNumber,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      fullName: args.fullName,
      role: args.role,
      phoneNumber: args.phoneNumber,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User record not found");

    await ctx.db.patch(user._id, {
      ...(args.fullName && { fullName: args.fullName }),
      ...(args.phoneNumber && { phoneNumber: args.phoneNumber }),
      updatedAt: Date.now(),
    });

    return true;
  },
});
