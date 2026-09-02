import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./authHelpers";
import { ORGAN_MATCH_STATUSES, OrganMatchStatus } from "./domainConstants";

export const getMatchesByRequest = query({
  args: { requestId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organMatches")
      .withIndex("by_requestId", (idx) => idx.eq("requestId", args.requestId))
      .order("desc")
      .collect();
  },
});

export const getMatchesByOrgan = query({
  args: { organId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organMatches")
      .withIndex("by_organId", (idx) => idx.eq("organId", args.organId))
      .order("desc")
      .collect();
  },
});

/**
 * Creates a candidate recommendation match.
 * NOTE: This is strictly an informational recommendation and does NOT assign the organ.
 */
export const createCandidateMatch = mutation({
  args: {
    organId: v.string(),
    recipientId: v.string(),
    requestId: v.string(),
    bloodCompatibility: v.boolean(),
    distanceKm: v.number(),
    waitingTimeScore: v.optional(v.number()),
    score: v.number(),
    ranking: v.number(),
    constraints: v.array(v.string()),
    explanation: v.string(),
    modelVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const matchId = await ctx.db.insert("organMatches", {
      organId: args.organId,
      recipientId: args.recipientId,
      requestId: args.requestId,
      compatibilitySummary: {
        bloodCompatibility: args.bloodCompatibility,
        distanceKm: args.distanceKm,
        waitingTimeScore: args.waitingTimeScore,
      },
      score: args.score,
      ranking: args.ranking,
      constraints: args.constraints,
      explanation: args.explanation,
      modelVersion: args.modelVersion,
      status: "PROPOSED",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "CANDIDATE_MATCH_GENERATED",
      resourceType: "organMatches",
      resourceId: matchId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organId: args.organId,
        recipientId: args.recipientId,
        score: args.score,
        ranking: args.ranking,
      },
    });

    return matchId;
  },
});

export const getOrganDetails = query({
  args: { organId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organInventory")
      .filter((q) => q.eq(q.field("_id"), args.organId as any))
      .first();
  },
});

export const getActiveRequestsForOrgan = query({
  args: { organType: v.string() },
  handler: async (ctx, args) => {
    // 1. Fetch requests matching organ type
    const requests = await ctx.db
      .query("organRequests")
      .withIndex("by_organType", (idx) => idx.eq("organType", args.organType))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "ACTIVE"),
          q.eq(q.field("status"), "MATCHING"),
          q.eq(q.field("status"), "CREATED")
        )
      )
      .collect();

    // 2. Fetch associated recipients and hospital/centers
    const candidates = [];
    for (const req of requests) {
      const recipient = await ctx.db
        .query("recipients")
        .filter((q) => q.eq(q.field("_id"), req.recipientId as any))
        .first();

      if (recipient) {
        candidates.push({
          request: req,
          recipient,
        });
      }
    }

    return candidates;
  },
});

export const saveBatchMatches = mutation({
  args: {
    organId: v.string(),
    matches: v.array(
      v.object({
        recipientId: v.string(),
        requestId: v.string(),
        compatibilitySummary: v.object({
          bloodCompatibility: v.boolean(),
          distanceKm: v.number(),
          waitingTimeScore: v.optional(v.number()),
        }),
        score: v.number(),
        ranking: v.number(),
        constraints: v.array(v.string()),
        explanation: v.string(),
        modelVersion: v.string(),
        policyVersion: v.string(),
        algorithmVersion: v.string(),
        warnings: v.array(v.string()),
        factorBreakdown: v.any(),
        dataConfidence: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    // 1. Mark previous PROPOSED matches for this organ as SUPERSEDED
    const existingMatches = await ctx.db
      .query("organMatches")
      .withIndex("by_organId", (idx) => idx.eq("organId", args.organId))
      .filter((q) => q.eq(q.field("status"), "PROPOSED"))
      .collect();

    for (const em of existingMatches) {
      await ctx.db.patch(em._id, {
        status: "SUPERSEDED",
        updatedAt: now,
      });
    }

    // 2. Insert new ranked matches
    const insertedIds = [];
    for (const m of args.matches) {
      const id = await ctx.db.insert("organMatches", {
        organId: args.organId,
        recipientId: m.recipientId,
        requestId: m.requestId,
        compatibilitySummary: m.compatibilitySummary,
        score: m.score,
        ranking: m.ranking,
        constraints: m.constraints,
        explanation: m.explanation,
        modelVersion: m.modelVersion,
        policyVersion: m.policyVersion,
        algorithmVersion: m.algorithmVersion,
        warnings: m.warnings,
        factorBreakdown: m.factorBreakdown,
        dataConfidence: m.dataConfidence,
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now,
      });
      insertedIds.push(id);
    }

    // 3. Record audit event
    await ctx.db.insert("auditLogs", {
      userId: user.clerkId,
      userEmail: user.email,
      action: "ORGAN_MATCHING_EVALUATED",
      resourceType: "organMatches",
      resourceId: args.organId,
      ipAddress: "system",
      timestamp: now,
      result: "SUCCESS",
      details: {
        organId: args.organId,
        candidatesEvaluated: args.matches.length,
        topScore: args.matches[0]?.score ?? 0,
      },
    });

    return insertedIds;
  },
});

