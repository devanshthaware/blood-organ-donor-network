/**
 * Verification Constants, Enums & Policies
 * Connects physical-world identifiers with authoritative digital records.
 */

export const VERIFICATION_ENTITY_TYPES = [
  "BLOOD_UNIT",
  "ORGAN",
  "DONOR",
  "RECIPIENT",
  "TRANSPORT",
  "DOCUMENT",
] as const;

export type VerificationEntityType = (typeof VERIFICATION_ENTITY_TYPES)[number];

export const VERIFICATION_TYPES = [
  "BLOOD_LABEL_VERIFICATION",
  "ORGAN_IDENTIFIER_VERIFICATION",
  "BARCODE_SCAN",
  "DOCUMENT_OCR",
  "PACKAGE_VERIFICATION",
] as const;

export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export const VERIFICATION_STATUSES = [
  "UPLOADED",
  "PROCESSING",
  "EXTRACTED",
  "REVIEW_REQUIRED",
  "VERIFIED",
  "REJECTED",
  "FAILED",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const COMPARISON_OUTCOMES = [
  "MATCH",
  "PARTIAL_MATCH",
  "MISMATCH",
  "REVIEW_REQUIRED",
] as const;

export type ComparisonOutcome = (typeof COMPARISON_OUTCOMES)[number];

export const MISMATCH_SEVERITIES = [
  "INFO",
  "WARNING",
  "CRITICAL",
] as const;

export type MismatchSeverity = (typeof MISMATCH_SEVERITIES)[number];

// Policy Thresholds
export const VERIFICATION_POLICY = {
  version: "1.0.0-PHYSICAL-DIGITAL-INTEGRITY",
  engineName: "VeinLink-Vision-OCR-Engine",
  engineVersion: "1.0.0",
  confidenceThresholds: {
    highConfidence: 0.85,
    mediumConfidence: 0.65,
  },
  qualityThresholds: {
    maxBlurScore: 0.60,
  },
  criticalMismatchFields: [
    "identifier",
    "blood_group",
    "organ_type",
  ],
};
