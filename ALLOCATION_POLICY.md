# VeinLink — Organ Allocation Policy Specification

**Policy Version**: `2026.1-NATIONAL-ALLOCATION-POLICY`  
**Algorithm Version**: `1.0.0-MULTI-OBJECTIVE-OPTIMIZER`  
**Classification**: Multi-Objective Allocation Governance Policy  

---

## 1. Fairness Invariants & Governance Principles

1. **Non-Discrimination Invariant**: Protected demographic, financial, and personal characteristics are excluded from all objective calculations.
2. **Equitable Waiting Time**: Cumulative active waitlist duration contributes positively ($w = 0.25$) to prevent waitlist stagnation while balancing immediate emergency urgency ($w = 0.35$).
3. **Logistical Geographic Balance**: Balances local transplant feasibility with national equity to prevent regional organ retention monopolies.
4. **Reproducibility Invariant**: Given the same organ, candidate pool, and policy configuration, the deterministic multi-objective optimizer produces identical candidate rankings and objective breakdowns.

---

## 2. Objective Weights & Normalization Formulas

| Objective Dimension | Weight ($w_i$) | Normalization Function | Policy Rationale | Status |
| :--- | :---: | :--- | :--- | :--- |
| **Clinical Urgency** | `0.35` | `CRITICAL: 1.0`, `HIGH: 0.75`, `MEDIUM: 0.50`, `LOW: 0.25` | Prioritize patients with severe mortality risks. | **Implemented** |
| **Waitlist Equity** | `0.25` | $\min(1.0, \frac{\text{Wait Days}}{180})$ | Reward continuous patient waiting duration equitably. | **Implemented** |
| **Logistics Efficiency** | `0.20` | $\max(0.0, 1.0 - \frac{\text{Distance}}{1500})$ | Account for transit time and procurement feasibility. | **Implemented** |
| **Cold Ischemia Viability** | `0.15` | $\min(1.0, \frac{\text{Remaining Hours}}{\text{Transit Hours} \times 2})$ | Ensure organ viability upon operating room arrival. | **Implemented** |
| **Data Completeness** | `0.05` | Verified fields ratio ($\in [0.0, 1.0]$) | Promote reliable telemetry and clinical records. | **Implemented** |

---

## 3. Tie-Breaking Hierarchy

When two candidates produce identical composite scores, ties are broken deterministically using the following order:
1. Higher clinical urgency tier.
2. Verified active waitlist duration.
3. Shorter logistical transit distance.
4. Earliest request creation timestamp (`request.createdAt`).

---

## 4. Policy Implementation Taxonomy

### Implemented Rules (Active in Code)
- Pre-optimization eligibility gate (available organ, active request, verified recipient, unexpired preservation clock).
- 5-factor normalized multi-objective scoring.
- Deterministic ranking with timestamp tie-breaking.
- Pareto optimality detection across objective profiles.
- Mandatory coordinator approval check.
- Mandatory human override justification enforcement.
- Structured rejection categorization.

### Configured Rules (Data-Driven Parameters)
- Objective weights (`0.35, 0.25, 0.20, 0.15, 0.05`).
- Maximum logistical transit cutoff (`1500 km`).
- Minimum cold ischemia buffer (`1.0 hour`).

### Future Extensions (Not in Step 5)
- **Donor-Specific Antibodies (DSA) MFI Scoring**: Marked as **Future** (requires laboratory bead assay integration).
- **Survival Benefit Modeling (Life-Years Gained)**: Marked as **Future** (requires epidemiological survival models).
- **Multi-Organ Combined Allocations**: Marked as **Future** (e.g. Heart-Lung, Kidney-Pancreas).
