/**
 * Comparison Engine for Physical-to-Digital Verification
 * Deterministically evaluates extracted OCR values against authoritative Convex records.
 */

import { VERIFICATION_POLICY, ComparisonOutcome, MismatchSeverity } from "./verificationConstants";
import { normalizeFieldValue } from "./normalizationEngine";

export interface MismatchRecord {
  field: string;
  expected: string;
  observed: string;
  severity: MismatchSeverity;
}

export interface VerificationComparisonResult {
  status: ComparisonOutcome;
  confidence: number;
  mismatches: MismatchRecord[];
  matchingFieldsCount: number;
  totalFieldsEvaluated: number;
  explanation: string;
}

export function compareExtractedWithAuthoritative(
  extractedFields: Record<string, any>,
  authoritativeRecord: Record<string, any>,
  ocrConfidence: number = 0.90,
  isImageUsable: boolean = true
): VerificationComparisonResult {
  // Quality Check Gate
  if (!isImageUsable) {
    return {
      status: "REVIEW_REQUIRED",
      confidence: ocrConfidence,
      mismatches: [],
      matchingFieldsCount: 0,
      totalFieldsEvaluated: 0,
      explanation: "Image quality check failed (excessive blur or low resolution). Human review or re-scan required.",
    };
  }

  const mismatches: MismatchRecord[] = [];
  let matchingCount = 0;
  const fieldsToEvaluate = Object.keys(authoritativeRecord);

  for (const field of fieldsToEvaluate) {
    const rawExpected = authoritativeRecord[field];
    const rawObserved = extractedFields[field];

    if (rawObserved === undefined || rawObserved === null || String(rawObserved).trim() === "") {
      mismatches.push({
        field,
        expected: String(rawExpected),
        observed: "MISSING",
        severity: "WARNING",
      });
      continue;
    }

    const normExpected = normalizeFieldValue(field, rawExpected);
    const normObserved = normalizeFieldValue(field, rawObserved);

    if (normExpected === normObserved) {
      matchingCount++;
    } else {
      const isCritical = VERIFICATION_POLICY.criticalMismatchFields.includes(field);
      mismatches.push({
        field,
        expected: normExpected,
        observed: normObserved,
        severity: isCritical ? "CRITICAL" : "WARNING",
      });
    }
  }

  const criticalCount = mismatches.filter((m) => m.severity === "CRITICAL").length;
  let status: ComparisonOutcome = "MATCH";
  let explanation = "";

  if (criticalCount > 0) {
    status = "MISMATCH";
    explanation = `Critical discrepancy detected in ${criticalCount} key field(s). Physical item does not match authoritative digital record.`;
  } else if (ocrConfidence < VERIFICATION_POLICY.confidenceThresholds.mediumConfidence) {
    status = "REVIEW_REQUIRED";
    explanation = "OCR confidence score is below threshold. Manual verification required.";
  } else if (mismatches.length > 0) {
    status = "PARTIAL_MATCH";
    explanation = `Physical label partially matches digital record with ${mismatches.length} non-critical variance(s).`;
  } else {
    status = "MATCH";
    explanation = "All verified fields on the physical label appear consistent with the authoritative digital record.";
  }

  return {
    status,
    confidence: ocrConfidence,
    mismatches,
    matchingFieldsCount: matchingCount,
    totalFieldsEvaluated: fieldsToEvaluate.length,
    explanation,
  };
}
