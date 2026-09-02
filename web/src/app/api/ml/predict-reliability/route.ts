import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { FieldValue } from "firebase-admin/firestore";

const ML_API_URL = process.env.ML_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

function getReliabilityLabel(score: number): string {
  if (score >= 0.8) return "High";
  if (score >= 0.5) return "Medium";
  return "Low";
}

// Helper to log AI events to Firestore
async function logAIEvent(
  donorId: string,
  input: Record<string, any>,
  output: Record<string, any>,
  status: "SUCCESS" | "FAILED",
  executionTimeMs: number,
  errorMessage?: string
) {
  try {
    await adminDb.collection("ai_events").add({
      modelName: "Donor Reliability",
      modelType: "donor_reliability",
      inputSummary: input,
      outputSummary: output,
      status: status,
      createdAt: FieldValue.serverTimestamp(),
      triggerSource: "admin_panel_manual_check",
      entityId: donorId,
      executionTimeMs,
      modelVersion: "1.0.0",
      errorMessage: errorMessage,
      confidence: output.reliability_score || 0
    });
  } catch (err) {
    logger.error("Failed to log AI event", err);
  }
}

/**
 * API route to predict donor reliability in real-time
 * This allows the frontend to fetch fresh reliability predictions
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let userId = "";
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { donorId } = body;

    if (!donorId) {
      return NextResponse.json(
        { error: "donorId is required" },
        { status: 400 }
      );
    }

    // Get donor data
    const donorDoc = await adminDb.collection("donors").doc(donorId).get();
    if (!donorDoc.exists) {
      return NextResponse.json(
        { error: "Donor not found" },
        { status: 404 }
      );
    }

    const donorData = donorDoc.data()!;

    // Check for insufficient data
    // If we have no activity recorded, we can't reliably predict
    const totalRequests = donorData.totalRequests || 0;
    const acceptedRequests = donorData.acceptedRequests || 0;
    const completedDonations = donorData.completedDonations || 0;

    if (totalRequests === 0 && acceptedRequests === 0 && completedDonations === 0) {
      return NextResponse.json({
        reliability_score: 0.5,
        label: "Neutral",
        status: "success",
        is_initial: true
      });
    }

    // Prepare reliability input
    const noShows = donorData.noShows || 0;
    const avgResponseTimeMinutes = donorData.avgResponseTimeMinutes || 60;

    const mlInput = {
      total_requests: Math.max(totalRequests, acceptedRequests, completedDonations),
      accepted_requests: acceptedRequests,
      completed_donations: completedDonations,
      no_shows: noShows,
      avg_response_time_minutes: avgResponseTimeMinutes,
    };

    // Log this action to audit_logs
    try {
      await adminDb.collection("audit_logs").add({
        userId: userId || "unknown", // userId was decoded earlier
        userEmail: "admin@example.com", // In a real app, query user email
        action: "VIEW_DONOR_RELIABILITY",
        resourceType: "donor",
        resourceId: donorId,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        timestamp: FieldValue.serverTimestamp(),
        result: "SUCCESS",
        details: { score_requested: true }
      });
    } catch (e) {
      // Ignore audit write failure
      logger.error("Failed to write audit log", e);
    }

    // Call ML API
    if (!ML_API_URL) {
      logger.warn("ML_API_URL not configured");
      return NextResponse.json({
        reliability_score: null,
        label: "Temporarily Unavailable",
        status: "error"
      });
    }

    const startTime = Date.now();
    let reliability_score = 0.5; // Default fallback base

    // Calculate a rule-based fallback score regardless of ML API success
    // Formula: (Completions / Total * 0.75) + (Accepts / Total * 0.25)
    // We cap it at 0.95 and floor it at 0.1 for donors with at least some activity
    const totalForCalc = Math.max(1, totalRequests, acceptedRequests, completedDonations);
    const calculatedFallback = (
      (completedDonations / totalForCalc) * 0.75 +
      (acceptedRequests / totalForCalc) * 0.25
    );

    // Smooth the fallback (don't let it be 0 if they've done anything)
    const baseReliability = Math.min(0.95, Math.max(0.1, calculatedFallback));

    try {
      if (!ML_API_URL) throw new Error("ML_API_URL not configured");

      const mlResponse = await fetch(`${ML_API_URL}/predict/reliability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mlInput),
      });

      const executionTimeMs = Date.now() - startTime;

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
        await logAIEvent(donorId, mlInput, {}, "FAILED", executionTimeMs, `ML API ${mlResponse.status}: ${errorText}`);
        throw new Error(`ML API returned ${mlResponse.status}`);
      }

      const mlResult = await mlResponse.json();
      const score = mlResult.reliability_score ?? baseReliability;

      const responseData = {
        reliability_score: score,
        label: getReliabilityLabel(score),
        status: "success"
      };

      // Log successful event
      await logAIEvent(donorId, mlInput, responseData, "SUCCESS", executionTimeMs);

      return NextResponse.json(responseData);

    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      logger.error("Error calling ML API for reliability, using fallback", error);

      // Log failed event (if not already logged inside try)
      if (error instanceof Error && !error.message.includes("ML API returned")) {
        const errMsg = error instanceof Error ? error.message : String(error);
        await logAIEvent(donorId, mlInput, { fallback: true }, "FAILED", executionTimeMs, errMsg);
      }

      // Return fallback score instead of error
      return NextResponse.json({
        reliability_score: baseReliability,
        label: getReliabilityLabel(baseReliability),
        status: "success", // Mark as success so UI shows the score
        is_fallback: true
      });
    }
  } catch (error) {
    logger.error("Error predicting reliability", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
