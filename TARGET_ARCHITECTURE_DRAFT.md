# TARGET_ARCHITECTURE_DRAFT.md — High-Level Target Architecture

## 1. Architectural Vision
The future **Blood & Organ Donor Network** expands upon the real-time, event-driven principles of VeinLink while eliminating infrastructure fragmentation by establishing **Convex** as the single authoritative backend, database, and event-orchestration layer, **Clerk** as the enterprise identity provider, and external microservices for intelligence, optimization, workflow automation, and cryptographic trust.

---

## 2. Target System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Client Presentation Tier                              │
│              Next.js 16 (App Router) + Tailwind CSS + Lucide Icons              │
│                                                                                 │
│   • Donor / Living Donor Portal      • Transplant Center & Hospital Portal      │
│   • Organ Procurement (OPO) Portal   • Network Administrator & Auditor Portal   │
└────────────────────────┬───────────────────────────────▲────────────────────────┘
                         │ User Action (Mutations)       │ Reactive Subscriptions
                         ▼                               │ (Zero-latency useQuery)
┌────────────────────────────────────────────────────────┴────────────────────────┐
│                        Identity & Access Governance                             │
│                                Clerk Auth                                       │
│          Multi-Factor Auth, RBAC Session Tokens, JWKS Verification              │
└────────────────────────┬────────────────────────────────────────────────────────┘
                         │ Authenticated Requests with Claims
                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               Convex Backend                                    │
│                     (Primary Application & Database Layer)                     │
│                                                                                 │
│   ┌──────────────────────────┐  ┌────────────────────────┐  ┌───────────────┐  │
│   │     Reactive Queries     │  │     ACID Mutations     │  │  Convex Crons │  │
│   │    • Live Dashboards     │  │   • Atomic Allocation  │  │ • Expire Stale│  │
│   │    • Real-time Inventory │  │   • State Transitions  │  │   Reservations│  │
│   │    • Logistics Map Feed  │  │   • Audit Trail Append │  │ • Cooldown Run│  │
│   └──────────────────────────┘  └───────────┬────────────┘  └───────────────┘  │
│                                             │ Schedules External I/O            │
│                                             ▼                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                              Convex Actions                             │  │
│   │            (Orchestrates Async Computations & Intelligence)             │  │
│   └────────┬──────────────┬──────────────┬──────────────┬──────────────┬────┘  │
└────────────┼──────────────┼──────────────┼──────────────┼──────────────┼────────┘
             │ HTTP         │ HTTP         │ HTTP         │ Webhook      │ RPC / REST
             ▼              ▼              ▼              ▼              ▼
┌─────────────────┐ ┌────────────────┐ ┌───────────────┐ ┌──────────────┐ ┌───────────────┐
│   FastAPI ML    │ │  Optimization  │ │   CV / OCR    │ │     n8n      │ │  Blockchain   │
│   Microservice  │ │    Engine      │ │  Microservice │ │  Automation  │ │     Trust     │
│                 │ │                │ │               │ │              │ │   Anchor      │
│ • Blood Demand  │ │ • Multi-Factor │ │ • Blood Bag   │ │ • SMS/Email  │ │ • Consent     │
│ • Donor Avail.  │ │   Organ Alloc. │ │   Barcode OCR │ │   Alerts     │ │   Proof Hashes│
│ • Reliability   │ │ • Cold Ischemia│ │ • ABO Match   │ │ • Escalation │ │ • Allocation  │
│ • XAI Explan.   │ │   Optimization │ │   Cross-Check │ │   Flows      │ │   Audit Proof │
└─────────────────┘ └────────────────┘ └───────────────┘ └──────────────┘ └───────────────┘
```

---

## 3. Technology Integration Boundaries

### 3.1 Convex Backend
- **Role:** Single source of truth. Handles data persistence, real-time subscriptions, transactional state machines, and scheduled background tasks.
- **Strict Invariant:** External I/O (network requests, third-party APIs) is **never** executed inside Convex mutations. All external communication runs inside `action` handlers.

### 3.2 Clerk Authentication
- **Role:** Centralized identity and role management.
- **Integration:** Convex verifies Clerk JWTs natively via `convex/auth.config.js`. User identity and role claims (`donor`, `hospital_coordinator`, `transplant_surgeon`, `opo_officer`, `admin`) are verified on every query and mutation.

### 3.3 External Intelligence: FastAPI ML & XAI
- **Role:** Machine learning inference (blood demand, donor availability probability, historical reliability score).
- **Communication:** Invoked solely by Convex Actions. The client browser never interacts directly with FastAPI.
- **Fallback Guarantee:** If the ML service is unreachable, deterministic rule-based algorithms execute immediately to prevent clinical delays.

### 3.4 Optimization Engine (Organ Matching & Allocation)
- **Role:** Solves constrained multi-criteria optimization for organ allocation (matching HLA compatibility, MELD/PELD clinical urgency, pediatric status, geographic distance, and cold ischemia thresholds).
- **Clinical Invariant:** The optimization engine produces candidate rank lists; **final organ acceptance and surgical scheduling strictly require human physician approval**.

### 3.5 Computer Vision / OCR Service
- **Role:** Pre-transfusion and pre-transplant safety verification.
- **Capabilities:** Scans blood bag ISBT 128 barcodes/labels, donor identification wristbands, and organ transport canister seals to detect mismatches before administration.
- **Clinical Invariant:** CV/OCR acts strictly as a double-check verification tool; it does not perform clinical diagnosis.

### 3.6 n8n Workflow Automation
- **Role:** Orchestrates secondary asynchronous workflows (WhatsApp/SMS emergency alerts, logistics escalation notifications, courier dispatch webhooks, hospital staff shifts).
- **Strict Boundary:** n8n is **never** a database, authorization layer, or core transaction processor. It reacts to webhooks dispatched by Convex Actions.

### 3.7 Blockchain Trust & Cryptographic Anchoring
- **Role:** Tamper-evident audit logging for ethical transparency in organ allocation and donor consent verification.
- **Implementation:** Convex hashes critical events (`CONSENT_RECORDED`, `ORGAN_ALLOCATED`, `SURGEON_ACCEPTED`), creating Merkle roots periodically anchored to a public or permissioned ledger (e.g. Polygon / Hedera / Ethereum L2).
- **Privacy Guarantee:** **Zero Protected Health Information (PHI) or personal data is ever stored on-chain.** Only cryptographic hashes and zero-knowledge proofs are anchored.

### 3.8 AI Agents (Logistics & Coordination Assistants)
- **Role:** Specialized assistant agents (e.g., organ transit flight tracker, weather anomaly predictor, cold-chain monitor).
- **Governance Invariant:** AI agents serve as advisory coordinators. They **never** make autonomous clinical decisions or bypass human authorization.
