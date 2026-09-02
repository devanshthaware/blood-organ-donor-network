# VeinLink — Multi-Objective Allocation Engine Architecture

## 1. System Vision & Tripartite Governance

VeinLink establishes a tripartite lifecycle for organ allocation to eliminate the risk of autonomous allocation while ensuring transparent decision-support:

```text
MATCH (organMatches)
  └── Advisory recommendation: Candidate appears potentially suitable (status: PROPOSED).
        ↓
ALLOCATION RECOMMENDATION (allocationRecommendations)
  └── Multi-objective optimization: Ranks eligible candidates against configured policy (status: PENDING_REVIEW).
        ↓
AUTHORIZED ALLOCATION (organAllocations)
  └── Formal, legally binding clinical assignment authorized by human coordinator (status: APPROVED).
```

---

## 2. The Allocation Pipeline

```mermaid
flowchart TD
    A[Available Organ in Inventory] --> B[Retrieve Candidate Matches]
    B --> C[Eligibility Gate & Revalidation]
    C -->|Failed| D[Candidate Excluded: Recorded Exclusion Reason]
    C -->|Passed| E[Multi-Objective Evaluation]
    E --> F[Objective Normalization & Pareto Check]
    F --> G[Deterministic Tie-Break Ranking]
    G --> H[Generate Allocation Recommendations (Top 3)]
    H --> I[Persist in allocationRecommendations as PENDING_REVIEW]
    I --> J[Human Coordinator Review Dashboard]
    J -->|Coordinator Selects Rank #1| K[Approve Recommendation]
    J -->|Coordinator Selects Rank #2 or #3| L[Human Override Approval + Mandatory Justification]
    J -->|Coordinator Rejects Candidate| M[Structured Rejection Reason]
    K --> N[Atomic Revalidation Guard & ACID Commit]
    L --> N
    N --> O[Create organAllocations Record]
    O --> P[Update Organ/Request/Recipient to ALLOCATED]
    P --> Q[Append-Only Forensic Audit Log]
```

---

## 3. Allocation Objectives vs Hard Constraints

### Eligibility Gate (Hard Constraints)
Before multi-objective scoring, every candidate is evaluated against strict integrity checks:
1. `ORGAN_AVAILABLE`: Organ status is `AVAILABLE` or `MATCHING` (prevents double allocation).
2. `REQUEST_ACTIVE`: Request status is `ACTIVE` or `MATCHING`.
3. `RECIPIENT_ACTIVE`: Recipient status is `ACTIVE` on waitlist.
4. `RECIPIENT_VERIFIED`: Verification status is `VERIFIED`.
5. `ORGAN_TYPE_MATCH`: Requisition organ type strictly matches organ.
6. `PRESERVATION_BUFFER_VIABLE`: Remaining cold ischemia time exceeds minimum buffer (`1.0h`).
7. `DISTANCE_THRESHOLD`: Transit distance does not exceed policy cutoff (`1500 km`).

### Multi-Objective Optimization Dimensions
Candidates passing the gate are evaluated across 5 normalized objectives ($\in [0.0, 1.0]$):
- **Clinical Urgency ($w = 0.35$)**: Prioritizes emergency patients (`CRITICAL: 1.0`, `HIGH: 0.75`, `MEDIUM: 0.50`, `LOW: 0.25`).
- **Waitlist Equity ($w = 0.25$)**: Normalized against 180-day benchmark to reward continuous active registration.
- **Logistics Efficiency ($w = 0.20$)**: Linear decay penalizing excessive transit distances.
- **Cold Ischemia Viability ($w = 0.15$)**: Ratio of remaining buffer to estimated procurement and transit time.
- **Data Completeness & Fidelity ($w = 0.05$)**: Ratio of verified clinical and geographic telemetry fields.

---

## 4. Human Approval, Override & Concurrency Protection

### Mandatory Human Approval
The system **never** transitions an organ to `ALLOCATED` autonomously. Approval requires an authenticated clinical coordinator with an authorized role (`hospital` or `admin`).

### First-Class Human Override
If the human coordinator selects an alternative candidate (e.g. Rank #2 instead of Rank #1), the system:
1. Flags the decision as `isOverride: true`.
2. Enforces a mandatory clinical justification string (`overrideReason`).
3. Records the delta between algorithm recommendation and human decision in `auditLogs`.

### Atomic Revalidation Guard (Anti-Stale & Conflict Protection)
Before any allocation is approved:
- Revalidates that the organ has not been allocated by another concurrent reviewer.
- Revalidates that the cold ischemia clock has not expired.
- Revalidates that the request and recipient remain in active status.
- Executes status updates to organ, request, recipient, and allocation records within a **single ACID transaction**.
