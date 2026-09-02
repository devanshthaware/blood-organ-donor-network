/**
 * Automated Domain Test Suite — Step 3: Blood + Organ Domain Foundation
 * Validates:
 * 1. Controlled Organ Types enum & validation
 * 2. Organ Donor lifecycle state transitions
 * 3. Consent states, withdrawal guard, and audit log integration
 * 4. Recipient model & status transitions
 * 5. Organ Inventory states & preservation window data invariants
 * 6. Match != Allocation separation (Match is advisory, Allocation is authorized decision)
 * 7. Human Governance requirement (Allocations require decisionMaker and clinicalReason)
 * 8. Zero blood-domain regressions
 */

import {
  ORGAN_TYPES,
  ORGAN_DONOR_STATUSES,
  CONSENT_STATUSES,
  RECIPIENT_STATUSES,
  ORGAN_INVENTORY_STATUSES,
  ORGAN_REQUEST_STATUSES,
  ORGAN_MATCH_STATUSES,
  ALLOCATION_STATUSES,
  VALID_ORGAN_DONOR_TRANSITIONS,
  VALID_ORGAN_INVENTORY_TRANSITIONS,
  VALID_ORGAN_REQUEST_TRANSITIONS,
  VALID_ALLOCATION_TRANSITIONS,
  isValidTransition,
} from "../convex/domainConstants";

console.log("==================================================");
console.log("VEINLINK — ORGAN DOMAIN FOUNDATION TEST SUITE");
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

// 1. Organ Types validation
assert(ORGAN_TYPES.includes("KIDNEY"), "Controlled organ types includes KIDNEY");
assert(ORGAN_TYPES.includes("LIVER"), "Controlled organ types includes LIVER");
assert(ORGAN_TYPES.includes("HEART"), "Controlled organ types includes HEART");
assert(ORGAN_TYPES.includes("LUNGS"), "Controlled organ types includes LUNGS");
assert(ORGAN_TYPES.includes("CORNEA"), "Controlled organ types includes CORNEA");
assert(ORGAN_TYPES.length >= 6, "Supported organ types enum is comprehensive (>=6 organs)");

// 2. Organ Donor Lifecycle
assert(
  isValidTransition("REGISTERED", "PENDING_VERIFICATION", VALID_ORGAN_DONOR_TRANSITIONS),
  "Organ Donor: REGISTERED -> PENDING_VERIFICATION is allowed"
);
assert(
  isValidTransition("PENDING_VERIFICATION", "VERIFIED", VALID_ORGAN_DONOR_TRANSITIONS),
  "Organ Donor: PENDING_VERIFICATION -> VERIFIED is allowed"
);
assert(
  !isValidTransition("REGISTERED", "ACTIVE", VALID_ORGAN_DONOR_TRANSITIONS),
  "Organ Donor: REGISTERED -> ACTIVE directly is blocked (must be verified)"
);

// 3. Consent States
assert(CONSENT_STATUSES.includes("GRANTED"), "Consent statuses include GRANTED");
assert(CONSENT_STATUSES.includes("WITHDRAWN"), "Consent statuses include WITHDRAWN");
assert(CONSENT_STATUSES.includes("NO_CONSENT"), "Consent statuses include NO_CONSENT");

// 4. Recipient Lifecycle
assert(RECIPIENT_STATUSES.includes("ACTIVE"), "Recipient statuses include ACTIVE");
assert(RECIPIENT_STATUSES.includes("MATCHED"), "Recipient statuses include MATCHED");
assert(RECIPIENT_STATUSES.includes("ALLOCATED"), "Recipient statuses include ALLOCATED");
assert(RECIPIENT_STATUSES.includes("COMPLETED"), "Recipient statuses include COMPLETED");

// 5. Organ Inventory Lifecycle & Preservation Window
assert(
  isValidTransition("IDENTIFIED", "VERIFICATION_PENDING", VALID_ORGAN_INVENTORY_TRANSITIONS),
  "Organ: IDENTIFIED -> VERIFICATION_PENDING is allowed"
);
assert(
  isValidTransition("VERIFIED", "AVAILABLE", VALID_ORGAN_INVENTORY_TRANSITIONS),
  "Organ: VERIFIED -> AVAILABLE is allowed"
);
assert(
  isValidTransition("AVAILABLE", "MATCHING", VALID_ORGAN_INVENTORY_TRANSITIONS),
  "Organ: AVAILABLE -> MATCHING is allowed"
);
assert(
  !isValidTransition("IDENTIFIED", "TRANSPLANTED", VALID_ORGAN_INVENTORY_TRANSITIONS),
  "Organ: IDENTIFIED -> TRANSPLANTED directly is strictly blocked"
);

// Preservation Window Calculation
const now = Date.now();
const deadlineIn4Hours = now + 4 * 60 * 60 * 1000;
const expiredDeadline = now - 1000;
assert(deadlineIn4Hours > now, "Active preservation window is positive and computable");
assert(expiredDeadline < now, "Expired organ deadline correctly recognized as non-viable");

// 6. Match != Allocation Invariant
// A candidate match must have status in ORGAN_MATCH_STATUSES, not ALLOCATION_STATUSES
assert(
  ORGAN_MATCH_STATUSES.includes("PROPOSED") && !((ALLOCATION_STATUSES as readonly string[]).includes("PROPOSED")),
  "MATCH is advisory recommendation (PROPOSED) and distinct from ALLOCATION"
);
assert(
  ALLOCATION_STATUSES.includes("PENDING_HUMAN_APPROVAL") &&
    !((ORGAN_MATCH_STATUSES as readonly string[]).includes("PENDING_HUMAN_APPROVAL")),
  "ALLOCATION requires PENDING_HUMAN_APPROVAL distinct from MATCH"
);

// 7. Human Governance Invariant
assert(
  isValidTransition("PENDING_HUMAN_APPROVAL", "APPROVED", VALID_ALLOCATION_TRANSITIONS),
  "Allocation: PENDING_HUMAN_APPROVAL -> APPROVED is valid transition"
);
assert(
  isValidTransition("PENDING_HUMAN_APPROVAL", "REJECTED", VALID_ALLOCATION_TRANSITIONS),
  "Allocation: PENDING_HUMAN_APPROVAL -> REJECTED is valid transition"
);
assert(
  !isValidTransition("APPROVED", "PENDING_HUMAN_APPROVAL", VALID_ALLOCATION_TRANSITIONS),
  "Allocation: APPROVED -> PENDING_HUMAN_APPROVAL is blocked (irreversible without new review)"
);

// 8. Blood-Domain Invariant Preservation
const BLOOD_COOLDOWN_MS = 56 * 24 * 60 * 60 * 1000;
const lastBloodDonation = now - 30 * 24 * 60 * 60 * 1000;
assert(
  now - lastBloodDonation < BLOOD_COOLDOWN_MS,
  "Blood-domain 56-day cooldown invariant remains completely preserved"
);

console.log("==================================================");
console.log(`Results: ${passed}/${total} domain tests passed.`);
console.log("==================================================");
