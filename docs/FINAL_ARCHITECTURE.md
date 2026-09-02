# VeinLink — Final Authoritative System Architecture

```text
================================================================================
VEINLINK: INTELLIGENT BLOOD & ORGAN RESOURCE NETWORK
Status: ARCHITECTURE FROZEN (STEP 12)
Authoritative Architecture Specification
================================================================================
```

## 1. System Overview & Technology Stack

VeinLink is an AI-assisted, privacy-preserving, auditable healthcare resource coordination network designed to predict localized shortages, model healthcare supply topologies, optimize matching and logistics, automate response workflows, and enforce human-governed decision provenance.

```text
Frontend:
Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui

Authentication & Identity:
Clerk (Cryptographic JWT session validation + Role metadata)

Primary System of Record & Reactive State:
Convex (Real-time reactive database, transactional mutations, actions, schedulers)

AI / ML Inference Boundary:
FastAPI + Python ML services (scikit-learn, statistical processes, CV/OCR)

Event-Driven Workflow Automation:
n8n (HMAC-signed Webhook orchestration, multi-tier escalation, dead-letter queues)

Trust & Provenance Layer:
Cryptographic SHA-256 Hash Chain + Merkle Tree Batching + Blockchain Proofs

Physical Verification Intelligence:
Computer Vision (CV) + OCR Inspection Pipeline
```

---

## 2. Complete End-to-End Architectural Hierarchy

```mermaid
flowchart TD
    subgraph UI [User & Presentation Layer]
        NextApp[Next.js 15 Web Application]
        ClerkAuth[Clerk Identity Provider]
        NextApp <--> ClerkAuth
    end

    subgraph SystemOfRecord [Convex System of Record]
        ConvexDB[(Convex Database & Schema)]
        ConvexQueries[Reactive Queries]
        ConvexMutations[Transactional Mutations]
        AuthHelpers[Zero-Trust Policy & Scope Gates]
        ConvexActions[Convex Actions & Schedulers]
        
        ConvexDB <--> ConvexQueries
        ConvexDB <--> ConvexMutations
        ConvexMutations --> AuthHelpers
        ConvexMutations --> ConvexActions
    end

    subgraph IntelligenceLayer [Intelligence & Inference Boundary]
        FastAPIService[FastAPI ML Inference Gateway]
        ForecastingEngine[Multi-Horizon Forecaster 6h-14d]
        AnomalyDetector[Statistical Anomaly & Velocity Detector]
        GraphModel[Healthcare Network Graph Model]
        DynamicAvailability[Dynamic Availability & ETA Engine]
        ReliabilityVector[4-Factor Reliability Vector]
        ParetoOptimizer[Pareto Multi-Objective Ranker]
        DigitalTwin[Digital Twin Simulation Studio]
        
        FastAPIService --> ForecastingEngine
        FastAPIService --> AnomalyDetector
        FastAPIService --> GraphModel
        FastAPIService --> DynamicAvailability
        FastAPIService --> ReliabilityVector
        FastAPIService --> ParetoOptimizer
        FastAPIService --> DigitalTwin
    end

    subgraph AutomationLayer [Event Automation Layer]
        N8nEngine[n8n Workflow Engine]
        EventRouter[HMAC Signed Event Dispatcher]
        DLQueue[Dead-Letter Queue & Retries]
        EscalationMatrix[Multi-Tier Emergency Escalations]
        
        N8nEngine <--> EventRouter
        N8nEngine --> DLQueue
        N8nEngine --> EscalationMatrix
    end

    subgraph TrustLayer [Trust, Provenance & Audit Layer]
        Canonicalizer[JSON Canonicalizer]
        HashChain[Sequential SHA-256 Hash Chain]
        MerkleEngine[Cryptographic Merkle Batcher]
        BlockchainAdapter[Blockchain Anchor Provider]
        
        Canonicalizer --> HashChain
        HashChain --> MerkleEngine
        MerkleEngine --> BlockchainAdapter
    end

    NextApp <-->|Real-Time WebSockets| ConvexQueries
    NextApp -->|Authorized Mutations| ConvexMutations
    ConvexActions <-->|Zero-PHI Vectors| FastAPIService
    ConvexActions -->|HMAC Signed Events| N8nEngine
    ConvexMutations -->|Audit Events| Canonicalizer
```

---

## 3. Strict Architectural Invariants

1. **Clinical Protocols as Authoritative Source of Truth**:
   - Medical eligibility, ABO/Rh compatibility, and cold ischemia thresholds remain hard constraints in Convex code. AI models cannot override or alter clinical rules.
2. **Decision Support vs. Autonomous Authority**:
   - AI models strictly generate advisory predictions, risk signals, and trade-off rankings.
   - Final organ allocation and clinical eligibility decisions require authenticated human coordinator review with recorded justifications for overrides.
3. **Zero-PHI Boundary**:
   - No donor/patient names, phone numbers, email addresses, or exact GPS coordinates may reach ML models, LLM prompts, external webhooks, or on-chain transaction payloads.
4. **Zero-Block Guarantee**:
   - Healthcare transactions execute with zero blockchain latency. Convex transactions commit immediately; cryptographic Merkle roots are anchored asynchronously in batches.
5. **Convex as Sole System of Record**:
   - External services (FastAPI, n8n, Blockchain) are stateless computation or trust engines. State mutations are strictly executed within Convex transactional mutations.
6. **56-Day Cooldown Invariant**:
   - Donors with recent whole blood donations (<56 days) are strictly blocked from blood donation eligibility across all queries and matching engines.
