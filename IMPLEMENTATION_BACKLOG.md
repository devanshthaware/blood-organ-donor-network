# IMPLEMENTATION_BACKLOG.md — Phased Engineering Roadmap

## 1. Executive Summary
This backlog breaks down the complete evolution of VeinLink into a production-grade **Blood & Organ Donor Network** across 12 structured phases. Each task defines explicit dependencies, affected modules, priority, complexity, and risk factors.

---

## 2. Master Phased Task Ledger

### PHASE 1: Firebase → Convex + Clerk Foundation Migration
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T1.1** | Install & Configure Clerk | Replace Firebase Auth with enterprise JWT auth | None | `web/src/app/layout.tsx`, `middleware.ts`, `auth/*` | P0 | Low | Low |
| **T1.2** | Install & Initialize Convex | Establish Convex schema and client provider | None | `convex/*`, `web/src/lib/convex.tsx` | P0 | Low | Low |
| **T1.3** | Clerk-Convex Identity Link | Connect Clerk JWT template to Convex `auth.config.js` | T1.1, T1.2 | `convex/auth.config.js`, `convex/users.ts` | P0 | Medium | Medium |
| **T1.4** | Migrate Core Firestore Collections | Implement Convex schema validators for existing blood collections | T1.2 | `convex/schema.ts` | P0 | Medium | Low |
| **T1.5** | Migrate Realtime Hooks to Queries | Convert 12 `onSnapshot` hooks to typed Convex `useQuery` | T1.4 | `web/src/hooks/*`, `web/src/components/*` | P0 | Medium | Low |
| **T1.6** | Migrate Next.js API Routes to Mutations | Port 9 server routes to transactional Convex mutations | T1.4 | `convex/requests.ts`, `reservations.ts`, `patients.ts` | P0 | Medium | Medium |
| **T1.7** | Migrate Cloud Functions to Convex Actions | Port matching, state machine, and alerts from `functions/src/index.ts` | T1.6 | `convex/matching.ts`, `convex/alerts.ts`, `convex/ml.ts` | P0 | High | High |
| **T1.8** | Decommission Firebase Packages | Remove `firebase`, `firebase-admin`, `firebase-functions` | T1.1–T1.7 | `web/package.json`, `functions/` | P1 | Low | Low |

---

### PHASE 2: Domain Foundation & Common Abstractions
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T2.1** | Medical Facility Abstraction | Generalize `hospitals` to support Blood Banks, OPOs, and Transplant Centers | T1.4 | `convex/schema.ts`, `convex/facilities.ts` | P0 | Medium | Low |
| **T2.2** | Normalized Address & Geocoding | Unified spatial location schema with Haversine distance index | T1.4 | `convex/schema.ts`, `web/src/lib/distance-utils.ts` | P1 | Low | Low |
| **T2.3** | Generic Audit & Event Stream | Centralized audit log mutation supporting blood and organ events | T1.4 | `convex/audit.ts` | P0 | Low | Low |

---

### PHASE 3: Organ Domain Model & Registry
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T3.1** | Recipient Waitlist Schema | Data model for organ recipients (MELD, CPRA, waiting time, medical urgency) | T2.1 | `convex/schema.ts`, `convex/recipients.ts` | P0 | High | High |
| **T3.2** | Deceased & Living Organ Donor Schema | Clinical tracking of organ donors, anatomical viability, and clinical tests | T2.1 | `convex/schema.ts`, `convex/organDonors.ts` | P0 | High | High |
| **T3.3** | Organ Asset Lifecycle Tracking | Tracking organ from crossclamp to transplant with cold ischemia countdown | T3.2 | `convex/schema.ts`, `convex/organs.ts` | P0 | High | High |
| **T3.4** | Legal Consent & Brain Death Certification | Mandatory digital signatures, 2-physician attestation, OPO consent | T3.2 | `convex/consent.ts`, `web/src/app/opo/*` | P0 | Medium | High |

---

### PHASE 4: Matching Engines (Blood & Organ)
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T4.1** | Decouple Blood Matching into Convex | Pure Convex mutation running blood compatibility and radius filter | T1.7 | `convex/bloodMatching.ts` | P0 | Medium | Medium |
| **T4.2** | Multi-Locus HLA & Virtual Crossmatch | Organ immunological compatibility matching (HLA-A, B, C, DR, DQ, PRA) | T3.1, T3.2 | `convex/organMatching.ts` | P0 | High | High |
| **T4.3** | Deterministic Match Fallbacks | Fail-safe heuristic matching if external scoring services fail | T4.1, T4.2 | `convex/fallbacks.ts` | P0 | Medium | High |

---

### PHASE 5: Policy-Constrained Organ Allocation
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T5.1** | Sequential Time-Bound Allocation Queue | Ranked candidate queue giving candidate centers 30 mins to accept/decline | T4.2 | `convex/allocations.ts`, `ctx.scheduler` | P0 | High | High |
| **T5.2** | Human-in-the-Loop Multi-Signoff | UI and mutation requiring transplant surgeon and OPO acceptance | T5.1 | `web/src/app/hospital/allocations/*` | P0 | Medium | Medium |
| **T5.3** | Allocation Refusal Logging | Formal capture of medical reasons for offer refusal for audit compliance | T5.1 | `convex/allocations.ts`, `convex/audit.ts` | P0 | Low | Low |

---

### PHASE 6: Logistics & Cold-Chain Transit
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T6.1** | Transport Request & Dispatch | Model emergency ground/air transport for procured organs | T3.3, T5.2 | `convex/transport.ts` | P1 | Medium | Medium |
| **T6.2** | Real-Time Transit GPS & Temperature Telemetry | Live streaming of transport coordinates and canister temperatures | T6.1 | `convex/telemetry.ts`, `web/src/components/map/*` | P1 | High | Medium |
| **T6.3** | Cold Ischemia Window Violation Alerts | Automated alerts when transit delay threatens organ preservation window | T6.2, T3.3 | `convex/alerts.ts` | P0 | Medium | High |

---

### PHASE 7: Computer Vision & Pre-Transfusion Verification
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T7.1** | CV / OCR Microservice Setup | FastAPI service running pyzbar / EasyOCR for blood bag barcode scanning | None | `cv-service/*` | P2 | Medium | Low |
| **T7.2** | Blood Bag & Canister Seal Verification | Action calling CV service to verify blood group and bag expiration date | T7.1, T1.4 | `convex/verification.ts`, `web/src/components/scanner/*` | P1 | Medium | Medium |

---

### PHASE 8: n8n Workflow Automation
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T8.1** | n8n Webhook Outbox in Convex | Convex Action dispatches non-blocking notifications to n8n | T1.4 | `convex/webhooks.ts` | P2 | Low | Low |
| **T8.2** | Multi-Channel Escalation Flows | WhatsApp, SMS, and email alerts for emergency blood & organ alerts | T8.1 | `n8n/workflows/*` | P2 | Medium | Low |

---

### PHASE 9: Blockchain Trust & Cryptographic Anchoring
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T9.1** | Merkle Tree Audit Batching | Hash allocation decisions and consent records into verifiable Merkle roots | T2.3, T5.3 | `convex/merkle.ts` | P2 | Medium | Low |
| **T9.2** | Smart Contract Event Anchoring | Anchor Merkle root to public testnet (Polygon/Arbitrum) without PHI | T9.1 | `contracts/Anchor.sol`, `convex/blockchain.ts`| P2 | Medium | Low |

---

### PHASE 10: Explainable AI & Advisory Agents
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T10.1** | Structured Match Insights | Maintain strict XAI explanations for donor and recipient matching | T4.1, T4.2 | `convex/xai.ts`, `contracts/llm_contract.ts`| P1 | Medium | Low |
| **T10.2** | Advisory Logistics Agent | AI agent advising on shortest transport routes and weather risks | T6.2 | `convex/agents.ts` | P2 | High | Low |

---

### PHASE 11: Governance, Compliance & Privacy Hardening
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T11.1** | Row-Level Security Enforcers | Verify caller identity against resource tenancy across all queries/mutations | T1.3, T1.4 | `convex/auth-helpers.ts` | P0 | Medium | High |
| **T11.2** | PII Masking & PHI Scrubbing | Automatic redaction of patient/donor identities in logs and shared views | T2.3 | `convex/audit.ts` | P0 | Low | Medium |

---

### PHASE 12: Testing, Performance Optimization & Production Hardening
| ID | Task | Purpose | Dependencies | Affected Modules | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| **T12.1** | Automated Test Suite | Vitest unit and integration tests for matching algorithms and state transitions | All | `tests/*` | P0 | Medium | Low |
| **T12.2** | Stress & Cold-Start Benchmark | Benchmark Convex queries and ML inference latency under concurrent load | All | `benchmarks/*` | P1 | Medium | Low |
