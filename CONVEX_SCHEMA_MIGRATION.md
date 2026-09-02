# CONVEX_SCHEMA_MIGRATION.md — Data Model Audit & Convex Schema Plan

## 1. Executive Summary
This document analyzes the 10 Firestore collections discovered in the repository and provides a strict schema migration mapping to **Convex** tables, classifying each into Option A (Direct), B (Redesign), C (Merge), D (Split), or E (Remove).

---

## 2. Firestore Collection Audit & Migration Classification

### 1. Collection: `users`
- **Purpose:** Base user profile linking auth identity to application role (`donor`, `hospital`, `admin`).
- **Fields:** `id` (UID), `email`, `role`, `createdAt`, `updatedAt`, `displayName`, `phoneNumber`.
- **Relationships:** 1:1 with `donors` (if role=donor), 1:1 with `hospitals` (if role=hospital).
- **Operations:** Read by user/admin; Written on registration; Updated on profile edit.
- **Security & Sensitive Fields:** Email and phone are PII; `role` must never be modifiable by client.
- **Migration Option:** **Option B (Requires Schema Redesign)**
- **Convex Target:** `users` table indexed by `clerkId` (`index("by_clerkId", ["clerkId"])`) and `email`. Stores normalized user record with RBAC roles.

---

### 2. Collection: `donors`
- **Purpose:** Extended profile for blood donors including medical fitness, location coordinates, reliability score, and history counters.
- **Fields:** `id`, `fullName`, `bloodType`, `donorStatus`, `isActive`, `location: { lat, lng, address }`, `reliabilityScore`, `totalRequests`, `acceptedRequests`, `completedDonations`, `noShows`, `pastAcceptanceRate`, `avgResponseTimeMinutes`, `lastDonationDate`, `healthStatus`, `createdAt`.
- **Relationships:** Belongs to `users`. Has many `reservations`, `donationHistory`.
- **Operations:** Read by donor, hospitals (scrubbed), admin; Updated on profile edit or state machine confirmation.
- **Triggers:** `onDonorCreated` initializes default score and logs audit.
- **Sensitive Fields:** Physical location (`lat`/`lng`), medical fitness status, reliability score (should be hidden from donor UI to avoid gaming).
- **Migration Option:** **Option D (Split into Multiple Convex Tables)**
- **Convex Target:**
  - `donors`: Primary profile, blood group, medical fitness, verification status.
  - `donorLocations`: Spatial coordinates and search radius preferences.
  - `donorMetrics`: Reliability scores, acceptance rates, no-show counters, response times (protected from client writes).

---

### 3. Collection: `hospitals`
- **Purpose:** Verified medical facility profile, dispatch location coordinates, and operational contact.
- **Fields:** `id`, `name`, `address`, `region`, `location: { lat, lng }`, `contactEmail`, `contactPhone`, `isActive`, `licenseNumber`, `createdAt`.
- **Relationships:** Has many `donation_requests`, `blood_inventory`, `patients`.
- **Operations:** Read by all authenticated users; Updated by hospital admin or network admin.
- **Migration Option:** **Option B (Requires Schema Redesign)**
- **Convex Target:** `hospitals` (later generalizable to `facilities` or `transplantCenters` to support organ retrieval/transplant facilities). Indexed by `region` and `isActive`.

---

### 4. Collection: `donation_requests`
- **Purpose:** Formal clinical blood request created by a hospital coordinator.
- **Fields:** `id`, `hospitalId`, `hospitalName`, `patientId`, `bloodType`, `unitsRequested`, `fulfilledUnits`, `urgency` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `status` (`PENDING`, `MATCHING`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`, `EXPIRED`), `requiredBy`, `notes`, `createdAt`, `updatedAt`.
- **Relationships:** Belongs to `hospitals`. References `patients`. Has many `reservations`.
- **Operations:** Created by hospital; Read by hospital, admin, matching engine; Updated on reservation completion or cancellation.
- **Triggers:** `onDonationRequestCreated` calls demand ML.
- **Migration Option:** **Option B (Requires Schema Redesign)**
- **Convex Target:** `donationRequests` with strict validators (`v.union(v.literal("LOW"), ...)`). Indexed by `status`, `hospitalId`, and `bloodType`.

---

### 5. Collection: `reservations`
- **Purpose:** Represents an atomic match invite connecting a candidate donor with a donation request.
- **Fields:** `id`, `requestId`, `hospitalId`, `donorId`, `bloodType`, `urgency`, `status` (`PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `CONFIRMED`, `COMPLETED`), `matchScore`, `availabilityScore`, `reliabilityScore`, `distanceKm`, `aiExplanation: { source, summary, bullets }`, `createdAt`, `respondedAt`, `completedAt`.
- **Relationships:** Belongs to `donation_requests` and `donors`.
- **Operations:** Created by matching engine; Read by donor and hospital; Updated via accept/decline/complete.
- **Triggers:** `onReservationStatusChanged` updates request fulfillment counter and donor metrics.
- **Migration Option:** **Option A (Direct Migration with Convex Validators)**
- **Convex Target:** `reservations` table indexed by `donorId`, `requestId`, and `status`.

---

### 6. Collection: `blood_inventory`
- **Purpose:** Current stock level tracking per blood type per hospital.
- **Fields:** `id`, `hospitalId`, `bloodType`, `unitsAvailable`, `minimumThreshold`, `optimalThreshold`, `updatedAt`.
- **Operations:** Read by hospital, matching engine; Updated upon receipt or transfusion.
- **Triggers:** `onBloodInventoryChanged` triggers shortage warnings.
- **Migration Option:** **Option A (Direct Migration with Convex Validators)**
- **Convex Target:** `bloodInventory` indexed by `hospitalId` and `["hospitalId", "bloodType"]`.

---

### 7. Collection: `ml_outputs`
- **Purpose:** Explainability audit trail of ML predictions (demand forecasts, availability, reliability).
- **Fields:** `id`, `modelType` (`demand`, `availability`, `reliability`), `requestId`, `donorId`, `inputs`, `outputs`, `confidence`, `createdAt`.
- **Triggers:** `onDemandForecastCreated` triggers matching engine.
- **Migration Option:** **Option B (Requires Schema Redesign)**
- **Convex Target:** `mlPredictions` table. Note: In Convex, rather than writing to a table just to trigger the next step, a Convex Action can compute predictions and directly invoke a Convex Mutation, reducing unnecessary latency while still persisting prediction metadata for auditing.

---

### 8. Collection: `alerts`
- **Purpose:** Emergency broadcasts and system-generated inventory deficit warnings.
- **Fields:** `id`, `type` (`SHORTAGE`, `EMERGENCY_REQUEST`, `SYSTEM`), `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `title`, `message`, `hospitalId`, `bloodType`, `status` (`ACTIVE`, `RESOLVED`), `createdAt`, `resolvedAt`.
- **Operations:** Read by hospital and admin dashboards; Created by functions; Resolved by staff.
- **Migration Option:** **Option A (Direct Migration)**
- **Convex Target:** `alerts` table indexed by `["hospitalId", "status"]` and `severity`.

---

### 9. Collection: `audit_logs`
- **Purpose:** Immutable compliance ledger of every clinical, administrative, and algorithmic event.
- **Fields:** `id`, `userId`, `userEmail`, `action`, `resourceType`, `resourceId`, `ipAddress`, `timestamp`, `result` (`SUCCESS`, `FAILURE`, `ERROR`), `details`, `errorMessage`.
- **Operations:** Append-only (No updates or deletions allowed). Read by compliance officers on `/admin/audit-logs`.
- **Migration Option:** **Option A (Direct Migration with Convex Append-Only Mutation)**
- **Convex Target:** `auditLogs` table indexed by `timestamp`, `action`, and `userId`.

---

### 10. Collection: `ai_events`
- **Purpose:** Telemetry tracking for AI System Monitor (`/admin/ai-monitor`).
- **Fields:** `id`, `modelName`, `modelType`, `inputSummary`, `outputSummary`, `status`, `executionTimeMs`, `modelVersion`, `confidence`, `triggerSource`, `createdAt`.
- **Migration Option:** **Option A (Direct Migration)**
- **Convex Target:** `aiEvents` table indexed by `createdAt` and `modelName`.

---

## 3. Proposed Convex Schema Architecture (Draft)

```typescript
// convex/schema.ts (Architectural Draft)
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    role: v.union(v.literal("donor"), v.literal("hospital"), v.literal("admin")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]).index("by_email", ["email"]),

  donors: defineTable({
    userId: v.id("users"),
    bloodType: v.string(),
    donorStatus: v.union(v.literal("PENDING"), v.literal("APPROVED"), v.literal("REJECTED")),
    isActive: v.boolean(),
    lastDonationDate: v.optional(v.number()),
    healthStatus: v.union(v.literal("FIT"), v.literal("UNFIT"), v.literal("TEMPORARILY_UNAVAILABLE")),
    lat: v.number(),
    lng: v.number(),
    address: v.optional(v.string()),
    reliabilityScore: v.number(),
    totalRequests: v.number(),
    acceptedRequests: v.number(),
    completedDonations: v.number(),
    noShows: v.number(),
    avgResponseTimeMinutes: v.number(),
  }).index("by_userId", ["userId"]).index("by_bloodType", ["bloodType"]).index("by_active", ["isActive"]),

  hospitals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    address: v.string(),
    region: v.number(),
    lat: v.number(),
    lng: v.number(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    isActive: v.boolean(),
  }).index("by_userId", ["userId"]).index("by_region", ["region"]),

  donationRequests: defineTable({
    hospitalId: v.id("hospitals"),
    hospitalName: v.string(),
    patientId: v.optional(v.string()),
    bloodType: v.string(),
    unitsRequested: v.number(),
    fulfilledUnits: v.number(),
    urgency: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    status: v.union(v.literal("PENDING"), v.literal("MATCHING"), v.literal("PARTIALLY_FULFILLED"), v.literal("FULFILLED"), v.literal("CANCELLED")),
    requiredBy: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_hospitalId", ["hospitalId"]).index("by_status", ["status"]),

  reservations: defineTable({
    requestId: v.id("donationRequests"),
    donorId: v.id("donors"),
    hospitalId: v.id("hospitals"),
    bloodType: v.string(),
    urgency: v.string(),
    status: v.union(v.literal("PENDING"), v.literal("ACCEPTED"), v.literal("DECLINED"), v.literal("CONFIRMED"), v.literal("COMPLETED"), v.literal("EXPIRED")),
    matchScore: v.number(),
    availabilityScore: v.number(),
    reliabilityScore: v.number(),
    distanceKm: v.number(),
    aiExplanation: v.optional(v.object({
      source: v.string(),
      summary: v.string(),
      bullets: v.array(v.string()),
      confidence: v.string(),
    })),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  }).index("by_donorId", ["donorId"]).index("by_requestId", ["requestId"]).index("by_status", ["status"]),

  bloodInventory: defineTable({
    hospitalId: v.id("hospitals"),
    bloodType: v.string(),
    unitsAvailable: v.number(),
    minimumThreshold: v.number(),
    optimalThreshold: v.number(),
    updatedAt: v.number(),
  }).index("by_hospital_bloodType", ["hospitalId", "bloodType"]),

  alerts: defineTable({
    hospitalId: v.optional(v.id("hospitals")),
    type: v.string(),
    severity: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    title: v.string(),
    message: v.string(),
    bloodType: v.optional(v.string()),
    status: v.union(v.literal("ACTIVE"), v.literal("RESOLVED")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  auditLogs: defineTable({
    userId: v.string(),
    userEmail: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    ipAddress: v.string(),
    timestamp: v.number(),
    result: v.union(v.literal("SUCCESS"), v.literal("FAILURE"), v.literal("ERROR")),
    details: v.any(),
    errorMessage: v.optional(v.string()),
  }).index("by_timestamp", ["timestamp"]).index("by_action", ["action"]),

  aiEvents: defineTable({
    modelName: v.string(),
    modelType: v.string(),
    inputSummary: v.any(),
    outputSummary: v.any(),
    status: v.union(v.literal("SUCCESS"), v.literal("FAILED")),
    executionTimeMs: v.optional(v.number()),
    modelVersion: v.string(),
    confidence: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
```
