# VeinLink — Healthcare Data Retention & Deletion Policy

## 1. Data Lifecycle Categories

VeinLink establishes differentiated retention policies across functional data classifications:

| Category | Typical Entities | Retention Period | Deletion / Archival Mechanism |
| :--- | :--- | :--- | :--- |
| **Operational Transits** | `transports`, `routeTelemetry` | 90 days after delivery | Archived to cold storage; active operational index purged. |
| **CV / OCR Scans** | `verificationRequests` images | 30 days post-verification | Raw images destroyed; structured audit hash permanently retained. |
| **Temporary ML Artifacts** | `mlOutputs`, feature caches | 14 days | Expired by background cron action. |
| **Clinical Records** | `patients`, `organRecords`, `donations` | 10 years (regulatory compliance) | Encrypted archive; immutable audit log preserved. |
| **Audit Logs & Proofs** | `auditLogs`, `auditProofs`, `domainEvents` | Permanent (append-only) | Retained indefinitely; secured by cryptographic hash chains. |
| **Blockchain Proofs** | On-ledger Merkle root anchors | Permanent | Immutable ledger reference; zero PHI stored. |

---

## 2. Right to be Forgotten & Pseudonymization

When a donor exercises their right to deregistration:
1. **Direct PII Removal**: Name, phone number, email, and street address are permanently purged from `users` and `donors`.
2. **De-Identification**: Operational donation records are decoupled from the user identity and linked to a non-reversible cryptographic pseudonym.
3. **Audit Integrity Guarantee**: Historical audit logs and blockchain proofs remain intact, ensuring regulatory chain of custody without retaining personally identifiable healthcare information.
