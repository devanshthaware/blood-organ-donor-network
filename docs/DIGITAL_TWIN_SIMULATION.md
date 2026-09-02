# VeinLink — Digital Twin Healthcare Simulation Studio

## 1. Digital Twin Architecture

The Digital Twin maintains an in-memory synthetic sandbox reflecting real-time facility inventory, regional consumption velocity, and active donor pools. Hospital coordinators can simulate high-impact interventions without dispatching live outreach or modifying patient data.

```mermaid
sequenceDiagram
    participant Coordinator as Medical Coordinator
    participant Studio as Simulation Studio (/admin/intelligence/simulation)
    participant Twin as Digital Twin Engine
    participant Convex as Convex Database

    Coordinator->>Studio: Select Intervention (e.g. +25 Donors, 2x Surge)
    Studio->>Twin: Run What-If Simulation
    Twin->>Twin: Project Stock Runway, Net Units & Resilience
    Twin->>Convex: Log Simulation Run (Record & Provenance)
    Twin-->>Studio: Return Comparative Forecast & Recommendation
    Studio-->>Coordinator: Display Baseline vs Projected Metrics
```

---

## 2. Supported Scenarios
1. **Targeted Donor Mobilization**: Simulates notifying $N$ candidates with empirical acceptance yield (~38%) to estimate runway extension in hours.
2. **Inter-Hospital Unit Transfer**: Simulates rebalancing $M$ units from surplus facility to deficit facility.
3. **Emergency Trauma Shock**: Simulates $1.5\times - 5.0\times$ mass casualty surges to compute remaining runway before stockout.
