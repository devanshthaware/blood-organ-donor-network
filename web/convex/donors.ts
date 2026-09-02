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
    bloodType: v.string(), // Self-reported during registration
    lat: v.number(),
    lng: v.number(),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      const updates: any = {
        fullName: args.fullName,
        lat: args.lat,
        lng: args.lng,
        address: args.address,
        dateOfBirth: args.dateOfBirth || existing.dateOfBirth,
        contactNumber: args.contactNumber || existing.contactNumber,
      };

      // If not yet verified by a hospital, allow updating self-reported blood group
      if (existing.verificationStatus !== "VERIFIED") {
        updates.selfReportedBloodGroup = args.bloodType;
        updates.bloodType = args.bloodType;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    const donorId = await ctx.db.insert("donors", {
      userId: args.userId,
      fullName: args.fullName,
      bloodType: args.bloodType,
      selfReportedBloodGroup: args.bloodType,
      verificationStatus: "UNVERIFIED",
      donorStatus: "PENDING",
      isActive: true,
      healthStatus: "FIT",
      lat: args.lat,
      lng: args.lng,
      address: args.address,
      dateOfBirth: args.dateOfBirth,
      contactNumber: args.contactNumber,
      reliabilityScore: 0.5,
      totalRequests: 0,
      acceptedRequests: 0,
      completedDonations: 0,
      noShows: 0,
      avgResponseTimeMinutes: 30,
      pastAcceptanceRate: 0.8,
      createdAt: now,
    });

    // Generate initial registration notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      userRole: "donor",
      title: "Welcome to VeinLink!",
      message: "Your donor profile has been created. Visit a registered nearby hospital to complete your clinical verification.",
      type: "VERIFICATION_REQUIRED",
      relatedEntityId: donorId,
      relatedEntityType: "donors",
      isRead: false,
      createdAt: now,
    });

    return donorId;
  },
});

export const updateDonorProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    address: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    selfReportedBloodGroup: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    let donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (!donor) {
      const donorName = args.fullName || identity.name || (identity.email ? identity.email.split("@")[0] : "Donor");
      const blood = args.selfReportedBloodGroup || "O+";
      const donorId = await ctx.db.insert("donors", {
        userId: identity.subject,
        fullName: donorName,
        bloodType: blood,
        selfReportedBloodGroup: blood,
        verificationStatus: "UNVERIFIED",
        donorStatus: "PENDING",
        isActive: args.isActive ?? true,
        healthStatus: "FIT",
        lat: 18.5204,
        lng: 73.8567,
        address: args.address,
        dateOfBirth: args.dateOfBirth,
        contactNumber: args.contactNumber,
        reliabilityScore: 0.5,
        totalRequests: 0,
        acceptedRequests: 0,
        completedDonations: 0,
        noShows: 0,
        avgResponseTimeMinutes: 30,
        pastAcceptanceRate: 0.8,
        createdAt: now,
      });
      return true;
    }

    const updates: any = {};
    if (args.fullName !== undefined) updates.fullName = args.fullName;
    if (args.address !== undefined) updates.address = args.address;
    if (args.contactNumber !== undefined) updates.contactNumber = args.contactNumber;
    if (args.dateOfBirth !== undefined) updates.dateOfBirth = args.dateOfBirth;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    // Security Gate: Donor cannot modify selfReportedBloodGroup once officially verified
    if (args.selfReportedBloodGroup !== undefined) {
      if (donor.verificationStatus === "VERIFIED") {
        throw new Error("Security Violation: Medically verified blood group is locked and cannot be modified by donors.");
      }
      updates.selfReportedBloodGroup = args.selfReportedBloodGroup;
      updates.bloodType = args.selfReportedBloodGroup;
    }

    await ctx.db.patch(donor._id, updates);
    return true;
  },
});

export const updateAvailability = mutation({
  args: { isActive: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    let donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (!donor) {
      const donorName = identity.name || (identity.email ? identity.email.split("@")[0] : "Donor");
      await ctx.db.insert("donors", {
        userId: identity.subject,
        fullName: donorName,
        bloodType: "O+",
        selfReportedBloodGroup: "O+",
        verificationStatus: "UNVERIFIED",
        donorStatus: "PENDING",
        isActive: args.isActive,
        healthStatus: "FIT",
        lat: 18.5204,
        lng: 73.8567,
        reliabilityScore: 0.5,
        totalRequests: 0,
        acceptedRequests: 0,
        completedDonations: 0,
        noShows: 0,
        avgResponseTimeMinutes: 30,
        pastAcceptanceRate: 0.8,
        createdAt: now,
      });
      return true;
    }

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

    let donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (!donor) {
      const donorName = identity.name || (identity.email ? identity.email.split("@")[0] : "Donor");
      await ctx.db.insert("donors", {
        userId: identity.subject,
        fullName: donorName,
        bloodType: "O+",
        selfReportedBloodGroup: "O+",
        verificationStatus: "UNVERIFIED",
        donorStatus: "PENDING",
        isActive: true,
        healthStatus: args.healthStatus,
        lat: 18.5204,
        lng: 73.8567,
        reliabilityScore: 0.5,
        totalRequests: 0,
        acceptedRequests: 0,
        completedDonations: 0,
        noShows: 0,
        avgResponseTimeMinutes: 30,
        pastAcceptanceRate: 0.8,
        createdAt: now,
      });
      return true;
    }

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
