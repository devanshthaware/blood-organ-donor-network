import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity } from "./authHelpers";

export const getReservations = query({
  args: {
    donorId: v.optional(v.string()),
    hospitalId: v.optional(v.string()),
    requestId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let reservations;

    if (args.donorId) {
      reservations = await ctx.db
        .query("reservations")
        .withIndex("by_donorId", (q) => q.eq("donorId", args.donorId!))
        .order("desc")
        .collect();
    } else if (args.hospitalId) {
      reservations = await ctx.db
        .query("reservations")
        .withIndex("by_hospitalId", (q) => q.eq("hospitalId", args.hospitalId!))
        .order("desc")
        .collect();
    } else if (args.requestId) {
      reservations = await ctx.db
        .query("reservations")
        .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId!))
        .order("desc")
        .collect();
    } else {
      reservations = await ctx.db
        .query("reservations")
        .order("desc")
        .collect();
    }

    if (args.status) {
      return reservations.filter((r) => r.status === args.status);
    }

    return reservations;
  },
});

export const acceptReservation = mutation({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) throw new Error("Reservation not found");
    if (reservation.status !== "PENDING") {
      throw new Error(`Cannot accept reservation in ${reservation.status} state`);
    }

    const now = Date.now();

    // 1. Update reservation to ACCEPTED
    await ctx.db.patch(args.reservationId, {
      status: "ACCEPTED",
      respondedAt: now,
    });

    // 2. Increment fulfilledUnits on donationRequests
    const request = await ctx.db.get(reservation.requestId as any);
    if (request) {
      const newFulfilled = (request as any).fulfilledUnits + 1;
      const isComplete = newFulfilled >= (request as any).unitsRequested;

      await ctx.db.patch(request._id, {
        fulfilledUnits: newFulfilled,
        status: isComplete ? "FULFILLED" : "PARTIALLY_FULFILLED",
        updatedAt: now,
      });
    }

    // 3. Update donor reliability metrics
    const donor = await ctx.db.get(reservation.donorId as any);
    if (donor) {
      const d = donor as any;
      const accepted = d.acceptedRequests + 1;
      const total = d.totalRequests || 1;
      const pastRate = Math.min(1, accepted / total);
      const newReliability = Math.min(1, d.reliabilityScore + 0.05);

      await ctx.db.patch(donor._id, {
        acceptedRequests: accepted,
        pastAcceptanceRate: pastRate,
        reliabilityScore: Number(newReliability.toFixed(2)),
      });
    }

    // 4. Log Audit
    await ctx.db.insert("auditLogs", {
      userId: reservation.donorId,
      userEmail: "donor@veinlink.org",
      action: "RESERVATION_ACCEPTED",
      resourceType: "reservations",
      resourceId: args.reservationId,
      ipAddress: "client",
      timestamp: now,
      result: "SUCCESS",
      details: {
        requestId: reservation.requestId,
        hospitalId: reservation.hospitalId,
      },
    });

    return true;
  },
});

export const declineReservation = mutation({
  args: {
    reservationId: v.id("reservations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) throw new Error("Reservation not found");
    if (reservation.status !== "PENDING") {
      throw new Error(`Cannot decline reservation in ${reservation.status} state`);
    }

    const now = Date.now();

    await ctx.db.patch(args.reservationId, {
      status: "DECLINED",
      respondedAt: now,
    });

    // Log Audit
    await ctx.db.insert("auditLogs", {
      userId: reservation.donorId,
      userEmail: "donor@veinlink.org",
      action: "RESERVATION_DECLINED",
      resourceType: "reservations",
      resourceId: args.reservationId,
      ipAddress: "client",
      timestamp: now,
      result: "SUCCESS",
      details: {
        reason: args.reason || "Declined by donor",
      },
    });

    return true;
  },
});

export const completeReservation = mutation({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) throw new Error("Reservation not found");

    const now = Date.now();

    await ctx.db.patch(args.reservationId, {
      status: "COMPLETED",
      completedAt: now,
    });

    // Update donor: completed donations count & set lastDonationDate (starts 56-day cooldown)
    const donor = await ctx.db.get(reservation.donorId as any);
    if (donor) {
      const d = donor as any;
      await ctx.db.patch(donor._id, {
        completedDonations: d.completedDonations + 1,
        lastDonationDate: now,
        reliabilityScore: Math.min(1, Number((d.reliabilityScore + 0.1).toFixed(2))),
      });
    }

    // Increment blood inventory
    const existingStock = await ctx.db
      .query("bloodInventory")
      .withIndex("by_hospital_bloodType", (q: any) =>
        q.eq("hospitalId", reservation.hospitalId).eq("bloodType", reservation.bloodType)
      )
      .first();

    if (existingStock) {
      await ctx.db.patch(existingStock._id, {
        unitsAvailable: existingStock.unitsAvailable + 1,
        updatedAt: now,
      });
    }

    // Log Audit
    await ctx.db.insert("auditLogs", {
      userId: reservation.hospitalId,
      userEmail: "hospital@veinlink.org",
      action: "DONATION_COMPLETED",
      resourceType: "reservations",
      resourceId: args.reservationId,
      ipAddress: "hospital",
      timestamp: now,
      result: "SUCCESS",
      details: {
        donorId: reservation.donorId,
        bloodType: reservation.bloodType,
      },
    });

    return true;
  },
});

export const createBatchReservations = internalMutation({
  args: {
    reservations: v.array(
      v.object({
        requestId: v.string(),
        donorId: v.string(),
        donorName: v.optional(v.string()),
        hospitalId: v.string(),
        hospitalName: v.optional(v.string()),
        bloodType: v.string(),
        urgency: v.string(),
        matchScore: v.number(),
        availabilityScore: v.number(),
        reliabilityScore: v.number(),
        distanceKm: v.number(),
        aiExplanation: v.optional(
          v.object({
            source: v.string(),
            title: v.string(),
            summary: v.string(),
            bullets: v.array(v.string()),
            confidence: v.string(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdIds = [];

    for (const res of args.reservations) {
      // Check if reservation already exists for this donor & request
      const existing = await ctx.db
        .query("reservations")
        .withIndex("by_donorId", (q) => q.eq("donorId", res.donorId))
        .filter((q) => q.eq(q.field("requestId"), res.requestId))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("reservations", {
          ...res,
          status: "PENDING",
          createdAt: now,
        });
        createdIds.push(id);

        // Increment totalRequests on donor profile
        const donor = await ctx.db.get(res.donorId as any);
        if (donor) {
          await ctx.db.patch(donor._id, {
            totalRequests: ((donor as any).totalRequests || 0) + 1,
          });
        }
      }
    }

    return createdIds;
  },
});
