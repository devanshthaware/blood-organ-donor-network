/**
 * Workflow Receiver & Idempotency Engine
 * Manages incoming workflow callbacks, enforces execution idempotency, and records escalations.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../authHelpers";
import { api } from "../_generated/api";

export const getDomainEventById = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("domainEvents")
      .withIndex("by_correlationId")
      .filter((q) => q.eq(q.field("eventId"), args.eventId))
      .first();
  },
});

export const getAllDomainEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("domainEvents")
      .order("desc")
      .take(args.limit || 50);
  },
});

export const getWorkflowExecutions = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("workflowExecutions")
        .withIndex("by_status", (idx) => idx.eq("status", args.status as any))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("workflowExecutions").order("desc").collect();
  },
});

export const getWorkflowEscalations = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("workflowEscalations")
        .withIndex("by_status", (idx) => idx.eq("status", args.status as any))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("workflowEscalations").order("desc").collect();
  },
});

export const recordWorkflowExecution = mutation({
  args: {
    workflowName: v.string(),
    workflowVersion: v.string(),
    eventId: v.string(),
    correlationId: v.string(),
    status: v.union(
      v.literal("RECEIVED"),
      v.literal("PROCESSING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("RETRYING"),
      v.literal("DEAD_LETTER")
    ),
    error: v.optional(v.string()),
    actionsTaken: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const idempotencyKey = `${args.workflowName}::${args.eventId}`;

    // 1. Check Idempotency Gate
    const existing = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_idempotencyKey", (idx) => idx.eq("idempotencyKey", idempotencyKey))
      .first();

    if (existing) {
      if (existing.status === "COMPLETED") {
        // Strict Idempotency Guard: prevent duplicate execution side-effects
        return {
          success: true,
          executionId: existing.executionId,
          alreadyProcessed: true,
          status: "ALREADY_COMPLETED",
        };
      }

      // Update in-flight or retrying execution
      await ctx.db.patch(existing._id, {
        status: args.status,
        attemptCount: existing.attemptCount + 1,
        lastAttemptAt: now,
        completedAt: args.status === "COMPLETED" ? now : undefined,
        error: args.error,
        actionsTaken: Array.from(new Set([...existing.actionsTaken, ...args.actionsTaken])),
      });

      return {
        success: true,
        executionId: existing.executionId,
        alreadyProcessed: false,
        status: args.status,
      };
    }

    // 2. Insert New Workflow Execution
    const executionId = `EXEC-${now}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await ctx.db.insert("workflowExecutions", {
      executionId,
      workflowName: args.workflowName,
      workflowVersion: args.workflowVersion,
      eventId: args.eventId,
      correlationId: args.correlationId,
      status: args.status,
      attemptCount: 1,
      lastAttemptAt: now,
      completedAt: args.status === "COMPLETED" ? now : undefined,
      error: args.error,
      idempotencyKey,
      actionsTaken: args.actionsTaken,
    });

    return {
      success: true,
      executionId,
      alreadyProcessed: false,
      status: args.status,
    };
  },
});

export const recordWorkflowEscalation = mutation({
  args: {
    workflowName: v.string(),
    severity: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    entityType: v.string(),
    entityId: v.string(),
    reason: v.string(),
    assignedRole: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const escalationId = `ESC-${now}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const id = await ctx.db.insert("workflowEscalations", {
      escalationId,
      workflowName: args.workflowName,
      severity: args.severity,
      entityType: args.entityType,
      entityId: args.entityId,
      reason: args.reason,
      assignedRole: args.assignedRole,
      status: "ACTIVE",
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: "system:n8n",
      userEmail: "n8n-orchestrator@veinlink.internal",
      action: "WORKFLOW_ESCALATION_TRIGGERED",
      resourceType: "workflowEscalations",
      resourceId: id,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        escalationId,
        workflowName: args.workflowName,
        severity: args.severity,
        entityId: args.entityId,
        reason: args.reason,
      },
    });

    return { success: true, escalationId, id };
  },
});

export const acknowledgeEscalation = mutation({
  args: { escalationId: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["hospital", "admin"]);
    const escalation = await ctx.db
      .query("workflowEscalations")
      .filter((q) => q.eq(q.field("escalationId"), args.escalationId))
      .first();

    if (!escalation) throw new Error("Escalation record not found.");

    await ctx.db.patch(escalation._id, {
      status: "ACKNOWLEDGED",
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "WORKFLOW_ESCALATION_ACKNOWLEDGED",
      resourceType: "workflowEscalations",
      resourceId: escalation._id,
      ipAddress: "system",
      timestamp: Date.now(),
      result: "SUCCESS",
      details: { escalationId: args.escalationId },
    });

    return true;
  },
});

export const resolveEscalation = mutation({
  args: { escalationId: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["hospital", "admin"]);
    const escalation = await ctx.db
      .query("workflowEscalations")
      .filter((q) => q.eq(q.field("escalationId"), args.escalationId))
      .first();

    if (!escalation) throw new Error("Escalation record not found.");

    const now = Date.now();
    await ctx.db.patch(escalation._id, {
      status: "RESOLVED",
      resolvedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "WORKFLOW_ESCALATION_RESOLVED",
      resourceType: "workflowEscalations",
      resourceId: escalation._id,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: { escalationId: args.escalationId },
    });

    return true;
  },
});

export const replayDomainEvent = mutation({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["admin"]);
    const event = await ctx.db
      .query("domainEvents")
      .filter((q) => q.eq(q.field("eventId"), args.eventId))
      .first();

    if (!event) throw new Error("Domain event not found for replay.");

    const now = Date.now();
    await ctx.db.patch(event._id, {
      deliveryStatus: "PENDING",
      deliveryAttempts: 0,
      lastDeliveredAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "DOMAIN_EVENT_REPLAY_AUTHORIZED",
      resourceType: "domainEvents",
      resourceId: event._id,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        eventId: args.eventId,
        eventType: event.eventType,
        authorizedBy: user.email,
      },
    });

    // Schedule re-dispatch
    await ctx.scheduler.runAfter(0, (api as any).n8n?.webhookDispatcher?.dispatchEventsToN8nAction, {
      eventId: args.eventId,
    });

    return { success: true, replayedEventId: args.eventId };
  },
});
