# VeinLink — Organ Matching Policy Specification

**Policy Version**: `2026.1-NATIONAL-ORGAN-MATCHING-POLICY`  
**Algorithm Version**: `1.0.0-DETERMINISTIC-MULTIOBJ`  
**Classification**: Decision-Support & Candidate Recommendation Policy  

---

## 1. Governance & Fairness Principles

1. **Non-Discrimination Invariant**: The matching policy strictly excludes any personal demographic, financial, social status, or protected characteristics from the scoring engine.
2. **Equitable Waiting Time**: Waiting time contributes positively to the candidate score without overriding immediate clinical emergency urgency.
3. **Geographic Equity**: Logistics feasibility accounts for preservation windows while preventing regional organ monopolization.
4. **Transparency & Auditability**: Every candidate score calculation must be reproducible, with factor contributions recorded under an explicit `policyVersion`.

---

## 2. Policy Factor Weights & Thresholds

| Factor | Weight ($w_i$) | Normalization Formula | Policy Justification | Status |
| :--- | :---: | :--- | :--- | :--- |
| **Medical Urgency** | `0.35` | `CRITICAL: 1.0`, `HIGH: 0.75`, `MEDIUM: 0.50`, `LOW: 0.25` | Prioritize patients with critical survival needs. | **Implemented** |
| **Waitlist Duration** | `0.25` | $\min(1.0, \frac{\text{Days Waiting}}{180})$ | Reward continuous active registration time equitably. | **Implemented** |
| **Geographic Feasibility** | `0.20` | $\max(0.0, 1.0 - \frac{\text{Distance}}{1500})$ | Account for transit time and procurement feasibility. | **Implemented** |
| **Cold Ischemia Viability** | `0.15` | $\min(1.0, \frac{\text{Remaining Window}}{\text{Estimated Transit} \times 2})$ | Ensure organ can arrive before preservation deadline. | **Implemented** |
| **Data Completeness** | `0.05` | Verified fields ratio ($\in [0.0, 1.0]$) | Promote reliable clinical and geographic telemetry. | **Implemented** |

### Configured Policy Thresholds
- **Maximum Logistical Distance**: `1500 km` (Candidates beyond this radius are excluded due to commercial/charter flight limitations).
- **Minimum Cold Ischemia Buffer**: `1.0 hour` (Organs with $< 1$ hour remaining cold ischemia buffer cannot be matched).
- **Minimum Candidate Qualification Score**: `0.10`

---

## 3. Rule Implementation Taxonomy

To ensure ethical boundaries and prevent unsupported medical claims, all matching rules are categorized as follows:

### Implemented Rules (Active in Code)
- Organ type exact equality (`KIDNEY` to `KIDNEY`).
- Active request state verification (`ACTIVE` / `MATCHING`).
- Recipient clinical verification filter (`VERIFIED`).
- ABO compatibility calculation (universal donor / exact match indicator).
- Cold ischemia preservation deadline enforcement.
- Logistical distance calculation (Haversine formula).
- Multi-factor weighted composite scoring.
- Deterministic ranking with registration-time tie-breaking.
- Deterministic structured explanations.

### Configured Rules (Policy Data-Driven)
- Factor weight distribution (0.35, 0.25, 0.20, 0.15, 0.05).
- Maximum distance threshold (1500 km).
- Minimum preservation buffer (1.0 hour).

### Future / Extension Points (Not Implemented in Step 4)
- **HLA Gene Locus Matching (A, B, C, DR, DQ)**: Marked as **Future** (requires standardized laboratory HLA tissue typing datasets).
- **Panel Reactive Antibody (PRA) / Crossmatch**: Marked as **Future** (requires virtual/flow crossmatch laboratory assays).
- **Pediatric Priority Multiplier**: Marked as **Future** (requires pediatric policy consensus).
- **Multi-Organ Combined Requisitions**: Marked as **Future** (e.g. simultaneous heart-kidney allocation).
