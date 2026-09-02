# VeinLink — Technical Requirements Document (TRD)

| **Document Title** | VeinLink: Unified Blood & Organ Network Intelligence Platform |
| :--- | :--- |
| **Document Type** | Technical Requirements Document (TRD) |
| **Version** | 2.0.0 |
| **Status** | Approved / Active Architecture Spec |
| **Target Infrastructure** | Convex Core (Real-Time Reactive V8 Sandbox), Clerk Auth, FastAPI ML, n8n Automation, Blockchain Provenance |
| **Author** | Antigravity AI & Core Engineering Team |

---

## 1. Architectural Principles & Invariants

VeinLink enforces five non-negotiable architectural invariants:

1. **Frontend-ML Decoupling:** Client applications (Next.js frontend) must **never** invoke the Machine Learning inference API directly. All predictions, evaluations, and rank calculations are orchestrated through server-side Convex actions.
2. **Convex as the Reactive System of Record:** Every persistent entity state and transition resides in Convex. Systems interact asynchronously through transactional ACID mutations and event triggers.
3. **Anti-Autonomous Clinical Allocation Invariant:** Machine learning operates exclusively as decision support. Final clinical organ allocation decisions require authenticated coordinator review with recorded clinical reasons for any override.
4. **Strict Algorithmic Explainability & Uncertainty:** Every machine learning output is accompanied by feature inputs, model confidence scores, uncertainty tiers, and structured explanations.
5. **Zero-PHI to External Services:** Allowlist scrubbers mathematically bar donor PII and raw coordinates from ML models, LLMs, and on-chain proofs.

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 Web Tier                      │
│      React 19 Server Components & Client Hooks (TypeScript) │
└──────────────────────────────┬──────────────────────────────┘
                               │ Writes events / Real-time snapshot listeners
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Google Cloud Firestore (NoSQL)              │
│                System of Record & Event Stream              │
│                                                             │
│   • users              • donation_requests   • ml_outputs   │
│   • donors             • reservations        • alerts       │
│   • hospitals          • blood_inventory     • ai_events    │
│   • checkup_requests   • audit_logs                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Event triggers: onDocumentCreated, onDocumentWritten
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Firebase Cloud Functions (v2 Engine)            │
│                 Node.js 24 / TypeScript 5.7                 │
│                                                             │
│  • onDonationRequestCreated   • onDemandForecastCreated     │
│  • onReservationStatusChanged • onBloodInventoryChanged     │
│  • onDonorCreated             • logAudit & writeAIEvent     │
└──────────────┬───────────────────────────────┬──────────────┘
               │ HTTP POST                     │ Prompt generation & fallback
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│    FastAPI ML Microservice   │ │   LLM Explanation Engine   │
│      Python 3.8+ / Uvicorn   │ │     (contracts/llm_*)      │
│                              │ │                            │
│  • /predict/demand           │ │  • OpenAI (gpt-4o-mini)    │
│  • /predict/reliability      │ │  • Anthropic (Claude-3)    │
│  • /predict/availability     │ │  • Hugging Face / Gemma    │
│  • Joblib In-Memory Caching  │ │  • Deterministic Fallback  │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 3. Database Schema & Data Models (Cloud Firestore)

### 3.1 Core Collections Schema

#### Collection: `users`
```typescript
interface UserDocument {
  id: string;                      // Firebase Auth UID
  email: string;
  role: "donor" | "hospital" | "admin";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

#### Collection: `donors`
```typescript
interface DonorDocument {
  id: string;                      // Linked to user ID
  fullName: string;
  bloodType: "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";
  donorStatus: "PENDING" | "APPROVED" | "REJECTED";
  isActive: boolean;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  reliabilityScore: number;         // Range: 0.0 - 1.0 (default: 0.5)
  reliabilityUpdatedAt: FirebaseFirestore.Timestamp;
  totalRequests: number;
  acceptedRequests: number;
  completedDonations: number;
  noShows: number;
  pastAcceptanceRate: number;       // Ratio: acceptedRequests / totalRequests
  avgResponseTimeMinutes: number;
  lastDonationDate?: FirebaseFirestore.Timestamp;
  healthStatus?: "FIT" | "UNFIT" | "TEMPORARILY_UNAVAILABLE";
  createdAt: FirebaseFirestore.Timestamp;
}
```

#### Collection: `hospitals`
```typescript
interface HospitalDocument {
  id: string;
  name: string;
  address: string;
  region: number;                   // Geographic region code (0, 1, 2, ...)
  location: {
    lat: number;
    lng: number;
  };
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}
```

#### Collection: `donation_requests`
```typescript
interface DonationRequestDocument {
  id: string;
  hospitalId: string;
  bloodGroup: "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";
  quantity: number;                 // Units required
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "MATCHING" | "PARTIALLY_FULFILLED" | "FULFILLED" | "CANCELLED";
  region?: number;
  notes?: string;
  createdBy: string;                // User UID
  createdAt: FirebaseFirestore.Timestamp;
  fulfilledAt?: FirebaseFirestore.Timestamp;
}
```

#### Collection: `reservations`
```typescript
interface ReservationDocument {
  id: string;
  requestId: string;
  donorId: string;
  hospitalId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  rank: number;                     // Position in matching candidate queue
  mlScores: {
    availability: number;           // 0.0 - 1.0
    reliability: number;            // 0.0 - 1.0
    combined: number;               // (0.60 * availability) + (0.40 * reliability)
  };
  distanceKm: number;
  explanation: string;              // High-level summary string
  llmExplanation?: {
    source: "llm" | "fallback";
    title: string;
    summary: string;
    bullets: string[];
    confidence: "LOW" | "MEDIUM" | "HIGH";
  };
  createdAt: FirebaseFirestore.Timestamp;
  confirmedAt?: FirebaseFirestore.Timestamp;
}
```

#### Collection: `blood_inventory`
```typescript
interface BloodInventoryDocument {
  id: string;                      // Composite: `${hospitalId}_${bloodGroup}`
  hospitalId: string;
  bloodGroup: "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";
  region: number;
  supplyUnits: number;
  demandUnits: number;
  month: number;                   // 1 - 12
  day: number;                     // 1 - 31
  updatedAt: FirebaseFirestore.Timestamp;
}
```

#### Collection: `ai_events` (Observability & Monitoring)
```typescript
interface AIEventDocument {
  id: string;
  modelName: string;
  modelType: "demand_forecasting" | "donor_availability" | "donor_reliability";
  modelVersion: string;
  inputSummary: Record<string, unknown>;
  outputSummary: Record<string, unknown>;
  status: "SUCCESS" | "FAILED";
  triggerSource: string;
  requestId?: string;
  reservationId?: string;
  executionTimeMs?: number;
  confidence?: number;
  errorMessage?: string;
  createdAt: FirebaseFirestore.Timestamp;
}
```

#### Collection: `audit_logs` (Immutable Governance)
```typescript
interface AuditLogDocument {
  id: string;
  userId: string;
  userEmail: string;
  action: "REQUEST_CREATED" | "RESERVATION_ACCEPTED" | "RESERVATION_DECLINED" | "RESERVATION_COMPLETED" | "INVENTORY_CHANGED";
  resourceType: "donation_request" | "reservation" | "blood_inventory" | "donor";
  resourceId: string;
  ipAddress: string;
  timestamp: FirebaseFirestore.Timestamp;
  result: "SUCCESS" | "FAILURE" | "ERROR";
  details: Record<string, unknown>;
  errorMessage?: string;
}
```

---

## 4. Cloud Functions v2 Orchestration Specifications

All functions run on the **Firebase Functions v2** architecture backed by Cloud Run.

### Configuration & Runtime Environment
- **Node.js Runtime:** Node 24 (`functions/package.json`)
- **Global Options:** `maxInstances: 10`, `timeoutSeconds: 60`, `memory: "256MiB"`.

### 4.1 Function: `onDonationRequestCreated`
- **Trigger:** `onDocumentCreated("donation_requests/{requestId}")`
- **Execution Logic:**
  1. Validates presence of `hospitalId`, `bloodGroup`, `quantity`, and `urgency`.
  2. Resolves `region` from the hospital document if missing.
  3. Prepares ML demand payload:
     - Encodes blood group (`O-`: 0, `O+`: 1, `A-`: 2, `A+`: 3, `B-`: 4, `B+`: 5, `AB-`: 6, `AB+`: 7).
     - Gathers `month` and `day`.
  4. Calls `POST /predict/demand` on the ML microservice.
  5. Writes ML response to `ml_outputs/demand_{requestId}`.
  6. If urgency is `CRITICAL`, immediately triggers emergency supply warning alert to regional facilities.
  7. Writes to `audit_logs` and `ai_events`.

### 4.2 Function: `onDemandForecastCreated` (Donor Matching Engine)
- **Trigger:** `onDocumentCreated("ml_outputs/{mlOutputId}")` where `modelType == "demand_forecasting"`.
- **Execution Logic:**
  1. Extracts `requestId` from document ID (`demand_{requestId}`).
  2. Resolves target hospital's latitude/longitude coordinates.
  3. **Stage 1 (Rule-Based Filtering):**
     - Queries `donors` where `bloodType == request.bloodGroup` AND `isActive == true`.
     - Checks donation cooldown: $\text{Current Date} - \text{lastDonationDate} \ge 56\text{ days}$.
     - Checks health fitness: `healthStatus != 'UNFIT'`.
     - Computes Haversine geodesic distance:
       $$\text{Distance Limit} = \begin{cases} 100\text{ km} & \text{if Urgency} = \text{LOW} \\ 75\text{ km} & \text{if Urgency} = \text{MEDIUM} \\ 50\text{ km} & \text{if Urgency} = \text{HIGH} \\ 100\text{ km} & \text{if Urgency} = \text{CRITICAL} \end{cases}$$
       Discards any donor where $\text{distanceKm} > \text{Distance Limit}$.
  4. **Stage 2 (ML Scoring & Inference):**
     - For each candidate, calls `POST /predict/availability` (inputs: `distance_km`, `time_of_day`, `urgency_level`, `days_since_last_donation`, `past_acceptance_rate`).
     - Calls `POST /predict/reliability` (inputs: `total_requests`, `accepted_requests`, `completed_donations`, `no_shows`, `avg_response_time_minutes`).
     - Calculates combined score:
       $$\text{Combined Score} = (0.60 \times \text{Availability}) + (0.40 \times \text{Reliability})$$
  5. **Stage 3 (Threshold Verification):**
     - $\text{Availability} \ge 0.30$
     - $\text{Reliability} \ge 0.20$
     - $\text{Combined Score} \ge 0.35$
     (Candidates failing thresholds are logged and excluded).
  6. **Stage 4 (Explainable AI Synthesis):**
     - Invokes `generateInsight()` sending donor and request metadata.
     - Formulates structured output (`AIInsight`).
  7. **Stage 5 (Reservation Dispatch):**
     - Sorts qualified candidates descending by $\text{Combined Score}$.
     - Batches top $N = \min(\text{Candidates}, \text{Quantity} \times 2)$ documents into `reservations` in `PENDING` status.

### 4.3 Function: `onReservationStatusChanged`
- **Trigger:** `onDocumentWritten("reservations/{reservationId}")`
- **Execution Logic:**
  - Evaluates transitions:
    - `PENDING` $\rightarrow$ `ACCEPTED`: Automatically confirms the reservation (`CONFIRMED`), stamps `confirmedAt`, and increments donor's `acceptedRequests` and `totalRequests`.
    - `PENDING` $\rightarrow$ `DECLINED`: Increments donor's `totalRequests`, leaving acceptance rate adjusted.
    - `CONFIRMED` $\rightarrow$ `COMPLETED`: Increments donor's `completedDonations`, updates `lastDonationDate`, and checks if sum of completed reservations satisfies requested unit volume to transition `donation_requests/{id}` to `FULFILLED`.

### 4.4 Function: `onBloodInventoryChanged` (Shortage Predictor)
- **Trigger:** `onDocumentWritten("blood_inventory/{inventoryId}")`
- **Execution Logic:**
  1. Detects substantial supply/demand shifts ($|\Delta \text{units}| > 2$).
  2. Queries `POST /predict/demand` with live stock parameters.
  3. If $\text{predicted\_demand} \ge 0.70$, generates a `CRITICAL` regional shortage alert broadcast to all regional hospitals.
  4. If $\text{predicted\_demand} \ge 0.50$, generates a `HIGH` priority alert.
  5. Writes prediction log to `ml_outputs/shortage_{inventoryId}`.

---

## 5. Machine Learning API Specifications (`ml-backend`)

The Python ML microservice is developed with **FastAPI** and served via **Uvicorn**.

### 5.1 Encodings & Value Normalization
```python
BLOOD_GROUP_MAP = {
    "O-": 0, "O+": 1, "A-": 2, "A+": 3,
    "B-": 4, "B+": 5, "AB-": 6, "AB+": 7
}

URGENCY_MAP = {
    "LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3
}

TIME_OF_DAY_MAP = {
    "MORNING": 0,    # 05:00 - 11:59
    "AFTERNOON": 1,  # 12:00 - 16:59
    "EVENING": 2,    # 17:00 - 21:59
    "NIGHT": 3       # 22:00 - 04:59
}
```

### 5.2 API Endpoints

#### Endpoint: `POST /predict/demand`
- **Pydantic Request Schema:**
```python
class DemandRequest(BaseModel):
    region: int
    blood_group: int          # 0 - 7
    demand_units: int
    supply_units: int
    month: int                # 1 - 12
    day: int                  # 1 - 31
```
- **Response Schema:**
```json
{
  "predicted_demand": 0.824
}
```

#### Endpoint: `POST /predict/reliability`
- **Pydantic Request Schema:**
```python
class ReliabilityRequest(BaseModel):
    total_requests: int
    accepted_requests: int
    completed_donations: int
    no_shows: int
    avg_response_time_minutes: float
```
- **Response Schema:**
```json
{
  "reliability_score": 0.885
}
```

#### Endpoint: `POST /predict/availability`
- **Pydantic Request Schema:**
```python
class AvailabilityRequest(BaseModel):
    distance_km: float
    time_of_day: int          # 0 - 3
    urgency_level: int        # 0 - 3
    days_since_last_donation: int
    past_acceptance_rate: float
```
- **Response Schema:**
```json
{
  "availability_probability": 0.742
}
```

---

## 6. Explainable AI (XAI) System Contract

### 6.1 TypeScript Contract (`contracts/llm_contract.ts`)
```typescript
export type InsightSource = "llm" | "fallback";

export interface LLMInput {
  role: "donor" | "hospital" | "admin";
  screen:
    | "donor_dashboard"
    | "hospital_dashboard"
    | "request_detail"
    | "reservation"
    | "alert"
    | "admin_monitor";
  event:
    | "donor_match"
    | "request_created"
    | "reservation_confirmed"
    | "emergency_alert";
  data: Record<string, any>;
}

export interface AIInsight {
  source: InsightSource;
  title: string;
  summary: string;
  bullets: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
}
```

### 6.2 Fallback Logic Engine
If the external LLM provider fails or times out ($>2500$ ms), `functions/src/llm/fallback.ts` constructs a deterministic response:
- Matches suitability level:
  - $\ge 70\%$: `"Highly Suitable"`
  - $50\% - 69\%$: `"Moderately Suitable"`
  - $35\% - 49\%$: `"Low Suitability"`
- Builds verifiable bullet points based directly on raw feature inputs (e.g. `"${distanceKm.toFixed(1)} km from facility"`, `"${daysSinceLastDonation} days since previous donation"`).
- Sets `source: "fallback"`.

---

## 7. Security Architecture & RBAC

### 7.1 Declarative Firestore Security Rules (`firestore.rules`)
- **Authentication Required:** All read/write requests must carry a valid Firebase Auth JWT.
- **Role Isolation:**
  - `donors`: Read their own profile (`request.auth.uid == donorId`). Can only update status on assigned reservations (`ACCEPTED` or `DECLINED`).
  - `hospitals`: Create and manage `donation_requests` where `hospitalId == request.auth.token.hospitalId`.
  - `admins`: Read-only access to all collections; write access to system configuration and verification flags.
  - `functions`: Execute via Firebase Admin SDK with elevated service account rights.

---

## 8. Frontend Engineering Architecture (`web`)

- **Routing Model:** Next.js 16 App Router.
- **Directory Structure:**
  - `src/app/donor/`: Dashboard, Request Radar, Map, Donation History.
  - `src/app/hospital/`: Dashboard, Request Dispatcher, Candidate Viewer, Inventory Manager.
  - `src/app/admin/`: Live AI Monitor, Audit Explorer.
- **Spatial UI Component:** `LeafletLocationPicker.tsx` / `HospitalMap.tsx`
  - Uses Leaflet 1.9 & React-Leaflet with OpenStreetMap tiles.
  - Dynamically calculates distance and renders search radius perimeter circles.
- **Telemetry Hook:** `useAIEvents.ts`
  - Opens real-time Firestore collection listener (`ai_events`) ordered descending by timestamp with configurable limit (100).

---

## 9. Local Development & Deployment Infrastructure

### 9.1 Local Port & Network Allocation
| Service | Technology | Default Port | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | Next.js Dev Server | `3000` | `http://localhost:3000` |
| **ML Inference Service**| FastAPI / Uvicorn | `8000` | `http://127.0.0.1:8000` (Swagger at `/docs`) |
| **Firestore Emulator** | Firebase CLI / Java | `8080` | Local emulator storage |
| **Auth Emulator** | Firebase CLI / Java | `9099` | Local JWT issuer |
| **Functions Emulator** | Firebase CLI / Node | `5001` | Serverless trigger runner |
| **Emulator UI** | Firebase Web Console | `4000` | Local dashboard explorer |

### 9.2 Production Deployment Pipeline
1. **Firestore Rules & Indexes:**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
2. **Cloud Functions v2:**
   ```bash
   cd functions && npm run build
   firebase deploy --only functions
   ```
3. **ML Microservice (Cloud Run Container):**
   - Package `ml-backend` with Docker container (`FROM python:3.11-slim`).
   - Deploy to **Google Cloud Run** with min instances = 1 (to eliminate cold starts).
   - Inject environment variable: `ML_API_URL` pointing to Cloud Run domain.
4. **Next.js Web Frontend:**
   - Deploy to **Firebase App Hosting** or **Vercel** with custom domain and SSL termination.

---

## 10. Performance, Reliability & Scalability Targets

| Metric | Target | Enforced Mechanism |
| :--- | :--- | :--- |
| **ML API Response Time** | $\le 150$ ms | In-memory Joblib model caching |
| **Cloud Function Execution** | $\le 2000$ ms | Async event batching & parallel HTTP calls |
| **Database Retrieval** | $\le 50$ ms | Firestore Composite Indexes on status & timestamps |
| **Database Concurrency** | 10,000 writes/sec | Distributed Firestore partition keys |
| **Failure Tolerance** | 100% | Circuit breaker to deterministic fallback |
