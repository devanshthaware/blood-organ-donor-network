# VeinLink — Domain State Machines & Lifecycle Specifications

All lifecycle state transitions in VeinLink are enforced server-side inside Convex mutations using the lookup validator `isValidTransition()`.

---

## 1. Organ Inventory Lifecycle

Tracks an individual recovered organ from initial identification through transplantation or expiration.

```mermaid
stateDiagram-v2
    [*] --> IDENTIFIED
    IDENTIFIED --> VERIFICATION_PENDING: Clinical review scheduled
    IDENTIFIED --> WITHDRAWN: Donor family withdrawal
    IDENTIFIED --> CANCELLED: Recovery cancelled

    VERIFICATION_PENDING --> VERIFIED: Clinical parameters confirmed
    VERIFICATION_PENDING --> REJECTED: Anatomical/clinical exclusion
    VERIFICATION_PENDING --> WITHDRAWN

    VERIFIED --> AVAILABLE: Added to active matching pool
    VERIFIED --> EXPIRED: Preservation deadline passed

    AVAILABLE --> MATCHING: Candidate matching started
    AVAILABLE --> EXPIRED: Preservation deadline passed
    AVAILABLE --> WITHDRAWN

    MATCHING --> ALLOCATED: Human coordinator approves allocation
    MATCHING --> AVAILABLE: No suitable recipient accepted
    MATCHING --> EXPIRED

    ALLOCATED --> IN_TRANSIT: Transport courier dispatched
    ALLOCATED --> CANCELLED: Recipient emergency contraindication
    ALLOCATED --> EXPIRED

    IN_TRANSIT --> RECEIVED: Arrived at transplant center
    IN_TRANSIT --> CANCELLED: Transport failure / delay

    RECEIVED --> TRANSPLANTED: Surgery completed
    RECEIVED --> REJECTED: Final bench inspection rejection
    RECEIVED --> EXPIRED

    TRANSPLANTED --> [*]
    EXPIRED --> [*]
    REJECTED --> [*]
    WITHDRAWN --> [*]
    CANCELLED --> [*]
```

---

## 2. Organ Request Lifecycle

Tracks a transplant candidate's active request across the matching and allocation pipeline.

```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> VERIFICATION_PENDING: Hospital review
    CREATED --> CANCELLED: Patient withdrawn

    VERIFICATION_PENDING --> ACTIVE: Criteria verified
    VERIFICATION_PENDING --> REJECTED: Ineligible
    VERIFICATION_PENDING --> CANCELLED

    ACTIVE --> MATCHING: Included in matching run
    ACTIVE --> CANCELLED
    ACTIVE --> EXPIRED

    MATCHING --> MATCH_FOUND: Candidate organ identified
    MATCHING --> ACTIVE: No current compatible organ
    MATCHING --> CANCELLED

    MATCH_FOUND --> ALLOCATION_PENDING: Coordinator reviewing match
    MATCH_FOUND --> ACTIVE: Candidate rejected by surgeon
    MATCH_FOUND --> CANCELLED

    ALLOCATION_PENDING --> ALLOCATED: Coordinator approves allocation
    ALLOCATION_PENDING --> MATCH_FOUND: Re-evaluating candidate
    ALLOCATION_PENDING --> CANCELLED

    ALLOCATED --> COMPLETED: Transplant completed
    ALLOCATED --> CANCELLED: Transplant aborted

    COMPLETED --> [*]
    CANCELLED --> [*]
    EXPIRED --> [*]
    REJECTED --> [*]
```

---

## 3. Organ Donor Lifecycle

Tracks an individual organ donor through registration, clinical verification, and active registry status.

```mermaid
stateDiagram-v2
    [*] --> REGISTERED: User signs organ donor pledge
    REGISTERED --> PENDING_VERIFICATION: Consent submitted
    REGISTERED --> INACTIVE: Account deactivated

    PENDING_VERIFICATION --> VERIFIED: Medical & legal review passed
    PENDING_VERIFICATION --> INACTIVE: Verification withdrawn

    VERIFIED --> ACTIVE: Eligible in active donor registry
    VERIFIED --> INACTIVE: Temporary unavailability
    VERIFIED --> SUSPENDED: Administrative review

    ACTIVE --> INACTIVE: User paused donation status
    ACTIVE --> SUSPENDED: Clinical disqualification

    INACTIVE --> ACTIVE: Re-activated
    SUSPENDED --> ACTIVE: Suspension lifted
```

---

## 4. Recipient Lifecycle

Tracks an organ recipient candidate on the active waiting list.

```mermaid
stateDiagram-v2
    [*] --> REGISTERED: Patient onboarding
    REGISTERED --> PENDING_VERIFICATION: Medical records submitted
    
    PENDING_VERIFICATION --> ACTIVE: Approved on waitlist
    
    ACTIVE --> MATCHED: Candidate recommendation identified
    ACTIVE --> INACTIVE: Medical hold (e.g. infection)
    ACTIVE --> WITHDRAWN: Patient opt-out
    ACTIVE --> SUSPENDED: Regulatory review
    
    MATCHED --> ALLOCATED: Allocation approved by coordinator
    MATCHED --> ACTIVE: Match rejected / expired
    
    ALLOCATED --> COMPLETED: Transplant surgery successful
    ALLOCATED --> ACTIVE: Allocation aborted before surgery
    
    COMPLETED --> [*]
    WITHDRAWN --> [*]
    INACTIVE --> ACTIVE: Medical hold resolved
    SUSPENDED --> ACTIVE: Cleared for waitlist
```

---

## 5. Allocation Governance Lifecycle (Human Decision Boundary)

Illustrates the mandatory human coordinator checkpoint between algorithmic candidate matching and legal organ allocation.

```mermaid
stateDiagram-v2
    [*] --> PENDING_HUMAN_APPROVAL: Coordinator selects candidate match
    
    PENDING_HUMAN_APPROVAL --> APPROVED: Authorized coordinator enters clinical justification
    PENDING_HUMAN_APPROVAL --> REJECTED: Coordinator enters rejection reason
    PENDING_HUMAN_APPROVAL --> CANCELLED: Allocation review aborted
    
    APPROVED --> EXECUTED: Organ accepted and surgery scheduled
    APPROVED --> CANCELLED: Intraoperative contraindication
    
    EXECUTED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]
```
