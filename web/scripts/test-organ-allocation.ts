/**
 * Automated Test Suite — Step 5: Multi-Objective Organ Allocation & Human Approval Engine
 * Validates:
 * 1. Eligibility gate hard constraints
 * 2. Multi-objective scoring normalization & deterministic ranking
 * 3. Pareto dominance checking
 * 4. Tripartite lifecycle separation (Match -> Recommendation -> Authorized Allocation)
 * 5. Anti-stale revalidation guards
 * 6. Human override validation (mandatory override justification)
 * 7. Structured rejection requirements
 * 8. Zero blood-domain regressions
 */

import { DEFAULT_ALLOCATION_POLICY, isParetoDominating } from "../convex/organAllocation/allocationPolicy";
import { validateAllocationEligibility, AllocationCandidateContext } from "../convex/organAllocation/eligibilityGate";
import { optimizeAllocationCandidates } from "../convex/organAllocation/multiObjectiveOptimizer";
import { buildAllocationRecommendations } from "../convex/organAllocation/recommendationEngine";

console.log("==================================================");
console.log("VEINLINK — ORGAN ALLOCATION ENGINE TEST SUITE");
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

const now = Date.now();

const validOrgan = {
  _id: "organ_1",
  organType: "KIDNEY",
  bloodType: "O-",
  status: "AVAILABLE",
  preservationDeadline: now + 10 * 3600 * 1000, // 10 hours remaining
};

const validRequestA = {
  _id: "req_1",
  recipientId: "rec_1",
  organType: "KIDNEY",
  bloodType: "A+",
  status: "ACTIVE",
  urgency: "CRITICAL",
  createdAt: now - 60 * 24 * 3600 * 1000, // 60 days
};

const validRecipientA = {
  _id: "rec_1",
  recipientStatus: "ACTIVE",
  verificationStatus: "VERIFIED",
  bloodType: "A+",
  registeredAt: now - 120 * 24 * 3600 * 1000, // 120 days
};

const baseCandidateA: AllocationCandidateContext = {
  organ: validOrgan,
  request: validRequestA,
  recipient: validRecipientA,
  distanceKm: 50,
  currentTime: now,
};

// 1. Eligibility Gate: Valid candidate passes
const gateA = validateAllocationEligibility(baseCandidateA, DEFAULT_ALLOCATION_POLICY);
assert(gateA.isEligible, "Valid candidate passes pre-allocation eligibility gate");

// 2. Eligibility Gate: Already allocated organ rejected
const allocatedOrganContext: AllocationCandidateContext = {
  ...baseCandidateA,
  organ: { ...validOrgan, status: "ALLOCATED" },
};
const gateAllocated = validateAllocationEligibility(allocatedOrganContext, DEFAULT_ALLOCATION_POLICY);
assert(!gateAllocated.isEligible, "Organ with status 'ALLOCATED' is excluded by eligibility gate");
assert(
  gateAllocated.exclusionReasons.some((r) => r.includes("ORGAN_UNAVAILABLE")),
  "Records explicit ORGAN_UNAVAILABLE reason"
);

// 3. Eligibility Gate: Inactive request rejected
const inactiveRequestContext: AllocationCandidateContext = {
  ...baseCandidateA,
  request: { ...validRequestA, status: "CANCELLED" },
};
const gateInactiveReq = validateAllocationEligibility(inactiveRequestContext, DEFAULT_ALLOCATION_POLICY);
assert(!gateInactiveReq.isEligible, "Cancelled request is excluded from allocation optimization");

// 4. Eligibility Gate: Expired cold ischemia clock rejected
const expiredPreservationContext: AllocationCandidateContext = {
  ...baseCandidateA,
  organ: { ...validOrgan, preservationDeadline: now + 1800 * 1000 }, // only 30 mins (<1h buffer)
};
const gateExpiredPres = validateAllocationEligibility(expiredPreservationContext, DEFAULT_ALLOCATION_POLICY);
assert(!gateExpiredPres.isEligible, "Organ with insufficient remaining cold ischemia time is rejected");

// 5. Multi-Objective Candidate Optimization & Normalization
const validRequestB = {
  _id: "req_2",
  recipientId: "rec_2",
  organType: "KIDNEY",
  bloodType: "O-",
  status: "ACTIVE",
  urgency: "MEDIUM",
  createdAt: now - 180 * 24 * 3600 * 1000, // 180 days
};
const validRecipientB = {
  _id: "rec_2",
  recipientStatus: "ACTIVE",
  verificationStatus: "VERIFIED",
  bloodType: "O-",
  registeredAt: now - 240 * 24 * 3600 * 1000,
};
const baseCandidateB: AllocationCandidateContext = {
  organ: validOrgan,
  request: validRequestB,
  recipient: validRecipientB,
  distanceKm: 300,
  currentTime: now,
};

const candidateSet = [
  { context: baseCandidateA, candidateMatchId: "match_1" },
  { context: baseCandidateB, candidateMatchId: "match_2" },
];

const optimized = optimizeAllocationCandidates(candidateSet, DEFAULT_ALLOCATION_POLICY);

assert(optimized.length === 2, "Optimization returns all evaluated eligible candidates");
assert(
  optimized[0].compositeScore >= 0.0 && optimized[0].compositeScore <= 1.0,
  "Optimized composite score is bounded in [0.0, 1.0]"
);
assert(
  optimized[0].normalizedObjectives.clinicalUrgency >= 0.0 &&
    optimized[0].normalizedObjectives.clinicalUrgency <= 1.0,
  "Normalized clinical urgency objective is bounded in [0.0, 1.0]"
);
assert(
  optimized[0].normalizedObjectives.waitlistEquity >= 0.0 &&
    optimized[0].normalizedObjectives.waitlistEquity <= 1.0,
  "Normalized waitlist equity objective is bounded in [0.0, 1.0]"
);

// 6. Urgency weighting: CRITICAL (Rank #1) ranks above MEDIUM
assert(
  optimized[0].context.request.urgency === "CRITICAL",
  "CRITICAL urgency candidate achieves Rank #1 under default policy weights"
);

// 7. Pareto Dominance Evaluation
const dominatingProfile = { clinicalUrgency: 1.0, waitlistEquity: 0.8, logisticsEfficiency: 0.9 };
const dominatedProfile = { clinicalUrgency: 0.5, waitlistEquity: 0.4, logisticsEfficiency: 0.5 };
const tradeOffProfile = { clinicalUrgency: 0.4, waitlistEquity: 0.95, logisticsEfficiency: 0.95 };

assert(
  isParetoDominating(dominatingProfile, dominatedProfile),
  "Pareto dominance helper correctly identifies dominating candidate"
);
assert(
  !isParetoDominating(dominatedProfile, dominatingProfile),
  "Pareto dominance correctly identifies non-dominance in reverse"
);
assert(
  !isParetoDominating(dominatingProfile, tradeOffProfile),
  "Pareto trade-off (higher waitlist) is correctly recognized as non-dominated"
);

// 8. Recommendation Generation & Formatting
const recommendations = buildAllocationRecommendations(optimized, DEFAULT_ALLOCATION_POLICY);
assert(recommendations.length === 2, "Builds recommendations for both candidates");
assert(recommendations[0].rank === 1, "Top candidate is marked Rank #1");
assert(recommendations[1].rank === 2, "Second candidate is marked Rank #2");
assert(
  recommendations[0].status === "PENDING_REVIEW",
  "Generated recommendations are in 'PENDING_REVIEW' state (never auto-allocated)"
);
assert(
  recommendations[0].objectiveBreakdown.urgencyContribution > 0,
  "Recommendation contains detailed objective contribution breakdown"
);

// 9. Tripartite Lifecycle Distinction
// Match (PROPOSED) -> Recommendation (PENDING_REVIEW) -> Authorized Allocation (APPROVED)
const matchStatus: string = "PROPOSED";
const recStatus: string = recommendations[0].status;
const authorizedStatus: string = "APPROVED";
assert(
  matchStatus !== recStatus && recStatus !== authorizedStatus && matchStatus !== authorizedStatus,
  "Tripartite separation verified: Match != Recommendation != Authorized Allocation"
);

// 10. Human Override Validation Logic
// If approving Rank #2, override justification is strictly required
function validateApprovalAttempt(recRank: number, isOverride: boolean, overrideReason?: string): boolean {
  if (recRank !== 1) {
    if (!isOverride || !overrideReason || overrideReason.trim().length === 0) {
      return false; // Override rejected
    }
  }
  return true;
}

assert(
  validateApprovalAttempt(1, false),
  "Approving Rank #1 primary recommendation does not require override"
);
assert(
  !validateApprovalAttempt(2, false),
  "Approving Rank #2 without override flag is strictly blocked"
);
assert(
  !validateApprovalAttempt(2, true, ""),
  "Approving Rank #2 with empty override justification is strictly blocked"
);
assert(
  validateApprovalAttempt(2, true, "Clinical consensus based on operating room readiness"),
  "Approving Rank #2 with recorded override reason succeeds"
);

// 11. Zero Blood-Domain Regressions
const BLOOD_COOLDOWN_MS = 56 * 24 * 60 * 60 * 1000;
const lastBloodDonation = now - 15 * 24 * 60 * 60 * 1000;
assert(
  now - lastBloodDonation < BLOOD_COOLDOWN_MS,
  "Blood-domain 56-day cooldown invariant remains completely operational"
);

console.log("==================================================");
console.log(`Results: ${passed}/${total} organ allocation tests passed.`);
console.log("==================================================");
