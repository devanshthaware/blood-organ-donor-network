# VeinLink — Predictive Network Intelligence & Decision Support Architecture

## 1. Intelligence Layer Architecture

VeinLink establishes a decoupled, research-grade predictive intelligence layer operating alongside the authoritative Convex System of Record:

```mermaid
flowchart TD
    Convex[(Convex System of Record)] --> Privacy[Privacy Gate: Allowlist Extractor]
    Privacy --> Orchestrator[Intelligence Orchestrator]
    
    Orchestrator --> Forecaster[Multi-Horizon Forecaster (6h - 14d)]
    Orchestrator --> Anomaly[Statistical Anomaly Detector]
    Orchestrator --> Graph[Network Graph & Resilience Engine]
    Orchestrator --> Dynamic[Dynamic Availability & ETA Model]
    Orchestrator --> ReliVector[4-Factor Reliability Vector]
    
    Forecaster --> Pareto[Pareto Multi-Objective Optimizer]
    Dynamic --> Pareto
    ReliVector --> Pareto
    Graph --> Pareto
    
    Pareto --> XAI[Explainable AI Engine]
    XAI --> Coordinator[Transplant / Blood Bank Coordinator]
    Coordinator -->|Authorized Human Approval| Allocation[(Approved Action)]
```

---

## 2. Event-to-Intelligence Routing Table

| Event Emission | Triggered Intelligence Modules | Output Produced |
| :--- | :--- | :--- |
| `blood.request.created` | Dynamic Availability + Pareto Optimizer | Ranked candidate donor shortlist with trade-offs |
| `inventory.updated` | Demand Forecaster + Anomaly Detector | Multi-horizon shortage risk & depletion velocity |
| `donor.accepted` | Dynamic Availability + ETA Engine | Revised arrival timeline & candidate re-ranking |
| `transport.delayed` | Logistics Estimator + Anomaly Detector | Surgical team alert & cold ischemia buffer check |
| `daily.scheduled.cron` | Network Graph + Regional Resilience | Topology centrality & cross-hospital transfer recommendation |
