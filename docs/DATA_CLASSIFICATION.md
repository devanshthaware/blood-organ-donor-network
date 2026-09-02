# VeinLink — Healthcare Data Classification & Data Inventory

## 1. Data Classification Tiers

VeinLink enforces a 5-tier classification framework across all clinical, logistical, and computational assets:

| Tier | Definition | Examples | Storage / Access Policy |
| :--- | :--- | :--- | :--- |
| **PUBLIC** | Freely accessible public reference data. | Verified hospital directory, educational resources. | CDN / Unauthenticated query allowed. |
| **INTERNAL** | Aggregated operational metrics without PII. | Overall inventory levels, average response times. | Authenticated staff & coordinators. |
| **CONFIDENTIAL** | Institutionally sensitive organizational data. | Hospital requisition queues, internal routing schedules. | Facility-scoped coordinator authorization. |
| **SENSITIVE** | Pseudonymized healthcare & donor telemetry. | Donor availability, blood group, coarse distance (km). | Role-gated, consent-verified, ML allowlist. |
| **HIGHLY_SENSITIVE** | Protected Health Information (PHI) & identity credentials. | Donor/patient names, contact info, clinical records, raw CV scans. | Strict owner self-access, coordinator review only, NEVER to ML/blockchain. |

---

## 2. Complete Entity Inventory

| Entity | Primary Purpose | Owner | Classification | Read Access | Write Access | ML Access | Blockchain Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `users` | Identity mapping & RBAC | User / Admin | HIGHLY_SENSITIVE | Self / Admin | Self / Admin | No | No |
| `donors` | Donor registration | Donor | SENSITIVE | Self / Coordinator | Self / Coordinator | Anonymized Features Only | No |
| `patients` | Recipient medical profile | Hospital | HIGHLY_SENSITIVE | Facility Coordinator | Facility Coordinator | Anonymized Parameters | No |
| `bloodInventory` | Blood unit stock | Hospital | CONFIDENTIAL | Network Coordinator | Facility Staff | Aggregated Stock | No |
| `donationRequests`| Emergency requisition | Hospital | CONFIDENTIAL | Network Coordinators | Facility Staff | Urgency / Blood Group | No |
| `organRecords` | Organ donor clinical viability | Hospital | HIGHLY_SENSITIVE | Assigned Transplant Team | Authorized Coordinator | Clinical Scores Only | SHA-256 Data Hash |
| `matches` | Algorithmic compatibility | System | SENSITIVE | Coordinators | System (Advisory) | Yes (Inference output) | Proof Hash |
| `allocations` | Human-approved assignment | Coordinator | HIGHLY_SENSITIVE | Assigned Facility | Authorized Coordinator | No | Proof Hash & Tx Receipt |
| `transports` | Transit telemetry | Logistics | CONFIDENTIAL | Transport Staff / Hospital | Transport Staff | ETA / Route Distance | Proof Hash |
| `consentRecords` | Purpose-based consent | Donor | SENSITIVE | Self / Admin | Self / Admin | Filter Criteria | Proof Hash |
| `auditLogs` | Append-only system logs | System | INTERNAL / SENSITIVE | Auditor / Admin | System (Append-only) | No | Canonical Chain Link |
| `securityEvents` | Access violation alarms | System | INTERNAL | Security Admin | System (Append-only) | No | Proof Hash |
| `verificationRequests`| CV/OCR physical audit | Hospital | HIGHLY_SENSITIVE | Reviewing Coordinator | System / Coordinator | Local OCR model only | Proof Hash |
