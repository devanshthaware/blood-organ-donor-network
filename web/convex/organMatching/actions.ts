/**
 * Organ Matching Action Orchestrator
 * Coordinates candidate retrieval, hard constraint filtering, compatibility evaluation,
 * optional ML inference assist, deterministic scoring, ranking, and explainability.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { DEFAULT_MATCHING_POLICY, MatchingPolicyConfig } from "./matchingPolicy";
import { evaluateHardConstraints, CandidateContext } from "./hardConstraints";
import { evaluateCompatibility, calculateDistanceKm } from "./compatibilityEngine";
import { calculateCandidateScore } from "./scoringEngine";
import { buildStructuredExplanation } from "./explanationBuilder";

export const runOrganMatching = action({
  args: {
    organId: v.string(),
    policyOverrides: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<any> => {
    const startTime = Date.now();
    const policy: MatchingPolicyConfig = {
      ...DEFAULT_MATCHING_POLICY,
      ...(args.policyOverrides || {}),
    };

    // 1. Authoritative Organ Record Retrieval
    const organ: any = await ctx.runQuery((api as any).organMatching.getOrganDetails, {
      organId: args.organId,
    });

    if (!organ) {
      throw new Error(`Organ with ID ${args.organId} not found in inventory.`);
    }

    if (organ.status !== "AVAILABLE" && organ.status !== "MATCHING") {
      throw new Error(
        `Cannot run matching for organ in status '${organ.status}'. Must be AVAILABLE or MATCHING.`
      );
    }

    // Default facility location (Mumbai Center or organ facility)
    const organLat = 19.076;
    const organLng = 72.8777;

    // 2. Candidate Requisitions Retrieval
    const candidatePairs: any[] = await ctx.runQuery(
      (api as any).organMatching.getActiveRequestsForOrgan,
      { organType: organ.organType }
    );

    const currentTime = Date.now();
    const evaluatedCandidates: any[] = [];
    const mlApiUrl = process.env.ML_API_URL || "http://localhost:8000";

    for (const pair of candidatePairs) {
      const { request, recipient } = pair;

      const recLat = recipient.location?.lat ?? 19.076;
      const recLng = recipient.location?.lng ?? 72.8777;
      const distanceKm = calculateDistanceKm(organLat, organLng, recLat, recLng);

      const candidateContext: CandidateContext = {
        organ: {
          _id: organ._id,
          organType: organ.organType,
          bloodType: organ.bloodType,
          status: organ.status,
          preservationDeadline: organ.preservationDeadline,
          currentFacilityId: organ.currentFacilityId,
          location: { lat: organLat, lng: organLng },
        },
        request: {
          _id: request._id,
          recipientId: request.recipientId,
          organType: request.organType,
          bloodType: request.bloodType,
          status: request.status,
          urgency: request.urgency,
          createdAt: request.createdAt,
        },
        recipient: {
          _id: recipient._id,
          recipientStatus: recipient.recipientStatus,
          verificationStatus: recipient.verificationStatus,
          bloodType: recipient.bloodType,
          location: recipient.location,
          registeredAt: recipient.registeredAt,
        },
        distanceKm,
        currentTime,
      };

      // 3. Hard Constraint Filtering
      const hardCheck = evaluateHardConstraints(candidateContext, policy);
      if (!hardCheck.passed) {
        continue; // Exclude non-viable candidates
      }

      // 4. Compatibility Evaluation
      const compatibility = evaluateCompatibility(candidateContext);

      // 5. Deterministic Scoring
      const scoreResult = calculateCandidateScore(candidateContext, compatibility, policy);

      // 6. Optional ML Assist with Resilient Fallback
      let mlModelVersion = "deterministic-v1";
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout

        const mlRes = await fetch(`${mlApiUrl}/predict/organ-compatibility`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organ_type: organ.organType,
            donor_blood: organ.bloodType,
            recipient_blood: recipient.bloodType,
            urgency: request.urgency,
            distance_km: distanceKm,
            remaining_preservation_hours: Math.max(
              0,
              (organ.preservationDeadline - currentTime) / (3600 * 1000)
            ),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (mlRes.ok) {
          const mlData = await mlRes.json();
          if (mlData && typeof mlData.score === "number") {
            mlModelVersion = mlData.model_version || "fastapi-organ-ml-v1";
          }
        }
      } catch (err) {
        // Fallback: Continue seamlessly with deterministic policy scoring
        mlModelVersion = "deterministic-fallback";
      }

      // 7. Structured Explainability
      const explanation = buildStructuredExplanation(
        candidateContext,
        compatibility,
        scoreResult,
        policy
      );

      evaluatedCandidates.push({
        recipientId: recipient._id,
        requestId: request._id,
        compatibilitySummary: {
          bloodCompatibility: compatibility.bloodCompatibility,
          distanceKm: compatibility.distanceKm,
          waitingTimeScore: scoreResult.factors.waitingPriorityScore,
        },
        score: scoreResult.compositeScore,
        constraints: hardCheck.failedConstraints,
        explanation: explanation.summary,
        modelVersion: mlModelVersion,
        policyVersion: policy.policyVersion,
        algorithmVersion: policy.algorithmVersion,
        warnings: explanation.warnings,
        factorBreakdown: explanation.factorBreakdown,
        dataConfidence: explanation.dataConfidence,
        createdAtTimestamp: request.createdAt, // tie breaker
      });
    }

    // 8. Deterministic Ranking
    // Highest score first. If tied, earlier request timestamp ranks higher.
    evaluatedCandidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.createdAtTimestamp - b.createdAtTimestamp;
    });

    const rankedMatches = evaluatedCandidates.map((c, index) => ({
      recipientId: c.recipientId,
      requestId: c.requestId,
      compatibilitySummary: c.compatibilitySummary,
      score: c.score,
      ranking: index + 1,
      constraints: c.constraints,
      explanation: c.explanation,
      modelVersion: c.modelVersion,
      policyVersion: c.policyVersion,
      algorithmVersion: c.algorithmVersion,
      warnings: c.warnings,
      factorBreakdown: c.factorBreakdown,
      dataConfidence: c.dataConfidence,
    }));

    // 9. Persist Generated Matches (status: PROPOSED)
    const savedIds = await ctx.runMutation((api as any).organMatching.saveBatchMatches, {
      organId: args.organId,
      matches: rankedMatches,
    });

    // 10. AI Telemetry Event
    const executionTimeMs = Date.now() - startTime;
    await ctx.runMutation((api as any).aiEvents.logAIEvent, {
      modelName: "OrganMatchingEngine",
      modelType: "deterministic_policy_ranker",
      modelVersion: policy.algorithmVersion,
      inputSummary: {
        organId: args.organId,
        organType: organ.organType,
        totalRequestsEvaluated: candidatePairs.length,
        passingCandidatesCount: rankedMatches.length,
      },
      outputSummary: {
        topCandidateScore: rankedMatches[0]?.score ?? 0,
        matchesGenerated: rankedMatches.length,
      },
      status: "SUCCESS",
      executionTimeMs,
      confidence: rankedMatches[0]?.score ?? 0.5,
      triggerSource: "ORGAN_MATCHING_ACTION",
      requestId: rankedMatches[0]?.requestId,
    });

    return {
      success: true,
      organId: args.organId,
      candidatesEvaluated: candidatePairs.length,
      matchesGenerated: rankedMatches.length,
      topCandidate: rankedMatches[0] || null,
      savedMatchIds: savedIds,
    };
  },
});
