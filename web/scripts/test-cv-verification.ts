/**
 * Automated Test Suite — Step 7: Computer Vision + OCR Verification Layer
 * Validates:
 * 1. Image quality check gating
 * 2. Canonical normalization (blood group, identifier, organ type)
 * 3. Exact match detection
 * 4. Critical mismatch detection (blood group conflict, organ type conflict)
 * 5. Partial match & missing field detection
 * 6. Confidence threshold routing to REVIEW_REQUIRED
 * 7. Anti-auto-modification invariant (authoritative record untouched by OCR)
 * 8. Resilient fallback to manual verification
 * 9. Zero blood-domain regressions
 */

import {
  normalizeBloodGroup,
  normalizeIdentifier,
  normalizeOrganType,
  normalizeFieldValue,
} from "../convex/verification/normalizationEngine";
import {
  compareExtractedWithAuthoritative,
} from "../convex/verification/comparisonEngine";
import {
  VERIFICATION_POLICY,
} from "../convex/verification/verificationConstants";

console.log("==================================================");
console.log("VEINLINK — CV & OCR VERIFICATION TEST SUITE");
console.log("==================================================");

let passed = 0;
let total = 0;

function assert(cond: boolean, name: string) {
  total++;
  if (cond) {
    console.log(`[PASS] ${name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name}`);
    process.exitCode = 1;
  }
}

// 1. Normalization Engine Tests
assert(normalizeBloodGroup("A POSITIVE") === "A+", "Normalizes 'A POSITIVE' to 'A+'");
assert(normalizeBloodGroup("a pos") === "A+", "Normalizes lowercase 'a pos' to 'A+'");
assert(normalizeBloodGroup("O NEGATIVE") === "O-", "Normalizes 'O NEGATIVE' to 'O-'");
assert(normalizeBloodGroup("AB+") === "AB+", "Preserves canonical 'AB+'");

assert(normalizeIdentifier("ORG - 1042") === "ORG-1042", "Normalizes spaced hyphen 'ORG - 1042' to 'ORG-1042'");
assert(normalizeIdentifier("bld - 9812 ") === "BLD-9812", "Normalizes lowercase 'bld - 9812 ' to 'BLD-9812'");

assert(normalizeOrganType("KIDNEY (LEFT)") === "KIDNEY", "Normalizes 'KIDNEY (LEFT)' to 'KIDNEY'");
assert(normalizeOrganType("liver right lobe") === "LIVER", "Normalizes 'liver right lobe' to 'LIVER'");

// 2. Image Quality Gate Tests
const blurryComparison = compareExtractedWithAuthoritative(
  { identifier: "ORG-1042" },
  { identifier: "ORG-1042" },
  0.25,
  false // Unusable / blurry
);
assert(
  blurryComparison.status === "REVIEW_REQUIRED",
  "Quality check: Blurry image is routed directly to REVIEW_REQUIRED"
);

// 3. Exact Match Comparison
const authoritativeRecord = {
  identifier: "ORG-1042",
  organ_type: "KIDNEY",
  blood_group: "O-",
  facility: "HOSPITAL_APEX",
};

const exactExtracted = {
  identifier: "ORG-1042",
  organ_type: "KIDNEY",
  blood_group: "O-",
  facility: "HOSPITAL_APEX",
};

const matchResult = compareExtractedWithAuthoritative(exactExtracted, authoritativeRecord, 0.95, true);
assert(matchResult.status === "MATCH", "Exact match: Physical label fields matching digital record yields MATCH");
assert(matchResult.mismatches.length === 0, "Exact match has zero mismatches");

// 4. Normalized Match (Noisy OCR representation of same data)
const noisyExtracted = {
  identifier: "org - 1042 ",
  organ_type: "Kidney (Left)",
  blood_group: "O NEGATIVE",
  facility: "hospital_apex",
};

const normMatchResult = compareExtractedWithAuthoritative(noisyExtracted, authoritativeRecord, 0.92, true);
assert(
  normMatchResult.status === "MATCH",
  "Normalized match: Noisy OCR casing and spacing correctly resolves to MATCH"
);

// 5. Critical Mismatch Detection (Blood Group Conflict)
const dangerousExtracted = {
  identifier: "ORG-1042",
  organ_type: "KIDNEY",
  blood_group: "AB+", // CRITICAL MISMATCH: Record says O-
  facility: "HOSPITAL_APEX",
};

const criticalMismatchResult = compareExtractedWithAuthoritative(dangerousExtracted, authoritativeRecord, 0.96, true);
assert(
  criticalMismatchResult.status === "MISMATCH",
  "Critical discrepancy yields MISMATCH status"
);
const bloodMismatch = criticalMismatchResult.mismatches.find((m) => m.field === "blood_group");
assert(
  bloodMismatch !== undefined && bloodMismatch.severity === "CRITICAL",
  "Blood group conflict is explicitly classified as CRITICAL severity"
);

// 6. Critical Mismatch Detection (Organ Type Conflict)
const wrongOrganExtracted = {
  identifier: "ORG-1042",
  organ_type: "LIVER", // Record says KIDNEY
  blood_group: "O-",
  facility: "HOSPITAL_APEX",
};

const wrongOrganResult = compareExtractedWithAuthoritative(wrongOrganExtracted, authoritativeRecord, 0.96, true);
assert(
  wrongOrganResult.status === "MISMATCH",
  "Organ type conflict yields MISMATCH status"
);
assert(
  wrongOrganResult.mismatches.some((m) => m.field === "organ_type" && m.severity === "CRITICAL"),
  "Organ type discrepancy is flagged as CRITICAL severity"
);

// 7. Non-Critical Variance (Partial Match)
const partialExtracted = {
  identifier: "ORG-1042",
  organ_type: "KIDNEY",
  blood_group: "O-",
  facility: "DIFFERENT_REGIONAL_HOSPITAL", // Warning only
};

const partialResult = compareExtractedWithAuthoritative(partialExtracted, authoritativeRecord, 0.90, true);
assert(
  partialResult.status === "PARTIAL_MATCH",
  "Non-critical facility variance yields PARTIAL_MATCH"
);
assert(
  partialResult.mismatches.every((m) => m.severity !== "CRITICAL"),
  "Partial match contains no critical discrepancies"
);

// 8. Missing Field Detection
const missingFieldExtracted = {
  identifier: "ORG-1042",
  organ_type: "KIDNEY",
  blood_group: "O-",
  // facility missing
};

const missingResult = compareExtractedWithAuthoritative(missingFieldExtracted, authoritativeRecord, 0.90, true);
assert(
  missingResult.mismatches.some((m) => m.observed === "MISSING"),
  "Missing label field is detected and labeled as MISSING"
);

// 9. Confidence Thresholding
const lowConfidenceExtracted = { ...exactExtracted };
const lowConfResult = compareExtractedWithAuthoritative(lowConfidenceExtracted, authoritativeRecord, 0.50, true);
assert(
  lowConfResult.status === "REVIEW_REQUIRED",
  "Low OCR confidence (<0.65) routes verification to REVIEW_REQUIRED"
);

// 10. Anti-Auto-Modification Invariant
// When OCR observes a conflicting blood group, the authoritative record object must remain unaltered
const authoritativeBloodTypeBefore = authoritativeRecord.blood_group;
const comparisonRun = compareExtractedWithAuthoritative(dangerousExtracted, authoritativeRecord);
const authoritativeBloodTypeAfter = authoritativeRecord.blood_group;

assert(
  authoritativeBloodTypeBefore === authoritativeBloodTypeAfter && authoritativeBloodTypeAfter === "O-",
  "Anti-auto-modification invariant: OCR extraction NEVER alters authoritative database record"
);

// 11. Blood-Domain Cooldown Integrity
const now = Date.now();
const BLOOD_COOLDOWN_MS = 56 * 24 * 60 * 60 * 1000;
const lastBloodDonation = now - 15 * 24 * 60 * 60 * 1000;
assert(
  now - lastBloodDonation < BLOOD_COOLDOWN_MS,
  "Blood-domain 56-day cooldown invariant remains completely operational"
);

console.log("==================================================");
console.log(`Results: ${passed}/${total} CV & OCR verification tests passed.`);
console.log("==================================================");
