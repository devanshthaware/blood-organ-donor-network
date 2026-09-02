# CURRENT_ARCHITECTURE.md — As-Is System Architecture Audit

## 1. Executive Summary & Core Discovery
This document presents the actual architecture discovered in the repository (prioritizing code over `TRD.md` and `PRD.md`).

### Documented vs. Implemented Discrepancy Matrix
| Feature / Component | Documented (`TRD.md` / `PRD.md`) | Actually Discovered in Repository | Discrepancy Status |
|---|---|---|---|
| **Security Rules** | `firestore.rules` deployed via CLI with granular RBAC | Only documented in `docs/firestore_security_rules.md`. No `firestore.rules` file in root or `web/`. | ⚠️ **DOCUMENTED ≠ IMPLEMENTED** (Rules missing from source control) |
| **Firebase Configuration** | `firebase.json` and `.firebaserc` configuring emulators and targets | No `firebase.json` or `.firebaserc` in root directory. Configuration is purely environment-driven in `web/src/lib/firebase.ts`. | ⚠️ **DOCUMENTED ≠ IMPLEMENTED** |
| **Cloud Function Triggers** | `onBloodInventoryChanged`, `onDonationRequestCreated`, `onDemandForecastCreated`, `onReservationStatusChanged`, `onDonorCreated` | All 5 triggers are implemented in `functions/src/index.ts` (1566 lines), but Next.js API routes ALSO do direct Firestore mutations. | ⚠️ **DUAL-WRITE ARCHITECTURE** |
| **Frontend ML Invocations** | "Frontend never calls ML directly" (TRD Invariant 1) | `web/src/app/api/ml/predict-reliability/route.ts` exists and can invoke ML directly from Next.js server route. | ⚠️ **ARCHITECTURAL LEAK** |
| **LLM Inference** | Ollama local instance + OpenAI / Claude fallback in `functions/src/llm/` | `functions/src/llm-service.ts` connects to Ollama (`http://localhost:11434`), falling back to deterministic rule templates. | ✅ **MATCHES (with fallback)** |
| **Authentication** | Firebase Client Auth with role custom claims (`donor`, `hospital`, `admin`) | Email/password auth via `firebase/auth`. Roles stored in Firestore `users/{uid}` document, NOT custom claims. | ⚠️ **ROLE STORAGE VARIANCE** |

---

## 2. Actual Implemented System Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Client Browser (Next.js 16)                        │
│   • Donor Portal (/donor/*)    • Hospital Portal (/hospital/*)          │
│   • Admin Portal (/admin/*)    • Auth Routes (/login/*, /register/*)    │
└──────────────────┬───────────────────────────────▲──────────────────────┘
                   │ HTTP Mutations / Form Submits │ Realtime onSnapshot Listeners
                   ▼                               │ (11 Custom Hooks)
┌──────────────────────────────────────────────────┴──────────────────────┐
│                    Next.js Server API Routes                            │
│   • /api/requests/create          • /api/reservations/[id]/accept       │
│   • /api/reservations/[id]/decline • /api/reservations/[id]/complete     │
│   • /api/patients/create          • /api/shortages/create               │
│   • /api/ml/predict-reliability                                         │
└──────────────────┬───────────────────────────────▲──────────────────────┘
                   │ Firebase Admin SDK            │ Firebase Client SDK
                   ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Cloud Firestore (8 Collections)                     │
│   • users              • donors                • hospitals              │
│   • donation_requests  • reservations          • blood_inventory        │
│   • ml_outputs         • alerts                • audit_logs             │
│   • ai_events          • checkup_requests      • patients               │
└──────────────────┬──────────────────────────────────────────────────────┘
                   │ Firestore v2 Document Triggers
                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             Firebase Cloud Functions (Node.js 24 / TS 5.7)              │
│   • onDonationRequestCreated (Triggers Demand ML via HTTP)             │
│   • onDemandForecastCreated  (Matching Engine: queries donors, scores) │
│   • onReservationStatusChanged (Manages accept/decline state machine)   │
│   • onBloodInventoryChanged  (Checks safety thresholds, raises alerts) │
│   • onDonorCreated           (Initializes score & logs audit)           │
└──────────────┬───────────────────────────────────┬──────────────────────┘
               │ HTTP POST                         │ HTTP POST
               ▼                                   ▼
┌──────────────────────────────┐    ┌─────────────────────────────────────┐
│  FastAPI ML Service (:8000)  │    │      Ollama LLM Engine (:11434)     │
│   • /predict/demand          │    │   Model: llama3 / mistral           │
│   • /predict/reliability     │    │   Fallback: Deterministic Template  │
│   • /predict/availability    │    │             Rule Engine             │
└──────────────────────────────┘    └─────────────────────────────────────┘
```

---

## 3. Communication Boundaries & Lifecycle Analysis

### Operation 1: Creation of a Blood Donation Request
```text
1. Who initiates it?
   Hospital Coordinator submits request form at /hospital/requests.
2. Which component receives it?
   Next.js API route: POST /api/requests/create.
3. Which component validates it?
   Next.js route validates payload schema (bloodType, unitsRequested, urgency, patientId).
4. Where is data stored?
   Firestore collection: `donation_requests/{requestId}` with status="PENDING".
5. Which function processes it?
   Cloud Function: `onDonationRequestCreated` (triggered by onDocumentCreated).
6. Is ML involved?
   YES. Cloud Function calls FastAPI POST /predict/demand with region, blood group, demand/supply units.
7. How is the result persisted?
   Demand prediction written to `ml_outputs/demand_{requestId}`.
8. How is the user notified?
   Firestore onSnapshot in `useDonationRequests` updates hospital UI in real time.
```

### Operation 2: Automated Donor Matching Engine
```text
1. Who initiates it?
   Asynchronous event: document creation at `ml_outputs/demand_{requestId}`.
2. Which component receives it?
   Cloud Function: `onDemandForecastCreated`.
3. Which component validates it?
   Matching engine checks:
   - Compatible blood groups (ABO/Rh compatibility matrix)
   - Active status (isActive == true)
   - 56-day cooldown filter (lastDonationDate <= now - 56 days)
   - Health status == "FIT"
   - Urgency radius filter: LOW (100km), MEDIUM (75km), HIGH (50km), CRITICAL (100km)
4. Where is data stored?
   Donors queried from `donors` collection; hospital coords fetched from `hospitals`.
5. Which function processes it?
   For each eligible candidate, Cloud Function calls FastAPI:
   - POST /predict/availability
   - POST /predict/reliability
   Combined score = (0.5 * availability) + (0.5 * reliability) - (distance_km / 100 * 0.1).
6. Is ML involved?
   YES. Both availability and reliability models are evaluated per candidate.
   Cloud Function also calls LLM service (Ollama or fallback) to generate human-readable explanation.
7. How is the result persisted?
   Top N candidates written to `reservations` collection with status="PENDING".
8. How is the user notified?
   Matched donors see reservation invite immediately via `useReservations` onSnapshot hook.
```

### Operation 3: Donor Accepts / Declines Reservation
```text
1. Who initiates it?
   Donor clicks "Accept" or "Decline" on /donor/requests or /donor/dashboard.
2. Which component receives it?
   Next.js API route: POST /api/reservations/[id]/accept (or /decline).
3. Which component validates it?
   Validates donor ID matches reservation.donorId, reservation is "PENDING".
4. Where is data stored?
   Reservation updated in Firestore: status="ACCEPTED" (or "DECLINED"), respondedAt=now.
5. Which function processes it?
   Cloud Function: `onReservationStatusChanged` (triggered by onDocumentWritten).
6. Is ML involved?
   NO. Deterministic state machine handles fulfillment:
   - Increments request.fulfilledUnits
   - If fulfilledUnits >= unitsRequested, transitions donation_request to "FULFILLED"
   - Updates donor.reliabilityScore metrics (acceptedRequests + 1)
7. How is the result persisted?
   Updates written to `reservations`, `donation_requests`, and `donors`.
8. How is the user notified?
   Hospital dashboard reactive listener (`useDonationRequests`) reflects incremented units.
```

### Operation 4: Inventory Threshold Shortage Alert
```text
1. Who initiates it?
   Hospital staff updates unit count in /hospital/dashboard or blood bank receives units.
2. Which component receives it?
   Firestore write to `blood_inventory/{inventoryId}`.
3. Which component validates it?
   Cloud Function: `onBloodInventoryChanged`.
4. Where is data stored?
   `blood_inventory` collection.
5. Which function processes it?
   Checks if `currentUnits < minimumThreshold`.
   If true, checks if alert was already created within last 24 hours.
6. Is ML involved?
   NO (Rule-based safety threshold check).
7. How is the result persisted?
   Writes alert document to `alerts` collection (severity="HIGH", type="SHORTAGE").
8. How is the user notified?
   Hospital and Admin dashboards listen to `alerts` collection via `useAlerts` hook.
```
