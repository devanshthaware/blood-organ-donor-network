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
