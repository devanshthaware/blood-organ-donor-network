# VeinLink — Graph-Based Healthcare Network Modeling & Topological Resilience

## 1. Graph Topology Specification

The healthcare network is represented as a heterogeneous topological graph:
- **Node Types**: `DONOR`, `HOSPITAL`, `BLOOD_BANK`, `REQUEST`, `REGION`.
- **Edge Types**:
  - `SUPPLY_LINK`: Directed edge from donor or blood bank to hospital with historical transit frequency as weight.
  - `REQUEST_AT`: Requisition linked to host facility.
  - `LOCATED_IN`: Facility and donor spatial containment in administrative region.

---

## 2. Degree Centrality & Dependency

$$\text{Centrality}(v) = \deg(v) = |\{e \in E \mid v \in e\}|$$

Hospitals with high degree centrality act as regional hubs; facilities with low connectivity or high single-node dependency are flagged for proactive supply rebalancing.

---

## 3. Regional Resilience Score

$$\text{Resilience} = S_{\text{supply}} (40\text{ pts}) + S_{\text{donor}} (35\text{ pts}) + S_{\text{network}} (25\text{ pts})$$

- **Tier Classification**:
  - `ROBUST`: $\ge 85$
  - `STABLE`: $65 - 84$
  - `VULNERABLE`: $40 - 64$
  - `CRITICAL_DEFICIT`: $< 40$
