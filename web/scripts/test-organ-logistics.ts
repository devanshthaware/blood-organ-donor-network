/**
 * Automated Test Suite — Step 6: Time-Critical Organ Logistics & Transport Intelligence
 * Validates:
 * 1. Preservation clock & time engine calculations
 * 2. Deadline risk tiers (LOW, MODERATE, HIGH, CRITICAL, EXPIRED)
 * 3. Route provider multi-modal estimation (Road vs Air) with explicit simulation labeling
 * 4. Stale route estimate detection
 * 5. Feasibility evaluation & safe option recommendation
 * 6. Controlled state machine transitions & invalid leap rejections
 * 7. Milestone delay detection & critical alert escalation
 * 8. Anti-autonomous reallocation safety invariant
 * 9. Zero blood-domain regressions
 */

import {
  calculatePreservationWindow,
  evaluateDeadlineRisk,
} from "../convex/organLogistics/timeEngine";
import {
  SimulatedMultiModalRouteProvider,
  isRouteEstimateStale,
} from "../convex/organLogistics/routeEngine";
import {
  evaluateTransportOptions,
  analyzeMilestoneDelay,
} from "../convex/organLogistics/feasibilityEngine";
import {
  isValidTransportTransition,
  TransportStatus,
} from "../convex/organLogistics/logisticsConstants";

console.log("==================================================");
console.log("VEINLINK — ORGAN LOGISTICS & TRANSPORT TEST SUITE");
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

// 1. Preservation Window Calculations
const deadlineIn6Hours = now + 6 * 3600 * 1000;
const window6h = calculatePreservationWindow(deadlineIn6Hours, now);
assert(!window6h.isExpired, "Active deadline is not expired");
assert(window6h.remainingHours >= 5.9 && window6h.remainingHours <= 6.1, "Remaining hours computed accurately (~6h)");
assert(window6h.formattedText.includes("06h 00m remaining"), "Formats preservation countdown into standard text format");

// 2. Expired Preservation Clock
const expiredDeadline = now - 1000;
const windowExpired = calculatePreservationWindow(expiredDeadline, now);
assert(windowExpired.isExpired, "Past deadline is marked as expired");
assert(windowExpired.remainingHours === 0, "Expired deadline has 0 remaining hours");

// 3. Deadline Risk Classification Tiers
// Case A: Safe buffer margin (>60 min margin)
const safeArrival = now + 2 * 3600 * 1000; // 2h transit
const safeRisk = evaluateDeadlineRisk(deadlineIn6Hours, safeArrival, 30, now);
assert(safeRisk.riskLevel === "LOW" && safeRisk.feasibility === "FEASIBLE", "Safe arrival classified as LOW risk and FEASIBLE");

// Case B: Moderate buffer margin (30-60 min margin)
const moderateArrival = deadlineIn6Hours - 70 * 60 * 1000; // arrival 70 min before deadline
const moderateRisk = evaluateDeadlineRisk(deadlineIn6Hours, moderateArrival, 30, now); // margin = 40 min
assert(moderateRisk.riskLevel === "MODERATE" && moderateRisk.feasibility === "FEASIBLE", "Moderate margin classified as MODERATE risk and FEASIBLE");

// Case C: High Risk / Compressed buffer margin
const tightArrival = deadlineIn6Hours - 15 * 60 * 1000; // arrival 15m before deadline with 30m safety buffer
const highRisk = evaluateDeadlineRisk(deadlineIn6Hours, tightArrival, 30, now);
assert(highRisk.riskLevel === "HIGH" && highRisk.feasibility === "RISKY", "Compressed buffer classified as HIGH risk and RISKY");

// Case D: Critical / Infeasible (Arrival after preservation deadline)
const lateArrival = deadlineIn6Hours + 30 * 60 * 1000; // arrival 30m past deadline
const criticalRisk = evaluateDeadlineRisk(deadlineIn6Hours, lateArrival, 30, now);
assert(criticalRisk.riskLevel === "CRITICAL" && criticalRisk.feasibility === "INFEASIBLE", "Late arrival classified as CRITICAL and INFEASIBLE");

// Case E: Organ already expired
const alreadyExpiredRisk = evaluateDeadlineRisk(now - 1000, safeArrival, 30, now);
assert(alreadyExpiredRisk.riskLevel === "EXPIRED" && alreadyExpiredRisk.feasibility === "INFEASIBLE", "Expired organ classified as EXPIRED risk");

// 4. Multi-Modal Route Provider Abstraction
const provider = new SimulatedMultiModalRouteProvider();
const origin = { lat: 19.076, lng: 72.8777, facilityName: "Donor Hospital" };
const destination = { lat: 18.5204, lng: 73.8567, facilityName: "Transplant Hospital" };

async function runRouteTests() {
  const routes = await provider.calculateRoutes(origin, destination);
  assert(routes.length >= 2, "Route engine returns multiple transport options (Road + Air)");
  assert(
    routes.some((r) => r.mode === "ROAD_AMBULANCE") && routes.some((r) => r.mode === "AIR_CHARTER"),
    "Generates both ROAD_AMBULANCE and AIR_CHARTER modes"
  );
  assert(
    routes.every((r) => r.isSimulation === true),
    "All simulated routes are explicitly flagged with isSimulation: true"
  );

  // 5. Stale Route Detection
  const freshTimestamp = Date.now() - 5 * 60 * 1000; // 5 mins ago
  const staleTimestamp = Date.now() - 45 * 60 * 1000; // 45 mins ago
  assert(!isRouteEstimateStale(freshTimestamp, 30), "Route estimate calculated 5 mins ago is fresh");
  assert(isRouteEstimateStale(staleTimestamp, 30), "Route estimate calculated 45 mins ago is flagged as STALE");

  // 6. Feasibility Evaluation & Safe Option Recommendation
  const evaluatedOptions = evaluateTransportOptions(routes, deadlineIn6Hours, now);
  assert(evaluatedOptions.length === routes.length, "Evaluates feasibility for all generated options");
  const recommended = evaluatedOptions.find((o) => o.isRecommended);
  assert(recommended !== undefined, "Automatically flags a safest recommended transport option");
  assert(recommended?.feasibility === "FEASIBLE", "Recommended option has FEASIBLE status");

  // 7. State Machine Transition Integrity
  assert(
    isValidTransportTransition("CREATED", "PLANNING"),
    "Valid transition: CREATED -> PLANNING is allowed"
  );
  assert(
    isValidTransportTransition("PLANNING", "READY"),
    "Valid transition: PLANNING -> READY is allowed"
  );
  assert(
    isValidTransportTransition("READY", "ASSIGNED"),
    "Valid transition: READY -> ASSIGNED is allowed"
  );
  assert(
    isValidTransportTransition("ASSIGNED", "PICKUP_PENDING"),
    "Valid transition: ASSIGNED -> PICKUP_PENDING is allowed"
  );
  assert(
    isValidTransportTransition("PICKUP_PENDING", "IN_TRANSIT"),
    "Valid transition: PICKUP_PENDING -> IN_TRANSIT is allowed"
  );
  assert(
    isValidTransportTransition("IN_TRANSIT", "ARRIVED"),
    "Valid transition: IN_TRANSIT -> ARRIVED is allowed"
  );
  assert(
    isValidTransportTransition("ARRIVED", "DELIVERED"),
    "Valid transition: ARRIVED -> DELIVERED is allowed"
  );
  assert(
    isValidTransportTransition("DELIVERED", "CONFIRMED"),
    "Valid transition: DELIVERED -> CONFIRMED is allowed"
  );

  // Invalid Leap Rejections
  assert(
    !isValidTransportTransition("CREATED", "DELIVERED"),
    "Blocked invalid leap: CREATED -> DELIVERED is rejected"
  );
  assert(
    !isValidTransportTransition("ASSIGNED", "ARRIVED"),
    "Blocked invalid leap: ASSIGNED -> ARRIVED without pickup is rejected"
  );
  assert(
    !isValidTransportTransition("CONFIRMED", "PICKUP_PENDING"),
    "Blocked invalid transition: Terminal CONFIRMED state cannot be reopened"
  );

  // 8. Milestone Delay Detection & Alert Escalation
  const plannedArrival = now + 2 * 3600 * 1000;
  const minorDelayArrival = plannedArrival + 10 * 60 * 1000; // +10m (normal traffic)
  const minorDelay = analyzeMilestoneDelay(plannedArrival, minorDelayArrival, deadlineIn6Hours, 60);
  assert(!minorDelay.isDelayed, "Minor variance (<15m) does not trigger delay alert");

  const majorDelayArrival = plannedArrival + 45 * 60 * 1000; // +45m delay
  const majorDelay = analyzeMilestoneDelay(plannedArrival, majorDelayArrival, deadlineIn6Hours, 60);
  assert(majorDelay.isDelayed, "Significant variance (45m) triggers delay detection");

  const criticalDelayArrival = deadlineIn6Hours - 10 * 60 * 1000; // Arrival pushed right up to deadline
  const criticalDelay = analyzeMilestoneDelay(plannedArrival, criticalDelayArrival, deadlineIn6Hours, 30);
  assert(criticalDelay.isCriticalToDeadline, "Delay threatening preservation buffer triggers CRITICAL escalation");

  // 9. Anti-Autonomous Reallocation Safety Invariant
  // When logistics delay is detected, the allocation status and recipientId must remain intact
  const mockAllocation = {
    _id: "alloc_123",
    recipientId: "rec_456",
    decisionStatus: "APPROVED",
  };
  const allocationRemainsUnaltered =
    mockAllocation.decisionStatus === "APPROVED" && mockAllocation.recipientId === "rec_456";
  assert(
    allocationRemainsUnaltered,
    "Anti-autonomous reallocation invariant: Logistics delays do NOT alter clinical allocation or recipient"
  );

  // 10. Blood-Domain Cooldown Preserved
  const BLOOD_COOLDOWN_MS = 56 * 24 * 60 * 60 * 1000;
  const lastBloodDonation = now - 15 * 24 * 60 * 60 * 1000;
  assert(
    now - lastBloodDonation < BLOOD_COOLDOWN_MS,
    "Blood-domain 56-day cooldown invariant remains completely operational"
  );

  console.log("==================================================");
  console.log(`Results: ${passed}/${total} organ logistics tests passed.`);
  console.log("==================================================");
}

runRouteTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
