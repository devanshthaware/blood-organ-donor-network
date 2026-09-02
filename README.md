# VeinLink — Unified Blood & Organ Network Intelligence Platform

> **VeinLink** is an AI-powered, real-time Blood & Organ Network Intelligence Platform connecting donors, patients, hospitals, blood banks and transplant coordination centers through predictive intelligence, resource matching, optimization, explainable decision support, real-time coordination and auditable workflows.

---

## 1. Problem Statement Alignment

VeinLink directly addresses the **Blood & Organ Donor Network** problem statement across five interconnected pillars:

```text
                                  VEINLINK
                         HEALTHCARE RESOURCE NETWORK
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
          BLOOD DOMAIN                                  ORGAN DOMAIN
    ┌──────────────────────┐                      ┌──────────────────────┐
    │  • Donor Matching    │                      │  • Organ Registry    │
    │  • Inventory Levels  │                      │  • Recipient Pool    │
    │  • Shortage Forecast │                      │  • Pareto Candidate  │
    │  • Emergency Dispatch│                      │  • Cold Ischemia     │
    │  • 56-Day Cooldown   │                      │  • Human Review Gate │
    └──────────────────────┘                      └──────────────────────┘
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      ▼
                        UNIFIED NETWORK INTELLIGENCE
              ┌───────────────────────────────────────────────┐
              │  • Multi-Horizon Demand Forecasting (v2)      │
              │  • Dynamic Availability & Segmented ETA       │
              │  • Topological Network Graph & Resilience     │
              │  • Pareto Multi-Objective Optimization        │
              │  • Digital Twin Operational Simulation Studio │
              └───────────────────────────────────────────────┘
                                      │
                                      ▼
                        EXPLAINABLE AI (XAI) & TRUST
              ┌───────────────────────────────────────────────┐
              │  • Transparent Trade-Off Explanations         │
              │  • High / Medium / Low Uncertainty Badges     │
              │  • Mandatory Human Review Gate (No Auto-Alloc)│
              │  • Tamper-Evident SHA-256 Hash Chaining       │
              │  • On-Ledger Merkle Proofs (Zero PHI)         │
              └───────────────────────────────────────────────┘
```

### The 5 Core Capabilities

1. **Intelligent Blood Donor Matching & Emergency Allocation**:
   - Geodesic spatial candidate filtering with blood compatibility tables.
   - Decomposed 4-factor donor reliability vector (Acceptance, Attendance, Response, Completion).
   - Invariant: Blood donors with whole-blood donations in the last 56 days are strictly excluded.

2. **Predictive Blood Shortage & Proactive Donor Mobilization**:
   - Multi-horizon forecasting across 5 horizons (6h, 24h, 3d, 7d, 14d) with 90% confidence prediction intervals.
   - Accelerated inventory depletion velocity alarms (d(Inv)/dt >= 3.5 u/hr).
   - Shortage risk detection with up to 72h lead time (+1614% improvement over reactive models).

3. **Real-Time Donor–Hospital Coordination & Logistics**:
   - Dynamic availability modeling P(accept within T min) with circadian response penalties.
   - Segmented arrival ETAs separating donor response delay from real-time road transit.
   - Multi-modal organ transport tracking (air charter, green corridor ambulance) with real-time cold ischemia countdowns.

4. **Explainable & Fair Organ Allocation Decision Support**:
   - Multi-objective Pareto optimization balancing urgency, HLA/crossmatch compatibility, waitlist equity, and donor fatigue.
   - Strict tripartite separation: Match != Recommendation != Authorized Allocation.
   - Anti-Autonomous Invariant: Machine learning provides decision support; authorized human transplant coordinators must review, modify, or approve allocations with recorded clinical justifications.

5. **Unified Blood & Organ Network Intelligence Platform**:
   - Heterogeneous topological graph model evaluating facility degree centrality and regional resilience (0 - 100).
   - Digital twin operational what-if simulation studio testing trauma surges and unit rebalancing.
   - Single-pane Network Command Center (/network) unifying blood and organ operational states.

---

## 2. System Architecture & Boundaries

| Subsystem | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend & UI** | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui | Network Command Center, Organ Review Gate, Emergency Dispatch, Logistics, Provenance |
| **Authentication & RBAC** | Clerk (@clerk/nextjs) | Cryptographic JWT session validation, role enforcement (donor, hospital, admin) |
| **System of Record** | Convex (convex/react, convex/server) | Real-time reactive database, transactional ACID mutations, scheduled crons, audit logging |
| **Inference Boundary** | FastAPI + Python 3.11 | Multi-horizon forecaster, availability, reliability vector, anomaly detector, Pareto optimizer |
| **Workflow Automation** | n8n | HMAC-SHA256 signed event-driven webhooks, multi-tier escalation, dead-letter queues |
| **Trust & Provenance** | Cryptographic Hash Chain + Merkle Tree | Sequential SHA-256 audit chaining, batch Merkle roots, on-ledger proof anchoring |

---

## 3. Authoritative System Safety Invariants

1. **Anti-Autonomous Allocation Invariant**:
   AI algorithms rank candidates and generate transparent explanations. AI has zero authority to commit clinical allocations. Only authenticated medical coordinators can approve or override decisions.
2. **Zero-PHI to External Services Invariant**:
   Strict allowlist scrubbers mathematically bar donor names, emails, phone numbers, and raw coordinates from ML feature vectors, LLM prompts, and on-chain payloads.
3. **56-Day Cooldown Invariant**:
   Blood donors who donated whole blood within the preceding 56 days are blocked from eligibility queries.
4. **Cold Ischemia Viability Invariant**:
   Organs with estimated transport times exceeding safe cold ischemia preservation windows are flagged as infeasible and alerted immediately.
5. **Zero-Block Latency Guarantee**:
   All healthcare database transactions commit instantly in Convex without waiting for blockchain confirmation blocks. Audit proofs are batched and anchored asynchronously.

---

## 4. Navigation & Route Hierarchy

- **/network** — Unified Network Command Center: Real-time operational overview of blood inventory, organ availability, emergency escalations, in-transit logistics, and graph resilience.
- **/blood** — Blood Network Hub: Real-time blood bank inventory, depletion velocities, and active requisitions.
- **/organ** — Organ Network Hub: Organ resource registry, candidate pool matching, and cold ischemia viability tracking.
- **/organ/review** — Organ Allocation Review Screen: Dedicated coordinator review gate displaying candidate alternatives, confidence (86%), uncertainty (MEDIUM), expandable XAI explanation, and APPROVE / MODIFY / REJECT actions.
- **/emergency** — Unified Emergency Coordination: Emergency dispatch for mass trauma blood crises and time-critical organ preservation emergencies.
- **/logistics** — Multi-Modal Logistics Center: Real-time transport tracking, temperature monitoring (2-6°C), and chain of custody.
- **/intelligence** — AI Intelligence Studio: Multi-horizon forecasting, graph topology, and digital twin simulation.
- **/audit** — Audit & Blockchain Provenance: Cryptographic hash chain validator and on-chain Merkle root receipts.
- **/demo** — Hackathon Demonstration Studio: 5-minute guided lifecycle runner and 8 pre-seeded synthetic scenarios.

---

## 5. Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- Python 3.11+ (for ML inference backend)

### Running Locally

```powershell
# Terminal 1: Convex Backend
cd web
npx convex dev

# Terminal 2: Next.js Frontend
cd web
pnpm dev
```

---

## 6. Multi-Domain Verification Suites

VeinLink features 11 comprehensive automated test suites:

```powershell
cd web
pnpm test:e2e-scenario      # Full End-to-End Integration Scenario (18 tests)
pnpm test:intelligence      # Advanced AI & Network Intelligence (27 tests)
pnpm test:governance        # Healthcare Security & Governance (35 tests)
pnpm test:blockchain-trust  # Blockchain Trust & Provenance (23 tests)
pnpm test:n8n-automation    # n8n Workflow Automation (35 tests)
pnpm test:cv-verification   # Computer Vision & Physical Label Verification (22 tests)
pnpm test:organ-logistics   # Organ Logistics & Cold Ischemia Routing (34 tests)
pnpm test:organ-allocation  # Organ Multi-Objective Allocation (24 tests)
pnpm test:organ-matching    # Organ Compatibility & Matching (20 tests)
pnpm test:organ-domain      # Blood & Organ Domain Foundation (28 tests)
pnpm verify:migration       # Migration Invariants (17 tests)
pnpm exec tsc --noEmit      # TypeScript Static Type Check (0 errors)
```

**Total Test Coverage: 301 / 301 tests passing (100% Green).**
