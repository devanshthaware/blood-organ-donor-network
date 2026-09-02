# VeinLink — n8n Integration Audit & Capability Analysis

## 1. Executive Summary

This audit evaluates VeinLink's architecture across Steps 2 through 7 (Convex + Clerk migration, Blood + Organ domain, Organ Matching, Multi-Objective Allocation, Time-Critical Logistics, and CV/OCR Verification) to establish an integration blueprint for **n8n event-driven workflow automation and response orchestration**.

---

## 2. Existing Event Sources

| Component / Subsystem | Current State Emitter | Event Trigger Condition | Proposed Domain Event |
| :--- | :--- | :--- | :--- |
| **Blood Inventory** | `bloodInventory.ts` | Units below safe reserve threshold | `blood.inventory.low`, `blood.inventory.critical` |
| **Donation Requests** | `requests.ts` | Urgent or emergency blood requisition | `emergency.request.created` |
| **Blood Reservations** | `reservations.ts` | Reservation confirmed or timeout expired | `blood.reservation.created`, `blood.reservation.expired` |
| **Organ Inventory** | `organInventory.ts` | New donor organ identified & verified | `organ.registered`, `organ.available` |
| **Matching Engine** | `organMatching/actions.ts` | Candidate match batch generated | `organ.match.generated` |
| **Allocation Engine** | `approvalWorkflow.ts` | Human coordinator approves/rejects allocation | `organ.allocation.approved`, `organ.allocation.rejected` |
| **Logistics Engine** | `logisticsOrchestrator.ts` | Transport assigned, departed, delayed, confirmed | `transport.assigned`, `transport.delay.detected`, `transport.delivered` |
| **Logistics Time Engine**| `timeEngine.ts` | Preservation buffer compression | `organ.preservation.warning`, `organ.preservation.critical` |
| **CV / OCR Verification**| `actions.ts`, `verificationService.ts` | Physical label mismatch detected | `verification.mismatch.detected`, `verification.completed` |

---

## 3. Existing Event Consumers

1. **Healthcare Workers / Hospital Coordinators**:
   - Receive reactive updates via Convex client subscriptions in Next.js UI (`/hospital/organs`, `/hospital/requests`).
2. **Audit Logging Service (`auditLogs`)**:
   - Authoritative, append-only record of all security-relevant and clinical actions.
3. **Alerts Service (`alerts`, `logisticsAlerts`)**:
   - Displays real-time warning notifications in coordinator dashboards.

---

## 4. Existing Automation Candidates

1. **Multi-Channel Notification Fan-Out**:
   - Translating in-app alerts into immediate SMS, WhatsApp, and email alerts for emergency on-call surgical teams and donor networks.
2. **Time-Based Escalation Chains**:
   - Automatically escalating unacknowledged emergency requests or logistics delays from tier-1 hospital coordinators to regional network supervisors.
3. **Post-Donation Care & Follow-Up**:
   - Non-clinical communication dispatching thank-you messages and 56-day future donation eligibility reminders.
4. **Third-Party Logistics Handoff**:
   - Webhook dispatch to partner ambulance and aeromedical charter systems upon transport assignment.

---

## 5. Existing APIs That n8n Can Consume (Read / Orchestrate)

- `GET /health` & `GET /version` on ML backend.
- Convex public queries via client or HTTP actions:
  - `organInventory.getAllOrganInventory`
  - `organAllocations.getAllocations`
  - `organLogistics.logisticsOrchestrator.getTransportRequests`
  - `verification.verificationService.getAllVerificationRequests`
  - `alerts.getAlerts`

---

## 6. Existing APIs That n8n Must NOT Call Directly (Forbidden Mutations)

- **`organAllocations.approveAllocationWithRevalidation`**:
  - Organ allocation strictly requires an authenticated human coordinator with `hospital` or `admin` role and clinical justification.
- **`organMatching.actions.runOrganMatching`**:
  - Medical matching rules and candidate rankings belong exclusively to Convex domain policy and FastAPI inference.
- **`consent.recordConsent`**:
  - Legal donor consent cannot be granted or revoked autonomously by external workflows.
- **`bloodInventory` status modifications**:
  - Units cannot be marked as tested or released without authorized laboratory personnel.

---

## 7. Security Boundaries & Authentication

- **Convex System of Record**: All mutations require Clerk authentication and RBAC role checks (`hospital`, `donor`, `admin`).
- **Webhook Protection**:
  - Convex $\to$ n8n webhooks must be authenticated using HMAC SHA-256 signatures (`x-veinlink-signature`) generated with a shared secret.
  - n8n $\to$ Convex callback mutations must validate API tokens or service role keys.
- **Data Minimization**:
  - Domain events must emit internal synthetic IDs (`organId`, `requestId`) rather than unencrypted Protected Health Information (PHI).

---

## 8. Existing Audit Infrastructure

- Central `auditLogs` table in Convex records `userId`, `userEmail`, `action`, `resourceType`, `resourceId`, `timestamp`, and `details`.
- Invariant: n8n workflow actions that write back to Convex must explicitly identify `actor.type: "system:n8n"` to preserve transparent forensic distinction between human and automated operations.

---

## 9. Recommended n8n Integration Points

1. **Dedicated Domain Events Table (`domainEvents`)**:
   - Stores standardized event envelopes (`VeinLinkDomainEvent`) emitted by Convex mutations.
2. **Reliable Webhook Dispatcher (`webhookDispatcher.ts`)**:
   - Asynchronous Convex action dispatching pending events to n8n with exponential backoff and dead-letter queue routing.
3. **Idempotency Gate (`workflowExecutions`)**:
   - Deduplicates incoming events using compound keys (`eventId + workflowName`).
4. **Operations Monitor (`/admin/automation`)**:
   - Real-time admin UI for workflow tracking, active escalations, failure debugging, and authorized event replay.
