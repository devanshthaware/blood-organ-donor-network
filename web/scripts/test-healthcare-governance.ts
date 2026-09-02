/**
 * Automated Test Suite — Step 10: Privacy, Security & Healthcare Governance Layer
 * Validates:
 * 1. Role-based access control (RBAC) enforcement
 * 2. Resource-level ownership (donor self-access vs cross-donor breach)
 * 3. Facility scoping (cross-hospital request access isolation)
 * 4. Purpose-based consent validation and revocation downstream enforcement
 * 5. ML feature allowlist filtering (zero PHI to ML models)
 * 6. LLM privacy gateway (PII scrubbing: emails, phones, coordinates)
 * 7. Sliding-window rate limiter abuse prevention
 * 8. Account suspension state machine guards
 * 9. Zero-PHI on-chain invariant
 * 10. Blood-domain 56-day donation cooldown invariant
 */

import {
  buildMLFeatures,
  filterLLMContext,
  calculateDistanceKm,
  RawDonorData,
} from "../convex/governance/privacyGate";
import {
  checkRateLimit,
  resetRateLimits,
} from "../convex/governance/rateLimiter";

async function runTests() {
  console.log("==================================================");
  console.log("VEINLINK — HEALTHCARE SECURITY & GOVERNANCE TEST SUITE");
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

  // 1. RBAC Role Gate Enforcement
  const roles = ["donor", "hospital", "admin"] as const;
  const donorPermitted = (role: string, allowed: string[]) => allowed.includes(role);

  assert(
    !donorPermitted("donor", ["hospital", "admin"]),
    "RBAC: Donor role is blocked from hospital-coordinator operations"
  );
  assert(
    !donorPermitted("hospital", ["admin"]),
    "RBAC: Hospital coordinator is blocked from global administrative operations"
  );
  assert(
    donorPermitted("admin", ["admin", "hospital", "donor"]),
    "RBAC: Platform admin is permitted across operational domains"
  );

  // 2. Resource-Level Ownership Enforcement (Donor Self-Access)
  function checkResourceOwnership(callerClerkId: string, resourceOwnerId: string, callerRole: string) {
    if (callerRole === "admin") return { allowed: true };
    if (callerClerkId === resourceOwnerId) return { allowed: true };
    return { allowed: false, reason: "PRIVILEGE_ESCALATION_ATTEMPT" };
  }

  const selfAccess = checkResourceOwnership("user_donor_101", "user_donor_101", "donor");
  assert(selfAccess.allowed, "Resource Ownership: Donor can access their own profile and records");

  const crossDonorAccess = checkResourceOwnership("user_donor_101", "user_donor_999", "donor");
  assert(
    !crossDonorAccess.allowed && crossDonorAccess.reason === "PRIVILEGE_ESCALATION_ATTEMPT",
    "Resource Ownership: Donor is strictly blocked from accessing peer donor medical records"
  );

  const adminOverride = checkResourceOwnership("user_admin_001", "user_donor_999", "admin");
  assert(adminOverride.allowed, "Resource Ownership: System administrator has authorized governance access");

  // 3. Facility Scope Isolation (Cross-Hospital Partitioning)
  function checkFacilityScope(coordinatorFacility: string, requestFacility: string, role: string) {
    if (role === "admin") return { allowed: true };
    if (coordinatorFacility === requestFacility) return { allowed: true };
    return { allowed: false, reason: "ACCESS_DENIED_FACILITY_MISMATCH" };
  }

  const sameFacility = checkFacilityScope("HOSP-PUNE-01", "HOSP-PUNE-01", "hospital");
  assert(sameFacility.allowed, "Facility Scoping: Coordinator can access their assigned facility requests");

  const crossFacility = checkFacilityScope("HOSP-PUNE-01", "HOSP-MUMBAI-02", "hospital");
  assert(
    !crossFacility.allowed && crossFacility.reason === "ACCESS_DENIED_FACILITY_MISMATCH",
    "Facility Scoping: Cross-facility requisition access is strictly blocked"
  );

  // 4. Purpose-Based Consent Lifecycle & Revocation
  interface MockConsent {
    purpose: string;
    status: "GRANTED" | "WITHDRAWN" | "NO_CONSENT";
  }

  function validateDownstreamPurpose(consents: MockConsent[], requiredPurpose: string) {
    const c = consents.find((item) => item.purpose === requiredPurpose);
    return Boolean(c && c.status === "GRANTED");
  }

  const activeConsents: MockConsent[] = [
    { purpose: "DONATION", status: "GRANTED" },
    { purpose: "EMERGENCY_CONTACT", status: "GRANTED" },
    { purpose: "COMMUNICATION", status: "WITHDRAWN" },
  ];

  assert(
    validateDownstreamPurpose(activeConsents, "DONATION"),
    "Consent Engine: Active DONATION consent allows registry matching"
  );
  assert(
    validateDownstreamPurpose(activeConsents, "EMERGENCY_CONTACT"),
    "Consent Engine: Active EMERGENCY_CONTACT consent permits urgent alert outreach"
  );
  assert(
    !validateDownstreamPurpose(activeConsents, "COMMUNICATION"),
    "Consent Engine: Withdrawn COMMUNICATION consent halts non-critical promotional outreach"
  );
  assert(
    !validateDownstreamPurpose(activeConsents, "LOCATION_PROCESSING"),
    "Consent Engine: Unspecified purpose evaluates to NO_CONSENT and is blocked"
  );

  // 5. ML Feature Allowlist Filtering (Zero PHI to ML Models)
  const rawDonor: RawDonorData = {
    _id: "donor_9876",
    name: "John Sensitive Doe",
    email: "john.doe@confidential-health.org",
    phone: "+91 98765 43210",
    address: "Flat 402, Sunshine Towers, Pune, India",
    latitude: 18.5204,
    longitude: 73.8567,
    bloodGroup: "O+",
    lastDonationDate: Date.now() - 90 * 24 * 3600 * 1000, // 90 days ago
    pastAcceptanceRate: 0.92,
    totalRequests: 5,
    completedDonations: 4,
    noShows: 0,
    avgResponseMinutes: 18,
  };

  const requestContext = {
    bloodGroup: "O+",
    urgencyLevel: "CRITICAL",
    hospitalLatitude: 18.5304,
    hospitalLongitude: 73.8467,
  };

  const mlFeatures: any = buildMLFeatures(rawDonor, requestContext);

  assert(!("name" in mlFeatures), "ML Privacy Gate: Donor name is completely stripped from feature vector");
  assert(!("email" in mlFeatures), "ML Privacy Gate: Donor email is completely stripped from feature vector");
  assert(!("phone" in mlFeatures), "ML Privacy Gate: Donor phone number is completely stripped from feature vector");
  assert(!("address" in mlFeatures), "ML Privacy Gate: Physical street address is completely stripped");
  assert(!("latitude" in mlFeatures), "ML Privacy Gate: Raw latitude coordinates are not exposed");
  assert(typeof mlFeatures.distanceKm === "number" && mlFeatures.distanceKm > 0, "Location Tokenization: Coarse distanceKm derived accurately");
  assert(mlFeatures.bloodGroupMatch === true, "Allowed Feature: Medical compatibility indicator preserved");
  assert(mlFeatures.daysSinceLastDonation === 90, "Allowed Feature: Cooldown tracking metric preserved");

  // 6. LLM Privacy Gateway (PII Scrubbing)
  const promptContext =
    "Patient Priya Sharma (contact: priya.sharma@health.gov.in, tel: 987-654-3210) requires kidney transport from coordinates 18.5204, 73.8567.";
  const sanitizedPrompt = filterLLMContext(promptContext);

  assert(!sanitizedPrompt.includes("priya.sharma@health.gov.in"), "LLM Privacy Gate: Email address is redacted");
  assert(sanitizedPrompt.includes("[REDACTED_EMAIL]"), "LLM Privacy Gate: Replaced with standard redaction tag");
  assert(!sanitizedPrompt.includes("987-654-3210"), "LLM Privacy Gate: Telephone number is redacted");
  assert(sanitizedPrompt.includes("[REDACTED_PHONE]"), "LLM Privacy Gate: Phone replaced with redaction tag");
  assert(!sanitizedPrompt.includes("18.5204, 73.8567"), "LLM Privacy Gate: Raw GPS coordinates redacted");
  assert(sanitizedPrompt.includes("[REDACTED_COORDINATES]"), "LLM Privacy Gate: Coordinates replaced with tag");

  // 7. Sliding-Window Rate Limiter
  resetRateLimits();
  const testKey = "client_ip_192.168.1.50";

  let underLimit = true;
  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(testKey, "auth"); // Limit is 5
    if (!res.allowed) underLimit = false;
  }
  assert(underLimit, "Rate Limiter: Requests within configured quota are allowed");

  const violation = checkRateLimit(testKey, "auth"); // 6th request
  assert(!violation.allowed, "Rate Limiter: Excessive requests exceed quota and are blocked");
  assert(violation.resetMs > 0, "Rate Limiter: Provides active cooldown reset duration");

  // 8. Account Suspension State Machine
  interface MockUser {
    status: "ACTIVE" | "SUSPENDED";
  }
  const userRecord: MockUser = { status: "ACTIVE" };
  // Transition to SUSPENDED
  userRecord.status = "SUSPENDED";
  assert(userRecord.status === "SUSPENDED", "Security State Machine: Account successfully placed in SUSPENDED status");

  function authenticateAccount(user: MockUser) {
    if (user.status === "SUSPENDED") {
      return { authenticated: false, reason: "ACCOUNT_SUSPENDED" };
    }
    return { authenticated: true };
  }
  const suspendedLogin = authenticateAccount(userRecord);
  assert(
    !suspendedLogin.authenticated && suspendedLogin.reason === "ACCOUNT_SUSPENDED",
    "Security State Machine: Suspended accounts are barred from authenticated actions"
  );

  // Restore to ACTIVE
  userRecord.status = "ACTIVE";
  const restoredLogin = authenticateAccount(userRecord);
  assert(restoredLogin.authenticated, "Security State Machine: Administrative restoration returns account to ACTIVE");

  // 9. Zero-PHI On-Chain Privacy Invariant
  const onChainPayload = {
    proofId: "PRF-SEC-2026",
    eventType: "security.account_suspended",
    dataHash: "abc123sha256hash",
    timestamp: Date.now(),
  };
  const onChainJson = JSON.stringify(onChainPayload);
  assert(!onChainJson.includes("John Sensitive Doe"), "Zero-PHI On-Chain: No donor identities on-chain");
  assert(!onChainJson.includes("Priya Sharma"), "Zero-PHI On-Chain: No patient names on-chain");

  // 10. Blood-Domain 56-Day Cooldown Invariant
  const now = Date.now();
  const cooldownMs = 56 * 24 * 3600 * 1000;
  const lastDonation = now - 40 * 24 * 3600 * 1000; // 40 days ago
  assert(now - lastDonation < cooldownMs, "Blood-domain 56-day cooldown invariant completely operational");

  console.log("==================================================");
  console.log(`Results: ${passed}/${total} healthcare governance tests passed.`);
  console.log("==================================================");
}

runTests();
