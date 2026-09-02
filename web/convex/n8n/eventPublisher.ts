/**
 * Event Publisher Service
 * Provides transactional persistence and dispatch of domain events to n8n.
 */

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { validateEventEnvelope, VeinLinkDomainEvent } from "./eventContract";

export const publishDomainEvent = mutation({
  args: {
    eventType: v.string(),
    aggregateType: v.string(),
    aggregateId: v.string(),
    payload: v.any(),
    actorType: v.optional(v.string()),
    actorId: v.optional(v.string()),
    correlationId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const eventId = `EVT-${now}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const correlationId = args.correlationId || `CORR-${now}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const eventRecord: VeinLinkDomainEvent = {
      eventId,
      eventType: args.eventType,
      version: "1.0.0",
      occurredAt: now,
      actor: {
        type: (args.actorType as any) || "system",
        id: args.actorId,
      },
      source: {
        system: "convex",
        service: "veinlink-core",
      },
      aggregate: {
        type: args.aggregateType as any,
        id: args.aggregateId,
      },
      correlationId,
      payload: args.payload,
      metadata: {
        ...args.metadata,
        environment: (process.env.NODE_ENV as any) || "development",
      },
    };

    const validation = validateEventEnvelope(eventRecord);
    if (!validation.isValid) {
      throw new Error(`Invalid Event Envelope: ${validation.error}`);
    }

    const insertedId = await ctx.db.insert("domainEvents", {
      ...eventRecord,
      deliveryStatus: "PENDING",
      deliveryAttempts: 0,
    });

    // Schedule immediate asynchronous webhook dispatch action
    await ctx.scheduler.runAfter(0, (api as any).n8n?.webhookDispatcher?.dispatchEventsToN8nAction, {
      eventId,
    });

    return {
      success: true,
      eventId,
      correlationId,
      insertedId,
    };
  },
});

export const updateEventDeliveryStatus = internalMutation({
  args: {
    eventId: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("DELIVERED"),
      v.literal("FAILED"),
      v.literal("DEAD_LETTER")
    ),
    attempts: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("domainEvents")
      .withIndex("by_correlationId")
      .filter((q) => q.eq(q.field("eventId"), args.eventId))
      .first();

    if (event) {
      await ctx.db.patch(event._id, {
        deliveryStatus: args.status,
        deliveryAttempts: args.attempts,
        lastDeliveredAt: Date.now(),
      });
    }
  },
});
