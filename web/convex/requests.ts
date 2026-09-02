import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

export const getDonationRequests = query({
  args: {
    hospitalId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let requests;

    if (args.hospitalId) {
      requests = await ctx.db
        .query("donationRequests")
        .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId!))
        .order("desc")
        .collect();
    } else {
      requests = await ctx.db
        .query("donationRequests")
        .order("desc")
        .collect();
    }

    if (args.status) {
      return requests.filter((r) => r.status === args.status);
    }

    return requests;
  },
});

export const getRequestById = query({
  args: { requestId: v.id("donationRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

export const createRequest = mutation({
  args: {
    hospitalId: v.string(),
    hospitalName: v.string(),
    patientId: v.optional(v.string()),
    bloodType: v.string(),
    unitsRequested: v.number(),
    urgency: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    requiredBy: v.optional(v.number()),
    notes: v.optional(v.string()),
    creatorEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const requestId = await ctx.db.insert("donationRequests", {
      hospitalId: args.hospitalId,
      hospitalName: args.hospitalName,
      patientId: args.patientId,
      bloodType: args.bloodType,
      unitsRequested: args.unitsRequested,
      fulfilledUnits: 0,
      urgency: args.urgency,
      status: "PENDING",
      requiredBy: args.requiredBy,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    // Append to Audit Logs
    await ctx.db.insert("auditLogs", {
      userId: args.hospitalId,
      userEmail: args.creatorEmail || "hospital@veinlink.org",
      action: "REQUEST_CREATED",
      resourceType: "donation_requests",
      resourceId: requestId,
      ipAddress: "server",
      timestamp: now,
      result: "SUCCESS",
      details: {
        bloodType: args.bloodType,
        unitsRequested: args.unitsRequested,
        urgency: args.urgency,
      },
    });

    // If Critical, create emergency broadcast alert
    if (args.urgency === "CRITICAL") {
      await ctx.db.insert("alerts", {
        hospitalId: args.hospitalId,
        hospitalName: args.hospitalName,
        type: "EMERGENCY_REQUEST",
        severity: "CRITICAL",
        title: `CRITICAL REQUEST: ${args.bloodType} Needed`,
        message: `${args.hospitalName} urgently requires ${args.unitsRequested} units of ${args.bloodType}.`,
        bloodType: args.bloodType,
        status: "ACTIVE",
        createdAt: now,
      });
    }

    // Trigger async matching action via Convex Scheduler
    await ctx.scheduler.runAfter(0, api.matching.orchestrateRequestMatching, {
      requestId,
      hospitalId: args.hospitalId,
      bloodType: args.bloodType,
      urgency: args.urgency,
      unitsRequested: args.unitsRequested,
    });

    return requestId;
  },
});

export const cancelRequest = mutation({
  args: { requestId: v.id("donationRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    await ctx.db.patch(args.requestId, {
      status: "CANCELLED",
      updatedAt: Date.now(),
    });

    // Cancel pending reservations associated with this request
    const pendingReservations = await ctx.db
      .query("reservations")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .collect();

    for (const res of pendingReservations) {
      await ctx.db.patch(res._id, { status: "EXPIRED" });
    }

    return true;
  },
});

export const updateRequestFulfillment = internalMutation({
  args: {
    requestId: v.id("donationRequests"),
    increment: v.number(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return;

    const newFulfilled = request.fulfilledUnits + args.increment;
    const isCompleted = newFulfilled >= request.unitsRequested;

    await ctx.db.patch(args.requestId, {
      fulfilledUnits: newFulfilled,
      status: isCompleted
        ? "FULFILLED"
        : newFulfilled > 0
        ? "PARTIALLY_FULFILLED"
        : request.status,
      updatedAt: Date.now(),
    });
  },
});
