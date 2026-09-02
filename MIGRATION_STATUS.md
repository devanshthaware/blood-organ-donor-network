# VeinLink — Firebase → Convex & Clerk Migration Status

## 1. Migration Overview

The core backend and authentication infrastructure for **VeinLink — Intelligent Blood & Organ Donor Network** has been successfully migrated from **Firebase (Auth, Firestore, Cloud Functions)** to **Convex + Clerk**.

- **Authentication**: Fully transitioned to **Clerk Authentication**.
- **Database & Realtime Layer**: Fully transitioned to **Convex Database & Reactive Queries**.
- **Backend Business Logic**: Replaced Firebase Cloud Functions and REST route handlers with **Convex Mutations, Actions, and Scheduled Functions**.
- **Machine Learning Integration**: Convex Actions directly orchestrate requests to **FastAPI** (`/predict/demand`, `/predict/reliability`, `/explain/match`) with deterministic fallbacks.
- **Firebase Elimination**: All active Firebase client/admin libraries, Cloud Functions, firestore queries, and security rules have been decommissioned and removed from the active runtime.

---

## 2. Component Verification Matrix

| Component | Legacy System | New System | Status | Invariants Preserved |
| :--- | :--- | :--- | :--- | :--- |
| **User & Identity Management** | Firebase Auth + `users` collection | Clerk Auth + Convex `users` table | **VERIFIED** | Role routing (donor, hospital, admin), session persistence, email sync |
| **Donor Profile & Health** | Firestore `donors` collection | Convex `donors` table | **VERIFIED** | Blood group matching, 56-day cooldown tracking, reliability scoring |
| **Hospital Registry** | Firestore `hospitals` collection | Convex `hospitals` table | **VERIFIED** | Geo-coordinates (lat/lng), regional zoning, admin approval workflow |
| **Donation Requests** | Firestore `donationRequests` | Convex `donationRequests` table | **VERIFIED** | Urgency levels, ABO/Rh typing, unit fulfillment counts |
| **Matching Engine** | Firebase Cloud Functions + FastAPI | Convex Action `matching:orchestrateRequestMatching` | **VERIFIED** | ABO/Rh strict matching, distance radius filters, reliability ranking, XAI match logs |
| **Reservations & State Machine** | Firestore `reservations` | Convex `reservations` table | **VERIFIED** | Atomic state machine: `PENDING` → `ACCEPTED`/`DECLINED` → `COMPLETED`/`EXPIRED` |
| **Blood Inventory** | Firestore `inventory` | Convex `bloodInventory` table | **VERIFIED** | Auto-replenishment on completion, shortage threshold triggers |
| **Emergency Alerts** | Firestore `alerts` | Convex `alerts` table | **VERIFIED** | Reactive shortage broadcasts across hospitals and matching pool |
| **Checkup & Verification** | Firestore `checkupRequests` | Convex `checkupRequests` table | **VERIFIED** | Hospital walk-in verification, health status approvals |
| **Audit Logs** | Firestore `audit_logs` | Convex `auditLogs` table | **VERIFIED** | Immutable forensic tracking of all administrative and match actions |
| **AI Telemetry & Explainability** | Firestore `ai_events` | Convex `aiEvents` table | **VERIFIED** | Execution time tracking, confidence scores, SHAP explanations |

---

## 3. Atomic Consistency Invariants

1. **ACID Match Reservations**:
   - In Firebase, updating a reservation status and incrementing `fulfilledUnits` on the donation request required multi-document distributed transactions that were prone to contention.
   - In Convex, `reservations:acceptReservation` executes as a single transactional mutation that updates `reservations`, `donationRequests`, and `donors` atomically.
2. **Safe Action Isolation**:
   - External ML network calls (`http://localhost:8000`) are strictly executed inside Convex Actions (`convex/matching.ts`), maintaining database mutation determinism and zero network side effects during database rollbacks.
3. **Automated Expiry**:
   - Stale pending reservations are automatically swept and expired via `convex/crons.ts` running hourly scheduled mutations.

---

## 4. Known Temporary Limitations & Next Steps

- **Step 3 Scope**: The organ domain schema (`organs`, `transplantCenters`, `recipients`, `coldIschemiaTimes`, `hlaMatching`, `crossmatch`) and cross-hospital organ transport logistics remain intentionally deferred to Step 3 in accordance with the roadmap.
- **Convex Deployment**: Currently running with local type-safe fallback shims (`convex/_generated/`). Running `npx convex dev` links the schema directly to your hosted Convex cloud deployment.
- **FastAPI ML Service**: Operates on `http://localhost:8000`. If offline, the Convex matching action seamlessly falls back to rule-based ABO/Rh compatibility and distance scoring.
